using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class Category
    {
        public int CategoryID { get; set; }
        public Guid TenantID { get; set; }

        public string Name { get; set; } = string.Empty;
    }
}
