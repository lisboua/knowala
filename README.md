# Knowala

Plataforma brasileira de "pergunta do dia". Uma pergunta, infinitas perspectivas.

## Tecnologias

- **Next.js 14+** com App Router e TypeScript
- **PostgreSQL** com Prisma ORM
- **Redis** para rate limiting e cache
- **NextAuth.js v5** para autenticação (Google OAuth + e-mail/senha)
- **Tailwind CSS** para estilização

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose (para banco de dados e Redis)

## Setup Rápido

### 1. Clone e instale dependências

```bash
cd knowala
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
# Edite o .env.local com suas configurações
```

### 3. Suba os serviços com Docker

```bash
# Apenas banco de dados e Redis (para desenvolvimento)
docker compose up db redis -d
```

### 4. Configure o banco de dados

```bash
npm run db:generate   # Gera o Prisma Client
npm run db:push       # Cria as tabelas (dev)
# ou
npm run db:migrate    # Cria e aplica migrations
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|---|---|---|
| `DATABASE_URL` | URL de conexão PostgreSQL | Sim |
| `REDIS_URL` | URL de conexão Redis | Sim |
| `NEXTAUTH_SECRET` | Secret para NextAuth (32+ chars) | Sim |
| `NEXTAUTH_URL` | URL base da aplicação | Sim |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Sim |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Sim |
| `SMTP_HOST` | Host do servidor SMTP | Sim |
| `SMTP_PORT` | Porta SMTP (padrão: 587) | Não |
| `SMTP_USER` | Usuário SMTP | Sim |
| `SMTP_PASS` | Senha SMTP | Sim |
| `SMTP_FROM` | E-mail remetente | Não |

## Criar Usuário Admin

Após o cadastro, execute no banco:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'seu@email.com';
```

Ou via Prisma Studio:
```bash
npm run db:studio
```

## Scripts

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run db:generate  # Gera Prisma Client
npm run db:migrate   # Cria e aplica migrations
npm run db:push      # Push direto (dev)
npm run db:studio    # Abre Prisma Studio
```

## Deploy com Docker

```bash
# Build e start de todos os serviços
docker compose up -d

# Ver logs
docker compose logs -f app
```

## Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── page.tsx            # Home - pergunta do dia (SSR)
│   ├── (auth)/             # Páginas de auth (login, registro)
│   ├── profile/[username]/ # Perfil público
│   ├── admin/              # Painel administrativo
│   └── api/                # API Routes
├── components/             # Componentes React
├── lib/                    # Utilitários (auth, db, redis, etc.)
└── types/                  # Tipos TypeScript
```

## Licença

Proprietário — Todos os direitos reservados.
