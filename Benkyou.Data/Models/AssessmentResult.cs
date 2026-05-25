using System;

namespace Benkyou.Data.Models
{
    public class AssessmentResult
    {
        public int AssessmentResultID { get; set; }
        public Guid TenantID { get; set; }
        
        public int AssessmentID { get; set; }
        public Assessment Assessment { get; set; } = null!;

        public Guid StudentID { get; set; }
        public User Student { get; set; } = null!;

        public decimal Score { get; set; }
        public bool IsPassed { get; set; }
        public DateTime SubmittedAt { get; set; }
        public string Status { get; set; } = "Graded";
    }
}
