# Script para actualizar el servicio de Monorepo de npm a pnpm
# Requiere ejecutarse como Administrador

Write-Host "=== Actualizando Servicio AlignDesignsMonorepo a pnpm ===" -ForegroundColor Cyan
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

# Verify NSSM exists
if (-not (Test-Path $nssm)) {
    Write-Host "ERROR: NSSM no encontrado en $nssm" -ForegroundColor Red
    Write-Host "Ejecuta install-monorepo-service.ps1 primero" -ForegroundColor Yellow
    pause
    exit 1
}

# Find pnpm using 'where' command
Write-Host "Buscando pnpm..." -ForegroundColor Yellow
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

# Check if service exists
$existingService = Get-Service -Name "AlignDesignsMonorepo" -ErrorAction SilentlyContinue
if (-not $existingService) {
    Write-Host "ERROR: El servicio AlignDesignsMonorepo no existe" -ForegroundColor Red
    Write-Host "Ejecuta install-monorepo-service.ps1 primero" -ForegroundColor Yellow
    pause
    exit 1
}

# Get current configuration
Write-Host "Configuración actual del servicio:" -ForegroundColor Yellow
$currentApp = & $nssm get AlignDesignsMonorepo Application
$currentParams = & $nssm get AlignDesignsMonorepo AppParameters
Write-Host "  Application: $currentApp" -ForegroundColor Gray
Write-Host "  Parameters:  $currentParams" -ForegroundColor Gray
Write-Host ""

# Stop the service
Write-Host "Deteniendo servicio..." -ForegroundColor Yellow
& $nssm stop AlignDesignsMonorepo
Start-Sleep -Seconds 3

# Update to pnpm
Write-Host "Actualizando a pnpm..." -ForegroundColor Yellow
& $nssm set AlignDesignsMonorepo Application $pnpmCmd
& $nssm set AlignDesignsMonorepo AppParameters "dev"
& $nssm set AlignDesignsMonorepo AppDirectory $monorepoPath

# Verify update
Write-Host ""
Write-Host "Nueva configuración del servicio:" -ForegroundColor Yellow
$newApp = & $nssm get AlignDesignsMonorepo Application
$newParams = & $nssm get AlignDesignsMonorepo AppParameters
Write-Host "  Application: $newApp" -ForegroundColor Gray
Write-Host "  Parameters:  $newParams" -ForegroundColor Gray
Write-Host ""

# Start the service
Write-Host "Iniciando servicio con pnpm..." -ForegroundColor Yellow
& $nssm start AlignDesignsMonorepo

Start-Sleep -Seconds 5

# Check service status
$service = Get-Service -Name "AlignDesignsMonorepo" -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq 'Running') {
    Write-Host ""
    Write-Host "OK: Servicio actualizado y ejecutandose con pnpm" -ForegroundColor Green
    Write-Host ""
    Write-Host "Comandos utiles:" -ForegroundColor Yellow
    Write-Host "  Ver estado:  Get-Service AlignDesignsMonorepo" -ForegroundColor Gray
    Write-Host "  Ver logs:    Get-Content '$monorepoPath\logs\monorepo-service.log' -Tail 50 -Wait" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "WARNING: El servicio fue actualizado pero no esta corriendo" -ForegroundColor Yellow
    Write-Host "Estado actual: $($service.Status)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Revisa los logs en: $monorepoPath\logs\monorepo-service-error.log" -ForegroundColor Yellow
}

Write-Host ""
pause
