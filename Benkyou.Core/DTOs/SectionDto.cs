using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Core.DTOs
{
    public class SectionDto
    {
        public int SectionID { get; set; }
        public required string Title { get; set; }
        public required List<ContentDto> Contents { get; set; }
    }
}
