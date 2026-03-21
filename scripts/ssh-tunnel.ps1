# SSH Tunnel to Development Database & MinIO
# This script creates SSH tunnels to access remote services on Digital Ocean

$KeyFile = "$PSScriptRoot\..\aligndesigns-dev.key"
$FixedKeyFile = "$env:TEMP\aligndesigns-dev-fixed.key"
$RemoteHost = "144.126.221.76"
$RemoteUser = "root"
$RemotePort = 29

# PostgreSQL tunnel (interno Docker: 172.19.0.3)
$LocalDBPort = 5433
$RemoteDBHost = "postgres-dev"
$RemoteDBPort = 5432

# MinIO tunnel (interno Docker: 172.19.0.2)
$LocalMinioPort = 9000
$RemoteMinioHost = "minio-dev"
$RemoteMinioPort = 9000

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
Write-Host "  MinIO:      localhost:$LocalMinioPort -> $RemoteMinioHost`:$RemoteMinioPort" -ForegroundColor White
Write-Host ""
Write-Host "Database Connection String:" -ForegroundColor Cyan
Write-Host "  postgresql://aligndesigns_dev:AlignDev_SecurePass_2024!@localhost:$LocalDBPort/aligndesigns_dev" -ForegroundColor White
Write-Host ""
Write-Host "MinIO Endpoint:" -ForegroundColor Cyan
Write-Host "  localhost:$LocalMinioPort" -ForegroundColor White
Write-Host "  Access Key: dev_minio_access" -ForegroundColor White
Write-Host "  Secret Key: dev_minio_secret" -ForegroundColor White
Write-Host ""
Write-Host "Keep this window open while developing." -ForegroundColor Green
Write-Host "Press Ctrl+C to close the tunnels." -ForegroundColor Green
Write-Host ""

ssh -i $FixedKeyFile `
    -o StrictHostKeyChecking=no `
    -p $RemotePort `
    -L ${LocalDBPort}:${RemoteDBHost}:${RemoteDBPort} `
    -L ${LocalMinioPort}:${RemoteMinioHost}:${RemoteMinioPort} `
    ${RemoteUser}@${RemoteHost} -N
