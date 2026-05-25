using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class Organization
    {
        public Guid TenantID { get; set; }

        public string TenantCode { get; set; } = "";
        public string Name { get; set; } = "";

        public string LogoUrl { get; set; } = "";
        public string PrimaryEmail { get; set; } = "";

        public string Phone { get; set; } = "";
        public string Address { get; set; } = "";

        public string CountryCode { get; set; } = "";
        public string TimeZone { get; set; } = "";

        public int SubscriptionID { get; set; }

        public bool IsActive { get; set; } = true;

        public string OrganizationType { get; set; } = "HigherEducation"; // HigherEducation, K12, Corporate, General

        // MFA Policies
        public bool IsMfaRequired { get; set; }
        public string AllowedMfaMethods { get; set; } = "Email,Authenticator"; // Comma-separated: Email, Authenticator

        // Stripe Subscription Fields
        public string? StripeCustomerId { get; set; }
        public string? StripeSubscriptionId { get; set; }
        public string? SubscriptionStatus { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
