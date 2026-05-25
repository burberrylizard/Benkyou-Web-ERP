using Benkyou.Data;
using Benkyou.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Benkyou.Core.Services
{
    public class AssessmentBuilderService(BenkyouDbContext db)
    {
        private readonly BenkyouDbContext _db = db;

        // ── CREATE ──
        public async Task<Assessment> CreateAssessmentAsync(int courseId, Guid tenantId, string title, string type = "Quiz")
        {
            var assessment = new Assessment
            {
                CourseID = courseId,
                TenantID = tenantId,
                Title = title,
                Type = type,
                Status = "Draft",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Assessments.Add(assessment);
            await _db.SaveChangesAsync();
            return assessment;
        }

        // ── UPDATE SETTINGS ──
        public async Task<Assessment?> UpdateAssessmentSettingsAsync(int assessmentId, int timeLimitMinutes, int maxAttempts, decimal passMarkPercent, bool shuffleQuestions, string showAnswersAfter, DateTime? dueDate)
        {
            var a = await _db.Assessments.FindAsync(assessmentId);
            if (a == null) return null;

            a.TimeLimitMinutes = timeLimitMinutes;
            a.MaxAttempts = maxAttempts;
            a.PassingScore = passMarkPercent;
            a.ShuffleQuestions = shuffleQuestions;
            a.ShowAnswersAfter = showAnswersAfter;
            a.DueDate = dueDate;
            a.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return a;
        }

        // ── PUBLISH ──
        public async Task<bool> PublishAssessmentAsync(int assessmentId)
        {
            var a = await _db.Assessments.FindAsync(assessmentId);
            if (a == null) return false;
            a.Status = "Published";
            a.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        // ── DELETE ASSESSMENT ──
        public async Task<bool> DeleteAssessmentAsync(int assessmentId)
        {
            var a = await _db.Assessments
                .Include(a => a.Questions)
                    .ThenInclude(q => q.Choices)
                .Include(a => a.Attempts)
                    .ThenInclude(att => att.Answers)
                .FirstOrDefaultAsync(a => a.AssessmentID == assessmentId);
            if (a == null) return false;

            // Remove all student answers first
            foreach (var att in a.Attempts)
            {
                _db.StudentAnswers.RemoveRange(att.Answers);
            }
            // Remove all attempts
            _db.StudentAttempts.RemoveRange(a.Attempts);

            // Remove all question choices
            foreach (var q in a.Questions)
            {
                _db.QuestionChoices.RemoveRange(q.Choices);
            }
            // Remove all questions
            _db.Questions.RemoveRange(a.Questions);

            // Remove assessment itself
            _db.Assessments.Remove(a);

            await _db.SaveChangesAsync();
            return true;
        }

        // ── ADD QUESTION ──
        public async Task<Question> AddQuestionAsync(int assessmentId, Guid tenantId, string body, string questionType, decimal points, string? gradingNotes, List<ChoiceDto>? options)
        {
            var maxOrder = await _db.Questions
                .Where(q => q.AssessmentID == assessmentId)
                .Select(q => (int?)q.SortOrder)
                .MaxAsync() ?? 0;

            var question = new Question
            {
                AssessmentID = assessmentId,
                TenantID = tenantId,
                Body = body,
                QuestionType = questionType,
                Points = points,
                SortOrder = maxOrder + 1,
                GradingNotes = gradingNotes
            };

            _db.Questions.Add(question);
            await _db.SaveChangesAsync();

            if (questionType == "MultipleChoice" && options != null)
            {
                for (int i = 0; i < options.Count; i++)
                {
                    _db.QuestionChoices.Add(new QuestionChoice
                    {
                        QuestionID = question.QuestionID,
                        TenantID = tenantId,
                        ChoiceText = options[i].Text,
                        IsCorrect = options[i].IsCorrect,
                        SortOrder = i + 1
                    });
                }
                await _db.SaveChangesAsync();
            }

            return await _db.Questions
                .Include(q => q.Choices)
                .FirstAsync(q => q.QuestionID == question.QuestionID);
        }

        // ── UPDATE QUESTION ──
        public async Task<Question?> UpdateQuestionAsync(int questionId, string body, string questionType, decimal points, string? gradingNotes, List<ChoiceDto>? options)
        {
            var question = await _db.Questions
                .Include(q => q.Choices)
                .FirstOrDefaultAsync(q => q.QuestionID == questionId);
            if (question == null) return null;

            question.Body = body;
            question.QuestionType = questionType;
            question.Points = points;
            question.GradingNotes = gradingNotes;

            // Remove old choices
            _db.QuestionChoices.RemoveRange(question.Choices);

            // Add new choices if MC
            if (questionType == "MultipleChoice" && options != null)
            {
                for (int i = 0; i < options.Count; i++)
                {
                    _db.QuestionChoices.Add(new QuestionChoice
                    {
                        QuestionID = questionId,
                        TenantID = question.TenantID,
                        ChoiceText = options[i].Text,
                        IsCorrect = options[i].IsCorrect,
                        SortOrder = i + 1
                    });
                }
            }

            await _db.SaveChangesAsync();
            return await _db.Questions.Include(q => q.Choices).FirstAsync(q => q.QuestionID == questionId);
        }

        // ── DELETE QUESTION ──
        public async Task<bool> DeleteQuestionAsync(int questionId)
        {
            var question = await _db.Questions
                .Include(q => q.Choices)
                .FirstOrDefaultAsync(q => q.QuestionID == questionId);
            if (question == null) return false;

            // Clean up any dependent student answers first to prevent FK constraint violations
            var answers = _db.StudentAnswers.Where(sa => sa.QuestionID == questionId);
            _db.StudentAnswers.RemoveRange(answers);

            _db.QuestionChoices.RemoveRange(question.Choices);
            _db.Questions.Remove(question);
            await _db.SaveChangesAsync();
            return true;
        }

        // ── GET ASSESSMENT WITH QUESTIONS ──
        public async Task<Assessment?> GetAssessmentWithQuestionsAsync(int assessmentId)
        {
            return await _db.Assessments
                .Include(a => a.Questions.OrderBy(q => q.SortOrder))
                    .ThenInclude(q => q.Choices.OrderBy(c => c.SortOrder))
                .Include(a => a.Course)
                .FirstOrDefaultAsync(a => a.AssessmentID == assessmentId);
        }

        // ── START ATTEMPT ──
        public async Task<(StudentAttempt? Attempt, string? Error)> StartAttemptAsync(int assessmentId, Guid studentId, Guid tenantId)
        {
            var assessment = await _db.Assessments.FindAsync(assessmentId);
            if (assessment == null) return (null, "Assessment not found.");
            if (assessment.Status != "Published") return (null, "Assessment is not published yet.");
            if (assessment.DueDate.HasValue && DateTime.UtcNow > assessment.DueDate.Value)
                return (null, "This assessment is closed. The due date has passed.");

            var hasSubmittedAttempt = await _db.StudentAttempts
                .AnyAsync(sa => sa.AssessmentID == assessmentId && sa.StudentID == studentId && sa.Status != "InProgress");
            if (hasSubmittedAttempt)
                return (null, "You have already completed this assessment.");

            var existingAttempts = await _db.StudentAttempts
                .CountAsync(a => a.AssessmentID == assessmentId && a.StudentID == studentId);
            if (existingAttempts >= assessment.MaxAttempts)
                return (null, $"Maximum attempts ({assessment.MaxAttempts}) reached.");

            // Check for in-progress attempt
            var inProgress = await _db.StudentAttempts
                .FirstOrDefaultAsync(a => a.AssessmentID == assessmentId && a.StudentID == studentId && a.Status == "InProgress");
            if (inProgress != null) return (inProgress, null);

            var attempt = new StudentAttempt
            {
                AssessmentID = assessmentId,
                StudentID = studentId,
                TenantID = tenantId,
                AttemptNumber = existingAttempts + 1,
                StartedAt = DateTime.UtcNow,
                Status = "InProgress"
            };

            _db.StudentAttempts.Add(attempt);
            await _db.SaveChangesAsync();
            return (attempt, null);
        }

        // ── SUBMIT ATTEMPT ──
        public async Task<(bool Success, string? Error)> SubmitAttemptAsync(int attemptId, List<AnswerDto> answers)
        {
            var attempt = await _db.StudentAttempts
                .Include(a => a.Assessment)
                    .ThenInclude(a => a.Questions)
                        .ThenInclude(q => q.Choices)
                .FirstOrDefaultAsync(a => a.StudentAttemptID == attemptId);

            if (attempt == null) return (false, "Attempt not found.");
            if (attempt.Status != "InProgress") return (false, "Attempt already submitted.");

            decimal totalPoints = attempt.Assessment.Questions.Sum(q => q.Points);
            decimal earnedPoints = 0;
            bool hasEssay = false;

            foreach (var ans in answers)
            {
                var question = attempt.Assessment.Questions.FirstOrDefault(q => q.QuestionID == ans.QuestionID);
                if (question == null) continue;

                var studentAnswer = new StudentAnswer
                {
                    StudentAttemptID = attemptId,
                    QuestionID = ans.QuestionID
                };

                if (question.QuestionType == "MultipleChoice")
                {
                    studentAnswer.SelectedChoiceID = ans.SelectedChoiceID;
                    var correctChoice = question.Choices.FirstOrDefault(c => c.IsCorrect);
                    studentAnswer.IsCorrect = correctChoice != null && correctChoice.QuestionChoiceID == ans.SelectedChoiceID;
                    if (studentAnswer.IsCorrect == true) earnedPoints += question.Points;
                }
                else // Essay
                {
                    studentAnswer.EssayAnswer = ans.EssayAnswer;
                    studentAnswer.IsCorrect = null; // Pending manual grading
                    hasEssay = true;
                }

                _db.StudentAnswers.Add(studentAnswer);
            }

            attempt.SubmittedAt = DateTime.UtcNow;
            attempt.Score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
            attempt.Status = hasEssay ? "PendingReview" : "Graded";

            // Create or update AssessmentResult
            var isPassed = attempt.Score >= attempt.Assessment.PassingScore;
            var result = await _db.AssessmentResults
                .FirstOrDefaultAsync(r => r.AssessmentID == attempt.AssessmentID && r.StudentID == attempt.StudentID);
            if (result == null)
            {
                result = new AssessmentResult
                {
                    TenantID = attempt.TenantID,
                    AssessmentID = attempt.AssessmentID,
                    StudentID = attempt.StudentID,
                    Score = attempt.Score ?? 0,
                    IsPassed = isPassed,
                    SubmittedAt = DateTime.UtcNow,
                    Status = attempt.Status
                };
                _db.AssessmentResults.Add(result);
            }
            else
            {
                result.Score = attempt.Score ?? 0;
                result.IsPassed = isPassed;
                result.SubmittedAt = DateTime.UtcNow;
                result.Status = attempt.Status;
            }

            await _db.SaveChangesAsync();
            return (true, null);
        }

        // ── GRADE ESSAY ──
        public async Task<bool> GradeEssayAsync(int answerId, decimal score, string? feedback)
        {
            var answer = await _db.StudentAnswers
                .Include(a => a.Attempt)
                    .ThenInclude(at => at.Assessment)
                        .ThenInclude(a => a.Questions)
                .Include(a => a.Question)
                .FirstOrDefaultAsync(a => a.StudentAnswerID == answerId);

            if (answer == null) return false;

            answer.ManualScore = score;
            answer.InstructorFeedback = feedback;
            answer.IsCorrect = score > 0;

            // Recalculate total score
            var attempt = answer.Attempt;
            var allAnswers = await _db.StudentAnswers
                .Include(a => a.Question)
                .Where(a => a.StudentAttemptID == attempt.StudentAttemptID)
                .ToListAsync();

            decimal totalPoints = attempt.Assessment.Questions.Sum(q => q.Points);
            decimal earned = 0;
            bool allGraded = true;

            foreach (var a in allAnswers)
            {
                if (a.Question.QuestionType == "MultipleChoice")
                {
                    if (a.IsCorrect == true) earned += a.Question.Points;
                }
                else // Essay
                {
                    if (a.ManualScore.HasValue)
                        earned += a.ManualScore.Value;
                    else
                        allGraded = false;
                }
            }

            attempt.Score = totalPoints > 0 ? (earned / totalPoints) * 100 : 0;
            attempt.Status = allGraded ? "Graded" : "PendingReview";

            // Create or update AssessmentResult after grading essay
            var isPassed = attempt.Score >= attempt.Assessment.PassingScore;
            var result = await _db.AssessmentResults
                .FirstOrDefaultAsync(r => r.AssessmentID == attempt.AssessmentID && r.StudentID == attempt.StudentID);
            if (result == null)
            {
                result = new AssessmentResult
                {
                    TenantID = attempt.TenantID,
                    AssessmentID = attempt.AssessmentID,
                    StudentID = attempt.StudentID,
                    Score = attempt.Score ?? 0,
                    IsPassed = isPassed,
                    SubmittedAt = DateTime.UtcNow,
                    Status = attempt.Status
                };
                _db.AssessmentResults.Add(result);
            }
            else
            {
                result.Score = attempt.Score ?? 0;
                result.IsPassed = isPassed;
                result.SubmittedAt = DateTime.UtcNow;
                result.Status = attempt.Status;
            }

            await _db.SaveChangesAsync();
            return true;
        }

        // ── GET ATTEMPT RESULT ──
        public async Task<object?> GetAttemptResultAsync(int attemptId)
        {
            var attempt = await _db.StudentAttempts
                .Include(a => a.Assessment)
                .Include(a => a.Answers)
                    .ThenInclude(ans => ans.Question)
                        .ThenInclude(q => q.Choices)
                .FirstOrDefaultAsync(a => a.StudentAttemptID == attemptId);

            if (attempt == null) return null;

            var timeTaken = attempt.SubmittedAt.HasValue
                ? (attempt.SubmittedAt.Value - attempt.StartedAt).TotalMinutes
                : 0;

            var correctCount = attempt.Answers.Count(a => a.IsCorrect == true);
            var wrongCount = attempt.Answers.Count(a => a.IsCorrect == false);
            var pendingCount = attempt.Answers.Count(a => a.IsCorrect == null);
            var isPassed = attempt.Score.HasValue && attempt.Score.Value >= attempt.Assessment.PassingScore;

            return new
            {
                attempt.StudentAttemptID,
                attempt.AssessmentID,
                attempt.Score,
                attempt.Status,
                attempt.AttemptNumber,
                attempt.StartedAt,
                attempt.SubmittedAt,
                IsPassed = isPassed,
                TimeTakenMinutes = Math.Round(timeTaken, 1),
                PassMark = attempt.Assessment.PassingScore,
                AssessmentTitle = attempt.Assessment.Title,
                CorrectCount = correctCount,
                WrongCount = wrongCount,
                PendingCount = pendingCount,
                TotalQuestions = attempt.Answers.Count,
                ShowAnswersAfter = attempt.Assessment.ShowAnswersAfter,
                Answers = attempt.Answers.Select(a => new
                {
                    a.StudentAnswerID,
                    a.QuestionID,
                    QuestionText = a.Question.Body,
                    QuestionType = a.Question.QuestionType,
                    Points = a.Question.Points,
                    a.SelectedChoiceID,
                    a.EssayAnswer,
                    a.IsCorrect,
                    a.ManualScore,
                    a.InstructorFeedback,
                    Choices = a.Question.Choices.OrderBy(c => c.SortOrder).Select(c => new
                    {
                        c.QuestionChoiceID,
                        c.ChoiceText,
                        c.IsCorrect
                    })
                })
            };
        }
    }

    // ── DTOs ──
    public class ChoiceDto
    {
        public string Text { get; set; } = "";
        public bool IsCorrect { get; set; }
    }

    public class AnswerDto
    {
        public int QuestionID { get; set; }
        public int? SelectedChoiceID { get; set; }
        public string? EssayAnswer { get; set; }
    }
}
