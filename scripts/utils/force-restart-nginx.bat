@echo off
REM ============================================================
REM Forzar reinicio de Nginx (requiere Administrador)
REM ============================================================

echo Reiniciando Nginx...

REM Verificar permisos de administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Requiere permisos de Administrador
    pause
    exit /b 1
)

echo Deteniendo Nginx...
sc stop AlignDesignsNginx
timeout /t 3 /nobreak >nul

echo Iniciando Nginx...
sc start AlignDesignsNginx
timeout /t 2 /nobreak >nul

sc query AlignDesignsNginx | find "RUNNING" >nul
if %errorlevel% equ 0 (
    echo OK: Nginx reiniciado
) else (
    echo ERROR: Nginx no inicio
)

pause
