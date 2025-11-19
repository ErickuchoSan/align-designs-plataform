Param()

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$InfraDir = Split-Path -Parent $ScriptDir

if (-Not (Test-Path "$InfraDir/.env")) {
  Write-Error "Falta $InfraDir/.env. Copia .env.example y ajusta valores."
  exit 1
}

docker compose --env-file "$InfraDir/.env" -f "$InfraDir/compose.yml" build
docker compose --env-file "$InfraDir/.env" -f "$InfraDir/compose.yml" up -d

Write-Host "Servicios levantados: Postgres (5432) y MinIO (9000/9001)"