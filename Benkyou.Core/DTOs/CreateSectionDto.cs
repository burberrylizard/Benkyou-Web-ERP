using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Core.DTOs
{
    public class CreateCourseSectionDto
    {
        public int CourseID { get; set; }
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
    }
}
