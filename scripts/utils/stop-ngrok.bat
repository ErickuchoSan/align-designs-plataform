@echo off
REM Script para detener ngrok

echo ============================================================
echo   Deteniendo Ngrok Tunnel
echo ============================================================
echo.

echo Buscando procesos de ngrok...
tasklist | findstr /i "ngrok.exe" >nul

if %errorlevel% equ 0 (
    echo Deteniendo ngrok...
    taskkill /F /IM ngrok.exe >nul 2>&1

    if %errorlevel% equ 0 (
        echo.
        echo OK: Ngrok detenido correctamente
        echo.
        echo El tunnel ya no esta activo.
        echo La URL publica ya no funciona.
    ) else (
        echo.
        echo ERROR: No se pudo detener ngrok
    )
) else (
    echo.
    echo Ngrok no esta corriendo.
)

echo.
pause
