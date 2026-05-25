using Benkyou.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Resend;

namespace Benkyou.Core.Services
{
    /// <summary>
    /// Handles SuperAdmin email-based OTP login using the Resend API (official NuGet package).
    /// Generates a 6-digit code, sends it to the fixed SuperAdmin email, and validates on submission.
    /// Codes expire after 5 minutes.
    /// In Development: logs the OTP to the console instead of calling Resend.
    /// In Production: always calls Resend and throws on failure.
    /// </summary>
    public class SuperAdminOtpService(
        BenkyouDbContext db,
        IResend resend,
        IConfiguration config,
        ILogger<SuperAdminOtpService> logger,
        IHostEnvironment env)
    {
        private readonly BenkyouDbContext _db = db;
        private readonly IResend _resend = resend;
        private readonly IConfiguration _config = config;
        private readonly ILogger<SuperAdminOtpService> _logger = logger;
        private readonly bool _isDevelopment = env.IsDevelopment();

        /// <summary>
        /// Generates a 6-digit OTP, stores the hash in the database, and emails it
        /// to the SuperAdmin using the Resend free tier (onboarding@resend.dev sender).
        /// </summary>
        public async Task<bool> SendOtpAsync(Guid superAdminId)
        {
            var admin = await _db.SuperAdmins.FindAsync(superAdminId);
            if (admin == null)
            {
                _logger.LogWarning("SuperAdmin {Id} not found for OTP generation.", superAdminId);
                return false;
            }

            // Generate 6-digit code using the existing OtpService
            var code = OtpService.GenerateCode();
            var expiry = OtpService.GetExpiry(5); // 5 minutes

            // Store hashed OTP in the database
            admin.OtpCode = BCrypt.Net.BCrypt.HashPassword(code);
            admin.OtpExpiry = expiry;
            await _db.SaveChangesAsync();

            // Development: log OTP to console, skip Resend API entirely
            if (_isDevelopment)
            {
                _logger.LogWarning(
                    "\n==========================================================\n" +
                    "  [DEVELOPMENT] SUPERADMIN OTP VERIFICATION CODE\n" +
                    $"  To:   {admin.Email}\n" +
                    $"  Code: {code}\n" +
                    "==========================================================\n");
                return true;
            }

            // Production: send via Resend (official SDK) — throw on failure
            var senderEmail = _config["Resend:SenderEmail"] ?? "onboarding@resend.dev";
            var senderName = _config["Resend:SenderName"] ?? "Benkyou Support";

            var htmlBody = $@"
                <div style='font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;'>
                    <div style='text-align: center; margin-bottom: 32px;'>
                        <h1 style='color: #111827; font-size: 24px; font-weight: 700; margin: 0;'>SuperAdmin Login Verification</h1>
                    </div>
                    <p style='color: #374151; font-size: 16px; line-height: 24px;'>Hi {admin.FirstName},</p>
                    <p style='color: #374151; font-size: 16px; line-height: 24px;'>Use the following code to complete your SuperAdmin sign-in:</p>
                    <div style='background: #f0f4ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 32px; text-align: center; margin: 32px 0;'>
                        <span style='font-family: monospace; font-size: 40px; font-weight: 700; letter-spacing: 8px; color: #1d4ed8;'>{code}</span>
                    </div>
                    <p style='color: #6b7280; font-size: 14px; text-align: center;'>This code will expire in <strong>5 minutes</strong>.</p>
                    <hr style='border: 0; border-top: 1px solid #f3f4f6; margin: 32px 0;' />
                    <p style='color: #9ca3af; font-size: 12px; text-align: center; margin: 0;'>If you did not attempt to sign in, please secure your account immediately.</p>
                </div>";

            try
            {
                var message = new EmailMessage
                {
                    From = $"{senderName} <{senderEmail}>",
                    To = { admin.Email },
                    Subject = $"{code} — SuperAdmin Login Code",
                    HtmlBody = htmlBody
                };

                await _resend.EmailSendAsync(message);
                _logger.LogInformation("SuperAdmin OTP sent to {Email} via Resend SDK.", admin.Email);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PRODUCTION FAILURE: Failed to send SuperAdmin OTP to {Email} via Resend.", admin.Email);
                throw;
            }
        }

        /// <summary>
        /// Validates the submitted OTP code against the stored hash. Clears the OTP on success.
        /// </summary>
        public async Task<(bool IsValid, string? Error)> ValidateOtpAsync(Guid superAdminId, string submittedCode)
        {
            var admin = await _db.SuperAdmins.FindAsync(superAdminId);
            if (admin == null)
                return (false, "Account not found.");

            if (admin.OtpCode == null || admin.OtpExpiry == null)
                return (false, "No OTP was requested. Please request a new code.");

            if (DateTime.UtcNow > admin.OtpExpiry.Value)
            {
                // Clear expired OTP
                admin.OtpCode = null;
                admin.OtpExpiry = null;
                await _db.SaveChangesAsync();
                return (false, "Verification code has expired. Please request a new code.");
            }

            if (!BCrypt.Net.BCrypt.Verify(submittedCode.Trim(), admin.OtpCode))
                return (false, "Invalid verification code.");

            // Clear OTP after successful validation
            admin.OtpCode = null;
            admin.OtpExpiry = null;

            if (!admin.TwoFactorEnabled)
                admin.TwoFactorEnabled = true;

            await _db.SaveChangesAsync();
            return (true, null);
        }
    }
}
