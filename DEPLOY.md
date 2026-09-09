# Production Deploy Runbook: Render (free) + Neon + Cloudflare R2

Free tier stack. App: Laravel + Inertia/React + PostgreSQL. Session/cache/queue in DB.
Photos on Cloudflare R2, served through a Laravel proxy at `/storage/{path}` so the
frontend never changes.

## Free-tier reality (read first)

| Constraint | Impact | Mitigation |
|---|---|---|
| Render free service sleeps after 15 min idle | 30–60s cold start; 09:00 reminder only fires while awake | Pinger every ~10 min (UptimeRobot) keeps it awake |
| 750 free instance-hours/mo | Continuous run = ~744h | Fits; reset monthly. Long downtime can underrun safely |
| Neon free 0.5GB | session/cache tables grow in DB | occasional `php artisan cache:clear` |
| Render free Postgres deleted after 90 days | n/a — we use Neon, which persists | — |
| Container FS is ephemeral | photo uploads must NOT live on disk | R2 disk (`FILESYSTEM_DISK=r2`) |

## 1. Cloudflare R2 (photos)

1. Log in to Cloudflare → **R2 → Buckets → Create bucket** → `property-custodian-assets`, region `APAC` (Singapore).
2. Keep bucket **private** (`public access: off`). Access is controlled by the app proxy.
3. Create API token: **Manage R2 API Tokens → Create** → Object Read & Write, scope = that bucket.
4. Save `Access Key ID` + `Secret Access Key`. Endpoint = `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   (Account ID shown in the token URL / dashboard sidebar).

## 2. Neon (PostgreSQL)

1. [console.neon.tech](https://console.neon.tech) → **New project**, region `Singapore (ap-southeast-1)`, Postgres 16.
2. From the connection modal, copy the **pooled connection string** (port 5432, `-pooler` host) — use it for the web app.
3. Note: with the pinger awake, the DB stays warm; Neon autosuspend is fine either way.

## 3. Render (web service)

1. [render.com](https://render.com) → **New → Web Service**, connect the Git repo/Branch.
   - Runtime: **Docker** (uses the repo `Dockerfile`).
   - Instance: **Free**.
2. Add env vars (below). Secrets only here — never commit `.env`.
3. Deploy. First boot runs `php artisan migrate --force` automatically (see `docker/entrypoint.sh`).

### Env vars

```
APP_ENV=production
APP_DEBUG=false
APP_KEY=<php artisan key:generate --show>
APP_URL=https://<service-name>.onrender.com
TZ=Asia/Manila

# Neon (pooled connection URL)
DB_CONNECTION=pgsql
DB_HOST=<cluster>-pooler.neon.tech
DB_PORT=5432
DB_DATABASE=neondb
DB_USERNAME=<user>
DB_PASSWORD=<password>

# Cloudflare R2
FILESYSTEM_DISK=r2
R2_ACCESS_KEY_ID=<access-key>
R2_SECRET_ACCESS_KEY=<secret>
R2_BUCKET=property-custodian-assets
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com

# DB-backed session/cache/queue (unchanged from local)
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true
CACHE_STORE=database
QUEUE_CONNECTION=database

# Email — Gmail SMTP with a Gmail App Password
# First enable Google Account → Security → 2-Step Verification, then create an App Password.
# MAIL_PASSWORD is the 16-char app password.
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_USERNAME=<your-gmail-address>
MAIL_PASSWORD=<gmail-app-password>
MAIL_FROM_ADDRESS=<your-gmail-address> # real address you authenticate with, not a fake domain
MAIL_FROM_NAME="Property Custodian"

## 4. Pinger (keeps service awake + 09:00 reminder)

- [UptimeRobot](https://uptimerobot.com) free monitor (HTTP(S), interval 10 min) OR
  [cron-job.org](https://cron-job.org) GET every 10 min → `https://<service>.onrender.com/login`.

## 5. Verify after deploy

```bash
# In Render shell:
php artisan migrations:status
php artisan schedule:list        # should show reminders:send-return dailyAt 09:00 Asia/Manila
php artisan reminders:send-return  # manual smoke test of email path (offscreen 535 = bad MAIL_PASSWORD)
```

- Register/login.
- Upload an asset photo → `GET /storage/assets/...` returns the image (proxied from R2).
- Visit a page that lists assets with photos.
- Delete/replace a photo → object removed from R2.

## Troubleshooting

- **502 / static assets 404 after first boot** → check the service log for failed `migrate` or
  `config:cache` (bad env var). `APP_KEY` missing is the usual suspect.
- **`/storage/...` returns 404** → proxy route requires the exact bucket path. Re-upload the photo.
- **Queue of emails not sending** → 535 auth failure means the app password is wrong or was
  revoked; generate a new one. 2-Step Verification must be on or no app password exists.
  Gmail rejects `550 5.1.7 Sender address rejected` when `MAIL_FROM_ADDRESS` is a domain you
  don't own — set it to exactly `MAIL_USERNAME`. Gmail caps ~500 emails/day per account —
  reminders are a few/day, no issue here. Always `php artisan config:clear` after env changes.
- **Photos lost** — should be impossible on R2. If they appear lost, confirm `FILESYSTEM_DISK=r2`
  actually took effect (`php artisan tinker --execute="echo config('filesystems.disks.public.driver');"`).
- **Service suspended mid-month** → ran past 750 free hours (two instances or heavy restarts).
  Check Render billing page; wait for reset or let it sleep more.

## When you change frontend code

Vite assets are **prebuilt and committed** under `public/build` (the Docker image does not
run a node build — see `Dockerfile`). Before pushing a deploy, regenerate them:

```bash
pnpm install --frozen-lockfile
pnpm run build
git add public/build
git commit -m "build: assets"
```

Otherwise Render serves stale JS/CSS.

## Local dev is unaffected

- `R2_BUCKET` empty locally → `public` disk stays `local`; `/storage` still hits `public/storage`
  via `php artisan storage:link`.
- New route `GET /storage/{path}` (StorageController) only activates when static file is absent,
  so normal local behavior is unchanged. Vendor Laravel `/storage` routes disabled (`serve` removed
  from the `local` disk) — nothing used them.