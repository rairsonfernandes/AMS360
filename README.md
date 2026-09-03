## 🌤️ AMS360 — Advanced Meteorological System 360

<div align="center">"AMS360 Banner" (wwwroot/images/banner.png)

Sistema moderno de monitoramento climático desenvolvido com ASP.NET Core e OpenWeather API.

"".NET" (https://img.shields.io/badge/.NET-10-purple?style=for-the-badge&logo=dotnet)" (https://dotnet.microsoft.com/)
""ASP.NET Core" (https://img.shields.io/badge/ASP.NET_Core-10-blue?style=for-the-badge)" (https://dotnet.microsoft.com/)
""OpenWeather" (https://img.shields.io/badge/OpenWeather-API-orange?style=for-the-badge)" (https://openweathermap.org/)
""Docker" (https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker)" (https://www.docker.com/)
""GitHub Actions" (https://img.shields.io/badge/CI/CD-GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions)" (https://github.com/)
""License" (https://img.shields.io/badge/License-MIT-success?style=for-the-badge)" (LICENSE)

</div>---

## 📖 Visão Geral

O AMS360 (Advanced Meteorological System 360) é uma aplicação web desenvolvida em ASP.NET Core 10, responsável por fornecer informações meteorológicas em tempo real e previsões climáticas através da integração com a API do OpenWeather.

O projeto foi construído seguindo princípios de Clean Architecture, boas práticas de desenvolvimento, observabilidade, segurança e automação de deploy, servindo como referência para aplicações modernas baseadas em .NET.

---

## ✨ Principais Funcionalidades

## 🌦️ Monitoramento Climático

- Consulta de clima em tempo real
- Previsão meteorológica para até 7 dias
- Busca dinâmica por cidades
- Indicadores de temperatura, umidade, vento e pressão atmosférica
- Atualização automática dos dados

## 📊 Visualização de Dados

- Dashboard interativo
- Gráficos dinâmicos utilizando Chart.js
- Mapa interativo com Leaflet
- Interface moderna baseada em Glassmorphism
- Layout totalmente responsivo

## 🛡️ Confiabilidade

- Health Checks
- Rate Limiting
- Tratamento global de exceções
- Cache de consultas externas
- Logs estruturados

## 🚀 DevOps

- Docker
- GitHub Actions
- Deploy automatizado
- Azure App Service Ready

---

📸 Screenshots

Dashboard Principal

"Dashboard" (wwwroot/images/dashboard.png)

Previsão de 7 Dias

"Forecast" (wwwroot/images/previsao.png)

Detalhes Meteorológicos

"Details" (wwwroot/images/detalhes.png)

Mapa Interativo

"Map" (wwwroot/images/mapa.png)

---

🎥 Demonstração

Vídeo

"▶ Assistir demonstração" (wwwroot/videos/demo.mp4)

---

🏛️ Arquitetura

O projeto segue o padrão arquitetural MVC (Model-View-Controller) com uma camada de serviços responsável pela integração com APIs externas.

flowchart TD

A[Browser] --> B[WeatherController]

B --> C[WeatherService]

C --> D[OpenWeather API]

D --> C

C --> E[Models / ViewModels]

E --> F[Razor Views]

F --> A

Responsabilidades

Camada| Responsabilidade
Controllers| Receber requisições HTTP
Services| Regras de negócio e integração
Models| Estruturas de dados
ViewModels| Preparação dos dados para exibição
Views| Interface do usuário
Infrastructure| Comunicação externa e monitoramento

---

🧱 Estrutura do Projeto

AMS360
│
├── Controllers
├── Models
├── Services
├── Views
├── wwwroot
├── .github/workflows
├── Program.cs
├── appsettings.json
├── Dockerfile
├── docker-compose.yml
└── README.md

---

🚀 Tecnologias Utilizadas

Backend

Tecnologia| Versão
.NET| 10
ASP.NET Core| 10
C#| 12
OpenWeather API| Latest
Rate Limiting| Native
Health Checks| Native

Frontend

Tecnologia
Razor Pages
HTML5
CSS3
JavaScript
Bootstrap 5
Chart.js
Leaflet
Font Awesome

DevOps

Ferramenta
Docker
GitHub Actions
Azure App Service

---

⚡ Executando Localmente

Pré-requisitos

- .NET SDK 10
- Docker (Opcional)
- Chave da API OpenWeather

Clone o projeto

git clone https://github.com/rairsonfernandes/AMS360.git

cd AMS360

Restaurar dependências

dotnet restore

Configurar User Secrets

dotnet user-secrets init

dotnet user-secrets set "WeatherApi:ApiKey" "SUA_API_KEY"

Executar aplicação

dotnet run

Acesse:

http://localhost:5000

---

🐳 Executando com Docker

Build

docker build -t ams360 .

Run

docker run -d -p 5000:8080 --name ams360 ams360

Acesso

http://localhost:5000

---

🌐 Endpoints

Endpoint| Método| Descrição
/Weather/Index| GET| Dashboard principal
/Weather/PrevisaoCompleta| GET| Previsão para 7 dias
/Weather/Detalhes| GET| Detalhes meteorológicos
/Weather/GetWeatherData| GET| API JSON
/Weather/Sobre| GET| Sobre o projeto
/health| GET| Health Check

---

⚙️ Configuração

Variáveis de Ambiente

Variável| Descrição
ASPNETCORE_ENVIRONMENT| Ambiente da aplicação
WeatherApi__ApiKey| Chave OpenWeather

---

☁️ Deploy

Azure App Service

az login

az webapp up \
  --name ams360 \
  --runtime "DOTNET:10"

Railway

- Conecte o repositório GitHub
- Configure as variáveis de ambiente
- Deploy automático

Docker

Compatível com:

- Azure Container Apps
- Railway
- Render
- DigitalOcean
- AWS ECS
- Google Cloud Run

---

🔮 Roadmap

- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Radar meteorológico
- [ ] Alertas climáticos
- [ ] Histórico meteorológico
- [ ] Internacionalização (i18n)
- [ ] Autenticação JWT
- [ ] Sistema de favoritos
- [ ] Cache distribuído

---

🤝 Contribuindo

Contribuições são bem-vindas.

1. Fork do projeto
2. Crie uma branch

git checkout -b feature/nova-feature

3. Commit

git commit -m "feat: nova funcionalidade"

4. Push

git push origin feature/nova-feature

5. Abra um Pull Request

---

📄 Licença

Distribuído sob a licença MIT.

Consulte o arquivo "LICENSE" para mais informações.

---

👨‍💻 Autor

Rairson Fernandes

- GitHub: @rairsonfernandes
- LinkedIn: Rairson Fernandes
- Email: rairsonfernandes@gmail.com

---

🙏 Agradecimentos

- OpenWeather
- Microsoft .NET Team
- Bootstrap Team
- Chart.js
- Leaflet

---

<div align="center">⭐ Se este projeto foi útil para você, considere deixar uma estrela no repositório.

AMS360 — Weather Monitoring Platform

</div>
