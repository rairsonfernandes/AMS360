# criar-favicons.ps1 - Versão Corrigida com caminho correto
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CRIANDO FAVICONS DO AMS360" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Criar pasta
New-Item -ItemType Directory -Path wwwroot\images\logo -Force | Out-Null

# 1. favicon.svg
@'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7ad0ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2b7fc4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="url(#grad)" stroke="#7ad0ff" stroke-width="2"/>
  <text x="50" y="58" font-family="Arial" font-size="45" font-weight="bold" fill="white" text-anchor="middle">🌀</text>
</svg>
'@ | Out-File -FilePath wwwroot\images\logo\favicon.svg -Encoding UTF8

# 2. site.webmanifest
@'
{
  "name": "AMS360 - Advanced Meteorological Systems",
  "short_name": "AMS360",
  "description": "Sistema de monitoramento climatico em tempo real",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0b1a2f",
  "theme_color": "#0b1a2f",
  "icons": [
    {"src": "/images/logo/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "/images/logo/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png"}
  ]
}
'@ | Out-File -FilePath wwwroot\images\logo\site.webmanifest -Encoding UTF8

# 3. browserconfig.xml (Windows)
@'
<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/images/logo/mstile-150x150.png"/>
      <TileColor>#0b1a2f</TileColor>
    </tile>
  </msapplication>
</browserconfig>
'@ | Out-File -FilePath wwwroot\images\logo\browserconfig.xml -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ARQUIVOS CRIADOS COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Arquivos criados:" -ForegroundColor Cyan
Write-Host "  - wwwroot/images/logo/favicon.svg" -ForegroundColor White
Write-Host "  - wwwroot/images/logo/site.webmanifest" -ForegroundColor White
Write-Host "  - wwwroot/images/logo/browserconfig.xml" -ForegroundColor White
Write-Host ""
Write-Host "Para completar, gere os arquivos PNG usando:" -ForegroundColor Yellow
Write-Host "  https://favicon.io/favicon-converter/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ou crie manualmente:" -ForegroundColor Yellow
Write-Host "  - favicon-16x16.png" -ForegroundColor White
Write-Host "  - favicon-32x32.png" -ForegroundColor White
Write-Host "  - apple-touch-icon.png (180x180)" -ForegroundColor White
Write-Host "  - android-chrome-192x192.png" -ForegroundColor White
Write-Host "  - android-chrome-512x512.png" -ForegroundColor White
Write-Host "  - mstile-150x150.png" -ForegroundColor White
Write-Host ""
Write-Host "Depois de gerar os PNGs, atualize o _Layout.cshtml com:" -ForegroundColor Yellow
Write-Host '  <link rel="icon" type="image/svg+xml" href="~/images/logo/favicon.svg">' -ForegroundColor Cyan
Write-Host '  <link rel="icon" type="image/png" sizes="32x32" href="~/images/logo/favicon-32x32.png">' -ForegroundColor Cyan
Write-Host '  <link rel="icon" type="image/png" sizes="16x16" href="~/images/logo/favicon-16x16.png">' -ForegroundColor Cyan
Write-Host '  <link rel="apple-touch-icon" sizes="180x180" href="~/images/logo/apple-touch-icon.png">' -ForegroundColor Cyan
Write-Host '  <link rel="manifest" href="~/images/logo/site.webmanifest">' -ForegroundColor Cyan