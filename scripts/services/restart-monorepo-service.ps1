# Script para reiniciar el servicio de Monorepo
# Requiere ejecutarse como Administrador

Write-Host "=== Reiniciando Servicio AlignDesignsMonorepo ===" -ForegroundColor Cyan
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

$nssm = "C:\ProgramData\chocolatey\bin\nssm.exe"

# Verify NSSM exists
if (-not (Test-Path $nssm)) {
    Write-Host "ERROR: NSSM no encontrado" -ForegroundColor Red
    pause
    exit 1
}

# Check if service exists
$existingService = Get-Service -Name "AlignDesignsMonorepo" -ErrorAction SilentlyContinue
if (-not $existingService) {
    Write-Host "ERROR: El servicio AlignDesignsMonorepo no existe" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Reiniciando servicio..." -ForegroundColor Yellow
& $nssm restart AlignDesignsMonorepo

Start-Sleep -Seconds 5

# Check service status
$service = Get-Service -Name "AlignDesignsMonorepo" -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq 'Running') {
    Write-Host ""
    Write-Host "OK: Servicio reiniciado exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "El servicio ahora esta corriendo con pnpm y el script 'dev' actualizado" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Espera ~30 segundos para que el backend y frontend inicien completamente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Comandos utiles:" -ForegroundColor Yellow
    Write-Host "  Ver estado:  Get-Service AlignDesignsMonorepo" -ForegroundColor Gray
    Write-Host "  Ver logs:    Get-Content 'd:\Desarrollos\Align Designs\align-designs-plataform\logs\monorepo-service.log' -Tail 50 -Wait" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "WARNING: El servicio no esta corriendo" -ForegroundColor Yellow
    Write-Host "Estado actual: $($service.Status)" -ForegroundColor Gray
}

Write-Host ""
pause
