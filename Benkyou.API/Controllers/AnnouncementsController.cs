using Benkyou.Data;
using Benkyou.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Benkyou.API.Hubs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Benkyou.API.Controllers
{
    [ApiController]
    [Route("api/announcements")]
    [Authorize]
    public class AnnouncementsController(BenkyouDbContext db, IHubContext<NotificationHub> hubContext) : BaseController
    {
        private readonly BenkyouDbContext _db = db;
        private readonly IHubContext<NotificationHub> _hubContext = hubContext;

        // GET /api/announcements/course/{courseId} — list announcements for a course
        [HttpGet("course/{courseId}")]
        public async Task<IActionResult> GetByCourse(int courseId)
        {
            var isStudent = User.IsInRole("Student");
            var userId = UserId;

            // Strict access check for students: Must be enrolled in this course
            if (isStudent && !IsSuperAdmin)
            {
                var isEnrolled = await _db.Enrollments.AnyAsync(e =>
                    e.CourseID == courseId && e.StudentID == userId && e.Status == "Active");
                if (!isEnrolled)
                {
                    return Forbid("You must be enrolled in this course to view announcements.");
                }
            }

            var announcements = await _db.CourseAnnouncements
                .Include(a => a.Author)
                .Include(a => a.Replies.OrderBy(r => r.CreatedAt))
                    .ThenInclude(r => r.User)
                .Where(a => a.CourseID == courseId && (IsSuperAdmin || a.TenantID == TenantId))
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new
                {
                    a.CourseAnnouncementID,
                    a.CourseID,
                    a.Title,
                    a.Body,
                    a.AllowReplies,
                    AuthorName = a.Author.FirstName + " " + a.Author.LastName,
                    a.CreatedAt,
                    Replies = a.Replies.Select(r => new
                    {
                        r.AnnouncementReplyID,
                        r.Body,
                        r.CreatedAt,
                        UserName = r.User.FirstName + " " + r.User.LastName,
                        UserRole = r.User.Role.ToString()
                    })
                })
                .ToListAsync();

            return Ok(announcements);
        }

        // POST /api/announcements/course/{courseId} — create course announcement (Instructors & Admins only)
        [HttpPost("course/{courseId}")]
        [Authorize(Roles = "Admin,Instructor,SuperAdmin")]
        public async Task<IActionResult> Create(int courseId, [FromBody] CreateAnnouncementRequest req)
        {
            var course = await _db.Courses.FirstOrDefaultAsync(c =>
                c.CourseID == courseId && (IsSuperAdmin || c.TenantID == TenantId));

            if (course == null) return NotFound("Course not found");

            var announcement = new CourseAnnouncement
            {
                CourseID = courseId,
                TenantID = TenantId,
                Title = req.Title.Trim(),
                Body = req.Body.Trim(),
                AllowReplies = req.AllowReplies,
                AuthorID = UserId,
                CreatedAt = DateTime.UtcNow
            };

            _db.CourseAnnouncements.Add(announcement);
            await _db.SaveChangesAsync();

            // System notifications disabled per request
            var authorUser = await _db.Users.FindAsync(UserId);

            // Return created announcement
            return Ok(new
            {
                announcement.CourseAnnouncementID,
                announcement.CourseID,
                announcement.Title,
                announcement.Body,
                announcement.AllowReplies,
                AuthorName = authorUser != null ? authorUser.FirstName + " " + authorUser.LastName : "Unknown",
                announcement.CreatedAt,
                Replies = new List<object>()
            });
        }

        // POST /api/announcements/{id}/reply — reply to an announcement
        [HttpPost("{id}/reply")]
        public async Task<IActionResult> Reply(int id, [FromBody] CreateReplyRequest req)
        {
            var announcement = await _db.CourseAnnouncements
                .FirstOrDefaultAsync(a => a.CourseAnnouncementID == id && (IsSuperAdmin || a.TenantID == TenantId));

            if (announcement == null) return NotFound("Announcement not found");

            var isStudent = User.IsInRole("Student");
            var userId = UserId;

            // Student validation checks
            if (isStudent && !IsSuperAdmin)
            {
                // 1. Must be enrolled in this course
                var isEnrolled = await _db.Enrollments.AnyAsync(e =>
                    e.CourseID == announcement.CourseID && e.StudentID == userId && e.Status == "Active");
                if (!isEnrolled)
                {
                    return Forbid("You must be enrolled in this course to reply to announcements.");
                }

                // 2. Check if student replies are allowed by settings
                if (!announcement.AllowReplies)
                {
                    return BadRequest(new { message = "Replies are closed for this announcement." });
                }
            }

            var reply = new AnnouncementReply
            {
                CourseAnnouncementID = id,
                TenantID = TenantId,
                UserID = userId,
                Body = req.Body.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _db.AnnouncementReplies.Add(reply);
            await _db.SaveChangesAsync();

            var user = await _db.Users.FindAsync(userId);
            return Ok(new
            {
                reply.AnnouncementReplyID,
                reply.Body,
                reply.CreatedAt,
                UserName = user != null ? user.FirstName + " " + user.LastName : "Unknown",
                UserRole = user != null ? user.Role.ToString() : "Student"
            });
        }
    }

    public class CreateAnnouncementRequest
    {
        public string Title { get; set; } = "";
        public string Body { get; set; } = "";
        public bool AllowReplies { get; set; } = true;
    }

    public class CreateReplyRequest
    {
        public string Body { get; set; } = "";
    }
}
