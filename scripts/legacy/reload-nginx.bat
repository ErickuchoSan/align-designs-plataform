@echo off
REM Script to reload Nginx configuration
REM Requires Administrator privileges

echo ============================================================
echo   Reloading Nginx Configuration
echo ============================================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script requires Administrator privileges
    echo Please right-click and select "Run as Administrator"
    pause
    exit /b 1
)

echo Copying updated configuration...
copy /Y "%~dp0..\nginx\aligndesigns-platform.conf" "C:\nginx\conf\aligndesigns-platform.conf" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy configuration file
    echo Make sure C:\nginx exists
    pause
    exit /b 1
)
echo Configuration file copied successfully!

echo.
echo Testing Nginx configuration...
cd /d C:\nginx
nginx.exe -t
if %errorlevel% neq 0 (
    echo ERROR: Nginx configuration test failed
    echo Please check the configuration file
    pause
    exit /b 1
)

echo.
echo Reloading Nginx...
nginx.exe -s reload
if %errorlevel% neq 0 (
    echo WARNING: Reload command failed
    echo Nginx might not be running. Try starting it with start-nginx.bat
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   Nginx configuration reloaded successfully!
echo ============================================================
echo.

pause
