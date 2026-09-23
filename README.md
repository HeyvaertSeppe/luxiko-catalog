# LUXIKO catalog 2027

This repo has three parts:

| | What | Where |
|---|---|---|
| **Printable catalog** | The A4 catalog in the original LUXIKO style. Every product has a QR code; the spec tables are gone. | `catalog/LUXIKO_Product_Catalog_2027.pdf` |
| **Product website** | Scanning a QR code opens the product page: photos, full specs, DMX modes, downloads for grandMA2 / grandMA3 / ChamSys / Avolites, a quote form and a share button with a short link | `/`, `/p/<CODE>`, `/s/<short>` |
| **Admin** | Google sign-in, product list, spec / feature / DMX editor, photo and library-file uploads, quote requests, console logos, PDF download | `/admin` |

All 247 products and their photos were imported from the original PDF (`LUXIKO_Product_Catalog_2027_K1.pdf`). The import data is in `seed/`.

---

## Contents

1. [Before you start](#1-before-you-start)
2. [Put the code on your server with git](#2-put-the-code-on-your-server-with-git)
3. [Fill in the secrets file](#3-fill-in-the-secrets-file)
4. [Set up Google sign-in](#4-set-up-google-sign-in)
5. [Set up Resend (e-mail)](#5-set-up-resend-e-mail)
6. [Start it with Docker](#6-start-it-with-docker)
7. [Your domain and HTTPS](#7-your-domain-and-https)
8. [Update to a new version](#8-update-to-a-new-version)
9. [Backups](#9-backups)
10. [Using the admin](#10-using-the-admin)
11. [The PDF catalog](#11-the-pdf-catalog)
12. [Handy commands and troubleshooting](#12-handy-commands-and-troubleshooting)

---

## 1. Before you start

You need:

- **A Linux server, VM or container with Docker.** Anything that runs Docker works: a VPS (Hetzner, OVH, DigitalOcean…), a Proxmox VM, or a Synology NAS. 1 CPU and 1 GB RAM is enough.
  - *Proxmox LXC container:* turn on **Options → Features → Nesting** (and *keyctl*), otherwise Docker won't start inside it.
- **A domain name** for the catalog, e.g. `catalog.luxiko.be`. Point its DNS **A record** to your server's public IP address.
- A **Google account** (for admin sign-in) and a **Resend account** (for e-mail).

Install Docker and git on the server (Ubuntu / Debian):

```bash
sudo apt update && sudo apt install -y git curl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER     # lets you run docker without sudo
# log out and back in so the group change takes effect
docker --version && docker compose version
```

## 2. Put the code on your server with git

```bash
cd ~
git clone https://github.com/HeyvaertSeppe/luxiko-catalog.git
cd luxiko-catalog
```

**If the repository is private,** GitHub will ask for a login. The easiest option is a read-only **deploy key**:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/luxiko_deploy -N ""
cat ~/.ssh/luxiko_deploy.pub
```

1. Copy the output. On GitHub, open the repo → **Settings → Deploy keys → Add deploy key**, paste it and save. Leave "Allow write access" off.
2. Tell git to use that key, then clone over SSH:

   ```bash
   cat >> ~/.ssh/config <<'EOF'
   Host github.com
     IdentityFile ~/.ssh/luxiko_deploy
   EOF
   git clone git@github.com:HeyvaertSeppe/luxiko-catalog.git
   cd luxiko-catalog
   ```

> The commands use the `main` branch. If the changes are still on another branch (not merged yet), add `-b <branch-name>` to `git clone`, or run `git checkout <branch-name>` after cloning.

## 3. Fill in the secrets file

All API keys and passwords go in **one file: `.env.local`**. It is listed in `.gitignore`, so it never goes to GitHub, and `git pull` never overwrites it.

```bash
cp .env.example .env.local
nano .env.local          # fill in the values, then Ctrl+O, Enter, Ctrl+X to save
chmod 600 .env.local     # only your user can read it
```

Every setting has a comment. The ones you need:

| Setting | What to fill in |
|---|---|
| `SITE_URL` | `https://catalog.luxiko.be` — your real address. **The QR codes point here.** |
| `SITE_DOMAIN` | `catalog.luxiko.be` — the same domain without `https://` (only for step 7) |
| `AUTH_SECRET` | Run `openssl rand -base64 48` and paste the output |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From step 4 |
| `ADMIN_EMAILS` | Your Google address(es), comma separated. Only these can open the admin. |
| `RESEND_API_KEY`, `MAIL_FROM` | From step 5 |
| `QUOTE_TO_EMAIL` | The inbox that receives quote requests |
| `COMPANY_*` | Optional contact details for the website footer and the PDF back page |

Leave `DATA_DIR` as it is when you use Docker. After you start the app, the admin **Settings** page shows what's still missing.

## 4. Set up Google sign-in

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and create a project, or pick an existing one.
2. Open **APIs & Services → OAuth consent screen**. Choose **External** and fill in the app name (*LUXIKO Catalog*) and your e-mail. You can leave it in *Testing* mode if you add your own address under **Test users**.
3. Open **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorised redirect URI: `https://catalog.luxiko.be/api/auth/callback` (use your domain)
4. Copy the **Client ID** and **Client secret** into `.env.local`.

## 5. Set up Resend (e-mail)

1. Sign up at [resend.com](https://resend.com).
2. Open **Domains → Add domain** and add `luxiko.be`. Add the DNS records Resend shows you at your domain provider, then wait until the domain says *Verified*.
3. Open **API Keys → Create API key** (permission *Sending access*) and put it in `RESEND_API_KEY`.
4. Set `MAIL_FROM` to an address on that domain, e.g. `LUXIKO <offerte@luxiko.be>`.

Quote requests are saved in the admin even before e-mail works.

## 6. Start it with Docker

From the `luxiko-catalog` folder:

```bash
docker compose up -d --build
```

The first build takes a few minutes. When it's done:

```bash
docker compose ps              # should say "running"
docker compose logs -f         # live logs, Ctrl+C to stop watching
```

The site now runs on port **3000**: `http://<server-ip>:3000`. On the first start it fills the database with the 247 products from the original catalog.

The database and all uploaded photos and library files are stored in a Docker **volume** called `catalog-data`. Rebuilding or updating the container keeps it.

## 7. Your domain and HTTPS

The QR codes, Google sign-in and e-mails need the site on `https://your-domain`.

**Option A — built-in HTTPS (recommended if nothing else runs on this server).** This adds a small Caddy web server that gets a free Let's Encrypt certificate automatically.

1. Make sure the DNS A record of your domain points to this server, and ports **80** and **443** are open in your firewall / router.
2. Set `SITE_DOMAIN=catalog.luxiko.be` in `.env.local`.
3. Start with both compose files:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build
   ```

4. Open `https://catalog.luxiko.be`. The first visit can take about 20 seconds while the certificate is created.

Always use the same two `-f` options for later commands, for example `docker compose -f docker-compose.yml -f docker-compose.https.yml logs -f`. Tip: save typing with `alias dc='docker compose -f docker-compose.yml -f docker-compose.https.yml'`.

**Option B — you already have a reverse proxy** (Nginx Proxy Manager, Traefik, Cloudflare Tunnel, Synology…). Use only `docker compose up -d --build` and point your proxy at `http://<server-ip>:3000`. Allow uploads up to 60 MB (for Nginx: `client_max_body_size 60m;`).

## 8. Update to a new version

```bash
cd ~/luxiko-catalog
git pull
docker compose up -d --build        # add the two -f options if you use option A
```

Your products, photos, library files, quotes and `.env.local` stay as they are.

## 9. Backups

Everything you change in the admin lives in the `catalog-data` volume. Back it up regularly:

```bash
cd ~/luxiko-catalog
docker run --rm -v luxiko-catalog_catalog-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/luxiko-backup-$(date +%F).tgz -C /data .
```

To restore a backup (this replaces the current data):

```bash
docker compose down
docker run --rm -v luxiko-catalog_catalog-data:/data -v "$PWD":/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/luxiko-backup-YYYY-MM-DD.tgz -C /data"
docker compose up -d
```

(The volume name starts with the folder name. `docker volume ls` shows the exact name.)

## 10. Using the admin

Open `https://your-domain/admin` and sign in with Google.

- **Products** – search and filter. The MA2 / MA3 / MQ / AVO badges turn navy when that console file is uploaded.
  - 65 products are marked **Review**: their specs were cut off with "…" in the original PDF. Correct them, then untick *Needs review*.
- **Product editor**
  - Basics: code, title, category, series, IP rating and description. Untick *Visible on website* to hide a product.
  - **Specifications**: add, remove and reorder rows.
  - **Features** (Zoom, Prism, CMY…): tick = Yes, untick = No, the bin removes the feature.
  - **DMX modes**.
  - **Photos**: upload several. The star makes a photo the main one. The photos from the old PDF are small (150×110 px), so uploading better ones is worth it.
  - **Console libraries**: upload or replace the file for grandMA2, grandMA3, ChamSys or Avolites. **If a file is missing, its download button is not shown on the website.**
- **Quotes** – every request from the website, with a status. Each request is also e-mailed to `QUOTE_TO_EMAIL`, with Reply-To set to the customer. The customer gets a confirmation e-mail.
- **Settings**
  - **Download catalog PDF**.
  - **Console logos**: upload the official grandMA / ChamSys / Avolites logos. The site ships with neutral placeholder badges.
  - The configuration check.

## 11. The PDF catalog

**The QR codes contain `SITE_URL`.** After you set your real domain, rebuild the PDF before you print:

- In the admin: **Settings → Download catalog PDF**, or
- On the server:

  ```bash
  docker compose exec catalog npm run catalog:pdf -- --out /app/data/catalog.pdf
  docker compose cp catalog:/app/data/catalog.pdf ./LUXIKO_Product_Catalog_2027.pdf
  ```

Every QR code opens `SITE_URL/p/<PRODUCT CODE>`. Hidden products are left out.

## 12. Handy commands and troubleshooting

| Task | Command |
|---|---|
| Show status | `docker compose ps` |
| Live logs | `docker compose logs -f catalog` |
| Restart after editing `.env.local` | `docker compose up -d --force-recreate` |
| Stop | `docker compose down` (your data is kept) |
| Shell inside the container | `docker compose exec catalog sh` |

- **Google says `redirect_uri_mismatch`** – the redirect URI in Google Cloud must be exactly `SITE_URL` + `/api/auth/callback`.
- **"This Google account is not allowed"** – add the address to `ADMIN_EMAILS` and restart.
- **No e-mails** – the admin Quotes page says whether e-mail is configured. Check that the domain is *Verified* in Resend and that `MAIL_FROM` uses that domain.
- **Port 3000 or 80/443 already in use** – change the left number in `ports:` (for example `"8080:3000"`), or use option B in step 7.
- **Changed `.env.local` but nothing happened** – the settings are only read at start: run `docker compose up -d --force-recreate`.

### Running without Docker

Needs Node.js 20.9 or newer. The data is stored in `./data`.

```bash
npm ci
npm run build
npm start          # http://localhost:3000
```

## Project layout

```
app/                  Next.js pages and API routes
  p/[code]/           product page
  s/[slug]/           short-link redirect
  admin/              admin (login + protected panel)
  api/                quote, share, auth and admin endpoints
components/           UI components
lib/                  database, auth, mail (Resend), storage, PDF generator
seed/                 products + photos extracted from the original PDF
deploy/Caddyfile      HTTPS proxy config (optional)
tools/extract_catalog.py   the one-off PDF extractor (Python + PyMuPDF)
scripts/build-catalog.ts   command-line PDF builder
```

## Security notes

- Secrets live only in `.env.local`, which is git-ignored.
- Admin sign-in uses Google OAuth (authorization code flow with PKCE and a state check). Only verified addresses in `ADMIN_EMAILS` get in, and the list is checked again on every request.
- Sessions are signed, httpOnly, SameSite=Lax cookies. Admin API calls from other sites are rejected.
- The quote form has input validation, a honeypot field and a per-IP rate limit. Uploads are size-limited, and images are re-encoded.
