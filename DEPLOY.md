# Deploying BALANCE to Vercel

The app is configured for **PostgreSQL** in production (Vercel's filesystem is
ephemeral, so SQLite can't be used for live reservations/accounts).

## 1. Push this repo to GitHub

Already done if you cloned from GitHub. Otherwise:

```bash
git init
git add -A
git commit -m "Initial commit"
gh repo create balance-lounge --private --source=. --push
```

## 2. Create a PostgreSQL database

Any managed Postgres works — pick one:

- **Vercel Postgres** (Storage tab in the Vercel dashboard) — easiest, auto-wires `DATABASE_URL`.
- **Neon** (https://neon.tech) — free tier, copy the connection string.
- **Supabase / Railway** — also fine.

Copy the connection string (looks like `postgresql://user:pass@host/db?sslmode=require`).

## 3. Import the project into Vercel

1. https://vercel.com/new → import your GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Build command stays `npm run build`
   (it runs `prisma generate` automatically).
3. Add Environment Variables (Project → Settings → Environment Variables):

   | Name              | Value                                             |
   |-------------------|---------------------------------------------------|
   | `DATABASE_URL`    | your Postgres connection string                   |
   | `AUTH_SECRET`     | a long random string (e.g. `openssl rand -hex 32`)|
   | `ADMIN_USERNAME`  | `admin` (or your choice)                          |
   | `ADMIN_PASSWORD`  | a strong password                                 |
   | `TELEGRAM_BOT_TOKEN` | optional                                       |
   | `TELEGRAM_CHAT_ID`   | optional                                       |
   | `BLOB_READ_WRITE_TOKEN` | auto-added when you connect a Blob store (step 5) |

4. Deploy.

## 4. Tables + demo data — automatic

`vercel.json` sets the build command to:

```
prisma generate && prisma db push --skip-generate && tsx prisma/ensureSeed.ts && next build
```

So on deploy Vercel automatically:

1. creates all tables (`prisma db push`), then
2. runs `ensureSeed` — which seeds the Balance menu, About text, gallery, sample
   reservations and the admin/guest accounts **only if the database is empty**.

Redeploys never wipe your data (seeding is skipped once data exists). The hero /
About photos ship in `public/` and menu photos use the ChoiceQR CDN, so the site is
fully populated after the first deploy — no manual step.

> If `DATABASE_URL` is missing at build time, `db push` fails the build. Make sure the
> Postgres env var is set **before** the first deploy (Vercel Postgres wires it
> automatically; for Neon/Supabase paste it in step 3).

Log in at `https://your-app.vercel.app/admin` with `ADMIN_USERNAME` / `ADMIN_PASSWORD`,
then change the password (top-right **Change password**).

To reseed manually (wipes + reloads) against prod:

```bash
DATABASE_URL="postgresql://...prod..." npm run db:seed
```

## 5. Image uploads — Vercel Blob

Admin photo uploads use **Vercel Blob** (persistent object storage).

1. In the Vercel dashboard: **Storage → Create → Blob**, connect it to the project.
2. This auto-adds the `BLOB_READ_WRITE_TOKEN` env var. Redeploy.

Uploaded photos are then stored in Blob and served from its CDN. The upload route
(`src/app/api/admin/upload/route.ts`) auto-detects the token; without it (local dev)
it falls back to writing into `public/uploads`. The admin photo field also accepts
any external image URL.

## 6. QR code

Point guests to the deployed URL:

```bash
npx qrcode-terminal "https://your-app.vercel.app/menu"
```

---

### Local development with SQLite (offline, no Postgres)

The repo ships Postgres-ready. To run fully offline with SQLite:

1. In `prisma/schema.prisma` set `provider = "sqlite"`.
2. In `.env` set `DATABASE_URL="file:./dev.db"`.
3. `npm run db:reset` (push + seed), then `npm run dev`.

Revert both before deploying to Vercel.
