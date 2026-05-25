using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Benkyou.Data.Enums;

namespace Benkyou.Data.Models
{
    public class ContentItem
    {
        public int ContentItemID { get; set; }

        public Guid TenantID { get; set; }

        public int CourseSectionID { get; set; }
        public CourseSection Section { get; set; } = null!;

        public string Title { get; set; } = "";
        public string ContentType { get; set; } = "";

        public ContentTypeEnum Type { get; set; }
        public string Value { get; set; } = "";
        public string? Description { get; set; }

        public string Body { get; set; } = "";
        public string FileUrl { get; set; } = "";

        public int SortOrder { get; set; }

        public bool IsHidden { get; set; } = false;
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
