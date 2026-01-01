@echo off
REM ============================================================
REM Script para configurar Nginx en una PC nueva
REM Copia la configuracion de Nginx desde el repositorio
REM Util para cuando te cambias de PC o reinstalaciones
REM ============================================================

echo ============================================================
echo   Align Designs Platform - Configurar Nginx
echo ============================================================
echo.

set NGINX_DIR=C:\nginx
set NGINX_CONF=%NGINX_DIR%\conf\nginx.conf
set NGINX_BACKUP=%NGINX_DIR%\conf\nginx.conf.backup

REM Ruta al archivo de configuracion en el repo (relativa al script)
set SCRIPT_DIR=%~dp0
set REPO_CONF=%SCRIPT_DIR%..\..\C\nginx\conf\aligndesigns-platform.conf

echo Configuracion del sistema:
echo   - Nginx Dir: %NGINX_DIR%
echo   - Config File: %REPO_CONF%
echo.

REM Verificar que Nginx este instalado
if not exist "%NGINX_DIR%" (
    echo ERROR: Nginx no encontrado en %NGINX_DIR%
    echo.
    echo Instrucciones de instalacion:
    echo 1. Descarga Nginx desde: http://nginx.org/en/download.html
    echo 2. Extrae el ZIP en C:\nginx
    echo 3. Ejecuta este script nuevamente
    echo.
    pause
    exit /b 1
)

REM Verificar que existe el archivo de configuracion en el repo
if not exist "%REPO_CONF%" (
    echo ERROR: Archivo de configuracion no encontrado
    echo Buscando en: %REPO_CONF%
    echo.
    echo Asegurate de que el archivo existe en el repositorio
    pause
    exit /b 1
)

echo [1/4] Creando backup del nginx.conf original...
if not exist "%NGINX_BACKUP%" (
    copy "%NGINX_CONF%" "%NGINX_BACKUP%" /Y
    echo OK: Backup creado en nginx.conf.backup
) else (
    echo SKIP: Ya existe un backup
)
echo.

echo [2/4] Copiando configuracion de Align Designs...
copy "%REPO_CONF%" "%NGINX_DIR%\conf\" /Y
if %errorlevel% equ 0 (
    echo OK: Configuracion copiada
) else (
    echo ERROR: No se pudo copiar la configuracion
    pause
    exit /b 1
)
echo.

echo [3/4] Actualizando nginx.conf...
findstr /C:"aligndesigns-platform.conf" "%NGINX_CONF%" >nul
if %errorlevel% equ 0 (
    echo SKIP: La configuracion ya esta incluida
) else (
    echo Agregando include directive...
    powershell -Command "$content = Get-Content '%NGINX_CONF%' -Raw; $content = $content -replace '(http\s*\{)', ('$1' + [Environment]::NewLine + '    include aligndesigns-platform.conf;'); Set-Content '%NGINX_CONF%' -Value $content -NoNewline"
    if %errorlevel% equ 0 (
        echo OK: Include agregado
    ) else (
        echo ERROR: No se pudo modificar nginx.conf
        pause
        exit /b 1
    )
)
echo.

echo [4/4] Verificando configuracion de Nginx...
cd /d "%NGINX_DIR%"
nginx -t

if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo   CONFIGURACION COMPLETADA EXITOSAMENTE
    echo ============================================================
    echo.
    echo Nginx esta configurado correctamente.
    echo.
    echo Proximos pasos:
    echo   1. Configura el archivo hosts:
    echo      - Abre: C:\Windows\System32\drivers\etc\hosts (como admin)
    echo      - Agrega: 127.0.0.1       aligndesigns-platform.local
    echo.
    echo   2. Instala los servicios de Windows (opcional):
    echo      - PowerShell como Admin
    echo      - Ejecuta: .\scripts\services\install-all-services.ps1
    echo.
    echo   3. O inicia manualmente:
    echo      - Ejecuta: .\scripts\manual\start.ps1
    echo.
) else (
    echo.
    echo ============================================================
    echo   ERROR: La configuracion de Nginx tiene errores
    echo ============================================================
    echo.
    echo Revisa los mensajes de error arriba.
    echo Puedes restaurar el backup con:
    echo   copy "%NGINX_BACKUP%" "%NGINX_CONF%" /Y
    echo.
)

pause
