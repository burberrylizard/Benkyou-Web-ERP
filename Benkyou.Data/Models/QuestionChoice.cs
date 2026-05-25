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
        public Guid TenantID { get; set; }

        public int QuestionID { get; set; }
        public Question Question { get; set; } = null!;

        public string ChoiceText { get; set; } = "";

        public bool IsCorrect { get; set; }

        public int SortOrder { get; set; }
    }
}
