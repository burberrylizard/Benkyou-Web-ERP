using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class CourseSection
    {
        public int CourseSectionID { get; set; }
        public int CourseID { get; set; }

        public string Title { get; set; } = string.Empty;
        public int SortOrder { get; set; }

        public ICollection<ContentItem> ContentItems { get; set; } = new List<ContentItem>();
    }
}
