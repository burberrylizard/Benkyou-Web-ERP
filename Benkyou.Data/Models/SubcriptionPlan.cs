using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class SubscriptionPlan
    {
        public int PlanID { get; set; }

        public string PlanCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;

        public int MaxUsers { get; set; }
        public int MaxCourses { get; set; }
        public int MaxStorageGB { get; set; }

        public decimal PriceMonthly { get; set; }
        public decimal PriceYearly { get; set; }

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
