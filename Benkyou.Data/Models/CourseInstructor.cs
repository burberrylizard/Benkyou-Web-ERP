using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class CourseInstructor
    {
        public int CourseInstructorID { get; set; }

        public int CourseID { get; set; }
        public int UserID { get; set; }
    }
}
