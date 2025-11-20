@echo off
REM Script para reiniciar el monorepo (CMD)
REM Autor: Claude Code

echo ========================================
echo   Restarting Align Designs Monorepo
echo ========================================
echo.

call "%~dp0\stop-dev.bat"

echo.
echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo.

call "%~dp0\start-dev.bat"
