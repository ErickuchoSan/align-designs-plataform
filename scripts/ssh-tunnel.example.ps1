# SSH Tunnel to Development Database
# This script creates SSH tunnels to access remote services on Digital Ocean
#
# SETUP:
# 1. Copy this file to ssh-tunnel.ps1
# 2. Fill in your actual values
# 3. ssh-tunnel.ps1 is gitignored (won't be committed)

$KeyFile = "$PSScriptRoot\..\aligndesigns-dev.key"
$FixedKeyFile = "$env:TEMP\aligndesigns-dev-fixed.key"
$RemoteHost = "[SERVER_IP]"
$RemoteUser = "root"
$RemotePort = 29

# PostgreSQL tunnel
$LocalDBPort = 5433
$RemoteDBHost = "postgres-dev"
$RemoteDBPort = 5432

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Align Designs - SSH Tunnel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Fix SSH key line endings (Windows CRLF -> Unix LF)
Write-Host "Fixing SSH key format..." -ForegroundColor Yellow
$content = Get-Content $KeyFile -Raw
$content = $content -replace "`r`n", "`n"
[System.IO.File]::WriteAllText($FixedKeyFile, $content)
Write-Host "Key fixed at: $FixedKeyFile" -ForegroundColor Green
Write-Host ""

Write-Host "Server: $RemoteHost" -ForegroundColor Yellow
Write-Host ""
Write-Host "Tunnels:" -ForegroundColor Green
Write-Host "  PostgreSQL: localhost:$LocalDBPort -> $RemoteDBHost`:$RemoteDBPort" -ForegroundColor White
Write-Host ""
Write-Host "Database Connection String:" -ForegroundColor Cyan
Write-Host "  postgresql://[DB_USER]:[DB_PASSWORD]@localhost:$LocalDBPort/[DB_NAME]" -ForegroundColor White
Write-Host ""
Write-Host "Keep this window open while developing." -ForegroundColor Green
Write-Host "Press Ctrl+C to close the tunnel." -ForegroundColor Green
Write-Host ""

ssh -i $FixedKeyFile `
    -o StrictHostKeyChecking=no `
    -p $RemotePort `
    -L ${LocalDBPort}:${RemoteDBHost}:${RemoteDBPort} `
    ${RemoteUser}@${RemoteHost} -N
