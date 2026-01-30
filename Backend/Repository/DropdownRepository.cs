// fileName: Data/DropdownRepository.cs
using System.Collections.Generic;
using System.Threading.Tasks;
using RecruitmentBackend.Models;
using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration; 
using System.Text.RegularExpressions; 

namespace RecruitmentBackend.Data
{
    public class DropdownRepository
    {
        private readonly AppDbContext _dbContext;
        private readonly ITableMapper _tableMapper;

        private static readonly Dictionary<string, (string Code, string Name)> ColumnMap = 
            new Dictionary<string, (string, string)>(StringComparer.OrdinalIgnoreCase)
        {
            { "salutation_code", ("salucode", "saludesc") },
            { "marital_status_codes", ("marstacode", "marstaname") },
            { "race_codes", ("racecode", "racename") },
            { "religion_codes", ("religncode", "relignname") },
            { "nationality_codes", ("nationcode", "nationame") },
            { "country_origin_codes", ("ctyorgcode", "ctyorgname") },
            { "industry_codes", ("indstrycode", "indstryname") },
            { "job_codes", ("jobcode", "jobpost") },
            { "position_codes", ("jobcode", "jobpost") }, // ✅ NEW: Position Columns
            { "cessation_reasons", ("rsgnrsncode", "rsgnrsndesc") },
            { "hobby_codes", ("hbycode", "hbyname") },
            { "language_codes", ("langcode", "langname") },
            { "field_area_codes", ("fldareaid", "fldareaname") },
            { "qualification_grades", ("qlfgradecode", "qlfgradename") } 
        };

        public DropdownRepository(AppDbContext dbContext, ITableMapper tableMapper)
        {
            _dbContext = dbContext;
            _tableMapper = tableMapper;
        }

        // ==================================================================================
        // 1. DYNAMIC CONSTRAINT FIXER
        // ==================================================================================
        public async Task ApplyCascadingRulesForTableAsync(string tableName)
        {
             // Keep your existing logic here if needed.
             await Task.CompletedTask; 
        }

        // ==================================================================================
        // 2. SYNC METHODS
        // ==================================================================================

        public async Task<int> ReplaceAllCodesAsync<TEntity>(string tableName, List<TEntity> newRecords) where TEntity : class
        {
            var dbSet = _dbContext.Set<TEntity>();
            var modelType = typeof(TEntity);
            
            // --- DETERMINE COMPANY SCOPE ---
            string? targetCompanyId = null;
            if (newRecords.Any())
            {
                var companyIdProp = modelType.GetProperty("CompanyId");
                if (companyIdProp != null)
                {
                    var firstVal = companyIdProp.GetValue(newRecords.First());
                    if (firstVal != null) targetCompanyId = firstVal.ToString();
                }
            }

            // Fetch ONLY this company's records to check against
            List<TEntity> existingRecords;
            
            if (!string.IsNullOrEmpty(targetCompanyId))
            {
                var allData = await dbSet.ToListAsync();
                existingRecords = allData.Where(r => 
                {
                     var p = r.GetType().GetProperty("CompanyId");
                     var v = p?.GetValue(r);
                     return v != null && v.ToString() == targetCompanyId;
                }).ToList();
            }
            else
            {
                // Global
                var allData = await dbSet.ToListAsync();
                existingRecords = allData.Where(r => 
                {
                     var p = r.GetType().GetProperty("CompanyId");
                     return p == null || p.GetValue(r) == null;
                }).ToList();
            }

            int changesCount = 0;
            var processedKeys = new HashSet<string>();

            // B. UPSERT logic
            foreach (var newRecord in newRecords)
            {
                var codeProp = modelType.GetProperty("Code");
                if (codeProp == null) continue;

                string codeValue = codeProp.GetValue(newRecord)?.ToString() ?? "";
                processedKeys.Add(codeValue);

                var existingEntity = existingRecords.FirstOrDefault(e => 
                    (modelType.GetProperty("Code")?.GetValue(e)?.ToString() ?? "") == codeValue
                );

                if (existingEntity != null)
                {
                    _dbContext.Entry(existingEntity).CurrentValues.SetValues(newRecord);
                }
                else
                {
                    dbSet.Add(newRecord);
                }
                changesCount++;
            }

            // C. DELETE (Scoped to Company)
            var recordsToDelete = existingRecords
                .Where(e => !processedKeys.Contains(modelType.GetProperty("Code")?.GetValue(e)?.ToString() ?? ""))
                .ToList();

            if (recordsToDelete.Any())
            {
                dbSet.RemoveRange(recordsToDelete);
                changesCount += recordsToDelete.Count;
            }
            
            return await _dbContext.SaveChangesAsync();
        }

        public async Task<int> ReplaceAllQualificationCodesAsync(List<QualificationCode> newRecords)
        {
            var dbSet = _dbContext.Set<QualificationCode>();
            string? targetCompanyId = newRecords.FirstOrDefault()?.CompanyId;

            List<QualificationCode> existingRecords;
            var allRecs = await dbSet.ToListAsync(); 

            if (!string.IsNullOrEmpty(targetCompanyId))
                existingRecords = allRecs.Where(q => q.CompanyId == targetCompanyId).ToList();
            else
                existingRecords = allRecs.Where(q => q.CompanyId == null).ToList();

            var processedKeys = new HashSet<string>();

            foreach (var newRecord in newRecords)
            {
                var compositeKey = $"{newRecord.Code}|{newRecord.SubCode}";
                processedKeys.Add(compositeKey);

                var existingEntity = existingRecords.FirstOrDefault(q => 
                    q.Code == newRecord.Code && q.SubCode == newRecord.SubCode);

                if (existingEntity != null)
                {
                    existingEntity.Name = newRecord.Name;
                    existingEntity.SubName = newRecord.SubName;
                    existingEntity.CompanyId = newRecord.CompanyId; 
                }
                else
                {
                    dbSet.Add(newRecord);
                }
            }

            var toDelete = existingRecords
                .Where(q => !processedKeys.Contains($"{q.Code}|{q.SubCode}"))
                .ToList();

            if (toDelete.Any()) dbSet.RemoveRange(toDelete);

            return await _dbContext.SaveChangesAsync();
        }

        public async Task<int> ReplaceAllGradeCodesAsync(List<QualificationGrade> newRecords) => 
            await ReplaceAllCodesAsync<QualificationGrade>("qualification_grades", newRecords);
        
        // ==================================================================================
        // 3. FETCH METHODS (✅ UPDATED TO FILTER BY COMPANY)
        // ==================================================================================

        public async Task<List<QualificationCodeRecord>> GetQualificationSubOptionsAsync(string mainCode, string? companyId)
        {
            // Filter by Code AND (CompanyId matches OR CompanyId is null/global)
            var query = _dbContext.Set<QualificationCode>()
                .AsNoTracking()
                .Where(q => q.Code == mainCode);

            if (!string.IsNullOrEmpty(companyId))
            {
                // Show Company Specific + Global
                query = query.Where(q => q.CompanyId == companyId || q.CompanyId == null);
            }
            else
            {
                // Show only Global if no company provided
                query = query.Where(q => q.CompanyId == null);
            }

            return await query
                .Select(q => new QualificationCodeRecord {
                    Code = q.Code, Name = q.Name, SubCode = q.SubCode, SubName = q.SubName
                })
                .OrderBy(q => q.SubName)
                .ToListAsync();
        }

        public async Task<List<CodeRecord>> GetAllOptionsAsync(string tableName, string? companyId)
        {
            var entityType = _tableMapper.GetEntityType(tableName);
            if (entityType == null) return new List<CodeRecord>();

            // --- Case A: Qualification Codes (Entity Framework) ---
            if (tableName.Equals("qualification_codes", StringComparison.OrdinalIgnoreCase))
            {
                 var query = _dbContext.Set<QualificationCode>().AsNoTracking();

                 // Apply Company Filter
                 if (!string.IsNullOrEmpty(companyId))
                 {
                     query = query.Where(q => q.CompanyId == companyId || q.CompanyId == null);
                 }
                 else
                 {
                     query = query.Where(q => q.CompanyId == null);
                 }

                 return await query
                    .Select(q => new { q.Code, q.Name })
                    .Distinct()
                    .OrderBy(o => o.Name)
                    .Select(o => new CodeRecord { Code = o.Code, Name = o.Name })
                    .ToListAsync();
            }
            
            // --- Case B: Other Tables (Raw SQL) ---
            if (!ColumnMap.TryGetValue(tableName, out var columns))
                throw new KeyNotFoundException($"Column mapping not found for table {tableName}.");
            
            // Construct Filter Logic for SQL
            string filterClause;
            if (!string.IsNullOrEmpty(companyId))
            {
                // Allow exact company match OR global records (company_id IS NULL)
                // This prevents seeing OTHER companies' records
                filterClause = $"WHERE (\"company_id\" = '{companyId}' OR \"company_id\" IS NULL)";
            }
            else
            {
                // If no company provided, only show global records
                filterClause = "WHERE \"company_id\" IS NULL";
            }

            string selectSql = $"SELECT DISTINCT \"{columns.Code}\" AS \"Code\", \"{columns.Name}\" AS \"Name\" FROM \"{tableName}\" {filterClause}"; 

            return await _dbContext.Database
                .SqlQueryRaw<CodeRecord>(selectSql)
                .AsNoTracking()
                .OrderBy(c => c.Name)
                .ToListAsync();
        }
        
        public async Task<DateTime?> GetLastUpdatedAsync(string tableName, string? companyId)
        {
            var entityType = _tableMapper.GetEntityType(tableName);
            if (entityType == null) return null;

            string sql;
            
            if (!string.IsNullOrEmpty(companyId))
            {
                // For last updated, we usually check the specific company's latest update
                sql = $"SELECT MAX(\"created_at\") AS \"Value\" FROM \"{tableName}\" WHERE \"company_id\" = '{companyId}'";
            }
            else
            {
                sql = $"SELECT MAX(\"created_at\") AS \"Value\" FROM \"{tableName}\" WHERE \"company_id\" IS NULL";
            }

            try 
            { 
                return await _dbContext.Database.SqlQueryRaw<DateTime?>(sql).SingleOrDefaultAsync(); 
            }
            catch 
            { 
                return null; 
            }
        }
    }
}