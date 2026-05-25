using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Benkyou.API.Controllers;

public abstract class BaseController : ControllerBase
{
    protected Guid TenantId
    {
        get
        {
            var claim = User.FindFirst("tenantId");
            if (claim == null || !Guid.TryParse(claim.Value, out var tenantId))
            {
                if (IsSuperAdmin) return Guid.Empty;
                throw new UnauthorizedAccessException("Invalid or missing tenantId");
            }
            return tenantId;
        }
    }

    protected Guid UserId
    {
        get
        {
            var claim = User.FindFirst("uid");
            if (claim == null || !Guid.TryParse(claim.Value, out var userId))
                throw new UnauthorizedAccessException("Invalid or missing uid");
            return userId;
        }
    }

    protected bool IsSuperAdmin => User.FindFirst("isSuperAdmin")?.Value == "true";

    protected async Task LogAction(Benkyou.Data.BenkyouDbContext db, string action, string entityType, string? entityId = null, Guid? userId = null, Guid? tenantId = null)
    {
        try
        {
            Guid finalUserId = Guid.Empty;
            if (userId.HasValue) finalUserId = userId.Value;
            else
            {
                var claim = User.FindFirst("uid");
                if (claim != null) Guid.TryParse(claim.Value, out finalUserId);
            }

            Guid finalTenantId = Guid.Empty;
            if (tenantId.HasValue) finalTenantId = tenantId.Value;
            else
            {
                var claim = User.FindFirst("tenantId");
                if (claim != null) Guid.TryParse(claim.Value, out finalTenantId);
            }

            var log = new Benkyou.Data.Models.AuditLog
            {
                UserID = finalUserId,
                TenantID = finalTenantId,
                Action = action,
                EntityType = entityType,
                EntityID = entityId ?? "",
                IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0",
                CreatedAt = DateTime.UtcNow
            };
            db.AuditLogs.Add(log);
            await db.SaveChangesAsync();
        }
        catch { /* Fail silently to not break main flow */ }
    }
}
