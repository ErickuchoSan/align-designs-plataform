@echo off
REM Script para inicializar el monorepo completo desde cero
REM Autor: Claude Code

echo ============================================================
echo   Align Designs Platform - Monorepo Initialization
echo ============================================================
echo.

cd /d "%~dp0\.."

echo [1/6] Checking Node.js version...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js v18 or higher
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node version: %NODE_VERSION%
echo.

echo [2/6] Checking npm version...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo npm version: %NPM_VERSION%
echo.

echo [3/6] Cleaning previous installations...
if exist "node_modules" (
    echo Removing root node_modules...
    rmdir /s /q node_modules
)

if exist "apps\backend\node_modules" (
    echo Removing backend node_modules...
    rmdir /s /q apps\backend\node_modules
)

if exist "apps\frontend\node_modules" (
    echo Removing frontend node_modules...
    rmdir /s /q apps\frontend\node_modules
)

if exist "apps\frontend\.next" (
    echo Removing Next.js build cache...
    rmdir /s /q apps\frontend\.next
)

if exist "apps\backend\dist" (
    echo Removing backend build...
    rmdir /s /q apps\backend\dist
)

echo Cleanup completed!
echo.

echo [4/6] Installing root dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)
echo.

echo [5/6] Installing workspace dependencies...
call npm install --workspaces
if errorlevel 1 (
    echo ERROR: Failed to install workspace dependencies
    pause
    exit /b 1
)
echo.

echo [6/6] Generating Prisma client...
call npm run prisma:generate
if errorlevel 1 (
    echo WARNING: Prisma generation failed
    echo You may need to configure your database first
    echo Run 'npm run prisma:migrate' after setting up your .env file
)
echo.

echo ============================================================
echo   Installation Complete!
echo ============================================================
echo.
echo Next steps:
echo   1. Configure your environment files:
echo      - apps/backend/.env (database, MinIO, etc.)
echo      - apps/frontend/.env.local (API URL)
echo.
echo   2. Run database migrations:
echo      npm run prisma:migrate
echo.
echo   3. Start development servers:
echo      npm run dev
echo      or
echo      scripts\start-dev.bat
echo.
echo ============================================================
echo.

pause
