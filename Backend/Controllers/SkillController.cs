// fileName: Controllers/SkillController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;
using System;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SkillController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SkillController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Skill/{candidateId}?companyId=...
        [HttpGet("{candidateId}")]
        public async Task<ActionResult<Skill>> GetSkill(string candidateId, [FromQuery] string companyId)
        {
            if (string.IsNullOrEmpty(companyId))
            {
                return BadRequest(new { message = "Company ID is required." });
            }

            // ✅ DATA ISOLATION: Filter by CandidateId AND CompanyId
            var skill = await _context.Skills
                .FirstOrDefaultAsync(s => s.CandidateId == candidateId && s.CompanyId == companyId);

            return Ok(skill); // Returns null (204) if not found, which is fine
        }

        // POST: api/Skill
        [HttpPost]
        public async Task<IActionResult> SaveSkill([FromBody] Skill skillData)
        {
            if (skillData == null || string.IsNullOrEmpty(skillData.CandidateId))
            {
                return BadRequest(new { message = "Invalid data or missing Candidate ID." });
            }

            if (string.IsNullOrEmpty(skillData.CompanyId))
            {
                 return BadRequest(new { message = "Company ID is required." });
            }

            // ✅ CRITICAL FIX: Strict Employee Lookup
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.CandidateId == skillData.CandidateId && e.CompanyId == skillData.CompanyId);

            if (employee == null)
            {
                return BadRequest(new { message = "Candidate profile not found for this specific Company." });
            }

            // Enforce CompanyId
            skillData.CompanyId = employee.CompanyId;

            // Check if skills exist FOR THIS COMPANY
            var existingSkill = await _context.Skills
                .FirstOrDefaultAsync(s => s.CandidateId == skillData.CandidateId && s.CompanyId == skillData.CompanyId);

            if (existingSkill != null)
            {
                // UPDATE existing record
                existingSkill.OfficeSkills = skillData.OfficeSkills;
                existingSkill.OtherRelevantSkills = skillData.OtherRelevantSkills;
                existingSkill.OtherSkillInformation = skillData.OtherSkillInformation;
                // CompanyId and CandidateId remain the same
                
                _context.Skills.Update(existingSkill);
            }
            else
            {
                // CREATE new record
                skillData.Id = 0; 
                await _context.Skills.AddAsync(skillData);
            }

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Skill details saved successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error saving data", error = ex.Message });
            }
        }
    }
}