using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Threading;
using System.Threading.Tasks;

namespace AMS360.Services
{
    public class WeatherHealthCheck : IHealthCheck
    {
        private readonly IWeatherService _weatherService;

        public WeatherHealthCheck(IWeatherService weatherService)
        {
            _weatherService = weatherService;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var isAvailable = await _weatherService.IsApiAvailableAsync();
                
                if (isAvailable)
                    return HealthCheckResult.Healthy("API do clima está funcionando.");
                
                return HealthCheckResult.Unhealthy("API do clima está indisponível.");
            }
            catch
            {
                return HealthCheckResult.Unhealthy("Erro ao verificar API do clima.");
            }
        }
    }
}