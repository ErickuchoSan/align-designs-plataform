@echo off
REM ============================================================
REM Script para ver los logs del backend en tiempo real
REM Util para debugging
REM ============================================================

echo ============================================================
echo   Viendo logs del backend en tiempo real
echo ============================================================
echo.
echo Presiona Ctrl+C para detener
echo.
timeout /t 2 /nobreak >nul

REM Get the app directory from NSSM
for /f "tokens=*" %%i in ('nssm get AlignDesignsMonorepo AppDirectory') do set APP_DIR=%%i

echo Directorio de la app: %APP_DIR%
echo.

REM Check if log file exists
if not exist "%APP_DIR%\apps\backend\backend.log" (
    echo Archivo de log no encontrado: %APP_DIR%\apps\backend\backend.log
    echo.
    echo El backend podria estar loggeando a la consola en lugar de archivo
    echo Intenta revisar los logs del servicio con:
    echo   nssm get AlignDesignsMonorepo AppStdout
    echo.
    pause
    exit /b 1
)

REM Tail the log file (PowerShell equivalent of tail -f)
powershell -Command "Get-Content '%APP_DIR%\apps\backend\backend.log' -Wait -Tail 50"
