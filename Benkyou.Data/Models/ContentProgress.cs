using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class ContentProgress
    {
        public int ContentProgressID { get; set; }

        public int UserID { get; set; }
        public int ContentItemID { get; set; }

        public bool IsCompleted { get; set; }
    }
}
