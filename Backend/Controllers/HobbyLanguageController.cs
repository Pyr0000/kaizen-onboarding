// fileName: Controllers/HobbyLanguageController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;
using System.Text.Json;
using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HobbyLanguageController : ControllerBase
    {
        private readonly AppDbContext _context;

        public HobbyLanguageController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/HobbyLanguage/resume/{candidateId}?companyId=...
        [HttpGet("resume/{candidateId}")]
        public async Task<IActionResult> DownloadResume(string candidateId, [FromQuery] string companyId)
        {
            if (string.IsNullOrEmpty(candidateId) || string.IsNullOrEmpty(companyId))
            {
                return BadRequest(new { message = "Candidate ID and Company ID are required." });
            }

            var resume = await _context.CandidateResumes
                .Where(r => r.CandidateId == candidateId && r.CompanyId == companyId)
                .OrderByDescending(r => r.EntryDate)
                .FirstOrDefaultAsync();

            if (resume == null || resume.FileContent == null || resume.FileContent.Length == 0)
            {
                return NotFound(new { message = "Resume file not found for this candidate in this company." });
            }

            string contentType = "application/octet-stream";
            string fileName = resume.FileName ?? $"Resume_{candidateId}.pdf";

            if (fileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase)) contentType = "application/pdf";
            else if (fileName.EndsWith(".docx", StringComparison.OrdinalIgnoreCase)) contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            else if (fileName.EndsWith(".doc", StringComparison.OrdinalIgnoreCase)) contentType = "application/msword";

            return File(resume.FileContent, contentType, fileName);
        }

        // GET: api/HobbyLanguage/{candidateId}?companyId=...
        [HttpGet("{candidateId}")]
        public async Task<IActionResult> Get(string candidateId, [FromQuery] string companyId)
        {
            if (string.IsNullOrEmpty(companyId))
            {
                return BadRequest(new { message = "Company ID is required." });
            }

            var hobbies = await _context.CandidateHobbies
                .Where(x => x.CandidateId == candidateId && x.CompanyId == companyId)
                .ToListAsync();

            var languages = await _context.CandidateLanguages
                .Where(x => x.CandidateId == candidateId && x.CompanyId == companyId)
                .ToListAsync();

            var resume = await _context.CandidateResumes
                .Where(x => x.CandidateId == candidateId && x.CompanyId == companyId)
                .OrderByDescending(x => x.CreatedAt)
                .Select(r => new { r.FileName, r.EntryDate }) 
                .FirstOrDefaultAsync();

            return Ok(new { hobbies, languages, resume });
        }

        // ✅ NEW: Save Hobbies & Languages Only
        [HttpPost("save-details")]
        public async Task<IActionResult> SaveDetails(
            [FromForm] string candidateId,
            [FromForm] string? companyId,
            [FromForm] string hobbiesJson,
            [FromForm] string languagesJson)
        {
            if (string.IsNullOrEmpty(candidateId) || string.IsNullOrEmpty(companyId))
                return BadRequest(new { message = "Candidate ID and Company ID are required." });

            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.CandidateId == candidateId && e.CompanyId == companyId);

            if (employee == null)
                return BadRequest(new { message = "Candidate profile not found." });

            var authoritativeCompanyId = employee.CompanyId;

            var hobbies = JsonSerializer.Deserialize<List<CandidateHobby>>(hobbiesJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<CandidateHobby>();
            var languages = JsonSerializer.Deserialize<List<CandidateLanguage>>(languagesJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<CandidateLanguage>();

            // Duplicate Checks
            var duplicateHobbies = hobbies.Where(h => !string.IsNullOrEmpty(h.HobbyCode)).GroupBy(h => h.HobbyCode).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
            if (duplicateHobbies.Any()) return BadRequest(new { message = $"Duplicate Hobby Code: {duplicateHobbies.First()}" });

            var duplicateLanguages = languages.Where(l => !string.IsNullOrEmpty(l.LanguageCode)).GroupBy(l => l.LanguageCode).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
            if (duplicateLanguages.Any()) return BadRequest(new { message = $"Duplicate Language Code: {duplicateLanguages.First()}" });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Clear existing Hobbies/Languages (Scoped to Company)
                var existingHobbies = _context.CandidateHobbies.Where(x => x.CandidateId == candidateId && x.CompanyId == authoritativeCompanyId);
                _context.CandidateHobbies.RemoveRange(existingHobbies);

                var existingLanguages = _context.CandidateLanguages.Where(x => x.CandidateId == candidateId && x.CompanyId == authoritativeCompanyId);
                _context.CandidateLanguages.RemoveRange(existingLanguages);

                // 2. Add new records
                foreach (var h in hobbies)
                {
                    h.Id = 0; h.CandidateId = candidateId; h.CompanyId = authoritativeCompanyId;
                    _context.CandidateHobbies.Add(h);
                }
                foreach (var l in languages)
                {
                    l.Id = 0; l.CandidateId = candidateId; l.CompanyId = authoritativeCompanyId;
                    _context.CandidateLanguages.Add(l);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = "Hobbies and Languages saved successfully." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Failed to save details.", error = ex.Message });
            }
        }

        // ✅ NEW: Upload Resume Only
        [HttpPost("upload-resume")]
        public async Task<IActionResult> UploadResume(
            [FromForm] string candidateId,
            [FromForm] string? companyId,
            [FromForm] IFormFile? resumeFile,
            [FromForm] DateTime? resumeEntryDate)
        {
            if (string.IsNullOrEmpty(candidateId) || string.IsNullOrEmpty(companyId))
                return BadRequest(new { message = "Candidate ID and Company ID are required." });

            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.CandidateId == candidateId && e.CompanyId == companyId);

            if (employee == null)
                return BadRequest(new { message = "Candidate profile not found." });

            var authoritativeCompanyId = employee.CompanyId;

            if (resumeFile == null || resumeFile.Length == 0)
                return BadRequest(new { message = "No resume file provided." });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Clean old resumes FOR THIS COMPANY
                var oldResumes = _context.CandidateResumes.Where(x => x.CandidateId == candidateId && x.CompanyId == authoritativeCompanyId);
                _context.CandidateResumes.RemoveRange(oldResumes);

                using var memoryStream = new MemoryStream();
                await resumeFile.CopyToAsync(memoryStream);

                var newResume = new CandidateResume
                {
                    CandidateId = candidateId,
                    CompanyId = authoritativeCompanyId,
                    FileName = resumeFile.FileName,
                    FileContent = memoryStream.ToArray(),
                    EntryDate = resumeEntryDate ?? DateTime.UtcNow
                };
                _context.CandidateResumes.Add(newResume);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Resume uploaded successfully." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Failed to upload resume.", error = ex.Message });
            }
        }
    }
}