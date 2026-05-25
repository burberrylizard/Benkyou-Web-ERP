using Benkyou.Data;
using Benkyou.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Benkyou.API.Controllers;

[ApiController]
[Route("api/settings")]
[Authorize(Roles = "SuperAdmin")]
public class SettingsController(BenkyouDbContext db) : BaseController
{
    private readonly BenkyouDbContext _db = db;

    [HttpPost("danger-action")]
    public async Task<IActionResult> DangerAction([FromBody] DangerActionRequest request)
    {
        // 1. Get authenticated SuperAdmin uid
        var adminId = UserId;
        var admin = await _db.SuperAdmins.FindAsync(adminId);
        if (admin == null)
            return Unauthorized(new { message = "SuperAdmin account not found" });

        // 2. Verify password using BCrypt
        if (!BCrypt.Net.BCrypt.Verify(request.Password, admin.PasswordHash))
            return BadRequest(new { message = "Invalid SuperAdmin password. Action rejected." });

        // 3. Execute action
        if (request.Action == "reset-analytics")
        {
            // Clear enrollments, notifications, and logs
            _db.Enrollments.RemoveRange(_db.Enrollments);
            _db.Notifications.RemoveRange(_db.Notifications);
            _db.AuditLogs.RemoveRange(_db.AuditLogs);
            
            await _db.SaveChangesAsync();

            await LogAction(_db, "Reset Platform Analytics", "System", adminId.ToString(), adminId);
            return Ok(new { success = true, message = "Platform analytics and activity logs have been successfully reset." });
        }
        else if (request.Action == "purge-logs")
        {
            // Purge logs older than 90 days
            var cutoff = DateTime.UtcNow.AddDays(-90);
            var oldLogs = await _db.AuditLogs.Where(l => l.CreatedAt < cutoff).ToListAsync();
            _db.AuditLogs.RemoveRange(oldLogs);
            
            await _db.SaveChangesAsync();

            await LogAction(_db, $"Purged {oldLogs.Count} Audit Logs older than 90 days", "System", adminId.ToString(), adminId);
            return Ok(new { success = true, message = $"Successfully purged {oldLogs.Count} audit log entries older than 90 days." });
        }

        return BadRequest(new { message = "Invalid action specified." });
    }
}

public class DangerActionRequest
{
    public string Action { get; set; } = "";
    public string Password { get; set; } = "";
}
