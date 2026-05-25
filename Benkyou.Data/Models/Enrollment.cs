using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class Enrollment
    {
        public int EnrollmentID { get; set; }

        public Guid TenantID { get; set; }

        public int CourseID { get; set; }
        public Course Course { get; set; } = null!;

        public Guid StudentID { get; set; }
        public User Student { get; set; } = null!;

        public string Status { get; set; } = "Active";

        public int? ClassSectionID { get; set; }
        public ClassSection? ClassSection { get; set; }

        public DateTime EnrolledAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? DeadlineAt { get; set; }
    }
}
