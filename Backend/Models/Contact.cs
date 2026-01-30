// fileName: Models/Contact.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    [Table("ContactInformation")]
    public class ContactInformation : IAuditable // ✅ IMPLEMENT IAuditable
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public int Id { get; set; }

        // Foreign Key to Employee/Candidate
        [Required]
        [Column("candidate_id")]
        public required string CandidateId { get; set; }

        // ✅ NEW: Company Reference ID (Using snake_case for consistency with this table)
        [Column("company_id")]
        public string? CompanyId { get; set; }

        // --- Section 1: General Contact Information (Main) ---
        [Required]
        [Column("email")]
        public required string Email { get; set; }
        
        [Required]
        [Column("phone_number")]
        public required string PhoneNumber { get; set; } 
        
        [Column("office_number")]
        public string? OfficeNumber { get; set; }
        
        [Column("other_number")]
        public string? OtherNumber { get; set; }

        // --- Section 2: Correspondence Details (Primary Address) ---
        [Required]
        [Column("correspondence_address")]
        public required string CorrespondenceAddress { get; set; } 
        
        [Column("correspondence_state")]
        public string? CorrespondenceState { get; set; }
        
        [Column("correspondence_city")]
        public string? CorrespondenceCity { get; set; }
        
        [Column("correspondence_area")]
        public string? CorrespondenceArea { get; set; }
        
        [Column("correspondence_phone")]
        public string? CorrespondencePhone { get; set; }

        // --- Section 3: Permanent Address ---
        [Column("permanent_address")]
        public string? PermanentAddress { get; set; }
        
        [Column("permanent_phone")]
        public string? PermanentPhone { get; set; }

        // --- Section 4: Emergency Contact ---
        [Column("emergency_number")]
        public string? EmergencyNumber { get; set; }
        
        [Column("emergency_address")]
        public string? EmergencyAddress { get; set; }
        
        [Column("emergency_phone")]
        public string? EmergencyPhone { get; set; }
        
        // Navigation property back to Employee
        public Employee? Employee { get; set; }

        // System Fields (from IAuditable)
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}