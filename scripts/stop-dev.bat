@echo off
REM Script para detener el monorepo (CMD)
REM Autor: Claude Code

echo ========================================
echo   Stopping Align Designs Monorepo
echo ========================================
echo.

REM Detener procesos en puertos específicos
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do (
    echo Stopping Backend on port 4000 (PID: %%a)...
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Stopping Frontend on port 3000 (PID: %%a)...
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Stopping Frontend on port 3001 (PID: %%a)...
    taskkill /F /PID %%a 2>nul
)

REM Limpiar lockfiles
if exist "%~dp0\..\apps\frontend\.next\dev" (
    echo Cleaning Next.js temp files...
    rmdir /s /q "%~dp0\..\apps\frontend\.next\dev" 2>nul
)

echo.
echo ========================================
echo   All services stopped
echo ========================================
echo.
