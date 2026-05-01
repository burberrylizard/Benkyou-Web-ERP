using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class Notification
    {
        public int NotificationID { get; set; }

        public Guid TenantID { get; set; }

        public int UserID { get; set; }

        public string Message { get; set; } = string.Empty;

        public bool IsRead { get; set; }
    }
}
