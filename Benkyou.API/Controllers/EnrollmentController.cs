using Benkyou.Core.DTOs;
using Benkyou.Data;
using Benkyou.Data.Models;
using Benkyou.Data.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Benkyou.API.Controllers;

[ApiController]
[Route("api/enrollments")]
[Authorize]
public class EnrollmentController : BaseController
{
    private readonly BenkyouDbContext _db;

    public EnrollmentController(BenkyouDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Instructor,Operator,SuperAdmin")]
    public async Task<IActionResult> GetAll()
    {
        var tenantClaim = User.FindFirst("tenantId")?.Value;
        var tenantId = Guid.TryParse(tenantClaim, out var parsedTenantId)
            ? parsedTenantId
            : (Guid?)null;

        if (!IsSuperAdmin && tenantId == null)
            return Unauthorized(new { message = "Invalid or missing tenant context" });

        var isInstructor = User.IsInRole("Instructor");
        var userId = UserId;

        var query = _db.Enrollments
            .Include(e => e.Course)
                .ThenInclude(c => c.Category)
            .Include(e => e.Student)
            .AsQueryable();

        if (!IsSuperAdmin)
            query = query.Where(e => e.TenantID == tenantId);

        if (isInstructor)
        {
            var instructorCourseIds = await _db.Courses
                .Where(c => c.TenantID == TenantId)
                .Select(c => c.CourseID)
                .ToListAsync();
            query = query.Where(e => instructorCourseIds.Contains(e.CourseID));
        }

        var data = await query
            .OrderByDescending(e => e.EnrolledAt)
            .Select(e => new
            {
                e.EnrollmentID,
                e.CourseID,
                CourseTitle = e.Course.Title,
                CategoryName = e.Course.Category.Name,
                e.StudentID,
                StudentName = e.Student.FirstName + " " + e.Student.LastName,
                StudentEmail = e.Student.Email,
                e.Status,
                e.EnrolledAt,
                e.CompletedAt,
                e.DeadlineAt,
                ClassSectionName = e.ClassSection != null ? e.ClassSection.Name : "Unassigned",
                ProgressPercent = e.Status == "Completed" ? 100.0 :
                    (_db.CourseSections
                        .Where(cs => cs.CourseID == e.CourseID && cs.IsActive)
                        .SelectMany(cs => cs.Contents.Where(c => c.IsActive)).Any()
                    ? (_db.ContentProgresses.Count(cp => cp.EnrollmentID == e.EnrollmentID) * 100.0 /
                        _db.CourseSections
                            .Where(cs => cs.CourseID == e.CourseID && cs.IsActive)
                            .SelectMany(cs => cs.Contents.Where(c => c.IsActive)).Count())
                    : 0.0)
            })
            .ToListAsync();

        return Ok(data);
    }

    // 🟩 ENROLL (Self)
    [HttpPost]
    [Authorize(Roles = "Student,Member,4,SuperAdmin")]
    public async Task<IActionResult> Enroll(EnrollDto dto)
    {
        var course = await _db.Courses
            .FirstOrDefaultAsync(c =>
                c.CourseID == dto.CourseID &&
                (IsSuperAdmin || c.TenantID == TenantId));

        if (course == null)
            return NotFound(new { message = "Course not found" });

        var exists = await _db.Enrollments
            .AnyAsync(e =>
                e.CourseID == dto.CourseID &&
                e.StudentID == UserId);

        if (exists)
            return BadRequest(new { message = "Already enrolled" });

        var enrollment = new Enrollment
        {
            TenantID = course.TenantID,
            CourseID = dto.CourseID,
            StudentID = UserId,
            Status = "Active",
            EnrolledAt = DateTime.UtcNow
        };

        _db.Enrollments.Add(enrollment);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            data = enrollment
        });
    }

    // 🟩 ADMIN ENROLL (Specific Student)
    [HttpPost("admin-enroll")]
    [Authorize(Roles = "Admin,Operator,SuperAdmin")]
    public async Task<IActionResult> AdminEnroll(AdminEnrollDto dto)
    {
        var course = await _db.Courses
            .FirstOrDefaultAsync(c =>
                c.CourseID == dto.CourseID &&
                (IsSuperAdmin || c.TenantID == TenantId));

        if (course == null)
            return NotFound(new { message = "Course not found" });

        var student = await _db.Users
            .FirstOrDefaultAsync(u => 
                u.Id == dto.StudentID && 
                (IsSuperAdmin || u.TenantID == TenantId));

        if (student == null)
            return BadRequest(new { message = "Student not found or not in your organization" });

        var exists = await _db.Enrollments
            .AnyAsync(e =>
                e.CourseID == dto.CourseID &&
                e.StudentID == dto.StudentID);

        if (exists)
            return BadRequest(new { message = "Student already enrolled" });

        var enrollment = new Enrollment
        {
            TenantID = course.TenantID,
            CourseID = dto.CourseID,
            StudentID = dto.StudentID,
            ClassSectionID = dto.ClassSectionID,
            Status = "Active",
            EnrolledAt = DateTime.UtcNow
        };

        _db.Enrollments.Add(enrollment);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            data = enrollment
        });
    }

    // 🟦 MY COURSES
    [HttpGet("my-courses")]
    [Authorize(Roles = "Student,Member,4,SuperAdmin")]
    public async Task<IActionResult> MyCourses()
    {
        var data = await _db.Enrollments
            .Where(e => e.StudentID == UserId)
            .Select(e => new EnrollmentDto
            {
                EnrollmentID = e.EnrollmentID,
                CourseID = e.CourseID,
                CourseTitle = e.Course.Title,
                Status = e.Status,
                EnrolledAt = e.EnrolledAt,
                ClassSectionName = e.ClassSection != null ? e.ClassSection.Name : "Unassigned"
            })
            .ToListAsync();

        return Ok(data);
    }

    // 🟨 COURSE CONTENT
    [HttpGet("course/{courseId}/content")]
    [Authorize(Roles = "Student,Member,4,SuperAdmin")]
    public async Task<IActionResult> GetCourseContent(int courseId)
    {
        var enrolled = await _db.Enrollments
            .AnyAsync(e =>
                e.CourseID == courseId &&
                e.StudentID == UserId);

        if (!enrolled)
            return Unauthorized(new { message = "Not enrolled" });

        var sections = await _db.CourseSections
            .Where(s => s.CourseID == courseId)
            .Select(s => new SectionDto
            {
                SectionID = s.CourseSectionID,
                Title = s.Title,
                Contents = s.Contents
                    .Where(c => !c.IsHidden)
                    .Select(c => new ContentDto
                    {
                        ContentItemID = c.ContentItemID,
                        Title = c.Title,
                        ContentType = c.ContentType,
                        FileUrl = c.FileUrl,
                        Body = c.Body,
                        Description = c.Description
                    }).ToList()
            })
            .ToListAsync();

        return Ok(sections);
    }

    // 🟩 SUBMIT ENROLLMENT REQUEST
    [HttpPost("request")]
    [Authorize(Roles = "Student,Member,4,SuperAdmin")]
    public async Task<IActionResult> SubmitRequest(EnrollDto dto)
    {
        var course = await _db.Courses
            .FirstOrDefaultAsync(c =>
                c.CourseID == dto.CourseID &&
                (IsSuperAdmin || c.TenantID == TenantId));

        if (course == null)
            return NotFound(new { message = "Course not found" });

        var studentId = UserId;

        // ✅ Check 1 — already has a pending request for this course
        var pendingExists = await _db.EnrollmentRequests
            .AnyAsync(r => r.StudentID == studentId
                        && r.CourseID == dto.CourseID
                        && r.Status == EnrollmentRequestStatus.Pending);

        if (pendingExists)
            return BadRequest(new { message = "You already have a pending request for this course." });

        // ✅ Check 2 — already enrolled in this course
        var alreadyEnrolled = await _db.Enrollments
            .AnyAsync(e => e.StudentID == studentId && e.CourseID == dto.CourseID);

        if (alreadyEnrolled)
            return BadRequest(new { message = "You are already enrolled in this course." });

        var request = new EnrollmentRequest
        {
            TenantID = course.TenantID,
            StudentID = studentId,
            CourseID = dto.CourseID,
            Status = EnrollmentRequestStatus.Pending,
            RequestedAt = DateTime.UtcNow
        };

        _db.EnrollmentRequests.Add(request);
        await _db.SaveChangesAsync();

        return Ok(new { success = true, data = request });
    }

    // 🟩 GET ENROLLMENT REQUESTS
    [HttpGet("requests")]
    [Authorize(Roles = "Admin,Operator,SuperAdmin")]
    public async Task<IActionResult> GetRequests()
    {
        var query = _db.EnrollmentRequests
            .Include(r => r.Course)
            .Include(r => r.Student)
            .AsQueryable();

        if (!IsSuperAdmin)
        {
            query = query.Where(r => r.TenantID == TenantId);
        }

        var data = await query
            .OrderByDescending(r => r.RequestedAt)
            .Select(r => new
            {
                r.Id,
                r.CourseID,
                CourseTitle = r.Course.Title,
                r.StudentID,
                StudentName = r.Student.FirstName + " " + r.Student.LastName,
                StudentEmail = r.Student.Email,
                Status = r.Status.ToString(),
                r.RequestedAt,
                r.ReviewedAt,
                r.ReviewedByUserID,
                r.RejectionReason
            })
            .ToListAsync();

        return Ok(data);
    }

    // 🟩 APPROVE ENROLLMENT REQUEST
    [HttpPut("requests/{id}/approve")]
    [Authorize(Roles = "Admin,Operator,SuperAdmin")]
    public async Task<IActionResult> ApproveRequest(int id, [FromQuery] int? classSectionId = null)
    {
        var request = await _db.EnrollmentRequests
            .Include(r => r.Course)
            .FirstOrDefaultAsync(r => r.Id == id && (IsSuperAdmin || r.TenantID == TenantId));

        if (request == null)
            return NotFound(new { message = "Request not found" });

        if (request.Status != EnrollmentRequestStatus.Pending)
            return BadRequest(new { message = "Request is already processed" });

        request.Status = EnrollmentRequestStatus.Approved;
        request.ReviewedAt = DateTime.UtcNow;
        request.ReviewedByUserID = UserId;

        // Check if already enrolled to prevent duplicate enrollment
        var alreadyEnrolled = await _db.Enrollments
            .AnyAsync(e => e.StudentID == request.StudentID && e.CourseID == request.CourseID);

        if (!alreadyEnrolled)
        {
            var enrollment = new Enrollment
            {
                TenantID = request.TenantID,
                CourseID = request.CourseID,
                StudentID = request.StudentID,
                ClassSectionID = classSectionId,
                Status = "Active",
                EnrolledAt = DateTime.UtcNow
            };
            _db.Enrollments.Add(enrollment);
        }

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // 🟩 REJECT ENROLLMENT REQUEST
    [HttpPut("requests/{id}/reject")]
    [Authorize(Roles = "Admin,Operator,SuperAdmin")]
    public async Task<IActionResult> RejectRequest(int id, [FromBody] RejectRequestDto dto)
    {
        var request = await _db.EnrollmentRequests
            .FirstOrDefaultAsync(r => r.Id == id && (IsSuperAdmin || r.TenantID == TenantId));

        if (request == null)
            return NotFound(new { message = "Request not found" });

        if (request.Status != EnrollmentRequestStatus.Pending)
            return BadRequest(new { message = "Request is already processed" });

        request.Status = EnrollmentRequestStatus.Rejected;
        request.ReviewedAt = DateTime.UtcNow;
        request.ReviewedByUserID = UserId;
        request.RejectionReason = dto.RejectionReason;

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // 🟩 UNENROLL / REMOVE STUDENT FROM COURSE
    [HttpDelete("course/{courseId}/student/{studentId}")]
    [Authorize(Roles = "Operator,Admin,SuperAdmin")]
    public async Task<IActionResult> UnenrollStudent(int courseId, Guid studentId)
    {
        var enrollment = await _db.Enrollments
            .FirstOrDefaultAsync(e => e.CourseID == courseId && e.StudentID == studentId && (IsSuperAdmin || e.TenantID == TenantId));

        if (enrollment == null)
            return NotFound(new { message = "Enrollment not found" });

        // Clear associated student ContentProgress records to avoid restrict foreign key constraints
        var progresses = await _db.Set<ContentProgress>()
            .Where(cp => cp.EnrollmentID == enrollment.EnrollmentID)
            .ToListAsync();

        _db.Set<ContentProgress>().RemoveRange(progresses);

        _db.Enrollments.Remove(enrollment);
        await _db.SaveChangesAsync();

        await LogAction(_db, "Operator Unenrolled Student", "Enrollment", enrollment.EnrollmentID.ToString(), studentId, TenantId);

        return Ok(new { success = true });
    }
}

public class RejectRequestDto
{
    public string? RejectionReason { get; set; }
}
