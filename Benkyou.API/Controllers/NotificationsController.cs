using Benkyou.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Benkyou.API.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly BenkyouDbContext _db;

    public NotificationsController(BenkyouDbContext db)
    {
        _db = db;
    }

    private Guid? UserId
    {
        get
        {
            var value = User.FindFirst("uid")?.Value;
            return Guid.TryParse(value, out var userId) ? userId : null;
        }
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = UserId;

        if (userId == null)
            return Unauthorized(new { message = "Invalid or missing user context" });

        var data = await _db.Notifications
            .Where(n => n.UserID == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(n => new
            {
                n.NotificationID,
                n.Type,
                n.Title,
                n.Message,
                n.ReferenceType,
                n.ReferenceID,
                n.IsRead,
                n.ReadAt,
                n.CreatedAt
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var userId = UserId;

        if (userId == null)
            return Unauthorized(new { message = "Invalid or missing user context" });

        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.NotificationID == id && n.UserID == userId);

        if (notification == null)
            return NotFound();

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userId = UserId;

        if (userId == null)
            return Unauthorized(new { message = "Invalid or missing user context" });

        var notifications = await _db.Notifications
            .Where(n => n.UserID == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }
}
