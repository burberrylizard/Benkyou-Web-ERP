using System;

namespace Benkyou.Core.DTOs
{
    public class AdminEnrollDto
    {
        public int CourseID { get; set; }
        public Guid StudentID { get; set; }
        public int? ClassSectionID { get; set; }
    }
}
