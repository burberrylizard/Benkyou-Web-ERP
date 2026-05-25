using System;
using System.Collections.Generic;

namespace Benkyou.Data.Models
{
    public class ClassSection
    {
        public int ClassSectionID { get; set; }
        public Guid TenantID { get; set; }

        public int CourseID { get; set; }
        public Course Course { get; set; } = null!;

        public string Name { get; set; } = "";
        public int Capacity { get; set; } = 40;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Guid? InstructorID { get; set; }
        public User? Instructor { get; set; }

        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    }
}
