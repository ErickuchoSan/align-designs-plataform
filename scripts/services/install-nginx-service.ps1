# Script para instalar Nginx como servicio de Windows
# Requiere ejecutarse como Administrador

Write-Host "=== Instalando Nginx como Servicio de Windows ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "Haz clic derecho en PowerShell y selecciona 'Ejecutar como administrador'" -ForegroundColor Yellow
    pause
    exit 1
}

$nginxPath = "C:\nginx"
$nssm = "C:\ProgramData\chocolatey\bin\nssm.exe"

# Install NSSM if not present
if (-not (Test-Path $nssm)) {
    Write-Host "Instalando NSSM (Non-Sucking Service Manager)..." -ForegroundColor Yellow
    choco install nssm -y
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: No se pudo instalar NSSM" -ForegroundColor Red
        pause
        exit 1
    }
}

# Remove service if already exists
$existingService = Get-Service -Name "AlignDesignsNginx" -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "Removiendo servicio existente..." -ForegroundColor Yellow
    & $nssm stop AlignDesignsNginx
    & $nssm remove AlignDesignsNginx confirm
    Start-Sleep -Seconds 2
}

# Install Nginx as service
Write-Host "Instalando Nginx como servicio..." -ForegroundColor Yellow
& $nssm install AlignDesignsNginx "$nginxPath\nginx.exe"
& $nssm set AlignDesignsNginx AppDirectory $nginxPath
& $nssm set AlignDesignsNginx DisplayName "Align Designs Nginx"
& $nssm set AlignDesignsNginx Description "Nginx web server for Align Designs Platform"
& $nssm set AlignDesignsNginx Start SERVICE_AUTO_START
& $nssm set AlignDesignsNginx AppStopMethodSkip 0
& $nssm set AlignDesignsNginx AppStopMethodConsole 1500
& $nssm set AlignDesignsNginx AppExit Default Restart

Write-Host "Iniciando servicio..." -ForegroundColor Yellow
& $nssm start AlignDesignsNginx

Start-Sleep -Seconds 2

# Check service status
$service = Get-Service -Name "AlignDesignsNginx" -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq 'Running') {
    Write-Host ""
    Write-Host "OK: Nginx instalado como servicio exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "El servicio se iniciara automaticamente al arrancar Windows" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Comandos utiles:" -ForegroundColor Yellow
    Write-Host "  Ver estado: Get-Service AlignDesignsNginx" -ForegroundColor Gray
    Write-Host "  Detener:    Stop-Service AlignDesignsNginx" -ForegroundColor Gray
    Write-Host "  Iniciar:    Start-Service AlignDesignsNginx" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "ERROR: No se pudo iniciar el servicio" -ForegroundColor Red
}

Write-Host ""
pause
