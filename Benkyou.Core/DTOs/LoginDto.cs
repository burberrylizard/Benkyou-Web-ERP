using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Core.DTOs
{
    public class LoginDto
    {
        public string Identifier { get; set; } = "";
        public string Password { get; set; } = "";
        public string? TenantCode { get; set; }
    }
}
