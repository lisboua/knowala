# Knowala — Documentação de Negócio

## Funcionalidades Principais

### Para Usuários

| Funcionalidade | Descrição |
|---|---|
| **Pergunta do Dia** | Uma pergunta nova publicada todos os dias às 00:00 (Horário de Brasília) |
| **Respostas** | Cada usuário pode publicar uma única resposta por pergunta |
| **Comentários** | Comentários aninhados (1 nível) em respostas |
| **Votos** | Upvote/downvote em respostas e comentários |
| **Denúncias** | Denunciar conteúdo impróprio com motivo textual |
| **Perfil Público** | Histórico de respostas, badges, Eco Score |
| **Autenticação** | E-mail + senha ou Google OAuth |

### Para Administradores

| Funcionalidade | Descrição |
|---|---|
| **Dashboard** | Visão geral de métricas, denúncias pendentes |
| **Gestão de Perguntas** | Criar, agendar e publicar perguntas |
| **Moderação** | Revisar e resolver denúncias, remover conteúdo |

---

## Arquitetura Técnica

### Stack

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Frontend + Backend** | Next.js 14+ (App Router) | SSR para SEO, Server Components para performance, colocação de frontend e backend simplifica o deploy |
| **Banco de Dados** | PostgreSQL 16 + Prisma ORM | Banco relacional robusto, Prisma oferece type-safety e migrations gerenciadas |
| **Cache + Rate Limiting** | Redis 7 + ioredis | Performance de leitura, rate limiting eficiente em memória |
| **Autenticação** | NextAuth.js v5 (beta) | Suporte nativo a Google OAuth + Credentials, JWT em HttpOnly cookies |
| **Estilização** | Tailwind CSS v3 | Desenvolvimento rápido, bundle mínimo, design system consistente |
| **Validação** | Zod | Type-safe validation em runtime, compatível com TypeScript |
| **Hashing** | bcryptjs (cost 12) | Padrão da indústria para hashing de senhas |
| **E-mail** | Nodemailer | Suporte a múltiplos provedores SMTP |
| **Deploy** | Docker Compose | Orquestração simples de app + db + redis |

### Decisões Arquiteturais

**Server Components como padrão:** A home page e perfis são renderizados no servidor (SSR), o que garante:
- SEO otimizado (conteúdo indexável pelo Google)
- Performance inicial (sem waterfall de requisições)
- Segurança (dados sensíveis ficam no servidor)

**Client Components apenas onde necessário:**
- Formulários interativos (votos, respostas, comentários)
- Componentes com estado local (modais, menus)

**JWT em HttpOnly Cookie:** Os tokens de sessão nunca são expostos ao JavaScript do browser, prevenindo ataques XSS de roubo de sessão.

**Prisma + transações:** Operações que afetam múltiplas tabelas (ex: verificação de e-mail) são executadas em transações para garantir consistência.

**Fail-open no Rate Limiting:** Se o Redis estiver indisponível, as requisições são permitidas. Preferimos disponibilidade à segurança neste caso, pois a aplicação ainda possui validações no nível do banco de dados.

---

## Sistema de Pontuação — Eco Score

O "Eco Score" é a métrica de reputação do Knowala. O nome "Eco" vem de "ecossistema" — usuários que contribuem com qualidade fortalecem o ecossistema da plataforma.

### Regras de Pontuação

| Ação | Pontos |
|---|---|
| Receber upvote em uma **resposta** | **+3** |
| Receber upvote em um **comentário** | **+1** |
| Receber downvote (resposta ou comentário) | **-1** |
| Bônus por sequência de **7 dias respondendo** | **+5** |

**Regra de mínimo:** O Eco Score nunca fica negativo (mínimo: 0).

**Cálculo da Sequência:**
O sistema verifica os dias únicos em que o usuário respondeu perguntas (no horário de Brasília, UTC-3). Uma "semana perfeita" é 7 dias consecutivos. O bônus de +5 é concedido para cada conjunto de 7 dias consecutivos completado.

**Atualização:**
O Eco Score é recalculado a cada voto recebido (de forma assíncrona, sem bloquear a resposta da requisição).

---

## Sistema de Badges (Conquistas)

Badges são concedidas automaticamente pelo sistema quando condições específicas são atendidas.

| Badge | Ícone | Condição |
|---|---|---|
| **Bem-vindo** | 🌱 | Publicou sua primeira resposta |
| **Semana Perfeita** | 🔥 | Respondeu por 7 dias consecutivos |
| **Mês Consistente** | 💪 | Respondeu por 30 dias consecutivos |
| **Debatedor** | 💬 | Publicou mais de 50 comentários |
| **Influente** | ⭐ | Recebeu mais de 100 upvotes no total |
| **Pioneiro** | 🚀 | Um dos primeiros 500 usuários cadastrados |
| **Veterano** | 🏆 | Conta com mais de 1 ano de existência |
| **Bem Recebido** | ✨ | Uma única resposta com 10 ou mais upvotes |

**Verificação:**
As badges são verificadas de forma assíncrona após cada ação relevante do usuário (postar resposta, postar comentário, receber voto). Uma vez concedida, a badge não pode ser revogada.

---

## Política de Moderação de Conteúdo

### Conteúdo Proibido

1. **Links e URLs:** Qualquer link, seja explícito (http://, https://, www.) ou disfarçado (ponto com, dot net, etc.)
2. **Endereços IP**
3. **Discurso de ódio:** Conteúdo que ataque indivíduos ou grupos com base em raça, etnia, gênero, orientação sexual, religião, deficiência ou origem
4. **Spam:** Conteúdo repetitivo, sem relevância para a pergunta

### Fluxo de Moderação

1. Usuário denuncia conteúdo com motivo textual
2. Denúncia fica com status `PENDING`
3. Admin revisa no painel de moderação
4. Admin pode:
   - **Manter o conteúdo** (denúncia improcedente) → status `RESOLVED`
   - **Remover o conteúdo** → conteúdo marcado como `deletedByMod = true`, status `RESOLVED`
5. Conteúdo removido exibe a mensagem: *"Este conteúdo foi removido pela moderação."*

### Limites de Rate Limiting

| Ação | Limite | Janela |
|---|---|---|
| Comentários | 30 | Por hora |
| Votos | 100 | Por hora |
| Denúncias | 20 | Por hora |
| Tentativas de login | 5 | 15 minutos |
| Cadastro | 3 | Por hora (por IP) |

---

## Política de Fuso Horário

**Fuso Oficial:** UTC-3 (Horário de Brasília)

- A "pergunta do dia" é publicada às 00:00 horário de Brasília
- Datas no perfil e histórico são exibidas no horário de Brasília
- O cálculo de sequências de dias usa o horário de Brasília como referência
- Internamente, todos os timestamps são armazenados em UTC no banco de dados

---

## Roadmap Futuro

### Curto Prazo (3-6 meses)

- [ ] **Notificações push** para nova pergunta do dia
- [ ] **E-mail semanal** com resumo da semana
- [ ] **Personalização de perfil** (bio, foto própria)
- [ ] **Busca de perguntas** (histórico)
- [ ] **Compartilhamento** nas redes sociais com preview OG
- [ ] **Moderação automatizada** com IA para triagem inicial de denúncias

### Médio Prazo (6-12 meses)

- [ ] **Tópicos/categorias** para perguntas (Política, Tecnologia, Cultura, etc.)
- [ ] **Seguidores** — seguir usuários e ver suas respostas primeiro
- [ ] **API pública** para parceiros e desenvolvedores
- [ ] **Dashboard de analytics** expandido para admins
- [ ] **Sistema de warnings** para usuários com violações frequentes
- [ ] **App mobile** (React Native)

### Longo Prazo (12+ meses)

- [ ] **Parcerias com mídia** para perguntas patrocinadas por jornais/veículos
- [ ] **Programa de Criadores** — usuários podem sugerir perguntas
- [ ] **Modo Debate** — perguntas com dois lados definidos (pró/contra)
- [ ] **Knowala for Business** — plataforma white-label para empresas
- [ ] **Monetização** via assinatura premium (sem anúncios, mais personalização)

---

## Métricas de Sucesso (KPIs)

| Métrica | Descrição |
|---|---|
| **DAU/MAU** | Usuários ativos diários / mensais |
| **Participation Rate** | % de usuários que responderam hoje vs. usuários ativos |
| **Retention (D7, D30)** | Usuários que voltam após 7 e 30 dias |
| **Streak Length** | Duração média das sequências de respostas |
| **Report Rate** | % de conteúdo denunciado (saúde da moderação) |
| **Answer Quality** | Upvotes médios por resposta |

---

## Segurança

| Medida | Implementação |
|---|---|
| **HttpOnly Cookies** | Tokens de sessão nunca acessíveis via JavaScript |
| **CSRF Protection** | Gerenciado pelo NextAuth.js |
| **SQL Injection** | Prevenido pelo Prisma (queries parametrizadas) |
| **XSS** | sanitize-html antes de armazenar conteúdo |
| **Rate Limiting** | Redis-based em todos os endpoints de mutação |
| **Content Security Policy** | Headers CSP configurados no next.config.ts |
| **Password Hashing** | bcryptjs com cost factor 12 |
| **Email Enumeration** | Resposta idêntica para e-mail válido/inválido no cadastro |
| **Token Expiry** | Tokens de verificação de e-mail expiram em 24 horas |

---

*Documento criado em: Março 2026*
*Versão: 1.0.0*
