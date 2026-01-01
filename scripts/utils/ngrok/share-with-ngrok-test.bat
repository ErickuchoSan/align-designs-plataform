
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
    exit /b 1
)

echo [1/3] Verificando que el sistema este corriendo...
echo.

REM Verificar si los servicios estan corriendo
powershell -Command "$nginx = Get-Service -Name 'AlignDesignsNginx' -ErrorAction SilentlyContinue; $monorepo = 
Get-Service -Name 'AlignDesignsMonorepo' -ErrorAction SilentlyContinue; if ($nginx -and $nginx.Status -eq 'Running' 
-and $monorepo -and $monorepo.Status -eq 'Running') { exit 0 } else { exit 1 }"

if %errorlevel% equ 0 (
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

REM Crear archivo de configuracion temporal para ngrok
echo version: "2" > "%TEMP%\ngrok-align.yml"
echo web_addr: 127.0.0.1:4040 >> "%TEMP%\ngrok-align.yml"
echo tunnels: >> "%TEMP%\ngrok-align.yml"
echo   align-designs: >> "%TEMP%\ngrok-align.yml"
echo     proto: http >> "%TEMP%\ngrok-align.yml"
echo     addr: 80 >> "%TEMP%\ngrok-align.yml"
echo     host_header: "aligndesigns-platform.local" >> "%TEMP%\ngrok-align.yml"

REM Iniciar ngrok en una ventana nueva
start "Ngrok Tunnel - Align Designs" ngrok start align-designs --config="%TEMP%\ngrok-align.yml"

echo.
echo [3/3] Esperando a que ngrok inicie...
timeout /t 5 /nobreak >nul

REM Obtener la URL publica de ngrok
echo.
echo Obteniendo URL publica...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -ErrorAction Stop; 
$url = $response.tunnels[0].public_url; if ($url) { Write-Host ''; Write-Host 
'============================================================' -ForegroundColor Green; Write-Host '  TUNNEL ACTIVO' 
-ForegroundColor Green; Write-Host '============================================================' -ForegroundColor 
Green; Write-Host ''; Write-Host 'URL Publica:' -ForegroundColor Cyan; Write-Host \"  $url\" -ForegroundColor Yellow; 
Write-Host ''; Write-Host 'Comparte esta URL con el admin para que acceda.' -ForegroundColor White; Write-Host ''; 
Write-Host 'Dashboard de Ngrok:' -ForegroundColor Cyan; Write-Host '  http://127.0.0.1:4040' -ForegroundColor Gray; 
Write-Host '  (Aqui puedes ver el trafico en tiempo real)' -ForegroundColor Gray; Write-Host ''; Write-Host 
'IMPORTANTE:' -ForegroundColor Yellow; Write-Host '  - Mant??n la ventana de ngrok abierta' -ForegroundColor White; 
Write-Host '  - La URL cambiara si reinicias ngrok' -ForegroundColor White; Write-Host '  - Para detener: Cierra la 
ventana de ngrok' -ForegroundColor White; Write-Host ''; Write-Host 
'============================================================' -ForegroundColor Green; Write-Host ''; Set-Clipboard 
-Value $url; Write-Host 'URL copiada al portapapeles!' -ForegroundColor Green; Write-Host ''; } else { Write-Host 
'ERROR: No se pudo obtener la URL de ngrok' -ForegroundColor Red; } } catch { Write-Host ''; Write-Host 'ERROR: Ngrok 
no esta respondiendo' -ForegroundColor Red; Write-Host 'Verifica que la ventana de ngrok este abierta' 
-ForegroundColor Yellow; Write-Host ''; }"

echo.
echo Para cerrar el tunnel:
echo   - Cierra la ventana de "Ngrok Tunnel - Align Designs"
echo   - O presiona Ctrl+C en esa ventana
echo.


