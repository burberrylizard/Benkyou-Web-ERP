using Benkyou.Core.DTOs;
using Benkyou.Data;
using Benkyou.Data.Enums;
using Benkyou.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Benkyou.API.Controllers;

[ApiController]
[Route("api/courses")]
[Authorize]
public class CoursesController(BenkyouDbContext db) : BaseController
{
    private readonly BenkyouDbContext _db = db;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var tenantId = TenantId;
        var query = _db.Courses.AsQueryable();

        if (!IsSuperAdmin)
        {
            query = query.Where(c => c.TenantID == tenantId && c.IsActive);

            if (User.IsInRole("Instructor"))
            {
                var userId = Guid.Parse(User.FindFirst("uid")!.Value);
                // Instructors see their own courses + assigned courses, excluding hidden
                query = query.Where(c => !c.IsHidden && (c.CreatedByUserID == userId || _db.ClassSections.Any(cs => cs.CourseID == c.CourseID && cs.InstructorID == userId)));
            }
            else if (User.IsInRole("Student"))
            {
                var userId = Guid.Parse(User.FindFirst("uid")!.Value);
                var enrolledCourseIds = await _db.Enrollments
                    .Where(e => e.StudentID == userId)
                    .Select(e => e.CourseID)
                    .ToListAsync();

                // Students only see published, non-hidden, enrolled courses
                query = query.Where(c => enrolledCourseIds.Contains(c.CourseID) && c.IsPublished && !c.IsHidden);
            }
        }

        var data = await query
            .Include(c => c.Category)
            .Include(c => c.Instructors)
                .ThenInclude(ci => ci.Instructor)
            .Select(c => new {
                c.CourseID,
                c.Title,
                c.Description,
                c.CategoryID,
                CategoryName = c.Category.Name,
                c.Status,
                c.IsPublished,
                c.IsHidden,
                c.CreatedAt,
                SectionCount = c.Sections.Count,
                EnrolledCount = _db.Enrollments.Count(e => e.CourseID == c.CourseID),
                Instructors = _db.ClassSections
                    .Where(cs => cs.CourseID == c.CourseID && cs.InstructorID != null)
                    .Select(cs => cs.Instructor!)
                    .Distinct()
                    .Select(ins => new { 
                        InstructorID = ins.Id, 
                        Name = ins.FirstName + " " + ins.LastName 
                    })
                    .ToList()
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Operator,SuperAdmin")]
    public async Task<IActionResult> Create(CreateCourseDto dto)
    {
        var course = new Course
        {
            TenantID = TenantId,
            Title = dto.Title,
            Description = dto.Description,
            CategoryID = dto.CategoryID,
            CreatedByUserID = Guid.Parse(User.FindFirst("uid")!.Value),
            Status = "Draft",
            IsPublished = false,
            IsHidden = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Courses.Add(course);
        await _db.SaveChangesAsync();

        return Ok(course);
    }

    // TOGGLE PUBLISH
    [HttpPatch("{id}/publish")]
    [Authorize(Roles = "Admin,Operator,SuperAdmin")]
    public async Task<IActionResult> TogglePublish(int id)
    {
        var course = await _db.Courses
            .FirstOrDefaultAsync(c => c.CourseID == id && (IsSuperAdmin || c.TenantID == TenantId));

        if (course == null) return NotFound();

        course.IsPublished = !course.IsPublished;
        await _db.SaveChangesAsync();

        await LogAction(_db, course.IsPublished ? "Published Course" : "Unpublished Course", "Course", id.ToString());

        return Ok(new { success = true, isPublished = course.IsPublished });
    }

    // TOGGLE HIDE
    [HttpPatch("{id}/hide")]
    [Authorize(Roles = "Admin,Operator,SuperAdmin")]
    public async Task<IActionResult> ToggleHide(int id)
    {
        var course = await _db.Courses
            .FirstOrDefaultAsync(c => c.CourseID == id && (IsSuperAdmin || c.TenantID == TenantId));

        if (course == null) return NotFound();

        course.IsHidden = !course.IsHidden;
        await _db.SaveChangesAsync();

        await LogAction(_db, course.IsHidden ? "Hid Course" : "Unhid Course", "Course", id.ToString());

        return Ok(new { success = true, isHidden = course.IsHidden });
    }

    // UPDATE STATUS (Ongoing / Finished)
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin,Operator,SuperAdmin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateCourseStatusRequest req)
    {
        var course = await _db.Courses
            .FirstOrDefaultAsync(c => c.CourseID == id && (IsSuperAdmin || c.TenantID == TenantId));

        if (course == null) return NotFound();

        var allowed = new[] { "Draft", "Ongoing", "Finished" };
        if (!allowed.Contains(req.Status))
            return BadRequest(new { message = $"Invalid status. Allowed: {string.Join(", ", allowed)}" });

        course.Status = req.Status;
        await _db.SaveChangesAsync();

        await LogAction(_db, $"Changed Course Status to {req.Status}", "Course", id.ToString());

        return Ok(new { success = true, status = course.Status });
    }

    // GET /api/courses/{id}/roster
    [HttpGet("{id}/roster")]
    public async Task<IActionResult> GetRoster(int id)
    {
        var course = await _db.Courses.FirstOrDefaultAsync(c => c.CourseID == id && (IsSuperAdmin || c.TenantID == TenantId));
        if (course == null) return NotFound(new { message = "Course not found" });

        var instructors = await _db.ClassSections
            .Where(cs => cs.CourseID == id && cs.InstructorID != null)
            .Select(cs => new
            {
                InstructorID = cs.InstructorID!.Value,
                Name = cs.Instructor.FirstName + " " + cs.Instructor.LastName,
                Email = cs.Instructor.Email,
                Role = "Instructor",
                ClassSectionName = cs.Name
            })
            .ToListAsync();

        var students = await _db.Enrollments
            .Include(e => e.Student)
            .Include(e => e.ClassSection)
            .Where(e => e.CourseID == id && e.Status == "Active")
            .Select(e => new
            {
                StudentID = e.StudentID,
                Name = e.Student.FirstName + " " + e.Student.LastName,
                Email = e.Student.Email,
                Role = "Student",
                ClassSectionName = e.ClassSection != null ? e.ClassSection.Name : "Unassigned"
            })
            .ToListAsync();

        return Ok(new
        {
            Instructors = instructors,
            Students = students
        });
    }
}

public class UpdateCourseStatusRequest
{
    public string Status { get; set; } = "";
}
