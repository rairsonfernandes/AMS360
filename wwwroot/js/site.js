/* ========================================
   AMS360 - JavaScript Principal 
   ======================================== */

(function() {
    'use strict';

    // ========================================
    // VARIÁVEIS GLOBAIS
    // ========================================

    const API_BASE = window.location.origin;
    let mapInstance = null;
    let currentCity = 'Lisbon';
    let weatherDataCache = {};
    let currentMarker = null;
    let allCities = [];
    let cityData = {};
    let cityIndex = {};

    // ========================================
    // MAPEAMENTO COMPLETO DE ÍCONES
    // ========================================

    const WEATHER_ICONS = {
        '01d': { icon: 'bi-sun-fill', color: '#ffd93d', label: 'céu limpo' },
        '01n': { icon: 'bi-moon-fill', color: '#c8d6e5', label: 'céu limpo' },
        '02d': { icon: 'bi-cloud-sun-fill', color: '#ffd93d', label: 'algumas nuvens' },
        '02n': { icon: 'bi-cloud-moon-fill', color: '#c8d6e5', label: 'algumas nuvens' },
        '03d': { icon: 'bi-cloud-fill', color: '#b0c4de', label: 'nublado' },
        '03n': { icon: 'bi-cloud-fill', color: '#b0c4de', label: 'nublado' },
        '04d': { icon: 'bi-clouds-fill', color: '#8fa8b8', label: 'muito nublado' },
        '04n': { icon: 'bi-clouds-fill', color: '#8fa8b8', label: 'muito nublado' },
        '09d': { icon: 'bi-cloud-drizzle-fill', color: '#4a9eff', label: 'chuva leve' },
        '09n': { icon: 'bi-cloud-drizzle-fill', color: '#4a9eff', label: 'chuva leve' },
        '10d': { icon: 'bi-cloud-rain-fill', color: '#4a9eff', label: 'chuva' },
        '10n': { icon: 'bi-cloud-rain-fill', color: '#4a9eff', label: 'chuva' },
        '11d': { icon: 'bi-cloud-lightning-rain-fill', color: '#ffd93d', label: 'trovoada' },
        '11n': { icon: 'bi-cloud-lightning-rain-fill', color: '#ffd93d', label: 'trovoada' },
        '13d': { icon: 'bi-snow-fill', color: '#e0f0ff', label: 'neve' },
        '13n': { icon: 'bi-snow-fill', color: '#e0f0ff', label: 'neve' },
        '50d': { icon: 'bi-cloud-fog-fill', color: '#b0c4de', label: 'neblina' },
        '50n': { icon: 'bi-cloud-fog-fill', color: '#b0c4de', label: 'neblina' }
    };

    // ========================================
    // MAPEAMENTO POR DESCRIÇÃO (FALLBACK AVANÇADO)
    // ========================================

    function getIconByDescription(description) {
        if (!description) return { icon: 'bi-sun-fill', color: '#ffd93d', label: 'desconhecido' };
        
        var desc = description.toLowerCase().trim();
        
        var map = [
            { keywords: ['chuva torrencial', 'chuva intensa', 'heavy rain', 'downpour'], icon: 'bi-cloud-rain-heavy-fill', color: '#1a73e8' },
            { keywords: ['chuva', 'rain', 'chuv', 'shower', 'precipitação'], icon: 'bi-cloud-rain-fill', color: '#4a9eff' },
            { keywords: ['garoa', 'drizzle', 'chuvisco'], icon: 'bi-cloud-drizzle-fill', color: '#6fc3df' },
            { keywords: ['trovoada', 'trovão', 'thunder', 'storm', 'tempestade', 'relâmpago'], icon: 'bi-cloud-lightning-rain-fill', color: '#ffd93d' },
            { keywords: ['neve', 'snow', 'floco', 'gelo'], icon: 'bi-snow-fill', color: '#e0f0ff' },
            { keywords: ['muito nublado', 'overcast', 'encoberto', 'nublado pesado'], icon: 'bi-clouds-fill', color: '#8fa8b8' },
            { keywords: ['nublado', 'cloudy', 'nuvens'], icon: 'bi-cloud-fill', color: '#b0c4de' },
            { keywords: ['algumas nuvens', 'parcialmente', 'partly cloudy', 'nuvens dispersas'], icon: 'bi-cloud-sun-fill', color: '#ffd93d' },
            { keywords: ['céu limpo', 'clear sky', 'ensolarado', 'sol', 'sunny', 'limpo'], icon: 'bi-sun-fill', color: '#ffd93d' },
            { keywords: ['neblina', 'fog', 'mist', 'névoa', 'bruma'], icon: 'bi-cloud-fog-fill', color: '#b0c4de' },
            { keywords: ['noite', 'night', 'lua'], icon: 'bi-moon-fill', color: '#c8d6e5' }
        ];

        for (var i = 0; i < map.length; i++) {
            var group = map[i];
            for (var j = 0; j < group.keywords.length; j++) {
                if (desc.includes(group.keywords[j])) {
                    return { icon: group.icon, color: group.color, label: group.keywords[0] };
                }
            }
        }

        return { icon: 'bi-sun-fill', color: '#ffd93d', label: 'padrão' };
    }

    // ========================================
    // FUNÇÃO PARA OBTER ÍCONE (PRIORIDADE)
    // ========================================

    function getWeatherIcon(iconCode, description) {
        if (iconCode && WEATHER_ICONS[iconCode]) {
            return WEATHER_ICONS[iconCode];
        }
        if (description) {
            return getIconByDescription(description);
        }
        return { icon: 'bi-sun-fill', color: '#ffd93d', label: 'padrão' };
    }

    // ========================================
    // FUNÇÃO PARA SALVAR CIDADE NO LOCALSTORAGE
    // ========================================

    function saveCityToStorage(city) {
        try {
            localStorage.setItem('ams360_current_city', city);
        } catch (e) {}
    }

    // ========================================
    // FUNÇÃO PARA CARREGAR CIDADE DO LOCALSTORAGE
    // ========================================

    function loadCityFromStorage() {
        try {
            var city = localStorage.getItem('ams360_current_city');
            if (city) return city;
        } catch (e) {}
        return null;
    }

    // ========================================
    // FUNÇÃO QUE RETORNA O NOME DO DIA RELATIVO
    // ========================================

    function getRelativeDayName(dateStr) {
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        
        var date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        
        var diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Hoje';
        } else if (diffDays === 1) {
            return 'Amanhã';
        } else if (diffDays === 2) {
            return 'Depois';
        } else {
            var dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            return dayNames[date.getDay()];
        }
    }

    // ========================================
    // FUNÇÃO PARA REMOVER ACENTOS (NORMALIZAR)
    // ========================================

    function removeAccents(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    // ========================================
    // FUNÇÃO PARA CRIAR CHAVE ÚNICA DA CIDADE
    // ========================================

    function createCityKey(name, country) {
        return (country || '') + ':' + (name || '').toLowerCase().trim();
    }

    // ========================================
    // FUNÇÃO PARA CARREGAR CIDADES DO JSON
    // ========================================

    async function loadCitiesFromFile() {
        try {
            var cached = localStorage.getItem('ams360_cities_cache');
            var cacheTime = localStorage.getItem('ams360_cities_cache_time');
            
            if (cached && cacheTime && (Date.now() - parseInt(cacheTime) < 86400000)) {
                var parsed = JSON.parse(cached);
                allCities = parsed.names || [];
                cityData = parsed.data || {};
                cityIndex = parsed.index || {};
                return;
            }

            var response = await fetch(API_BASE + '/data/cities.json');
            if (!response.ok) {
                throw new Error('Erro ao carregar cidades');
            }
            
            var data = await response.json();
            var cities = data.cities || [];
            
            allCities = [];
            cityData = {};
            cityIndex = {};
            
            cities.forEach(function(c) {
                var name = c.name || '';
                var country = c.country || '';
                var key = createCityKey(name, country);
                
                cityData[key] = {
                    lat: c.lat,
                    lng: c.lng,
                    name: name,
                    country: country,
                    normalized: removeAccents(name).toLowerCase()
                };
                
                var normalized = removeAccents(name).toLowerCase();
                if (!cityIndex[normalized]) {
                    cityIndex[normalized] = [];
                }
                cityIndex[normalized].push(key);
                
                if (name && !allCities.includes(name)) {
                    allCities.push(name);
                }
            });
            
            allCities.sort();
            
            localStorage.setItem('ams360_cities_cache', JSON.stringify({
                names: allCities,
                data: cityData,
                index: cityIndex
            }));
            localStorage.setItem('ams360_cities_cache_time', Date.now().toString());
            
        } catch (error) {
            console.warn('Erro ao carregar cidades, usando lista padrão:', error);
            allCities = getDefaultCities();
            cityData = {};
            cityIndex = {};
            allCities.forEach(function(city) {
                var key = createCityKey(city, 'PT');
                cityData[key] = { lat: 38.7223, lng: -9.1393, name: city, country: 'PT' };
            });
        }
    }

    // ========================================
    // LISTA DE CIDADES PADRÃO (FALLBACK)
    // ========================================

    function getDefaultCities() {
        return [
            'Lisbon', 'Porto', 'Braga', 'Coimbra', 'Faro',
            'Madrid', 'Barcelona', 'Paris', 'London', 'Berlin',
            'Rome', 'New York', 'Los Angeles', 'Chicago', 'Toronto',
            'Sao Paulo', 'Rio de Janeiro', 'Brasilia', 'Belo Horizonte',
            'Tokyo', 'Beijing', 'Shanghai', 'Mumbai', 'Delhi',
            'Sydney', 'Melbourne', 'Cape Town', 'Johannesburg',
            'Cairo', 'Casablanca', 'Dubai', 'Istanbul', 'Moscow'
        ];
    }

    // ========================================
    // FUNÇÃO DE PESQUISA INTELIGENTE
    // ========================================

    function searchCities(query) {
        query = query.trim();
        if (!query) return [];

        var results = [];
        var normalizedQuery = removeAccents(query).toLowerCase();
        var lowerQuery = query.toLowerCase();
        
        var exactMatches = allCities.filter(function(c) {
            return c.toLowerCase() === lowerQuery || 
                   removeAccents(c).toLowerCase() === normalizedQuery;
        });
        
        var startsWith = allCities.filter(function(c) {
            return (c.toLowerCase().startsWith(lowerQuery) || 
                   removeAccents(c).toLowerCase().startsWith(normalizedQuery)) && 
                   !exactMatches.includes(c);
        });
        
        var contains = allCities.filter(function(c) {
            return (c.toLowerCase().includes(lowerQuery) || 
                   removeAccents(c).toLowerCase().includes(normalizedQuery)) && 
                   !exactMatches.includes(c) && 
                   !startsWith.includes(c);
        });
        
        var countryMatch = [];
        if (query.length === 2 && query === query.toUpperCase()) {
            countryMatch = allCities.filter(function(c) {
                var key = createCityKey(c, query);
                return cityData[key];
            }).slice(0, 5);
        }

        results = exactMatches.concat(startsWith).concat(contains).concat(countryMatch);
        
        var uniqueResults = results.filter(function(item, index) {
            return results.indexOf(item) === index;
        });
        
        return uniqueResults.slice(0, 15);
    }

    // ========================================
    // FUNÇÃO PARA OBTER COORDENADAS DA CIDADE
    // ========================================

    function getCityCoordinates(city, country) {
        if (!city) {
            return null;
        }

        var cityName = city.trim();
        var normalizedCity = removeAccents(cityName).toLowerCase();
        
        if (country) {
            var exactKey = createCityKey(cityName, country);
            if (cityData[exactKey]) {
                var data = cityData[exactKey];
                return {
                    lat: data.lat,
                    lng: data.lng,
                    name: data.name || cityName,
                    country: data.country || country
                };
            }
        }
        
        if (cityIndex[normalizedCity] && cityIndex[normalizedCity].length > 0) {
            var key = cityIndex[normalizedCity][0];
            if (cityData[key]) {
                var data2 = cityData[key];
                return {
                    lat: data2.lat,
                    lng: data2.lng,
                    name: data2.name || cityName,
                    country: data2.country || ''
                };
            }
        }
        
        if (allCities && allCities.length > 0) {
            var partialMatches = allCities.filter(function(c) {
                return removeAccents(c).toLowerCase().includes(normalizedCity) || 
                       normalizedCity.includes(removeAccents(c).toLowerCase());
            });
            
            if (partialMatches.length > 0) {
                var bestMatch = partialMatches[0];
                var keys = Object.keys(cityData);
                var matchKey = keys.find(function(k) {
                    return k.includes(bestMatch.toLowerCase()) || 
                           cityData[k].name === bestMatch;
                });
                
                if (matchKey && cityData[matchKey]) {
                    var data3 = cityData[matchKey];
                    return {
                        lat: data3.lat,
                        lng: data3.lng,
                        name: data3.name || cityName,
                        country: data3.country || ''
                    };
                }
            }
        }
        
        return null;
    }

    // ========================================
    // FUNÇÃO PARA BUSCAR DADOS DA API
    // ========================================

    async function fetchWeatherData(city) {
        try {
            var cacheKey = city.toLowerCase().trim();
            if (weatherDataCache[cacheKey] && (Date.now() - weatherDataCache[cacheKey].timestamp < 300000)) {
                return weatherDataCache[cacheKey].data;
            }

            var response = await fetch(API_BASE + '/Weather/GetWeatherData?city=' + encodeURIComponent(city));
            if (!response.ok) {
                return null;
            }
            var data = await response.json();

            if (data && data.success) {
                weatherDataCache[cacheKey] = {
                    data: data,
                    timestamp: Date.now()
                };
                return data;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    // ========================================
    // ATUALIZAR DASHBOARD
    // ========================================

    function updateDashboard(data, cityName) {
        if (!data || !data.success) {
            showError('Cidade não encontrada', 'Não foi possível encontrar dados para "' + cityName + '". Verifique o nome e tente novamente.');
            return;
        }

        var tempElement = document.getElementById('currentTemp');
        if (tempElement) {
            tempElement.textContent = data.temperature ? data.temperature + '°C' : '--°C';
        }

        var descElement = document.getElementById('weatherDesc');
        if (descElement) {
            descElement.textContent = data.description || 'Carregando...';
        }

        var feelsElement = document.getElementById('feelsLike');
        if (feelsElement) {
            var feels = data.feelsLike || (data.temperature ? data.temperature - 1 : 0);
            feelsElement.textContent = 'Sensação ' + feels + '°C';
        }

        var humidityElement = document.getElementById('humidity');
        if (humidityElement) {
            humidityElement.textContent = data.humidity ? data.humidity + '%' : '--%';
        }

        var windElement = document.getElementById('windSpeed');
        if (windElement) {
            windElement.textContent = data.windSpeed ? data.windSpeed.toFixed(1) : '--';
        }

        var pressureElement = document.getElementById('pressure');
        if (pressureElement) {
            pressureElement.textContent = data.pressure ? data.pressure : '--';
        }

        var iconElement = document.getElementById('weatherIcon');
        if (iconElement) {
            var iconData = getWeatherIcon(data.icon || data.weatherIcon, data.description);
            iconElement.className = 'bi ' + iconData.icon + ' weather-icon-big';
            iconElement.style.color = iconData.color;
        }

        var cityBadge = document.getElementById('cityBadge');
        if (cityBadge && data.city) {
            cityBadge.innerHTML = '<i class="bi bi-geo-alt me-1"></i> ' + data.city + ', ' + (data.country || 'PT');
        }

        var mobileCity = document.getElementById('mobileCityName');
        if (mobileCity && data.city) {
            mobileCity.textContent = data.city + ', ' + (data.country || 'PT');
        }

        var mapCity = document.getElementById('mapCityName');
        if (mapCity && data.city) {
            mapCity.textContent = data.city;
        }

        var maxElement = document.getElementById('maxTempDisplay');
        if (maxElement && data.temperatureMax) {
            maxElement.textContent = data.temperatureMax + '°C';
        }

        var minElement = document.getElementById('minTempDisplay');
        if (minElement && data.temperatureMin) {
            minElement.textContent = data.temperatureMin + '°C';
        }

        var humidityDisplay = document.getElementById('humidityDisplay');
        if (humidityDisplay && data.humidity) {
            humidityDisplay.textContent = data.humidity + '%';
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

        if (data.forecast && data.forecast.length > 0) {
            renderFiveDayForecast(data.forecast);
            updateBarChart(data.forecast);
            updateTemperatureAnalysis(data.forecast);
        }

        if (data.city) {
            saveCityToStorage(data.city);
        }
    }

    // ========================================
    // FUNÇÃO PARA MOSTRAR ERRO
    // ========================================

    function showError(title, message) {
        var tempElement = document.getElementById('currentTemp');
        if (tempElement) {
            tempElement.textContent = '--°C';
        }

        var descElement = document.getElementById('weatherDesc');
        if (descElement) {
            descElement.textContent = '⚠️ ' + title;
        }

        var feelsElement = document.getElementById('feelsLike');
        if (feelsElement) {
            feelsElement.textContent = message;
        }

        var humidityElement = document.getElementById('humidity');
        if (humidityElement) {
            humidityElement.textContent = '--%';
        }

        var windElement = document.getElementById('windSpeed');
        if (windElement) {
            windElement.textContent = '--';
        }

        var pressureElement = document.getElementById('pressure');
        if (pressureElement) {
            pressureElement.textContent = '--';
        }

        var cityBadge = document.getElementById('cityBadge');
        if (cityBadge) {
            cityBadge.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-1" style="color:#ff6b6b;"></i> Cidade não encontrada';
        }

        var mobileCity = document.getElementById('mobileCityName');
        if (mobileCity) {
            mobileCity.textContent = 'Cidade não encontrada';
        }

        var mapCity = document.getElementById('mapCityName');
        if (mapCity) {
            mapCity.textContent = 'Não encontrada';
        }

        var forecastContainer = document.getElementById('fiveDayForecast');
        if (forecastContainer) {
            forecastContainer.innerHTML = '<div class="col-12 text-center text-soft-muted"> ' + message + '</div>';
        }

        var barChart = document.getElementById('barChart');
        if (barChart) {
            barChart.innerHTML = '';
        }

        alert('⚠️ ' + title + '\n\n' + message);
    }

    // ========================================
    // RENDERIZAR PREVISÃO 5 DIAS
    // ========================================

    function renderFiveDayForecast(forecastData) {
        var container = document.getElementById('fiveDayForecast');
        if (!container) return;

        container.innerHTML = '';

        if (!forecastData || forecastData.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-soft-muted">Carregando previsão...</div>';
            return;
        }

        var days = forecastData.slice(0, 5);
        var cityName = document.getElementById('cityBadge')?.textContent?.trim() || 'Lisbon';

        days.forEach(function(day) {
            var dayName = getRelativeDayName(day.date);
            var iconData = getWeatherIcon(day.icon || day.weatherIcon, day.description);

            var col = document.createElement('div');
            col.className = 'col';
            col.innerHTML = `
                <a href="/Weather/Detalhes?city=${encodeURIComponent(cityName)}&date=${day.date}" class="forecast-card-clickable">
                    <div class="day-name">${dayName}</div>
                    <i class="bi ${iconData.icon} day-icon" style="color:${iconData.color}; font-size:2rem;"></i>
                    <div class="day-temp-max">${Math.round(day.temperature)}° <span class="day-temp-min">${Math.round(day.temperatureMin)}°</span></div>
                    <div class="day-divider"></div>
                    <div class="day-desc">${day.description || 'Céu limpo'}</div>
                    <div class="click-hint"><i class="bi bi-arrow-right-circle"></i> Detalhes</div>
                </a>
            `;
            container.appendChild(col);
        });
    }

    // ========================================
    // ATUALIZAR GRÁFICO DE BARRAS
    // ========================================

    function updateBarChart(forecastData) {
        var chartContainer = document.getElementById('barChart');
        if (!chartContainer) return;

        var days = forecastData.slice(0, 5);
        var temps = days.map(function(d) { return d.temperature; });
        var maxTemp = Math.max.apply(null, temps);
        var minTemp = Math.min.apply(null, temps);
        var range = maxTemp - minTemp > 1 ? maxTemp - minTemp : 10;

        chartContainer.innerHTML = '';

        days.forEach(function(day) {
            var label = getRelativeDayName(day.date);
            var height = ((day.temperature - minTemp) / range) * 70 + 20;
            var iconData = getWeatherIcon(day.icon || day.weatherIcon, day.description);
            
            var temp = day.temperature;
            var barColor = '#7ad0ff';
            if (temp >= 25) barColor = '#ff6b6b';
            else if (temp >= 20) barColor = '#f9b84a';
            else if (temp >= 15) barColor = '#7ad0ff';
            else barColor = '#4a9eff';

            var item = document.createElement('div');
            item.className = 'bar-item';
            item.innerHTML = `
                <div class="bar" style="height:${height}px; background: ${barColor};"></div>
                <div class="bar-temp"><i class="bi ${iconData.icon}" style="font-size:0.7rem; margin-right:2px;"></i>${Math.round(day.temperature)}°</div>
                <div class="bar-label">${label}</div>
            `;
            chartContainer.appendChild(item);
        });
    }

    // ========================================
    // ATUALIZAR ANÁLISE DE TEMPERATURAS
    // ========================================

    function updateTemperatureAnalysis(forecastData) {
        if (!forecastData || forecastData.length === 0) return;

        var maxDay = forecastData.reduce(function(a, b) {
            return (a.temperatureMax || 0) > (b.temperatureMax || 0) ? a : b;
        });
        var minDay = forecastData.reduce(function(a, b) {
            return (a.temperatureMin || 0) < (b.temperatureMin || 0) ? a : b;
        });
        var avgTemp = forecastData.reduce(function(sum, d) {
            return sum + (d.temperature || 0);
        }, 0) / forecastData.length;

        var hottest = document.getElementById('hottestDay');
        if (hottest) hottest.textContent = Math.round(maxDay.temperatureMax || 0) + '°';

        var coldest = document.getElementById('coldestDay');
        if (coldest) coldest.textContent = Math.round(minDay.temperatureMin || 0) + '°';

        var avg = document.getElementById('avgTemp');
        if (avg) avg.textContent = avgTemp.toFixed(1) + '°C';
    }

    // ========================================
    // MAPA - INICIALIZAÇÃO DINÂMICA
    // ========================================

    async function initMap(cityName) {
        var container = document.getElementById('mapContainer');
        if (!container) return;

        var location = getCityCoordinates(cityName);
        if (!location) {
            showError('Cidade não encontrada', 'Não foi possível encontrar coordenadas para "' + cityName + '".');
            return;
        }

        var lat = location.lat;
        var lng = location.lng;

        if (mapInstance) {
            mapInstance.remove();
            mapInstance = null;
        }

        mapInstance = L.map('mapContainer', {
            zoomControl: true,
            fadeAnimation: true,
            zoomAnimation: true
        }).setView([lat, lng], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(mapInstance);

        var data = await fetchWeatherData(cityName);
        var temp = data?.temperature || 0;
        var description = data?.description || 'Céu limpo';
        var iconCode = data?.icon || '01d';
        var humidity = data?.humidity || 0;
        var windSpeed = data?.windSpeed || 0;

        var iconData = getWeatherIcon(iconCode, description);
        var humidityDisplay = humidity || '--';
        var windDisplay = windSpeed ? windSpeed.toFixed(1) : '--';
        var tempDisplay = temp || '--';

        var popupContent = `
            <div class="map-popup-container">
                <div class="map-popup-header">
                    <i class="bi ${iconData.icon} map-popup-icon" style="color:${iconData.color};"></i>
                    <div>
                        <div class="map-popup-city">${location.name}</div>
                        <div class="map-popup-temp">${tempDisplay}°C</div>
                    </div>
                </div>
                <div class="map-popup-desc">${description}</div>
                <div class="map-popup-details">
                    <span><i class="bi bi-droplet"></i> ${humidityDisplay}%</span>
                    <span><i class="bi bi-wind"></i> ${windDisplay} km/h</span>
                </div>
            </div>
        `;

        if (currentMarker) {
            mapInstance.removeLayer(currentMarker);
        }

        currentMarker = L.marker([lat, lng])
            .addTo(mapInstance)
            .bindPopup(popupContent)
            .openPopup();

        L.circle([lat, lng], {
            radius: 5000,
            color: '#7ad0ff',
            fillColor: '#7ad0ff',
            fillOpacity: 0.05,
            weight: 1,
            opacity: 0.3
        }).addTo(mapInstance);

        setTimeout(function() {
            if (mapInstance) mapInstance.invalidateSize();
        }, 300);

        var mapCityElement = document.getElementById('mapCityName');
        if (mapCityElement) {
            mapCityElement.textContent = location.name;
        }
    }

    window.initMap = initMap;

    // ========================================
    // FULLSCREEN MAPA
    // ========================================

    window.toggleMapFullscreen = function() {
        var container = document.getElementById('mapContainer');
        if (!container) return;

        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(function() {
                container.style.height = 'calc(100vh - 200px)';
                if (mapInstance) setTimeout(function() { mapInstance.invalidateSize(); }, 300);
            });
        } else {
            document.exitFullscreen();
            container.style.height = '400px';
            if (mapInstance) setTimeout(function() { mapInstance.invalidateSize(); }, 300);
        }
    };

    // ========================================
    // CARREGAR DADOS PARA O MAPA
    // ========================================

    async function loadWeatherDataForMap(city) {
        try {
            await initMap(city);
            return await fetchWeatherData(city);
        } catch (error) {
            return null;
        }
    }

    // ========================================
    // CARREGAR TODOS OS DADOS DO DASHBOARD
    // ========================================

    async function loadDashboardData(city) {
        try {
            var coord = getCityCoordinates(city);
            if (!coord) {
                showError('Cidade não encontrada', 'A cidade "' + city + '" não foi encontrada. Verifique o nome e tente novamente.');
                return null;
            }

            var data = await fetchWeatherData(city);
            
            if (data && data.success) {
                currentCity = data.city || city;
                updateDashboard(data, city);
                await initMap(city);
                return data;
            } else {
                showError('Erro ao carregar dados', 'Não foi possível obter dados meteorológicos para "' + city + '".');
                return null;
            }
        } catch (error) {
            showError('Erro', 'Ocorreu um erro ao carregar os dados. Tente novamente.');
            return null;
        }
    }

    // ========================================
    // MENU MOBILE
    // ========================================

    window.toggleMobileMenu = function() {
        var menu = document.getElementById('mobileMenu');
        var body = document.body;
        if (menu) {
            menu.classList.toggle('show');
            body.style.overflow = menu.classList.contains('show') ? 'hidden' : '';
        }
    };

    document.addEventListener('click', function(e) {
        var menu = document.getElementById('mobileMenu');
        var toggler = document.querySelector('.navbar-toggler-ams');
        if (menu && menu.classList.contains('show')) {
            if (!menu.contains(e.target) && !toggler?.contains(e.target)) {
                menu.classList.remove('show');
                document.body.style.overflow = '';
            }
        }
    });

    // ========================================
    // BUSCA DE CIDADES COM AUTOCOMPLETE INTELIGENTE
    // ========================================

    function updateAutocompleteSuggestions(query) {
        var datalist = document.getElementById('cidadesList');
        if (!datalist) return;

        datalist.innerHTML = '';

        if (!query || query.trim() === '') {
            var allCitiesSorted = allCities.slice(0, 50).sort();
            allCitiesSorted.forEach(function(city) {
                var option = document.createElement('option');
                option.value = city;
                datalist.appendChild(option);
            });
            return;
        }

        var results = searchCities(query);
        results.forEach(function(city) {
            var option = document.createElement('option');
            option.value = city;
            datalist.appendChild(option);
        });
    }

    function initSearch() {
        var searchInputDesktop = document.getElementById('searchInputDesktop');
        var searchInputMobile = document.getElementById('searchInputMobile');

        if (searchInputDesktop) {
            searchInputDesktop.addEventListener('input', function(e) {
                updateAutocompleteSuggestions(e.target.value);
            });

            searchInputDesktop.addEventListener('focus', function() {
                updateAutocompleteSuggestions('');
            });
        }

        if (searchInputMobile) {
            searchInputMobile.addEventListener('input', function(e) {
                updateAutocompleteSuggestions(e.target.value);
            });

            searchInputMobile.addEventListener('focus', function() {
                updateAutocompleteSuggestions('');
            });
        }
    }

    window.buscarCidade = function(termo, closeMenu) {
        termo = termo.trim();
        if (termo === '') {
            alert('Por favor, digite o nome de uma cidade.');
            return;
        }

        var url = '/Weather/Index?city=' + encodeURIComponent(termo);
        window.location.href = url;
    };

    window.buscarCidadeDesktop = function() {
        var input = document.getElementById('searchInputDesktop');
        if (input) buscarCidade(input.value, false);
    };

    window.buscarCidadeMobile = function() {
        var input = document.getElementById('searchInputMobile');
        if (input) buscarCidade(input.value, true);
    };

    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            var target = e.target;
            if (target && target.id === 'searchInputDesktop') {
                buscarCidadeDesktop();
            } else if (target && target.id === 'searchInputMobile') {
                buscarCidadeMobile();
            }
        }
    });

    // ========================================
    // DATALIST DE CIDADES (Autocomplete)
    // ========================================

    function popularAutocomplete() {
        var datalist = document.getElementById('cidadesList');
        if (!datalist) return;

        var sortedCities = allCities.slice(0, 50).sort();
        sortedCities.forEach(function(city) {
            var option = document.createElement('option');
            option.value = city;
            datalist.appendChild(option);
        });
    }

    // ========================================
    // INICIALIZAÇÃO
    // ========================================

    document.addEventListener('DOMContentLoaded', async function() {
        await loadCitiesFromFile();
        
        popularAutocomplete();
        initSearch();

        var urlParams = new URLSearchParams(window.location.search);
        var cityFromUrl = urlParams.get('city');

        var cityBadge = document.getElementById('cityBadge');
        var cityName = cityFromUrl || 'Lisbon';

        if (cityFromUrl) {
            cityName = cityFromUrl;
        } else {
            var savedCity = loadCityFromStorage();
            if (savedCity) {
                cityName = savedCity;
            }
        }

        if (cityBadge) {
            var text = cityBadge.textContent || '';
            var match = text.match(/[A-Za-zÀ-ú\s]+/);
            if (match && !cityFromUrl) {
                cityName = match[0].trim() || 'Lisbon';
            }
        }

        currentCity = cityName;
        loadDashboardData(cityName);

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
    });

})();