using AMS360.Services;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;

var builder = WebApplication.CreateBuilder(args);

// ===== CONFIGURAR USER SECRETS =====
// Carrega secrets.json apenas em desenvolvimento
if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddUserSecrets<Program>();
}

// Carrega variáveis de ambiente (para produção)
builder.Configuration.AddEnvironmentVariables();

// ===== SERVICES =====
builder.Services.AddControllersWithViews();
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient();

// ===== WEATHER SERVICE =====
builder.Services.AddScoped<IWeatherService, WeatherService>();

// ===== COMPRESSION =====
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<GzipCompressionProvider>();
});

// ===== RATE LIMITING =====
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("WeatherAPI", opt =>
    {
        opt.PermitLimit = 100; // 100 chamadas por minuto
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 5;
    });
});

// ===== HEALTH CHECKS =====
builder.Services.AddHealthChecks();

// ===== CORS =====
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ===== BUILD APP =====
var app = builder.Build();

// ===== PIPELINE =====
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

app.UseRateLimiter();
app.UseCors("AllowAll");
app.UseAuthorization();

// ===== HEALTH CHECK =====
app.MapHealthChecks("/health");

// ===== ROTAS =====
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Weather}/{action=Index}/{id?}");

app.Run();