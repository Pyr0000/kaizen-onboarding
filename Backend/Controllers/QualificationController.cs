// fileName: Controllers/QualificationController.cs
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
    public class QualificationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public QualificationController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Qualification/{candidateId}?companyId=...
        [HttpGet("{candidateId}")]
        public async Task<IActionResult> GetQualifications(string candidateId, [FromQuery] string companyId)
        {
            if (string.IsNullOrEmpty(companyId))
            {
                return BadRequest(new { message = "Company ID is required." });
            }

            // ✅ DATA ISOLATION: Filter by CandidateId AND CompanyId
            var qualifications = await _context.Qualifications
                .Where(q => q.CandidateId == candidateId && q.CompanyId == companyId)
                .OrderBy(q => q.SinceWhenDate)
                .ToListAsync();

            return Ok(qualifications ?? new List<Qualification>());
        }

        // POST: api/Qualification
        [HttpPost]
        public async Task<IActionResult> SaveQualifications([FromBody] List<Qualification> submittedQualifications)
        {
            if (submittedQualifications == null || !submittedQualifications.Any())
            {
                // If list is empty, we don't do anything (or you could choose to clear all).
                // Usually returning empty OK is safest if nothing was sent.
                return Ok(new List<Qualification>());
            }

            var firstEntry = submittedQualifications.First();
            var candidateId = firstEntry.CandidateId;
            var submittedCompanyId = firstEntry.CompanyId; // ✅ Get CompanyId from payload

            if (string.IsNullOrEmpty(candidateId) || string.IsNullOrEmpty(submittedCompanyId))
            {
                return BadRequest(new { message = "CandidateId and CompanyId are required." });
            }

            // ✅ CRITICAL FIX: Strict Employee Lookup
            // We must ensure the candidate exists in THIS specific company.
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.CandidateId == candidateId && e.CompanyId == submittedCompanyId);

            if (employee == null)
            {
                return BadRequest(new { message = "Candidate profile not found for this specific Company. Please complete the Personal Information form first." });
            }

            // Use the authoritative CompanyId from the found employee record (should match submitted)
            var companyId = employee.CompanyId; 

            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    // 1. Get existing records strictly for THIS Company
                    var existingQualifications = await _context.Qualifications
                        .Where(q => q.CandidateId == candidateId && q.CompanyId == companyId)
                        .ToListAsync();

                    // 2. Duplicate Check (Frontend handles this too, but Backend must be safe)
                    foreach (var submittedQual in submittedQualifications)
                    {
                        string subCode = submittedQual.QualificationSubCode ?? string.Empty;
                        string gradeCode = submittedQual.QualificationGradeCode ?? string.Empty;

                        // Check if this combination exists in DB (excluding the current item itself if editing)
                        var isDuplicate = existingQualifications.Any(dbQual => 
                            dbQual.Id != submittedQual.Id && 
                            (dbQual.QualificationSubCode ?? string.Empty) == subCode &&
                            (dbQual.QualificationGradeCode ?? string.Empty) == gradeCode
                        );

                        if (isDuplicate)
                        {
                            return BadRequest(new { 
                                message = $"Duplicate detected: Sub-Code '{subCode}' and Grade '{gradeCode}' already exists." 
                            });
                        }
                    }

                    // 3. Identify and Delete removed items
                    // We keep IDs present in the submission. Everything else in DB for this user/company is deleted.
                    var idsToKeep = submittedQualifications.Select(s => s.Id).Where(id => id != 0).ToList();
                    
                    var qualificationsToDelete = existingQualifications
                        .Where(eq => !idsToKeep.Contains(eq.Id))
                        .ToList();

                    if (qualificationsToDelete.Any())
                    {
                        _context.Qualifications.RemoveRange(qualificationsToDelete);
                    }

                    // 4. Insert or Update
                    foreach (var submittedQual in submittedQualifications)
                    {
                        // Enforce IDs strictly
                        submittedQual.CandidateId = candidateId;
                        submittedQual.CompanyId = companyId; // ✅ Ensure CompanyId is stamped

                        if (submittedQual.Id == 0)
                        {
                            // INSERT
                            submittedQual.CreatedAt = DateTime.UtcNow;
                            _context.Qualifications.Add(submittedQual);
                        }
                        else
                        {
                            // UPDATE
                            var existingQual = existingQualifications.FirstOrDefault(eq => eq.Id == submittedQual.Id);
                            if (existingQual != null)
                            {
                                // Copy values securely
                                _context.Entry(existingQual).CurrentValues.SetValues(submittedQual);
                                
                                // Re-assert Key Fields (safety measure)
                                existingQual.CompanyId = companyId;
                                existingQual.CandidateId = candidateId;
                                existingQual.UpdatedAt = DateTime.UtcNow;
                            }
                        }
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    // 5. Return latest state
                    var finalQualifications = await _context.Qualifications
                        .Where(q => q.CandidateId == candidateId && q.CompanyId == companyId)
                        .OrderBy(q => q.SinceWhenDate)
                        .ToListAsync();

                    return Ok(finalQualifications);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(500, new { message = "An error occurred while saving qualifications.", error = ex.Message });
                }
            }
        }
    }
}