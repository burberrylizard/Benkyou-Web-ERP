using System;

namespace Benkyou.Data.Models
{
    public class StudentAnswer
    {
        public int StudentAnswerID { get; set; }

        public int StudentAttemptID { get; set; }
        public StudentAttempt Attempt { get; set; } = null!;

        public int QuestionID { get; set; }
        public Question Question { get; set; } = null!;

        /// <summary>
        /// Selected option ID for MultipleChoice questions. Null for Essay.
        /// </summary>
        public int? SelectedChoiceID { get; set; }

        /// <summary>
        /// Free-text response for Essay questions. Null for MultipleChoice.
        /// </summary>
        public string? EssayAnswer { get; set; }

        /// <summary>
        /// Manual score assigned by instructor for Essay questions.
        /// </summary>
        public decimal? ManualScore { get; set; }

        /// <summary>
        /// Instructor feedback/comments for Essay questions.
        /// </summary>
        public string? InstructorFeedback { get; set; }

        /// <summary>
        /// Auto-scored for MC, manual for Essay.
        /// </summary>
        public bool? IsCorrect { get; set; }
    }
}
