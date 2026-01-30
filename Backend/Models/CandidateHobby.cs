using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    public class CandidateHobby : IAuditable
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        // FIX: Changed to 'string?' (nullable). 
        // The [Required] attribute ensures it is still NOT NULL in the database.
        [Required]
        public string? CandidateId { get; set; }

        // ✅ NEW: Company Reference ID
        public string? CompanyId { get; set; }

        [Required]
        public required string HobbyCode { get; set; }

        public string? AbilityLevel { get; set; }
        public string? LocalDescription { get; set; }
        
        public DateTime EntryDate { get; set; }

        // IAuditable implementation
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}