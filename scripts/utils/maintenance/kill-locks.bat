@echo off
REM ============================================================
REM Matar procesos bloqueados de Node.js y Next.js
REM ============================================================

echo Matando procesos bloqueados...

REM Matar todos los procesos de node.exe
tasklist | findstr /i "node.exe" >nul
if %errorlevel% equ 0 (
    echo Matando node.exe...
    taskkill /F /IM node.exe >nul 2>&1
    echo OK: Procesos de node terminados
) else (
    echo No hay procesos de node corriendo
)

timeout /t 2 /nobreak >nul

echo.
echo Locks eliminados. Ahora reinicia el servicio.
pause
