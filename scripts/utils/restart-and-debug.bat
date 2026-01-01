@echo off
REM ============================================================
REM Script para reiniciar el monorepo y ver logs de debugging
REM ============================================================

echo ============================================================
echo   Reiniciando monorepo para debugging
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

echo [1/2] Reiniciando servicio...
sc stop AlignDesignsMonorepo >nul 2>&1
timeout /t 3 /nobreak >nul
sc start AlignDesignsMonorepo >nul 2>&1

echo Esperando 10 segundos a que el servicio inicie completamente...
timeout /t 10 /nobreak >nul

sc query AlignDesignsMonorepo | find "RUNNING" >nul
if %errorlevel% equ 0 (
    echo OK: Servicio reiniciado
) else (
    echo ERROR: El servicio no inicio correctamente
    pause
    exit /b 1
)
echo.

echo [2/2] Logs del backend:
echo.
echo Los logs de debugging apareceran aqui cuando hagas login
echo Presiona Ctrl+C para detener
echo.
timeout /t 3 /nobreak >nul

REM Ver logs en tiempo real
powershell -Command "Get-Content 'd:\Desarrollos\Align Designs\align-designs-plataform\logs\monorepo-service.log' -Wait -Tail 100"
