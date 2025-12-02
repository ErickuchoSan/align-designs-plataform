#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/align-designs-platform}"
INFRA_DIR="$REPO_DIR/infra"

sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release; echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin git
sudo usermod -aG docker "$USER"

if [ ! -d "$REPO_DIR" ]; then
  echo "Clona el repositorio en $REPO_DIR antes de continuar" >&2
  exit 1
fi

if [ ! -f "$INFRA_DIR/.env" ]; then
  echo "ERROR: Falta $INFRA_DIR/.env. Copia .env.example y ajusta valores." >&2
  exit 1
fi

docker compose --env-file "$INFRA_DIR/.env" -f "$INFRA_DIR/compose.yml" pull
docker compose --env-file "$INFRA_DIR/.env" -f "$INFRA_DIR/compose.yml" build
docker compose --env-file "$INFRA_DIR/.env" -f "$INFRA_DIR/compose.yml" up -d

echo "Postgres en 5432 y MinIO en 9000/9001 levantados"