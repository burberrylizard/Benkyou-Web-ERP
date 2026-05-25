using Benkyou.Data;
using Benkyou.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Benkyou.API.Controllers;

[ApiController]
[Route("api/courses/{courseId}/instructors")]
[Authorize(Roles = "Operator,SuperAdmin")]
public class CourseInstructorController(BenkyouDbContext db) : BaseController
{
    private readonly BenkyouDbContext _db = db;

    [HttpGet]
    public async Task<IActionResult> GetInstructors(int courseId)
    {
        var instructors = await _db.CourseInstructors
            .Where(ci => ci.CourseID == courseId && ci.TenantID == TenantId)
            .Include(ci => ci.Instructor)
            .Select(ci => new {
                ci.InstructorID,
                ci.Instructor.FirstName,
                ci.Instructor.LastName,
                ci.Instructor.Email,
                ci.AssignedAt
            })
            .ToListAsync();

        return Ok(instructors);
    }

    [HttpPost("{userId}")]
    public async Task<IActionResult> AssignInstructor(int courseId, Guid userId)
    {
        // Verify course belongs to tenant
        var course = await _db.Courses.FirstOrDefaultAsync(c => c.CourseID == courseId && c.TenantID == TenantId);
        if (course == null) return NotFound("Course not found");

        // Verify user is an instructor in the same tenant
        var instructor = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.TenantID == TenantId && u.Role == Benkyou.Data.Enums.UserRole.Instructor);
        if (instructor == null) return BadRequest("User is not a valid instructor for this organization");

        // Check if already assigned
        var exists = await _db.CourseInstructors.AnyAsync(ci => ci.CourseID == courseId && ci.InstructorID == userId);
        if (exists) return BadRequest("Instructor is already assigned to this course");

        var assignment = new CourseInstructor
        {
            CourseID = courseId,
            InstructorID = userId,
            TenantID = TenantId,
            AssignedAt = DateTime.UtcNow
        };

        _db.CourseInstructors.Add(assignment);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Instructor assigned successfully" });
    }

    [HttpDelete("{userId}")]
    public async Task<IActionResult> RemoveInstructor(int courseId, Guid userId)
    {
        var assignment = await _db.CourseInstructors
            .FirstOrDefaultAsync(ci => ci.CourseID == courseId && ci.InstructorID == userId && ci.TenantID == TenantId);

        if (assignment == null) return NotFound("Assignment not found");

        _db.CourseInstructors.Remove(assignment);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Instructor removed successfully" });
    }
}
