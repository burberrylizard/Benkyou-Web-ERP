namespace Benkyou.Core.DTOs
{
    public class CreateStudentDto
    {
        public string Email { get; set; } = "";
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string Password { get; set; } = "";
        public int? YearEnrolled { get; set; }
        public string? YearLevel { get; set; }
        public string? Program { get; set; }
    }
}
