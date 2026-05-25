using Benkyou.Core.DTOs;
using Benkyou.Data;
using Benkyou.Data.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Benkyou.Data.Enums;

using Benkyou.Core.Services;

namespace Benkyou.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController(
    BenkyouDbContext db,
    UserManager<User> userManager,
    CloudinaryService cloudinaryService,
    AccountLockoutService lockoutService) : BaseController
{
    private readonly BenkyouDbContext _db = db;
    private readonly UserManager<User> _userManager = userManager;
    private readonly CloudinaryService _cloudinaryService = cloudinaryService;
    private readonly AccountLockoutService _lockoutService = lockoutService;

    // GET USERS
    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var query = _db.Users.AsQueryable();

        if (!IsSuperAdmin)
        {
            query = query.Where(u => u.TenantID == TenantId);
        }

        // Materialize raw data first — avoid EF Core SQL translation issues
        // with DateTimeOffset.Value.DateTime on datetime2 columns
        var rawUsers = await query
            .Select(u => new {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.Role,
                u.YearEnrolled,
                u.YearLevel,
                u.Program,
                u.IsActive,
                u.CreatedAt,
                u.IsLockedOut,
                u.LockoutEnd,
                u.TenantID
            })
            .ToListAsync();

        // Load all org names in one query to avoid N+1
        var tenantIds = rawUsers.Select(u => u.TenantID).Distinct().ToList();
        var orgNames = await _db.Organizations
            .Where(o => tenantIds.Contains(o.TenantID))
            .ToDictionaryAsync(o => o.TenantID, o => o.Name);

        var now = DateTime.UtcNow;
        var users = rawUsers.Select(u => new {
            u.Id,
            u.FirstName,
            u.LastName,
            u.Email,
            u.Role,
            u.YearEnrolled,
            u.YearLevel,
            u.Program,
            u.IsActive,
            u.CreatedAt,
            isLockedOut = u.IsLockedOut && u.LockoutEnd.HasValue && u.LockoutEnd.Value.DateTime > now,
            lockoutEnd = u.LockoutEnd,
            OrganizationName = orgNames.TryGetValue(u.TenantID, out var name) ? name : "System"
        }).ToList();

        return Ok(users);
    }

    // GET SINGLE USER
    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(Guid id)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u =>
                u.Id == id &&
                (IsSuperAdmin || u.TenantID == TenantId));

        if (user == null)
            return NotFound();

        return Ok(user);
    }

    // CREATE USER
    [Authorize(Roles = "Admin,SuperAdmin")]
    [HttpPost]
    public async Task<IActionResult> CreateUser(CreateUserDto dto)
    {
        var exists = await _userManager.FindByEmailAsync(dto.Email);
        if (exists != null)
            return BadRequest("Email already exists");

        if (string.IsNullOrWhiteSpace(dto.UserRole))
            return BadRequest("User role must be specified");

        if (!Enum.TryParse<UserRole>(dto.UserRole, true, out var parsedRole))
            return BadRequest($"Invalid user role: {dto.UserRole}");

        if (User.IsInRole("Admin") && parsedRole == UserRole.Student)
        {
            return BadRequest("Admins are not permitted to create student accounts. Please use the Operator role to perform student management.");
        }

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
            return BadRequest($"Your organization has reached the maximum user limit of {maxUsers} for your current plan ({subscription?.Plan.Name ?? "Basic"}). Please upgrade your subscription to add more users.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantID = TenantId,
            Email = dto.Email,
            UserName = dto.Email,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Role = parsedRole,
            CreatedAt = DateTime.UtcNow,
            IsActive = true,
            EmailConfirmed = true // Created by Admin
        };

        if (parsedRole == UserRole.Student)
        {
            user.YearEnrolled = dto.YearEnrolled;
            user.YearLevel = dto.YearLevel;
            user.Program = dto.Program;
        }

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await LogAction(_db, "Created User", "User", user.Id.ToString());

        return Ok(user);
    }

    // UPDATE USER
    [Authorize(Roles = "Admin,SuperAdmin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(Guid id, CreateUserDto dto)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());

        if (user == null || (!IsSuperAdmin && user.TenantID != TenantId))
            return NotFound();

        if (string.IsNullOrWhiteSpace(dto.UserRole))
            return BadRequest("User role must be specified");

        if (!Enum.TryParse<UserRole>(dto.UserRole, true, out var parsedRole))
            return BadRequest($"Invalid user role: {dto.UserRole}");

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.Email = dto.Email;
        user.UserName = dto.Email;
        user.Role = parsedRole;

        if (parsedRole == UserRole.Student)
        {
            user.YearEnrolled = dto.YearEnrolled;
            user.YearLevel = dto.YearLevel;
            user.Program = dto.Program;
        }
        else
        {
            user.YearEnrolled = null;
            user.YearLevel = null;
            user.Program = null;
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await LogAction(_db, "Updated User", "User", user.Id.ToString());

        return Ok(user);
    }

    // TOGGLE STATUS (Disable/Enable Account)
    [Authorize(Roles = "Admin,SuperAdmin")]
    [HttpPatch("{id}/toggle-status")]
    public async Task<IActionResult> ToggleStatus(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());

        if (user == null || (!IsSuperAdmin && user.TenantID != TenantId))
            return NotFound();

        user.IsActive = !user.IsActive;

        // If enabling the user, also reset any active lockout
        if (user.IsActive)
        {
            await _lockoutService.ResetFailedAttemptsAsync(user.Id);
            user.IsLockedOut = false;
            user.LockoutEnd = null;
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await LogAction(_db, user.IsActive ? "Activated User" : "Deactivated User", "User", id.ToString());

        return Ok(new { success = true, isActive = user.IsActive });
    }

    // UNLOCK USER
    [Authorize(Roles = "Admin,SuperAdmin")]
    [HttpPatch("{id}/unlock")]
    public async Task<IActionResult> UnlockUser(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());

        if (user == null || (!IsSuperAdmin && user.TenantID != TenantId))
            return NotFound();

        await _lockoutService.ResetFailedAttemptsAsync(user.Id);
        user.IsLockedOut = false;
        user.LockoutEnd = null;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await LogAction(_db, "Unlocked User", "User", id.ToString());

        return Ok(new { success = true });
    }

    // DELETE USER
    [Authorize(Roles = "Admin,SuperAdmin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());

        if (user == null || (!IsSuperAdmin && user.TenantID != TenantId))
            return NotFound();

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await LogAction(_db, "Deleted User", "User", id.ToString());

        return Ok(new { success = true, message = "User deleted successfully" });
    }

    // INSTRUCTORS
    [Authorize(Roles = "Admin,Operator,SuperAdmin")]
    [HttpGet("instructors")]
    public async Task<IActionResult> GetInstructors()
    {
        var users = await _db.Users
            .Where(u =>
                u.Role == UserRole.Instructor &&
                (IsSuperAdmin || u.TenantID == TenantId))
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = users
        });
    }

    // STUDENTS
    [Authorize(Roles = "Admin,Operator,SuperAdmin")]
    [HttpGet("students")]
    public async Task<IActionResult> GetStudents()
    {
        var users = await _db.Users
            .Where(u =>
                u.Role == UserRole.Student &&
                (IsSuperAdmin || u.TenantID == TenantId))
            .ToListAsync();

        return Ok(users);
    }

    // UPDATE PROFILE PHOTO
    [HttpPut("profile-photo")]
    [Authorize(Roles = "Admin,Instructor,Student,Member,4")]
    public async Task<IActionResult> UpdateProfilePhoto([FromForm] IFormFile file)
    {
        if (file == null)
            return BadRequest("No file was uploaded.");

        var userId = UserId;
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return NotFound("User not found.");

        // Delete old profile photo from Cloudinary if it exists
        if (!string.IsNullOrWhiteSpace(user.ProfilePhotoPublicId))
        {
            var deleteResult = await _cloudinaryService.DeleteProfilePhotoAsync(user.ProfilePhotoPublicId);
            if (!deleteResult.Succeeded)
            {
                // Log warning and proceed with upload anyway to avoid user getting locked out of updating their photo
                Console.WriteLine($"[WARNING] Could not delete old Cloudinary image {user.ProfilePhotoPublicId}: {deleteResult.ErrorMessage}");
            }
        }

        // Upload the new profile photo
        var uploadResult = await _cloudinaryService.UploadProfilePhotoAsync(file, userId.ToString());

        if (!uploadResult.Succeeded)
        {
            // Return 400 for validation errors (wrong extension, file too large)
            if (uploadResult.ErrorMessage != null && 
                (uploadResult.ErrorMessage.Contains("limit") || 
                 uploadResult.ErrorMessage.Contains("format") || 
                 uploadResult.ErrorMessage.Contains("size") || 
                 uploadResult.ErrorMessage.Contains("Invalid")))
            {
                return BadRequest(uploadResult.ErrorMessage);
            }

            // Return 500 for Cloudinary/API failures
            return StatusCode(500, uploadResult.ErrorMessage);
        }

        // Save new secure URL and public_id to user record
        user.ProfilePhotoUrl = uploadResult.SecureUrl;
        user.ProfilePhotoPublicId = uploadResult.PublicId;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        await LogAction(_db, "Updated Profile Photo", "User", user.Id.ToString());

        return Ok(new { ProfilePhotoUrl = user.ProfilePhotoUrl });
    }

    // SELF PROFILE EDIT (Instructor / Student)
    [HttpPut("profile")]
    [Authorize(Roles = "Admin,Instructor,Student,Member,Operator,4")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req)
    {
        var user = await _userManager.FindByIdAsync(UserId.ToString());
        if (user == null) return NotFound("User not found.");

        user.FirstName = req.FirstName;
        user.LastName = req.LastName;

        if (user.Role == UserRole.Student)
        {
            user.YearEnrolled = req.YearEnrolled;
            user.YearLevel = req.YearLevel;
            user.Program = req.Program;
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await LogAction(_db, "Updated Own Profile", "User", user.Id.ToString());

        return Ok(new { success = true, firstName = user.FirstName, lastName = user.LastName });
    }

    // SELF CHANGE PASSWORD (validates current password)
    [HttpPut("change-password")]
    [Authorize(Roles = "Admin,Instructor,Student,Member,4")]
    public async Task<IActionResult> ChangeOwnPassword([FromBody] ChangeOwnPasswordRequest req)
    {
        var user = await _userManager.FindByIdAsync(UserId.ToString());
        if (user == null) return NotFound("User not found.");

        var checkCurrent = await _userManager.CheckPasswordAsync(user, req.CurrentPassword);
        if (!checkCurrent)
            return BadRequest("Current password is incorrect.");

        var result = await _userManager.ChangePasswordAsync(user, req.CurrentPassword, req.NewPassword);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await LogAction(_db, "Changed Own Password", "User", user.Id.ToString());

        return Ok(new { success = true, message = "Password changed successfully." });
    }

    // ADMIN CHANGE USER PASSWORD
    [HttpPut("{id}/change-password")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> AdminChangePassword(Guid id, [FromBody] AdminChangePasswordRequest req)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null || (!IsSuperAdmin && user.TenantID != TenantId))
            return NotFound("User not found.");

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, req.NewPassword);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await LogAction(_db, "Admin Changed User Password", "User", id.ToString());

        return Ok(new { success = true, message = "Password updated successfully." });
    }
}

public class UpdateProfileRequest
{
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public int? YearEnrolled { get; set; }
    public string? YearLevel { get; set; }
    public string? Program { get; set; }
}

public class ChangeOwnPasswordRequest
{
    public string CurrentPassword { get; set; } = "";
    public string NewPassword { get; set; } = "";
}

public class AdminChangePasswordRequest
{
    public string NewPassword { get; set; } = "";
}

