// fileName: Controllers/ContactController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;
using System;
using System.Threading.Tasks;

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContactController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ContactController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/contact
        [HttpPost]
        public async Task<IActionResult> SaveContact([FromBody] ContactInformation contactData)
        {
            if (contactData == null)
            {
                return BadRequest(new { message = "Invalid data provided." });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // ✅ CRITICAL FIX: Ensure we have the CompanyId from the frontend
            if (string.IsNullOrEmpty(contactData.CompanyId))
            {
                return BadRequest(new { message = "Company ID is required." });
            }

            // ✅ CRITICAL FIX: Strict Employee Lookup
            // We must find the employee record that matches BOTH the CandidateId AND the CompanyId.
            // This prevents "CAND001" from Company A overwriting "CAND001" from Company B.
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.CandidateId == contactData.CandidateId && e.CompanyId == contactData.CompanyId);

            if (employee == null)
            {
                return BadRequest(new { message = "Candidate profile not found for this specific Company. Please complete the Personal Information form first." });
            }

            try
            {
                // Check for existing contact record specific to this Candidate AND Company
                var existingContact = await _context.ContactInformation
                    .FirstOrDefaultAsync(c => c.CandidateId == contactData.CandidateId && c.CompanyId == contactData.CompanyId);

                if (existingContact != null)
                {
                    // --- UPDATE EXISTING RECORD ---
                    // We only update fields, keeping IDs intact
                    
                    existingContact.Email = contactData.Email;
                    existingContact.PhoneNumber = contactData.PhoneNumber;
                    existingContact.OfficeNumber = contactData.OfficeNumber;
                    existingContact.OtherNumber = contactData.OtherNumber;

                    existingContact.CorrespondenceAddress = contactData.CorrespondenceAddress;
                    existingContact.CorrespondenceState = contactData.CorrespondenceState;
                    existingContact.CorrespondenceCity = contactData.CorrespondenceCity;
                    existingContact.CorrespondenceArea = contactData.CorrespondenceArea;
                    existingContact.CorrespondencePhone = contactData.CorrespondencePhone;

                    existingContact.PermanentAddress = contactData.PermanentAddress;
                    existingContact.PermanentPhone = contactData.PermanentPhone;

                    existingContact.EmergencyNumber = contactData.EmergencyNumber;
                    existingContact.EmergencyAddress = contactData.EmergencyAddress;
                    existingContact.EmergencyPhone = contactData.EmergencyPhone;

                    existingContact.UpdatedAt = DateTime.UtcNow;

                    _context.ContactInformation.Update(existingContact);
                    await _context.SaveChangesAsync();

                    return Ok(new { message = "Contact information updated successfully.", id = existingContact.Id });
                }
                else
                {
                    // --- CREATE NEW RECORD ---
                    contactData.Id = 0; // Ensure EF Core treats this as new
                    contactData.CreatedAt = DateTime.UtcNow;
                    
                    // Double check strict assignment
                    contactData.CompanyId = employee.CompanyId; 
                    
                    _context.ContactInformation.Add(contactData);
                    await _context.SaveChangesAsync();

                    return Ok(new { message = "Contact information saved successfully.", id = contactData.Id });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving contact: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while saving data.", error = ex.Message });
            }
        }

        // GET: api/contact/{candidateId}?companyId=...
        [HttpGet("{candidateId}")]
        public async Task<IActionResult> GetContact(string candidateId, [FromQuery] string companyId)
        {
            if (string.IsNullOrEmpty(companyId))
            {
                return BadRequest(new { message = "Company ID is required to retrieve contact information." });
            }

            // ✅ DATA ISOLATION: Filter by CandidateId AND CompanyId
            // This ensures we only return the contact info relevant to the company the user is logged into.
            var contact = await _context.ContactInformation
                .FirstOrDefaultAsync(c => c.CandidateId == candidateId && c.CompanyId == companyId);

            if (contact == null)
            {
                // Return 204 No Content or empty JSON so frontend knows to show blank form
                return Ok(null);
            }

            return Ok(contact);
        }
    }
}