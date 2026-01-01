@echo off
REM Script para ver los logs del servicio en tiempo real

echo ========================================
echo   Align Designs Platform - Logs
echo ========================================
echo.
echo Mostrando logs en tiempo real...
echo Presiona Ctrl+C para salir
echo.
timeout /t 2 /nobreak >nul

powershell -Command "Get-Content '.\logs\monorepo-service.log' -Tail 50 -Wait"
