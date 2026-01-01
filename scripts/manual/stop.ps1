# Script to stop Align Designs Monorepo
# Stops the monorepo processes (frontend and backend) and Nginx
# DOES NOT stop Docker containers

Write-Host "=== Stopping Align Designs Monorepo ===" -ForegroundColor Cyan
Write-Host ""

# Stop processes on port 3000 (Frontend)
Write-Host "Stopping Frontend (port 3000)..." -ForegroundColor Yellow
$processes3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes3000) {
    foreach ($pidVal in $processes3000) {
        if ($pidVal) {
            Write-Host "  Stopping process PID: $pidVal" -ForegroundColor Gray
            Stop-Process -Id $pidVal -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "OK: Frontend stopped" -ForegroundColor Green
}
else {
    Write-Host "  No processes running on port 3000" -ForegroundColor Gray
}

Write-Host ""

# Stop processes on port 4000 (Backend)
Write-Host "Stopping Backend (port 4000)..." -ForegroundColor Yellow
$processes4000 = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes4000) {
    foreach ($pidVal in $processes4000) {
        if ($pidVal) {
            Write-Host "  Stopping process PID: $pidVal" -ForegroundColor Gray
            Stop-Process -Id $pidVal -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "OK: Backend stopped" -ForegroundColor Green
}
else {
    Write-Host "  No processes running on port 4000" -ForegroundColor Gray
}

Write-Host ""

# Stop Nginx
Write-Host "Stopping Nginx..." -ForegroundColor Yellow
$nginxPath = "C:\nginx"
if (Test-Path "$nginxPath\nginx.exe") {
    $nginxProcess = Get-Process nginx -ErrorAction SilentlyContinue
    if ($nginxProcess) {
        Push-Location $nginxPath
        .\nginx.exe -s quit
        Pop-Location
        Write-Host "OK: Nginx stopped" -ForegroundColor Green
    } else {
        Write-Host "  Nginx not running" -ForegroundColor Gray
    }
} else {
    Write-Host "  Nginx not found at $nginxPath" -ForegroundColor Gray
}

Write-Host ""

# Clean Next.js lock
Write-Host "Cleaning temporary files..." -ForegroundColor Yellow
$nextDevLock = "D:\Desarrollos\Align Designs\align-designs-plataform\apps\frontend\.next\dev"
if (Test-Path $nextDevLock) {
    Write-Host "  Removing Next.js lock..." -ForegroundColor Gray
    Remove-Item -Recurse -Force $nextDevLock -ErrorAction SilentlyContinue
    Write-Host "OK: Temporary files cleaned" -ForegroundColor Green
}
else {
    Write-Host "  No temporary files to clean" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Monorepo stopped ===" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Docker containers on VM are still running" -ForegroundColor Yellow
Write-Host "  - PostgreSQL: Running on VM (192.168.0.139:5432)" -ForegroundColor Gray
Write-Host "  - MinIO: Running on VM (192.168.0.139:9000)" -ForegroundColor Gray
Write-Host ""
