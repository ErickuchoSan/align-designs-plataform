# Script para reiniciar el monorepo
# Autor: Claude Code
# Descripción: Detiene completamente y reinicia el monorepo limpiamente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🔄 Reiniciando Align Designs Monorepo  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ejecutar script de detención
$stopScript = Join-Path $PSScriptRoot "stop-dev.ps1"
& $stopScript

# Esperar 3 segundos para asegurar que todo se detuvo
Write-Host "⏳ Esperando 3 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ejecutar script de inicio
$startScript = Join-Path $PSScriptRoot "start-dev.ps1"
& $startScript
