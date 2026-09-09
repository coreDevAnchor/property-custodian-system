#!/usr/bin/env python3
"""Build DEPLOY.docx, a reader-facing deployment guide for the Property Custodian app.

Run from repo root:  python docs/build_deploy_docx.py
Output: DEPLOY.docx (repo root). Requires python-docx:  pip install python-docx
"""

from pathlib import Path

from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "DEPLOY.docx"

ENV_VARS = [
    ("APP_ENV", "production"),
    ("APP_DEBUG", "false"),
    ("APP_KEY", "___  Generate: in the Render shell run  php artisan key:generate --show"),
    ("APP_URL", "https://coredevpcs.onrender.com"),
    ("TZ", "Asia/Manila"),
    ("DB_CONNECTION", "pgsql"),
    ("DB_HOST", "ep-soft-frog-b31ccs2s-pooler.c-4.ap-southeast-1.aws.neon.tech"),
    ("DB_PORT", "5432"),
    ("DB_DATABASE", "neondb"),
    ("DB_USERNAME", "neondb_owner"),
    ("DB_PASSWORD", "___  Copy from the Neon connection modal"),
    ("FILESYSTEM_DISK", "r2"),
    ("R2_ACCESS_KEY_ID", "___  Cloudflare R2 API token"),
    ("R2_SECRET_ACCESS_KEY", "___  Cloudflare R2 API token"),
    ("R2_BUCKET", "property-custodian-system"),
    ("R2_ENDPOINT", "https://f739b2736f11fcda69d3f89a2b6b8b3c.r2.cloudflarestorage.com"),
    ("SESSION_DRIVER", "database"),
    ("SESSION_LIFETIME", "120"),
    ("SESSION_SECURE_COOKIE", "true"),
    ("CACHE_STORE", "database"),
    ("QUEUE_CONNECTION", "database"),
    ("MAIL_MAILER", "brevo"),
    ("BREVO_API_KEY", "___  Brevo → Developers → API Keys"),
    ("MAIL_FROM_ADDRESS", "coredev.anchorjavearnejo@gmail.com"),
    ("MAIL_FROM_NAME", '"Property Custodian"'),
]

STEPS = [
    (
        "Step 1 — Cloudflare R2 (stores photos)",
        [
            "Log in to Cloudflare and open R2 → Buckets → Create a bucket.",
            "Name it \"property-custodian-system\". Region: APAC (Singapore).",
            "Keep the bucket PRIVATE (public access off). The app serves photos through its own proxy at /storage/{path}, so the frontend never talks to R2 directly.",
            "Open R2 → Manage R2 API Tokens → Create API token. Permission: Object Read & Write, scope: this bucket only.",
            "Copy and keep the Access Key ID and Secret Access Key — you will not see the secret again.",
            "Your endpoint is https://<your-account-id>.r2.cloudflarestorage.com (the Account ID is in your Cloudflare dashboard).",
        ],
    ),
    (
        "Step 2 — Neon (PostgreSQL database)",
        [
            "Create a free account at console.neon.tech → New project.",
            "Region: Singapore (ap-southeast-1). The free plan is enough.",
            "In the connection modal, copy the POOLED connection string (it uses port 5432 and a host ending in -pooler.neon.tech). You need the host name, database name and password for the env vars.",
        ],
    ),
    (
        "Step 3 — Render (the web service that runs the app)",
        [
            "Create a free account at render.com → New → Web Service.",
            "Connect your Git repo and choose the branch to deploy.",
            "Runtime: Docker (Render builds the repo's Dockerfile automatically).",
            "Instance type: Free.",
            "Coat the service with the env vars in the table below, then Deploy.",
            "First boot automatically runs database migrations and seeds the built-in data (see docker/entrypoint.sh).",
        ],
    ),
    (
        "Step 4 — Pinger (keeps the free service awake)",
        [
            "Render's free tier sleeps after 15 minutes of no traffic and takes 30–60 s to wake up. A pinger poaches that.",
            "Use UptimeRobot (free) — HTTP(S) monitor, interval 10 min — or cron-job.org firing a GET every 10 minutes.",
            "URL to hit: https://coredevpcs.onrender.com/login",
            "This also keeps the 09:00 daily return-reminder mail running.",
        ],
    ),
    (
        "Step 5 — Verify after deploy",
        [
            "Open https://coredevpcs.onrender.com/login and register / sign in.",
            "Trigger a verification / OTP email and confirm it lands in the inbox (uses Brevo).",
            "Upload a photo against an asset, then open its /storage/assets/... URL — the image should render.",
            "Open the custodian dashboard — the stats and recent activity render (no 502).",
        ],
    ),
]

VERIFY_TABLE = [
    ("Check", "What should happen"),
    ("Sign in", "Dashboard loads, no 500 or 502"),
    ("Send OTP email", "Verification mail arrives on any address"),
    ("Upload asset photo", "Photo is viewable via /storage/assets/..."),
    ("Custodian dashboard", "Stats + recent activity render"),
]


def set_normal_style(doc: Document) -> None:
    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(11)
    normal.paragraph_format.space_after = Pt(6)


def add_code(doc: Document, text: str) -> None:
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.font.name = "Consolas"
    run.font.size = Pt(10)
    p.paragraph_format.space_after = Pt(4)


def add_step(doc: Document, heading: str, bullets: list[str]) -> None:
    doc.add_heading(heading, level=1)
    for i, bullet in enumerate(bullets, 1):
        p = doc.add_paragraph()
        p.add_run(f"{i}. ").bold = True
        p.add_run(bullet)


def add_env_table(doc: Document) -> None:
    table = doc.add_table(rows=1, cols=2)
    table.style = "Table Grid"
    hdr = table.rows[0].cells
    hdr[0].text = "Variable"
    hdr[1].text = "Your value"
    for cell in hdr:
        for p in cell.paragraphs:
            p.add_run().font.bold = True
    for name, value in ENV_VARS:
        row = table.add_row().cells
        row[0].text = name
        row[1].text = value
    doc.add_paragraph("Secrets are left as ___ — fill them in from the account dashboards. Then press Save & Deploy.")


def main() -> None:
    doc = Document()
    set_normal_style(doc)

    title = doc.add_heading(0)
    title.add_run("Deploying the Property Custodian System")
    sub = doc.add_paragraph()
    sub.add_run(
        "A step-by-step guide to getting the app live on Render's free tier, "
        "with a NeoN PostgreSQL database and Cloudflare R2 for photo storage. "
        "Allow about 30 minutes the first time."
    )
    sub.alignment = WD_ALIGN_PARAGRAPH.LEFT

    doc.add_heading("What you need", level=1)
    for item in ["Cloudflare account", "Neon account", "Render account", "Brevo account", "UptimeRobot account (optional but recommended)"]:
        doc.add_paragraph(item, style="List Bullet")

    for heading, bullets in STEPS:
        add_step(doc, heading, bullets)

    doc.add_heading("Environment variables (paste into Render)", level=1)
    doc.add_paragraph(
        "Render web service → Environment → add each line below. "
        "Everything already filled in stays as-is."
    )
    add_code(
        doc,
        "APP_ENV=production\nAPP_DEBUG=false\nAPP_URL=https://coredevpcs.onrender.com\nTZ=Asia/Manila"
    )
    add_env_table(doc)

    doc.add_heading("Email note", level=1)
    doc.add_paragraph(
        "Mail goes through Brevo's API (not SMTP — free Render egress blocks Gmail-style SMTP). "
        "After adding BREVO_API_KEY, verify the sender address coredev.anchorjavearnejo@gmail.com "
        "in Brevo → Settings → Senders. A 401 means a wrong API key; a 400 \"sender not verified\" means the sender step is pending."
    )

    doc.add_heading("Changed frontend code?", level=1)
    doc.add_paragraph(
        "The Docker image ships pre-built frontend assets from public/build (no Node in the container). "
        "Before pushing a deploy after frontend changes, rebuild and commit them:"
    )
    add_code(
        doc,
        "pnpm install --frozen-lockfile\npnpm run build\ngit add public/build\ngit commit -m \"build: assets\"\n"
    )

    doc.add_heading("Quick verify", level=1)
    for label, what in VERIFY_TABLE[1:]:
        p = doc.add_paragraph()
        p.add_run(f"{label}: ").bold = True
        p.add_run(what)

    doc.save(OUT)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()