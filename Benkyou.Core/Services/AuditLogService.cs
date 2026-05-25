using System.Text.Json;
using Benkyou.Data;
using Benkyou.Data.Models;
using Microsoft.Extensions.Logging;

namespace Benkyou.Core.Services
{
    /// <summary>
    /// Provides explicit audit logging for the multi-tenant LMS.
    /// Only logs when directly called — no automatic/interceptor-based logging.
    /// Stores old and new values as JSON for change tracking.
    /// </summary>
    public class AuditLogService
    {
        private readonly BenkyouDbContext _db;
        private readonly ILogger<AuditLogService> _logger;

        public AuditLogService(BenkyouDbContext db, ILogger<AuditLogService> logger)
        {
            _db = db;
            _logger = logger;
        }

        /// <summary>
        /// Records an audit log entry in the database.
        /// </summary>
        /// <param name="tenantId">The tenant context for the action.</param>
        /// <param name="userId">The user who performed the action.</param>
        /// <param name="action">The action performed (e.g., "Created", "Updated", "Deleted").</param>
        /// <param name="resource">The resource type (e.g., "Course", "User", "Assessment").</param>
        /// <param name="resourceId">The ID of the affected resource.</param>
        /// <param name="ipAddress">The IP address of the request origin.</param>
        /// <param name="oldValues">The previous state of the resource (serialized to JSON).</param>
        /// <param name="newValues">The new state of the resource (serialized to JSON).</param>
        public async Task LogAsync(
            Guid tenantId,
            Guid userId,
            string action,
            string resource,
            string? resourceId = null,
            string? ipAddress = null,
            object? oldValues = null,
            object? newValues = null)
        {
            try
            {
                var log = new AuditLog
                {
                    TenantID = tenantId,
                    UserID = userId,
                    Action = action,
                    EntityType = resource,
                    EntityID = resourceId ?? "",
                    IPAddress = ipAddress ?? "",
                    OldValues = oldValues != null
                        ? JsonSerializer.Serialize(oldValues, new JsonSerializerOptions { WriteIndented = false })
                        : "",
                    NewValues = newValues != null
                        ? JsonSerializer.Serialize(newValues, new JsonSerializerOptions { WriteIndented = false })
                        : "",
                    CreatedAt = DateTime.UtcNow
                };

                _db.AuditLogs.Add(log);
                await _db.SaveChangesAsync();

                _logger.LogInformation(
                    "AuditLog: {Action} on {Resource} (ID: {ResourceId}) by User {UserId} in Tenant {TenantId}.",
                    action, resource, resourceId, userId, tenantId);
            }
            catch (Exception ex)
            {
                // Audit logging should never break the main application flow
                _logger.LogError(ex,
                    "AuditLog: Failed to log {Action} on {Resource} by User {UserId}.",
                    action, resource, userId);
            }
        }
    }
}
