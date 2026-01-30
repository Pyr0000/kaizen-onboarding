using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace RecruitmentBackend.Controllers
{
    // DTO to handle text + file upload
    public class CompanyCreateDto
    {
        public required string CompanyId { get; set; }
        public required string CompanyName { get; set; }
        public string? CompanyDetails { get; set; } 
        public string? ColourCode { get; set; } // ✅ Added
        public IFormFile? Logo { get; set; }
    }

    // DTO for Update (Logo is optional here)
    public class CompanyUpdateDto
    {
        public required string CompanyName { get; set; }
        public string? CompanyDetails { get; set; } 
        public string? ColourCode { get; set; } // ✅ Added
        public IFormFile? Logo { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class CompanyController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment; 

        public CompanyController(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // POST: api/company/create
        [HttpPost("create")]
        public async Task<IActionResult> CreateCompany([FromForm] CompanyCreateDto dto)
        {
            if (await _context.Companies.AnyAsync(c => c.CompanyId == dto.CompanyId))
            {
                return BadRequest(new { message = "Company ID already exists." });
            }

            string? logoPath = await SaveLogo(dto.Logo);

            var newCompany = new Company
            {
                CompanyId = dto.CompanyId,
                CompanyName = dto.CompanyName,
                CompanyDetails = dto.CompanyDetails,
                ColourCode = dto.ColourCode, // ✅ Save Colour
                LogoPath = logoPath
            };

            _context.Companies.Add(newCompany);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Company created successfully!", company = newCompany });
        }

        // PUT: api/company/update/{id}
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateCompany(string id, [FromForm] CompanyUpdateDto dto)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.CompanyId == id);
            
            if (company == null)
            {
                return NotFound(new { message = "Company not found." });
            }

            // Update Text Fields
            company.CompanyName = dto.CompanyName;
            company.CompanyDetails = dto.CompanyDetails;
            company.ColourCode = dto.ColourCode; // ✅ Update Colour

            // Update Logo ONLY if a new file is provided
            if (dto.Logo != null && dto.Logo.Length > 0)
            {
                // Optional: You could verify if an old logo exists and delete it here to save space
                // if (!string.IsNullOrEmpty(company.LogoPath)) { ... delete logic ... }

                company.LogoPath = await SaveLogo(dto.Logo);
            }

            _context.Companies.Update(company);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Company updated successfully!", company });
        }

        // GET: api/company/all
        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<Company>>> GetAllCompanies()
        {
            return await _context.Companies.OrderBy(c => c.CompanyName).ToListAsync();
        }

        // GET: api/company/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCompany(string id)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.CompanyId == id);
            if (company == null) return NotFound(new { message = "Company not found." });
            return Ok(company);
        }

        // Helper Method to handle file saving securely
        private async Task<string?> SaveLogo(IFormFile? logo)
        {
            if (logo == null || logo.Length == 0) return null;

            // 1. Get the path to wwwroot
            string webRootPath = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsFolder = Path.Combine(webRootPath, "uploads");

            // 2. Ensure directory exists
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // 3. Generate a safe, unique filename
            // We use Guid to ensure uniqueness and Path.GetExtension to keep the file type (e.g. .png)
            // This prevents issues with filenames containing spaces or special characters
            var fileExtension = Path.GetExtension(logo.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // 4. Save the file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await logo.CopyToAsync(stream);
            }

            // 5. Return the relative URL path (with forward slashes for web)
            return $"/uploads/{uniqueFileName}";
        }
    }
}