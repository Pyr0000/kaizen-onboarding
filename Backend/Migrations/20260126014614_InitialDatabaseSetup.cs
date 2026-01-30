using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace OnBoarding.Migrations
{
    /// <inheritdoc />
    public partial class InitialDatabaseSetup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CandidateHobbies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CandidateId = table.Column<string>(type: "text", nullable: false),
                    CompanyId = table.Column<string>(type: "text", nullable: true),
                    HobbyCode = table.Column<string>(type: "text", nullable: false),
                    AbilityLevel = table.Column<string>(type: "text", nullable: true),
                    LocalDescription = table.Column<string>(type: "text", nullable: true),
                    EntryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CandidateHobbies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CandidateLanguages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CandidateId = table.Column<string>(type: "text", nullable: false),
                    CompanyId = table.Column<string>(type: "text", nullable: true),
                    LanguageCode = table.Column<string>(type: "text", nullable: false),
                    ReadLevel = table.Column<string>(type: "text", nullable: true),
                    WrittenLevel = table.Column<string>(type: "text", nullable: true),
                    SpokenLevel = table.Column<string>(type: "text", nullable: true),
                    EntryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CandidateLanguages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CandidateResumes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CandidateId = table.Column<string>(type: "text", nullable: false),
                    CompanyId = table.Column<string>(type: "text", nullable: true),
                    FileName = table.Column<string>(type: "text", nullable: true),
                    FileContent = table.Column<byte[]>(type: "bytea", nullable: true),
                    EntryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CandidateResumes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Companies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    company_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    company_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    company_details = table.Column<string>(type: "text", nullable: true),
                    colour_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    logo_path = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Companies", x => x.Id);
                    table.UniqueConstraint("AK_Companies_company_id", x => x.company_id);
                });

            migrationBuilder.CreateTable(
                name: "EmploymentHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CandidateId = table.Column<string>(type: "text", nullable: false),
                    CompanyId = table.Column<string>(type: "text", nullable: true),
                    EmployerName = table.Column<string>(type: "text", nullable: false),
                    TelNo = table.Column<string>(type: "text", nullable: true),
                    Address = table.Column<string>(type: "text", nullable: true),
                    FromDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ToDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Latest = table.Column<bool>(type: "boolean", nullable: false),
                    IndustryCode = table.Column<string>(type: "text", nullable: true),
                    JobCode = table.Column<string>(type: "text", nullable: false),
                    JobName = table.Column<string>(type: "text", nullable: true),
                    EmphJobName = table.Column<string>(type: "text", nullable: true),
                    JobFunction = table.Column<string>(type: "text", nullable: true),
                    StartSalary = table.Column<decimal>(type: "numeric", nullable: true),
                    LastSalary = table.Column<decimal>(type: "numeric", nullable: true),
                    CessationReasonCode = table.Column<string>(type: "text", nullable: true),
                    CessationReasonDescription = table.Column<string>(type: "text", nullable: true),
                    EntryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmploymentHistories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FieldExperiences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CandidateId = table.Column<string>(type: "text", nullable: false),
                    CompanyId = table.Column<string>(type: "text", nullable: true),
                    FieldName = table.Column<string>(type: "text", nullable: false),
                    FieldAreaCode = table.Column<string>(type: "text", nullable: false),
                    YearsOfExperience = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    EntryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FieldExperiences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Qualifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CandidateId = table.Column<string>(type: "text", nullable: false),
                    CompanyId = table.Column<string>(type: "text", nullable: true),
                    SchoolName = table.Column<string>(type: "text", nullable: false),
                    SchoolTelNo = table.Column<string>(type: "text", nullable: true),
                    SchoolAddress = table.Column<string>(type: "text", nullable: true),
                    JoinSchoolDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SinceWhenDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EntryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    QualificationCode = table.Column<string>(type: "text", nullable: false),
                    QualificationName = table.Column<string>(type: "text", nullable: true),
                    QualificationSubCode = table.Column<string>(type: "text", nullable: true),
                    QualificationSubName = table.Column<string>(type: "text", nullable: true),
                    IsHighest = table.Column<bool>(type: "boolean", nullable: false),
                    QualificationGradeCode = table.Column<string>(type: "text", nullable: true),
                    QualificationGradeName = table.Column<string>(type: "text", nullable: true),
                    QualificationGradeRank = table.Column<string>(type: "text", nullable: true),
                    CGPA = table.Column<string>(type: "text", nullable: true),
                    OtherGradeInfo = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Qualifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Skills",
                columns: table => new
                {
                    CandidateId = table.Column<string>(type: "text", nullable: false),
                    CompanyId = table.Column<string>(type: "text", nullable: false),
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OfficeSkills = table.Column<string>(type: "text", nullable: true),
                    OtherRelevantSkills = table.Column<string>(type: "text", nullable: true),
                    OtherSkillInformation = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Skills", x => new { x.CandidateId, x.CompanyId });
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CandidateId = table.Column<string>(type: "text", nullable: true),
                    CompanyId = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: false),
                    IcNumber = table.Column<string>(type: "text", nullable: true),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsFirstLogin = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "cessation_reasons",
                columns: table => new
                {
                    rsgnrsncode = table.Column<string>(type: "text", nullable: false),
                    company_id = table.Column<string>(type: "character varying(50)", nullable: false),
                    rsgnrsndesc = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cessation_reasons", x => new { x.rsgnrsncode, x.company_id });
                    table.ForeignKey(
                        name: "FK_cessation_reasons_Companies_company_id",
                        column: x => x.company_id,
                        principalTable: "Companies",
                        principalColumn: "company_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "country_origin_codes",
                columns: table => new
                {
                    ctyorgcode = table.Column<string>(type: "text", nullable: false),
                    company_id = table.Column<string>(type: "character varying(50)", nullable: false),
                    ctyorgname = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_country_origin_codes", x => new { x.ctyorgcode, x.company_id });
                    table.ForeignKey(
                        name: "FK_country_origin_codes_Companies_company_id",
                        column: x => x.company_id,
                        principalTable: "Companies",
                        principalColumn: "company_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "field_area_codes",
                columns: table => new
                {
                    fldareaid = table.Column<string>(type: "text", nullable: false),
                    company_id = table.Column<string>(type: "character varying(50)", nullable: false),
                    fldareaname = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_field_area_codes", x => new { x.fldareaid, x.company_id });
                    table.ForeignKey(
                        name: "FK_field_area_codes_Companies_company_id",
                        column: x => x.company_id,
                        principalTable: "Companies",
                        principalColumn: "company_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "hobby_codes",
                columns: table => new
                {
                    hbycode = table.Column<string>(type: "text", nullable: false),
                    company_id = table.Column<string>(type: "character varying(50)", nullable: false),
                    hbyname = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hobby_codes", x => new { x.hbycode, x.company_id });
                    table.ForeignKey(
                        name: "FK_hobby_codes_Companies_company_id",
                        column: x => x.company_id,
                        principalTable: "Companies",
                        principalColumn: "company_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "industry_codes",
                columns: table => new
                {
                    indstrycode = table.Column<string>(type: "text", nullable: false),
                    company_id = table.Column<string>(type: "character varying(50)", nullable: false),
                    indstryname = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_industry_codes", x => new { x.indstrycode, x.company_id });
                    table.ForeignKey(
                        name: "FK_industry_codes_Companies_company_id",
                        column: x => x.company_id,
                        principalTable: "Companies",
                        principalColumn: "company_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "job_codes",
                columns: table => new
                {
                    jobcode = table.Column<string>(type: "text", nullable: false),
                    company_id = table.Column<string>(type: "character varying(50)", nullable: false),
                    jobpost = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_job_codes", x => new { x.jobcode, x.company_id });
                    table.ForeignKey(
                        name: "FK_job_codes_Companies_company_id",
                        column: x => x.company_id,
                        principalTable: "Companies",
                        principalColumn: "company_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "language_codes",
                columns: table => new
                {
                    langcode = table.Column<string>(type: "text", nullable: false),
                    company_id = table.Column<string>(type: "character varying(50)", nullable: false),
                    langname = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_language_codes", x => new { x.langcode, x.company_id });
                    table.ForeignKey(
                        name: "FK_language_codes_Companies_company_id",
                        column: x => x.company_id,
                        principalTable: "Companies",
                        principalColumn: "company_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "marital_status_codes",
                columns: table => new
                {
                    marstacode = table.Column<string>(type: "text", nullable: false),
                    company_id = table.Column<string>(type: "character varying(50)", nullable: false),
                    marstaname = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_marital_status_codes", x => new { x.marstacode, x.company_id });
                    table.ForeignKey(
                        name: "FK_marital_status_codes_Companies_company_id",
                        column: x => x.company_id,
                        principalTable: "Companies",
                        principalColumn: "company_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "nationality_codes",
                columns: table => new
                {
                    nationcode = table.Column<string>(type: "text", nullable: false),
                    company_id = table.Column<string>(type: "character varying(50)", nullable: false),
                    nationame = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nationality_codes", x => new { x.nationcode, x.company_id });
                    table.ForeignKey(
                        name: "FK_nationality_codes_Companies_company_id",
                        column: x => x.company_id,
                        principalTable: "Companies",
                        principalColumn: "company_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "position_codes",
                columns: table => new
                {
                    jobcode = table.Column<string>(type: "text", nullable: false),
                    company_id = table.Column<string>(type: "character varying(50)", nullable: false),
                    jobpost = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_position_codes", x => new { x.jobcode, x.company_id });
                    table.ForeignKey(
                        name: "FK_position_codes_Companies_company_id",
                        column: x => x.company_id,
                        principalTable: "Companies",
                        principalColumn: "company_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "qualification_codes",
                columns: table => new
                {
                    qlfcatid = table.Column<string>(type: "text", nullable: false),
                    qlfsubid = table.Column<string>(type: "text", nullable: false),
                    company_id = table.Column<string>(type: "character varying(50)", nullable: false),
                    qlfcatname = table.Column<string>(type: "text", nullable: false),
                    qlfsubname = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_qualification_codes", x => new { x.qlfcatid, x.qlfsubid, x.company_id });
                    table.ForeignKey(
                        name: "FK_qualification_codes_Companies_company_id",
                        column: x => x.company_id,
                        principalTable: "Companies",
                        principalColumn: "company_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "qualification_grades",
                columns: table => new
                {
                    qlfgradecode = table.Column<string>(type: "text", nullable: false),
                    company_id = table.Column<string>(type: "character varying(50)", nullable: false),
                    qlfgradename = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_qualification_grades", x => new { x.qlfgradecode, x.company_id });
                    table.ForeignKey(
                        name: "FK_qualification_grades_Companies_company_id",
                        column: x => x.company_id,
                        principalTable: "Companies",
                        principalColumn: "company_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "race_codes",
                columns: table => new
                {
                    racecode = table.Column<string>(type: "text", nullable: false),
                    company_id = table.Column<string>(type: "character varying(50)", nullable: false),
                    racename = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_race_codes", x => new { x.racecode, x.company_id });
                    table.ForeignKey(
                        name: "FK_race_codes_Companies_company_id",
                        column: x => x.company_id,
                        principalTable: "Companies",
                        principalColumn: "company_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "religion_codes",
                columns: table => new
                {
                    religncode = table.Column<string>(type: "text", nullable: false),
                    company_id = table.Column<string>(type: "character varying(50)", nullable: false),
                    relignname = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_religion_codes", x => new { x.religncode, x.company_id });
                    table.ForeignKey(
                        name: "FK_religion_codes_Companies_company_id",
                        column: x => x.company_id,
                        principalTable: "Companies",
                        principalColumn: "company_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "salutation_code",
                columns: table => new
                {
                    salucode = table.Column<string>(type: "text", nullable: false),
                    company_id = table.Column<string>(type: "character varying(50)", nullable: false),
                    saludesc = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_salutation_code", x => new { x.salucode, x.company_id });
                    table.ForeignKey(
                        name: "FK_salutation_code_Companies_company_id",
                        column: x => x.company_id,
                        principalTable: "Companies",
                        principalColumn: "company_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Employees",
                columns: table => new
                {
                    CandidateId = table.Column<string>(type: "text", nullable: false),
                    CompanyId = table.Column<string>(type: "character varying(50)", nullable: false),
                    PositionCode = table.Column<string>(type: "text", nullable: false),
                    EntryDate = table.Column<DateTime>(type: "date", nullable: true),
                    BirthDate = table.Column<DateTime>(type: "date", nullable: true),
                    FullName = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    SalutationCode = table.Column<string>(type: "text", nullable: true),
                    OldIcNumber = table.Column<string>(type: "text", nullable: true),
                    NewIcNumber = table.Column<string>(type: "text", nullable: true),
                    Passport = table.Column<string>(type: "text", nullable: true),
                    Gender = table.Column<string>(type: "text", nullable: true),
                    MaritalStatusCode = table.Column<string>(type: "text", nullable: true),
                    RaceCode = table.Column<string>(type: "text", nullable: true),
                    NativeStatus = table.Column<string>(type: "text", nullable: true),
                    ReligionCode = table.Column<string>(type: "text", nullable: true),
                    NationalityCode = table.Column<string>(type: "text", nullable: true),
                    CountryOfOriginCode = table.Column<string>(type: "text", nullable: true),
                    RecommendationType = table.Column<string>(type: "text", nullable: true),
                    RecommendationDetails = table.Column<string>(type: "text", nullable: true),
                    Disability = table.Column<string>(type: "text", nullable: true),
                    Referee1 = table.Column<string>(type: "text", nullable: true),
                    Referee2 = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => new { x.CandidateId, x.CompanyId, x.PositionCode });
                    table.ForeignKey(
                        name: "FK_Employees_country_origin_codes_CountryOfOriginCode_CompanyId",
                        columns: x => new { x.CountryOfOriginCode, x.CompanyId },
                        principalTable: "country_origin_codes",
                        principalColumns: new[] { "ctyorgcode", "company_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Employees_marital_status_codes_MaritalStatusCode_CompanyId",
                        columns: x => new { x.MaritalStatusCode, x.CompanyId },
                        principalTable: "marital_status_codes",
                        principalColumns: new[] { "marstacode", "company_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Employees_nationality_codes_NationalityCode_CompanyId",
                        columns: x => new { x.NationalityCode, x.CompanyId },
                        principalTable: "nationality_codes",
                        principalColumns: new[] { "nationcode", "company_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Employees_position_codes_PositionCode_CompanyId",
                        columns: x => new { x.PositionCode, x.CompanyId },
                        principalTable: "position_codes",
                        principalColumns: new[] { "jobcode", "company_id" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Employees_race_codes_RaceCode_CompanyId",
                        columns: x => new { x.RaceCode, x.CompanyId },
                        principalTable: "race_codes",
                        principalColumns: new[] { "racecode", "company_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Employees_religion_codes_ReligionCode_CompanyId",
                        columns: x => new { x.ReligionCode, x.CompanyId },
                        principalTable: "religion_codes",
                        principalColumns: new[] { "religncode", "company_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Employees_salutation_code_SalutationCode_CompanyId",
                        columns: x => new { x.SalutationCode, x.CompanyId },
                        principalTable: "salutation_code",
                        principalColumns: new[] { "salucode", "company_id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ContactInformation",
                columns: table => new
                {
                    candidate_id = table.Column<string>(type: "text", nullable: false),
                    company_id = table.Column<string>(type: "text", nullable: false),
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    email = table.Column<string>(type: "text", nullable: false),
                    phone_number = table.Column<string>(type: "text", nullable: false),
                    office_number = table.Column<string>(type: "text", nullable: true),
                    other_number = table.Column<string>(type: "text", nullable: true),
                    correspondence_address = table.Column<string>(type: "text", nullable: false),
                    correspondence_state = table.Column<string>(type: "text", nullable: true),
                    correspondence_city = table.Column<string>(type: "text", nullable: true),
                    correspondence_area = table.Column<string>(type: "text", nullable: true),
                    correspondence_phone = table.Column<string>(type: "text", nullable: true),
                    permanent_address = table.Column<string>(type: "text", nullable: true),
                    permanent_phone = table.Column<string>(type: "text", nullable: true),
                    emergency_number = table.Column<string>(type: "text", nullable: true),
                    emergency_address = table.Column<string>(type: "text", nullable: true),
                    emergency_phone = table.Column<string>(type: "text", nullable: true),
                    EmployeeCandidateId = table.Column<string>(type: "text", nullable: true),
                    EmployeeCompanyId = table.Column<string>(type: "character varying(50)", nullable: true),
                    EmployeePositionCode = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactInformation", x => new { x.candidate_id, x.company_id });
                    table.ForeignKey(
                        name: "FK_ContactInformation_Employees_EmployeeCandidateId_EmployeeCo~",
                        columns: x => new { x.EmployeeCandidateId, x.EmployeeCompanyId, x.EmployeePositionCode },
                        principalTable: "Employees",
                        principalColumns: new[] { "CandidateId", "CompanyId", "PositionCode" });
                });

            migrationBuilder.CreateIndex(
                name: "IX_cessation_reasons_company_id",
                table: "cessation_reasons",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_Companies_company_id",
                table: "Companies",
                column: "company_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContactInformation_EmployeeCandidateId_EmployeeCompanyId_Em~",
                table: "ContactInformation",
                columns: new[] { "EmployeeCandidateId", "EmployeeCompanyId", "EmployeePositionCode" });

            migrationBuilder.CreateIndex(
                name: "IX_country_origin_codes_company_id",
                table: "country_origin_codes",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_CountryOfOriginCode_CompanyId",
                table: "Employees",
                columns: new[] { "CountryOfOriginCode", "CompanyId" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_MaritalStatusCode_CompanyId",
                table: "Employees",
                columns: new[] { "MaritalStatusCode", "CompanyId" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_NationalityCode_CompanyId",
                table: "Employees",
                columns: new[] { "NationalityCode", "CompanyId" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_PositionCode_CompanyId",
                table: "Employees",
                columns: new[] { "PositionCode", "CompanyId" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_RaceCode_CompanyId",
                table: "Employees",
                columns: new[] { "RaceCode", "CompanyId" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_ReligionCode_CompanyId",
                table: "Employees",
                columns: new[] { "ReligionCode", "CompanyId" });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_SalutationCode_CompanyId",
                table: "Employees",
                columns: new[] { "SalutationCode", "CompanyId" });

            migrationBuilder.CreateIndex(
                name: "IX_field_area_codes_company_id",
                table: "field_area_codes",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_hobby_codes_company_id",
                table: "hobby_codes",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_industry_codes_company_id",
                table: "industry_codes",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_job_codes_company_id",
                table: "job_codes",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_language_codes_company_id",
                table: "language_codes",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_marital_status_codes_company_id",
                table: "marital_status_codes",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_nationality_codes_company_id",
                table: "nationality_codes",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_position_codes_company_id",
                table: "position_codes",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_qualification_codes_company_id",
                table: "qualification_codes",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_qualification_grades_company_id",
                table: "qualification_grades",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_race_codes_company_id",
                table: "race_codes",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_religion_codes_company_id",
                table: "religion_codes",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_salutation_code_company_id",
                table: "salutation_code",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_Users_CompanyId",
                table: "Users",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email_CompanyId",
                table: "Users",
                columns: new[] { "Email", "CompanyId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_IcNumber_CompanyId",
                table: "Users",
                columns: new[] { "IcNumber", "CompanyId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CandidateHobbies");

            migrationBuilder.DropTable(
                name: "CandidateLanguages");

            migrationBuilder.DropTable(
                name: "CandidateResumes");

            migrationBuilder.DropTable(
                name: "cessation_reasons");

            migrationBuilder.DropTable(
                name: "ContactInformation");

            migrationBuilder.DropTable(
                name: "EmploymentHistories");

            migrationBuilder.DropTable(
                name: "field_area_codes");

            migrationBuilder.DropTable(
                name: "FieldExperiences");

            migrationBuilder.DropTable(
                name: "hobby_codes");

            migrationBuilder.DropTable(
                name: "industry_codes");

            migrationBuilder.DropTable(
                name: "job_codes");

            migrationBuilder.DropTable(
                name: "language_codes");

            migrationBuilder.DropTable(
                name: "qualification_codes");

            migrationBuilder.DropTable(
                name: "qualification_grades");

            migrationBuilder.DropTable(
                name: "Qualifications");

            migrationBuilder.DropTable(
                name: "Skills");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Employees");

            migrationBuilder.DropTable(
                name: "country_origin_codes");

            migrationBuilder.DropTable(
                name: "marital_status_codes");

            migrationBuilder.DropTable(
                name: "nationality_codes");

            migrationBuilder.DropTable(
                name: "position_codes");

            migrationBuilder.DropTable(
                name: "race_codes");

            migrationBuilder.DropTable(
                name: "religion_codes");

            migrationBuilder.DropTable(
                name: "salutation_code");

            migrationBuilder.DropTable(
                name: "Companies");
        }
    }
}
