# Script para desinstalar todos los servicios de Align Designs Platform
# Requiere ejecutarse como Administrador

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  Align Designs Platform                " -ForegroundColor Yellow
Write-Host "  Desinstalador de Servicios            " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Check if running as administrator
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "Haz clic derecho en PowerShell y selecciona 'Ejecutar como administrador'" -ForegroundColor Yellow
    pause
    exit 1
}

$nssm = "C:\ProgramData\chocolatey\bin\nssm.exe"

if (-not (Test-Path $nssm)) {
    Write-Host "⚠️  NSSM no está instalado. Los servicios probablemente no existen." -ForegroundColor Yellow
    pause
    exit 0
}

Write-Host "Este script eliminará los siguientes servicios:" -ForegroundColor Yellow
Write-Host "  • AlignDesignsMonorepo (Frontend + Backend)" -ForegroundColor Gray
Write-Host "  • AlignDesignsNginx (Proxy reverso)" -ForegroundColor Gray
Write-Host ""
Write-Host "Después de esto, tendrás que usar .\scripts\start.ps1 manualmente" -ForegroundColor Gray
Write-Host ""

$confirmation = Read-Host "¿Deseas continuar? (S/N)"
if ($confirmation -ne 'S' -and $confirmation -ne 's') {
    Write-Host "Operación cancelada." -ForegroundColor Gray
    exit 0
}

Write-Host ""

# Uninstall Monorepo service first (it depends on Nginx)
Write-Host "[1/2] Desinstalando servicio Monorepo..." -ForegroundColor Cyan
$monorepoService = Get-Service -Name "AlignDesignsMonorepo" -ErrorAction SilentlyContinue
if ($monorepoService) {
    Write-Host "  Deteniendo servicio..." -ForegroundColor Gray
    & $nssm stop AlignDesignsMonorepo
    Start-Sleep -Seconds 3

    Write-Host "  Removiendo servicio..." -ForegroundColor Gray
    & $nssm remove AlignDesignsMonorepo confirm

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ AlignDesignsMonorepo eliminado" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Error eliminando AlignDesignsMonorepo" -ForegroundColor Red
    }
} else {
    Write-Host "  ⚠ Servicio no encontrado (ya eliminado)" -ForegroundColor Yellow
}

Write-Host ""

# Uninstall Nginx service
Write-Host "[2/2] Desinstalando servicio Nginx..." -ForegroundColor Cyan
$nginxService = Get-Service -Name "AlignDesignsNginx" -ErrorAction SilentlyContinue
if ($nginxService) {
    Write-Host "  Deteniendo servicio..." -ForegroundColor Gray
    & $nssm stop AlignDesignsNginx
    Start-Sleep -Seconds 3

    Write-Host "  Removiendo servicio..." -ForegroundColor Gray
    & $nssm remove AlignDesignsNginx confirm

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ AlignDesignsNginx eliminado" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Error eliminando AlignDesignsNginx" -ForegroundColor Red
    }
} else {
    Write-Host "  ⚠ Servicio no encontrado (ya eliminado)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ DESINSTALACIÓN COMPLETADA           " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Los servicios han sido eliminados." -ForegroundColor Cyan
Write-Host ""
Write-Host "Para iniciar el sistema ahora, usa:" -ForegroundColor Yellow
Write-Host "  .\scripts\start.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Para volver a instalar los servicios:" -ForegroundColor Yellow
Write-Host "  .\scripts\install-all-services.ps1" -ForegroundColor White
Write-Host ""
pause
