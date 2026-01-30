// fileName: Controllers/FieldExperienceController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FieldExperienceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FieldExperienceController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/FieldExperience/{candidateId}?companyId=...
        [HttpGet("{candidateId}")]
        public async Task<ActionResult<IEnumerable<FieldExperience>>> GetFieldExperience(string candidateId, [FromQuery] string companyId)
        {
            if (string.IsNullOrEmpty(companyId))
            {
                return BadRequest(new { message = "Company ID is required." });
            }

            // ✅ DATA ISOLATION: Filter by CandidateId AND CompanyId
            var experience = await _context.FieldExperiences
                .Where(e => e.CandidateId == candidateId && e.CompanyId == companyId)
                .ToListAsync();

            return Ok(experience);
        }

        // POST: api/FieldExperience
        [HttpPost]
        public async Task<IActionResult> SaveFieldExperience([FromBody] List<FieldExperience> experiences)
        {
            if (experiences == null || !experiences.Any())
            {
                // Return empty success if nothing to save
                return Ok(new { message = "No records to save." });
            }

            var firstRecord = experiences.First();
            var candidateId = firstRecord.CandidateId;
            var submittedCompanyId = firstRecord.CompanyId; // ✅ Get CompanyId from payload

            if (string.IsNullOrEmpty(candidateId) || string.IsNullOrEmpty(submittedCompanyId))
            {
                return BadRequest(new { message = "Candidate ID and Company ID are required." });
            }

            // ✅ CRITICAL FIX: Strict Employee Lookup
            // We must find the employee record that matches BOTH the CandidateId AND the CompanyId.
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.CandidateId == candidateId && e.CompanyId == submittedCompanyId);

            if (employee == null)
            {
                return BadRequest(new { message = "Candidate profile not found for this specific Company. Please complete the Personal Information form first." });
            }

            // Use the authoritative CompanyId
            var companyId = employee.CompanyId; 

            // Duplicate Check (Logic remains same)
            var duplicateCodes = experiences
                .Where(e => !string.IsNullOrEmpty(e.FieldAreaCode))
                .GroupBy(e => e.FieldAreaCode)
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToList();

            if (duplicateCodes.Any())
            {
                return BadRequest(new { 
                    message = $"Duplicate detected: The Field Area Code '{duplicateCodes.First()}' is listed multiple times." 
                });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Remove existing records ONLY for this specific company
                var existingRecords = await _context.FieldExperiences
                    .Where(e => e.CandidateId == candidateId && e.CompanyId == companyId)
                    .ToListAsync();

                if (existingRecords.Any())
                {
                    _context.FieldExperiences.RemoveRange(existingRecords);
                }

                // 2. Add new records
                foreach (var exp in experiences)
                {
                    exp.Id = 0; 
                    if (exp.Description == null) exp.Description = "";
                    
                    // ✅ CRITICAL: Enforce CompanyId on every record
                    exp.CompanyId = companyId;
                    exp.CandidateId = candidateId;
                }

                await _context.FieldExperiences.AddRangeAsync(experiences);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = $"Successfully saved {experiences.Count} record(s)." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "An error occurred while saving data.", error = ex.Message });
            }
        }
    }
}