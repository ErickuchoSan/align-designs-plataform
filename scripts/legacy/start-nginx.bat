@echo off
REM Script para iniciar Nginx
REM Autor: Claude Code

set NGINX_DIR=C:\nginx

if not exist "%NGINX_DIR%\nginx.exe" (
    echo ERROR: Nginx not found at %NGINX_DIR%
    echo Please run: scripts\install-nginx.bat first
    pause
    exit /b 1
)

echo Starting Nginx...
cd /d "%NGINX_DIR%"
start nginx

timeout /t 2 /nobreak >nul

REM Verificar que Nginx está corriendo
tasklist | findstr nginx.exe >nul
if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo   Nginx started successfully!
    echo   Access: http://aligndesigns-platform.local
    echo ============================================================
) else (
    echo.
    echo ERROR: Nginx failed to start
    echo Check logs at: %NGINX_DIR%\logs\error.log
)

echo.
