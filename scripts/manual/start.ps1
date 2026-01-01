# Script to start Align Designs Monorepo
# Checks and starts Docker containers if stopped, then starts the monorepo

Write-Host "=== Starting Align Designs Platform ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$VM_USER = "erick"
$VM_HOST = "192.168.0.139"
$VM_PASSWORD = "NoloseMaquinaVirtual12345"

# Docker check skipped to avoid SSH interactive prompt blocking
Write-Host "Skipping Docker check (SSH auth requires interaction)..." -ForegroundColor Yellow
Write-Host "Assuming Database and MinIO are running." -ForegroundColor Gray
Write-Host ""

# Clean previous processes
Write-Host "Cleaning previous processes on ports 3000 and 4000..." -ForegroundColor Yellow

$processes3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($pidVal in $processes3000) {
    if ($pidVal) {
        Write-Host "  Stopping process on port 3000 (PID: $pidVal)" -ForegroundColor Gray
        Stop-Process -Id $pidVal -Force -ErrorAction SilentlyContinue
    }
}

$processes4000 = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($pidVal in $processes4000) {
    if ($pidVal) {
        Write-Host "  Stopping process on port 4000 (PID: $pidVal)" -ForegroundColor Gray
        Stop-Process -Id $pidVal -Force -ErrorAction SilentlyContinue
    }
}

$nextDevLock = "d:\Desarrollos\Align Designs\align-designs-plataform\apps\frontend\.next\dev"
if (Test-Path $nextDevLock) {
    Write-Host "  Removing Next.js lock..." -ForegroundColor Gray
    Remove-Item -Recurse -Force $nextDevLock -ErrorAction SilentlyContinue
}

Write-Host "OK: Ports cleaned" -ForegroundColor Green
Write-Host ""

# Start Nginx
Write-Host "Starting Nginx..." -ForegroundColor Yellow
$nginxPath = "C:\nginx"
if (Test-Path "$nginxPath\nginx.exe") {
    # Check if Nginx is already running
    $nginxProcess = Get-Process nginx -ErrorAction SilentlyContinue
    if ($nginxProcess) {
        Write-Host "  Nginx already running, stopping first..." -ForegroundColor Gray
        Push-Location $nginxPath
        .\nginx.exe -s quit
        Start-Sleep -Seconds 2
        Pop-Location
    }

    # Start Nginx
    Push-Location $nginxPath
    Start-Process -FilePath ".\nginx.exe" -WindowStyle Hidden
    Pop-Location
    Write-Host "OK: Nginx started" -ForegroundColor Green
} else {
    Write-Host "WARN: Nginx not found at $nginxPath" -ForegroundColor Yellow
}
Write-Host ""

# Start monorepo
Write-Host "Starting monorepo..." -ForegroundColor Yellow
Write-Host "Running: pnpm dev" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend:  http://localhost:4000" -ForegroundColor Green
Write-Host "Domain:   http://aligndesigns-platform.local" -ForegroundColor Cyan
Write-Host ""

$process = Start-Process -FilePath "pnpm.cmd" -ArgumentList "dev" -PassThru -NoNewWindow

Write-Host "Waiting 30 seconds for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "=== System Health Check ===" -ForegroundColor Cyan

function Test-Endpoint {
    param (
        [string]$Name,
        [string]$Url,
        [bool]$IsOptional = $false
    )
    
    try {
        $request = [System.Net.WebRequest]::Create($Url)
        $request.Method = "HEAD"
        $request.Timeout = 5000
        $response = $request.GetResponse()
        
        $statusCode = [int]$response.StatusCode
        $response.Close()
        
        if ($statusCode -eq 200) {
            Write-Host "OK: $Name ($Url)" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "WARN: $Name status $statusCode" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        if ($IsOptional) {
            Write-Host "WARN: $Name ($Url) - Not accessible yet (Check Nginx/Hosts)" -ForegroundColor Yellow
        }
        else {
            Write-Host "FAIL: $Name ($Url) - $_" -ForegroundColor Red
        }
        return $false
    }
}

$feStatus = Test-Endpoint -Name "Frontend (Direct)" -Url "http://localhost:3000"
$beStatus = Test-Endpoint -Name "Backend (Direct)" -Url "http://localhost:4000/api/v1/health"
$domainStatus = Test-Endpoint -Name "Domain (Nginx)" -Url "http://aligndesigns-platform.local" -IsOptional $true

if ($feStatus -and $beStatus) {
    Write-Host ""
    Write-Host "SYSTEM READY" -ForegroundColor Green
    if ($domainStatus) {
        Write-Host "Domain is accessible: http://aligndesigns-platform.local" -ForegroundColor Green
    }
    else {
        Write-Host "Domain might not be accessible yet (check hosts/nginx)" -ForegroundColor Yellow
        Write-Host "You can access via localhost:3000 and localhost:4000" -ForegroundColor Gray
    }
}
else {
    Write-Host ""
    Write-Host "WARN: Some services did not respond correctly. Check logs." -ForegroundColor Yellow
}
