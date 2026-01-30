// fileName: Controllers/AuthController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;
using RecruitmentBackend.Models.Dtos;
using System.Threading.Tasks;
using BCrypt.Net;
using System.IdentityModel.Tokens.Jwt; 
using System.Text; 
using Microsoft.IdentityModel.Tokens; 
using System.Security.Claims; 
using System; 
using System.Linq; 
using Microsoft.Extensions.Configuration; 
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization; 

namespace RecruitmentBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration; 

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration; 
        }

        // Helper to generate Candidate IDs
        private async Task<string> GenerateCandidateId()
        {
            var lastUser = await _context.Users
                .Where(u => u.CandidateId != null && u.CandidateId.StartsWith("CAND"))
                .OrderByDescending(u => u.CreatedAt) 
                .FirstOrDefaultAsync();

            if (lastUser == null || string.IsNullOrEmpty(lastUser.CandidateId))
                return "CAND001"; 

            string numericPart = lastUser.CandidateId.Replace("CAND", "");
            if (int.TryParse(numericPart, out int number))
                return $"CAND{(number + 1):D3}"; 

            return $"CAND{DateTime.UtcNow.Ticks.ToString().Substring(10)}"; 
        }

        // ==========================================================
        // 1. CANDIDATE AREA
        // ==========================================================

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequestDto request)
        {
            var cleanIcNumber = request.IcNumber?.Trim();
            var cleanEmail = request.Email?.Trim();

            if (string.IsNullOrEmpty(cleanIcNumber))
                 return BadRequest(new { Message = "IC Number is required for candidates." });

            if (!string.IsNullOrEmpty(request.CompanyId)) 
            {
                if (await _context.Users.AnyAsync(u => u.IcNumber == cleanIcNumber && u.CompanyId == request.CompanyId))
                    return BadRequest(new { Message = "IC Number already registered for this company." });
                    
                if (await _context.Users.AnyAsync(u => u.Email == cleanEmail && u.CompanyId == request.CompanyId))
                    return BadRequest(new { Message = "Email already registered for this company." });
            }

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            string candidateIdToUse = "";
            
            var existingUserGlobal = await _context.Users
                .Where(u => u.IcNumber == cleanIcNumber && !string.IsNullOrEmpty(u.CandidateId))
                .OrderByDescending(u => u.CreatedAt) 
                .FirstOrDefaultAsync();

            if (existingUserGlobal != null)
            {
                candidateIdToUse = existingUserGlobal.CandidateId!;
            }
            else
            {
                candidateIdToUse = await GenerateCandidateId();
            }

            var user = new User
            {
                Email = cleanEmail!,
                IcNumber = cleanIcNumber, 
                PasswordHash = passwordHash,
                Role = "Candidate",
                CandidateId = candidateIdToUse, 
                CompanyId = request.CompanyId, 
                IsFirstLogin = true,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "User registered successfully" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequestDto request)
        {
            var cleanIcNumber = request.IcNumber?.Trim();

            if (string.IsNullOrEmpty(cleanIcNumber))
                 return BadRequest(new { Message = "IC Number is required." });

            if (string.IsNullOrEmpty(request.CompanyId))
                 return BadRequest(new { Message = "Company Reference ID is required." });

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.IcNumber == cleanIcNumber && u.CompanyId == request.CompanyId);

            // --- AUTO-MIGRATE / LINK USER LOGIC ---
            if (user == null)
            {
                var existingUserGlobal = await _context.Users
                    .Where(u => u.IcNumber == cleanIcNumber)
                    .OrderByDescending(u => u.CreatedAt)
                    .FirstOrDefaultAsync(); 

                if (existingUserGlobal != null)
                {
                    if (BCrypt.Net.BCrypt.Verify(request.Password, existingUserGlobal.PasswordHash))
                    {
                        bool companyExists = await _context.Companies.AnyAsync(c => c.CompanyId == request.CompanyId);
                        if (!companyExists)
                        {
                            return BadRequest(new { Message = "Invalid Company Reference ID." });
                        }

                        if (string.IsNullOrEmpty(existingUserGlobal.CompanyId))
                        {
                            existingUserGlobal.CompanyId = request.CompanyId;
                            existingUserGlobal.UpdatedAt = DateTime.UtcNow;

                            _context.Users.Update(existingUserGlobal);
                            await _context.SaveChangesAsync();

                            user = existingUserGlobal;
                        }
                        else
                        {
                            string candidateIdToUse = existingUserGlobal.CandidateId!; 
                            
                            if (string.IsNullOrEmpty(candidateIdToUse)) 
                            {
                                candidateIdToUse = await GenerateCandidateId();
                            }
                            
                            user = new User
                            {
                                Email = existingUserGlobal.Email,
                                IcNumber = existingUserGlobal.IcNumber,
                                PasswordHash = existingUserGlobal.PasswordHash, 
                                Role = "Candidate",
                                CandidateId = candidateIdToUse, 
                                CompanyId = request.CompanyId,  
                                IsFirstLogin = true,
                                IsActive = true
                            };

                            _context.Users.Add(user);
                            
                            try 
                            {
                                await _context.SaveChangesAsync();
                            }
                            catch (DbUpdateException ex)
                            {
                                if (ex.InnerException != null && ex.InnerException.Message.Contains("duplicate key"))
                                {
                                    user = await _context.Users.FirstOrDefaultAsync(u => u.IcNumber == cleanIcNumber && u.CompanyId == request.CompanyId);
                                }
                                else
                                {
                                    throw;
                                }
                            }
                        }
                    }
                }
            }

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized(new { Message = "Invalid IC Number or password for this Company." });

            if (user.Role.Equals("Admin", StringComparison.OrdinalIgnoreCase) || 
                user.Role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase))
            {
                 return Unauthorized(new { Message = "Admins must use the Admin Login page." });
            }

            // =========================================================================
            // ✅ CRITICAL NEW LOGIC: Handle Position Context & FULL DATA CLONE
            // =========================================================================
            if (!string.IsNullOrEmpty(request.PositionCode))
            {
                // 1. Check if an application for THIS position already exists
                var existingApp = await _context.Employees
                    .FirstOrDefaultAsync(e => e.CandidateId == user.CandidateId 
                                           && e.CompanyId == request.CompanyId 
                                           && e.PositionCode == request.PositionCode);

                if (existingApp == null)
                {
                    // 2. Not found? Create it! (Clone logic)
                    // Find "Base" profile to clone from (Latest profile in this company)
                    var baseProfile = await _context.Employees
                        .AsNoTracking() 
                        .Where(e => e.CandidateId == user.CandidateId && e.CompanyId == request.CompanyId)
                        .OrderByDescending(e => e.CreatedAt)
                        .FirstOrDefaultAsync();

                    var newApp = new Employee 
                    {
                        // Identity Fields
                        CandidateId = user.CandidateId,
                        CompanyId = request.CompanyId,
                        PositionCode = request.PositionCode,
                        Status = "Pending",
                        
                        // Timestamps
                        CreatedAt = DateTime.UtcNow,
                        EntryDate = DateTime.UtcNow, // Set application date to now
                        
                        // --- CLONE ALL PERSONAL DETAILS ---
                        
                        // 1. Identity & Name
                        // FIXED: Added '?? string.Empty' to resolve CS8601
                        NewIcNumber = user.IcNumber ?? string.Empty,
                        FullName = baseProfile?.FullName ?? string.Empty, 
                        OldIcNumber = baseProfile?.OldIcNumber ?? string.Empty,
                        Passport = baseProfile?.Passport ?? string.Empty,       
                        
                        // 2. Demographics
                        Gender = baseProfile?.Gender,
                        BirthDate = baseProfile?.BirthDate,
                        
                        // 3. Dropdown Codes
                        SalutationCode = baseProfile?.SalutationCode,
                        MaritalStatusCode = baseProfile?.MaritalStatusCode,
                        RaceCode = baseProfile?.RaceCode,
                        ReligionCode = baseProfile?.ReligionCode,
                        NationalityCode = baseProfile?.NationalityCode,
                        CountryOfOriginCode = baseProfile?.CountryOfOriginCode,
                        
                        // 4. Additional Info
                        NativeStatus = baseProfile?.NativeStatus,
                        Disability = baseProfile?.Disability,
                        
                        // 5. References & Recommendations
                        RecommendationType = baseProfile?.RecommendationType,
                        RecommendationDetails = baseProfile?.RecommendationDetails,
                        Referee1 = baseProfile?.Referee1,
                        Referee2 = baseProfile?.Referee2
                    };

                    _context.Employees.Add(newApp);
                    await _context.SaveChangesAsync();
                }
            }
            // =========================================================================

            string token = CreateToken(user);
            
            return Ok(new {
                Message = "Login successful",
                Token = token,
                User = new { user.IcNumber, user.Email },
                Role = user.Role,
                UserId = user.Id, 
                CandidateId = user.CandidateId,
                CompanyId = user.CompanyId,
                isFirstLogin = user.IsFirstLogin,
                PositionCode = request.PositionCode 
            });
        }

        // ==========================================================
        // 2. ADMIN AREA
        // ==========================================================

        [HttpGet("admins")]
        [Authorize(Roles = "SuperAdmin, superadmin, Superadmin")]
        public async Task<IActionResult> GetAllAdmins()
        {
            var admins = await (from u in _context.Users
                                where u.Role == "Admin"
                                join c in _context.Companies on u.CompanyId equals c.CompanyId into comp
                                from c in comp.DefaultIfEmpty() 
                                orderby u.CreatedAt descending
                                select new 
                                {
                                    u.Id,
                                    u.Email,
                                    u.CompanyId,
                                    CompanyName = c != null ? c.CompanyName : "N/A", 
                                    u.IsFirstLogin,
                                    u.CreatedAt,
                                    u.IsActive // ✅ Added IsActive to response
                                })
                                .ToListAsync();

            return Ok(admins);
        }

        [HttpPost("create-admin")]
        [Authorize(Roles = "SuperAdmin, superadmin, Superadmin")] 
        public async Task<IActionResult> CreateAdmin(CreateAdminRequestDto request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest(new { Message = "Email already in use." });

            var companyExists = await _context.Companies.AnyAsync(c => c.CompanyId == request.CompanyId);
            if (!companyExists)
                return BadRequest(new { Message = $"Company ID '{request.CompanyId}' does not exist." });

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var user = new User
            {
                Email = request.Email,
                IcNumber = null,     
                CompanyId = request.CompanyId,
                PasswordHash = passwordHash,
                Role = "Admin", 
                IsFirstLogin = true,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Admin user created successfully" });
        }

        [HttpDelete("admin/{id}")]
        [Authorize(Roles = "SuperAdmin, superadmin, Superadmin")]
        public async Task<IActionResult> DeleteAdmin(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { Message = "User not found" });

            if (user.Role == "SuperAdmin") 
                return BadRequest(new { Message = "Cannot delete SuperAdmin." });

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Admin deleted successfully." });
        }

        // ✅ NEW ENDPOINT: Toggle Admin Status
        [HttpPatch("admin/{id}/toggle-status")]
        [Authorize(Roles = "SuperAdmin, superadmin, Superadmin")]
        public async Task<IActionResult> ToggleAdminStatus(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { Message = "User not found" });

            if (user.Role == "SuperAdmin")
                return BadRequest(new { Message = "Cannot disable SuperAdmin." });

            user.IsActive = !user.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            string status = user.IsActive ? "enabled" : "disabled";
            return Ok(new { Message = $"Admin user has been {status}." });
        }

        [HttpPost("login-admin")]
        public async Task<IActionResult> LoginAdmin(LoginAdminRequestDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized(new { Message = "Invalid Email or Password." });

            // ✅ CHECK: Is the account active?
            if (!user.IsActive)
            {
                 return Unauthorized(new { Message = "Access Denied. Your account has been disabled." });
            }

            if (!user.Role.Equals("Admin", StringComparison.OrdinalIgnoreCase) && 
                !user.Role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase))
            {
                return Unauthorized(new { Message = "Access Denied. This portal is for Administrators only." });
            }

            string token = CreateToken(user);

            return Ok(new {
                Message = "Admin Login successful",
                Token = token,
                User = new { user.Email },
                Role = user.Role,
                UserId = user.Id, 
                CompanyId = user.CompanyId, 
                isFirstLogin = user.IsFirstLogin
            });
        }

        // ==========================================================
        // 3. COMMON / SHARED
        // ==========================================================

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
        {
            if (request.NewPassword != request.ConfirmNewPassword)
                return BadRequest(new { message = "New passwords do not match." });

            if (!Guid.TryParse(request.UserId, out Guid userId))
                 return BadRequest(new { message = "Invalid User ID format." });

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound(new { message = "User not found." });

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                return BadRequest(new { message = "Current password is incorrect." });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.IsFirstLogin = false; 
            user.UpdatedAt = DateTime.UtcNow;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully." });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
        {
            if (request.NewPassword != request.ConfirmNewPassword)
                return BadRequest(new { message = "New passwords do not match." });

            var users = await _context.Users
                .Where(u => u.IcNumber == request.IcNumber && u.Email == request.Email)
                .ToListAsync();

            if (!users.Any()) return NotFound(new { message = "No user found with these details." });

            foreach(var u in users)
            {
                u.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                u.UpdatedAt = DateTime.UtcNow;
            }
            
            _context.Users.UpdateRange(users);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password has been reset successfully. Please login." });
        }

        private string CreateToken(User user)
        {
            var icValue = user.IcNumber ?? "ADMIN_ACCOUNT"; 

            string normalizedRole = user.Role;
            
            if (user.Role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase))
            {
                normalizedRole = "SuperAdmin";
            }
            else if (user.Role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
            {
                normalizedRole = "Admin";
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("icNumber", icValue),
                new Claim(ClaimTypes.Role, normalizedRole) 
            };
            
            if (!string.IsNullOrEmpty(user.CompanyId))
            {
                claims.Add(new Claim("CompanyId", user.CompanyId));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration.GetValue<string>("Jwt:Key") 
                ?? throw new InvalidOperationException("JWT Key is not configured.")));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(1), 
                SigningCredentials = creds,
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
    }
}