using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class InstructorProfile
    {
        public int InstructorProfileID { get; set; }

        public int UserID { get; set; }
        public Guid TenantID { get; set; }

        public string? EmployeeNumber { get; set; }
        public string? Department { get; set; }

        public User User { get; set; } = null!;
    }
}
