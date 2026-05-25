using Benkyou.Data;
using Benkyou.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace Benkyou.API.Controllers
{
    [ApiController]
    [Route("api/organization")]
    [Authorize]
    public class OrganizationController(BenkyouDbContext db, Microsoft.AspNetCore.Identity.UserManager<User> userManager) : BaseController
    {
        private readonly BenkyouDbContext _db = db;
        private readonly Microsoft.AspNetCore.Identity.UserManager<User> _userManager = userManager;

        [HttpGet("me")]
        public async Task<IActionResult> GetMyOrganization()
        {
            var tenantClaim = User.FindFirst("tenantId");
            if (tenantClaim == null) return BadRequest("No tenant context");

            var tenantId = Guid.Parse(tenantClaim.Value);

            var org = await _db.Organizations
                .FirstOrDefaultAsync(o => o.TenantID == tenantId);

            if (org == null)
                return NotFound();

            return Ok(org);
        }

        // SUPER ADMIN ONLY
        [HttpGet]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> GetAll()
        {
            var orgs = await _db.Organizations
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
            return Ok(orgs);
        }

        // PUBLIC — for login/register dropdown
        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveOrganizations()
        {
            var orgs = await _db.Organizations
                .Where(o => o.IsActive)
                .OrderBy(o => o.Name)
                .Select(o => new { o.TenantCode, o.Name })
                .ToListAsync();
            return Ok(orgs);
        }

        [HttpPatch("{id}/status")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest request)
        {
            var org = await _db.Organizations.FindAsync(id);
            if (org == null) return NotFound();

            org.IsActive = request.IsActive;
            await _db.SaveChangesAsync();

            await LogAction(_db, $"{(request.IsActive ? "Activated" : "Deactivated")} Organization", "Organization", id.ToString());

            return Ok(new { success = true, message = $"Organization {(request.IsActive ? "activated" : "deactivated")} successfully" });
        }

        [HttpPost]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> Register([FromBody] RegisterOrganizationRequest request)
        {
            if (await _db.Organizations.AnyAsync(o => o.TenantCode == request.TenantCode))
                return BadRequest(new { message = "Tenant code already exists" });

            if (await _db.Organizations.AnyAsync(o => o.Name.ToLower() == request.Name.ToLower()))
                return BadRequest(new { message = "Organization name already exists" });

            if (await _userManager.FindByEmailAsync(request.PrimaryEmail) != null)
                return BadRequest(new { message = "Primary admin email already exists in the system." });

            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                var org = new Organization
                {
                    TenantID = Guid.NewGuid(),
                    Name = request.Name,
                    TenantCode = request.TenantCode,
                    PrimaryEmail = request.PrimaryEmail,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _db.Organizations.Add(org);

                // Create primary admin user
                var adminUser = new User
                {
                    Id = Guid.NewGuid(),
                    TenantID = org.TenantID,
                    Email = request.PrimaryEmail,
                    UserName = request.PrimaryEmail,
                    FirstName = "Organization",
                    LastName = "Admin",
                    Role = Benkyou.Data.Enums.UserRole.Admin,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true,
                    EmailConfirmed = true
                };

                var userResult = await _userManager.CreateAsync(adminUser, request.Password);
                if (!userResult.Succeeded)
                {
                    var errors = string.Join(", ", userResult.Errors.Select(e => e.Description));
                    return BadRequest(new { message = $"Failed to create admin user: {errors}" });
                }

                // Add default subscription
                var subscription = new Subscription
                {
                    TenantID = org.TenantID,
                    PlanID = 1, // Free
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                };
                _db.Subscriptions.Add(subscription);

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                await LogAction(_db, "Registered Organization & Admin", "Organization", org.TenantID.ToString());

                return Ok(new { success = true, data = org });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("me/type")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateOrgType([FromBody] UpdateOrgTypeRequest req)
        {
            var tenantClaim = User.FindFirst("tenantId");
            if (tenantClaim == null) return BadRequest("No tenant context");
            var tenantId = Guid.Parse(tenantClaim.Value);

            var org = await _db.Organizations.FirstOrDefaultAsync(o => o.TenantID == tenantId);
            if (org == null) return NotFound();

            var allowed = new[] { "HigherEducation", "K12" };
            if (!allowed.Contains(req.OrganizationType))
                return BadRequest($"Invalid type. Allowed: {string.Join(", ", allowed)}");

            org.OrganizationType = req.OrganizationType;
            await _db.SaveChangesAsync();

            await LogAction(_db, $"Changed Organization Type to {req.OrganizationType}", "Organization", org.TenantID.ToString());
            return Ok(new { success = true, organizationType = org.OrganizationType });
        }
    }

    public class UpdateOrgTypeRequest
    {
        public string OrganizationType { get; set; } = "";
    }

    public class UpdateStatusRequest
    {
        public bool IsActive { get; set; }
    }

    public class RegisterOrganizationRequest
    {
        public string Name { get; set; } = "";
        public string TenantCode { get; set; } = "";
        public string PrimaryEmail { get; set; } = "";
        public string Password { get; set; } = "";
    }
}
