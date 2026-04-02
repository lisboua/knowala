#!/bin/bash
# =============================================================================
# setup-domain.sh — Configura domínio, HTTPS e reinicia o Knowala
# Rodar na sua máquina local: bash scripts/setup-domain.sh
# =============================================================================
set -e

SERVER_IP="178.104.83.238"
SERVER_USER="root"
APP_DIR="/var/www/knowala"
SSH_KEY="$HOME/.ssh/knowala_hetzner"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=accept-new"
DOMAIN="knowala.com"

echo "======================================"
echo " Knowala — Configurando Domínio + SSL"
echo " Domínio: $DOMAIN"
echo "======================================"

read -p "Informe seu email para o certificado SSL: " EMAIL
if [[ -z "$EMAIL" ]]; then
  echo "ERRO: Email é obrigatório para o certificado SSL."
  exit 1
fi

echo ""
echo "[1/4] Atualizando Nginx com o domínio..."
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "
  sed -i 's|server_name .*|server_name $DOMAIN www.$DOMAIN;|' /etc/nginx/sites-available/knowala
  nginx -t && systemctl reload nginx
  echo '✓ Nginx atualizado'
"

echo ""
echo "[2/4] Atualizando NEXTAUTH_URL no .env.production..."
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "
  sed -i 's|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://$DOMAIN|' $APP_DIR/.env.production
  echo '✓ NEXTAUTH_URL atualizado'
"

echo ""
echo "[3/4] Instalando certificado SSL (Let's Encrypt)..."
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "
  apt install -y certbot python3-certbot-nginx -qq
  certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect
  echo '✓ SSL configurado'
"

echo ""
echo "[4/4] Reiniciando aplicação..."
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "
  pm2 restart knowala
  echo '✓ PM2 reiniciado'
"

echo ""
echo "======================================"
echo " Pronto!"
echo " Acesse: https://$DOMAIN"
echo "======================================"
