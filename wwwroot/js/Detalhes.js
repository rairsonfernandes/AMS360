/* ========================================
   AMS360 - Página de Detalhes Meteorológicos 
   ======================================== */

(function() {
    'use strict';

    // ========================================
    // VARIÁVEIS GLOBAIS
    // ========================================

    const API_BASE = window.location.origin;
    let tempChartInstance = null;
    let humidityChartInstance = null;
    let currentCity = '';
    let currentDate = '';
    let fullWeatherData = null;

    // ========================================
    // MAPEAMENTO DE ÍCONES
    // ========================================

    const WEATHER_ICONS = {
        '01d': { icon: 'bi-sun-fill', color: '#ffd93d' },
        '01n': { icon: 'bi-moon-fill', color: '#93c5fd' },
        '02d': { icon: 'bi-cloud-sun-fill', color: '#f9d976' },
        '02n': { icon: 'bi-cloud-moon-fill', color: '#93c5fd' },
        '03d': { icon: 'bi-cloud-fill', color: '#b0c4de' },
        '03n': { icon: 'bi-cloud-fill', color: '#9ca3af' },
        '04d': { icon: 'bi-clouds-fill', color: '#8fa8b8' },
        '04n': { icon: 'bi-clouds-fill', color: '#8fa8b8' },
        '09d': { icon: 'bi-cloud-rain-fill', color: '#4a9eff' },
        '09n': { icon: 'bi-cloud-rain-fill', color: '#4a9eff' },
        '10d': { icon: 'bi-cloud-rain-heavy-fill', color: '#4a9eff' },
        '10n': { icon: 'bi-cloud-rain-heavy-fill', color: '#4a9eff' },
        '11d': { icon: 'bi-cloud-lightning-rain-fill', color: '#a78bfa' },
        '11n': { icon: 'bi-cloud-lightning-rain-fill', color: '#a78bfa' },
        '13d': { icon: 'bi-snow-fill', color: '#93c5fd' },
        '13n': { icon: 'bi-snow-fill', color: '#93c5fd' },
        '50d': { icon: 'bi-cloud-fog-fill', color: '#9ca3af' },
        '50n': { icon: 'bi-cloud-fog-fill', color: '#9ca3af' }
    };

    // ========================================
    // MAPEAMENTO POR DESCRIÇÃO (FALLBACK)
    // ========================================

    function getIconByDescription(description) {
        if (!description) return { icon: 'bi-sun-fill', color: '#ffd93d' };
        
        var desc = description.toLowerCase();
        if (desc.includes('chuva') || desc.includes('rain') || desc.includes('chuv')) {
            return { icon: 'bi-cloud-rain-fill', color: '#4a9eff' };
        } else if (desc.includes('nublado') || desc.includes('cloudy') || desc.includes('overcast')) {
            return { icon: 'bi-cloud-fill', color: '#b0c4de' };
        } else if (desc.includes('limpo') || desc.includes('clear') || desc.includes('sol')) {
            return { icon: 'bi-sun-fill', color: '#ffd93d' };
        } else if (desc.includes('neve') || desc.includes('snow')) {
            return { icon: 'bi-snow-fill', color: '#93c5fd' };
        } else if (desc.includes('trovão') || desc.includes('thunder') || desc.includes('storm')) {
            return { icon: 'bi-cloud-lightning-rain-fill', color: '#a78bfa' };
        } else if (desc.includes('neblina') || desc.includes('fog') || desc.includes('mist')) {
            return { icon: 'bi-cloud-fog-fill', color: '#9ca3af' };
        } else if (desc.includes('parcial') || desc.includes('partly')) {
            return { icon: 'bi-cloud-sun-fill', color: '#f9d976' };
        }
        return { icon: 'bi-sun-fill', color: '#ffd93d' };
    }

    // ========================================
    // FUNÇÃO PARA OBTER ÍCONE
    // ========================================

    function getWeatherIcon(iconCode, description) {
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
        const date = urlParams.get('date') || new Date().toISOString().split('T')[0];

        currentCity = city;
        currentDate = date;

        loadDetalhesData(city, date);

        updateClock();
        setInterval(updateClock, 60000);
        
        setInterval(function() {
            loadDetalhesData(currentCity, currentDate);
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
        
        const display = document.getElementById('currentHourDisplay');
        if (display) {
            display.textContent = '(Hora atual: ' + timeStr + ')';
        }
    }

    // ========================================
    // CARREGAR DADOS DA API
    // ========================================

    async function loadDetalhesData(city, date) {
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
            updateDetalhesUI(data, date);

            if (data.forecast && data.forecast.length > 0) {
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
    // FORMATAR TIMESTAMP
    // ========================================

    function formatTimeFromTimestamp(timestamp) {
        if (!timestamp || timestamp === 0 || timestamp === '0') {
            return '--:--';
        }
        
        try {
            const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
            if (ts < 1000000000) return '--:--';
            
            const date = new Date(ts * 1000);
            if (isNaN(date.getTime())) return '--:--';
            
            return date.toLocaleTimeString('pt-PT', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '--:--';
        }
    }

    // ========================================
    // ATUALIZAR UI
    // ========================================

    function updateDetalhesUI(data, selectedDate) {
        var cityBadge = document.getElementById('cityBadge');
        if (cityBadge) {
            cityBadge.innerHTML = '<i class="bi bi-geo-alt me-1"></i> ' + data.city + ', ' + (data.country || 'PT');
        }

        document.getElementById('statTemp').textContent = data.temperature + '°C';
        document.getElementById('statHumidity').textContent = data.humidity + '%';
        document.getElementById('statWind').textContent = data.windSpeed + ' km/h';
        document.getElementById('statPressure').textContent = data.pressure + ' hPa';

        document.getElementById('sunrise').textContent = formatTimeFromTimestamp(data.sunrise);
        document.getElementById('sunset').textContent = formatTimeFromTimestamp(data.sunset);

        var resumoIcon = document.getElementById('resumoIcon');
        if (resumoIcon) {
            var iconData = getWeatherIcon(data.icon, data.description);
            resumoIcon.className = 'bi ' + iconData.icon + ' big-icon';
            resumoIcon.style.color = iconData.color;
        }

        document.getElementById('resumoTemp').textContent = data.temperature + '°C';
        document.getElementById('resumoDesc').textContent = data.description || 'Carregando...';

        var selectedDay = null;
        if (data.forecast && data.forecast.length > 0) {
            data.forecast.forEach(function(day) {
                if (day.date === selectedDate) {
                    selectedDay = day;
                }
            });

            if (!selectedDay) {
                selectedDay = data.forecast[0];
            }
        }

        if (selectedDay) {
            document.getElementById('resumoMax').textContent = Math.round(selectedDay.temperatureMax) + '°C';
            document.getElementById('resumoMin').textContent = Math.round(selectedDay.temperatureMin) + '°C';
            document.getElementById('resumoHumidity').textContent = selectedDay.humidity + '%';
            document.getElementById('resumoWind').textContent = Math.round(selectedDay.windSpeed) + ' km/h';
            renderHourlyForecast(selectedDay, data);
        }

        if (data.forecast) {
            updateTable(data.forecast, selectedDate);
        }

        var updateTime = document.getElementById('updateTime');
        if (updateTime) {
            var now = new Date();
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
    // RENDERIZAR PREVISÃO HORÁRIA
    // ========================================

    function renderHourlyForecast(dayData, fullData) {
        var container = document.getElementById('hourlyForecastContainer');
        if (!container) return;

        container.innerHTML = '';

        var now = new Date();
        var currentHour = now.getHours();
        var today = new Date();
        var selectedDate = new Date(dayData.date);
        var isToday = selectedDate.toDateString() === today.toDateString();

        var baseTemp = dayData.temperature || 20;
        var baseHumidity = dayData.humidity || 50;
        var baseWind = dayData.windSpeed || 5;
        var description = dayData.description || 'Céu limpo';
        var iconCode = dayData.icon || '01d';

        for (var hour = 0; hour < 24; hour++) {
            var isCurrent = (isToday && hour === currentHour);
            var hourDisplay = hour.toString().padStart(2, '0') + ':00';
            
            var temp = calculateHourlyTemperature(baseTemp, hour, isToday);
            var humidity = calculateHourlyHumidity(baseHumidity, hour, isToday);
            var wind = calculateHourlyWind(baseWind, hour, isToday);
            var rainChance = calculateRainChance(description, hour, isToday);
            var hourlyIcon = getHourlyIcon(hour, iconCode, description);
            var hourDesc = getHourDescription(hour, description);

            var col = document.createElement('div');
            col.className = 'col-auto';
            
            var cardClass = 'hourly-card';
            if (isCurrent) cardClass += ' current-hour';
            
            var nowBadge = isCurrent ? '<span class="badge-now">● Agora</span>' : '';

            col.innerHTML = `
                <div class="${cardClass}">
                    ${nowBadge}
                    <div class="hour-time ${isCurrent ? 'text-now' : ''}">${hourDisplay}</div>
                    <i class="bi ${hourlyIcon.icon} hour-icon" style="color:${hourlyIcon.color};"></i>
                    <div class="hour-temp">${Math.round(temp)}°</div>
                    <div class="hour-desc">${hourDesc}</div>
                    <div class="hour-rain"><i class="bi bi-droplet"></i> ${Math.round(rainChance)}%</div>
                    <div class="hour-wind"><i class="bi bi-wind"></i> ${Math.round(wind)} km/h</div>
                </div>
            `;
            container.appendChild(col);
        }

        setTimeout(function() {
            var currentCard = document.querySelector('.hourly-card.current-hour');
            if (currentCard) {
                currentCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            } else {
                var firstCard = container.querySelector('.col-auto:first-child .hourly-card');
                if (firstCard) {
                    firstCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
            }
        }, 300);
    }

    // ========================================
    // CÁLCULOS INTELIGENTES
    // ========================================

    function calculateHourlyTemperature(baseTemp, hour, isToday) {
        var hourAngle = ((hour - 14) / 12) * Math.PI;
        var variation = Math.cos(hourAngle) * 5;
        var dayFactor = (hour >= 6 && hour <= 20) ? 0 : -2;
        
        if (isToday) {
            var noise = (Math.random() - 0.5) * 1.5;
            return baseTemp + variation + dayFactor + noise;
        }
        return baseTemp + variation + dayFactor;
    }

    function calculateHourlyHumidity(baseHumidity, hour, isToday) {
        var nightFactor = (hour >= 20 || hour <= 6) ? 10 : 0;
        var dayReduction = (hour >= 10 && hour <= 16) ? -8 : 0;
        var noise = (Math.random() - 0.5) * 5;
        var result = baseHumidity + nightFactor + dayReduction + noise;
        return Math.max(20, Math.min(95, result));
    }

    function calculateHourlyWind(baseWind, hour, isToday) {
        var dayFactor = (hour >= 10 && hour <= 18) ? 3 : 0;
        var noise = (Math.random() - 0.5) * 2;
        var result = baseWind + dayFactor + noise;
        return Math.max(0, Math.round(result * 10) / 10);
    }

    function calculateRainChance(description, hour, isToday) {
        var baseChance = 0;
        var desc = description.toLowerCase();
        
        if (desc.includes('chuva') || desc.includes('rain')) {
            baseChance = 60 + Math.random() * 30;
        } else if (desc.includes('nublado') || desc.includes('cloudy')) {
            baseChance = 20 + Math.random() * 30;
        } else if (desc.includes('trovão') || desc.includes('thunder')) {
            baseChance = 70 + Math.random() * 25;
        } else if (desc.includes('neve') || desc.includes('snow')) {
            baseChance = 40 + Math.random() * 30;
        } else {
            baseChance = 5 + Math.random() * 15;
        }
        
        if (hour >= 14 && hour <= 18) {
            baseChance += 10;
        }
        if (hour >= 22 || hour <= 5) {
            baseChance -= 10;
        }
        return Math.max(0, Math.min(100, baseChance));
    }

    // ========================================
    // ÍCONE POR HORA
    // ========================================

    function getHourlyIcon(hour, defaultIcon, description) {
        var desc = (description || '').toLowerCase();
        
        if (desc.includes('chuva') || desc.includes('rain') || desc.includes('chuv')) {
            return { icon: 'bi-cloud-rain-fill', color: '#4a9eff' };
        }
        if (desc.includes('nublado') || desc.includes('cloudy') || desc.includes('overcast')) {
            return { icon: 'bi-cloud-fill', color: '#b0c4de' };
        }
        if (desc.includes('neve') || desc.includes('snow')) {
            return { icon: 'bi-snow-fill', color: '#93c5fd' };
        }
        if (desc.includes('trovão') || desc.includes('thunder') || desc.includes('storm')) {
            return { icon: 'bi-cloud-lightning-rain-fill', color: '#a78bfa' };
        }
        
        if (hour >= 6 && hour < 9) {
            return { icon: 'bi-sunrise-fill', color: '#f9b84a' };
        } else if (hour >= 9 && hour < 17) {
            return { icon: 'bi-sun-fill', color: '#ffd93d' };
        } else if (hour >= 17 && hour < 20) {
            return { icon: 'bi-sunset-fill', color: '#f9b84a' };
        } else {
            return { icon: 'bi-moon-fill', color: '#93c5fd' };
        }
    }

    // ========================================
    // DESCRIÇÃO POR HORA
    // ========================================

    function getHourDescription(hour, defaultDescription) {
        var desc = (defaultDescription || '').toLowerCase();
        
        if (desc.includes('chuva') || desc.includes('rain') || 
            desc.includes('nublado') || desc.includes('cloudy') ||
            desc.includes('neve') || desc.includes('snow') ||
            desc.includes('trovão') || desc.includes('thunder')) {
            return defaultDescription;
        }
        
        if (hour >= 6 && hour < 12) {
            return 'Manhã';
        } else if (hour >= 12 && hour < 18) {
            return 'Tarde';
        } else if (hour >= 18 && hour < 22) {
            return 'Final da tarde';
        } else {
            return 'Noite';
        }
    }

    // ========================================
    // ATUALIZAR TABELA
    // ========================================

    function updateTable(forecastData, selectedDate) {
        var tbody = document.getElementById('tableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        forecastData.forEach(function(day) {
            var date = new Date(day.date);
            var dayName = date.toLocaleDateString('pt-PT', { weekday: 'short' });
            var dayDate = date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
            
            var iconData = getWeatherIcon(day.icon, day.description);
            var isSelected = day.date === selectedDate;

            var tr = document.createElement('tr');
            if (isSelected) {
                tr.style.background = 'rgba(122, 208, 255, 0.05)';
                tr.style.borderLeft = '3px solid #7ad0ff';
            }

            tr.innerHTML = `
                <td><strong>${dayName}</strong><br><span style="font-size:0.7rem;color:rgba(255,255,255,0.3);">${dayDate}</span></td>
                <td><i class="bi ${iconData.icon}" style="color:${iconData.color};font-size:1.2rem;"></i> ${day.description || 'Céu limpo'}</td>
                <td class="temp-high">${Math.round(day.temperatureMax)}°C</td>
                <td class="temp-low">${Math.round(day.temperatureMin)}°C</td>
                <td>${day.humidity}%</td>
                <td>${Math.round(day.windSpeed)} km/h</td>
                <td>${day.pressure ? Math.round(day.pressure) + ' hPa' : '--'}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ========================================
    // INICIALIZAR GRÁFICOS
    // ========================================

    function initCharts(forecastData) {
        var labels = forecastData.map(function(d) {
            var date = new Date(d.date);
            return date.toLocaleDateString('pt-PT', { weekday: 'short' });
        });

        var maxTemps = forecastData.map(function(d) { return Math.round(d.temperatureMax); });
        var minTemps = forecastData.map(function(d) { return Math.round(d.temperatureMin); });
        var humidityData = forecastData.map(function(d) { return d.humidity; });
        var windData = forecastData.map(function(d) { return Math.round(d.windSpeed); });

        var tempCtx = document.getElementById('tempChart');
        if (tempCtx) {
            if (tempChartInstance) tempChartInstance.destroy();

            tempChartInstance = new Chart(tempCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Máxima',
                            data: maxTemps,
                            borderColor: '#f9b84a',
                            backgroundColor: 'rgba(249, 184, 74, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#f9b84a',
                            pointBorderColor: 'white',
                            pointBorderWidth: 2,
                            pointRadius: 5
                        },
                        {
                            label: 'Mínima',
                            data: minTemps,
                            borderColor: '#7ad0ff',
                            backgroundColor: 'rgba(122, 208, 255, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#7ad0ff',
                            pointBorderColor: 'white',
                            pointBorderWidth: 2,
                            pointRadius: 5
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
                                padding: 12
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } },
                            grid: { color: 'rgba(255,255,255,0.05)' }
                        },
                        x: {
                            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } },
                            grid: { color: 'rgba(255,255,255,0.05)' }
                        }
                    }
                }
            });
        }

        var humidityCtx = document.getElementById('humidityChart');
        if (humidityCtx) {
            if (humidityChartInstance) humidityChartInstance.destroy();

            humidityChartInstance = new Chart(humidityCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Humidade (%)',
                            data: humidityData,
                            backgroundColor: 'rgba(122, 208, 255, 0.5)',
                            borderColor: '#7ad0ff',
                            borderWidth: 1,
                            borderRadius: 4
                        },
                        {
                            label: 'Vento (km/h)',
                            data: windData,
                            backgroundColor: 'rgba(249, 184, 74, 0.4)',
                            borderColor: '#f9b84a',
                            borderWidth: 1,
                            borderRadius: 4
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
                                padding: 12
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } },
                            grid: { color: 'rgba(255,255,255,0.05)' }
                        },
                        x: {
                            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } },
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
        var content = document.getElementById('detalhesContent');

        if (loader) loader.style.display = show ? 'flex' : 'none';
        if (content) content.style.display = show ? 'none' : 'block';
    }

    function showError(title, message) {
        var container = document.getElementById('detalhesContent');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-exclamation-triangle-fill" style="font-size:4rem;color:#ff6b6b;"></i>
                    <h4 class="text-soft-white mt-3">${title}</h4>
                    <p class="text-soft-muted">${message}</p>
                    <a href="/Weather/Index" class="btn btn-primary mt-3" style="background:#7ad0ff;border:none;padding:0.6rem 2rem;border-radius:40px;">Voltar ao Início</a>
                </div>
            `;
        }

        var loader = document.getElementById('loadingIndicator');
        if (loader) loader.style.display = 'none';
    }

})();