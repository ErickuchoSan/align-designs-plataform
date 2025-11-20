# Script para iniciar el monorepo en modo desarrollo
# Autor: Claude Code
# Descripción: Inicia backend (NestJS) y frontend (Next.js) simultáneamente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🚀 Iniciando Align Designs Monorepo  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# Verificar node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules no encontrado. Instalando dependencias..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al instalar dependencias" -ForegroundColor Red
        exit 1
    }
}

# Limpiar lockfiles de Next.js si existen
$lockPath = "apps\frontend\.next\dev\lock"
if (Test-Path $lockPath) {
    Write-Host "🧹 Limpiando lockfile de Next.js..." -ForegroundColor Yellow
    Remove-Item $lockPath -Force
}

# Verificar si los puertos están en uso
Write-Host "🔍 Verificando puertos..." -ForegroundColor Cyan

$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "⚠️  Puerto 3000 en uso. Frontend usará puerto alternativo." -ForegroundColor Yellow
}

$port4000 = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
if ($port4000) {
    Write-Host "⚠️  Puerto 4000 en uso (Backend). Deteniendo proceso..." -ForegroundColor Yellow
    $process = Get-Process -Id $port4000.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $process.Id -Force
        Start-Sleep -Seconds 2
    }
}

Write-Host ""
Write-Host "✅ Puertos verificados" -ForegroundColor Green
Write-Host ""

# Iniciar el monorepo
Write-Host "🎯 Iniciando servicios..." -ForegroundColor Cyan
Write-Host "   - Backend (NestJS):  http://localhost:4000" -ForegroundColor Gray
Write-Host "   - Frontend (Next.js): http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Presiona Ctrl+C para detener los servicios" -ForegroundColor Yellow
Write-Host ""

# Ejecutar npm run dev
npm run dev
