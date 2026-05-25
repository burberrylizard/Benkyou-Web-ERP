using Benkyou.Core.DTOs;
using Benkyou.Data;
using Benkyou.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

[ApiController]
[Route("api/sections")]
[Authorize]
public class CourseSectionsController : ControllerBase
{
    private readonly BenkyouDbContext _db;

    public CourseSectionsController(BenkyouDbContext db)
    {
        _db = db;
    }

    private Guid TenantId
    {
        get
        {
            var claim = User.FindFirst("tenantId");

            if (claim == null || !Guid.TryParse(claim.Value, out var tenantId))
                throw new UnauthorizedAccessException("Invalid or missing tenantId");

            return tenantId;
        }
    }

    private bool IsSuperAdmin =>
        User.FindFirst("isSuperAdmin")?.Value == "true";

    // 🟩 CREATE SECTION
    [HttpPost]
    [Authorize(Roles = "Admin,Instructor,SuperAdmin")]
    public async Task<IActionResult> Create(CreateCourseSectionDto dto)
    {
        var course = await _db.Courses
            .FirstOrDefaultAsync(c =>
                c.CourseID == dto.CourseID &&
                (IsSuperAdmin || c.TenantID == TenantId));

        if (course == null)
            return NotFound("Course not found");

        var section = new CourseSection
        {
            CourseID = dto.CourseID,
            TenantID = course.TenantID,
            Title = dto.Title,
            Description = dto.Description
        };

        _db.CourseSections.Add(section);
        await _db.SaveChangesAsync();

        return Ok(section);
    }

    // 🟦 GET SECTIONS BY COURSE
    [HttpGet("course/{courseId}")]
    public async Task<IActionResult> GetByCourse(int courseId)
    {
        var data = await _db.CourseSections
            .Where(s =>
                s.CourseID == courseId &&
                (IsSuperAdmin || s.TenantID == TenantId))
            .ToListAsync();

        return Ok(data);
    }
}