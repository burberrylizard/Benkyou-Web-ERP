using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Benkyou.Core.DTOs
{
    public class ContentDto
    {
        public int ContentItemID { get; set; }
        public required string Title { get; set; }
        public required string ContentType { get; set; }
        public required string FileUrl { get; set; }
        public string? Body { get; set; }
        public string? Description { get; set; }
    }
}
