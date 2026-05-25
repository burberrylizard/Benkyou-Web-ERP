using Benkyou.Data;
using Benkyou.Data.Models;
using Benkyou.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

namespace Benkyou.API.Controllers;

[ApiController]
[Route("api/assessments")]
[Authorize]
public class AssessmentsController(BenkyouDbContext db, AssessmentBuilderService svc) : BaseController
{
    private readonly BenkyouDbContext _db = db;
    private readonly AssessmentBuilderService _svc = svc;

    // GET /api/assessments — list all assessments for tenant
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var query = _db.Assessments
            .Include(a => a.Course)
            .AsQueryable();

        if (!IsSuperAdmin)
            query = query.Where(a => a.TenantID == TenantId);

        var userId = UserId;

        var data = await query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                a.AssessmentID,
                a.CourseID,
                CourseTitle = a.Course.Title,
                a.Title,
                a.Type,
                a.TimeLimitMinutes,
                a.PassingScore,
                a.MaxAttempts,
                a.ShuffleQuestions,
                a.ShowAnswersAfter,
                a.Status,
                a.DueDate,
                a.IsActive,
                a.CreatedAt,
                a.UpdatedAt,
                AttemptsCount = _db.StudentAttempts.Count(sa => sa.AssessmentID == a.AssessmentID && sa.StudentID == userId),
                BestScore = _db.StudentAttempts.Where(sa => sa.AssessmentID == a.AssessmentID && sa.StudentID == userId && sa.Score != null).Max(sa => (decimal?)sa.Score) ?? 0,
                HasSubmitted = _db.StudentAttempts.Any(sa => sa.AssessmentID == a.AssessmentID && sa.StudentID == userId && sa.Status != "InProgress")
            })
            .ToListAsync();

        return Ok(data);
    }

    // POST /api/assessments — create assessment
    [HttpPost]
    [Authorize(Roles = "Admin,Instructor,SuperAdmin")]
    public async Task<IActionResult> Create([FromBody] CreateAssessmentRequest request)
    {
        var course = await _db.Courses
            .FirstOrDefaultAsync(c =>
                c.CourseID == request.CourseId &&
                (IsSuperAdmin || c.TenantID == TenantId));

        if (course == null)
            return BadRequest(new { message = "Invalid course" });

        var result = await _svc.CreateAssessmentAsync(request.CourseId, course.TenantID, request.Title, request.Type ?? "Quiz");
        return Ok(result);
    }

    // GET /api/assessments/{id} — get assessment with questions
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _svc.GetAssessmentWithQuestionsAsync(id);
        if (result == null) return NotFound("Assessment not found");

        return Ok(new
        {
            result.AssessmentID,
            result.CourseID,
            result.Title,
            result.Type,
            result.TimeLimitMinutes,
            result.PassingScore,
            result.MaxAttempts,
            result.ShuffleQuestions,
            result.ShowAnswersAfter,
            result.Status,
            result.DueDate,
            result.IsActive,
            result.CreatedAt,
            result.UpdatedAt,
            CourseTitle = result.Course?.Title,
            Questions = result.Questions.Select(q => new
            {
                q.QuestionID,
                q.Body,
                q.QuestionType,
                q.Points,
                q.SortOrder,
                q.GradingNotes,
                Choices = q.Choices.Select(c => new
                {
                    c.QuestionChoiceID,
                    c.ChoiceText,
                    c.IsCorrect,
                    c.SortOrder
                })
            })
        });
    }

    // PUT /api/assessments/{id}/settings
    [HttpPut("{id}/settings")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> UpdateSettings(int id, [FromBody] UpdateSettingsRequest dto)
    {
        var result = await _svc.UpdateAssessmentSettingsAsync(id, dto.TimeLimitMinutes, dto.MaxAttempts, dto.PassMarkPercent, dto.ShuffleQuestions, dto.ShowAnswersAfter, dto.DueDate);
        if (result == null) return NotFound("Assessment not found");
        return Ok(result);
    }

    // PUT /api/assessments/{id}/publish
    [HttpPut("{id}/publish")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> Publish(int id)
    {
        var ok = await _svc.PublishAssessmentAsync(id);
        if (!ok) return NotFound("Assessment not found");
        return Ok(new { message = "Assessment published" });
    }

    // DELETE /api/assessments/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _svc.DeleteAssessmentAsync(id);
        if (!ok) return NotFound("Assessment not found");
        return Ok(new { message = "Assessment deleted successfully" });
    }

    // POST /api/assessments/{id}/questions — add question (MC or Essay)
    [HttpPost("{id}/questions")]
    [Authorize(Roles = "Admin,Instructor,SuperAdmin")]
    public async Task<IActionResult> AddQuestion(int id, [FromBody] QuestionRequest dto)
    {
        var options = dto.Options?.Select(o => new ChoiceDto { Text = o.Text, IsCorrect = o.IsCorrect }).ToList();
        var result = await _svc.AddQuestionAsync(id, TenantId, dto.Body, dto.QuestionType, dto.Points, dto.GradingNotes, options);
        return Ok(result);
    }

    // PUT /api/assessments/questions/{questionId}
    [HttpPut("questions/{questionId}")]
    [Authorize(Roles = "Admin,Instructor,SuperAdmin")]
    public async Task<IActionResult> UpdateQuestion(int questionId, [FromBody] QuestionRequest dto)
    {
        var options = dto.Options?.Select(o => new ChoiceDto { Text = o.Text, IsCorrect = o.IsCorrect }).ToList();
        var result = await _svc.UpdateQuestionAsync(questionId, dto.Body, dto.QuestionType, dto.Points, dto.GradingNotes, options);
        if (result == null) return NotFound("Question not found");
        return Ok(result);
    }

    // DELETE /api/assessments/questions/{questionId}
    [HttpDelete("questions/{questionId}")]
    [Authorize(Roles = "Admin,Instructor,SuperAdmin")]
    public async Task<IActionResult> DeleteQuestion(int questionId)
    {
        var ok = await _svc.DeleteQuestionAsync(questionId);
        if (!ok) return NotFound("Question not found");
        return Ok(new { message = "Question deleted" });
    }

    // POST /api/assessments/questions (legacy endpoint — kept for old editor)
    [HttpPost("questions")]
    [Authorize(Roles = "Admin,Instructor,SuperAdmin")]
    public async Task<IActionResult> AddQuestionLegacy([FromBody] Question question)
    {
        var assessment = await _db.Assessments.FindAsync(question.AssessmentID);
        if (assessment == null) return NotFound("Assessment not found");
        question.TenantID = assessment.TenantID;
        _db.Questions.Add(question);
        await _db.SaveChangesAsync();
        return Ok(question);
    }

    // POST /api/assessments/choices (legacy endpoint — kept for old editor)
    [HttpPost("choices")]
    [Authorize(Roles = "Admin,Instructor,SuperAdmin")]
    public async Task<IActionResult> AddChoice([FromBody] QuestionChoice choice)
    {
        var question = await _db.Questions.FindAsync(choice.QuestionID);
        if (question == null) return NotFound("Question not found");
        choice.TenantID = question.TenantID;
        _db.QuestionChoices.Add(choice);
        await _db.SaveChangesAsync();
        return Ok(choice);
    }

    // POST /api/assessments/{id}/attempt — start attempt (student only)
    [HttpPost("{id}/attempt")]
    [Authorize(Roles = "Student,Member,4")]
    public async Task<IActionResult> StartAttempt(int id)
    {
        var (attempt, error) = await _svc.StartAttemptAsync(id, UserId, TenantId);
        if (error != null) return BadRequest(new { message = error });
        return Ok(attempt);
    }
}

// ── Attempts Controller (separate route prefix) ──
[ApiController]
[Route("api/attempts")]
[Authorize]
public class AttemptsController(AssessmentBuilderService svc, BenkyouDbContext db) : BaseController
{
    private readonly AssessmentBuilderService _svc = svc;
    private readonly BenkyouDbContext _db = db;

    // GET /api/attempts/pending-review
    [HttpGet("pending-review")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetPendingReview()
    {
        var query = _db.StudentAttempts
            .Include(a => a.Assessment)
            .Include(a => a.Student)
            .Where(a => a.Status == "PendingReview");

        if (!IsSuperAdmin)
        {
            query = query.Where(a => a.TenantID == TenantId);
        }

        var data = await query
            .OrderBy(a => a.SubmittedAt)
            .Select(a => new
            {
                a.StudentAttemptID,
                a.AssessmentID,
                AssessmentTitle = a.Assessment.Title,
                StudentName = a.Student.FirstName + " " + a.Student.LastName,
                a.AttemptNumber,
                a.SubmittedAt,
                a.Status
            })
            .ToListAsync();

        return Ok(data);
    }

    // POST /api/attempts/{attemptId}/submit
    [HttpPost("{attemptId}/submit")]
    [Authorize(Roles = "Student,Member,4")]
    public async Task<IActionResult> Submit(int attemptId, [FromBody] SubmitRequest dto)
    {
        var answers = dto.Answers.Select(a => new AnswerDto
        {
            QuestionID = a.QuestionID,
            SelectedChoiceID = a.SelectedChoiceID,
            EssayAnswer = a.EssayAnswer
        }).ToList();

        var (success, error) = await _svc.SubmitAttemptAsync(attemptId, answers);
        if (!success) return BadRequest(new { message = error });
        return Ok(new { message = "Attempt submitted successfully" });
    }

    // GET /api/attempts/{attemptId}/result
    [HttpGet("{attemptId}/result")]
    public async Task<IActionResult> GetResult(int attemptId)
    {
        var result = await _svc.GetAttemptResultAsync(attemptId);
        if (result == null) return NotFound("Attempt not found");
        return Ok(result);
    }

    // GET /api/attempts/{attemptId}/review
    [HttpGet("{attemptId}/review")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetReview(int attemptId)
    {
        var attempt = await _db.StudentAttempts
            .Include(a => a.Assessment)
            .Include(a => a.Student)
            .Include(a => a.Answers)
                .ThenInclude(ans => ans.Question)
            .FirstOrDefaultAsync(a => a.StudentAttemptID == attemptId);

        if (attempt == null) return NotFound("Attempt not found");

        if (!IsSuperAdmin && attempt.TenantID != TenantId)
        {
            return Forbid();
        }

        var result = new
        {
            attempt.StudentAttemptID,
            AssessmentTitle = attempt.Assessment.Title,
            StudentName = attempt.Student.FirstName + " " + attempt.Student.LastName,
            attempt.AttemptNumber,
            attempt.SubmittedAt,
            attempt.Status,
            EssayAnswers = attempt.Answers
                .Where(a => a.Question.QuestionType == "Essay")
                .Select(a => new
                {
                    a.StudentAnswerID,
                    a.QuestionID,
                    QuestionText = a.Question.Body,
                    Points = a.Question.Points,
                    GradingNotes = a.Question.GradingNotes,
                    a.EssayAnswer,
                    a.ManualScore,
                    a.InstructorFeedback
                })
                .ToList()
        };

        return Ok(result);
    }

    // PUT /api/attempts/answers/{answerId}/grade
    [HttpPut("answers/{answerId}/grade")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GradeEssay(int answerId, [FromBody] GradeRequest dto)
    {
        var ok = await _svc.GradeEssayAsync(answerId, dto.Score, dto.Feedback);
        if (!ok) return NotFound("Answer not found");
        return Ok(new { message = "Essay graded successfully" });
    }
}

// ── Request DTOs ──
public class CreateAssessmentRequest
{
    public int CourseId { get; set; }
    public string Title { get; set; } = "";
    public string? Type { get; set; }
}

public class UpdateSettingsRequest
{
    public int TimeLimitMinutes { get; set; }
    public int MaxAttempts { get; set; }
    public decimal PassMarkPercent { get; set; }
    public bool ShuffleQuestions { get; set; }
    public string ShowAnswersAfter { get; set; } = "Submission";
    public DateTime? DueDate { get; set; }
}

public class QuestionRequest
{
    public string Body { get; set; } = "";
    public string QuestionType { get; set; } = "MultipleChoice";
    public decimal Points { get; set; }
    public string? GradingNotes { get; set; }
    public List<OptionRequest>? Options { get; set; }
}

public class OptionRequest
{
    public string Text { get; set; } = "";
    public bool IsCorrect { get; set; }
}

public class SubmitRequest
{
    public List<SubmitAnswerRequest> Answers { get; set; } = new();
}

public class SubmitAnswerRequest
{
    public int QuestionID { get; set; }
    public int? SelectedChoiceID { get; set; }
    public string? EssayAnswer { get; set; }
}

public class GradeRequest
{
    public decimal Score { get; set; }
    public string? Feedback { get; set; }
}
