using Benkyou.Core.DTOs;
using Benkyou.Data;
using Benkyou.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Benkyou.Core.Services;
using Microsoft.AspNetCore.Http;

[ApiController]
[Route("api/content")]
[Authorize]
public class ContentController : ControllerBase
{
    private readonly BenkyouDbContext _db;
    private readonly CloudinaryService _cloudinaryService;

    public ContentController(BenkyouDbContext db, CloudinaryService cloudinaryService)
    {
        _db = db;
        _cloudinaryService = cloudinaryService;
    }

    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);
    private bool IsSuperAdmin => User.FindFirst("isSuperAdmin")?.Value == "true";

    [HttpPost("upload")]
    [Authorize(Roles = "Admin,Instructor,SuperAdmin")]
    public async Task<IActionResult> Upload([FromForm] IFormFile file)
    {
        var (succeeded, secureUrl, _, errorMessage) = await _cloudinaryService.UploadFileAsync(file);
        if (!succeeded)
        {
            return BadRequest(new { message = errorMessage });
        }
        return Ok(new { url = secureUrl });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Instructor,SuperAdmin")]
    public async Task<IActionResult> Create(CreateContentItemDto dto)
    {
        var section = await _db.CourseSections
            .FirstOrDefaultAsync(s =>
                s.CourseSectionID == dto.CourseSectionID &&
                (IsSuperAdmin || s.TenantID == TenantId));

        if (section == null)
            return NotFound("Section not found");

        var content = new ContentItem
        {
            CourseSectionID = dto.CourseSectionID,
            TenantID = section.TenantID,
            Title = dto.Title,
            ContentType = dto.ContentType,
            Type = dto.Type,
            Value = dto.Value,
            Description = dto.Description,
            Body = dto.Body,
            FileUrl = dto.FileUrl,
            SortOrder = dto.SortOrder,
            IsHidden = true
        };

        _db.ContentItems.Add(content);
        await _db.SaveChangesAsync();

        return Ok(content);
    }

    [HttpGet("section/{sectionId}")]
    public async Task<IActionResult> GetBySection(int sectionId)
    {
        var isStudent = User.IsInRole("Student");

        var query = _db.ContentItems
            .Where(c => c.CourseSectionID == sectionId);

        // Students cannot see hidden content
        if (isStudent)
            query = query.Where(c => !c.IsHidden);

        var data = await query
            .OrderBy(c => c.SortOrder)
            .Select(c => new
            {
                c.ContentItemID,
                c.CourseSectionID,
                c.TenantID,
                c.Title,
                c.ContentType,
                c.Description,
                c.Body,
                c.FileUrl,
                c.SortOrder,
                c.IsHidden,
                c.IsActive,
                c.CreatedAt
            })
            .ToListAsync();

        return Ok(data);
    }

    // TOGGLE HIDE
    [HttpPatch("{id}/hide")]
    [Authorize(Roles = "Admin,Instructor,SuperAdmin")]
    public async Task<IActionResult> ToggleHide(int id)
    {
        var content = await _db.ContentItems
            .FirstOrDefaultAsync(c => c.ContentItemID == id && (IsSuperAdmin || c.TenantID == TenantId));

        if (content == null) return NotFound();

        content.IsHidden = !content.IsHidden;
        await _db.SaveChangesAsync();

        return Ok(new { success = true, isHidden = content.IsHidden });
    }

    // DELETE CONTENT
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Instructor,SuperAdmin")]
    public async Task<IActionResult> Delete(int id)
    {
        var content = await _db.ContentItems
            .FirstOrDefaultAsync(c => c.ContentItemID == id && (IsSuperAdmin || c.TenantID == TenantId));

        if (content == null) return NotFound("Content not found");

        _db.ContentItems.Remove(content);
        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }
}