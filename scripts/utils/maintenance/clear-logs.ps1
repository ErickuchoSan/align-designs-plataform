# Clear Service Logs Script
# Stops the Windows service, clears logs, and restarts the service

Write-Host "=== Align Designs - Clear Service Logs ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script requires administrator privileges" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again" -ForegroundColor Yellow
    pause
    exit 1
}

# Define paths
$projectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
$logsDir = Join-Path $projectRoot "logs"
$serviceLog = Join-Path $logsDir "monorepo-service.log"
$errorLog = Join-Path $logsDir "monorepo-service-error.log"

# Check if service exists
$service = Get-Service -Name "AlignDesignsMonorepo" -ErrorAction SilentlyContinue

if ($null -eq $service) {
    Write-Host "Service 'AlignDesignsMonorepo' not found" -ForegroundColor Yellow
    Write-Host "Clearing logs anyway..." -ForegroundColor Gray
} else {
    # Stop service if running
    if ($service.Status -eq "Running") {
        Write-Host "Stopping service 'AlignDesignsMonorepo'..." -ForegroundColor Yellow
        Stop-Service -Name "AlignDesignsMonorepo" -Force
        Start-Sleep -Seconds 2
        Write-Host "Service stopped" -ForegroundColor Green
    }
}

# Get current log sizes
if (Test-Path $serviceLog) {
    $size = (Get-Item $serviceLog).Length / 1MB
    Write-Host "Current log size: $([Math]::Round($size, 2)) MB" -ForegroundColor Cyan
}

# Clear logs
Write-Host ""
Write-Host "Clearing logs..." -ForegroundColor Yellow

if (Test-Path $serviceLog) {
    Remove-Item $serviceLog -Force
    New-Item $serviceLog -ItemType File -Force | Out-Null
    Write-Host "✓ Cleared monorepo-service.log" -ForegroundColor Green
}

if (Test-Path $errorLog) {
    Remove-Item $errorLog -Force
    New-Item $errorLog -ItemType File -Force | Out-Null
    Write-Host "✓ Cleared monorepo-service-error.log" -ForegroundColor Green
}

# Restart service if it was installed
if ($null -ne $service) {
    Write-Host ""
    Write-Host "Restarting service 'AlignDesignsMonorepo'..." -ForegroundColor Yellow
    Start-Service -Name "AlignDesignsMonorepo"
    Start-Sleep -Seconds 2

    $newStatus = (Get-Service -Name "AlignDesignsMonorepo").Status
    if ($newStatus -eq "Running") {
        Write-Host "Service restarted successfully" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Service did not start. Status: $newStatus" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Logs cleared successfully!" -ForegroundColor Green
Write-Host ""
pause
