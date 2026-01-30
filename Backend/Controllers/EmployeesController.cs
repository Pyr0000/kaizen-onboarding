// fileName: Controllers/EmployeesController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http; 
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;
using System.Text;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System; 
using System.IO; 
using System.Diagnostics; 
using Npgsql; 

namespace RecruitmentBackend.Controllers
{
    // --- DTO for cleaner API output ---
    public class EmployeeDetailsDto 
    {
        public required string CandidateId { get; set; }
        public required string FullName { get; set; }
        public string Status { get; set; } = "Pending";

        public string? CompanyId { get; set; }

        // ✅ Position Info
        public string? PositionCode { get; set; }
        public string? PositionName { get; set; }

        // Dynamic Lookup Fields
        public string? SalutationCode { get; set; }
        public string? SalutationDescription { get; set; } 
        
        public string? MaritalStatusCode { get; set; }
        public string? MaritalStatusDescription { get; set; }
        
        public string? RaceCode { get; set; }
        public string? RaceDescription { get; set; }
        
        public string? ReligionCode { get; set; }
        public string? ReligionDescription { get; set; } 
        
        public string? NationalityCode { get; set; }
        public string? NationalityDescription { get; set; } 
        
        public string? CountryOfOriginCode { get; set; }
        public string? CountryOfOriginDescription { get; set; } 
        
        public string? OldIcNumber { get; set; }
        public string? NewIcNumber { get; set; }
        public string? Passport { get; set; }
        public string? Gender { get; set; }
        public string? NativeStatus { get; set; }
        
        public string? RecommendationType { get; set; }
        public string? RecommendationDetails { get; set; }

        public string? Disability { get; set; }
        
        public string? Referee1 { get; set; }
        public string? Referee2 { get; set; }

        public DateTime? BirthDate { get; set; }
        public DateTime? EntryDate { get; set; } 
        public DateTime CreatedAt { get; set; }
    }

    public class StatusUpdateDto
    {
        public required string Status { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EmployeesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("salutations")]
        public async Task<IActionResult> GetSalutationNames()
        {
            var salutationNames = await _context.Salutations
                .AsNoTracking()
                .Select(s => s.Name)
                .OrderBy(name => name)
                .ToListAsync();

            return Ok(salutationNames);
        }

        // =======================================================
        // EMPLOYEE ENDPOINTS
        // =======================================================

        private IQueryable<EmployeeDetailsDto> GetEmployeeQuery()
        {
            // Helper to build the base query with all joins
            var query = _context.Employees
                .AsNoTracking()
                .Include(e => e.Position)
                .Include(e => e.Salutation)
                .Include(e => e.MaritalStatus)
                .Include(e => e.Race)
                .Include(e => e.Religion)
                .Include(e => e.Nationality)
                .Include(e => e.CountryOfOrigin)
                .Select(e => new EmployeeDetailsDto
                {
                    CandidateId = e.CandidateId,
                    FullName = e.FullName,
                    Status = e.Status,
                    CompanyId = e.CompanyId,
                    
                    PositionCode = e.PositionCode,
                    PositionName = e.Position != null ? e.Position.Name : null,

                    SalutationCode = e.SalutationCode,
                    SalutationDescription = e.Salutation != null ? e.Salutation.Name : null,
                    
                    MaritalStatusCode = e.MaritalStatusCode,
                    MaritalStatusDescription = e.MaritalStatus != null ? e.MaritalStatus.Name : null,
                    
                    RaceCode = e.RaceCode,
                    RaceDescription = e.Race != null ? e.Race.Name : null,
                    
                    ReligionCode = e.ReligionCode,
                    ReligionDescription = e.Religion != null ? e.Religion.Name : null,
                    
                    NationalityCode = e.NationalityCode,
                    NationalityDescription = e.Nationality != null ? e.Nationality.Name : null,
                    
                    CountryOfOriginCode = e.CountryOfOriginCode,
                    CountryOfOriginDescription = e.CountryOfOrigin != null ? e.CountryOfOrigin.Name : null,

                    OldIcNumber = e.OldIcNumber,
                    NewIcNumber = e.NewIcNumber,
                    Passport = e.Passport,
                    Gender = e.Gender,
                    NativeStatus = e.NativeStatus,
                    
                    RecommendationType = e.RecommendationType,
                    RecommendationDetails = e.RecommendationDetails,
                    
                    Disability = e.Disability,
                    
                    Referee1 = e.Referee1,
                    Referee2 = e.Referee2,

                    BirthDate = e.BirthDate,
                    EntryDate = e.EntryDate, 
                    CreatedAt = e.CreatedAt
                });

            return query;
        }

        // GET: api/employees?companyId=XYZ
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? companyId)
        {
            var query = GetEmployeeQuery();

            if (!string.IsNullOrEmpty(companyId))
            {
                query = query.Where(e => e.CompanyId == companyId);
            }

            // Returns all rows, including multiple rows for same candidate if they have diff positions
            var employeeDtos = await query.ToListAsync();
            return Ok(employeeDtos);
        }

        // GET: api/employees/{id}?companyId=XYZ&positionCode=ABC
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id, [FromQuery] string? companyId, [FromQuery] string? positionCode)
        {
            var query = GetEmployeeQuery().Where(dto => dto.CandidateId == id);

            if (!string.IsNullOrEmpty(companyId))
            {
                query = query.Where(dto => dto.CompanyId == companyId);
            }

            // ✅ Filter by Position Code specifically
            if (!string.IsNullOrEmpty(positionCode))
            {
                query = query.Where(dto => dto.PositionCode == positionCode);
            }

            // If no position specified, grab the latest one
            var employeeDto = await query.OrderByDescending(e => e.CreatedAt).FirstOrDefaultAsync();
                
            if (employeeDto is null)
            {
                return NotFound(new { message = "Employee profile not found for the specified criteria." });
            }
            return Ok(employeeDto);
        }

        // POST: api/employees
        [HttpPost]
        public async Task<IActionResult> CreateOrUpdate(Employee employee)
        {
            SanitizeEmployee(employee);

            if (string.IsNullOrWhiteSpace(employee.Status)) employee.Status = "Pending";

            if (string.IsNullOrWhiteSpace(employee.CompanyId))
                return BadRequest(new { message = "Company ID is required." });

            Employee? existingEmployee = null;

            if (!string.IsNullOrWhiteSpace(employee.CandidateId))
            {
                // ✅ STRICT CHECK: Match Candidate + Company + Position
                var query = _context.Employees.AsQueryable();
                
                query = query.Where(e => e.CandidateId == employee.CandidateId && e.CompanyId == employee.CompanyId);

                if (!string.IsNullOrEmpty(employee.PositionCode))
                {
                    query = query.Where(e => e.PositionCode == employee.PositionCode);
                }

                existingEmployee = await query.FirstOrDefaultAsync();
            }

            if (existingEmployee != null)
            {
                // --- UPDATE EXISTING RECORD FOR THIS POSITION ---
                _context.Entry(existingEmployee).CurrentValues.SetValues(employee);
                
                try
                {
                    await _context.SaveChangesAsync();
                    return Ok(existingEmployee);
                }
                catch (DbUpdateException ex)
                {
                    return HandleDbUpdateException(ex);
                }
            }
            else
            {
                // --- CREATE NEW RECORD ---
                if (string.IsNullOrWhiteSpace(employee.CandidateId))
                {
                    // Generate new ID if not provided
                    var ids = await _context.Employees
                        .Where(e => e.CandidateId != null && e.CandidateId.StartsWith("CAND"))
                        .Select(e => e.CandidateId)
                        .ToListAsync();
                    
                    var maxNum = ids
                        .Select(id => int.TryParse(id.Substring(4), out var num) ? num : 0)
                        .DefaultIfEmpty(0)
                        .Max();

                    employee.CandidateId = $"CAND{(maxNum + 1).ToString().PadLeft(3, '0')}";
                }
                
                _context.Employees.Add(employee);

                try 
                {
                    await _context.SaveChangesAsync();
                    return CreatedAtAction(nameof(GetById), 
                        new { id = employee.CandidateId, companyId = employee.CompanyId, positionCode = employee.PositionCode }, 
                        employee);
                }
                catch (DbUpdateException ex)
                {
                    return HandleDbUpdateException(ex);
                }
            }
        }

        // PUT: api/employees/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Employee update)
        {
            var query = _context.Employees.Where(e => e.CandidateId == id);
            
            // ✅ CRITICAL: Enforce CompanyId Check
            if (string.IsNullOrEmpty(update.CompanyId))
            {
                return BadRequest(new { message = "CompanyId is required for updates." });
            }
            query = query.Where(e => e.CompanyId == update.CompanyId);

            // ✅ CRITICAL: Enforce PositionCode Check
            // This ensures we don't accidentally update the wrong job application
            if (!string.IsNullOrEmpty(update.PositionCode))
            {
                query = query.Where(e => e.PositionCode == update.PositionCode);
            }

            var employee = await query.FirstOrDefaultAsync();

            if (employee is null)
            {
                return NotFound(new { message = $"Employee record not found for Position: {update.PositionCode ?? "Any"}." });
            }

            SanitizeEmployee(update);
            
            if (string.IsNullOrWhiteSpace(update.Status))
            {
               update.Status = employee.Status;
            }

            _context.Entry(employee).CurrentValues.SetValues(update);
            
            try
            {
                await _context.SaveChangesAsync();
                return Ok(employee);
            }
            catch (DbUpdateException ex)
            {
                return HandleDbUpdateException(ex);
            }
        }

        // PATCH: api/employees/{id}/status
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] StatusUpdateDto statusDto, [FromQuery] string? companyId, [FromQuery] string? positionCode)
        {
            if (statusDto == null || string.IsNullOrWhiteSpace(statusDto.Status))
            {
                return BadRequest(new { message = "Status is required." });
            }

            if (string.IsNullOrEmpty(companyId))
            {
                 return BadRequest(new { message = "CompanyId is required to update status." });
            }

            var query = _context.Employees.Where(e => e.CandidateId == id && e.CompanyId == companyId);

            // ✅ CRITICAL: Strict Position Isolation
            // If positionCode is provided, we ONLY update that specific row.
            // If it is NOT provided, and the user has multiple rows, we prevent ambiguous updates.
            if (!string.IsNullOrEmpty(positionCode))
            {
                query = query.Where(e => e.PositionCode == positionCode);
            }
            else
            {
                // Safety check: If multiple positions exist for this candidate but no positionCode was sent,
                // we should warn or handle it. For now, we allow FirstOrDefault but it's risky without PositionCode.
                // Best practice is for frontend to ALWAYS send PositionCode.
                var count = await query.CountAsync();
                if (count > 1) 
                {
                     return BadRequest(new { message = "Candidate has multiple applications. Please specify PositionCode." });
                }
            }

            var employee = await query.FirstOrDefaultAsync();
            
            if (employee is null)
            {
                return NotFound(new { message = "Employee application not found." });
            }

            employee.Status = statusDto.Status;
            employee.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = $"Status updated to '{employee.Status}' for Position '{employee.PositionCode}'", status = employee.Status });
            }
            catch (DbUpdateException ex)
            {
                return HandleDbUpdateException(ex);
            }
        }

        // DELETE: api/employees/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id, [FromQuery] string? companyId, [FromQuery] string? positionCode)
        {
            if (string.IsNullOrEmpty(companyId))
            {
                 return BadRequest(new { message = "CompanyId is required for deletion." });
            }

            var query = _context.Employees.Where(e => e.CandidateId == id && e.CompanyId == companyId);

            // ✅ CRITICAL: Strict Position Deletion
            if (!string.IsNullOrEmpty(positionCode))
            {
                query = query.Where(e => e.PositionCode == positionCode);
            }
            else
            {
                 // Safety check for ambiguity
                var count = await query.CountAsync();
                if (count > 1) 
                {
                     return BadRequest(new { message = "Candidate has multiple applications. Please specify PositionCode to delete." });
                }
            }

            var employee = await query.FirstOrDefaultAsync();
            
            if (employee is null)
            {
                return NotFound(new { message = "Employee record not found." });
            }

            _context.Employees.Remove(employee);
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Application for Position '{employee.PositionCode}' deleted successfully." });
        }

        private void SanitizeEmployee(Employee employee)
        {
            if (string.IsNullOrWhiteSpace(employee.SalutationCode)) employee.SalutationCode = null;
            if (string.IsNullOrWhiteSpace(employee.MaritalStatusCode)) employee.MaritalStatusCode = null;
            if (string.IsNullOrWhiteSpace(employee.RaceCode)) employee.RaceCode = null;
            if (string.IsNullOrWhiteSpace(employee.ReligionCode)) employee.ReligionCode = null;
            if (string.IsNullOrWhiteSpace(employee.NationalityCode)) employee.NationalityCode = null;
            if (string.IsNullOrWhiteSpace(employee.CountryOfOriginCode)) employee.CountryOfOriginCode = null;
        }

        private IActionResult HandleDbUpdateException(DbUpdateException ex)
        {
            if (ex.InnerException is PostgresException pgEx && pgEx.SqlState == "23503")
            {
                return BadRequest(new { message = "Invalid Reference Code or Position Code. Please check your inputs." });
            }

            return StatusCode(500, new { message = "An internal database error occurred.", details = ex.InnerException?.Message ?? ex.Message });
        }
    }
}