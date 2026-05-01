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

        public string Action { get; set; } = string.Empty;
        public string EntityName { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
