<#
.SYNOPSIS
    Configura un nuevo servidor para Align Designs

.DESCRIPTION
    Este script:
    1. Copia tu SSH key al servidor nuevo
    2. Copia y ejecuta el script de aprovisionamiento
    3. Te conecta al servidor cuando termine

.PARAMETER ServerIP
    IP del servidor nuevo

.PARAMETER SshKey
    Ruta a tu llave SSH privada (default: aligndesigns-dev.key en raiz del proyecto)

.EXAMPLE
    .\setup-new-server.ps1 -ServerIP 123.45.67.89
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,

    [string]$SshKey = "$PSScriptRoot\..\aligndesigns-dev.key"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Align Designs - New Server Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check if SSH key exists
if (-not (Test-Path $SshKey)) {
    Write-Host "Error: SSH key not found at $SshKey" -ForegroundColor Red
    exit 1
}

# Fix SSH key permissions
Write-Host "`nFixing SSH key permissions..." -ForegroundColor Yellow
$tempKey = "$env:TEMP\aligndesigns-setup.key"
Copy-Item $SshKey $tempKey -Force
icacls $tempKey /inheritance:r /grant:r "${env:USERNAME}:(R)" | Out-Null

$provisionScript = "$PSScriptRoot\provision-server.sh"

Write-Host "`n[1/4] Checking connection to server..." -ForegroundColor Green
Write-Host "Trying port 22 first (default SSH port for new servers)..." -ForegroundColor Yellow

# Try to connect to port 22 first (new server)
$port = 22
try {
    $test = ssh -i $tempKey -p $port -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$ServerIP "echo OK" 2>&1
    if ($test -ne "OK") { throw "Connection failed" }
    Write-Host "Connected on port 22" -ForegroundColor Green
} catch {
    # Try port 29 (already configured server)
    Write-Host "Port 22 failed, trying port 29..." -ForegroundColor Yellow
    $port = 29
    try {
        $test = ssh -i $tempKey -p $port -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$ServerIP "echo OK" 2>&1
        if ($test -ne "OK") { throw "Connection failed" }
        Write-Host "Connected on port 29 (server already configured)" -ForegroundColor Green
    } catch {
        Write-Host "Error: Cannot connect to server on port 22 or 29" -ForegroundColor Red
        Write-Host "Make sure:" -ForegroundColor Yellow
        Write-Host "  1. Server IP is correct: $ServerIP" -ForegroundColor Yellow
        Write-Host "  2. Your SSH key is authorized on the server" -ForegroundColor Yellow
        Write-Host "  3. Server firewall allows SSH" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "`n[2/4] Copying provisioning script to server..." -ForegroundColor Green
scp -i $tempKey -P $port -o StrictHostKeyChecking=no $provisionScript root@${ServerIP}:/root/provision-server.sh

Write-Host "`n[3/4] Running provisioning script..." -ForegroundColor Green
Write-Host "This will take a few minutes. Please wait..." -ForegroundColor Yellow
Write-Host ""

# Run the script and show output
ssh -i $tempKey -p $port -o StrictHostKeyChecking=no root@$ServerIP "chmod +x /root/provision-server.sh && bash /root/provision-server.sh"

Write-Host "`n[4/4] Verifying new SSH connection on port 29..." -ForegroundColor Green
Start-Sleep -Seconds 5

try {
    $test = ssh -i $tempKey -p 29 -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$ServerIP "echo OK" 2>&1
    if ($test -eq "OK") {
        Write-Host "SUCCESS! Server configured and accessible on port 29" -ForegroundColor Green
    } else {
        throw "Verification failed"
    }
} catch {
    Write-Host "WARNING: Could not verify connection on port 29" -ForegroundColor Yellow
    Write-Host "Please manually verify: ssh -p 29 root@$ServerIP" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Connect: ssh -i $SshKey -p 29 root@$ServerIP" -ForegroundColor Cyan
Write-Host "  2. Clone repo: git clone <repo-url> /var/www/align-designs" -ForegroundColor Cyan
Write-Host "  3. Configure: Create /var/www/align-designs/.env.dev" -ForegroundColor Cyan
Write-Host "  4. Deploy: cd /var/www/align-designs && docker compose -f docker-compose.dev.yml up -d" -ForegroundColor Cyan
Write-Host ""

# Clean up temp key
Remove-Item $tempKey -ErrorAction SilentlyContinue

Write-Host "Do you want to connect to the server now? (Y/N)" -ForegroundColor Yellow
$response = Read-Host
if ($response -eq "Y" -or $response -eq "y") {
    & .\fix-key.ps1
    ssh -i "$env:TEMP\aligndesigns-dev-fixed.key" -p 29 root@$ServerIP
}
