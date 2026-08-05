using AMS360.Models;
using AMS360.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace AMS360.Controllers
{
    /// <summary>
    /// Controlador responsável pelas operações meteorológicas
    /// </summary>
    public class WeatherController : Controller
    {
        private readonly IWeatherService _weatherService;
        private readonly ILogger<WeatherController> _logger;

        public WeatherController(IWeatherService weatherService, ILogger<WeatherController> logger)
        {
            _weatherService = weatherService;
            _logger = logger;
        }

        /// <summary>
        /// Dashboard principal com clima atual e previsão
        /// </summary>
        /// <param name="city">Nome da cidade (padrão: Lisbon)</param>
        /// <returns>View com dados do clima</returns>
        public async Task<IActionResult> Index(string? city)
        {
            try
            {
                if (string.IsNullOrEmpty(city))
                    city = "Lisbon";

                city = Uri.UnescapeDataString(city);

                var model = await _weatherService.GetWeatherViewModelAsync(city);

                if (model?.CurrentWeather == null)
                {
                    _logger.LogWarning("Cidade não encontrada: {City}", city);
                    return View("Error", new ErrorViewModel
                    {
                        ErrorMessage = $"Cidade \"{city}\" não encontrada. Verifique o nome e tente novamente.",
                        StatusCode = 404
                    });
                }

                return View(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao carregar dashboard para {City}", city);
                return View("~/Views/Shared/Error.cshtml", new ErrorViewModel
                {
                    ErrorMessage = "Ocorreu um erro ao carregar os dados do clima.",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// Previsão completa para 7 dias
        /// </summary>
        /// <param name="city">Nome da cidade</param>
        /// <returns>View com previsão estendida</returns>
        public async Task<IActionResult> PrevisaoCompleta(string? city)
        {
            try
            {
                if (string.IsNullOrEmpty(city))
                    city = "Lisbon";

                city = Uri.UnescapeDataString(city);

                var model = await _weatherService.GetWeatherViewModelAsync(city);

                if (model?.CurrentWeather == null)
                {
                    _logger.LogWarning("Cidade não encontrada para previsão: {City}", city);
                    return View("Error", new ErrorViewModel
                    {
                        ErrorMessage = $"Cidade \"{city}\" não encontrada.",
                        StatusCode = 404
                    });
                }

                return View(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao carregar previsão para {City}", city);
                return View("~/Views/Shared/Error.cshtml", new ErrorViewModel
                {
                    ErrorMessage = "Erro ao carregar previsão completa.",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// Detalhes do clima para um dia específico
        /// </summary>
        /// <param name="city">Nome da cidade</param>
        /// <param name="date">Data específica (opcional)</param>
        /// <returns>View com detalhes do dia</returns>
        public async Task<IActionResult> Detalhes(string? city, DateTime? date)
        {
            try
            {
                if (string.IsNullOrEmpty(city))
                    city = "Lisbon";

                city = Uri.UnescapeDataString(city);

                var model = await _weatherService.GetWeatherViewModelAsync(city);

                if (model?.CurrentWeather == null)
                {
                    return View("Error", new ErrorViewModel
                    {
                        ErrorMessage = $"Cidade \"{city}\" não encontrada.",
                        StatusCode = 404
                    });
                }

                var targetDate = date ?? DateTime.Now.Date;

                var dayForecast = model.Forecast?.Forecast?
                    .FirstOrDefault(f => f.Date.Date == targetDate.Date);

                if (dayForecast == null && model.Forecast?.Forecast != null && model.Forecast.Forecast.Count > 0)
                {
                    var today = DateTime.Now.Date;
                    var tomorrow = today.AddDays(1);
                    
                    if (targetDate == today || targetDate == tomorrow)
                    {
                        dayForecast = model.Forecast.Forecast
                            .OrderBy(f => Math.Abs((f.Date.Date - targetDate).Days))
                            .FirstOrDefault();
                    }
                    
                    if (dayForecast == null)
                    {
                        dayForecast = model.Forecast.Forecast.FirstOrDefault();
                    }
                }

                if (dayForecast == null)
                {
                    return View("Error", new ErrorViewModel
                    {
                        ErrorMessage = $"Não há previsão disponível para {targetDate:dd/MM/yyyy}.",
                        StatusCode = 404
                    });
                }

                ViewBag.City = city;
                return View(dayForecast);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao carregar detalhes para {City}", city);
                return View("~/Views/Shared/Error.cshtml", new ErrorViewModel
                {
                    ErrorMessage = "Erro ao carregar detalhes.",
                    StatusCode = 500
                });
            }
        }

        /// <summary>
        /// API Endpoint para obter dados do clima em JSON
        /// </summary>
        /// <param name="city">Nome da cidade</param>
        /// <returns>JSON com dados meteorológicos</returns>
        [HttpGet]
        public async Task<IActionResult> GetWeatherData(string? city)
        {
            try
            {
                if (string.IsNullOrEmpty(city))
                    city = "Lisbon";

                city = Uri.UnescapeDataString(city);

                var model = await _weatherService.GetWeatherViewModelAsync(city);

                if (model?.CurrentWeather == null)
                {
                    _logger.LogWarning("API: Cidade não encontrada - {City}", city);
                    return Json(new
                    {
                        success = false,
                        error = "Cidade não encontrada",
                        city = city
                    });
                }

                var forecastList = new List<object>();

                if (model.Forecast?.Forecast != null)
                {
                    foreach (var f in model.Forecast.Forecast)
                    {
                        forecastList.Add(new
                        {
                            date = f.Date.ToString("yyyy-MM-dd"),
                            dayName = f.Date.ToString("ddd"),
                            temperature = Math.Round(f.Temperature, 1),
                            temperatureMin = Math.Round(f.TemperatureMin, 1),
                            temperatureMax = Math.Round(f.TemperatureMax, 1),
                            description = f.Description ?? "",
                            icon = f.Icon ?? "",
                            humidity = f.Humidity,
                            windSpeed = Math.Round(f.WindSpeed, 1),
                            pressure = Math.Round(f.Pressure, 0)
                        });
                    }
                }

                var result = new
                {
                    success = true,
                    city = model.CurrentWeather.City ?? city,
                    country = model.CurrentWeather.Country ?? "",
                    temperature = Math.Round(model.CurrentWeather.Temperature, 1),
                    temperatureMin = Math.Round(model.CurrentWeather.TemperatureMin, 1),
                    temperatureMax = Math.Round(model.CurrentWeather.TemperatureMax, 1),
                    feelsLike = Math.Round(model.CurrentWeather.Temperature - 1, 1),
                    humidity = Math.Round(model.CurrentWeather.Humidity, 0),
                    windSpeed = Math.Round(model.CurrentWeather.WindSpeed, 1),
                    windDirection = Math.Round(model.CurrentWeather.WindDirection, 0),
                    pressure = Math.Round(model.CurrentWeather.Pressure, 0),
                    description = model.CurrentWeather.Description ?? "",
                    icon = model.CurrentWeather.Icon ?? "01d",
                    sunrise = model.CurrentWeather.Sunrise,
                    sunset = model.CurrentWeather.Sunset,
                    lastUpdate = model.CurrentWeather.LastUpdate.ToString("yyyy-MM-dd HH:mm:ss"),
                    forecast = forecastList
                };

                _logger.LogInformation("API: Dados retornados para {City}", city);
                return Json(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "API: Erro ao obter dados para {City}", city);
                return Json(new
                {
                    success = false,
                    error = "Erro ao processar dados",
                    city = city
                });
            }
        }

        /// <summary>
        /// Verifica o status da API do clima
        /// </summary>
        /// <returns>Status da API</returns>
        [HttpGet]
        public async Task<IActionResult> ApiStatus()
        {
            try
            {
                var isAvailable = await _weatherService.IsApiAvailableAsync();
                return Json(new
                {
                    available = isAvailable,
                    timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao verificar status da API");
                return Json(new
                {
                    available = false,
                    error = ex.Message,
                    timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                });
            }
        }

        /// <summary>
        /// Página de teste de erros - APENAS PARA DESENVOLVIMENTO
        /// </summary>
        /// <param name="code">Código do erro (404, 403, 500, 503)</param>
        /// <returns>Página de erro correspondente</returns>
        [HttpGet]
        public IActionResult TestError(int code = 404)
        {
            var model = new ErrorViewModel
            {
                StatusCode = code,
                ErrorMessage = code switch
                {
                    404 => "Página não encontrada. O recurso solicitado não existe.",
                    403 => "Acesso negado. Você não tem permissão para acessar este recurso.",
                    500 => "Erro interno do servidor. Algo correu mal.",
                    503 => "Serviço indisponível. O servidor está sobrecarregado ou em manutenção.",
                    _ => "Erro desconhecido."
                },
                RequestId = $"TEST-{code}-{DateTime.Now.Ticks}"
            };

            return View("~/Views/Shared/Error.cshtml", model);
        }

        /// <summary>
        /// Força um erro 500 para teste
        /// </summary>
        /// <returns>Exceção forçada para teste</returns>
        [HttpGet]
        public IActionResult ForcarErro()
        {
            throw new Exception("Erro forçado para teste do sistema!");
        }

        /// <summary>
        /// Página Sobre o projeto
        /// </summary>
        /// <returns>View Sobre</returns>
        public IActionResult Sobre()
        {
            return View();
        }

        /// <summary>
        /// Página de erro
        /// </summary>
        /// <param name="statusCode">Código HTTP de erro</param>
        /// <returns>View de erro</returns>
        public IActionResult Error(int? statusCode = null)
        {
            var model = new ErrorViewModel();

            if (statusCode.HasValue)
            {
                model.StatusCode = statusCode.Value;
                model.ErrorMessage = statusCode.Value switch
                {
                    404 => "Página não encontrada.",
                    403 => "Acesso negado.",
                    500 => "Erro interno do servidor.",
                    503 => "Serviço indisponível.",
                    _ => "Ocorreu um erro ao processar sua solicitação."
                };
            }

            return View("~/Views/Shared/Error.cshtml", model);
        }
    }
}