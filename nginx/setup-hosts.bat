@echo off
REM Script para agregar el dominio local al archivo hosts
REM Requiere ejecutarse como Administrador

echo ============================================================
echo   Setup Local Domain - Align Designs Platform
echo ============================================================
echo.

REM Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Este script requiere permisos de administrador
    echo.
    echo Por favor:
    echo 1. Cierra esta ventana
    echo 2. Haz clic derecho en este archivo
    echo 3. Selecciona "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

set HOSTS_FILE=C:\Windows\System32\drivers\etc\hosts
set DOMAIN=aligndesigns-platform.local

echo Verificando archivo hosts...
echo.

REM Verificar si el dominio ya existe
findstr /C:"%DOMAIN%" "%HOSTS_FILE%" >nul 2>&1
if %errorLevel% equ 0 (
    echo El dominio %DOMAIN% ya existe en el archivo hosts
    echo No se requiere accion.
) else (
    echo Agregando %DOMAIN% al archivo hosts...
    echo.
    echo 127.0.0.1       %DOMAIN% >> "%HOSTS_FILE%"
    echo ::1             %DOMAIN% >> "%HOSTS_FILE%"
    echo.
    echo Dominio agregado exitosamente!
)

echo.
echo ============================================================
echo   Configuracion completada
echo ============================================================
echo.
echo Dominio configurado: %DOMAIN%
echo.
echo Proximos pasos:
echo   1. Copia el archivo nginx\aligndesigns-platform.conf
echo      a tu carpeta conf de Nginx
echo   2. Reinicia Nginx
echo   3. Inicia los servicios: scripts\start-dev.bat
echo   4. Abre: http://aligndesigns-platform.local
echo.
echo ============================================================
echo.

pause
