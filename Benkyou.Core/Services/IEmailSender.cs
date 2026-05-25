using System.Threading.Tasks;

namespace Benkyou.Core.Services
{
    public interface IEmailSender
    {
        Task SendEmailAsync(string email, string subject, string htmlMessage);
        Task SendVerificationEmailAsync(string email, string userName, string verificationLink);
        Task SendRegistrationOtpAsync(string email, string userName, string code);
        Task SendMfaCodeAsync(string email, string userName, string code);
    }
}
