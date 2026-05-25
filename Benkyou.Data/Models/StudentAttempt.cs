using System;
using System.Collections.Generic;

namespace Benkyou.Data.Models
{
    public class StudentAttempt
    {
        public int StudentAttemptID { get; set; }

        public Guid TenantID { get; set; }

        public int AssessmentID { get; set; }
        public Assessment Assessment { get; set; } = null!;

        public Guid StudentID { get; set; }
        public User Student { get; set; } = null!;

        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? SubmittedAt { get; set; }

        public decimal? Score { get; set; }
        public int AttemptNumber { get; set; } = 1;

        /// <summary>
        /// "InProgress", "Submitted", "Graded"
        /// </summary>
        public string Status { get; set; } = "InProgress";

        public ICollection<StudentAnswer> Answers { get; set; } = new List<StudentAnswer>();
    }
}
