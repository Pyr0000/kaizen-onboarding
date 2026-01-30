// fileName: Models/Position.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore; // ✅ Required for [PrimaryKey]

namespace RecruitmentBackend.Models
{
    [Table("position_codes")]
    [PrimaryKey(nameof(Code), nameof(CompanyId))] // ✅ Explicitly define Composite PK
    public class Position
    {
        [Column("jobcode")] 
        public required string Code { get; set; } // Part 1 of PK

        [Column("jobpost")] 
        public required string Name { get; set; } 

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // --- Company Reference ---
        [Column("company_id")]
        public required string CompanyId { get; set; } // ✅ Part 2 of PK (Must be required)

        [ForeignKey("CompanyId")]
        public Company? Company { get; set; }
    }
}