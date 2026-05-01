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

        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }

        public int CategoryID { get; set; }
        public int CreatedByUserID { get; set; }

        public bool IsActive { get; set; } = true;

        public ICollection<CourseSection> Sections { get; set; } = new List<CourseSection>();
    }
}
