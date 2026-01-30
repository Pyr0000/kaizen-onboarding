using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    public class CandidateLanguage : IAuditable
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        // FIX: Changed to 'string?' (nullable).
        [Required]
        public string? CandidateId { get; set; }

        // ✅ NEW: Company Reference ID
        public string? CompanyId { get; set; }

        [Required]
        public required string LanguageCode { get; set; }

        public string? ReadLevel { get; set; }
        public string? WrittenLevel { get; set; }
        public string? SpokenLevel { get; set; }
        
        public DateTime EntryDate { get; set; }

        // IAuditable implementation
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}