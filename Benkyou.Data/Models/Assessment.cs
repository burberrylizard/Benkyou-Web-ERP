using System;
using System.Collections.Generic;

namespace Benkyou.Data.Models
{
    public class Assessment
    {
        public int AssessmentID { get; set; }

        public Guid TenantID { get; set; }

        public int CourseID { get; set; }
        public Course Course { get; set; } = null!;

        public string Title { get; set; } = "";
        public string Type { get; set; } = "";

        public int TimeLimitMinutes { get; set; }

        public decimal PassingScore { get; set; }

        public int MaxAttempts { get; set; } = 1;

        public bool ShuffleQuestions { get; set; }
        
        public string ShowAnswersAfter { get; set; } = "Submission"; // "Submission" | "Never"

        public string Status { get; set; } = "Draft"; // "Draft" | "Published"

        public DateTime? DueDate { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Question> Questions { get; set; } = new List<Question>();
        public ICollection<StudentAttempt> Attempts { get; set; } = new List<StudentAttempt>();
    }
}
