using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RecruitmentBackend.Data; // Ensure this namespace is accessible for IAuditable

namespace RecruitmentBackend.Models
{
    // Implements IAuditable so AppDbContext can handle CreatedAt/UpdatedAt automatically
    public class Skill : IAuditable
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        // Foreign Key to Employee/Candidate
        [Required]
        public required string CandidateId { get; set; }

        // ✅ NEW: Company Reference ID
        public string? CompanyId { get; set; }

        // --- Fields mapping directly to SkillForm.js state ---
        
        // Maps to officeSkill
        public string? OfficeSkills { get; set; }
        
        // Maps to otherSkill 
        public string? OtherRelevantSkills { get; set; }
        
        // Maps to otherInfo
        public string? OtherSkillInformation { get; set; }

        // --- System Fields ---
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}