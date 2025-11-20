# Script para detener completamente el monorepo
# Autor: Claude Code
# Descripcion: Detiene todos los procesos de Node.js relacionados con el proyecto

Write-Host "========================================" -ForegroundColor Red
Write-Host "  Deteniendo Align Designs Monorepo  " -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Funcion para detener procesos por puerto
function Stop-ProcessOnPort {
    param (
        [int]$Port,
        [string]$ServiceName
    )

    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connection) {
        $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Deteniendo $ServiceName (PID: $($process.Id))..." -ForegroundColor Yellow
            Stop-Process -Id $process.Id -Force
            Write-Host "   $ServiceName detenido" -ForegroundColor Green
            return $true
        }
    }
    return $false
}

# Detener procesos en puertos especificos
$stopped = $false

Write-Host "Buscando procesos activos..." -ForegroundColor Cyan
Write-Host ""

# Puerto 4000 - Backend
if (Stop-ProcessOnPort -Port 4000 -ServiceName "Backend (NestJS)") {
    $stopped = $true
}

# Puerto 3000 - Frontend
if (Stop-ProcessOnPort -Port 3000 -ServiceName "Frontend (Next.js)") {
    $stopped = $true
}

# Puerto 3001 - Frontend alternativo
if (Stop-ProcessOnPort -Port 3001 -ServiceName "Frontend (Next.js - puerto alternativo)") {
    $stopped = $true
}

Write-Host ""

# Detener todos los procesos de Node relacionados con el proyecto
Write-Host "Buscando otros procesos de Node.js..." -ForegroundColor Cyan

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*align-designs-demo*" -or
    $_.CommandLine -like "*nest*" -or
    $_.CommandLine -like "*next*"
}

if ($nodeProcesses) {
    foreach ($proc in $nodeProcesses) {
        Write-Host "Deteniendo proceso Node.js (PID: $($proc.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        $stopped = $true
    }
    Write-Host "   Procesos Node.js detenidos" -ForegroundColor Green
}

Write-Host ""

# Limpiar lockfiles
$lockPath = Join-Path $PSScriptRoot "..\apps\frontend\.next\dev"
if (Test-Path $lockPath) {
    Write-Host "Limpiando archivos temporales de Next.js..." -ForegroundColor Cyan
    Remove-Item $lockPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   Archivos temporales eliminados" -ForegroundColor Green
}

Write-Host ""

if ($stopped) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Todos los servicios han sido detenidos  " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  No se encontraron servicios activos  " -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
}

Write-Host ""
