# SaaS Starter — Production-ready Multi-tenant MVP

A batteries-included starting point for a B2B SaaS, built as a real startup MVP and ready to extend.

**Stack:** Next.js 15 (App Router) · TypeScript · PostgreSQL · Prisma · Auth.js (NextAuth v5) · Tailwind CSS

## 🚀 One-click deploy (near-zero config)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fslashman413%2Fsaas-starter&project-name=saas-starter&repository-name=saas-starter&env=AUTH_SECRET&envDescription=Random%2032-byte%20secret%20for%20session%20encryption&envLink=https%3A%2F%2Fgenerate-secret.vercel.app%2F32&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D)

Click the button → it does the rest:

1. **Clone** the repo into your GitHub.
2. **Create database** — a Neon Postgres store is provisioned in the same flow (it injects `DATABASE_URL` automatically). One click.
3. **Paste one secret** — `AUTH_SECRET`; the form links to a generator ([generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)). Copy → paste.

On deploy, `vercel-build` runs `prisma generate` → `prisma db push` → seed automatically, so the tables and a demo login are created for you — **no commands to run**. Live in ~2 clicks + one paste, then sign in with `owner@acme.test` / `password123`.

> If the database step is skipped, the first build still succeeds; just add a Postgres store under **Project → Storage** and redeploy. See [DEPLOY.md](DEPLOY.md).

---

## ✨ Features

| Area | What's included |
|------|-----------------|
| **Auth** | Email/password (bcrypt) + OAuth (Google) via Auth.js, JWT sessions |
| **Multi-tenancy** | `Organization` ↔ `Membership` ↔ `User`; **all data scoped by `organizationId`** |
| **RBAC** | `OWNER` / `ADMIN` / `MEMBER` roles + a central permission matrix (`lib/rbac.ts`) |
| **Billing** | `Subscription` model + Stripe **webhook handler** (skeleton) + plans UI |
| **API keys** | SHA-256-hashed keys, shown once; powers the versioned **public API** `/api/v1/*` |
| **Audit logs** | Every mutation records who/what/when, per org |
| **DX** | Typed API wrapper, Zod validation, Prisma singleton, seed script |

---

## 🏗 System Architecture

```
                 ┌──────────────────────────── Next.js (single deployable) ───────────────────────────┐
  Browser ─────► │  App Router (RSC + Client Components)                                               │
                 │    • Marketing  /                                                                   │
                 │    • Auth       /login /register                                                    │
   API clients   │    • Dashboard  /dashboard /projects /settings/*   ──(fetch)──► Route Handlers      │
       │         │                                                                  (the "API layer")  │
       │         │  middleware.ts ── session guard for /dashboard,/settings                            │
       └────────►│  Public API  /api/v1/*  ── API-key auth (separate from session)                     │
                 └───────────────┬───────────────────────────────────────────────────┬────────────────┘
                                 │ Prisma                                             │ Stripe webhook
                                 ▼                                                    ▼
                          PostgreSQL (Neon/Supabase/RDS)                        Stripe (billing)
```

- **One repo, one deployable.** Route Handlers (`app/api/**/route.ts`) are the backend; no separate server.
- **Tenant isolation** is enforced in `lib/tenant.ts` — every handler resolves `{ userId, organizationId, role }` and queries are always filtered by `organizationId`.
- **Authorization** is centralized in `lib/rbac.ts` (`assertCan(role, "project:write")`).

---

## 📁 File Structure

```
saas-starter/
├── prisma/
│   ├── schema.prisma         # data model (tenancy, RBAC, billing, audit, api keys)
│   └── seed.ts               # demo org + user + projects
├── src/
│   ├── auth.ts               # Auth.js config (credentials + Google, JWT)
│   ├── middleware.ts         # route protection
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── tenant.ts         # session → { userId, organizationId, role }
│   │   ├── rbac.ts           # permissions + can()/assertCan()
│   │   ├── audit.ts          # audit log helper
│   │   ├── api-auth.ts       # API-key generate/verify
│   │   └── api.ts            # route() wrapper, ok()/err(), error mapping
│   ├── components/ui.tsx     # Button/Input/Card primitives
│   └── app/
│       ├── page.tsx                      # landing
│       ├── (auth)/login, register
│       ├── (dashboard)/
│       │   ├── layout.tsx                # tenant-guarded shell + sidebar
│       │   ├── dashboard/                # overview + recent audit activity
│       │   ├── projects/                 # generic CRUD module
│       │   └── settings/{members,api-keys,billing}
│       └── api/
│           ├── auth/[...nextauth]/       # Auth.js
│           ├── register/                 # sign-up (user + org + owner)
│           ├── projects/ , projects/[id] # CRUD (RBAC + audit + tenancy)
│           ├── members/                  # list + invite
│           ├── api-keys/                 # list + create
│           ├── billing/webhook/          # Stripe webhook
│           └── v1/projects/              # PUBLIC API (api-key auth)
```

---

## 🗄 Database Schema (highlights)

- `User`, `Account`, `Session` — Auth.js
- `Organization` — a tenant (unique `slug`)
- `Membership` — `(userId, organizationId, role)` unique; the join + RBAC anchor
- `Invitation` — pending team invites (tokened)
- `Subscription` — 1:1 with org, Stripe-ready (`stripeCustomerId`, `status`, `plan`)
- `ApiKey` — `hashedKey` (SHA-256) + `prefix`; never stores plaintext
- `Project` — **the swappable business entity**, scoped by `organizationId`
- `AuditLog` — `(organizationId, actorId, action, target, metadata)`

---

## 🔌 API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/register` | public | Create user + first org |
| `*` | `/api/auth/*` | — | Auth.js (sign-in, callback, session) |
| GET/POST | `/api/projects` | session + RBAC | List / create projects |
| GET/PATCH/DELETE | `/api/projects/:id` | session + RBAC | Read / update / delete |
| GET/POST | `/api/members` | session + RBAC | List members / invite |
| GET/POST | `/api/api-keys` | session + RBAC | List / create API keys |
| POST | `/api/billing/webhook` | Stripe sig | Sync subscription state |
| GET/POST | `/api/v1/projects` | **API key** | Public API |

---

## 🚀 Getting Started

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env        # set DATABASE_URL + AUTH_SECRET (openssl rand -base64 32)

# 3. Database
npm run db:push             # create tables
npm run db:seed             # demo data → owner@acme.test / password123

# 4. Run
npm run dev                 # http://localhost:3000
```

**Deploy:** push to GitHub → import to **Vercel** → add env vars → point `DATABASE_URL` at a managed Postgres (Neon/Supabase). `npm run build` runs `prisma generate`.

---

## 🧩 Extending it

- **New business module:** copy the `Project` model + `api/projects` handlers + UI; everything (tenancy, RBAC, audit) comes for free.
- **New permission:** add to `PERMISSIONS` in `lib/rbac.ts`, grant it to roles, call `assertCan()`.
- **Real billing:** `npm i stripe`, add `createCheckoutSession()`, uncomment the webhook signature check.
- **Background jobs / email:** drop in Resend (invites) and a queue (Inngest/Trigger.dev).

> Designed as a real MVP: secure-by-default tenant isolation, centralized authz, and clear seams for growth.
