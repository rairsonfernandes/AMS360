# 🌤️ AMS360 - Sistema de Monitoramento Climático

[![.NET](https://img.shields.io/badge/.NET-10.0-purple)](https://dotnet.microsoft.com/)
[![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-10.0-blue)](https://dotnet.microsoft.com/)
[![OpenWeather](https://img.shields.io/badge/OpenWeather-API-orange)](https://openweathermap.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Health Check](https://img.shields.io/badge/Health-Check%20OK-brightgreen)](http://localhost:5000/health)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue)](.github/workflows/deploy.yml)

## 📋 Sobre o Projeto

**AMS360** é um sistema de monitoramento climático desenvolvido em **ASP.NET Core 10.0** que consome dados da API do OpenWeather para exibir informações meteorológicas em tempo real.

### 🎯 Funcionalidades

- 🌡️ **Clima atual** em tempo real
- 📅 **Previsão para 7 dias**
- 🔍 **Busca por cidade** com autocomplete
- 🗺️ **Mapa interativo** com Leaflet
- 📊 **Gráficos** com Chart.js
- 📱 **Design responsivo** e moderno (Glassmorphism)
- 🔒 **Rate Limiting** para proteção
- ❤️ **Health Checks** para monitoramento
- 🐳 **Docker** para containerização
- 🔄 **CI/CD** com GitHub Actions


## 📸 Screenshots
### Dashboard Principal
![Dashboard](wwwroot/images/dashboard.png)

### Previsão 7 Dias
![Previsão](wwwroot/images/previsao.png)

### Detalhes do Dia
![Detalhes](wwwroot/images/detalhes.png)

### Mapa Interativo
![Mapa](wwwroot/images/mapa.png)

## 🎬 Demonstração

### Vídeo de Demonstração

[Assistir vídeo de demonstração](wwwroot/videos/demo.mp4)



## 🚀 Tecnologias Utilizadas

### Backend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| .NET | 10.0 | Framework principal |
| ASP.NET Core | 10.0 | Framework web |
| C# | 12 | Linguagem de programação |
| OpenWeather API | - | Dados meteorológicos |
| Rate Limiting | - | Proteção contra abuso |
| Health Checks | - | Monitoramento do sistema |

### Frontend

| Tecnologia | Descrição |
|------------|-----------|
| Razor Views | Renderização server-side |
| HTML5 | Estrutura das páginas |
| CSS3 | Estilização responsiva |
| JavaScript | Interatividade |
| Bootstrap 5 | Framework CSS |
| Chart.js | Gráficos interativos |
| Leaflet | Mapas interativos |
| Font Awesome | Ícones |

### DevOps

| Ferramenta | Descrição |
|------------|-----------|
| Docker | Containerização |
| GitHub Actions | CI/CD |
| Azure App Service | Hospedagem |


## 📦 Estrutura do Projeto

AMS360/
├── Controllers/ # Controladores MVC
│ └── WeatherController.cs # Lógica das requisições
├── Models/ # Modelos de dados
│ ├── WeatherResponse.cs # Resposta da API
│ ├── WeatherViewModel.cs # ViewModel para Views
│ └── ErrorViewModel.cs # Modelo de erro
├── Services/ # Serviços de negócio
│ ├── IWeatherService.cs # Interface do serviço
│ ├── WeatherService.cs # Consumo da API OpenWeather
│ └── WeatherHealthCheck.cs # Health Check
├── Views/ # Views Razor
│ └── Weather/
│ ├── Index.cshtml # Dashboard principal
│ ├── Detalhes.cshtml # Detalhes do dia
│ ├── PrevisaoCompleta.cshtml # Previsão 7 dias
│ └── Sobre.cshtml # Página sobre
├── wwwroot/ # Arquivos estáticos
│ ├── css/
│ │ ├── site.css # Estilos globais
│ │ ├── Detalhes.css # Estilos da página detalhes
│ │ └── PrevisaoCompleta.css # Estilos da previsão
│ └── js/
│ ├── site.js # JavaScript principal
│ ├── Detalhes.js # JS da página detalhes
│ └── PrevisaoCompleta.js # JS da previsão
├── .github/workflows/
│ └── deploy.yml # CI/CD com GitHub Actions
├── Program.cs # Ponto de entrada
├── appsettings.json # Configurações
├── Dockerfile # Containerização
├── docker-compose.yml # Orquestração de containers
├── README.md # Documentação
└── LICENSE.md # Licença


### Arquitetura MVC

O projeto segue o padrão **MVC (Model-View-Controller)**:
┌─────────────────────────────────────────────────────────────┐
│ Cliente (Browser) │
└─────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ WeatherController                                           │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ Index() │ Detalhes() │ PrevisaoCompleta()           │     │
│ └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ WeatherService                                              │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ GetCurrentWeatherAsync() GetWeatherForecastAsync    │     │
│ └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ OpenWeather API                                             │
└─────────────────────────────────────────────────────────────┘



## 🔧 Como Executar

### Pré-requisitos

- [.NET 10.0 SDK](https://dotnet.microsoft.com/download)
- [Visual Studio 2022](https://visualstudio.microsoft.com/) ou [VS Code](https://code.visualstudio.com/)
- Chave da API OpenWeather (gratuita)

### Passos para execução

1. **Clonar o repositório**

```bash
git clone https://github.com/rairsonfernandes/AMS360.git
cd AMS360
```

2.Restaurar pacotes

```bash
dotnet restore
Configurar API Key
`

# Opção 1: User Secrets (Recomendado)
dotnet user-secrets init
dotnet user-secrets set "WeatherApi:ApiKey" "SUA_CHAVE_AQUI"

# Opção 2: appsettings.json
# Edite o arquivo appsettings.json e adicione sua chave
Executar o sistema

dotnet run --urls="http://localhost:5000"
Acessar no navegador


http://localhost:5000
Com Docker

# Build da imagem
docker build -t ams360 .

# Executar o container
docker run -d -p 5000:8080 --name ams360 ams360

# Acessar
http://localhost:5000

🌐 API Endpoints

Endpoints Disponíveis
Endpoint	Método	Descrição
/Weather/Index	GET	Dashboard principal
/Weather/Index?city=Nome	GET	Clima de uma cidade específica
/Weather/PrevisaoCompleta	GET	Previsão para 7 dias
/Weather/Detalhes	GET	Detalhes do dia
/Weather/GetWeatherData	GET	API JSON com dados do clima
/Weather/Sobre	GET	Página sobre
/health	GET	Health Check
Exemplo de Resposta da API


{
  "success": true,
  "city": "Lisbon",
  "country": "PT",
  "temperature": 22.4,
  "temperatureMin": 21.2,
  "temperatureMax": 22.8,
  "feelsLike": 21.4,
  "humidity": 72,
  "windSpeed": 3.6,
  "windDirection": 307,
  "pressure": 1017,
  "description": "céu limpo",
  "icon": "01n",
  "lastUpdate": "2026-07-31 21:18:24",
  "forecast": [
    {
      "date": "2026-07-31",
      "dayName": "sexta",
      "temperature": 22.4,
      "temperatureMin": 21.8,
      "temperatureMax": 22.4,
      "description": "céu limpo",
      "icon": "01n",
      "humidity": 72,
      "windSpeed": 3.8,
      "pressure": 1017
    }
  ]
}

⚙️ Configuração

appsettings.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "WeatherApi": {
    "BaseUrl": "https://api.openweathermap.org/data/2.5",
    "ApiKey": "SUA_API_KEY_AQUI",
    "CacheDurationMinutes": 5
  },
  "AllowedHosts": "*"
}

Variáveis de Ambiente
Variável	Descrição
ASPNETCORE_ENVIRONMENT	Ambiente (Development/Production)
WeatherApi__ApiKey	Chave da API OpenWeather

🌍 Deploy

Azure App Service

bash
# Fazer login no Azure
az login

# Criar App Service
az webapp up --name ams360 --runtime "DOTNET:10" --sku F1
Railway
Acesse: https://railway.app

Conecte com GitHub

Selecione o repositório AMS360

Deploy automático!

Heroku

# Criar Procfile
echo "web: dotnet AMS360.dll" > Procfile

# Deploy
git push heroku main

🛠️ Melhorias Futuras

□ Testes unitários e de integração
□ Gráficos de temperatura mais detalhados
□ Mapa de radar com precipitação em tempo real
□ Alertas climáticos (notificações)
□ Histórico de clima
□ Suporte a múltiplos idiomas
□ Autenticação de usuários
□ Favoritos (salvar cidades)

🤝 Contribuições

Contribuições são bem-vindas! Consulte o arquivo CONTRIBUTING.md para mais detalhes.

Fork o projeto

Crie sua branch (git checkout -b feature/AmazingFeature)

Commit suas mudanças (git commit -m 'Add some AmazingFeature')

Push para a branch (git push origin feature/AmazingFeature)

Abra um Pull Request

📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

👨‍💻 Autor

Rairson Fernandes

GitHub: @rairsonfernandes

LinkedIn: Rairson Fernandes

Email: rairsonfernandes@gmail.com

🙏 Agradecimentos

OpenWeather pela API gratuita

Microsoft pelo .NET e ASP.NET Core

Bootstrap pelo framework CSS

⭐ Se você gostou deste projeto, deixe uma estrela no GitHub!