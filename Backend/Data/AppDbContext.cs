// fileName: Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using RecruitmentBackend.Models; 
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

public interface IAuditable
{
    DateTime CreatedAt { get; set; }
    DateTime? UpdatedAt { get; set; }
}

namespace RecruitmentBackend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // --- Core Application Entities ---
        public DbSet<Employee> Employees { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<ContactInformation> ContactInformation { get; set; }
        public DbSet<Qualification> Qualifications { get; set; }
        public DbSet<EmploymentHistory> EmploymentHistories { get; set; }
        public DbSet<Skill> Skills { get; set; }
        public DbSet<Company> Companies { get; set; }

        // Candidate Specific Data
        public DbSet<CandidateHobby> CandidateHobbies { get; set; }
        public DbSet<CandidateLanguage> CandidateLanguages { get; set; }
        public DbSet<CandidateResume> CandidateResumes { get; set; }
        public DbSet<FieldExperience> FieldExperiences { get; set; }
        
        // Normalized Lookup Tables
        public DbSet<Salutation> Salutations { get; set; }
        public DbSet<MaritalStatus> MaritalStatuses { get; set; }
        public DbSet<Race> Races { get; set; }
        public DbSet<Religion> Religions { get; set; }
        public DbSet<Nationality> Nationalities { get; set; }
        public DbSet<CountryOrigin> CountryOrigins { get; set; }
        
        // Specialized Lookup Tables
        public DbSet<QualificationCode> QualificationCodes { get; set; }
        public DbSet<QualificationGrade> QualificationGrades { get; set; } 

        // Lookup Tables (Static Codes)
        public DbSet<Industry> Industries { get; set; }
        public DbSet<Job> Jobs { get; set; }
        public DbSet<Position> Positions { get; set; }
        public DbSet<CessationReason> CessationReasons { get; set; }
        public DbSet<Hobby> Hobbies { get; set; }
        public DbSet<Language> Languages { get; set; }
        public DbSet<FieldArea> FieldAreas { get; set; }

        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            configurationBuilder.Properties<DateTime>().HaveConversion<DateTimeToUtcConverter>();
            configurationBuilder.Properties<DateTime?>().HaveConversion<NullableDateTimeToUtcConverter>();
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // =================================================================
            // NEW: COMPANY CONFIGURATION
            // =================================================================
            modelBuilder.Entity<Company>()
                .HasIndex(c => c.CompanyId)
                .IsUnique();

            // =================================================================
            // FIX FOR MULTI-COMPANY LOGIN
            // =================================================================
            modelBuilder.Entity<User>()
                .HasIndex(u => new { u.IcNumber, u.CompanyId })
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => new { u.Email, u.CompanyId })
                .IsUnique();

            // =================================================================
            // ✅ 1. COMPOSITE PRIMARY KEYS & MAIN ENTITIES
            // =================================================================
            
            // ✅ CRITICAL UPDATE: Employee is now identified by (CandidateId + CompanyId + PositionCode)
            // This allows the same person to apply for multiple positions in the same company.
            modelBuilder.Entity<Employee>()
                .HasKey(e => new { e.CandidateId, e.CompanyId, e.PositionCode });

            // 1:1 Tables (Shared Data - Unique per Candidate+Company)
            modelBuilder.Entity<Skill>().HasKey(s => new { s.CandidateId, s.CompanyId });
            modelBuilder.Entity<ContactInformation>().HasKey(c => new { c.CandidateId, c.CompanyId });

            // Lookup Composite Keys
            modelBuilder.Entity<Salutation>().HasKey(x => new { x.Code, x.CompanyId });
            modelBuilder.Entity<MaritalStatus>().HasKey(x => new { x.Code, x.CompanyId });
            modelBuilder.Entity<Race>().HasKey(x => new { x.Code, x.CompanyId });
            modelBuilder.Entity<Religion>().HasKey(x => new { x.Code, x.CompanyId });
            modelBuilder.Entity<Nationality>().HasKey(x => new { x.Code, x.CompanyId });
            modelBuilder.Entity<CountryOrigin>().HasKey(x => new { x.Code, x.CompanyId });
            
            modelBuilder.Entity<QualificationCode>().HasKey(x => new { x.Code, x.SubCode, x.CompanyId }); 
            modelBuilder.Entity<QualificationGrade>().HasKey(x => new { x.Code, x.CompanyId });
            
            modelBuilder.Entity<Industry>().HasKey(x => new { x.Code, x.CompanyId });
            modelBuilder.Entity<Job>().HasKey(x => new { x.Code, x.CompanyId });
            modelBuilder.Entity<Position>().HasKey(x => new { x.Code, x.CompanyId });
            modelBuilder.Entity<CessationReason>().HasKey(x => new { x.Code, x.CompanyId });
            modelBuilder.Entity<Hobby>().HasKey(x => new { x.Code, x.CompanyId });
            modelBuilder.Entity<Language>().HasKey(x => new { x.Code, x.CompanyId });
            modelBuilder.Entity<FieldArea>().HasKey(x => new { x.Code, x.CompanyId });

            // Define the Company Relationships
            modelBuilder.Entity<Salutation>().HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).HasPrincipalKey(c => c.CompanyId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<MaritalStatus>().HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).HasPrincipalKey(c => c.CompanyId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Race>().HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).HasPrincipalKey(c => c.CompanyId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Religion>().HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).HasPrincipalKey(c => c.CompanyId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Nationality>().HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).HasPrincipalKey(c => c.CompanyId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<CountryOrigin>().HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).HasPrincipalKey(c => c.CompanyId).OnDelete(DeleteBehavior.Cascade);
            
            modelBuilder.Entity<QualificationCode>().HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).HasPrincipalKey(c => c.CompanyId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<QualificationGrade>().HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).HasPrincipalKey(c => c.CompanyId).OnDelete(DeleteBehavior.Cascade);
            
            modelBuilder.Entity<Industry>().HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).HasPrincipalKey(c => c.CompanyId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Job>().HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).HasPrincipalKey(c => c.CompanyId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Position>().HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).HasPrincipalKey(c => c.CompanyId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<CessationReason>().HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).HasPrincipalKey(c => c.CompanyId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Hobby>().HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).HasPrincipalKey(c => c.CompanyId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Language>().HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).HasPrincipalKey(c => c.CompanyId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<FieldArea>().HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).HasPrincipalKey(c => c.CompanyId).OnDelete(DeleteBehavior.Cascade);

            // =================================================================
            // 2. MAIN SYNCHRONIZATION 
            // =================================================================
            // ⚠️ REMOVED: Strict Foreign Key links from Shared Tables (Contact, Skills, etc.) 
            // to Employee are removed because Employee is no longer unique per (CandidateId + CompanyId).
            // The logic is now handled loosely by ID matching in Controllers.

            // =================================================================
            // 3. EMPLOYEE LOOKUP RELATIONSHIPS
            // =================================================================
            
            modelBuilder.Entity<Employee>().HasOne(e => e.Salutation).WithMany()
                .HasForeignKey(e => new { e.SalutationCode, e.CompanyId })
                .HasPrincipalKey(s => new { s.Code, s.CompanyId })
                .OnDelete(DeleteBehavior.Restrict).IsRequired(false);

            modelBuilder.Entity<Employee>().HasOne(e => e.MaritalStatus).WithMany()
                .HasForeignKey(e => new { e.MaritalStatusCode, e.CompanyId })
                .HasPrincipalKey(s => new { s.Code, s.CompanyId })
                .OnDelete(DeleteBehavior.Restrict).IsRequired(false);

            modelBuilder.Entity<Employee>().HasOne(e => e.Race).WithMany()
                .HasForeignKey(e => new { e.RaceCode, e.CompanyId })
                .HasPrincipalKey(r => new { r.Code, r.CompanyId })
                .OnDelete(DeleteBehavior.Restrict).IsRequired(false);

            modelBuilder.Entity<Employee>().HasOne(e => e.Religion).WithMany()
                .HasForeignKey(e => new { e.ReligionCode, e.CompanyId })
                .HasPrincipalKey(r => new { r.Code, r.CompanyId })
                .OnDelete(DeleteBehavior.Restrict).IsRequired(false);

            modelBuilder.Entity<Employee>().HasOne(e => e.Nationality).WithMany()
                .HasForeignKey(e => new { e.NationalityCode, e.CompanyId })
                .HasPrincipalKey(n => new { n.Code, n.CompanyId })
                .OnDelete(DeleteBehavior.Restrict).IsRequired(false);

            modelBuilder.Entity<Employee>().HasOne(e => e.CountryOfOrigin).WithMany()
                .HasForeignKey(e => new { e.CountryOfOriginCode, e.CompanyId })
                .HasPrincipalKey(c => new { c.Code, c.CompanyId })
                .OnDelete(DeleteBehavior.Restrict).IsRequired(false);

            // =================================================================
            // 4. EXISTING CONFIGURATION
            // =================================================================
            modelBuilder.Entity<Employee>().Property(e => e.BirthDate).HasColumnType("date").HasConversion(v => v.HasValue ? v.Value.Date : v, v => v);
            modelBuilder.Entity<Employee>().Property(e => e.EntryDate).HasColumnType("date").HasConversion(v => v.HasValue ? v.Value.Date : v, v => v);
        }

        public override int SaveChanges()
        {
            ApplyTimestamps();
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            ApplyTimestamps();
            return await base.SaveChangesAsync(cancellationToken);
        }

        private void ApplyTimestamps()
        {
            var entries = ChangeTracker.Entries().Where(e => e.Entity is IAuditable && (e.State == EntityState.Added || e.State == EntityState.Modified));
            foreach (var entityEntry in entries)
            {
                var auditableEntity = (IAuditable)entityEntry.Entity;
                if (entityEntry.State == EntityState.Added) auditableEntity.CreatedAt = DateTime.UtcNow;
                auditableEntity.UpdatedAt = DateTime.UtcNow; 
            }
        }
    }

    public class DateTimeToUtcConverter : ValueConverter<DateTime, DateTime>
    {
        public DateTimeToUtcConverter() : base(v => v.ToUniversalTime(), v => DateTime.SpecifyKind(v, DateTimeKind.Utc)) { }
    }

    public class NullableDateTimeToUtcConverter : ValueConverter<DateTime?, DateTime?>
    {
        public NullableDateTimeToUtcConverter() : base(v => v.HasValue ? v.Value.ToUniversalTime() : v, v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v) { }
    }
}