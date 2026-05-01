using Benkyou.Data;
using Benkyou.Data.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Benkyou.Core.DTOs;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly BenkyouDbContext _db;
    private readonly JwtService _jwt;

    public AuthController(BenkyouDbContext db, JwtService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    // REGISTER ORG + ADMIN
    [HttpPost("register-org")]
    public async Task<IActionResult> RegisterOrg([FromBody] RegisterOrgDto dto)
    {
        var tenantId = Guid.NewGuid();

        var org = new Organization
        {
            TenantID = tenantId,
            Name = dto.OrganizationName,
            TenantCode = dto.OrganizationName.ToLower().Replace(" ", "-"),
            PrimaryEmail = dto.Email
        };

        var user = new User
        {
            TenantID = tenantId,
            Email = dto.Email,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Role = "Admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        _db.Organizations.Add(org);
        _db.Users.Add(user);

        await _db.SaveChangesAsync();

        return Ok("Organization created");
    }

    // LOGIN
    [HttpPost("login")]

    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(x => x.Email == dto.Email && x.IsActive);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized("Invalid credentials");

        var token = _jwt.GenerateToken(user);

        return Ok(new
        {
            token,
            user = new
            {
                user.UserID,
                user.Email,
                user.Role,
                user.TenantID
            }
        });
    }

    // CURRENT USER
    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]


    public IActionResult Me()
    {
        var userId = User.FindFirst("uid")?.Value;
        var tenantId = User.FindFirst("tenantId")?.Value;

        return Ok(new { userId, tenantId });
    }
}