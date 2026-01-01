# Test script para verificar ngrok
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Test de Ngrok - Align Designs Platform" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar ngrok instalado
Write-Host "[1/5] Verificando ngrok..." -ForegroundColor Yellow
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue
if ($ngrokPath) {
    Write-Host "OK: Ngrok encontrado en $($ngrokPath.Source)" -ForegroundColor Green
} else {
    Write-Host "ERROR: Ngrok no instalado" -ForegroundColor Red
    exit 1
}

# 2. Verificar servicios
Write-Host ""
Write-Host "[2/5] Verificando servicios..." -ForegroundColor Yellow
$nginx = Get-Service -Name 'AlignDesignsNginx' -ErrorAction SilentlyContinue
$monorepo = Get-Service -Name 'AlignDesignsMonorepo' -ErrorAction SilentlyContinue

if ($nginx -and $nginx.Status -eq 'Running') {
    Write-Host "OK: Nginx corriendo" -ForegroundColor Green
} else {
    Write-Host "WARN: Nginx no corriendo" -ForegroundColor Yellow
}

if ($monorepo -and $monorepo.Status -eq 'Running') {
    Write-Host "OK: Monorepo corriendo" -ForegroundColor Green
} else {
    Write-Host "WARN: Monorepo no corriendo" -ForegroundColor Yellow
}

# 3. Crear config de ngrok
Write-Host ""
Write-Host "[3/5] Creando configuracion de ngrok..." -ForegroundColor Yellow
$tempPath = [System.IO.Path]::GetTempPath() + 'ngrok-align.yml'
$config = @'
version: "2"
web_addr: 127.0.0.1:4040
tunnels:
  align-designs:
    proto: http
    addr: 80
    host_header: "aligndesigns-platform.local"
'@
Set-Content -Path $tempPath -Value $config
Write-Host "OK: Config creado en $tempPath" -ForegroundColor Green

# 4. Iniciar ngrok
Write-Host ""
Write-Host "[4/5] Iniciando tunnel de ngrok..." -ForegroundColor Yellow
Write-Host "NOTA: Abriendo ventana de ngrok..." -ForegroundColor Cyan
Start-Process -FilePath "ngrok" -ArgumentList "start", "align-designs", "--config=$tempPath" -WindowStyle Normal

# 5. Esperar y obtener URL
Write-Host ""
Write-Host "[5/5] Esperando a que ngrok inicie (5 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $response = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -ErrorAction Stop
    $url = $response.tunnels[0].public_url

    if ($url) {
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host "  TUNNEL ACTIVO" -ForegroundColor Green
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "URL Publica:" -ForegroundColor Cyan
        Write-Host "  $url" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Dashboard de Ngrok:" -ForegroundColor Cyan
        Write-Host "  http://127.0.0.1:4040" -ForegroundColor Gray
        Write-Host ""
        Write-Host "IMPORTANTE:" -ForegroundColor Yellow
        Write-Host "  - La ventana de ngrok debe permanecer abierta" -ForegroundColor White
        Write-Host "  - Comparte la URL con el admin" -ForegroundColor White
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host ""

        # Copiar al portapapeles
        Set-Clipboard -Value $url
        Write-Host "URL copiada al portapapeles!" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "ERROR: No se pudo obtener la URL" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Ngrok no esta respondiendo" -ForegroundColor Red
    Write-Host "Verifica que la ventana de ngrok este abierta" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Para detener el tunnel:" -ForegroundColor Cyan
Write-Host "  - Ejecuta: .\scripts\utils\stop-ngrok.bat" -ForegroundColor White
Write-Host "  - O cierra la ventana de ngrok" -ForegroundColor White
Write-Host ""
