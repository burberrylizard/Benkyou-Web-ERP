using System.Security.Cryptography;

namespace Benkyou.Core.Services
{
    /// <summary>
    /// Generates and validates time-limited email OTP codes.
    /// </summary>
    public static class OtpService
    {
        /// <summary>
        /// Generates a cryptographically-random 6-digit OTP code.
        /// </summary>
        public static string GenerateCode()
        {
            // Use RandomNumberGenerator for secure random bytes
            var bytes = RandomNumberGenerator.GetBytes(4);
            var number = BitConverter.ToUInt32(bytes, 0) % 1_000_000;
            return number.ToString("D6");
        }

        /// <summary>
        /// Returns a UTC expiry timestamp (default 5 minutes from now).
        /// </summary>
        public static DateTime GetExpiry(int minutes = 5)
        {
            return DateTime.UtcNow.AddMinutes(minutes);
        }

        /// <summary>
        /// Validates the user-supplied code against the stored code and expiry.
        /// </summary>
        public static (bool IsValid, string? Error) Validate(
            string? submittedCode,
            string? storedCode,
            DateTime? expiry)
        {
            if (string.IsNullOrWhiteSpace(submittedCode))
                return (false, "OTP code is required.");

            if (string.IsNullOrWhiteSpace(storedCode) || expiry == null)
                return (false, "No OTP was requested. Please request a new code.");

            if (DateTime.UtcNow > expiry.Value)
                return (false, "OTP code has expired. Please request a new code.");

            if (!string.Equals(submittedCode.Trim(), storedCode, StringComparison.Ordinal))
                return (false, "Invalid OTP code.");

            return (true, null);
        }
    }
}
