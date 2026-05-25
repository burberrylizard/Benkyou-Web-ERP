using Benkyou.Data;
using Benkyou.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Benkyou.API.Controllers;

[ApiController]
[Route("api/subscription")]
[Authorize]
public class SubscriptionController(BenkyouDbContext db) : BaseController
{
    private readonly BenkyouDbContext _db = db;

    [HttpGet("plans")]
    public async Task<IActionResult> GetPlans()
    {
        var plans = await _db.SubscriptionPlans
            .Where(p => p.IsActive)
            .ToListAsync();

        return Ok(plans);
    }

    [HttpGet("current")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetCurrent()
    {
        if (TenantId == Guid.Empty && !IsSuperAdmin)
            return BadRequest("Tenant context required");

        var sub = await _db.Subscriptions
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.TenantID == TenantId);

        if (sub == null)
            return NotFound();

        return Ok(sub);
    }

    [HttpPost("change-plan/{planId}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> ChangePlan(int planId)
    {
        var sub = await _db.Subscriptions
            .FirstOrDefaultAsync(s => s.TenantID == TenantId);

        if (sub == null)
            return NotFound("Subscription not found");

        sub.PlanID = planId;
        sub.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok("Plan updated");
    }

    // SUPER ADMIN ONLY
    [HttpGet("billing-summary")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> GetBillingSummary()
    {
        var plans = await _db.SubscriptionPlans
            .Select(p => new {
                p.PlanID,
                p.Name,
                p.PriceMonthly,
                p.IsActive,
                OrgCount = _db.Subscriptions.Count(s => s.PlanID == p.PlanID)
            })
            .ToListAsync();

        var totalMRR = await _db.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.Plan != null)
            .SumAsync(s => s.Plan.PriceMonthly);

        var recentInvoices = await _db.Subscriptions
            .Include(s => s.Plan)
            .OrderByDescending(s => s.CreatedAt)
            .Take(10)
            .Select(s => new {
                OrganizationName = _db.Organizations.Where(o => o.TenantID == s.TenantID).Select(o => o.Name).FirstOrDefault() ?? "Unknown",
                PlanName = s.Plan != null ? s.Plan.Name : "Unknown Plan",
                Amount = s.Plan != null ? s.Plan.PriceMonthly : 0,
                Status = "Paid",
                Date = s.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            totalMRR,
            plans,
            recentInvoices
        });
    }

    [HttpPut("plans/{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> UpdatePlan(int id, [FromBody] UpdatePlanRequest request)
    {
        var plan = await _db.SubscriptionPlans.FindAsync(id);
        if (plan == null) return NotFound();

        plan.Name = request.Name;
        plan.PriceMonthly = request.PriceMonthly;
        plan.IsActive = request.IsActive;
        
        await _db.SaveChangesAsync();

        await LogAction(_db, "Updated Subscription Plan", "SubscriptionPlan", id.ToString());

        return Ok(new { success = true, data = plan });
    }
}

public class UpdatePlanRequest
{
    public string Name { get; set; } = "";
    public decimal PriceMonthly { get; set; }
    public bool IsActive { get; set; }
}
