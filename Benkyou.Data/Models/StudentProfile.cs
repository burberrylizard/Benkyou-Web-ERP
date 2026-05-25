using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class StudentProfile
    {
        public int StudentProfileID { get; set; }

        public Guid UserID { get; set; }
        public Guid TenantID { get; set; }

        public string? StudentNumber { get; set; }

        public User User { get; set; } = null!;
    }
}
