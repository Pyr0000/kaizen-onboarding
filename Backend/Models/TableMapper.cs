// fileName: Data/TableMapper.cs
using System;
using System.Collections.Generic;
using RecruitmentBackend.Models;
using System.Linq;

namespace RecruitmentBackend.Data
{
    public class TableMapper : ITableMapper
    {
        // This dictionary maps the database table name (string key) to the actual C# Entity Type (Type value)
        private static readonly Dictionary<string, Type> EntityMap = new Dictionary<string, Type>(StringComparer.OrdinalIgnoreCase)
        {
            // Core Lookups
            { "salutation_code", typeof(Salutation) }, 
            { "marital_status_codes", typeof(MaritalStatus) },
            { "race_codes", typeof(Race) },
            { "religion_codes", typeof(Religion) },
            { "nationality_codes", typeof(Nationality) },
            { "country_origin_codes", typeof(CountryOrigin) },
            
            // Specialized Lookups
            { "qualification_codes", typeof(QualificationCode) }, 
            { "qualification_grades", typeof(QualificationGrade) },
            
            // Remaining Lookups
            { "industry_codes", typeof(Industry) },
            { "job_codes", typeof(Job) },
            { "position_codes", typeof(Position) }, // ✅ ADDED: Missing mapping for Position
            { "cessation_reasons", typeof(CessationReason) },
            { "hobby_codes", typeof(Hobby) },
            { "language_codes", typeof(Language) },
            { "field_area_codes", typeof(FieldArea) }
        };

        public Type GetEntityType(string tableName)
        {
            EntityMap.TryGetValue(tableName, out Type? type);
            return type!;
        }

        public string GetTableName(Type entityType)
        {
            // Reverse lookup: Find the key (table name)
            return EntityMap.FirstOrDefault(x => x.Value == entityType).Key;
        }
    }
}