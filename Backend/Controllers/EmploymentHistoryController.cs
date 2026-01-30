// fileName: Controllers/EmploymentHistoryController.cs
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
    public class EmploymentHistoryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EmploymentHistoryController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/EmploymentHistory/{candidateId}?companyId=...
        [HttpGet("{candidateId}")]
        public async Task<ActionResult<IEnumerable<EmploymentHistory>>> GetEmploymentHistory(string candidateId, [FromQuery] string companyId)
        {
            if (string.IsNullOrEmpty(companyId))
            {
                return BadRequest(new { message = "Company ID is required." });
            }

            // ✅ DATA ISOLATION: Filter by CandidateId AND CompanyId
            // This ensures we only retrieve records belonging to the currently logged-in company context.
            var history = await _context.EmploymentHistories
                .Where(h => h.CandidateId == candidateId && h.CompanyId == companyId)
                .OrderByDescending(h => h.FromDate)
                .ToListAsync();

            return Ok(history);
        }

        // POST: api/EmploymentHistory
        [HttpPost]
        public async Task<IActionResult> SaveEmploymentHistory([FromBody] List<EmploymentHistory> records)
        {
            if (records == null || !records.Any())
            {
                return BadRequest(new { message = "No employment records provided." });
            }

            var firstRecord = records.First();
            var candidateId = firstRecord.CandidateId;
            var submittedCompanyId = firstRecord.CompanyId; // ✅ Get CompanyId from payload

            if (string.IsNullOrEmpty(candidateId) || string.IsNullOrEmpty(submittedCompanyId))
            {
                return BadRequest(new { message = "Candidate ID and Company ID are required." });
            }

            // ✅ CRITICAL FIX: Strict Employee Lookup
            // Find the employee record that matches BOTH the CandidateId AND the CompanyId.
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.CandidateId == candidateId && e.CompanyId == submittedCompanyId);

            if (employee == null)
            {
                return BadRequest(new { message = "Candidate profile not found for this specific Company. Please complete the Personal Information form first." });
            }

            // Use the authoritative CompanyId (should match submitted, but safer to take from DB record)
            var companyId = employee.CompanyId;

            // --- Duplicate Checks (Logic remains same) ---
            var duplicateIndustries = records
                .Where(r => !string.IsNullOrEmpty(r.IndustryCode))
                .GroupBy(r => r.IndustryCode)
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToList();

            if (duplicateIndustries.Any())
            {
                return BadRequest(new { 
                    message = $"Duplicate detected: The Industry Code '{duplicateIndustries.First()}' is used multiple times in this submission." 
                });
            }

            var duplicateJobs = records
                .Where(r => !string.IsNullOrEmpty(r.JobCode))
                .GroupBy(r => r.JobCode)
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToList();

            if (duplicateJobs.Any())
            {
                return BadRequest(new { 
                    message = $"Duplicate detected: The Job Code '{duplicateJobs.First()}' is used multiple times in this submission." 
                });
            }
            // ---------------------------------------------

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Retrieve existing records ONLY for this specific company
                var existingRecords = await _context.EmploymentHistories
                    .Where(h => h.CandidateId == candidateId && h.CompanyId == companyId)
                    .ToListAsync();

                // 2. Remove existing records (Full replace strategy for this user+company)
                if (existingRecords.Any())
                {
                    _context.EmploymentHistories.RemoveRange(existingRecords);
                }

                // 3. Add new records
                foreach (var record in records)
                {
                    record.Id = 0; // Reset ID to ensure new insertion
                    
                    // ✅ CRITICAL: Enforce CompanyId on every record
                    record.CompanyId = companyId;
                    
                    // Ensure CandidateId consistency
                    record.CandidateId = candidateId; 
                }

                await _context.EmploymentHistories.AddRangeAsync(records);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(records);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "An error occurred while saving data.", error = ex.Message });
            }
        }
    }
}