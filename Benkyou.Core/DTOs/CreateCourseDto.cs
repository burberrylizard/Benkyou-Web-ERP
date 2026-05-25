using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Core.DTOs
{
    public class CreateCourseDto
    {
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public int CategoryID { get; set; }
    }
}
