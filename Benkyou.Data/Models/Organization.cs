using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class Organization
    {
        public int OrganizationID { get; set; }

        public Guid TenantID { get; set; } = Guid.NewGuid();

        public string TenantCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string LogoUrl { get; set; } = string.Empty;
        public string PrimaryEmail { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
