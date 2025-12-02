$ErrorActionPreference = "Stop"

try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/api/v1/auth/login" -Method Post -ContentType "application/json" -Body '{"email": "alf.guzman@outlook.com", "password": "NoloseAlfonso12345"}'
    Write-Host "Login Successful:"
    Write-Host $response.Content
}
catch {
    Write-Host "Login Failed:"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = [System.IO.StreamReader]::new($stream)
        $body = $reader.ReadToEnd()
        Write-Host "Body: $body"
    }
}
