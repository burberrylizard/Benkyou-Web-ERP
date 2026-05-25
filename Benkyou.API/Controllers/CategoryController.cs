namespace Benkyou.API.Controllers;

using Benkyou.Core.DTOs;
using Benkyou.Data;
using Benkyou.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/categories")]
[Authorize]
public class CategoriesController(BenkyouDbContext db) : BaseController
{
    private readonly BenkyouDbContext _db = db;

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> Create(CreateCategoryDto dto)
    {
        var category = new Category
        {
            Name = dto.Name,
            TenantID = TenantId
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            data = category
        });
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var data = await _db.Categories
            .Where(c => IsSuperAdmin || c.TenantID == TenantId)
            .Include(c => c.Courses)
            .Select(c => new {
                c.CategoryID,
                c.Name,
                CourseCount = c.Courses.Count
            })
            .ToListAsync();

        return Ok(data);
    }
}