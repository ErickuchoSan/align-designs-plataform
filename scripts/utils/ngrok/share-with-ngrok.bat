@echo off
REM ============================================================
REM Script para compartir tu aplicacion local via ngrok
REM Genera una URL publica temporal que puedes compartir
REM ============================================================

echo ============================================================
echo   Align Designs Platform - Compartir via Ngrok
echo ============================================================
echo.

REM Verificar si ngrok esta instalado
where ngrok >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Ngrok no esta instalado
    echo.
    echo Instalacion rapida:
    echo   1. Con Chocolatey: choco install ngrok -y
    echo   2. Manual: Descarga desde https://ngrok.com/download
    echo.
    echo Despues de instalar, ejecuta este script nuevamente.
    echo.
    pause
    exit /b 1
)

echo [1/3] Verificando que el sistema este corriendo...
echo.

REM Verificar si los servicios estan corriendo
sc query AlignDesignsNginx | find "RUNNING" >nul
if %errorlevel% neq 0 goto :services_not_running
sc query AlignDesignsMonorepo | find "RUNNING" >nul
if %errorlevel% neq 0 goto :services_not_running
set services_ok=1
goto :services_checked

:services_not_running
set services_ok=0

:services_checked

if "%services_ok%"=="1" (
    echo OK: Servicios corriendo correctamente
) else (
    echo ADVERTENCIA: Los servicios no estan corriendo
    echo.
    echo Opciones:
    echo   1. Iniciar servicios: Start-Service AlignDesignsNginx, AlignDesignsMonorepo
    echo   2. O iniciar manualmente: .\scripts\manual\start.ps1
    echo.
    set /p continuar="Deseas continuar de todos modos? (S/N): "
    if /i not "%continuar%"=="S" (
        echo.
        echo Cancelado. Inicia el sistema primero.
        pause
        exit /b 1
    )
)

echo.
echo [2/3] Iniciando tunnel de ngrok...
echo.
echo NOTA: Ngrok creara una URL publica temporal
echo       Esta URL cambia cada vez que reinicias ngrok
echo       La ventana de ngrok debe permanecer abierta
echo.
echo Presiona Ctrl+C en la ventana de ngrok para detener el tunnel
echo.

timeout /t 3 /nobreak >nul

REM Iniciar ngrok en una ventana nueva apuntando a Nginx (puerto 80)
REM Nginx hace proxy de /api/v1 -> backend:4000 y / -> frontend:3000
REM NO usamos --host-header para que el backend vea el dominio real de ngrok y configure cookies correctamente
start "Ngrok Tunnel - Align Designs" ngrok http 80

echo.
echo [3/3] Esperando a que ngrok inicie...
timeout /t 12 /nobreak >nul

REM Obtener la URL publica de ngrok
echo.
echo Obteniendo URL publica...
powershell -ExecutionPolicy Bypass -File "%~dp0get-ngrok-url.ps1"

echo.
echo Para cerrar el tunnel:
echo   - Cierra la ventana de "Ngrok Tunnel - Align Designs"
echo   - O presiona Ctrl+C en esa ventana
echo.
pause
