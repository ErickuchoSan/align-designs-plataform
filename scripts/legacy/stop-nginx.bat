@echo off
REM Script para detener Nginx
REM Autor: Claude Code

set NGINX_DIR=C:\nginx

echo Stopping Nginx...

REM Verificar que Nginx está corriendo
tasklist | findstr nginx.exe >nul
if %errorlevel% neq 0 (
    echo Nginx is not running
    exit /b 0
)

REM Detener Nginx gracefully
cd /d "%NGINX_DIR%"
nginx -s stop

timeout /t 2 /nobreak >nul

REM Verificar que se detuvo
tasklist | findstr nginx.exe >nul
if %errorlevel% neq 0 (
    echo.
    echo ============================================================
    echo   Nginx stopped successfully
    echo ============================================================
) else (
    echo Warning: Nginx still running, forcing stop...
    taskkill /F /IM nginx.exe
)

echo.
