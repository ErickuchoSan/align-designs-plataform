@echo off
REM Script para iniciar el monorepo en modo desarrollo
REM Autor: Claude Code

echo ============================================================
echo   Starting Align Designs Monorepo - Development Mode
echo ============================================================
echo.

cd /d "%~dp0\.."

REM Verificar que node_modules existe
if not exist "node_modules" (
    echo ERROR: Dependencies not installed!
    echo Please run: scripts\init-monorepo.bat
    echo.
    pause
    exit /b 1
)

REM Limpiar lockfile de Next.js si existe
if exist "apps\frontend\.next\dev\lock" (
    echo Cleaning Next.js lockfile...
    del /f /q "apps\frontend\.next\dev\lock" 2>nul
)

if exist "apps\frontend\.next\dev" (
    echo Cleaning Next.js dev cache...
    rmdir /s /q "apps\frontend\.next\dev" 2>nul
)

echo.
echo Starting services...
echo - Backend (NestJS):  http://localhost:4000
echo - Frontend (Next.js): http://localhost:3000
echo.
echo Press Ctrl+C to stop services
echo.

REM Iniciar servicios
npm run dev
