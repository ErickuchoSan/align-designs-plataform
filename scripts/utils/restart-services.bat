@echo off
REM Script para reiniciar los servicios de Align Designs Platform
REM Puede ejecutarse sin privilegios de administrador

echo ========================================
echo   Align Designs Platform - Restart
echo ========================================
echo.

echo Reiniciando servicio del Monorepo...
powershell -Command "Restart-Service AlignDesignsMonorepo"

if %errorlevel% equ 0 (
    echo.
    echo OK: Servicio reiniciado exitosamente
    echo.
    echo Esperando 10 segundos para que el servicio inicie...
    timeout /t 10 /nobreak >nul
    echo.
    echo Puedes acceder a:
    echo   - Frontend: http://localhost:3000
    echo   - Backend:  http://localhost:4000
    echo   - Domain:   http://aligndesigns-platform.local
    echo.
) else (
    echo.
    echo ERROR: No se pudo reiniciar el servicio
    echo Verifica que tengas permisos suficientes
    echo.
)

pause
