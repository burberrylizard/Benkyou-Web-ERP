using Benkyou.Data.Enums;

namespace Benkyou.Core.DTOs
{
    public class CreateContentItemDto
    {
        public int CourseSectionID { get; set; }

        public string Title { get; set; } = "";
        public string ContentType { get; set; } = "";

        public ContentTypeEnum Type { get; set; }
        public string Value { get; set; } = "";
        public string? Description { get; set; }

        public string Body { get; set; } = "";
        public string FileUrl { get; set; } = "";

        public int SortOrder { get; set; }
    }
}
