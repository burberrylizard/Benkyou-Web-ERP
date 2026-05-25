namespace Benkyou.Core.Services
{
    /// <summary>
    /// Centralized password-policy enforcement.
    /// Rules: minimum 14 characters, at least one uppercase, one lowercase,
    /// one digit, and one special character.
    /// </summary>
    public static class PasswordValidator
    {
        public const int MinLength = 14;

        public static (bool IsValid, string? Error) Validate(string? password)
        {
            if (string.IsNullOrWhiteSpace(password))
                return (false, "Password is required.");

            if (password.Length < MinLength)
                return (false, $"Password must be at least {MinLength} characters.");

            if (!password.Any(char.IsUpper))
                return (false, "Password must contain at least one uppercase letter.");

            if (!password.Any(char.IsLower))
                return (false, "Password must contain at least one lowercase letter.");

            if (!password.Any(char.IsDigit))
                return (false, "Password must contain at least one digit.");

            if (password.All(char.IsLetterOrDigit))
                return (false, "Password must contain at least one special character (!@#$%^&* etc.).");

            return (true, null);
        }
    }
}
