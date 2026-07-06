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

4. Deploy.

## 4. Create the tables + seed demo data (once)

The build does **not** touch the database. After the first deploy, push the schema
and seed from your machine using the **production** `DATABASE_URL`:

```bash
# pull the prod env vars locally (or paste DATABASE_URL inline)
vercel env pull .env.production.local          # optional convenience

DATABASE_URL="postgresql://...prod..." npx prisma db push
DATABASE_URL="postgresql://...prod..." npm run db:seed
```

`db push` creates all tables; `db:seed` loads the Balance menu, About text, sample
reservations and the admin/guest accounts. Re-running the seed **wipes and reloads** data.

Log in at `https://your-app.vercel.app/admin` with `ADMIN_USERNAME` / `ADMIN_PASSWORD`,
then change the password (top-right **Change password**).

## 5. Image uploads (note)

Admin photo uploads are written to `public/uploads`, which is **not persistent** on
Vercel. For production images either:

- paste an external image URL in the admin photo field (works out of the box), or
- switch the upload route (`src/app/api/admin/upload/route.ts`) to object storage
  (Vercel Blob, S3, or Cloudinary).

Seeded menu photos already point at the ChoiceQR CDN, so the demo looks complete
without uploads.

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
