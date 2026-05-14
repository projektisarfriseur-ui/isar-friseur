# Deploy — Isar Friseur

Project lives at `C:\Users\kanci\isar-friseur-website`.

## 1 · Supabase

1. Go to https://supabase.com → New project → name `isar-friseur` → region `eu-central-1` (Frankfurt) → save the **anon URL** and **service role key**.
2. SQL editor → New query → paste the contents of `supabase/migrations/0001_init.sql` → Run. This creates all tables and seeds services + default opening hours.

## 2 · Resend (email)

1. https://resend.com → API keys → create one.
2. Optional: add `isar-friseur.de` (or whichever domain you buy later) to **Domains** for branded FROM. Until then, leave `EMAIL_FROM` as `Isar Friseur <onboarding@resend.dev>` — works without domain verification.

## 3 · Local `.env.local`

Copy `.env.local.example` → `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_SECRET=pick-any-strong-string
ADMIN_COOKIE_SECRET=32-random-bytes-here
RESEND_API_KEY=re_xxx
EMAIL_FROM=Isar Friseur <onboarding@resend.dev>
EMAIL_REPLY_TO=burhan380@gmail.com
ADMIN_EMAIL=burhan380@gmail.com
NEXT_PUBLIC_SITE_URL=http://localhost:3001
CRON_SECRET=any-random-string
```

Restart `npm run dev`. Booking + admin now hit real DB.

## 4 · Vercel project

```bash
cd C:\Users\kanci\isar-friseur-website

# log in once (browser flow)
vercel login

# switch to the right team
vercel switch marosove-projekty

# link this folder to a NEW project named "isar-friseur"
vercel link --yes --project isar-friseur
```

If `vercel link` complains the project doesn't exist, run `vercel` once (it will prompt to create — answer "Y" and name it `isar-friseur`).

## 5 · Push env vars to Vercel

Run each line; paste the value when prompted; pick **Production, Preview, Development** for each:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ADMIN_SECRET
vercel env add ADMIN_COOKIE_SECRET
vercel env add RESEND_API_KEY
vercel env add EMAIL_FROM
vercel env add EMAIL_REPLY_TO
vercel env add ADMIN_EMAIL
vercel env add CRON_SECRET
```

For `NEXT_PUBLIC_SITE_URL` — set it AFTER first deploy, once Vercel hands you the production URL (e.g. `https://isar-friseur.vercel.app`):

```bash
vercel env add NEXT_PUBLIC_SITE_URL
```

## 6 · Deploy

```bash
vercel --prod
```

That's it. Crons (24h + 1h reminders) auto-register from `vercel.json`.

## 7 · First-run sanity

After deploy:

1. Open `https://isar-friseur.vercel.app/admin/login` → enter `ADMIN_SECRET` → dashboard loads.
2. Go to **STYLISTS** → add your team (name, role, optional photo URL, allowed services).
3. Go to **HOURS** → confirm opening hours, add any vacation closures.
4. Go to **SERVICES** → tweak prices/durations if needed.
5. Open `https://isar-friseur.vercel.app/booking` → run a test booking with your own email.
6. Check inbox for confirmation link → click → status flips to `confirmed`.

## Notes

- **Vercel domain only for now.** Default URL = `isar-friseur.vercel.app`. To add a real domain later: `vercel domains add isar-friseur.de` then point DNS.
- **Cron timing:** 24h reminder fires at 09:00 UTC daily (= 10:00 / 11:00 Berlin depending on DST). 1h reminder runs every 15 min.
- **Cancel policy** is editable from `/admin/settings` (`cancel_policy_de` / `cancel_policy_en` fields).
- **Walk-ins:** `/admin/bookings` lets you add walk-ins (same table, flagged `is_walkin`).
