# Fix SSH key line endings
$keyPath = "$PSScriptRoot\..\aligndesigns-dev.key"
$tempPath = "$env:TEMP\aligndesigns-dev-fixed.key"

$content = Get-Content $keyPath -Raw
$content = $content -replace "`r`n", "`n"
[System.IO.File]::WriteAllText($tempPath, $content)

Write-Host "Key fixed at: $tempPath"
