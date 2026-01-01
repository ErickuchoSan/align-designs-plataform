@echo off
REM ============================================================
REM Script para aplicar la configuracion de Nginx para ngrok
REM Reinicia Nginx para tomar los cambios
REM ============================================================

echo ============================================================
echo   Aplicando configuracion de Nginx para ngrok
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

echo [1/3] Verificando configuracion de Nginx...
cd /d C:\nginx
nginx.exe -t
if %errorlevel% neq 0 (
    echo.
    echo ERROR: La configuracion de Nginx tiene errores
    echo Por favor revisa el archivo C:\nginx\conf\aligndesigns-platform.conf
    echo.
    pause
    exit /b 1
)
echo OK: Configuracion valida
echo.

echo [2/3] Reiniciando servicio de Nginx...
sc stop AlignDesignsNginx >nul 2>&1
timeout /t 2 /nobreak >nul
sc start AlignDesignsNginx >nul 2>&1
timeout /t 3 /nobreak >nul

REM Verificar que el servicio este corriendo
sc query AlignDesignsNginx | find "RUNNING" >nul
if %errorlevel% equ 0 (
    echo OK: Nginx reiniciado correctamente
) else (
    echo ERROR: Nginx no inicio correctamente
    echo Revisa el estado con: sc query AlignDesignsNginx
    pause
    exit /b 1
)
echo.

echo [3/3] Deteniendo ngrok anterior (si existe)...
tasklist | findstr /i "ngrok.exe" >nul
if %errorlevel% equ 0 (
    taskkill /F /IM ngrok.exe >nul 2>&1
    echo OK: Ngrok anterior detenido
) else (
    echo INFO: No habia ngrok corriendo
)
echo.

echo ============================================================
echo   Configuracion aplicada exitosamente
echo ============================================================
echo.
echo Ahora ejecuta: .\scripts\utils\share-with-ngrok.bat
echo Para iniciar ngrok con la nueva configuracion
echo.
pause
