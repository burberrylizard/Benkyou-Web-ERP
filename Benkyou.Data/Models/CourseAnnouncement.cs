using System;
using System.Collections.Generic;

namespace Benkyou.Data.Models
{
    public class CourseAnnouncement
    {
        public int CourseAnnouncementID { get; set; }
        public Guid TenantID { get; set; }

        public int CourseID { get; set; }
        public Course Course { get; set; } = null!;

        public string Title { get; set; } = "";
        public string Body { get; set; } = "";

        public bool AllowReplies { get; set; } = true;

        public Guid AuthorID { get; set; }
        public User Author { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<AnnouncementReply> Replies { get; set; } = new List<AnnouncementReply>();
    }
}
