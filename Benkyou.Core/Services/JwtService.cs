using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.Configuration;
using Benkyou.Data.Models;


public class JwtService
{
    private readonly IConfiguration _config;

    public JwtService(IConfiguration config)
    {
        _config = config;
    }

    /// <summary>
    /// Generates a full JWT for an authenticated user.
    /// Includes both custom claims and standard ClaimTypes.Role
    /// so that [Authorize(Roles = "Admin")] works correctly.
    /// </summary>
    public string GenerateToken(User user, string? tenantCode = null)
    {
        var claims = new List<Claim>
        {
            new Claim("uid", user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), // SignalR user identifier support
            new Claim("tenantId", user.TenantID.ToString()),
            new Claim("role", user.Role.ToString()),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("email", user.Email ?? ""),
            new Claim("name", $"{user.FirstName} {user.LastName}"),
            new Claim("twoFactorEnabled", user.TwoFactorEnabled.ToString().ToLower()),
        };

        if (!string.IsNullOrWhiteSpace(tenantCode))
            claims.Add(new Claim("tenantCode", tenantCode));

        return BuildToken(claims);
    }

    /// <summary>
    /// Generates a full JWT from an arbitrary set of claims (used for SuperAdmin).
    /// </summary>
    public string GenerateTokenFromClaims(List<Claim> claims)
    {
        return BuildToken(claims);
    }

    /// <summary>
    /// Generates a short-lived temporary token for the 2FA verification step.
    /// Only carries uid, purpose, and optionally tenantId — NOT a full access token.
    /// </summary>
    public string GenerateTempToken(string uid, string? tenantId = null, int expiryMinutes = 5)
    {
        var claims = new List<Claim>
        {
            new Claim("uid", uid),
            new Claim("purpose", "2fa-verify"),
        };

        if (tenantId != null)
            claims.Add(new Claim("tenantId", tenantId));

        return BuildToken(claims, expiryMinutes);
    }

    /// <summary>
    /// Validates a temporary 2FA token and extracts claims.
    /// Returns null if the token is invalid or not a 2FA temp token.
    /// </summary>
    public ClaimsPrincipal? ValidateTempToken(string token)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]!)
        );

        var parameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = _config["Jwt:Issuer"],
            ValidAudience = _config["Jwt:Audience"],
            IssuerSigningKey = key,
        };

        try
        {
            var principal = new JwtSecurityTokenHandler()
                .ValidateToken(token, parameters, out _);

            // Verify this is a 2FA temp token, not a full access token
            var purpose = principal.FindFirst("purpose")?.Value;
            if (purpose != "2fa-verify")
                return null;

            return principal;
        }
        catch
        {
            return null;
        }
    }

    private string BuildToken(List<Claim> claims, int? overrideExpiryMinutes = null)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]!)
        );

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expiry = overrideExpiryMinutes
            ?? int.Parse(_config["Jwt:ExpiryMinutes"]!);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiry),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}