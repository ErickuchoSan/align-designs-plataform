# Script para instalar el Monorepo como servicio de Windows
# Requiere ejecutarse como Administrador

Write-Host "=== Instalando Align Designs Monorepo como Servicio de Windows ===" -ForegroundColor Cyan
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

$monorepoPath = "d:\Desarrollos\Align Designs\align-designs-plataform"
$nssm = "C:\ProgramData\chocolatey\bin\nssm.exe"

# Find pnpm using 'where' command
Write-Host "Verificando pnpm..." -ForegroundColor Yellow
$pnpmLocations = @(where.exe pnpm 2>$null)

# Filter for .cmd files
$pnpmCmd = $pnpmLocations | Where-Object { $_ -like "*.cmd" } | Select-Object -First 1

if (-not $pnpmCmd) {
    Write-Host "ERROR: pnpm no encontrado en el sistema" -ForegroundColor Red
    Write-Host "Instalando pnpm globalmente..." -ForegroundColor Yellow
    npm install -g pnpm

    # Search again
    $pnpmLocations = @(where.exe pnpm 2>$null)
    $pnpmCmd = $pnpmLocations | Where-Object { $_ -like "*.cmd" } | Select-Object -First 1

    if (-not $pnpmCmd) {
        Write-Host "ERROR: No se pudo instalar pnpm" -ForegroundColor Red
        pause
        exit 1
    }
    Write-Host "OK: pnpm instalado exitosamente en $pnpmCmd" -ForegroundColor Green
} else {
    Write-Host "OK: pnpm encontrado en $pnpmCmd" -ForegroundColor Green
}

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
$existingService = Get-Service -Name "AlignDesignsMonorepo" -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "Removiendo servicio existente..." -ForegroundColor Yellow
    & $nssm stop AlignDesignsMonorepo
    & $nssm remove AlignDesignsMonorepo confirm
    Start-Sleep -Seconds 2
}

# Install Monorepo as service
Write-Host "Instalando Monorepo como servicio..." -ForegroundColor Yellow
& $nssm install AlignDesignsMonorepo $pnpmCmd "dev"
& $nssm set AlignDesignsMonorepo AppDirectory $monorepoPath
& $nssm set AlignDesignsMonorepo DisplayName "Align Designs Monorepo"
& $nssm set AlignDesignsMonorepo Description "Frontend (Next.js) and Backend (NestJS) for Align Designs Platform"
& $nssm set AlignDesignsMonorepo Start SERVICE_AUTO_START
& $nssm set AlignDesignsMonorepo AppStopMethodSkip 0
& $nssm set AlignDesignsMonorepo AppStopMethodConsole 1500
& $nssm set AlignDesignsMonorepo AppExit Default Restart

# Set service dependencies - Monorepo should start AFTER Nginx
Write-Host "Configurando dependencias del servicio..." -ForegroundColor Yellow
& $nssm set AlignDesignsMonorepo DependOnService AlignDesignsNginx

# Set stdout/stderr logging
$logsPath = "$monorepoPath\logs"
if (-not (Test-Path $logsPath)) {
    New-Item -ItemType Directory -Path $logsPath -Force | Out-Null
}
& $nssm set AlignDesignsMonorepo AppStdout "$logsPath\monorepo-service.log"
& $nssm set AlignDesignsMonorepo AppStderr "$logsPath\monorepo-service-error.log"

Write-Host "Iniciando servicio..." -ForegroundColor Yellow
& $nssm start AlignDesignsMonorepo

Start-Sleep -Seconds 5

# Check service status
$service = Get-Service -Name "AlignDesignsMonorepo" -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq 'Running') {
    Write-Host ""
    Write-Host "OK: Monorepo instalado como servicio exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "El servicio se iniciara automaticamente al arrancar Windows" -ForegroundColor Cyan
    Write-Host "  (despues de que inicie Nginx)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Comandos utiles:" -ForegroundColor Yellow
    Write-Host "  Ver estado:  Get-Service AlignDesignsMonorepo" -ForegroundColor Gray
    Write-Host "  Detener:     Stop-Service AlignDesignsMonorepo" -ForegroundColor Gray
    Write-Host "  Iniciar:     Start-Service AlignDesignsMonorepo" -ForegroundColor Gray
    Write-Host "  Ver logs:    Get-Content '$logsPath\monorepo-service.log' -Tail 50 -Wait" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "ERROR: No se pudo iniciar el servicio" -ForegroundColor Red
    Write-Host "Revisa los logs en: $logsPath" -ForegroundColor Yellow
}

Write-Host ""
pause
