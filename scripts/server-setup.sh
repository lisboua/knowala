#!/bin/bash
# =============================================================================
# server-setup.sh — Configura o servidor Hetzner do zero para o Knowala
# Rodar UMA VEZ na sua máquina local: bash scripts/server-setup.sh
# =============================================================================
set -e

SERVER_IP="178.104.83.238"
SERVER_USER="root"
APP_DIR="/var/www/knowala"
DB_NAME="knowala"
DB_USER="knowala_user"
SSH_KEY="$HOME/.ssh/knowala_hetzner"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=accept-new"

echo "======================================"
echo " Knowala — Setup do Servidor"
echo " Servidor: $SERVER_USER@$SERVER_IP"
echo "======================================"

# Pede senha do banco antes de começar
echo ""
read -s -p "Defina uma senha para o banco de dados PostgreSQL: " DB_PASS
echo ""
if [[ -z "$DB_PASS" ]]; then
  echo "ERRO: A senha não pode ser vazia."
  exit 1
fi

echo ""
echo "[1/5] Instalando dependências do sistema..."
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "
  export DEBIAN_FRONTEND=noninteractive
  apt update -qq && apt upgrade -y -qq

  # Node.js 20
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null
  apt install -y nodejs > /dev/null

  # PostgreSQL, Redis, Nginx
  apt install -y postgresql postgresql-contrib redis-server nginx > /dev/null

  # PM2
  npm install -g pm2 > /dev/null

  # Habilitar Redis na inicialização
  systemctl enable redis-server
  systemctl start redis-server

  echo '✓ Dependências instaladas'
"

echo ""
echo "[2/5] Configurando banco de dados..."
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "
  sudo -u postgres psql -c \"CREATE DATABASE $DB_NAME;\" 2>/dev/null || echo 'DB já existe'
  sudo -u postgres psql -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';\" 2>/dev/null || echo 'Usuário já existe'
  sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;\"
  sudo -u postgres psql -c \"ALTER DATABASE $DB_NAME OWNER TO $DB_USER;\"
  echo '✓ Banco de dados configurado'
"

echo ""
echo "[3/5] Criando diretório da aplicação..."
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "
  mkdir -p $APP_DIR
  echo '✓ Diretório criado: $APP_DIR'
"

echo ""
echo "[4/5] Configurando Nginx..."
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "
  cat > /etc/nginx/sites-available/knowala << 'NGINX'
server {
    listen 80;
    server_name $SERVER_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

  ln -sf /etc/nginx/sites-available/knowala /etc/nginx/sites-enabled/knowala
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
  echo '✓ Nginx configurado'
"

echo ""
echo "[5/5] Criando arquivo .env no servidor..."

# Gera um NEXTAUTH_SECRET aleatório
NEXTAUTH_SECRET=$(openssl rand -base64 32)

ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "
  cat > $APP_DIR/.env.production << 'ENVEOF'
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=http://$SERVER_IP
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
ENVEOF
  chmod 600 $APP_DIR/.env.production
  echo '✓ .env.production criado'
"

echo ""
echo "======================================"
echo " Setup concluído!"
echo ""
echo " PRÓXIMOS PASSOS:"
echo " 1. Preencha as variáveis restantes no servidor:"
echo "    ssh $SERVER_USER@$SERVER_IP 'nano $APP_DIR/.env.production'"
echo "    (Google OAuth, SMTP)"
echo ""
echo " 2. Rode o deploy:"
echo "    bash scripts/deploy.sh"
echo "======================================"
