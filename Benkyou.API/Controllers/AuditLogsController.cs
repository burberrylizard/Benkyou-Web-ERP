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
                OrganizationName = _db.Organizations.Where(o => o.TenantID == a.TenantID).Select(o => o.Name).FirstOrDefault() ?? "System"
            })
            .ToListAsync();

        return Ok(logs);
    }
}
