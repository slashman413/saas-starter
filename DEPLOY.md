# Deploy — as close to one-click as a full-stack app gets

This app is a real Next.js server + PostgreSQL, so it can't run on GitHub Pages.
The flow below gets you a live, permanent instance with a stable URL.

## Option A — One-click button (recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fslashman413%2Fsaas-starter&project-name=saas-starter&repository-name=saas-starter&env=AUTH_SECRET&envDescription=Random%2032-byte%20secret%20for%20session%20encryption&envLink=https%3A%2F%2Fgenerate-secret.vercel.app%2F32&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D)

What happens, in order:

1. **Log in with GitHub** → Vercel clones `saas-starter` into your account.
2. **Create database** → the flow offers a **Neon Postgres** store; click *Create*. Vercel injects `DATABASE_URL` for you.
3. **AUTH_SECRET** → click the *Generate* link on the form ([generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)), copy the value, paste it.
4. **Deploy.** The `vercel-build` script (`scripts/vercel-setup.mjs`) automatically:
   - `prisma generate`
   - `prisma db push` (creates all tables)
   - seeds the demo org + `owner@acme.test` / `password123` (idempotent — safe on every deploy)
   - `next build`

Done. Open the deployment URL and sign in.

## Option B — I run it for you

Give me a Neon `DATABASE_URL` and a Vercel token and run:

```powershell
$env:DATABASE_URL = "postgresql://...";   # Neon pooled string
$env:VERCEL_TOKEN = "...";                # vercel.com/account/tokens
./scripts/deploy-prod.ps1
```

## Troubleshooting

- **First build skipped the DB** (no store attached yet): the build still succeeds.
  Go to **Project → Storage → Create Database → Postgres (Neon)**, then **Redeploy**.
  `vercel-setup.mjs` will detect `DATABASE_URL` and create + seed the schema.
- **Want to re-seed**: trigger a redeploy; seeding is idempotent and only adds demo
  projects when the org has none.
- **Custom domain / stable URL**: add it under **Project → Domains**.

## Env vars reference

| Var | Required | Source |
|-----|----------|--------|
| `DATABASE_URL` | yes | Auto-injected by the Neon store (or paste a Postgres URL) |
| `AUTH_SECRET` | yes | Generate at generate-secret.vercel.app/32 |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | optional | Enables Google login if both are set |
