using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class AuditLog
    {
        public int AuditLogID { get; set; }

        public Guid TenantID { get; set; }

        public Guid UserID { get; set; }

        public string Action { get; set; } = "";
        public string EntityType { get; set; } = "";

        public string EntityID { get; set; } = "";

        public string OldValues { get; set; } = "";
        public string NewValues { get; set; } = "";

        public string IPAddress { get; set; } = "";

        public DateTime CreatedAt { get; set; }
    }
}
