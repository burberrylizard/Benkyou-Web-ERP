using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class Assessment
    {
        public int AssessmentID { get; set; }

        public int CourseID { get; set; }

        public string Title { get; set; } = string.Empty;
    }
}
