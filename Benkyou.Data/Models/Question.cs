using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class Question
    {
        public int QuestionID { get; set; }

        public int AssessmentID { get; set; }

        public string Text { get; set; } = string.Empty;
    }
}
