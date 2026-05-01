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

        public int UserID { get; set; }
        public int CourseID { get; set; }

        public string Status { get; set; } = "Active";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
