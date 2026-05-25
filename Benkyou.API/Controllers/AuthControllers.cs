using Benkyou.Core.DTOs;
using Benkyou.Core.Services;
using Benkyou.Data;
using Benkyou.Data.Enums;
using Benkyou.Data.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.RateLimiting;

namespace Benkyou.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    BenkyouDbContext db,
    UserManager<User> userManager,
    SignInManager<User> signInManager,
    JwtService jwt,
    IEmailSender email,
    StripeService stripe,
    SuperAdminOtpService otpService,
    IConfiguration config,
    AccountLockoutService lockoutService,
    ILogger<AuthController> logger) : BaseController
{
    private readonly BenkyouDbContext _db = db;
    private readonly UserManager<User> _userManager = userManager;
    private readonly SignInManager<User> _signInManager = signInManager;
    private readonly JwtService _jwt = jwt;
    private readonly IEmailSender _email = email;
    private readonly StripeService _stripe = stripe;
    private readonly SuperAdminOtpService _otpService = otpService;
    private readonly IConfiguration _config = config;
    private readonly AccountLockoutService _lockoutService = lockoutService;
    private readonly ILogger<AuthController> _logger = logger;

    // ─── REGISTER ORG + ADMIN ───────────────────────────────────────
    [HttpPost("register-org")]
    [EnableRateLimiting("register")]
    public async Task<IActionResult> RegisterOrg([FromBody] RegisterOrgDto dto)
    {
        var strategy = _db.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                var tenantId = Guid.NewGuid();
                var baseCode = !string.IsNullOrWhiteSpace(dto.ShortCode)
                    ? dto.ShortCode.ToLower().Replace(" ", "-").Trim()
                    : dto.OrganizationName.ToLower().Replace(" ", "-").Trim();

                // ─── STRICT UNIQUENESS VALIDATIONS ──────────────────────────
                var validationErrors = new List<string>();

                // 1. Check if Organization Name is unique
                var nameExists = await _db.Organizations.AnyAsync(o => o.Name.ToLower() == dto.OrganizationName.ToLower().Trim());
                if (nameExists)
                {
                    validationErrors.Add($"The organization name '{dto.OrganizationName}' is already registered. Please choose a unique name.");
                }

                // 2. Check if TenantCode / ShortCode is unique
                var codeExists = await _db.Organizations.AnyAsync(o => o.TenantCode == baseCode);
                if (codeExists)
                {
                    validationErrors.Add($"The short code or URL slug '{baseCode}' is already taken. Please choose a different short code.");
                }

                // 3. Check if Email is already used by an organization or user
                var emailExistsInOrg = await _db.Organizations.AnyAsync(o => o.PrimaryEmail.ToLower() == dto.Email.ToLower().Trim());
                var emailExistsInUser = await _userManager.FindByEmailAsync(dto.Email);
                if (emailExistsInOrg || emailExistsInUser != null)
                {
                    validationErrors.Add($"The email address '{dto.Email}' is already registered under another account.");
                }

                if (validationErrors.Any())
                {
                    return BadRequest(new { errors = validationErrors });
                }

                var tenantCode = baseCode;

                var org = new Organization
                {
                    TenantID = tenantId,
                    Name = dto.OrganizationName.Trim(),
                    TenantCode = tenantCode,
                    PrimaryEmail = dto.Email.Trim(),
                    OrganizationType = string.IsNullOrWhiteSpace(dto.OrganizationType) ? "HigherEducation" : dto.OrganizationType.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var user = new User
                {
                    Id = Guid.NewGuid(),
                    TenantID = tenantId,
                    Email = dto.Email,
                    UserName = dto.Email,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    Role = UserRole.Admin,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true,
                    EmailConfirmed = true,
                    TermsAccepted = true,
                    TermsVersion = "1.0",
                    TermsAcceptedAt = DateTime.UtcNow,
                    TermsAcceptedIp = HttpContext.Connection.RemoteIpAddress?.ToString()
                };

                var result = await _userManager.CreateAsync(user, dto.Password);
                if (!result.Succeeded)
                {
                    return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
                }

                // Create Stripe Customer and Checkout Session
                string stripeCustomerId = "";
                string checkoutUrl = "";
                try
                {
                    var stripeCustomer = await _stripe.CreateCustomerAsync(tenantId, dto.Email, dto.OrganizationName);
                    stripeCustomerId = stripeCustomer.Id;

                    var successUrl = _config["Stripe:SuccessUrl"] ?? "";
                    var cancelUrl = _config["Stripe:CancelUrl"] ?? "";

                    checkoutUrl = await _stripe.CreateCheckoutSessionAsync(stripeCustomerId, "Basic", successUrl, cancelUrl);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to create Stripe customer/session during registration for {Email}", dto.Email);
                }

                org.StripeCustomerId = stripeCustomerId;
                org.SubscriptionStatus = "incomplete";

                var subscription = new Subscription
                {
                    TenantID = tenantId,
                    PlanID = 1,
                    Status = "Incomplete",
                    StripeCustomerId = stripeCustomerId,
                    CreatedAt = DateTime.UtcNow
                };

                _db.Organizations.Add(org);
                _db.Subscriptions.Add(subscription);

                _db.TermsAcceptances.Add(new TermsAcceptance
                {
                    UserID = user.Id,
                    TermsVersion = "1.0",
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown",
                    UserAgent = Request.Headers.UserAgent.ToString()
                });

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                await LogAction(_db, "Registered Organization & Admin", "Organization", tenantId.ToString(), user.Id, tenantId);

                return Ok(new
                {
                    message = "Registration successful. Please complete payment.",
                    userId = user.Id,
                    email = user.Email,
                    tenantCode,
                    checkoutUrl
                });
            }
            catch (Exception ex)
            {
                if (transaction != null) await transaction.RollbackAsync();
                _logger.LogError(ex, "Error during organization registration");
                return StatusCode(500, new { message = "An error occurred during registration", detail = ex.Message });
            }
        });
    }

    [HttpPost("verify-registration-otp")]
    public async Task<IActionResult> VerifyRegistrationOtp([FromBody] VerifyRegistrationOtpRequest req)
    {
        var user = await _userManager.FindByIdAsync(req.UserId.ToString());
        if (user == null) return NotFound(new { message = "User not found" });

        if (user.EmailConfirmed)
            return BadRequest(new { message = "Email is already verified. Please log in." });

        var verification = await _db.Set<EmailVerificationCode>()
            .Where(x => x.UserId == req.UserId && !x.IsUsed)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();

        if (verification == null || verification.Code != req.Code)
            return BadRequest(new { message = "Invalid verification code." });

        if (DateTime.UtcNow > verification.Expiry)
            return BadRequest(new { message = "Verification code has expired. Please request a new one." });

        verification.IsUsed = true;
        user.EmailConfirmed = true;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Email verified successfully! You can now log in." });
    }
    public async Task<IActionResult> VerifyEmail(Guid userId, string token)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return NotFound(new { message = "User not found" });

        var result = await _userManager.ConfirmEmailAsync(user, token);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = "Email verification failed", errors = result.Errors });
        }

        return Ok(new { message = "Email verified successfully. Please log in." });
    }

    // ─── SUPERADMIN LOGIN (Email OTP via Resend) ─────────────────────
    [HttpPost("superadmin/login")]
    public async Task<IActionResult> SuperAdminLogin(LoginDto dto)
    {
        var admin = await _db.SuperAdmins
            .FirstOrDefaultAsync(x => x.Email == dto.Identifier && x.IsActive);

        if (admin == null || !BCrypt.Net.BCrypt.Verify(dto.Password, admin.PasswordHash))
            return Unauthorized(new { message = "Invalid credentials" });

        // Send OTP via Resend
        var otpSent = await _otpService.SendOtpAsync(admin.Id);
        if (!otpSent)
            return StatusCode(500, new { message = "Failed to send verification code. Please try again." });

        // Issue a short-lived temp token for the OTP verification step
        var tempToken = _jwt.GenerateTempToken(admin.Id.ToString(), expiryMinutes: 5);

        return Ok(new
        {
            requiresMfa = true,
            tempToken,
            message = "A 6-digit verification code has been sent to your email."
        });
    }

    // ─── SUPERADMIN 2FA VERIFY ──────────────────────────────────────
    [HttpPost("superadmin/verify-otp")]
    public async Task<IActionResult> SuperAdminVerifyOtp([FromBody] VerifyOtpRequest req)
    {
        var principal = _jwt.ValidateTempToken(req.TempToken);
        if (principal == null)
            return Unauthorized(new { message = "Invalid or expired session" });

        var uid = principal.FindFirst("uid")?.Value;
        if (uid == null)
            return Unauthorized(new { message = "Invalid session" });

        var adminId = Guid.Parse(uid);

        // Validate OTP using SuperAdminOtpService
        var (isValid, error) = await _otpService.ValidateOtpAsync(adminId, req.Code);
        if (!isValid)
            return BadRequest(new { message = error });

        var admin = await _db.SuperAdmins.FindAsync(adminId);
        if (admin == null)
            return Unauthorized(new { message = "Account not found" });

        // Issue full token
        var claims = new List<Claim>
        {
            new("uid", admin.Id.ToString()),
            new(ClaimTypes.NameIdentifier, admin.Id.ToString()), // SignalR user identifier support
            new(ClaimTypes.Role, "SuperAdmin"),
            new("role", "SuperAdmin"),
            new("isSuperAdmin", "true"),
            new("email", admin.Email),
            new("name", $"{admin.FirstName} {admin.LastName}"),
        };

        var token = _jwt.GenerateTokenFromClaims(claims);

        await LogAction(_db, "SuperAdmin Login (OTP Verified)", "SuperAdmin", admin.Id.ToString(), admin.Id);

        return Ok(new
        {
            token,
            role = "SuperAdmin"
        });
    }

    // ─── LOGIN ──────────────────────────────────────────────────────
    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Identifier);
        if (user == null)
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        if (!string.IsNullOrWhiteSpace(dto.TenantCode))
        {
            var targetOrg = await _db.Organizations.FirstOrDefaultAsync(o => o.TenantCode == dto.TenantCode);
            if (targetOrg == null)
            {
                return BadRequest(new { message = "Selected institution is invalid." });
            }
            if (user.TenantID != targetOrg.TenantID)
            {
                return Unauthorized(new { message = "You do not have access to this institution. Please check your institution code and try again." });
            }
        }

        if (!user.IsActive)
        {
            return Unauthorized(new { message = "Account is deactivated" });
        }

        if (await _lockoutService.IsLockedOutAsync(user.Id))
        {
            var remainingMinutes = await _lockoutService.GetLockoutTimeRemainingAsync(user.Id);
            if (remainingMinutes > 1440)
            {
                await LogAction(_db, "Suspicious Activity: Login attempted on admin-locked account", "User", user.Id.ToString(), user.Id, user.TenantID);
                return StatusCode(403, new { message = "Account is locked by administrator." });
            }
            await LogAction(_db, $"Suspicious Activity: Login attempted on locked account (Remaining: {remainingMinutes}m)", "User", user.Id.ToString(), user.Id, user.TenantID);
            return StatusCode(403, new { message = $"Account is locked due to too many failed attempts. Try again in {remainingMinutes} minutes." });
        }

        var isPasswordCorrect = await _userManager.CheckPasswordAsync(user, dto.Password);
        if (!isPasswordCorrect)
        {
            await _lockoutService.RecordFailedAttemptAsync(user.Id);

            var updatedUser = await _db.Users.FindAsync(user.Id);
            var attemptsRemaining = 5 - (updatedUser?.FailedLoginAttempts ?? 0);

            if (attemptsRemaining <= 0)
            {
                await LogAction(_db, "Suspicious Activity: Account Locked Out due to too many failed attempts", "User", user.Id.ToString(), user.Id, user.TenantID);
                var remainingMinutes = await _lockoutService.GetLockoutTimeRemainingAsync(user.Id);
                if (remainingMinutes > 1440)
                {
                    return StatusCode(403, new { message = "Account is locked by administrator." });
                }
                return StatusCode(403, new { message = $"Account is locked due to too many failed attempts. Try again in {remainingMinutes} minutes." });
            }

            return Unauthorized(new { message = "Invalid email or password.", attemptsRemaining });
        }

        await _lockoutService.ResetFailedAttemptsAsync(user.Id);

        /*
        if (!user.EmailConfirmed)
            return BadRequest(new { message = "Please verify your email before logging in." });
        */

        var org = await _db.Organizations.FirstOrDefaultAsync(o => o.TenantID == user.TenantID);

        // MFA CHECK (DISABLED FOR DEVELOPMENT)
        /*
        bool mfaRequired = user.TwoFactorEnabled || (org?.IsMfaRequired ?? false);
        
        if (mfaRequired)
        {
            var code = await _userManager.GenerateTwoFactorTokenAsync(user, "Email");
            await _email.SendMfaCodeAsync(user.Email!, user.FirstName, code);

            var tempToken = _jwt.GenerateTempToken(user.Id.ToString(), user.TenantID.ToString());

            return Ok(new
            {
                requiresMfa = true,
                tempToken,
                message = "Verification code sent to your email"
            });
        }
        */

        var token = _jwt.GenerateToken(user, org?.TenantCode);

        await LogAction(_db, "User Login", "User", user.Id.ToString(), user.Id, user.TenantID);

        return Ok(new
        {
            token,
            role = user.Role.ToString(),
            tenantCode = org?.TenantCode,
            userId = user.Id,
            tenantId = user.TenantID
        });
    }

    // ─── USER MFA VERIFY ────────────────────────────────────────────
    [HttpPost("verify-otp")]
    [EnableRateLimiting("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest req)
    {
        var principal = _jwt.ValidateTempToken(req.TempToken);
        if (principal == null)
            return Unauthorized(new { message = "Invalid or expired session" });

        var uid = principal.FindFirst("uid")?.Value;
        if (uid == null)
            return Unauthorized(new { message = "Invalid session" });

        var user = await _userManager.FindByIdAsync(uid);
        if (user == null)
            return Unauthorized(new { message = "Account not found" });

        var result = await _userManager.VerifyTwoFactorTokenAsync(user, "Email", req.Code);
        if (!result)
        {
            return BadRequest(new { message = "Invalid verification code" });
        }

        // Get tenant code
        var org = await _db.Organizations.FirstOrDefaultAsync(o => o.TenantID == user.TenantID);
        var token = _jwt.GenerateToken(user, org?.TenantCode);

        await LogAction(_db, "User Login", "User", user.Id.ToString(), user.Id, user.TenantID);

        return Ok(new
        {
            token,
            role = user.Role.ToString(),
            userId = user.Id,
            tenantId = user.TenantID
        });
    }

    // ─── ENABLE 2FA (Optional) ──────────────────────────────────────
    [HttpPost("2fa/enable")]
    [Authorize]
    public async Task<IActionResult> Enable2FA()
    {
        var uid = User.FindFirst("uid")?.Value;
        if (uid == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(uid);
        if (user == null) return NotFound();

        if (user.TwoFactorEnabled)
            return Ok(new { message = "2FA is already enabled" });

        var code = await _userManager.GenerateTwoFactorTokenAsync(user, "Email");
        await _email.SendMfaCodeAsync(user.Email!, user.FirstName, code);

        return Ok(new { message = "Verification code sent to your email to confirm 2FA setup." });
    }

    // ─── CONFIRM ENABLE 2FA ──────────────────────────────────────────
    [HttpPost("2fa/confirm-enable")]
    [Authorize]
    public async Task<IActionResult> ConfirmEnable2FA([FromBody] OtpCodeRequest req)
    {
        var uid = User.FindFirst("uid")?.Value;
        if (uid == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(uid);
        if (user == null) return NotFound();

        var result = await _userManager.VerifyTwoFactorTokenAsync(user, "Email", req.Code);
        if (!result)
        {
            return BadRequest(new { message = "Invalid code" });
        }

        await _userManager.SetTwoFactorEnabledAsync(user, true);
        return Ok(new { message = "Two-factor authentication enabled" });
    }

    // ─── DISABLE 2FA ────────────────────────────────────────────────
    [HttpPost("2fa/disable")]
    [Authorize]
    public async Task<IActionResult> Disable2FA()
    {
        var uid = User.FindFirst("uid")?.Value;
        if (uid == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(uid);
        if (user == null) return NotFound();

        if (user.Role == UserRole.Admin)
            return BadRequest(new { message = "2FA is mandatory for Administrators and cannot be disabled." });

        await _userManager.SetTwoFactorEnabledAsync(user, false);
        return Ok(new { message = "Two-factor authentication disabled" });
    }

    // ─── RESEND OTP ─────────────────────────────────────────────────
    /*
    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp([FromBody] ResendOtpRequest req)
    {
        var principal = _jwt.ValidateTempToken(req.TempToken);
        if (principal == null)
            return Unauthorized(new { message = "Invalid or expired session" });

        var uid = principal.FindFirst("uid")?.Value;
        if (uid == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(uid);
        if (user == null) return NotFound();

        var code = await _userManager.GenerateTwoFactorTokenAsync(user, "Email");
        await _email.SendMfaCodeAsync(user.Email!, user.FirstName, code);

        return Ok(new { message = "New verification code sent" });
    }
    */

    // ─── FORGOT PASSWORD ─────────────────────────────────────────────
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null)
        {
            // Don't reveal if user exists — always return OK
            return Ok(new { message = "If an account with that email exists, a reset code has been sent." });
        }

        var code = OtpService.GenerateCode();
        var verification = new EmailVerificationCode
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Code = code,
            Expiry = DateTime.UtcNow.AddMinutes(10)
        };

        _db.Set<EmailVerificationCode>().Add(verification);
        await _db.SaveChangesAsync();

        try
        {
            await _email.SendMfaCodeAsync(user.Email!, user.FirstName, code);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset code to {Email}", req.Email);
        }

        return Ok(new { message = "If an account with that email exists, a reset code has been sent." });
    }

    // ─── RESET PASSWORD ─────────────────────────────────────────────
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null)
            return BadRequest(new { message = "Invalid request." });

        var verification = await _db.Set<EmailVerificationCode>()
            .Where(x => x.UserId == user.Id && !x.IsUsed)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();

        if (verification == null || verification.Code != req.Code)
            return BadRequest(new { message = "Invalid or expired reset code." });

        if (DateTime.UtcNow > verification.Expiry)
            return BadRequest(new { message = "Reset code has expired. Please request a new one." });

        verification.IsUsed = true;

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, req.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        await _db.SaveChangesAsync();

        return Ok(new { message = "Password has been reset successfully. You can now log in." });
    }

    // ─── CURRENT USER ───────────────────────────────────────────────
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirst("uid")?.Value;
        var tenantId = User.FindFirst("tenantId")?.Value;
        var role = User.FindFirst("role")?.Value;
        var email = User.FindFirst("email")?.Value;
        var name = User.FindFirst("name")?.Value;
        var tenantCode = User.FindFirst("tenantCode")?.Value;
        var twoFactor = User.FindFirst("twoFactorEnabled")?.Value;

        // Fetch full user data including profile photo
        string? profilePhotoUrl = null;
        string? firstName = null;
        string? lastName = null;
        if (Guid.TryParse(userId, out var parsedUid))
        {
            var user = await _db.Users.FindAsync(parsedUid);
            if (user != null)
            {
                profilePhotoUrl = user.ProfilePhotoUrl;
                firstName = user.FirstName;
                lastName = user.LastName;
            }
        }

        return Ok(new { userId, tenantId, role, email, name, tenantCode, twoFactorEnabled = twoFactor, profilePhotoUrl, firstName, lastName });
    }
}

// ─── REQUEST DTOs ───────────────────────────────────────────────────
public class VerifyOtpRequest
{
    public string TempToken { get; set; } = "";
    public string Code { get; set; } = "";
}

public class VerifyRegistrationOtpRequest
{
    public Guid UserId { get; set; }
    public string Code { get; set; } = "";
}

public class ResendRegistrationOtpRequest
{
    public Guid UserId { get; set; }
}

public class OtpCodeRequest
{
    public string Code { get; set; } = "";
}

public class ResendOtpRequest
{
    public string TempToken { get; set; } = "";
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = "";
}

public class ResetPasswordRequest
{
    public string Email { get; set; } = "";
    public string Code { get; set; } = "";
    public string NewPassword { get; set; } = "";
}
