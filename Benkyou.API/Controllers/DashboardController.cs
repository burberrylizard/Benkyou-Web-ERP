using Benkyou.Data;
using Benkyou.Data.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Benkyou.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController(BenkyouDbContext db) : BaseController
{
    private readonly BenkyouDbContext _db = db;

    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        var tenantId = TenantId;

        if (!IsSuperAdmin && tenantId == Guid.Empty)
            return Unauthorized(new { message = "Invalid or missing tenant context" });

        var users = _db.Users.AsQueryable();
        var courses = _db.Courses.AsQueryable();
        var enrollments = _db.Enrollments.AsQueryable();
        var assessments = _db.Assessments.AsQueryable();
        var notifications = _db.Notifications.AsQueryable();

        if (!IsSuperAdmin)
        {
            var isInstructor = User.IsInRole("Instructor");
            var isStudent = User.IsInRole("Student");
            var userId = Guid.Parse(User.FindFirst("uid")!.Value);

            users = users.Where(u => u.TenantID == tenantId);
            notifications = notifications.Where(n => n.TenantID == tenantId);

            if (isInstructor)
            {
                courses = courses.Where(c => c.CreatedByUserID == userId);
                var courseIds = await courses.Select(c => c.CourseID).ToListAsync();
                enrollments = enrollments.Where(e => courseIds.Contains(e.CourseID));
                assessments = assessments.Where(a => courseIds.Contains(a.CourseID));
            }
            else if (isStudent)
            {
                var enrolledCourseIds = await _db.Enrollments
                    .Where(e => e.StudentID == userId)
                    .Select(e => e.CourseID)
                    .ToListAsync();

                courses = courses.Where(c => enrolledCourseIds.Contains(c.CourseID));
                enrollments = enrollments.Where(e => e.StudentID == userId);
                assessments = assessments.Where(a => enrolledCourseIds.Contains(a.CourseID));
                notifications = notifications.Where(n => n.UserID == userId);
            }
            else
            {
                courses = courses.Where(c => c.TenantID == tenantId);
                enrollments = enrollments.Where(e => e.TenantID == tenantId);
                assessments = assessments.Where(a => a.TenantID == tenantId);
            }
        }

        var organization = (IsSuperAdmin && tenantId == Guid.Empty)
            ? null
            : await _db.Organizations
                .Where(o => o.TenantID == tenantId)
                .Select(o => new
                {
                    o.TenantID,
                    o.TenantCode,
                    o.Name,
                    o.PrimaryEmail,
                    o.IsActive
                })
                .FirstOrDefaultAsync();

        var currentUserId = User.FindFirst("uid")?.Value;
        var currentUser = Guid.TryParse(currentUserId, out var parsedUserId)
            ? await _db.Users
                .Where(u => u.Id == parsedUserId)
                .Select(u => new
                {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    Role = u.Role.ToString(),
                    u.IsActive
                })
                .FirstOrDefaultAsync()
            : null;

        var totalUsers = await users.CountAsync();
        var activeUsers = await users.CountAsync(u => u.IsActive);
        var instructors = await users.CountAsync(u => u.Role == UserRole.Instructor);
        var students = await users.CountAsync(u => u.Role == UserRole.Student);
        var totalCourses = await courses.CountAsync(c => c.IsActive);
        var publishedCourses = await courses.CountAsync(c => c.IsActive && c.Status == "Published");
        var draftCourses = await courses.CountAsync(c => c.IsActive && c.Status == "Draft");
        var totalEnrollments = await enrollments.CountAsync();
        var activeEnrollments = await enrollments.CountAsync(e => e.Status == "Active");
        var completedEnrollments = await enrollments.CountAsync(e => e.Status == "Completed");
        var totalAssessments = await assessments.CountAsync(a => a.IsActive);
        var unreadNotifications = Guid.TryParse(currentUserId, out parsedUserId)
            ? await notifications.CountAsync(n => n.UserID == parsedUserId && !n.IsRead)
            : 0;

        var recentUsers = await users
            .OrderByDescending(u => u.CreatedAt)
            .Take(5)
            .Select(u => new
            {
                u.Id,
                Name = u.FirstName + " " + u.LastName,
                u.Email,
                Role = u.Role.ToString(),
                Status = u.IsActive ? "Active" : "Inactive",
                u.CreatedAt
            })
            .ToListAsync();

        var recentCourses = await courses
            .Include(c => c.Category)
            .OrderByDescending(c => c.CreatedAt)
            .Take(5)
            .Select(c => new
            {
                c.CourseID,
                c.Title,
                c.Status,
                CategoryName = c.Category.Name,
                c.CreatedAt,
                EnrollmentCount = enrollments.Count(e => e.CourseID == c.CourseID)
            })
            .ToListAsync();

        var recentNotifications = await notifications
            .OrderByDescending(n => n.CreatedAt)
            .Take(5)
            .Select(n => new
            {
                n.NotificationID,
                n.Title,
                n.Message,
                n.Type,
                n.IsRead,
                n.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            organization,
            currentUser,
            stats = new
            {
                totalUsers,
                activeUsers,
                instructors,
                students,
                totalCourses,
                publishedCourses,
                draftCourses,
                totalEnrollments,
                activeEnrollments,
                completedEnrollments,
                totalAssessments,
                unreadNotifications
            },
            recentUsers,
            recentCourses,
            recentNotifications
        });
    }

    [HttpGet("analytics")]
    public async Task<IActionResult> Analytics()
    {
        var tenantId = TenantId;
        if (!IsSuperAdmin && tenantId == Guid.Empty)
            return Unauthorized(new { message = "Invalid or missing tenant context" });

        var enrollments = _db.Enrollments.AsQueryable();
        var courses = _db.Courses.AsQueryable();

        if (!IsSuperAdmin)
        {
            enrollments = enrollments.Where(e => e.TenantID == tenantId);
            courses = courses.Where(c => c.TenantID == tenantId);
        }

        // Enrollment trends (last 6 months)
        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
        var rawTrends = await enrollments
            .Where(e => e.EnrolledAt >= sixMonthsAgo)
            .GroupBy(e => new { e.EnrolledAt.Year, e.EnrolledAt.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Count = g.Count()
            })
            .ToListAsync();

        // ✅ Format in memory after fetching from DB
        var trends = rawTrends
            .Select(g => new
            {
                Month = $"{g.Year}-{g.Month:D2}",  // safe here — in C# memory, not SQL
                Count = g.Count
            })
            .OrderBy(x => x.Month)
            .ToList();

        // Category distribution
        var categoryDist = await courses
            .Include(c => c.Category)
            .GroupBy(c => c.Category.Name)
            .Select(g => new
            {
                name = g.Key,
                value = g.Count()
            })
            .ToListAsync();

        return Ok(new
        {
            trends,
            categoryDist
        });
    }

    [HttpGet("platform-analytics")]
    public async Task<IActionResult> PlatformAnalytics()
    {
        if (!IsSuperAdmin) return Unauthorized();

        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);

        // User Growth
        var userList = await _db.Users
            .Where(u => u.CreatedAt >= sixMonthsAgo)
            .Select(u => new { u.CreatedAt })
            .ToListAsync();

        var userGrowth = Enumerable.Range(0, 6)
            .Select(i => DateTime.UtcNow.AddMonths(-i))
            .Reverse()
            .Select(d => new {
                month = d.ToString("yyyy-MM"),
                users = userList.Count(u => u.CreatedAt.Year == d.Year && u.CreatedAt.Month == d.Month)
            })
            .ToList();

        // Organization Growth
        var orgList = await _db.Organizations
            .Where(o => o.CreatedAt >= sixMonthsAgo)
            .Select(o => new { o.CreatedAt })
            .ToListAsync();

        var orgGrowth = Enumerable.Range(0, 6)
            .Select(i => DateTime.UtcNow.AddMonths(-i))
            .Reverse()
            .Select(d => new {
                month = d.ToString("yyyy-MM"),
                orgs = orgList.Count(o => o.CreatedAt.Year == d.Year && o.CreatedAt.Month == d.Month)
            })
            .ToList();

        // Role Distribution
        var totalUsers = await _db.Users.CountAsync();
        var rawRoleDist = await _db.Users
            .GroupBy(u => u.Role)
            .Select(g => new {
                roleId = (int)g.Key,
                count = g.Count()
            })
            .ToListAsync();

        var roleDist = rawRoleDist.Select(r => new {
            role = ((UserRole)r.roleId).ToString(),
            r.count,
            pct = totalUsers > 0 ? (int)((double)r.count / totalUsers * 100) : 0
        }).ToList();

        // Content Stats
        var contentStats = new[] {
            new { label = "Total courses", value = (await _db.Courses.CountAsync()).ToString(), icon = "📚", bg = "#eff6ff" },
            new { label = "Published", value = (await _db.Courses.CountAsync(c => c.Status == "Published")).ToString(), icon = "✅", bg = "#ecfdf5" },
            new { label = "Assessments", value = (await _db.Assessments.CountAsync()).ToString(), icon = "📝", bg = "#fef3c7" },
            new { label = "Total Enrollments", value = (await _db.Enrollments.CountAsync()).ToString(), icon = "📄", bg = "#f5f3ff" }
        };

        // Top Orgs
        var rawTopOrgs = await _db.Organizations
            .Select(o => new {
                name = o.Name,
                users = _db.Users.Count(u => u.TenantID == o.TenantID),
                courses = _db.Courses.Count(c => c.TenantID == o.TenantID)
            })
            .OrderByDescending(x => x.users)
            .Take(5)
            .ToListAsync();

        var topOrgs = rawTopOrgs.Select(o => new {
            o.name,
            o.users,
            o.courses,
            completionRate = 0
        }).ToList();

        // Dashboard Stats
        var stats = new
        {
            totalOrganizations = await _db.Organizations.CountAsync(),
            activeOrganizations = await _db.Organizations.CountAsync(o => o.IsActive),
            totalUsers = await _db.Users.CountAsync(),
            totalEnrollments = await _db.Enrollments.CountAsync(),
            totalCourses = await _db.Courses.CountAsync(),
            activeSubscriptions = await _db.Organizations.CountAsync(o => o.SubscriptionStatus == "active"),
            incompleteSubscriptions = await _db.Organizations.CountAsync(o => o.SubscriptionStatus == "incomplete"),
            canceledSubscriptions = await _db.Organizations.CountAsync(o => o.SubscriptionStatus == "canceled" || o.SubscriptionStatus == "cancelled"),
            pastDueSubscriptions = await _db.Organizations.CountAsync(o => o.SubscriptionStatus == "past_due")
        };

        var recentOrganizations = await _db.Organizations
            .OrderByDescending(o => o.CreatedAt)
            .Take(5)
            .Select(o => new {
                o.TenantID,
                o.Name,
                o.TenantCode,
                o.PrimaryEmail,
                o.IsActive,
                o.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            stats,
            recentOrganizations,
            userGrowth,
            orgGrowth,
            roleDist,
            contentStats,
            topOrgs
        });
    }
}