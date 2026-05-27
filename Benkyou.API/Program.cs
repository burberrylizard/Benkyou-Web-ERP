using Benkyou.Core.Services;
using Benkyou.Data;
using Benkyou.Data.Models;
using CloudinaryDotNet;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json.Serialization;
using Benkyou.API.Hubs;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);
const string FrontendCorsPolicy = "FrontendCorsPolicy";

// DATABASE
builder.Services.AddDbContext<BenkyouDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions => sqlOptions.EnableRetryOnFailure()
    ));

// IDENTITY
builder.Services.AddIdentity<User, IdentityRole<Guid>>(options =>
{
    options.Password.RequiredLength = 14;
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;

    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = false;
})
.AddEntityFrameworkStores<BenkyouDbContext>()
.AddDefaultTokenProviders();

// CONTROLLERS + JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// SERVICES
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<StripeService>();
builder.Services.AddHttpClient<IEmailSender, EmailService>();
builder.Services.AddSignalR();

// CLOUDINARY
var cloudinaryAccount = new Account(
    builder.Configuration["Cloudinary:CloudName"],
    builder.Configuration["Cloudinary:ApiKey"],
    builder.Configuration["Cloudinary:ApiSecret"]
);
builder.Services.AddSingleton(new Cloudinary(cloudinaryAccount));
builder.Services.AddSingleton<CloudinaryService>();

// RESEND SDK (Official NuGet)
builder.Services.AddOptions();
builder.Services.AddHttpClient<Resend.ResendClient>();
builder.Services.Configure<Resend.ResendClientOptions>(o =>
{
    o.ApiToken = builder.Configuration["Resend:ApiToken"] ?? "";
});
builder.Services.AddTransient<Resend.IResend, Resend.ResendClient>();

// SUPERADMIN OTP SERVICE (Resend-based email OTP)
builder.Services.AddScoped<SuperAdminOtpService>();

// ANALYTICS — Google Analytics 4 (Measurement Protocol)
builder.Services.AddHttpClient<GoogleAnalyticsService>();

// ANALYTICS — Mixpanel (HTTP Ingestion API)
builder.Services.AddHttpClient<MixpanelService>();

// NOTIFICATIONS — OneSignal (Official SDK)
builder.Services.AddSingleton<NotificationService>();

// AUDIT LOGS
builder.Services.AddScoped<AuditLogService>();

// ASSESSMENT BUILDER
builder.Services.AddScoped<AssessmentBuilderService>();

// ACCOUNT LOCKOUT
builder.Services.AddScoped<AccountLockoutService>();

// CORS
var hardcodedOrigins = new[]
{
    "https://benkyoulearn.runasp.net",
    "https://benkyou.runasp.net",
    "http://localhost:5173",
    "http://localhost:3000"
};

var configOrigins = builder.Configuration
    .GetSection("Frontend:AllowedOrigins")
    .Get<string[]>() ?? [];

var allowedOrigins = hardcodedOrigins
    .Concat(configOrigins)
    .Select(origin => origin.Trim().TrimEnd('/'))
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

Console.WriteLine($"CORS: Allowed Origins ({allowedOrigins.Length}): {string.Join(", ", allowedOrigins)}");

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy,
        policy => policy
            .SetIsOriginAllowed(origin => true)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

// RATE LIMITER
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    string GetClientIp(HttpContext context)
    {
        // 1. Try CF IP (Cloudflare)
        string? ip = context.Request.Headers["CF-Connecting-IP"].FirstOrDefault();
        if (string.IsNullOrEmpty(ip))
        {
            // 2. Try Standard Forwarded For
            ip = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        }
        if (string.IsNullOrEmpty(ip))
        {
            // 3. Try Standard Real IP
            ip = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        }
        if (string.IsNullOrEmpty(ip))
        {
            // 4. Fallback to Connection Remote IP
            ip = context.Connection.RemoteIpAddress?.ToString();
        }

        if (!string.IsNullOrEmpty(ip))
        {
            var commaIndex = ip.IndexOf(',');
            if (commaIndex != -1)
            {
                ip = ip.Substring(0, commaIndex).Trim();
            }
        }

        return string.IsNullOrEmpty(ip) ? Guid.NewGuid().ToString() : ip;
    }

    options.OnRejected = async (context, token) =>
    {
        var origin = context.HttpContext.Request.Headers.Origin.ToString();
        if (!string.IsNullOrEmpty(origin) && allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
        {
            context.HttpContext.Response.Headers.AccessControlAllowOrigin = origin;
            context.HttpContext.Response.Headers.AccessControlAllowCredentials = "true";
        }

        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/json";

        string message = "Too many requests. Please try again later.";
        var path = context.HttpContext.Request.Path.Value ?? "";
        if (path.Contains("/api/auth/login"))
        {
            message = "Too many login attempts. Please try again in 15 minutes.";
        }
        else if (path.Contains("/api/auth/verify-otp"))
        {
            message = "Too many verification attempts. Please try again in 10 minutes.";
        }
        else if (path.Contains("/api/auth/register-org"))
        {
            message = "Too many registration attempts. Please try again later.";
        }

        await context.HttpContext.Response.WriteAsJsonAsync(new { message }, token);
    };

    options.AddPolicy("login", context =>
    {
        // Use email from request body as partition key to avoid shared-IP blocking
        string partitionKey = "unknown";
        try
        {
            context.Request.EnableBuffering();
            using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
            var body = reader.ReadToEndAsync().GetAwaiter().GetResult();
            context.Request.Body.Position = 0;
            var json = System.Text.Json.JsonDocument.Parse(body);
            if (json.RootElement.TryGetProperty("identifier", out var emailProp))
                partitionKey = emailProp.GetString()?.ToLowerInvariant() ?? GetClientIp(context);
            else
                partitionKey = GetClientIp(context);
        }
        catch { partitionKey = GetClientIp(context); }

        if (partitionKey == "127.0.0.1" || partitionKey == "::1" || partitionKey == "localhost")
        {
            return RateLimitPartition.GetNoLimiter<string>("localhost");
        }

        return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(15),
            QueueLimit = 0
        });
    });

    options.AddPolicy("verify-otp", context =>
    {
        // Use tempToken from request body as partition key
        string partitionKey = "unknown";
        try
        {
            context.Request.EnableBuffering();
            using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
            var body = reader.ReadToEndAsync().GetAwaiter().GetResult();
            context.Request.Body.Position = 0;
            var json = System.Text.Json.JsonDocument.Parse(body);
            if (json.RootElement.TryGetProperty("tempToken", out var tokenProp))
                partitionKey = tokenProp.GetString() ?? GetClientIp(context);
            else
                partitionKey = GetClientIp(context);
        }
        catch { partitionKey = GetClientIp(context); }

        if (partitionKey == "127.0.0.1" || partitionKey == "::1" || partitionKey == "localhost")
        {
            return RateLimitPartition.GetNoLimiter<string>("localhost");
        }

        return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(10),
            QueueLimit = 0
        });
    });

    options.AddPolicy("register", context =>
    {
        var clientIp = GetClientIp(context);

        if (clientIp == "127.0.0.1" || clientIp == "::1" || clientIp == "localhost")
        {
            return RateLimitPartition.GetNoLimiter<string>("localhost");
        }

        return RateLimitPartition.GetFixedWindowLimiter(clientIp, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 3,
            Window = TimeSpan.FromMinutes(30),
            QueueLimit = 0
        });
    });
});

// AUTHENTICATION
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var key = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!);

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };

    // SIGNALR TOKEN FROM QUERY
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hub"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// SWAGGER
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.UseAllOfToExtendReferenceSchemas();

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            []
        }
    });
});

// FORWARDED HEADERS CONFIGURATION FOR REVERSE PROXY / CDN DEPLOYMENTS
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownProxies.Clear();
    options.KnownNetworks.Clear();
});

// LOGGING
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var app = builder.Build();

// Enable Forwarded Headers first in the pipeline for correct IP and protocol detection under reverse proxies/CDNs
app.UseForwardedHeaders();


// SEED DATA
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<BenkyouDbContext>();

        logger.LogInformation("STARTUP: Applying migrations...");
        db.Database.Migrate();
        logger.LogInformation("STARTUP: Migrations applied successfully.");


        if (!db.SuperAdmins.Any())
        {
            logger.LogInformation("STARTUP: Seeding SuperAdmin...");
            db.SuperAdmins.Add(new SuperAdmin
            {
                Email = "admin@system.com",
                FirstName = "System",
                LastName = "Administrator",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("SuperAdmin@2026!"),
                IsActive = true
            });

            db.SaveChanges();
            logger.LogInformation("STARTUP: SuperAdmin seeded.");
        }

        if (!db.SuperAdmins.Any(x => x.Email == "charlizejanem@gmail.com"))
        {
            logger.LogInformation("STARTUP: Seeding Charlize Jane Inday SuperAdmin...");
            db.SuperAdmins.Add(new SuperAdmin
            {
                Email = "charlizejanem@gmail.com",
                FirstName = "Charlize Jane",
                LastName = "Inday",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("GojoSatoru@092423"),
                IsActive = true
            });

            db.SaveChanges();
            logger.LogInformation("STARTUP: Charlize Jane Inday SuperAdmin seeded.");
        }

        if (!db.SubscriptionPlans.Any())
        {
            logger.LogInformation("STARTUP: Seeding SubscriptionPlans...");
            db.SubscriptionPlans.AddRange(
                new SubscriptionPlan
                {
                    PlanCode = "FREE",
                    Name = "Free",
                    MaxUsers = 10,
                    MaxCourses = 5,
                    MaxStorageGB = 1,
                    PriceMonthly = 0,
                    PriceYearly = 0,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new SubscriptionPlan
                {
                    PlanCode = "PRO",
                    Name = "Pro",
                    MaxUsers = 100,
                    MaxCourses = 50,
                    MaxStorageGB = 10,
                    PriceMonthly = 499,
                    PriceYearly = 4999,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                }
            );

            db.SaveChanges();
            logger.LogInformation("STARTUP: SubscriptionPlans seeded.");
        }

        if (!db.SubscriptionPlans.Any(p => p.PlanCode == "ENTERPRISE"))
        {
            logger.LogInformation("STARTUP: Seeding Enterprise SubscriptionPlan...");
            db.SubscriptionPlans.Add(new SubscriptionPlan
            {
                PlanCode = "ENTERPRISE",
                Name = "Enterprise",
                MaxUsers = 1000,
                MaxCourses = 500,
                MaxStorageGB = 100,
                PriceMonthly = 1999,
                PriceYearly = 19999,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
            db.SaveChanges();
            logger.LogInformation("STARTUP: Enterprise SubscriptionPlan seeded.");
        }

    }
    catch (Exception ex)
    {
        logger.LogCritical(ex, "STARTUP ERROR: Failed during database initialization phase.");
        // We don't rethrow here to allow the app to potentially start and show an error page/health check failure
        // instead of timing out the entire process.
    }
}


// MIDDLEWARE
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseRouting();

// CORS must be evaluated before RateLimiter so that 429 rate-limited responses still receive CORS headers
app.UseCors(FrontendCorsPolicy);

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();


app.Run();
