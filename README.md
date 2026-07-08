# BALANCE — Coctails & Shisha

Production-ready, multi-page website for the **Balance** hookah & cocktail lounge in Szczecin.
Desktop-first, fully responsive, cinematic dark theme with neon-red / ember accents.

Built with **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion + Prisma**.

---

## Features

- **Home** (`/`) — cinematic hero with neon "YOU'RE IN THE RIGHT PLACE", About (O NAS), location + reservation band, embedded Google map.
- **Menu** (`/menu`) — full menu by categories, sticky tabs, live search, badges (nowość / popularne / 18+), availability.
- **Reservation** (`/booking`) — date/time/guests/name/phone/zone/comment form, slots restricted to opening hours, past dates blocked, confirmation summary, soft "create account" prompt. Works without an account.
- **About / Contact** (`/about`) — expanded About, gallery, map + route button, contacts.
- **Account** (`/account`) — guest signup / login, reservation history, faster re-booking.
- **Admin** (`/admin`) — password-protected panel: reservations management, menu CRUD, bulk price editing, image uploads, site-content + translation editor (PL/RU/EN/UA).
- **i18n** — PL (default) / RU / EN / UA, switch in header, remembered in the browser. Every guest-facing string + all content fields are translatable.
- **Persistence** — Prisma + SQLite (dev) / PostgreSQL (prod). Reservations, accounts, price edits all hit the database — never localStorage.
- **Notifications** — optional Telegram bot ping on every new reservation.

---

## Quick start (local)

Requires Node 18+.

```bash
npm install            # installs deps + generates Prisma client
npm run db:reset       # creates SQLite db, pushes schema, seeds demo data
npm run dev            # http://localhost:3000
```

`npm run db:reset` wipes and reseeds. Use `npm run db:push` + `npm run db:seed` separately if you prefer.

### Default credentials (change on first login)

| Role  | Login                 | Password    |
|-------|-----------------------|-------------|
| Admin | `admin`               | `balance123`|
| Guest | `guest@example.com`   | `guest123`  |

Admin login: **http://localhost:3000/admin** → redirects to `/admin/login`.
Credentials come from `.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`) at seed time.

---

## Environment (`.env`)

```env
DATABASE_URL="file:./dev.db"          # dev SQLite. For prod use a postgres:// URL.
AUTH_SECRET="change-me-in-production" # signs session cookies (JWT)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="balance123"
TELEGRAM_BOT_TOKEN=""                 # optional — new-reservation alerts
TELEGRAM_CHAT_ID=""                   # optional — one id or comma-separated ids
```

**Telegram alerts:** create a bot via [@BotFather](https://t.me/BotFather), get the token,
message your bot, then find your chat id (e.g. via `@userinfobot`). Fill both vars and
restart — every reservation posts to that chat. For multiple recipients, separate ids with
commas, e.g. `6166155438,-1001234567890`. Left blank, notifications are skipped
(logged to the server console instead), booking still works.

---

## Managing the site (admin)

Go to `/admin` and log in.

- **Reservations** — filter by status/date, day-grouped list, one-click Confirm / Seated / Cancel / Delete, guest phone + notes visible.
- **Menu** — add/edit/delete categories and items; per-item translatable name & description (PL/RU/EN/UA), price, photo upload, availability, badges. **Bulk price editing:** change several prices in the table, then "Save all prices".
- **Site content** — address, phone, socials, coordinates, hero, opening hours, gallery, and the translatable About text.

All changes persist to the database and appear instantly on the public site (no redeploy).

---

## Deploy

### Database (production → PostgreSQL)

1. In `prisma/schema.prisma` change `datasource db { provider = "postgresql" }`.
2. Set `DATABASE_URL` to your Postgres connection string.
3. `npx prisma db push` (or `prisma migrate deploy`), then `npm run db:seed` once.

Managed Postgres: **Railway**, **Neon**, **Supabase**, or Vercel Postgres.

### Vercel

1. Push this repo to GitHub.
2. Import into Vercel. Add env vars (`DATABASE_URL`, `AUTH_SECRET`, `ADMIN_*`, optional `TELEGRAM_*`).
3. Build command `npm run build` (runs `prisma generate` automatically). Deploy.

> Uploaded images are written to `public/uploads`. Vercel's filesystem is ephemeral —
> for production image uploads use object storage (S3 / Cloudinary / Vercel Blob) or a
> platform with a persistent disk (**Railway**). The URL field also accepts external image links.

### Railway (app + Postgres together)

Add a PostgreSQL plugin, set the env vars, deploy the service. Persistent volume keeps `public/uploads`.

---

## QR code (for tables / entrance)

Point guests to your deployed URL (menu or home). Generate a QR with any tool, e.g.:

```bash
npx qrcode-terminal "https://your-domain.com/menu"
```

or use https://qr.io / https://www.qr-code-generator.com with `https://your-domain.com`.
Print and place on tables — scanning opens the responsive site (mobile-optimized).

---

## Project structure

```
prisma/
  schema.prisma        # data model (Bar, AboutContent, Category, MenuItem, Reservation, GuestUser, AdminUser)
  seed.ts              # demo menu, reservations, about, admin + guest
src/
  app/
    page.tsx           # Home
    menu/ booking/ about/ account/     # public pages
    admin/             # admin panel + login
    api/               # route handlers (reservations, auth, admin CRUD, upload)
  components/          # header, footer, home sections, menu, booking, account, admin/*
  lib/                 # db, auth (JWT + bcrypt), i18n, notify, utils, data
```

## Tech notes

- **Auth:** signed JWT session cookies (`jose`), passwords hashed with `bcryptjs`. Separate guest and admin sessions.
- **i18n:** UI dictionary in `src/lib/i18n.ts`; content fields stored as JSON `{ pl, ru, en, ua }` and resolved with `tr()`. Language chosen client-side and remembered (localStorage + cookie).
- **Validation:** `zod` on all write endpoints; reservations reject past dates, closed days, and out-of-hours slots.
