# Master script para instalar todos los servicios de Align Designs Platform
# Instala Nginx y Monorepo como servicios de Windows que inician automáticamente
# Requiere ejecutarse como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Align Designs Platform - Auto-Start  " -ForegroundColor Cyan
Write-Host "  Instalador de Servicios de Windows   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instrucciones:" -ForegroundColor Yellow
    Write-Host "  1. Cierra esta ventana" -ForegroundColor Gray
    Write-Host "  2. Haz clic derecho en PowerShell" -ForegroundColor Gray
    Write-Host "  3. Selecciona 'Ejecutar como administrador'" -ForegroundColor Gray
    Write-Host "  4. Ejecuta nuevamente: .\scripts\install-all-services.ps1" -ForegroundColor Gray
    Write-Host ""
    pause
    exit 1
}

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath

Write-Host "Directorio del proyecto: $rootPath" -ForegroundColor Gray
Write-Host ""

# Step 1: Install Nginx service
Write-Host "[1/2] Instalando Nginx como servicio..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray
& "$scriptPath\install-nginx-service.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Error instalando Nginx. Abortando." -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "OK: Nginx instalado correctamente" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

# Step 2: Install Monorepo service
Write-Host "[2/2] Instalando Monorepo como servicio..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray
& "$scriptPath\install-monorepo-service.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "WARN: Error instalando Monorepo." -ForegroundColor Yellow
    Write-Host "Nginx esta instalado, pero el Monorepo tendra que iniciarse manualmente." -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  INSTALACION COMPLETADA              " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Servicios instalados:" -ForegroundColor Cyan
Write-Host "  1. AlignDesignsNginx     - Proxy reverso (Puerto 80)" -ForegroundColor Gray
Write-Host "  2. AlignDesignsMonorepo  - Frontend + Backend" -ForegroundColor Gray
Write-Host ""
Write-Host "Configuracion:" -ForegroundColor Yellow
Write-Host "  • Auto-start: Activado" -ForegroundColor Gray
Write-Host "  • Al reiniciar Windows, los servicios iniciaran automaticamente" -ForegroundColor Gray
Write-Host "  • Orden de inicio: Nginx -> Monorepo" -ForegroundColor Gray
Write-Host ""
Write-Host "Acceso:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor Green
Write-Host "  Backend:   http://localhost:4000" -ForegroundColor Green
Write-Host "  Domain:    http://aligndesigns-platform.local" -ForegroundColor Green
Write-Host ""
Write-Host "Comandos utiles:" -ForegroundColor Yellow
Write-Host "  # Ver estado de todos los servicios" -ForegroundColor Gray
Write-Host "  Get-Service AlignDesigns*" -ForegroundColor White
Write-Host ""
Write-Host "  # Detener todo" -ForegroundColor Gray
Write-Host "  Stop-Service AlignDesignsMonorepo, AlignDesignsNginx" -ForegroundColor White
Write-Host ""
Write-Host "  # Iniciar todo" -ForegroundColor Gray
Write-Host "  Start-Service AlignDesignsNginx, AlignDesignsMonorepo" -ForegroundColor White
Write-Host ""
Write-Host "  # Ver logs del Monorepo" -ForegroundColor Gray
Write-Host "  Get-Content '$rootPath\logs\monorepo-service.log' -Tail 50 -Wait" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "  • Los servicios ya estan corriendo" -ForegroundColor Gray
Write-Host "  • Puedes acceder a http://aligndesigns-platform.local ahora mismo" -ForegroundColor Gray
Write-Host "  • Ya no necesitas ejecutar .\scripts\start.ps1 manualmente" -ForegroundColor Gray
Write-Host "  • Para desarrollo con hot-reload, deten los servicios y usa start.ps1" -ForegroundColor Gray
Write-Host ""

# Verify services are running
Write-Host "Verificando servicios..." -ForegroundColor Cyan
$nginx = Get-Service -Name "AlignDesignsNginx" -ErrorAction SilentlyContinue
$monorepo = Get-Service -Name "AlignDesignsMonorepo" -ErrorAction SilentlyContinue

if ($nginx.Status -eq 'Running') {
    Write-Host "  OK: Nginx Running" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Nginx $($nginx.Status)" -ForegroundColor Red
}

if ($monorepo.Status -eq 'Running') {
    Write-Host "  OK: Monorepo Running" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Monorepo $($monorepo.Status)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Esperando 15 segundos para que los servicios inicien completamente..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Health check
Write-Host ""
Write-Host "=== Health Check ===" -ForegroundColor Cyan

function Test-Endpoint {
    param (
        [string]$Name,
        [string]$Url
    )

    try {
        $request = [System.Net.WebRequest]::Create($Url)
        $request.Method = "HEAD"
        $request.Timeout = 10000
        $response = $request.GetResponse()

        $statusCode = [int]$response.StatusCode
        $response.Close()

        if ($statusCode -eq 200) {
            Write-Host "  OK: $Name" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "  WARN: $Name (Status: $statusCode)" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "  ERROR: $Name - No accesible aun (puede necesitar mas tiempo)" -ForegroundColor Red
        return $false
    }
}

$feStatus = Test-Endpoint -Name "Frontend (http://localhost:3000)" -Url "http://localhost:3000"
$beStatus = Test-Endpoint -Name "Backend  (http://localhost:4000)" -Url "http://localhost:4000/api/v1/health"
$domainStatus = Test-Endpoint -Name "Domain   (http://aligndesigns-platform.local)" -Url "http://aligndesigns-platform.local"

Write-Host ""
if ($feStatus -and $beStatus -and $domainStatus) {
    Write-Host "TODO LISTO - Sistema completamente operativo!" -ForegroundColor Green
} else {
    Write-Host "WARN: Algunos servicios no responden aun. Espera 30 segundos mas y verifica." -ForegroundColor Yellow
}

Write-Host ""
pause
