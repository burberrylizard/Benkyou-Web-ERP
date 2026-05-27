using Benkyou.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Benkyou.API.Controllers;

[ApiController]
[Route("api/auditlogs")]
[Authorize(Roles = "Admin,Operator,SuperAdmin")]
public class AuditLogsController(BenkyouDbContext db) : BaseController
{
    private readonly BenkyouDbContext _db = db;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var query = _db.AuditLogs.AsQueryable();

        if (!IsSuperAdmin)
        {
            if (TenantId == Guid.Empty)
                return Unauthorized(new { message = "Invalid or missing tenant context" });

            query = query.Where(a => a.TenantID == TenantId);
        }

        var logs = await query
            .OrderByDescending(a => a.CreatedAt)
            .Take(100)
            .Select(a => new
            {
                a.AuditLogID,
                a.Action,
                a.EntityType,
                a.EntityID,
                a.IPAddress,
                a.CreatedAt,
                UserEmail = _db.Users.Where(u => u.Id == a.UserID).Select(u => u.Email).FirstOrDefault() ?? "System",
                OrganizationName = _db.Organizations.Where(o => o.TenantID == a.TenantID).Select(o => o.Name).FirstOrDefault() ?? "System",
                TargetName = a.EntityType == "User"
                    ? (_db.Users.Where(u => u.Id.ToString() == a.EntityID).Select(u => u.Email).FirstOrDefault() ?? "")
                    : a.EntityType == "Course"
                    ? (_db.Courses.Where(c => c.CourseID.ToString() == a.EntityID).Select(c => c.Title).FirstOrDefault() ?? "")
                    : ""
            })
            .ToListAsync();

        return Ok(logs);
    }
}
