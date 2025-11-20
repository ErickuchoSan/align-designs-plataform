@echo off
REM Script para iniciar el monorepo en modo desarrollo (CMD)
REM Autor: Claude Code

echo ========================================
echo   Starting Align Designs Monorepo
echo ========================================
echo.

cd /d "%~dp0\.."

REM Limpiar lockfile de Next.js si existe
if exist "apps\frontend\.next\dev\lock" (
    echo Cleaning Next.js lockfile...
    del /f /q "apps\frontend\.next\dev\lock"
)

echo.
echo Starting services...
echo - Backend (NestJS):  http://localhost:4000
echo - Frontend (Next.js): http://localhost:3000
echo.
echo Press Ctrl+C to stop services
echo.

npm run dev
