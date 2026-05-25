using Benkyou.Data;
using Benkyou.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Benkyou.API.Controllers
{
    [ApiController]
    [Route("api/grades")]
    [Authorize]
    public class GradesController : ControllerBase
    {
        private readonly BenkyouDbContext _db;

        public GradesController(BenkyouDbContext db)
        {
            _db = db;
        }

        private Guid UserId => Guid.Parse(User.FindFirst("uid")!.Value);
        private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);
        private bool IsSuperAdmin => User.FindFirst("isSuperAdmin")?.Value == "true";

        // GET STUDENT GRADES
        [HttpGet("my-grades")]
        [Authorize(Roles = "Student,Member,4")]
        public async Task<IActionResult> GetMyGrades()
        {
            var grades = await _db.AssessmentResults
                .Include(r => r.Assessment)
                .ThenInclude(a => a.Course)
                .Where(r => r.StudentID == UserId)
                .OrderByDescending(r => r.SubmittedAt)
                .Select(r => new
                {
                    r.AssessmentResultID,
                    AssessmentTitle = r.Assessment.Title,
                    CourseTitle = r.Assessment.Course.Title,
                    r.Score,
                    r.IsPassed,
                    r.SubmittedAt,
                    r.Status
                })
                .ToListAsync();

            return Ok(grades);
        }

        // GET ALL GRADES FOR INSTRUCTOR COURSES
        [HttpGet("instructor-grades")]
        [Authorize(Roles = "Admin,Instructor")]
        public async Task<IActionResult> GetInstructorGrades()
        {
            var isInstructor = User.IsInRole("Instructor");
            var userId = UserId;

            var query = _db.AssessmentResults
                .Include(r => r.Assessment)
                .ThenInclude(a => a.Course)
                .Include(r => r.Student)
                .Where(r => IsSuperAdmin || r.TenantID == TenantId);

            if (isInstructor)
            {
                var tenantCourseIds = await _db.Courses
                    .Where(c => c.TenantID == TenantId)
                    .Select(c => c.CourseID)
                    .ToListAsync();

                query = query.Where(r => tenantCourseIds.Contains(r.Assessment.CourseID));
            }

            var grades = await query
                .OrderByDescending(r => r.SubmittedAt)
                .Select(r => new
                {
                    r.AssessmentResultID,
                    AssessmentTitle = r.Assessment.Title,
                    CourseTitle = r.Assessment.Course.Title,
                    StudentName = r.Student.FirstName + " " + r.Student.LastName,
                    StudentEmail = r.Student.Email,
                    r.Score,
                    r.IsPassed,
                    r.SubmittedAt,
                    r.Status,
                    AttemptID = _db.StudentAttempts
                        .Where(a =>
                            a.AssessmentID == r.AssessmentID &&
                            a.StudentID == r.StudentID &&
                            a.Status != "InProgress")
                        .OrderByDescending(a => a.SubmittedAt)
                        .Select(a => a.StudentAttemptID)
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(grades);
        }

        [HttpPost("submit")]
        [Authorize(Roles = "Student,Member,4")]
        public async Task<IActionResult> SubmitAssessment([FromBody] SubmitAssessmentRequest request)
        {
            var assessment = await _db.Assessments
                .Include(a => a.Questions)
                    .ThenInclude(q => q.Choices)
                .FirstOrDefaultAsync(a => a.AssessmentID == request.AssessmentID);

            if (assessment == null) return NotFound("Assessment not found");

            decimal totalPoints = assessment.Questions.Sum(q => q.Points);
            decimal earnedPoints = 0;

            foreach (var answer in request.Answers)
            {
                var question = assessment.Questions.FirstOrDefault(q => q.QuestionID == answer.QuestionID);
                if (question == null) continue;

                var correctChoice = question.Choices.FirstOrDefault(c => c.IsCorrect);
                if (correctChoice != null && correctChoice.QuestionChoiceID == answer.SelectedChoiceID)
                {
                    earnedPoints += question.Points;
                }
            }

            decimal finalScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
            bool isPassed = finalScore >= assessment.PassingScore;

            var result = new AssessmentResult
            {
                TenantID = assessment.TenantID,
                AssessmentID = assessment.AssessmentID,
                StudentID = UserId,
                Score = finalScore,
                IsPassed = isPassed,
                SubmittedAt = DateTime.UtcNow,
                Status = "Graded"
            };

            _db.AssessmentResults.Add(result);
            await _db.SaveChangesAsync();

            return Ok(result);
        }
    }

    public class SubmitAssessmentRequest
    {
        public int AssessmentID { get; set; }
        public List<AnswerSubmission> Answers { get; set; } = new();
    }

    public class AnswerSubmission
    {
        public int QuestionID { get; set; }
        public int SelectedChoiceID { get; set; }
    }
}
