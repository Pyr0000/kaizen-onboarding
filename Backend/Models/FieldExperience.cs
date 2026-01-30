// fileName: Models/FieldExperience.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RecruitmentBackend.Data; // Ensure this namespace is accessible for IAuditable

namespace RecruitmentBackend.Models
{
    // Implements IAuditable to work with AppDbContext.ApplyTimestamps
    public class FieldExperience : IAuditable
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        // Foreign Key to Employee/Candidate
        [Required]
        public required string CandidateId { get; set; }

        // ✅ NEW: Company Reference ID
        public string? CompanyId { get; set; }

        [Required]
        public required string FieldName { get; set; } // Maps to fieldAreaName
        
        [Required]
        public string FieldAreaCode { get; set; } = string.Empty; // Maps to fieldAreaCode

        public int YearsOfExperience { get; set; } // Maps to yearInField (int)
        
        public string? Description { get; set; } // Maps to remark/description
             
        public DateTime EntryDate { get; set; }

        // IAuditable implementation
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}