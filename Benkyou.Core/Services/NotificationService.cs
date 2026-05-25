using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace Benkyou.Core.Services
{
    /// <summary>
    /// No-Op push notification service (OneSignal deactivated).
    /// </summary>
    public class NotificationService
    {
        public NotificationService(IConfiguration config, ILogger<NotificationService> logger)
        {
        }

        public Task NotifyNewCoursePublishedAsync(Guid tenantId, string courseName, string? courseDescription = null)
        {
            return Task.CompletedTask;
        }

        public Task NotifyCourseDeadlineReminderAsync(Guid tenantId, string courseName, DateTime deadline)
        {
            return Task.CompletedTask;
        }

        public Task NotifyEnrollmentConfirmedAsync(Guid tenantId, string userId, string courseName)
        {
            return Task.CompletedTask;
        }
    }
}
