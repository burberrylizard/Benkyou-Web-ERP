using Benkyou.Core.DTOs;
using Benkyou.Data;
using Benkyou.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/progress")]
[Authorize]
public class ProgressController : ControllerBase
{
    private readonly BenkyouDbContext _db;

    public ProgressController(BenkyouDbContext db)
    {
        _db = db;
    }

    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);
    private Guid UserId => Guid.Parse(User.FindFirst("uid")!.Value);

    [HttpPost("complete")]
    [Authorize(Roles = "Student,Member,4,SuperAdmin")]
    public async Task<IActionResult> Complete(ProgressDto dto)
    {
        var enrollment = await _db.Enrollments
            .FirstOrDefaultAsync(e => e.StudentID == UserId);

        if (enrollment == null)
            return Unauthorized("Not enrolled");

        var exists = await _db.ContentProgresses
            .AnyAsync(cp =>
                cp.ContentItemID == dto.ContentItemID &&
                cp.EnrollmentID == enrollment.EnrollmentID);

        if (exists)
            return BadRequest(new
            {
                success = false,
                message = "Invalid category"
            });

        var progress = new ContentProgress
        {
            TenantID = TenantId,
            EnrollmentID = enrollment.EnrollmentID,
            ContentItemID = dto.ContentItemID,
            IsCompleted = true,
            CompletedAt = DateTime.UtcNow,
            TimeSpentSeconds = 0
        };

        _db.ContentProgresses.Add(progress);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            data = progress
        });
    }
}