using System;
using System.Collections.Generic;

namespace AMS360.Models
{
    public class WeatherResponse
    {
        public string? City { get; set; }
        public string? Country { get; set; }
        public double Temperature { get; set; }
        public double TemperatureMin { get; set; }
        public double TemperatureMax { get; set; }
        public double Humidity { get; set; }
        public double Pressure { get; set; }
        public double WindSpeed { get; set; }
        public double WindDirection { get; set; }
        public string? Description { get; set; }
        public string? Icon { get; set; }
        public long Sunrise { get; set; }
        public long Sunset { get; set; }
        public DateTime LastUpdate { get; set; }
        public List<DailyForecast>? Forecast { get; set; }
    }

    public class DailyForecast
    {
        public DateTime Date { get; set; }
        public double Temperature { get; set; }
        public double TemperatureMin { get; set; }
        public double TemperatureMax { get; set; }
        public string? Description { get; set; }
        public string? Icon { get; set; }
        public int Humidity { get; set; }
        public double WindSpeed { get; set; }
        public double Pressure { get; set; }
    }
}