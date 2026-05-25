using System;

namespace Benkyou.Data.Models
{
    public class BatchEnrollmentLog
    {
        public int Id { get; set; }
        public Guid TenantID { get; set; }

        public int CourseID { get; set; }
        public Course Course { get; set; } = null!;

        public Guid EnrolledByUserID { get; set; }
        public User EnrolledByUser { get; set; } = null!;

        public string? FilterProgram { get; set; }
        public string? FilterYearLevel { get; set; }
        public int StudentsEnrolled { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
