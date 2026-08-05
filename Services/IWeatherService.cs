using AMS360.Models;
using System.Threading.Tasks;

namespace AMS360.Services
{
    public interface IWeatherService
    {
        Task<WeatherResponse?> GetCurrentWeatherAsync(string city);
        Task<WeatherResponse?> GetWeatherForecastAsync(string city, int days = 7);
        Task<WeatherViewModel> GetWeatherViewModelAsync(string city);
        Task<bool> IsApiAvailableAsync();
    }
}
