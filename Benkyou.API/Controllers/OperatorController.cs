using Benkyou.Core.DTOs;
using Benkyou.Data;
using Benkyou.Data.Models;
using Benkyou.Data.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CsvHelper;
using OfficeOpenXml;

namespace Benkyou.API.Controllers
{
    [ApiController]
    [Route("api/operator")]
    [Authorize(Roles = "Operator,Admin")]
    public class OperatorController(
        BenkyouDbContext db,
        UserManager<User> userManager) : BaseController
    {
        private readonly BenkyouDbContext _db = db;
        private readonly UserManager<User> _userManager = userManager;

        // 1. GET ALL STUDENTS IN TENANT
        [HttpGet("students")]
        public async Task<IActionResult> GetStudents()
        {
            var students = await _db.Users
                .Where(u => u.TenantID == TenantId && u.Role == UserRole.Student)
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new
                {
                    u.Id,
                    FullName = u.FirstName + " " + u.LastName,
                    u.Email,
                    u.YearEnrolled,
                    u.YearLevel,
                    u.Program,
                    u.IsActive,
                    u.CreatedAt
                })
                .ToListAsync();

            var studentIds = students.Select(s => s.Id).ToList();
            var existingProfiles = await _db.StudentProfiles
                .Where(sp => studentIds.Contains(sp.UserID))
                .ToDictionaryAsync(sp => sp.UserID, sp => sp.StudentNumber);

            var studentsWithProfiles = new List<object>();
            foreach (var student in students)
            {
                string? studentNumber = null;
                if (existingProfiles.TryGetValue(student.Id, out var existingNo) && !string.IsNullOrEmpty(existingNo) && existingNo.Length == 6)
                {
                    studentNumber = existingNo;
                }
                else
                {
                    studentNumber = await EnsureStudentProfileAsync(student.Id, TenantId);
                }

                studentsWithProfiles.Add(new
                {
                    student.Id,
                    student.FullName,
                    student.Email,
                    student.YearEnrolled,
                    student.YearLevel,
                    student.Program,
                    student.IsActive,
                    student.CreatedAt,
                    StudentNumber = studentNumber
                });
            }

            return Ok(studentsWithProfiles);
        }

        // 2. CREATE A SINGLE STUDENT ACCOUNT
        [HttpPost("students")]
        public async Task<IActionResult> CreateStudent([FromBody] CreateStudentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.FirstName) || string.IsNullOrWhiteSpace(dto.LastName))
                return BadRequest(new { message = "First Name, Last Name, and Email are required" });

            var exists = await _userManager.FindByEmailAsync(dto.Email);
            if (exists != null)
                return BadRequest(new { message = "Email already exists" });

            // Validate subscription user limits
            var maxUsers = 99999;
            var subscription = await _db.Subscriptions
                .Include(s => s.Plan)
                .FirstOrDefaultAsync(s => s.TenantID == TenantId);
            if (subscription != null)
            {
                maxUsers = subscription.Plan.MaxUsers;
            }

            var activeUserCount = await _db.Users.CountAsync(u => u.TenantID == TenantId);
            if (activeUserCount >= maxUsers)
            {
                return BadRequest(new { message = $"Your organization has reached the maximum user limit of {maxUsers} for your current plan ({subscription?.Plan.Name ?? "Basic"}). Please upgrade your subscription to add more users." });
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                TenantID = TenantId,
                Email = dto.Email,
                UserName = dto.Email,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Role = UserRole.Student,
                YearEnrolled = dto.YearEnrolled,
                YearLevel = dto.YearLevel,
                Program = dto.Program,
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });

            await EnsureStudentProfileAsync(user.Id, TenantId);

            await LogAction(_db, "Operator Created Student", "User", user.Id.ToString());
            return Ok(user);
        }

        // 3. BULK CSV/EXCEL STUDENT IMPORT
        [HttpPost("students/import")]
        public async Task<IActionResult> ImportStudents(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file was uploaded." });

            var ext = Path.GetExtension(file.FileName).ToLower();
            if (ext != ".csv" && ext != ".xlsx")
                return BadRequest(new { message = "Only .csv and .xlsx files are supported." });

            // Validate subscription user limits
            var maxUsers = 99999;
            var subscription = await _db.Subscriptions
                .Include(s => s.Plan)
                .FirstOrDefaultAsync(s => s.TenantID == TenantId);
            if (subscription != null)
            {
                maxUsers = subscription.Plan.MaxUsers;
            }

            var activeUserCount = await _db.Users.CountAsync(u => u.TenantID == TenantId);
            var remainingCapacity = maxUsers - activeUserCount;

            if (remainingCapacity <= 0)
            {
                return BadRequest(new { message = $"Your organization has reached the maximum user limit of {maxUsers} for your current plan ({subscription?.Plan.Name ?? "Basic"}). Please upgrade your subscription to add more users." });
            }

            int created = 0;
            int skipped = 0;
            var errors = new List<string>();

            try
            {
                if (ext == ".csv")
                {
                    using var reader = new StreamReader(file.OpenReadStream());
                    using var csv = new CsvReader(reader, new CsvHelper.Configuration.CsvConfiguration(CultureInfo.InvariantCulture)
                    {
                        HeaderValidated = null,
                        MissingFieldFound = null,
                        PrepareHeaderForMatch = args => args.Header.ToLower()
                    });

                    await csv.ReadAsync();
                    csv.ReadHeader();
                    var headers = csv.HeaderRecord.Select(h => h.Trim().ToLower()).ToList();

                    int rowNum = 1;
                    while (await csv.ReadAsync())
                    {
                        rowNum++;
                        if (created >= remainingCapacity)
                        {
                            errors.Add($"Row {rowNum}: Cannot import. Subscription user limit of {maxUsers} has been reached.");
                            continue;
                        }

                        var firstName = csv.GetField("firstname")?.Trim();
                        var lastName = csv.GetField("lastname")?.Trim();
                        var email = csv.GetField("email")?.Trim();
                        var password = csv.GetField("password")?.Trim();
                        var yearEnrolledStr = csv.GetField("yearenrolled")?.Trim();
                        var yearLevel = csv.GetField("yearlevel")?.Trim();
                        var program = csv.GetField("program")?.Trim();

                        await ProcessImportRow(firstName, lastName, email, password, yearEnrolledStr, yearLevel, program, rowNum, errors, () => created++, () => skipped++);
                    }
                }
                else // .xlsx
                {
                    ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                    using var package = new ExcelPackage(file.OpenReadStream());
                    var worksheet = package.Workbook.Worksheets[0];
                    if (worksheet == null || worksheet.Dimension == null)
                        return BadRequest(new { message = "Excel sheet is empty." });

                    var rowCount = worksheet.Dimension.Rows;
                    var colCount = worksheet.Dimension.Columns;

                    var headers = new Dictionary<string, int>();
                    for (int col = 1; col <= colCount; col++)
                    {
                        var val = worksheet.Cells[1, col].Value?.ToString()?.Trim()?.ToLower();
                        if (!string.IsNullOrEmpty(val))
                        {
                            headers[val] = col;
                        }
                    }

                    for (int row = 2; row <= rowCount; row++)
                    {
                        if (created >= remainingCapacity)
                        {
                            errors.Add($"Row {row}: Cannot import. Subscription user limit of {maxUsers} has been reached.");
                            continue;
                        }

                        var firstName = worksheet.Cells[row, headers.GetValueOrDefault("firstname", 0)]?.Value?.ToString()?.Trim();
                        var lastName = worksheet.Cells[row, headers.GetValueOrDefault("lastname", 0)]?.Value?.ToString()?.Trim();
                        var email = worksheet.Cells[row, headers.GetValueOrDefault("email", 0)]?.Value?.ToString()?.Trim();
                        var password = worksheet.Cells[row, headers.GetValueOrDefault("password", 0)]?.Value?.ToString()?.Trim();
                        var yearEnrolledStr = worksheet.Cells[row, headers.GetValueOrDefault("yearenrolled", 0)]?.Value?.ToString()?.Trim();
                        var yearLevel = worksheet.Cells[row, headers.GetValueOrDefault("yearlevel", 0)]?.Value?.ToString()?.Trim();
                        var program = worksheet.Cells[row, headers.GetValueOrDefault("program", 0)]?.Value?.ToString()?.Trim();

                        await ProcessImportRow(firstName, lastName, email, password, yearEnrolledStr, yearLevel, program, row, errors, () => created++, () => skipped++);
                    }
                }

                return Ok(new { created, skipped, errors });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        private async Task ProcessImportRow(
            string? firstName, string? lastName, string? email, string? password,
            string? yearEnrolledStr, string? yearLevel, string? program,
            int rowNum, List<string> errors, Action onCreated, Action onSkipped)
        {
            if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName) || string.IsNullOrWhiteSpace(email))
            {
                errors.Add($"Row {rowNum}: Missing required fields (First Name, Last Name, and Email are required).");
                return;
            }

            if (!email.Contains("@"))
            {
                errors.Add($"Row {rowNum}: Invalid email format: '{email}'");
                return;
            }

            if (string.IsNullOrWhiteSpace(password) || password.Length < 6)
            {
                errors.Add($"Row {rowNum}: Password must be at least 6 characters.");
                return;
            }

            var exists = await _userManager.FindByEmailAsync(email);
            if (exists != null)
            {
                onSkipped();
                return;
            }

            // Run password validation policy check
            var dummyUser = new User { UserName = email, Email = email };
            var passwordErrors = new List<string>();
            foreach (var validator in _userManager.PasswordValidators)
            {
                var valResult = await validator.ValidateAsync(_userManager, dummyUser, password);
                if (!valResult.Succeeded)
                {
                    passwordErrors.AddRange(valResult.Errors.Select(e => e.Description));
                }
            }

            if (passwordErrors.Count > 0)
            {
                errors.Add($"Row {rowNum}: Password fails policy. Details: {string.Join("; ", passwordErrors)}");
                return;
            }

            int? yearEnrolled = null;
            if (int.TryParse(yearEnrolledStr, out var parsedYear))
            {
                yearEnrolled = parsedYear;
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                TenantID = TenantId,
                Email = email,
                UserName = email,
                FirstName = firstName,
                LastName = lastName,
                Role = UserRole.Student,
                YearEnrolled = yearEnrolled,
                YearLevel = yearLevel,
                Program = program,
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, password);
            if (!result.Succeeded)
            {
                errors.Add($"Row {rowNum}: Failed to create user. {string.Join("; ", result.Errors.Select(e => e.Description))}");
                return;
            }

            await EnsureStudentProfileAsync(user.Id, TenantId);

            onCreated();
        }

        // 4. DEACTIVATE STUDENT
        [HttpPut("students/{id}/deactivate")]
        public async Task<IActionResult> DeactivateStudent(Guid id)
        {
            var student = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == id && u.TenantID == TenantId && u.Role == UserRole.Student);

            if (student == null)
                return NotFound(new { message = "Student not found." });

            student.IsActive = false;
            await _userManager.UpdateAsync(student);

            await LogAction(_db, "Operator Deactivated Student", "User", id.ToString());
            return Ok(new { success = true });
        }

        // 5. ACTIVATE STUDENT
        [HttpPut("students/{id}/activate")]
        public async Task<IActionResult> ActivateStudent(Guid id)
        {
            var student = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == id && u.TenantID == TenantId && u.Role == UserRole.Student);

            if (student == null)
                return NotFound(new { message = "Student not found." });

            student.IsActive = true;
            await _userManager.UpdateAsync(student);

            await LogAction(_db, "Operator Activated Student", "User", id.ToString());
            return Ok(new { success = true });
        }

        // 6. RESET STUDENT PASSWORD
        [HttpPut("students/{id}/reset-password")]
        public async Task<IActionResult> ResetStudentPassword(Guid id, [FromBody] AdminChangePasswordRequest req)
        {
            var student = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == id && u.TenantID == TenantId && u.Role == UserRole.Student);

            if (student == null)
                return NotFound(new { message = "Student not found." });

            var token = await _userManager.GeneratePasswordResetTokenAsync(student);
            var result = await _userManager.ResetPasswordAsync(student, token, req.NewPassword);
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });

            await LogAction(_db, "Operator Reset Student Password", "User", id.ToString());
            return Ok(new { success = true, message = "Password updated successfully." });
        }

        // 7. GET BATCH ENROLLMENT PREVIEW
        [HttpGet("batch-enroll/preview")]
        public async Task<IActionResult> PreviewBatchEnroll(
            [FromQuery] int courseId,
            [FromQuery] string? filterProgram = null,
            [FromQuery] string? filterYearLevel = null)
        {
            var query = _db.Users
                .Where(u => u.TenantID == TenantId && u.Role == UserRole.Student && u.IsActive);

            if (!string.IsNullOrWhiteSpace(filterProgram) && filterProgram != "Any Program")
            {
                query = query.Where(u => u.Program == filterProgram);
            }
            if (!string.IsNullOrWhiteSpace(filterYearLevel) && filterYearLevel != "Any Year Level")
            {
                query = query.Where(u => u.YearLevel == filterYearLevel);
            }

            var matchedStudents = await query.ToListAsync();
            
            var studentsList = new List<object>();
            int alreadyEnrolledCount = 0;

            foreach (var u in matchedStudents)
            {
                var studentNumber = await EnsureStudentProfileAsync(u.Id, TenantId);
                var isAlreadyEnrolled = await _db.Enrollments.AnyAsync(e => e.CourseID == courseId && e.StudentID == u.Id);
                
                if (isAlreadyEnrolled)
                {
                    alreadyEnrolledCount++;
                }

                studentsList.Add(new
                {
                    u.Id,
                    FullName = u.FirstName + " " + u.LastName,
                    u.Email,
                    u.Program,
                    u.YearLevel,
                    StudentNumber = studentNumber,
                    IsAlreadyEnrolled = isAlreadyEnrolled
                });
            }

            var matchingCount = matchedStudents.Count;
            var willBeEnrolled = matchingCount - alreadyEnrolledCount;

            return Ok(new
            {
                matchingStudents = matchingCount,
                alreadyEnrolled = alreadyEnrolledCount,
                willBeEnrolled = willBeEnrolled,
                students = studentsList
            });
        }

        // 8. BATCH ENROLL
        [HttpPost("batch-enroll")]
        public async Task<IActionResult> BatchEnroll([FromBody] BatchEnrollDto dto)
        {
            var course = await _db.Courses
                .FirstOrDefaultAsync(c => c.CourseID == dto.CourseId && (IsSuperAdmin || c.TenantID == TenantId));

            if (course == null)
                return NotFound(new { message = "Course not found" });

            var query = _db.Users
                .Where(u => u.TenantID == TenantId && u.Role == UserRole.Student && u.IsActive);

            if (!string.IsNullOrWhiteSpace(dto.FilterProgram) && dto.FilterProgram != "Any Program")
            {
                query = query.Where(u => u.Program == dto.FilterProgram);
            }
            if (!string.IsNullOrWhiteSpace(dto.FilterYearLevel) && dto.FilterYearLevel != "Any Year Level")
            {
                query = query.Where(u => u.YearLevel == dto.FilterYearLevel);
            }

            var matchedStudents = await query.ToListAsync();

            if (dto.ExcludedStudentIds != null && dto.ExcludedStudentIds.Any())
            {
                matchedStudents = matchedStudents.Where(s => !dto.ExcludedStudentIds.Contains(s.Id)).ToList();
            }

            var studentIds = matchedStudents.Select(s => s.Id).ToList();

            var existingEnrollments = await _db.Enrollments
                .Where(e => e.CourseID == dto.CourseId && studentIds.Contains(e.StudentID))
                .Select(e => e.StudentID)
                .ToListAsync();

            int enrolledCount = 0;
            int skippedCount = 0;

            foreach (var student in matchedStudents)
            {
                if (existingEnrollments.Contains(student.Id))
                {
                    skippedCount++;
                    continue;
                }

                var enrollment = new Enrollment
                {
                    TenantID = TenantId,
                    CourseID = dto.CourseId,
                    StudentID = student.Id,
                    ClassSectionID = dto.ClassSectionId,
                    Status = "Active",
                    EnrolledAt = DateTime.UtcNow
                };
                _db.Enrollments.Add(enrollment);
                enrolledCount++;
            }

            if (enrolledCount > 0)
            {
                var log = new BatchEnrollmentLog
                {
                    TenantID = TenantId,
                    CourseID = dto.CourseId,
                    EnrolledByUserID = UserId,
                    FilterProgram = dto.FilterProgram == "Any Program" ? null : dto.FilterProgram,
                    FilterYearLevel = dto.FilterYearLevel == "Any Year Level" ? null : dto.FilterYearLevel,
                    StudentsEnrolled = enrolledCount,
                    CreatedAt = DateTime.UtcNow
                };
                _db.BatchEnrollmentLogs.Add(log);
                await _db.SaveChangesAsync();
            }

            return Ok(new
            {
                enrolled = enrolledCount,
                skipped = skippedCount,
                courseTitle = course.Title
            });
        }

        // 9. GET BATCH ENROLLMENT HISTORY
        [HttpGet("batch-enroll/history")]
        public async Task<IActionResult> GetBatchHistory()
        {
            var history = await _db.BatchEnrollmentLogs
                .Include(l => l.Course)
                .Include(l => l.EnrolledByUser)
                .Where(l => l.TenantID == TenantId)
                .OrderByDescending(l => l.CreatedAt)
                .Select(l => new
                {
                    l.Id,
                    CourseTitle = l.Course.Title,
                    EnrolledByName = l.EnrolledByUser.FirstName + " " + l.EnrolledByUser.LastName,
                    l.FilterProgram,
                    l.FilterYearLevel,
                    l.StudentsEnrolled,
                    l.CreatedAt
                })
                .ToListAsync();

            return Ok(history);
        }

        // 10. GET REPORTS ENROLLMENT SUMMARY
        [HttpGet("reports/enrollment-summary")]
        public async Task<IActionResult> GetEnrollmentSummary()
        {
            var students = await _db.Users
                .Where(u => u.TenantID == TenantId && u.Role == UserRole.Student)
                .ToListAsync();

            var enrollments = await _db.Enrollments
                .Include(e => e.Course)
                .Where(e => e.TenantID == TenantId)
                .ToListAsync();

            var studentsPerProgram = students
                .GroupBy(u => u.Program ?? "Not Specified")
                .Select(g => new { program = g.Key, count = g.Count() })
                .ToList();

            var studentsPerYearLevel = students
                .GroupBy(u => u.YearLevel ?? "Not Specified")
                .Select(g => new { yearLevel = g.Key, count = g.Count() })
                .ToList();

            var enrollmentsPerCourse = enrollments
                .GroupBy(e => e.Course.Title)
                .Select(g => new { courseTitle = g.Key, count = g.Count() })
                .ToList();

            var activeCount = students.Count(s => s.IsActive);
            var inactiveCount = students.Count(s => !s.IsActive);

            return Ok(new
            {
                studentsPerProgram,
                studentsPerYearLevel,
                enrollmentsPerCourse,
                studentStatus = new { active = activeCount, inactive = inactiveCount }
            });
        }

        // 11. STREAM EXPORT ENROLLMENTS CSV
        [HttpGet("reports/export")]
        public async Task<IActionResult> ExportEnrollments()
        {
            var enrollments = await _db.Enrollments
                .Include(e => e.Course)
                .Include(e => e.Student)
                .Where(e => e.TenantID == TenantId)
                .OrderByDescending(e => e.EnrolledAt)
                .ToListAsync();

            var sb = new StringBuilder();
            sb.AppendLine("StudentID,StudentName,Email,Program,YearLevel,YearEnrolled,CourseName,EnrollmentStatus,EnrolledAt");

            foreach (var e in enrollments)
            {
                var studentNumber = await EnsureStudentProfileAsync(e.StudentID, TenantId);
                var name = $"{e.Student.FirstName} {e.Student.LastName}".Replace("\"", "\"\"");
                var email = e.Student.Email ?? "";
                var program = (e.Student.Program ?? "—").Replace("\"", "\"\"");
                var yearLevel = (e.Student.YearLevel ?? "—").Replace("\"", "\"\"");
                var yearEnrolled = e.Student.YearEnrolled?.ToString() ?? "—";
                var courseName = e.Course.Title.Replace("\"", "\"\"");
                var status = e.Status;
                var enrolledAt = e.EnrolledAt.ToString("yyyy-MM-dd HH:mm:ss");

                sb.AppendLine($"\"{studentNumber}\",\"{name}\",\"{email}\",\"{program}\",\"{yearLevel}\",\"{yearEnrolled}\",\"{courseName}\",\"{status}\",\"{enrolledAt}\"");
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", "enrollments.csv");
        }

        private async Task<string> EnsureStudentProfileAsync(Guid studentId, Guid tenantId)
        {
            var profile = await _db.StudentProfiles.FirstOrDefaultAsync(p => p.UserID == studentId);
            if (profile != null)
            {
                if (string.IsNullOrEmpty(profile.StudentNumber) || profile.StudentNumber.Length != 6)
                {
                    profile.StudentNumber = await GenerateUniqueStudentNumberAsync();
                    await _db.SaveChangesAsync();
                }
                return profile.StudentNumber;
            }

            var studentNumber = await GenerateUniqueStudentNumberAsync();
            profile = new StudentProfile
            {
                UserID = studentId,
                TenantID = tenantId,
                StudentNumber = studentNumber
            };
            _db.StudentProfiles.Add(profile);
            await _db.SaveChangesAsync();
            return studentNumber;
        }

        private async Task<string> GenerateUniqueStudentNumberAsync()
        {
            var random = new Random();
            string studentNumber;
            bool exists;
            do
            {
                studentNumber = random.Next(100000, 999999).ToString();
                exists = await _db.StudentProfiles.AnyAsync(sp => sp.StudentNumber == studentNumber);
            } while (exists);
            return studentNumber;
        }
    }

    public class BatchEnrollDto
    {
        public int CourseId { get; set; }
        public string? FilterProgram { get; set; }
        public string? FilterYearLevel { get; set; }
        public int? ClassSectionId { get; set; }
        public List<Guid>? ExcludedStudentIds { get; set; }
    }
}
