using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class Course
    {
        public int CourseID { get; set; }
        public Guid TenantID { get; set; }

        public string Title { get; set; } = "";
        public string Description { get; set; } = "";

        public int CategoryID { get; set; }
        public Category Category { get; set; } = null!;
        public Guid CreatedByUserID { get; set; }
        public User CreatedBy { get; set; } = null!;

        public string Status { get; set; } = "Draft";

        public bool IsPublished { get; set; } = false;
        public bool IsHidden { get; set; } = false;
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<CourseSection> Sections { get; set; } = new List<CourseSection>();
        public ICollection<CourseInstructor> Instructors { get; set; } = new List<CourseInstructor>();
    }
}
