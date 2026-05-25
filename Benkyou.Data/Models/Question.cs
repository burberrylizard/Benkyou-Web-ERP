using System;
using System.Collections.Generic;

namespace Benkyou.Data.Models
{
    public class Question
    {
        public int QuestionID { get; set; }

        public Guid TenantID { get; set; }

        public int AssessmentID { get; set; }
        public Assessment Assessment { get; set; } = null!;

        public string Body { get; set; } = "";

        /// <summary>
        /// "MultipleChoice" or "Essay"
        /// </summary>
        public string QuestionType { get; set; } = "MultipleChoice";

        public decimal Points { get; set; }

        public int SortOrder { get; set; }

        /// <summary>
        /// Optional grading notes for Essay questions (visible to instructor only).
        /// </summary>
        public string? GradingNotes { get; set; }

        public ICollection<QuestionChoice> Choices { get; set; } = new List<QuestionChoice>();
        public ICollection<StudentAnswer> StudentAnswers { get; set; } = new List<StudentAnswer>();
    }
}
