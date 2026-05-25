using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class ContentProgress
    {
        public int ContentProgressID { get; set; }

        public Guid TenantID { get; set; }

        public int EnrollmentID { get; set; }
        public Enrollment Enrollment { get; set; } = null!;

        public int ContentItemID { get; set; }
        public ContentItem Content { get; set; } = null!;

        public bool IsCompleted { get; set; }

        public DateTime? CompletedAt { get; set; }

        public int TimeSpentSeconds { get; set; }
    }
}
