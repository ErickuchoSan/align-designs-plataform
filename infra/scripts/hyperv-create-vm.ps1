$VmName = "Ebionix-Software-Design"
$IsoPath = "D:\ISOs\ubuntu-24.04.1-live-server-amd64.iso"
$IsoCandidates = @(
  "https://cdimage.ubuntu.com/releases/24.04/release/ubuntu-24.04.1-live-server-amd64.iso",
  "https://releases.ubuntu.com/24.04/ubuntu-24.04.2-live-server-amd64.iso",
  "https://releases.ubuntu.com/22.04/ubuntu-22.04.5-live-server-amd64.iso"
)
$VmRoot = "D:\VMs"
$VmFolder = Join-Path $VmRoot $VmName
$VhdPath = Join-Path $VmFolder "$VmName.vhdx"

if (-Not (Test-Path $VmRoot)) { New-Item -ItemType Directory -Path $VmRoot | Out-Null }
if (-Not (Test-Path $VmFolder)) { New-Item -ItemType Directory -Path $VmFolder | Out-Null }
if (-Not (Test-Path $IsoPath)) {
  if (-Not (Test-Path (Split-Path $IsoPath -Parent))) { New-Item -ItemType Directory -Path (Split-Path $IsoPath -Parent) | Out-Null }
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  foreach ($u in $IsoCandidates) {
    try { Invoke-WebRequest -Uri $u -OutFile $IsoPath -UseBasicParsing; break } catch {}
  }
}

$switch = Get-VMSwitch | Where-Object { $_.Name -eq "External Switch" }
if (-Not $switch) { $switch = Get-VMSwitch | Where-Object { $_.Name -eq "Default Switch" } }
if (-Not $switch) { throw "No hay conmutador virtual disponible" }

$existing = Get-VM -Name $VmName -ErrorAction SilentlyContinue
if (-Not $existing) {
  New-VM -Name $VmName -Generation 2 -MemoryStartupBytes 6GB -NewVHDPath $VhdPath -NewVHDSizeBytes 80GB -SwitchName $switch.Name | Out-Null
}

if ((Get-VM -Name $VmName).State -ne 'Off') { Stop-VM -Name $VmName -Force }
Set-VMProcessor -VMName $VmName -Count 2
if ((Test-Path $IsoPath) -and -Not (Get-VMDvdDrive -VMName $VmName)) { Add-VMDvdDrive -VMName $VmName -Path $IsoPath | Out-Null }
Set-VMFirmware -VMName $VmName -EnableSecureBoot On -SecureBootTemplate "MicrosoftUEFICertificateAuthority"
Set-VMFirmware -VMName $VmName -FirstBootDevice (Get-VMDvdDrive -VMName $VmName)
Start-VM $VmName

Write-Host "VM creada y arrancada: $VmName"