using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class CourseInstructor
    {
        public int CourseInstructorID { get; set; }

        public Guid TenantID { get; set; }

        public int CourseID { get; set; }
        public Course Course { get; set; } = null!;

        public Guid InstructorID { get; set; }
        public User Instructor { get; set; } = null!;

        public DateTime AssignedAt { get; set; }
    }
}
