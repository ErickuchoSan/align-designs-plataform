@echo off
REM Script para configurar Nginx con nuestra configuración
REM Autor: Claude Code

echo ============================================================
echo   Configuring Nginx for Align Designs Platform
echo ============================================================
echo.

set NGINX_DIR=C:\nginx
set PROJECT_DIR=%~dp0..
set NGINX_CONF=%NGINX_DIR%\conf\nginx.conf
set SITE_CONF=%PROJECT_DIR%\nginx\aligndesigns-platform.conf

REM Verificar que Nginx está instalado
if not exist "%NGINX_DIR%" (
    echo ERROR: Nginx not found at %NGINX_DIR%
    echo Please run: scripts\install-nginx.bat first
    pause
    exit /b 1
)

REM Copiar configuración del sitio
echo Copying site configuration...
copy "%SITE_CONF%" "%NGINX_DIR%\conf\" /Y

REM Hacer backup del nginx.conf original
if not exist "%NGINX_CONF%.backup" (
    echo Creating backup of nginx.conf...
    copy "%NGINX_CONF%" "%NGINX_CONF%.backup"
)

REM Verificar si ya está incluida la configuración
findstr /C:"aligndesigns-platform.conf" "%NGINX_CONF%" >nul
if %errorlevel% equ 0 (
    echo Configuration already included in nginx.conf
) else (
    echo Adding include directive to nginx.conf...
    powershell -Command "$content = Get-Content '%NGINX_CONF%' -Raw; $content = $content -replace '(http\s*\{)', ('$1' + [Environment]::NewLine + '    include aligndesigns-platform.conf;'); Set-Content '%NGINX_CONF%' -Value $content -NoNewline"
)

REM Verificar configuración
echo.
echo Verifying Nginx configuration...
cd /d "%NGINX_DIR%"
nginx -t

if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo   Nginx configured successfully!
    echo ============================================================
    echo.
    echo To start Nginx, run:
    echo   cd C:\nginx
    echo   start nginx
    echo.
    echo Or use: scripts\start-nginx.bat
) else (
    echo.
    echo ERROR: Nginx configuration has errors
    echo Please check the output above
)

echo.
pause
