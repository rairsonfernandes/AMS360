using System;

namespace AMS360.Models
{
    public class WeatherViewModel
    {
        public string? City { get; set; }
        public WeatherResponse? CurrentWeather { get; set; }
        public WeatherResponse? Forecast { get; set; }
        public DateTime LastUpdate { get; set; }
        public bool IsApiAvailable { get; set; }
    }
}
