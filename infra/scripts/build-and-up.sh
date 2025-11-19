#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_DIR="${SCRIPT_DIR%/*}"

if [ ! -f "${INFRA_DIR}/.env" ]; then
  echo "ERROR: Falta ${INFRA_DIR}/.env. Copia .env.example y ajusta valores." >&2
  exit 1
fi

docker compose --env-file "${INFRA_DIR}/.env" -f "${INFRA_DIR}/compose.yml" build
docker compose --env-file "${INFRA_DIR}/.env" -f "${INFRA_DIR}/compose.yml" up -d

echo "Servicios levantados: Postgres (5432) y MinIO (9000/9001)"