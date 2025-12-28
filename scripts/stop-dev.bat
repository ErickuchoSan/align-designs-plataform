@echo off
REM Script para detener el monorepo y limpiar procesos
REM Autor: Claude Code

echo ============================================================
echo   Stopping Align Designs Monorepo
echo ============================================================
echo.

REM Detener procesos en puerto 4000 (Backend)
echo Checking Backend on port 4000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000 ^| findstr LISTENING') do (
    echo Stopping Backend (PID: %%a)...
    taskkill /F /PID %%a 2>nul
)

REM Detener procesos en puerto 3000 (Frontend)
echo Checking Frontend on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Stopping Frontend (PID: %%a)...
    taskkill /F /PID %%a 2>nul
)

REM Detener procesos en puerto 3001 (si existe)
echo Checking alternate Frontend port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo Stopping process on port 3001 (PID: %%a)...
    taskkill /F /PID %%a 2>nul
)

REM Detener todos los procesos de Node.js relacionados (opcional, comentado por seguridad)
REM echo Stopping all Node.js processes...
REM taskkill /F /IM node.exe 2>nul

REM Limpiar archivos temporales de Next.js
cd /d "%~dp0\.."
if exist "apps\frontend\.next\dev" (
    echo Cleaning Next.js dev cache...
    rmdir /s /q "apps\frontend\.next\dev" 2>nul
)

if exist "apps\frontend\.next\dev\lock" (
    echo Cleaning Next.js lockfile...
    del /f /q "apps\frontend\.next\dev\lock" 2>nul
)

echo.
echo ============================================================
echo   All services stopped and cleaned
echo ============================================================
echo.
