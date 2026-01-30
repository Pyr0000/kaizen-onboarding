// fileName: Program.cs
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using RecruitmentBackend.Data; 
using RecruitmentBackend.Middlewares;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System; 

var builder = WebApplication.CreateBuilder(args);

// 1. Add Services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
    
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddSingleton<ITableMapper, TableMapper>(); 

builder.Services.AddScoped<DropdownRepository>();

// 2. ✅ UPDATED CORS CONFIGURATION (Named Policy)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var frontendUrl = builder.Configuration["FRONTEND_URL"];

        if (builder.Environment.IsDevelopment())
        {
            policy.WithOrigins("http://localhost:3000") // Explicitly allow React running on 3000
                  .AllowAnyHeader()
                  .AllowAnyMethod(); // Critical for PATCH/DELETE
        }
        else if (!string.IsNullOrEmpty(frontendUrl))
        {
            policy.WithOrigins(frontendUrl)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            // Fallback warning
            Console.WriteLine("Warning: 'FRONTEND_URL' is not configured.");
        }
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                builder.Configuration.GetValue<string>("Jwt:Key") 
                ?? throw new InvalidOperationException("JWT Key is not configured."))),
            
            ValidateIssuer = false, 
            ValidateAudience = false, 
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero 
        };
    });

builder.Services.AddAuthorization();


var app = builder.Build();

// 3. Configure Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<UtcDateTimeMiddleware>();

// ✅ CRITICAL UPDATE: Use the Named Policy here
app.UseCors("AllowFrontend"); 

app.UseStaticFiles(); 

app.UseAuthentication(); 
app.UseAuthorization();
app.MapControllers();

app.Run();