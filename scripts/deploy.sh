#!/bin/bash
# =============================================================================
# deploy.sh — Faz deploy do Knowala para o servidor Hetzner
# Rodar na sua máquina local: bash scripts/deploy.sh
# =============================================================================
set -e

SERVER_IP="178.104.83.238"
SERVER_USER="root"
APP_DIR="/var/www/knowala"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SSH_KEY="$HOME/.ssh/knowala_hetzner"

echo "======================================"
echo " Knowala — Deploy"
echo " Servidor: $SERVER_USER@$SERVER_IP"
echo " Origem:   $LOCAL_DIR"
echo "======================================"

# ── Verifica chave SSH ────────────────────────────────────────────────────────
if [[ ! -f "$SSH_KEY" ]]; then
  echo "ERRO: Chave SSH não encontrada em $SSH_KEY"
  echo "Rode: ssh-keygen -t ed25519 -C 'knowala' -f $SSH_KEY"
  exit 1
fi

SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=accept-new"

# ── 1. Copia código ───────────────────────────────────────────────────────────
echo ""
echo "[1/4] Copiando código..."
rsync -az --progress \
  -e "ssh $SSH_OPTS" \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '.env.production' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  --exclude 'prisma/dev.db' \
  "$LOCAL_DIR/" "$SERVER_USER@$SERVER_IP:$APP_DIR/"

echo "✓ Código enviado"

# ── 2. Instala dependências e faz build ───────────────────────────────────────
echo ""
echo "[2/4] Instalando dependências e buildando..."
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "
  set -e
  cd $APP_DIR

  # Garante que .env aponta para o .env.production
  ln -sf $APP_DIR/.env.production $APP_DIR/.env

  npm install --legacy-peer-deps

  # Gera o Prisma Client
  npx prisma generate

  # Aplica migrations pendentes
  npx prisma migrate deploy

  # Build da aplicação
  npm run build

  echo '✓ Build concluído'
"

# ── 3. Reinicia com PM2 ───────────────────────────────────────────────────────
echo ""
echo "[3/4] Reiniciando PM2..."
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "
  set -e
  cd $APP_DIR

  if pm2 list | grep -q 'knowala'; then
    pm2 restart knowala
  else
    pm2 start npm --name 'knowala' -- start
    pm2 save
  fi

  echo '✓ PM2 reiniciado'
"

# ── 4. Health check ───────────────────────────────────────────────────────────
echo ""
echo "[4/4] Verificando se o servidor está respondendo..."
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://knowala.com" || echo "000")

if [[ "$HTTP_STATUS" == "200" || "$HTTP_STATUS" == "307" || "$HTTP_STATUS" == "302" ]]; then
  echo "✓ Servidor respondendo (HTTP $HTTP_STATUS)"
else
  echo "⚠️  Servidor retornou HTTP $HTTP_STATUS — verifique os logs"
fi

echo ""
echo "======================================"
echo " Deploy concluído!"
echo " Acesse: https://knowala.com"
echo ""
echo " Logs:   ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP 'pm2 logs knowala'"
echo " Status: ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP 'pm2 status'"
echo "======================================"
