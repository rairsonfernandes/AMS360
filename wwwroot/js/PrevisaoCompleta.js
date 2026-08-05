/* ========================================
   AMS360 - Página de Previsão 7 Dias 
   ======================================== */

(function() {
    'use strict';

    // ========================================
    // VARIÁVEIS GLOBAIS
    // ========================================

    const API_BASE = window.location.origin;
    let tempChartInstance = null;
    let humidityWindChartInstance = null;
    let currentCity = '';
    let fullWeatherData = null;

    // ========================================
    // MAPEAMENTO DE ÍCONES (COMPLETO)
    // ========================================

    const WEATHER_ICONS = {
        '01d': { icon: 'bi-sun-fill', color: '#ffd93d', style: 'icon-sunny' },
        '01n': { icon: 'bi-moon-fill', color: '#93c5fd', style: 'icon-night' },
        '02d': { icon: 'bi-cloud-sun-fill', color: '#f9d976', style: 'icon-partly' },
        '02n': { icon: 'bi-cloud-moon-fill', color: '#93c5fd', style: 'icon-partly' },
        '03d': { icon: 'bi-cloud-fill', color: '#b0c4de', style: 'icon-cloudy' },
        '03n': { icon: 'bi-cloud-fill', color: '#9ca3af', style: 'icon-cloudy' },
        '04d': { icon: 'bi-clouds-fill', color: '#8fa8b8', style: 'icon-overcast' },
        '04n': { icon: 'bi-clouds-fill', color: '#8fa8b8', style: 'icon-overcast' },
        '09d': { icon: 'bi-cloud-rain-fill', color: '#4a9eff', style: 'icon-rainy' },
        '09n': { icon: 'bi-cloud-rain-fill', color: '#4a9eff', style: 'icon-rainy' },
        '10d': { icon: 'bi-cloud-rain-heavy-fill', color: '#4a9eff', style: 'icon-heavy-rain' },
        '10n': { icon: 'bi-cloud-rain-heavy-fill', color: '#4a9eff', style: 'icon-heavy-rain' },
        '11d': { icon: 'bi-cloud-lightning-rain-fill', color: '#a78bfa', style: 'icon-storm' },
        '11n': { icon: 'bi-cloud-lightning-rain-fill', color: '#a78bfa', style: 'icon-storm' },
        '13d': { icon: 'bi-snow-fill', color: '#93c5fd', style: 'icon-snow' },
        '13n': { icon: 'bi-snow-fill', color: '#93c5fd', style: 'icon-snow' },
        '50d': { icon: 'bi-cloud-fog-fill', color: '#9ca3af', style: 'icon-fog' },
        '50n': { icon: 'bi-cloud-fog-fill', color: '#9ca3af', style: 'icon-fog' }
    };

    // ========================================
    // FUNÇÃO PARA OBTER ÍCONE POR DESCRIÇÃO (FALLBACK)
    // ========================================

    function getIconByDescription(description) {
        if (!description) return { icon: 'bi-sun-fill', color: '#ffd93d', style: 'icon-sunny' };
        
        var desc = description.toLowerCase();
        if (desc.includes('chuva') || desc.includes('rain') || desc.includes('chuv')) {
            return { icon: 'bi-cloud-rain-fill', color: '#4a9eff', style: 'icon-rainy' };
        } else if (desc.includes('nublado') || desc.includes('cloudy') || desc.includes('overcast')) {
            return { icon: 'bi-cloud-fill', color: '#b0c4de', style: 'icon-cloudy' };
        } else if (desc.includes('limpo') || desc.includes('clear') || desc.includes('sol')) {
            return { icon: 'bi-sun-fill', color: '#ffd93d', style: 'icon-sunny' };
        } else if (desc.includes('neve') || desc.includes('snow')) {
            return { icon: 'bi-snow-fill', color: '#93c5fd', style: 'icon-snow' };
        } else if (desc.includes('trovão') || desc.includes('thunder') || desc.includes('storm')) {
            return { icon: 'bi-cloud-lightning-rain-fill', color: '#a78bfa', style: 'icon-storm' };
        } else if (desc.includes('neblina') || desc.includes('fog') || desc.includes('mist')) {
            return { icon: 'bi-cloud-fog-fill', color: '#9ca3af', style: 'icon-fog' };
        } else if (desc.includes('parcial') || desc.includes('partly')) {
            return { icon: 'bi-cloud-sun-fill', color: '#f9d976', style: 'icon-partly' };
        }
        return { icon: 'bi-sun-fill', color: '#ffd93d', style: 'icon-sunny' };
    }

    // ========================================
    // FUNÇÃO PARA OBTER ÍCONE
    // ========================================

    function getWeatherIconData(iconCode, description) {
        if (iconCode && WEATHER_ICONS[iconCode]) {
            return WEATHER_ICONS[iconCode];
        }
        return getIconByDescription(description);
    }

    // ========================================
    // INICIALIZAÇÃO
    // ========================================

    document.addEventListener('DOMContentLoaded', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const city = urlParams.get('city') || 'Lisbon';
        currentCity = city;

        loadPrevisaoData(city);

        updateClock();
        setInterval(updateClock, 60000);
        
        setInterval(function() {
            loadPrevisaoData(currentCity);
        }, 300000);
    });

    // ========================================
    // RELÓGIO
    // ========================================

    function updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('pt-PT', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const dateStr = now.toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const clockElement = document.getElementById('updateTimeDisplay');
        if (clockElement) {
            clockElement.textContent = dateStr + ' ' + timeStr;
        }

        const updateTime = document.getElementById('updateTime');
        if (updateTime) {
            updateTime.textContent = now.toLocaleString('pt-PT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    // ========================================
    // CARREGAR DADOS DA API
    // ========================================

    async function loadPrevisaoData(city) {
        try {
            showLoading(true);

            const response = await fetch(API_BASE + '/Weather/GetWeatherData?city=' + encodeURIComponent(city));
            if (!response.ok) throw new Error('Erro ao buscar dados');

            const data = await response.json();

            if (!data || !data.success) {
                showError('Cidade não encontrada', 'Não foi possível encontrar dados para "' + city + '".');
                return;
            }

            fullWeatherData = data;
            updatePrevisaoUI(data);

            if (data.forecast && data.forecast.length > 0) {
                renderForecastCards(data.forecast);
                renderTable(data.forecast);
                renderResumoStats(data.forecast);
                initCharts(data.forecast);
            }

            showLoading(false);

        } catch (error) {
            console.error('Erro:', error);
            showError('Erro', 'Ocorreu um erro ao carregar os dados.');
            showLoading(false);
        }
    }

    // ========================================
    // ATUALIZAR UI
    // ========================================

    function updatePrevisaoUI(data) {
        var cityBadge = document.getElementById('cityBadge');
        if (cityBadge) {
            cityBadge.innerHTML = '<i class="bi bi-geo-alt me-1"></i> ' + data.city + ', ' + (data.country || 'PT');
        }

        var mobileCity = document.getElementById('mobileCityName');
        if (mobileCity) {
            mobileCity.textContent = data.city + ', ' + (data.country || 'PT');
        }

        var currentTemp = document.getElementById('currentTempDisplay');
        if (currentTemp) {
            currentTemp.textContent = data.temperature + '°C';
        }

        var currentDesc = document.getElementById('currentDescDisplay');
        if (currentDesc) {
            currentDesc.textContent = data.description || 'Céu limpo';
        }

        var currentIcon = document.getElementById('currentWeatherIcon');
        if (currentIcon) {
            var iconData = getWeatherIconData(data.icon, data.description);
            currentIcon.className = 'bi ' + iconData.icon + ' current-weather-icon';
            currentIcon.style.color = iconData.color;
        }

        var currentMax = document.getElementById('currentMax');
        if (currentMax) {
            currentMax.textContent = data.temperatureMax + '°C';
        }

        var currentMin = document.getElementById('currentMin');
        if (currentMin) {
            currentMin.textContent = data.temperatureMin + '°C';
        }

        var currentHumidity = document.getElementById('currentHumidity');
        if (currentHumidity) {
            currentHumidity.textContent = data.humidity + '%';
        }

        var currentWind = document.getElementById('currentWind');
        if (currentWind) {
            currentWind.textContent = data.windSpeed + ' km/h';
        }

        var currentPressure = document.getElementById('currentPressure');
        if (currentPressure) {
            currentPressure.textContent = data.pressure + ' hPa';
        }
    }

    // ========================================
    // RENDERIZAR CARDS DE PREVISÃO 7 DIAS
    // ========================================

    function renderForecastCards(forecastData) {
        var container = document.getElementById('forecast7Container');
        if (!container) return;

        container.innerHTML = '';

        var days = forecastData.slice(0, 7);
        var today = new Date();
        today.setHours(0, 0, 0, 0);

        days.forEach(function(day, index) {
            var date = new Date(day.date);
            date.setHours(0, 0, 0, 0);

            var isToday = date.getTime() === today.getTime();
            var isTomorrow = date.getTime() === new Date(today.getTime() + 86400000).getTime();
            var isAfterTomorrow = date.getTime() === new Date(today.getTime() + 172800000).getTime();

            var dayName;
            if (isToday) {
                dayName = 'Hoje';
            } else if (isTomorrow) {
                dayName = 'Amanhã';
            } else if (isAfterTomorrow) {
                dayName = 'Depois';
            } else {
                dayName = date.toLocaleDateString('pt-PT', { weekday: 'short' });
                dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            }

            var dayDate = date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
            var iconData = getWeatherIconData(day.icon, day.description);

            var tempMax = Math.round(day.temperatureMax);
            var tempMin = Math.round(day.temperatureMin);
            var humidity = day.humidity;
            var windSpeed = Math.round(day.windSpeed);
            var rainChance = Math.round(Math.random() * 30 + (day.description && day.description.toLowerCase().includes('chuva') ? 40 : 0));

            var col = document.createElement('div');
            col.className = 'col-6 col-sm-4 col-lg';

            var cardClass = 'forecast-card-7';
            if (isToday) {
                cardClass += ' current-day';
            }

            col.innerHTML = `
                <div class="${cardClass}">
                    ${isToday ? '<div class="today-badge"><i class="bi bi-star-fill"></i> Hoje</div>' : ''}
                    <div class="day-name">${dayName}</div>
                    <div class="day-date">${dayDate}</div>
                    <i class="bi ${iconData.icon} day-icon ${iconData.style}" style="color:${iconData.color};"></i>
                    <div class="day-temp-max">${tempMax}° <span class="day-temp-min">${tempMin}°</span></div>
                    <div class="day-desc">${day.description || 'Céu limpo'}</div>
                    <div class="day-details">
                        <span class="detail-item"><i class="bi bi-droplet"></i> ${humidity}%</span>
                        <span class="detail-item"><i class="bi bi-wind"></i> ${windSpeed} km/h</span>
                        <span class="detail-item"><i class="bi bi-cloud-rain"></i> ${rainChance}%</span>
                    </div>
                    <div class="day-divider"></div>
                    <div class="day-stats">
                        <span class="stat-high"><i class="bi bi-arrow-up"></i> ${tempMax}°</span>
                        <span class="stat-low"><i class="bi bi-arrow-down"></i> ${tempMin}°</span>
                    </div>
                </div>
            `;
            container.appendChild(col);
        });
    }

    // ========================================
    // RENDERIZAR RESUMO ESTATÍSTICO
    // ========================================

    function renderResumoStats(forecastData) {
        var days = forecastData.slice(0, 7);
        
        var hottestDay = days.reduce(function(a, b) {
            return a.temperatureMax > b.temperatureMax ? a : b;
        });
        
        var coldestDay = days.reduce(function(a, b) {
            return a.temperatureMin < b.temperatureMin ? a : b;
        });
        
        var avgTemp = days.reduce(function(sum, d) {
            return sum + d.temperature;
        }, 0) / days.length;
        
        var avgHumidity = days.reduce(function(sum, d) {
            return sum + d.humidity;
        }, 0) / days.length;
        
        var rainyDays = days.filter(function(d) {
            return d.description && d.description.toLowerCase().includes('chuva');
        }).length;

        var hottestEl = document.getElementById('hottestDay');
        if (hottestEl) {
            var hottestDate = new Date(hottestDay.date);
            hottestEl.textContent = Math.round(hottestDay.temperatureMax) + '° (' + 
                hottestDate.toLocaleDateString('pt-PT', { weekday: 'short' }) + ')';
        }

        var coldestEl = document.getElementById('coldestDay');
        if (coldestEl) {
            var coldestDate = new Date(coldestDay.date);
            coldestEl.textContent = Math.round(coldestDay.temperatureMin) + '° (' + 
                coldestDate.toLocaleDateString('pt-PT', { weekday: 'short' }) + ')';
        }

        var avgTempEl = document.getElementById('avgTempDisplay');
        if (avgTempEl) {
            avgTempEl.textContent = avgTemp.toFixed(1) + '°C';
        }

        var avgHumidityEl = document.getElementById('avgHumidityDisplay');
        if (avgHumidityEl) {
            avgHumidityEl.textContent = Math.round(avgHumidity) + '%';
        }

        var rainyDaysEl = document.getElementById('rainyDaysDisplay');
        if (rainyDaysEl) {
            rainyDaysEl.textContent = rainyDays;
        }
    }

    // ========================================
    // RENDERIZAR TABELA
    // ========================================

    function renderTable(forecastData) {
        var tbody = document.getElementById('tableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        var days = forecastData.slice(0, 7);
        var today = new Date();
        today.setHours(0, 0, 0, 0);

        days.forEach(function(day) {
            var date = new Date(day.date);
            date.setHours(0, 0, 0, 0);

            var isToday = date.getTime() === today.getTime();
            var isTomorrow = date.getTime() === new Date(today.getTime() + 86400000).getTime();
            var isAfterTomorrow = date.getTime() === new Date(today.getTime() + 172800000).getTime();

            var dayName;
            if (isToday) {
                dayName = 'Hoje';
            } else if (isTomorrow) {
                dayName = 'Amanhã';
            } else if (isAfterTomorrow) {
                dayName = 'Depois';
            } else {
                dayName = date.toLocaleDateString('pt-PT', { weekday: 'short' });
                dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            }

            var dayDate = date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
            var iconData = getWeatherIconData(day.icon, day.description);

            var pressureDisplay = '--';
            if (day.pressure) {
                pressureDisplay = Math.round(day.pressure) + ' hPa';
            }

            var tr = document.createElement('tr');
            if (isToday) {
                tr.className = 'table-row-today';
            }

            tr.innerHTML = `
                <td>
                    <strong style="${isToday ? 'color:#7ad0ff;' : ''}">${dayName}</strong>
                    <br><span style="font-size:0.7rem;color:rgba(255,255,255,0.3);">${dayDate}</span>
                    ${isToday ? ' <span class="today-badge-table"><i class="bi bi-star-fill"></i></span>' : ''}
                </td>
                <td><i class="bi ${iconData.icon}" style="color:${iconData.color};font-size:1.2rem;"></i> ${day.description || 'Céu limpo'}</td>
                <td class="temp-high">${Math.round(day.temperatureMax)}°C</td>
                <td class="temp-low">${Math.round(day.temperatureMin)}°C</td>
                <td>${day.humidity}%</td>
                <td>${Math.round(day.windSpeed)} km/h</td>
                <td>${pressureDisplay}</td>
                <td><span class="rain-chance-badge ${day.humidity > 70 ? 'high' : ''}">${Math.round(day.humidity > 70 ? 60 + Math.random() * 30 : 10 + Math.random() * 20)}%</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ========================================
    // INICIALIZAR GRÁFICOS
    // ========================================

    function initCharts(forecastData) {
        var days = forecastData.slice(0, 7);
        var labels = days.map(function(d) {
            var date = new Date(d.date);
            return date.toLocaleDateString('pt-PT', { weekday: 'short' });
        });

        var maxTemps = days.map(function(d) { return Math.round(d.temperatureMax); });
        var minTemps = days.map(function(d) { return Math.round(d.temperatureMin); });
        var humidityData = days.map(function(d) { return d.humidity; });
        var windData = days.map(function(d) { return Math.round(d.windSpeed); });

        var tempCtx = document.getElementById('tempChart7');
        if (tempCtx) {
            if (tempChartInstance) {
                tempChartInstance.destroy();
            }

            var gradient = tempCtx.getContext('2d').createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, 'rgba(249, 184, 74, 0.3)');
            gradient.addColorStop(1, 'rgba(249, 184, 74, 0.0)');

            var gradient2 = tempCtx.getContext('2d').createLinearGradient(0, 0, 0, 200);
            gradient2.addColorStop(0, 'rgba(122, 208, 255, 0.3)');
            gradient2.addColorStop(1, 'rgba(122, 208, 255, 0.0)');

            tempChartInstance = new Chart(tempCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Máxima',
                            data: maxTemps,
                            borderColor: '#f9b84a',
                            backgroundColor: gradient,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#f9b84a',
                            pointBorderColor: '#0b1a2f',
                            pointBorderWidth: 2,
                            pointRadius: 6,
                            pointHoverRadius: 8,
                            borderWidth: 2
                        },
                        {
                            label: 'Mínima',
                            data: minTemps,
                            borderColor: '#7ad0ff',
                            backgroundColor: gradient2,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#7ad0ff',
                            pointBorderColor: '#0b1a2f',
                            pointBorderWidth: 2,
                            pointRadius: 6,
                            pointHoverRadius: 8,
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: 'rgba(255,255,255,0.6)',
                                font: { size: 11, family: 'Inter' },
                                boxWidth: 12,
                                padding: 12,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(11, 26, 47, 0.9)',
                            borderColor: 'rgba(255,255,255,0.05)',
                            borderWidth: 1,
                            padding: 12,
                            cornerRadius: 8,
                            titleColor: 'white',
                            bodyColor: 'rgba(255,255,255,0.7)'
                        }
                    },
                    scales: {
                        y: {
                            ticks: { 
                                color: 'rgba(255,255,255,0.4)', 
                                font: { size: 10 },
                                stepSize: 5
                            },
                            grid: { color: 'rgba(255,255,255,0.05)' }
                        },
                        x: {
                            ticks: { 
                                color: 'rgba(255,255,255,0.4)', 
                                font: { size: 10 } 
                            },
                            grid: { color: 'rgba(255,255,255,0.05)' }
                        }
                    }
                }
            });
        }

        var humCtx = document.getElementById('humidityWindChart');
        if (humCtx) {
            if (humidityWindChartInstance) {
                humidityWindChartInstance.destroy();
            }

            humidityWindChartInstance = new Chart(humCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Humidade (%)',
                            data: humidityData,
                            backgroundColor: 'rgba(122, 208, 255, 0.5)',
                            borderColor: '#7ad0ff',
                            borderWidth: 2,
                            borderRadius: 6,
                            order: 1
                        },
                        {
                            label: 'Vento (km/h)',
                            data: windData,
                            backgroundColor: 'rgba(249, 184, 74, 0.4)',
                            borderColor: '#f9b84a',
                            borderWidth: 2,
                            borderRadius: 6,
                            order: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: 'rgba(255,255,255,0.6)',
                                font: { size: 11, family: 'Inter' },
                                boxWidth: 12,
                                padding: 12,
                                usePointStyle: true,
                                pointStyle: 'rect'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(11, 26, 47, 0.9)',
                            borderColor: 'rgba(255,255,255,0.05)',
                            borderWidth: 1,
                            padding: 12,
                            cornerRadius: 8,
                            titleColor: 'white',
                            bodyColor: 'rgba(255,255,255,0.7)'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { 
                                color: 'rgba(255,255,255,0.4)', 
                                font: { size: 10 } 
                            },
                            grid: { color: 'rgba(255,255,255,0.05)' }
                        },
                        x: {
                            ticks: { 
                                color: 'rgba(255,255,255,0.4)', 
                                font: { size: 10 } 
                            },
                            grid: { color: 'rgba(255,255,255,0.05)' }
                        }
                    }
                }
            });
        }
    }

    // ========================================
    // FUNÇÕES AUXILIARES
    // ========================================

    function showLoading(show) {
        var loader = document.getElementById('loadingIndicator');
        var content = document.getElementById('previsaoContent');

        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }

        if (content) {
            content.style.display = show ? 'none' : 'block';
        }
    }

    function showError(title, message) {
        var container = document.getElementById('previsaoContent');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-exclamation-triangle-fill" style="font-size:4rem;color:#ff6b6b;"></i>
                    <h4 class="text-soft-white mt-3">${title}</h4>
                    <p class="text-soft-muted">${message}</p>
                    <a href="/Weather/Index" class="btn btn-primary mt-3" style="background:#7ad0ff;border:none;padding:0.6rem 2rem;border-radius:40px;text-decoration:none;color:#0b1a2f;font-weight:600;">Voltar ao Início</a>
                </div>
            `;
        }

        var loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.style.display = 'none';
        }
    }

})();