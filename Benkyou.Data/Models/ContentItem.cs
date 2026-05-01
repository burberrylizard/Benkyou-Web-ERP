using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class ContentItem
    {
        public int ContentItemID { get; set; }

        public int CourseSectionID { get; set; }

        public string Title { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;

        public string? Content { get; set; }
        public string? FileUrl { get; set; }

        public int SortOrder { get; set; }
    }
}
