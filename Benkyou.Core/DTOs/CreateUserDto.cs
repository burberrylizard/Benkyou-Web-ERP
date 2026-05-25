using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Core.DTOs
{
    public class CreateUserDto
    {
        public string Email { get; set; } = "";
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string Password { get; set; } = "";
        public string UserRole { get; set; } = ""; // Admin / Instructor / Student / Operator
        public int? YearEnrolled { get; set; }
        public string? YearLevel { get; set; }
        public string? Program { get; set; }
    }
}
