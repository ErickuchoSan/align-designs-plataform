@echo off
setlocal

:: Script to configure hosts file for Align Designs Platform (VM Version)
:: Must be run as Administrator

:: IP of the VM hosting Nginx
set "TARGET_IP=192.168.0.139"
set "DOMAIN=aligndesigns-platform.local"
set "HOSTS_FILE=%SystemRoot%\System32\drivers\etc\hosts"

:: Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

echo Adding entry to hosts file...
echo. >> "%HOSTS_FILE%"
echo # Align Designs Platform (Remote VM) >> "%HOSTS_FILE%"
echo %TARGET_IP%       %DOMAIN% >> "%HOSTS_FILE%"

echo Done! The domain %DOMAIN% now points to %TARGET_IP%.
echo Flushing DNS cache...
ipconfig /flushdns

pause
