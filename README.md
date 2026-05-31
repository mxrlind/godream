# GoDream Platform

Plataforma educacional gamificada — Next.js 15 + NestJS + PostgreSQL + Prisma

## Stack

- **Frontend:** Next.js 15 (App Router) · React 19 · TypeScript · TailwindCSS · Framer Motion · Zustand · TanStack Query
- **Backend:** NestJS 10 · TypeScript · Passport.js (JWT + OAuth) · Bull Queues
- **Database:** PostgreSQL 16 · Prisma ORM
- **Storage:** MinIO (local) / Cloudflare R2 (prod)
- **Video:** Mux
- **Payments:** Stripe + Mercado Pago
- **Realtime:** Socket.IO
- **Infra:** Docker Compose · Turborepo · pnpm workspaces

## Início rápido (desenvolvimento)

### Pré-requisitos
- Node.js >= 20
- pnpm >= 9
- Docker Desktop

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar ambiente

```bash
cp .env.example .env   # Edite os valores necessários
# ou use o .env já criado para desenvolvimento local
```

### 3. Subir serviços (Docker)

```bash
docker-compose up -d postgres redis minio
```

### 4. Banco de dados

```bash
cd packages/database
pnpm db:generate    # Gerar cliente Prisma
pnpm db:migrate:dev # Criar tabelas
pnpm db:seed        # Inserir dados demo
```

### 5. Rodar tudo

```bash
pnpm dev   # Turbo inicia api + web juntos
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001
- **Swagger:** http://localhost:3001/docs
- **MinIO:** http://localhost:9001 (minioadmin/minioadmin)

## Credenciais Demo

| Papel   | Email                  | Senha              |
|---------|------------------------|--------------------|
| Admin   | admin@godream.io       | Admin@GoDream2026! |
| Creator | lucas@godream.io       | Creator@Demo123!   |
| Student | neocoder@godream.io    | Student@Demo123!   |

## Estrutura do projeto

```
godream-platform/
├── apps/
│   ├── api/          # NestJS API
│   └── web/          # Next.js Frontend
├── packages/
│   └── database/     # Prisma schema + seed
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## Módulos backend

| Módulo         | Status | Descrição                                      |
|----------------|--------|------------------------------------------------|
| Auth           | ✅     | JWT · Refresh tokens · OAuth (Google/GitHub/Discord) |
| Users          | ✅     | Perfil · Atualização · Busca                   |
| Courses        | ✅     | CRUD · Busca · Matrícula · Avaliações          |
| Lessons        | ✅     | Progresso · Conclusão · XP automático          |
| Gamification   | ✅     | XP · Nível · Streak · Badges · Missões · Battle Pass · Loja |
| Payments       | ✅     | Stripe Checkout · Webhooks · Payout creator    |
| Social         | ✅     | Feed · Posts · Comentários · Likes · Follow    |
| Notifications  | ✅     | CRUD · Marcar como lida                        |
| Search         | ✅     | Busca unificada cursos + usuários              |
| Analytics      | ✅     | Stats creator + plataforma                     |
| Admin          | ✅     | Usuários · Cursos · Creators · Reports         |
| Quizzes        | 🔄     | Em desenvolvimento                             |
| Certificates   | 🔄     | Em desenvolvimento                             |
| Storage        | ✅     | S3/MinIO upload · Signed URLs                  |

## Páginas frontend

| Rota                        | Componente                |
|-----------------------------|---------------------------|
| /                           | Redireciona para /dashboard |
| /auth/login                 | LoginForm                 |
| /auth/register              | RegisterForm              |
| /auth/callback              | OAuthCallback             |
| /dashboard                  | DashboardPage             |
| /courses                    | CoursesPage               |
| /courses/[slug]             | CourseDetailPage          |
| /courses/[slug]/learn/[id]  | LessonPage + LessonPlayer |
| /missions                   | MissionsPage              |
| /rank                       | RankPage                  |
| /badges                     | BadgesPage                |
| /shop                       | ShopPage                  |
| /battle-pass                | BattlePassPage            |
| /community                  | CommunityPage             |
| /profile                    | ProfilePage               |
| /creator                    | CreatorDashboard          |
| /admin                      | AdminDashboard            |
