using Benkyou.Data;
using Benkyou.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Benkyou.API.Controllers
{
    [ApiController]
    [Route("api/class-sections")]
    [Authorize]
    public class ClassSectionsController(BenkyouDbContext db) : BaseController
    {
        private readonly BenkyouDbContext _db = db;

        // GET /api/class-sections/course/{courseId}
        [HttpGet("course/{courseId}")]
        public async Task<IActionResult> GetByCourse(int courseId)
        {
            var course = await _db.Courses.FirstOrDefaultAsync(c => c.CourseID == courseId && (IsSuperAdmin || c.TenantID == TenantId));
            if (course == null) return NotFound("Course not found");

            var sections = await _db.ClassSections
                .Include(s => s.Instructor)
                .Where(s => s.CourseID == courseId && (IsSuperAdmin || s.TenantID == TenantId))
                .Select(s => new
                {
                    s.ClassSectionID,
                    s.Name,
                    s.Capacity,
                    s.CreatedAt,
                    s.InstructorID,
                    InstructorName = s.Instructor != null ? s.Instructor.FirstName + " " + s.Instructor.LastName : "Unassigned",
                    EnrolledCount = _db.Enrollments.Count(e => e.ClassSectionID == s.ClassSectionID && e.Status == "Active")
                })
                .ToListAsync();

            return Ok(sections);
        }

        // POST /api/class-sections
        [HttpPost]
        [Authorize(Roles = "Operator")]
        public async Task<IActionResult> Create([FromBody] CreateClassSectionRequest req)
        {
            var course = await _db.Courses.FirstOrDefaultAsync(c => c.CourseID == req.CourseId && (IsSuperAdmin || c.TenantID == TenantId));
            if (course == null) return NotFound("Course not found");

            var section = new ClassSection
            {
                CourseID = req.CourseId,
                TenantID = TenantId,
                Name = req.Name.Trim(),
                Capacity = req.Capacity,
                InstructorID = req.InstructorId,
                CreatedAt = DateTime.UtcNow
            };

            _db.ClassSections.Add(section);
            await _db.SaveChangesAsync();

            var instructorName = "Unassigned";
            if (section.InstructorID != null)
            {
                var instructor = await _db.Users.FindAsync(section.InstructorID);
                if (instructor != null)
                {
                    instructorName = instructor.FirstName + " " + instructor.LastName;
                }
            }

            return Ok(new
            {
                section.ClassSectionID,
                section.Name,
                section.Capacity,
                section.CreatedAt,
                section.InstructorID,
                InstructorName = instructorName,
                EnrolledCount = 0
            });
        }

        // PUT /api/class-sections/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Operator")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateClassSectionRequest req)
        {
            var section = await _db.ClassSections
                .FirstOrDefaultAsync(s => s.ClassSectionID == id && (IsSuperAdmin || s.TenantID == TenantId));

            if (section == null) return NotFound("Section not found");

            section.Name = req.Name.Trim();
            section.Capacity = req.Capacity;
            section.InstructorID = req.InstructorId;

            await _db.SaveChangesAsync();

            var instructorName = "Unassigned";
            if (section.InstructorID != null)
            {
                var instructor = await _db.Users.FindAsync(section.InstructorID);
                if (instructor != null)
                {
                    instructorName = instructor.FirstName + " " + instructor.LastName;
                }
            }

            return Ok(new
            {
                section.ClassSectionID,
                section.Name,
                section.Capacity,
                section.CreatedAt,
                section.InstructorID,
                InstructorName = instructorName,
                EnrolledCount = _db.Enrollments.Count(e => e.ClassSectionID == section.ClassSectionID && e.Status == "Active")
            });
        }

        // DELETE /api/class-sections/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Operator")]
        public async Task<IActionResult> Delete(int id)
        {
            var section = await _db.ClassSections.FirstOrDefaultAsync(s => s.ClassSectionID == id && (IsSuperAdmin || s.TenantID == TenantId));
            if (section == null) return NotFound("Section not found");

            // Null out any student enrollments in this section before deleting!
            var enrollments = await _db.Enrollments.Where(e => e.ClassSectionID == id).ToListAsync();
            foreach (var e in enrollments)
            {
                e.ClassSectionID = null;
            }

            _db.ClassSections.Remove(section);
            await _db.SaveChangesAsync();

            return Ok(new { success = true });
        }
    }

    public class CreateClassSectionRequest
    {
        public int CourseId { get; set; }
        public string Name { get; set; } = "";
        public int Capacity { get; set; } = 40;
        public Guid? InstructorId { get; set; }
    }

    public class UpdateClassSectionRequest
    {
        public string Name { get; set; } = "";
        public int Capacity { get; set; } = 40;
        public Guid? InstructorId { get; set; }
    }
}
