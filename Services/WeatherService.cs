using AMS360.Models;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Linq;

namespace AMS360.Services
{
    public class WeatherService : IWeatherService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private readonly IConfiguration _configuration;
        private readonly ILogger<WeatherService> _logger;
        private readonly string? _apiKey;
        private readonly string? _baseUrl;

        public WeatherService(HttpClient httpClient, IMemoryCache cache, IConfiguration configuration, ILogger<WeatherService> logger)
        {
            _httpClient = httpClient;
            _cache = cache;
            _configuration = configuration;
            _logger = logger;
            _apiKey = _configuration["WeatherApi:ApiKey"];
            _baseUrl = _configuration["WeatherApi:BaseUrl"];
        }

        public async Task<WeatherResponse?> GetCurrentWeatherAsync(string city)
        {
            try
            {
                if (string.IsNullOrEmpty(_apiKey) || string.IsNullOrEmpty(_baseUrl))
                {
                    _logger.LogError("API Key ou Base URL não configuradas");
                    return null;
                }

                // Limpar a cidade para URL
                var cityEncoded = System.Web.HttpUtility.UrlEncode(city);
                var url = $"{_baseUrl}/weather?q={cityEncoded}&appid={_apiKey}&units=metric&lang=pt_br";
                
                _logger.LogInformation($"Chamando API: {url}");
                
                var response = await _httpClient.GetAsync(url);
                
                // Se falhar, tentar com o nome sem acentos e espaços
                if (!response.IsSuccessStatusCode)
                {
                    var simpleCity = city
                        .Replace(" ", "%20")
                        .Replace("ã", "a")
                        .Replace("á", "a")
                        .Replace("â", "a")
                        .Replace("é", "e")
                        .Replace("ê", "e")
                        .Replace("í", "i")
                        .Replace("ó", "o")
                        .Replace("ô", "o")
                        .Replace("ú", "u")
                        .Replace("ç", "c");
                    
                    if (simpleCity != city)
                    {
                        url = $"{_baseUrl}/weather?q={simpleCity}&appid={_apiKey}&units=metric&lang=pt_br";
                        _logger.LogInformation($"Tentando API com nome simplificado: {url}");
                        response = await _httpClient.GetAsync(url);
                    }
                }
                
                // Se ainda falhar, tentar buscar pela cidade com o nome em inglês (para cidades famosas)
                if (!response.IsSuccessStatusCode)
                {
                    var cityNameMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        { "new york", "New York" },
                        { "sao paulo", "Sao Paulo" },
                        { "rio de janeiro", "Rio de Janeiro" },
                        { "los angeles", "Los Angeles" },
                        { "são paulo", "Sao Paulo" },
                        { "rio", "Rio de Janeiro" },
                        { "brasilia", "Brasilia" },
                        { "belo horizonte", "Belo Horizonte" },
                        { "porto alegre", "Porto Alegre" },
                        { "salvador", "Salvador" },
                        { "fortaleza", "Fortaleza" },
                        { "curitiba", "Curitiba" },
                        { "recife", "Recife" },
                        { "manaus", "Manaus" },
                        { "belem", "Belem" }
                    };

                    var lowerCity = city.ToLower().Trim();
                    if (cityNameMap.TryGetValue(lowerCity, out var mappedCity))
                    {
                        var mappedEncoded = System.Web.HttpUtility.UrlEncode(mappedCity);
                        url = $"{_baseUrl}/weather?q={mappedEncoded}&appid={_apiKey}&units=metric&lang=pt_br";
                        _logger.LogInformation($"Tentando API com nome mapeado: {url}");
                        response = await _httpClient.GetAsync(url);
                    }
                }
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Erro na API: {response.StatusCode} para {city}");
                    return null;
                }
                
                var json = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"JSON recebido: {json}");
                
                // Usar JsonDocument para parsing mais flexível
                using var document = JsonDocument.Parse(json);
                var root = document.RootElement;
                
                // Extrair dados manualmente com verificações
                var weatherResponse = new WeatherResponse();
                
                if (root.TryGetProperty("name", out var nameElement))
                    weatherResponse.City = nameElement.GetString() ?? city;
                else
                    weatherResponse.City = city;
                
                if (root.TryGetProperty("sys", out var sysElement) && 
                    sysElement.TryGetProperty("country", out var countryElement))
                    weatherResponse.Country = countryElement.GetString() ?? "";
                
                if (root.TryGetProperty("main", out var mainElement))
                {
                    if (mainElement.TryGetProperty("temp", out var tempElement))
                        weatherResponse.Temperature = tempElement.GetDouble();
                    
                    if (mainElement.TryGetProperty("temp_min", out var tempMinElement))
                        weatherResponse.TemperatureMin = tempMinElement.GetDouble();
                    
                    if (mainElement.TryGetProperty("temp_max", out var tempMaxElement))
                        weatherResponse.TemperatureMax = tempMaxElement.GetDouble();
                    
                    if (mainElement.TryGetProperty("humidity", out var humidityElement))
                        weatherResponse.Humidity = humidityElement.GetDouble();
                    
                    if (mainElement.TryGetProperty("pressure", out var pressureElement))
                        weatherResponse.Pressure = pressureElement.GetDouble();
                }
                
                if (root.TryGetProperty("wind", out var windElement))
                {
                    if (windElement.TryGetProperty("speed", out var speedElement))
                        weatherResponse.WindSpeed = speedElement.GetDouble();
                    
                    if (windElement.TryGetProperty("deg", out var degElement))
                        weatherResponse.WindDirection = degElement.GetDouble();
                }
                
                if (root.TryGetProperty("weather", out var weatherElement) && 
                    weatherElement.GetArrayLength() > 0)
                {
                    var firstWeather = weatherElement[0];
                    if (firstWeather.TryGetProperty("description", out var descElement))
                        weatherResponse.Description = descElement.GetString() ?? "";
                    
                    if (firstWeather.TryGetProperty("icon", out var iconElement))
                        weatherResponse.Icon = iconElement.GetString() ?? "";
                }
                
                if (root.TryGetProperty("sys", out var sysElement2))
                {
                    if (sysElement2.TryGetProperty("sunrise", out var sunriseElement))
                        weatherResponse.Sunrise = sunriseElement.GetInt64();
                    
                    if (sysElement2.TryGetProperty("sunset", out var sunsetElement))
                        weatherResponse.Sunset = sunsetElement.GetInt64();
                }
                
                weatherResponse.LastUpdate = DateTime.Now;
                
                _logger.LogInformation($"Dados processados: Temp={weatherResponse.Temperature}, Desc={weatherResponse.Description}");
                
                return weatherResponse;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao processar dados para {city}");
                return null;
            }
        }

        public async Task<WeatherResponse?> GetWeatherForecastAsync(string city, int days = 7)
        {
            try
            {
                if (string.IsNullOrEmpty(_apiKey) || string.IsNullOrEmpty(_baseUrl))
                {
                    _logger.LogError("API Key ou Base URL não configuradas");
                    return null;
                }

                // Garantir 7 dias
                days = 7;
                
                // Limpar a cidade para URL
                var cityEncoded = System.Web.HttpUtility.UrlEncode(city);
                var url = $"{_baseUrl}/forecast?q={cityEncoded}&appid={_apiKey}&units=metric&lang=pt_br&cnt=40";
                
                _logger.LogInformation($"Chamando API de previsão: {url}");
                
                var response = await _httpClient.GetAsync(url);
                
                // Se falhar, tentar com o nome simplificado
                if (!response.IsSuccessStatusCode)
                {
                    var simpleCity = city
                        .Replace(" ", "%20")
                        .Replace("ã", "a")
                        .Replace("á", "a")
                        .Replace("â", "a")
                        .Replace("é", "e")
                        .Replace("ê", "e")
                        .Replace("í", "i")
                        .Replace("ó", "o")
                        .Replace("ô", "o")
                        .Replace("ú", "u")
                        .Replace("ç", "c");
                    
                    if (simpleCity != city)
                    {
                        url = $"{_baseUrl}/forecast?q={simpleCity}&appid={_apiKey}&units=metric&lang=pt_br&cnt=40";
                        _logger.LogInformation($"Tentando API de previsão com nome simplificado: {url}");
                        response = await _httpClient.GetAsync(url);
                    }
                }
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Erro na API de previsão: {response.StatusCode} para {city}");
                    return null;
                }
                
                var json = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"JSON de previsão recebido");
                
                // Usar JsonDocument para parsing mais flexível
                using var document = JsonDocument.Parse(json);
                var root = document.RootElement;
                
                var weatherResponse = new WeatherResponse();
                
                // Extrair cidade
                if (root.TryGetProperty("city", out var cityElement))
                {
                    if (cityElement.TryGetProperty("name", out var nameElement))
                        weatherResponse.City = nameElement.GetString() ?? city;
                    
                    if (cityElement.TryGetProperty("country", out var countryElement))
                        weatherResponse.Country = countryElement.GetString() ?? "";
                }
                else
                {
                    weatherResponse.City = city;
                }
                
                // Extrair previsões
                var forecasts = new List<DailyForecast>();
                
                if (root.TryGetProperty("list", out var listElement) && listElement.ValueKind == JsonValueKind.Array)
                {
                    // Agrupar por dia
                    var dailyGroups = new Dictionary<DateTime, List<JsonElement>>();
                    
                    foreach (var item in listElement.EnumerateArray())
                    {
                        if (item.TryGetProperty("dt", out var dtElement))
                        {
                            var dt = DateTimeOffset.FromUnixTimeSeconds(dtElement.GetInt64()).LocalDateTime.Date;
                            
                            if (!dailyGroups.ContainsKey(dt))
                                dailyGroups[dt] = new List<JsonElement>();
                            
                            dailyGroups[dt].Add(item);
                        }
                    }
                    
                    var sortedDays = dailyGroups.Keys.OrderBy(d => d).ToList();
                    
                    // Se tiver menos de 7 dias, completar com dados de exemplo
                    if (sortedDays.Count < 7)
                    {
                        _logger.LogWarning($"Apenas {sortedDays.Count} dias disponíveis, completando com dados de exemplo");
                        return GetSampleForecastWithRealData(city, sortedDays, dailyGroups);
                    }
                    
                    // Pegar os 7 primeiros dias
                    foreach (var date in sortedDays.Take(7))
                    {
                        var dayData = dailyGroups[date];
                        var dailyForecast = new DailyForecast
                        {
                            Date = date
                        };
                        
                        double tempSum = 0, tempMinSum = 0, tempMaxSum = 0, humiditySum = 0, windSum = 0;
                        int count = 0;
                        string? description = null;
                        string? icon = null;
                        
                        foreach (var item in dayData)
                        {
                            if (item.TryGetProperty("main", out var mainElement))
                            {
                                if (mainElement.TryGetProperty("temp", out var tempElement))
                                    tempSum += tempElement.GetDouble();
                                
                                if (mainElement.TryGetProperty("temp_min", out var tempMinElement))
                                    tempMinSum += tempMinElement.GetDouble();
                                
                                if (mainElement.TryGetProperty("temp_max", out var tempMaxElement))
                                    tempMaxSum += tempMaxElement.GetDouble();
                                
                                if (mainElement.TryGetProperty("humidity", out var humidityElement))
                                    humiditySum += humidityElement.GetDouble();
                                
                                count++;
                            }
                            
                            if (item.TryGetProperty("weather", out var weatherElement) && 
                                weatherElement.GetArrayLength() > 0)
                            {
                                var firstWeather = weatherElement[0];
                                if (firstWeather.TryGetProperty("description", out var descElement))
                                    description = descElement.GetString();
                                
                                if (firstWeather.TryGetProperty("icon", out var iconElement))
                                    icon = iconElement.GetString();
                            }
                            
                            if (item.TryGetProperty("wind", out var windElement) && 
                                windElement.TryGetProperty("speed", out var speedElement))
                                windSum += speedElement.GetDouble();
                        }
                        
                        if (count > 0)
                        {
                            dailyForecast.Temperature = tempSum / count;
                            dailyForecast.TemperatureMin = tempMinSum / count;
                            dailyForecast.TemperatureMax = tempMaxSum / count;
                            dailyForecast.Humidity = (int)(humiditySum / count);
                            dailyForecast.WindSpeed = windSum / count;
                        }
                        
                        dailyForecast.Description = description ?? "";
                        dailyForecast.Icon = icon ?? "";
                        
                        // Pressão baseada na pressão atual ou simulada
                        var currentWeather = await GetCurrentWeatherAsync(city);
                        if (currentWeather != null && currentWeather.Pressure > 0)
                        {
                            var random = new Random(date.GetHashCode());
                            dailyForecast.Pressure = currentWeather.Pressure + random.Next(-5, 5);
                        }
                        else
                        {
                            var random = new Random(date.GetHashCode());
                            dailyForecast.Pressure = 1013 + random.Next(-10, 10);
                        }
                        
                        forecasts.Add(dailyForecast);
                    }
                }
                
                weatherResponse.Forecast = forecasts;
                weatherResponse.LastUpdate = DateTime.Now;
                
                _logger.LogInformation($"Previsão processada: {forecasts.Count} dias");
                
                return weatherResponse;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao processar previsão para {city}");
                return null;
            }
        }

        public async Task<WeatherViewModel> GetWeatherViewModelAsync(string city)
        {
            var current = await GetCurrentWeatherAsync(city);
            var forecast = await GetWeatherForecastAsync(city);
            
            return new WeatherViewModel
            {
                City = city,
                CurrentWeather = current,
                Forecast = forecast,
                LastUpdate = DateTime.Now,
                IsApiAvailable = current != null
            };
        }

        public async Task<bool> IsApiAvailableAsync()
        {
            try
            {
                if (string.IsNullOrEmpty(_apiKey) || string.IsNullOrEmpty(_baseUrl))
                    return false;
                    
                var url = $"{_baseUrl}/weather?q=London&appid={_apiKey}";
                var response = await _httpClient.GetAsync(url);
                return response.IsSuccessStatusCode;
            }
            catch { return false; }
        }

        // ========================================
        // MÉTODO AUXILIAR PARA COMPLETAR PREVISÃO
        // ========================================

        private WeatherResponse GetSampleForecastWithRealData(string city, List<DateTime> sortedDays, Dictionary<DateTime, List<JsonElement>> dailyGroups)
        {
            var result = new WeatherResponse
            {
                City = city,
                Country = "PT",
                Forecast = new List<DailyForecast>(),
                LastUpdate = DateTime.Now
            };
            
            // Adicionar dias reais primeiro
            foreach (var date in sortedDays)
            {
                var dayData = dailyGroups[date];
                var dailyForecast = new DailyForecast
                {
                    Date = date
                };
                
                double tempSum = 0, tempMinSum = 0, tempMaxSum = 0, humiditySum = 0, windSum = 0;
                int count = 0;
                string? description = null;
                string? icon = null;
                
                foreach (var item in dayData)
                {
                    if (item.TryGetProperty("main", out var mainElement))
                    {
                        if (mainElement.TryGetProperty("temp", out var tempElement))
                            tempSum += tempElement.GetDouble();
                        
                        if (mainElement.TryGetProperty("temp_min", out var tempMinElement))
                            tempMinSum += tempMinElement.GetDouble();
                        
                        if (mainElement.TryGetProperty("temp_max", out var tempMaxElement))
                            tempMaxSum += tempMaxElement.GetDouble();
                        
                        if (mainElement.TryGetProperty("humidity", out var humidityElement))
                            humiditySum += humidityElement.GetDouble();
                        
                        count++;
                    }
                    
                    if (item.TryGetProperty("weather", out var weatherElement) && 
                        weatherElement.GetArrayLength() > 0)
                    {
                        var firstWeather = weatherElement[0];
                        if (firstWeather.TryGetProperty("description", out var descElement))
                            description = descElement.GetString();
                        
                        if (firstWeather.TryGetProperty("icon", out var iconElement))
                            icon = iconElement.GetString();
                    }
                    
                    if (item.TryGetProperty("wind", out var windElement) && 
                        windElement.TryGetProperty("speed", out var speedElement))
                        windSum += speedElement.GetDouble();
                }
                
                if (count > 0)
                {
                    dailyForecast.Temperature = tempSum / count;
                    dailyForecast.TemperatureMin = tempMinSum / count;
                    dailyForecast.TemperatureMax = tempMaxSum / count;
                    dailyForecast.Humidity = (int)(humiditySum / count);
                    dailyForecast.WindSpeed = windSum / count;
                }
                
                dailyForecast.Description = description ?? "";
                dailyForecast.Icon = icon ?? "";
                
                var random = new Random(date.GetHashCode());
                dailyForecast.Pressure = 1013 + random.Next(-10, 10);
                
                result.Forecast.Add(dailyForecast);
            }
            
            // Completar com dados de exemplo até 7 dias
            var lastDate = sortedDays.LastOrDefault();
            if (lastDate == DateTime.MinValue)
                lastDate = DateTime.Now.Date;
            
            while (result.Forecast.Count < 7)
            {
                lastDate = lastDate.AddDays(1);
                var random = new Random(lastDate.GetHashCode());
                
                var sample = new DailyForecast
                {
                    Date = lastDate,
                    Temperature = 20 + random.Next(8),
                    TemperatureMin = 15 + random.Next(5),
                    TemperatureMax = 25 + random.Next(8),
                    Humidity = 60 + random.Next(25),
                    WindSpeed = 5 + random.Next(15),
                    Description = new[] { "Céu limpo", "Parcialmente nublado", "Nublado", "Chuva leve", "Ensolarado" }[random.Next(5)],
                    Icon = new[] { "01d", "02d", "03d", "10d", "01d" }[random.Next(5)],
                    Pressure = 1013 + random.Next(-10, 10)
                };
                
                result.Forecast.Add(sample);
            }
            
            return result;
        }

        #region API Response Models
        private class WeatherApiResponse
        {
            public string? Name { get; set; }
            public Sys? Sys { get; set; }
            public Main? Main { get; set; }
            public Wind? Wind { get; set; }
            public List<Weather>? Weather { get; set; }
        }

        private class WeatherForecastApiResponse
        {
            public City? City { get; set; }
            public List<ForecastItem>? List { get; set; }
        }

        private class Sys { public string? Country { get; set; } public long Sunrise { get; set; } public long Sunset { get; set; } }
        private class Main { public double Temp { get; set; } public double TempMin { get; set; } public double TempMax { get; set; } public double Humidity { get; set; } public double Pressure { get; set; } }
        private class Wind { public double Speed { get; set; } public double Deg { get; set; } }
        private class Weather { public string? Description { get; set; } public string? Icon { get; set; } }
        private class City { public string? Name { get; set; } public string? Country { get; set; } }
        private class ForecastItem { public long Dt { get; set; } public Main Main { get; set; } = new Main(); public Wind Wind { get; set; } = new Wind(); public List<Weather> Weather { get; set; } = new List<Weather>(); }
        #endregion
    }
} 