// fileName: Controllers/AdminUpdateController.cs
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;
using System.IO;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using RecruitmentBackend.Data;
using RecruitmentBackend.Models;
using System;
using RecruitmentBackend.Maps; 
using System.Reflection; 

namespace RecruitmentBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminUpdateController : ControllerBase
    {
        private readonly DropdownRepository _repository;

        // Configuration for mapping CSV classes
        private static readonly Dictionary<string, Type> CodeMaps = new Dictionary<string, Type>(StringComparer.OrdinalIgnoreCase)
        {
            { "salutation", typeof(SalutationMap) }, 
            { "salutation_code", typeof(SalutationMap) }, 
            { "marital_status_codes", typeof(MaritalStatusMap) },
            { "race_codes", typeof(RaceMap) },
            { "nationality_codes", typeof(NationalityMap) },
            { "religion_codes", typeof(ReligionMap) },
            { "country_origin_codes", typeof(CountryOriginMap) },
            { "industry_codes", typeof(IndustryCodeMap) },
            { "job_codes", typeof(JobCodeMap) },
            { "position_codes", typeof(PositionMap) },
            { "cessation_reasons", typeof(CessationCodeMap) },
            { "hobby_codes", typeof(HobbyCodeMap) },
            { "language_codes", typeof(LanguageCodeMap) },
            { "field_area_codes", typeof(FieldCodeMap) }
        };

        // Configuration for mapping Table Names to Entity Types
        private static readonly Dictionary<string, Type> EntityTypes = new Dictionary<string, Type>(StringComparer.OrdinalIgnoreCase)
        {
            { "salutation_code", typeof(Salutation) }, 
            { "marital_status_codes", typeof(MaritalStatus) },
            { "race_codes", typeof(Race) },
            { "nationality_codes", typeof(Nationality) },
            { "religion_codes", typeof(Religion) },
            { "country_origin_codes", typeof(CountryOrigin) },
            { "industry_codes", typeof(Industry) },
            { "job_codes", typeof(Job) },
            { "position_codes", typeof(Position) },
            { "cessation_reasons", typeof(CessationReason) },
            { "hobby_codes", typeof(Hobby) },
            { "language_codes", typeof(Language) },
            { "field_area_codes", typeof(FieldArea) },
            { "qualification_codes", typeof(QualificationCode) }, 
            { "qualification_grades", typeof(QualificationGrade) }
        };

        public AdminUpdateController(DropdownRepository repository)
        {
            _repository = repository;
        }

        [HttpPost("upload/{tableName}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadCodes(string tableName, IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest(new { message = "No file uploaded." });
            if (Path.GetExtension(file.FileName)?.ToLower() != ".csv") return BadRequest(new { message = "Only CSV files are allowed." });

            // 1. Treat Company-Id as STRING (Matches User.cs and Company.cs)
            string? companyId = Request.Headers["Company-Id"].FirstOrDefault();

            // Optional: If you want to treat empty strings as null
            if (string.IsNullOrWhiteSpace(companyId)) companyId = null;

            try
            {
                var csvConfig = new CsvConfiguration(CultureInfo.InvariantCulture)
                {
                    HeaderValidated = null,
                    MissingFieldFound = null,
                    PrepareHeaderForMatch = args => args.Header.ToLower()
                };

                using (var reader = new StreamReader(file.OpenReadStream()))
                using (var csv = new CsvReader(reader, csvConfig))
                {
                    // --- CASE A: QUALIFICATION CODES ---
                    if (tableName.Equals("qualification_codes", StringComparison.OrdinalIgnoreCase))
                    {
                        csv.Context.RegisterClassMap<QualificationCodeMap>(); 
                        var records = csv.GetRecords<QualificationCodeRecord>()
                            .ToList()
                            .GroupBy(x => new { x.Code, x.SubCode }).Select(g => g.Last()).ToList();
                        
                        // Map and Assign CompanyId
                        var entities = records.Select(r => new QualificationCode { 
                            Code = r.Code, 
                            Name = r.Name, 
                            SubCode = r.SubCode, 
                            SubName = r.SubName, 
                            CreatedAt = DateTime.UtcNow,
                            CompanyId = companyId 
                        }).ToList();
                        
                        int count = await _repository.ReplaceAllQualificationCodesAsync(entities); 
                        return Ok(new { message = $"{count} qualification codes synced successfully." });
                    }
                    // --- CASE B: QUALIFICATION GRADES ---
                    else if (tableName.Equals("qualification_grades", StringComparison.OrdinalIgnoreCase))
                    {
                        csv.Context.RegisterClassMap<GradeCodeMap>(); 
                        var records = csv.GetRecords<GradeRecord>().ToList().GroupBy(x => x.GradeCode).Select(g => g.Last()).ToList();
                        
                        // Map and Assign CompanyId
                        var entities = records.Select(r => new QualificationGrade { 
                            Code = r.GradeCode,
                            Description = !string.IsNullOrWhiteSpace(r.GradeRank) ? $"{r.GradeName} - {r.GradeRank}" : r.GradeName,
                            CreatedAt = DateTime.UtcNow,
                            CompanyId = companyId 
                        }).ToList();

                        int count = await _repository.ReplaceAllGradeCodesAsync(entities);
                        return Ok(new { message = $"{count} qualification grades synced successfully." });
                    }
                    // --- CASE C: GENERIC TABLES ---
                    else if (CodeMaps.TryGetValue(tableName, out Type? mapType) && EntityTypes.TryGetValue(tableName, out Type? entityType))
                    {
                        csv.Context.RegisterClassMap(mapType);
                        var rawRecords = csv.GetRecords<CodeRecord>().ToList();
                        var records = rawRecords.GroupBy(r => r.Code).Select(g => g.Last()).ToList();
                        
                        var entities = records.Select(record => {
                            var entity = Activator.CreateInstance(entityType) ?? throw new InvalidOperationException();
                            
                            // Set Standard Properties
                            entityType.GetProperty("Code")?.SetValue(entity, record.Code);
                            entityType.GetProperty("Name")?.SetValue(entity, record.Name);
                            entityType.GetProperty("CreatedAt")?.SetValue(entity, DateTime.UtcNow);
                            
                            // Assign CompanyId via Reflection
                            var companyProp = entityType.GetProperty("CompanyId");
                            if (companyProp != null && companyProp.CanWrite)
                            {
                                companyProp.SetValue(entity, companyId);
                            }

                            return entity;
                        }).ToList();

                        var targetListType = typeof(List<>).MakeGenericType(entityType);
                        var targetList = Activator.CreateInstance(targetListType);
                        var addMethod = targetListType.GetMethod("Add");
                        foreach (var entity in entities) addMethod?.Invoke(targetList, new object[] { entity });

                        var method = _repository.GetType().GetMethods()
                            .FirstOrDefault(m => m.Name == "ReplaceAllCodesAsync" && m.IsGenericMethod && m.GetParameters().Length == 2);
                        
                        if (method == null) return StatusCode(500, new { message = "Repository error." });

                        var genericMethod = method.MakeGenericMethod(entityType);
                        var task = (Task<int>)genericMethod.Invoke(_repository, new object[] { tableName, targetList! })!;
                        
                        int count = await task;
                        return Ok(new { message = $"{count} records synced successfully." });
                    }
                    else 
                    {
                        return BadRequest(new { message = $"Table {tableName} is not configured." });
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error processing CSV: {ex}");
                return StatusCode(500, new { message = $"Failed to process CSV for {tableName}.", error = ex.Message });
            }
        }

        // ✅ UPDATED: Accepts optional companyId from query
        [HttpGet("options/{tableName}")]
        public async Task<IActionResult> GetDropdownOptions(string tableName, [FromQuery] string? companyId)
        {
             try {
                 // Pass companyId to the repository method
                 var options = await _repository.GetAllOptionsAsync(tableName, companyId); 
                 return Ok(options.Select(o => new DropdownOption { Code = o.Code, Description = o.Name }));
             } catch (Exception ex) {
                 return StatusCode(500, new { message = "Fetch failed", error = ex.Message });
             }
        }

        // ✅ UPDATED: Accepts optional companyId from query
        [HttpGet("suboptions/qualification_codes/{mainCode}")]
        public async Task<IActionResult> GetQualificationSubOptions(string mainCode, [FromQuery] string? companyId)
        {
             try {
                 // Pass companyId to the repository method
                 var options = await _repository.GetQualificationSubOptionsAsync(mainCode, companyId); 
                 return Ok(options.Select(o => new DropdownOption { Code = o.SubCode, Description = o.SubName }));
             } catch (Exception ex) {
                 return StatusCode(500, new { message = "Fetch sub-options failed", error = ex.Message });
             }
        }

        [HttpGet("status/{tableName}")]
        public async Task<IActionResult> GetTableStatus(string tableName)
        {
             // 1. Treat Company-Id as STRING
             string? companyId = Request.Headers["Company-Id"].FirstOrDefault();
             if (string.IsNullOrWhiteSpace(companyId)) companyId = null;

             try { 
                 // 2. Pass STRING ID to Repository
                 var lastUpdated = await _repository.GetLastUpdatedAsync(tableName, companyId); 
                 
                 var hasData = lastUpdated.HasValue;

                 return Ok(new TableMetadata { TableName = tableName, LastUpdated = lastUpdated, HasData = hasData }); 
             } catch { 
                 return Ok(new TableMetadata { TableName = tableName, LastUpdated = null, HasData = false }); 
             }
        }
    }
}