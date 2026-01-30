using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

// ✅ UPDATED NAMESPACE to match your project
namespace RecruitmentBackend.Models 
{
    [Index(nameof(CompanyId), IsUnique = true)] // Ensures CompanyId is unique
    public class Company
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; } // Internal Primary Key

        // This is the "COMP-001" or "123456-X" you enter in the frontend
        [Required]
        [Column("company_id")]
        [StringLength(50)]
        public string CompanyId { get; set; } = string.Empty;

        [Required]
        [Column("company_name")]
        [StringLength(150)]
        public string CompanyName { get; set; } = string.Empty;

        // ✅ NEW FIELD
        [Column("company_details")]
        public string? CompanyDetails { get; set; }

        // ✅ NEW FIELD: Colour Code
        [Column("colour_code")]
        [StringLength(20)]
        public string? ColourCode { get; set; }

        [Column("logo_path")]
        public string? LogoPath { get; set; } 

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}