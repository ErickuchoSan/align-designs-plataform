# Simple script to get ngrok URL
Start-Sleep -Seconds 3

try {
    $response = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels'
    $url = $response.tunnels[0].public_url

    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  NGROK TUNNEL ACTIVO" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "URL Publica:" -ForegroundColor Cyan
    Write-Host "  $url" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Dashboard de Ngrok:" -ForegroundColor Cyan
    Write-Host "  http://127.0.0.1:4040" -ForegroundColor Gray
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""

    # Copiar al portapapeles
    Set-Clipboard -Value $url
    Write-Host "URL copiada al portapapeles!" -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "ERROR: Ngrok no esta respondiendo" -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "  1. Espera unos segundos mas y ejecuta: .\scripts\utils\get-ngrok-url.ps1" -ForegroundColor White
    Write-Host "  2. Verifica la ventana de ngrok para ver si hay errores" -ForegroundColor White
    Write-Host "  3. Abre el dashboard manualmente: http://127.0.0.1:4040" -ForegroundColor White
    Write-Host ""
}
