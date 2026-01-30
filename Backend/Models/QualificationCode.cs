// fileName: Models/QualificationCode.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RecruitmentBackend.Models
{
    [Table("qualification_codes")] 
    public class QualificationCode
    {
        [Column("qlfcatid")] 
        public required string Code { get; set; }

        [Column("qlfcatname")] 
        public required string Name { get; set; }
        
        [Column("qlfsubid")] 
        public required string SubCode { get; set; }
        
        [Column("qlfsubname")] 
        public required string SubName { get; set; }
        
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