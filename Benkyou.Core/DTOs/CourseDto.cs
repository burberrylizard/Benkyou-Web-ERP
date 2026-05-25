using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Core.DTOs
{
    public class CourseDto
    {
        public int CourseID { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required string CategoryName { get; set; }
        public required string Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
