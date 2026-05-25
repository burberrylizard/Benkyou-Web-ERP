using System;

namespace Benkyou.Data.Models
{
    public class AnnouncementReply
    {
        public int AnnouncementReplyID { get; set; }
        public Guid TenantID { get; set; }

        public int CourseAnnouncementID { get; set; }
        public CourseAnnouncement Announcement { get; set; } = null!;

        public Guid UserID { get; set; }
        public User User { get; set; } = null!;

        public string Body { get; set; } = "";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
