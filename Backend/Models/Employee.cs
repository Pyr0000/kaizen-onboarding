// fileName: Models/Employee.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    public class Employee : IAuditable 
    {
        // NOTE: Ensure your AppDbContext defines a Composite Key for Employee
        // e.g. builder.Entity<Employee>().HasKey(e => new { e.CandidateId, e.CompanyId, e.PositionCode });
        
        public required string CandidateId { get; set; }

        // ✅ 1. This is part of the link to Position
        public string? CompanyId { get; set; }

        // ✅ 2. This is the other part of the link to Position
        public string? PositionCode { get; set; }

        // ✅ CRITICAL FIX: The Foreign Key must match the Target's Composite Primary Key (Code + CompanyId)
        [ForeignKey("PositionCode, CompanyId")]
        public Position? Position { get; set; }

        public DateTime? EntryDate { get; set; }
        public DateTime? BirthDate { get; set; }

        [Required]
        public required string FullName { get; set; } 

        public string Status { get; set; } = "Pending"; 

        // --- Other Foreign Keys ---
        public string? SalutationCode { get; set; }
        public Salutation? Salutation { get; set; }
        
        public string? OldIcNumber { get; set; }
        public string? NewIcNumber { get; set; }
        public string? Passport { get; set; }
        public string? Gender { get; set; }
        
        public string? MaritalStatusCode { get; set; }
        public MaritalStatus? MaritalStatus { get; set; } 
        
        public string? RaceCode { get; set; }
        public Race? Race { get; set; }
        
        public string? NativeStatus { get; set; } 
        
        public string? ReligionCode { get; set; }
        public Religion? Religion { get; set; }
        
        public string? NationalityCode { get; set; }
        public Nationality? Nationality { get; set; } 
        
        public string? CountryOfOriginCode { get; set; }
        public CountryOrigin? CountryOfOrigin { get; set; }
        
        public string? RecommendationType { get; set; } 
        public string? RecommendationDetails { get; set; }
        
        public string? Disability { get; set; }
        
        public string? Referee1 { get; set; }
        public string? Referee2 { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}