@echo off
REM ============================================================
REM Script para reiniciar el servicio del monorepo
REM Necesario despues de cambiar variables NEXT_PUBLIC_* en .env.local
REM ============================================================

echo ============================================================
echo   Reiniciando Monorepo para aplicar cambios de ngrok
echo ============================================================
echo.

REM Verificar permisos de administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Este script requiere permisos de Administrador
    echo.
    echo Por favor:
    echo   1. Cierra esta ventana
    echo   2. Haz clic derecho en este archivo
    echo   3. Selecciona "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

echo [1/2] Deteniendo servicio AlignDesignsMonorepo...
sc stop AlignDesignsMonorepo >nul 2>&1
timeout /t 3 /nobreak >nul
echo OK: Servicio detenido
echo.

echo [2/2] Iniciando servicio AlignDesignsMonorepo...
sc start AlignDesignsMonorepo >nul 2>&1
timeout /t 5 /nobreak >nul

REM Verificar que el servicio este corriendo
sc query AlignDesignsMonorepo | find "RUNNING" >nul
if %errorlevel% equ 0 (
    echo OK: Servicio reiniciado correctamente
    echo.
    echo El frontend ahora usara NEXT_PUBLIC_API_URL=/api/v1
    echo.
    echo Espera ~30 segundos para que el frontend compile completamente
    echo Luego prueba nuevamente en ngrok
) else (
    echo ERROR: El servicio no inicio correctamente
    echo.
    echo Revisa el estado con: sc query AlignDesignsMonorepo
)

echo.
pause
