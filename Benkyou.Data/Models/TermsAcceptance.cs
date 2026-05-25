using System;
using System.ComponentModel.DataAnnotations;

namespace Benkyou.Data.Models
{
    public class TermsAcceptance
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserID { get; set; }
        public string TermsVersion { get; set; } = "1.0";
        public DateTime AcceptedAt { get; set; } = DateTime.UtcNow;
        public string IpAddress { get; set; } = "";
        public string UserAgent { get; set; } = "";

        // Navigation property
        public virtual User User { get; set; } = null!;
    }
}
