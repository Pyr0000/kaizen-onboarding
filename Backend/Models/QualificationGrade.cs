// fileName: Models/QualificationGrade.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    [Table("qualification_grades")] 
    public class QualificationGrade
    {
        [Key]
        [Column("qlfgradecode")] 
        public required string Code { get; set; }

        [Column("qlfgradename")] 
        public required string Description { get; set; }
        
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // --- ✅ NEW: Company Reference ---
        [Column("company_id")]
        public string? CompanyId { get; set; }

        [ForeignKey("CompanyId")]
        public Company? Company { get; set; }
        // -------------------------------------
    }
}