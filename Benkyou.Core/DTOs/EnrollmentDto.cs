using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Core.DTOs
{
    public class EnrollmentDto
    {
        public int EnrollmentID { get; set; }
        public int CourseID { get; set; }
        public required string CourseTitle { get; set; }
        public required string Status { get; set; }
        public DateTime EnrolledAt { get; set; }
        public string? ClassSectionName { get; set; }
    }
}
