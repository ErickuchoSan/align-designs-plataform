# Script para iniciar el monorepo en modo desarrollo
# Autor: Claude Code
# Descripcion: Inicia backend (NestJS) y frontend (Next.js) concurrentemente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Align Designs Monorepo  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio raiz del proyecto
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# Verificar si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
    Write-Host "Dependencias instaladas" -ForegroundColor Green
    Write-Host ""
}

# Limpiar lockfile de Next.js si existe
$lockFile = Join-Path $projectRoot "apps\frontend\.next\dev\lock"
if (Test-Path $lockFile) {
    Write-Host "Limpiando lockfile de Next.js..." -ForegroundColor Yellow
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
}

# Limpiar carpeta dev completa si existe
$devFolder = Join-Path $projectRoot "apps\frontend\.next\dev"
if (Test-Path $devFolder) {
    Write-Host "Limpiando archivos temporales de Next.js..." -ForegroundColor Yellow
    Remove-Item $devFolder -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Servicios:" -ForegroundColor Cyan
Write-Host "  - Backend (NestJS):   http://localhost:4000" -ForegroundColor White
Write-Host "  - Frontend (Next.js): http://localhost:3000" -ForegroundColor White
Write-Host "  - API Docs:          http://localhost:4000/api/docs" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Ctrl+C para detener los servicios" -ForegroundColor Yellow
Write-Host ""

# Iniciar el monorepo
npm run dev
