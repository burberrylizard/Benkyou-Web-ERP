using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Data.Models
{
    public class QuestionChoice
    {
        public int QuestionChoiceID { get; set; }

        public int QuestionID { get; set; }

        public string Text { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
    }
}
