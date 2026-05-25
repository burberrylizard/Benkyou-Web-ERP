using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class Subscription
    {
        public int SubscriptionID { get; set; }

        public Guid TenantID { get; set; }
        public int PlanID { get; set; }

        public string Status { get; set; } = string.Empty;

        public DateTime? TrialEndsAt { get; set; }
        public DateTime? BillingCycleStart { get; set; }
        public DateTime? BillingCycleEnd { get; set; }

        public bool AutoRenew { get; set; } = true;

        public string? Notes { get; set; }

        public string? StripeSubscriptionId { get; set; }
        public string? StripeCustomerId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public SubscriptionPlan Plan { get; set; } = null!;
    }
}
