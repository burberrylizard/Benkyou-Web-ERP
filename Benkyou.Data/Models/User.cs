using Benkyou.Data.Enums;
using Microsoft.AspNetCore.Identity;

namespace Benkyou.Data.Models
{
    public class User : IdentityUser<Guid>
    {
        public Guid TenantID { get; set; }

        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";

        public UserRole Role { get; set; }

        public int? YearEnrolled { get; set; }
        public string? YearLevel { get; set; }
        public string? Program { get; set; }

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Terms and Conditions
        public bool TermsAccepted { get; set; }
        public string? TermsVersion { get; set; }
        public DateTime? TermsAcceptedAt { get; set; }
        public string? TermsAcceptedIp { get; set; }

        // Profile Photo
        public string? ProfilePhotoUrl { get; set; }
        public string? ProfilePhotoPublicId { get; set; }

        // Lockout Tracking
        public int FailedLoginAttempts { get; set; } = 0;
        public bool IsLockedOut { get; set; } = false;

        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    }
}
