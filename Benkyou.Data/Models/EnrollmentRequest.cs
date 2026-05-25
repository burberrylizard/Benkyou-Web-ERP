using System;
using Benkyou.Data.Enums;

namespace Benkyou.Data.Models
{
    public class EnrollmentRequest
    {
        public int Id { get; set; }
        public Guid TenantID { get; set; }

        public Guid StudentID { get; set; }
        public User Student { get; set; } = null!;

        public int CourseID { get; set; }
        public Course Course { get; set; } = null!;

        public EnrollmentRequestStatus Status { get; set; } = EnrollmentRequestStatus.Pending;

        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }
        public Guid? ReviewedByUserID { get; set; }
        public User? ReviewedByUser { get; set; }
        public string? RejectionReason { get; set; }
    }
}
