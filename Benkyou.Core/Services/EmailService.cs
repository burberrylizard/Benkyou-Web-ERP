using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Benkyou.Core.Services
{
    /// <summary>
    /// Sends emails using Resend API.
    /// In Development: always falls back to console logging (no real API calls).
    /// In Production: always calls Resend API and throws on failure.
    /// </summary>
    public class EmailService : IEmailSender
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;
        private readonly bool _isDevelopment;
        private readonly bool _useResend;

        public EmailService(HttpClient httpClient, IConfiguration config, ILogger<EmailService> logger, IHostEnvironment env)
        {
            _httpClient = httpClient;
            _config = config;
            _logger = logger;
            _isDevelopment = env.IsDevelopment();

            var apiToken = _config["Resend:ApiToken"];
            _useResend = !string.IsNullOrWhiteSpace(apiToken) && !apiToken.Contains("YOUR_API_KEY");

            if (_useResend && !_isDevelopment)
            {
                _httpClient.BaseAddress = new Uri("https://api.resend.com/");
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiToken);
            }
        }

        public async Task SendEmailAsync(string email, string subject, string htmlMessage)
        {
            if (_isDevelopment)
            {
                var devRedirect = _config["Resend:DevRedirectEmail"];

                if (!string.IsNullOrWhiteSpace(devRedirect) && _useResend)
                {
                    try
                    {
                        if (_httpClient.BaseAddress == null)
                        {
                            _httpClient.BaseAddress = new Uri("https://api.resend.com/");
                            _httpClient.DefaultRequestHeaders.Authorization =
                                new AuthenticationHeaderValue("Bearer", _config["Resend:ApiToken"]);
                        }

                        var payload = new
                        {
                            from = $"{_config["Resend:SenderName"] ?? "Benkyou"} <{_config["Resend:SenderEmail"] ?? "onboarding@resend.dev"}>",
                            to = new[] { devRedirect },
                            subject = $"[DEV → {email}] {subject}",
                            html = htmlMessage
                        };

                        var response = await _httpClient.PostAsJsonAsync("emails", payload);
                        if (response.IsSuccessStatusCode)
                        {
                            _logger.LogInformation("DEV: Email redirected from {Original} to {Redirect}", email, devRedirect);
                            return;
                        }

                        var error = await response.Content.ReadAsStringAsync();
                        _logger.LogError("DEV RESEND ERROR: Failed to redirect email. Status: {Status}, Details: {Error}. Falling back to console logging.",
                            response.StatusCode, error);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "DEV RESEND EXCEPTION: Falling back to console logging.");
                    }
                }

                // No redirect configured or redirect failed — fall back to console
                LogToConsole(email, subject, htmlMessage);
                return;
            }

            // Production: must have a valid API token configured
            if (!_useResend)
            {
                _logger.LogError("PRODUCTION ERROR: Resend API token is not configured. Cannot send email to {Email}.", email);
                throw new InvalidOperationException("Resend API token is not configured. Email delivery is required in production.");
            }

            try
            {
                var payload = new
                {
                    from = $"{_config["Resend:SenderName"] ?? "Benkyou"} <{_config["Resend:SenderEmail"] ?? "onboarding@resend.dev"}>",
                    to = new[] { email },
                    subject,
                    html = htmlMessage
                };

                var response = await _httpClient.PostAsJsonAsync("emails", payload);

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError("RESEND ERROR: Failed to send email to {Email}. Status: {Status}, Details: {Error}",
                        email, response.StatusCode, error);

                    // Specific helpful messages for common Resend errors
                    if (error.Contains("unverified") || error.Contains("onboarding@resend.dev"))
                    {
                        _logger.LogWarning("RESEND TIP: Ensure your sender email is verified in Resend dashboard or use onboarding@resend.dev for testing with your own email.");
                    }

                    throw new Exception($"Email delivery failed: {response.StatusCode}. Details: {error}");
                }

                _logger.LogInformation("SUCCESS: Email sent to {Email} via Resend API.", email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "FATAL: Exception occurred while sending email to {Email}", email);
                throw;
            }
        }

        public async Task SendVerificationEmailAsync(string email, string userName, string verificationLink)
        {
            var subject = "Verify your Benkyou account";
            var body = $@"
                <div style='font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;'>
                    <h2 style='color: #111827;'>Welcome to Benkyou!</h2>
                    <p style='color: #4b5563; font-size: 16px;'>Hi {userName},</p>
                    <p style='color: #4b5563; font-size: 16px;'>Please verify your email address by clicking the button below:</p>
                    <div style='margin: 32px 0;'>
                        <a href='{verificationLink}' style='background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;'>Verify Email Address</a>
                    </div>
                    <p style='color: #9ca3af; font-size: 13px;'>If you didn't create an account, you can safely ignore this email.</p>
                </div>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendRegistrationOtpAsync(string email, string userName, string code)
        {
            var subject = $"{code} is your Benkyou verification code";
            var body = $@"
                <div style='font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 40px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;'>
                    <div style='text-align: center; margin-bottom: 32px;'>
                        <h1 style='color: #111827; font-size: 24px; font-weight: 700; margin: 0;'>Verify your email</h1>
                    </div>
                    <p style='color: #374151; font-size: 16px; line-height: 24px;'>Hi {userName},</p>
                    <p style='color: #374151; font-size: 16px; line-height: 24px;'>Thank you for choosing Benkyou. Use the following code to verify your account registration:</p>
                    <div style='background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 32px; text-align: center; margin: 32px 0;'>
                        <span style='font-family: monospace; font-size: 40px; font-weight: 700; letter-spacing: 8px; color: #1d4ed8;'>{code}</span>
                    </div>
                    <p style='color: #6b7280; font-size: 14px; text-align: center;'>This code will expire in 10 minutes.</p>
                    <hr style='border: 0; border-top: 1px solid #f3f4f6; margin: 32px 0;' />
                    <p style='color: #9ca3af; font-size: 12px; text-align: center; margin: 0;'>If you did not request this code, you can safely ignore this email.</p>
                </div>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendMfaCodeAsync(string email, string userName, string code)
        {
            var subject = $"{code} is your Benkyou login code";
            var body = $@"
                <div style='font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;'>
                    <h2 style='color: #111827; margin-bottom: 8px;'>Login verification code</h2>
                    <p style='color: #6b7280; margin-bottom: 24px;'>Hi {userName}, use this code to complete your sign-in.</p>
                    <div style='background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;'>
                        <span style='font-size: 32px; font-weight: 700; letter-spacing: 4px; color: #111827;'>{code}</span>
                    </div>
                    <p style='color: #9ca3af; font-size: 12px;'>Expires in 5 minutes.</p>
                </div>";

            await SendEmailAsync(email, subject, body);
        }

        private void LogToConsole(string to, string subject, string body)
        {
            _logger.LogWarning("DEVELOPMENT MODE: Resend API skipped. Logging email to console instead.");
            Console.WriteLine("\n" + new string('═', 80));
            Console.WriteLine($"║ EMAIL TO: {to,-66} ║");
            Console.WriteLine($"║ SUBJECT:  {subject,-66} ║");
            Console.WriteLine(new string('─', 80));
            // Strip HTML for console logging if possible, but for now just log it
            Console.WriteLine("║ BODY PREVIEW:");
            Console.WriteLine(body.Length > 500 ? string.Concat(body.AsSpan(0, 500), "...") : body);
            Console.WriteLine(new string('═', 80) + "\n");
        }
    }
}
