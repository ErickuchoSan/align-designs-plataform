@echo off
REM Script para instalar Nginx en Windows
REM Autor: Claude Code

echo ============================================================
echo   Installing Nginx for Windows
echo ============================================================
echo.

REM Configurar variables
set NGINX_VERSION=1.26.2
set INSTALL_DIR=C:\nginx
set DOWNLOAD_URL=https://nginx.org/download/nginx-%NGINX_VERSION%.zip
set TEMP_ZIP=%TEMP%\nginx.zip

echo Downloading Nginx %NGINX_VERSION%...
powershell -Command "& {Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%TEMP_ZIP%'}"

if not exist "%TEMP_ZIP%" (
    echo ERROR: Failed to download Nginx
    pause
    exit /b 1
)

echo.
echo Extracting Nginx to %INSTALL_DIR%...
powershell -Command "& {Expand-Archive -Path '%TEMP_ZIP%' -DestinationPath 'C:\' -Force}"

REM Renombrar carpeta si es necesario
if exist "C:\nginx-%NGINX_VERSION%" (
    if exist "%INSTALL_DIR%" (
        rmdir /s /q "%INSTALL_DIR%"
    )
    move "C:\nginx-%NGINX_VERSION%" "%INSTALL_DIR%"
)

echo.
echo Cleaning up...
del "%TEMP_ZIP%"

echo.
echo ============================================================
echo   Nginx installed successfully at %INSTALL_DIR%
echo ============================================================
echo.
echo Next steps:
echo 1. Run: scripts\configure-nginx.bat
echo 2. Start Nginx: cd %INSTALL_DIR% ^&^& start nginx
echo.
pause
