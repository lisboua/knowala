#!/bin/bash
# Dispara um e-mail de teste do digest diário
# Uso: ./scripts/test-digest-email.sh email@destino.com

set -e

TO="${1:-}"
if [ -z "$TO" ]; then
  echo "Uso: $0 email@destino.com"
  exit 1
fi

# Carrega variáveis do .env se existir
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | grep CRON_SECRET | xargs)
fi
if [ -f ".env.local" ]; then
  export $(grep -v '^#' .env.local | grep CRON_SECRET | xargs)
fi

if [ -z "$CRON_SECRET" ]; then
  echo "Erro: CRON_SECRET não encontrado no .env ou .env.local"
  exit 1
fi

# Detecta URL base
BASE_URL="${NEXTAUTH_URL:-http://localhost:3000}"

echo "Enviando e-mail de teste para: $TO"
echo "Servidor: $BASE_URL"

RESPONSE=$(curl -s -X POST "${BASE_URL}/api/admin/test-digest" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: ${CRON_SECRET}" \
  -d "{\"to\":\"${TO}\"}")

echo "Resposta: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✓ E-mail enviado com sucesso!"
else
  echo "✗ Falha ao enviar e-mail."
  exit 1
fi
