# LUXIKO catalog 2027

This repo has three parts:

| | What | Where |
|---|---|---|
| **Printable catalog** | A new A4 PDF with a QR code on every product and no spec tables | `catalog/LUXIKO_Product_Catalog_2027.pdf` |
| **Product website** | Scanning a QR code opens the product page: photos, full specs, DMX modes, downloads for grandMA2 / grandMA3 / ChamSys / Avolites, a quote form and a share button with a short link | `/`, `/p/<CODE>`, `/s/<short>` |
| **Admin** | Google sign-in, product list, spec / feature / DMX editor, photo and library-file uploads, quote requests, console logos, PDF download | `/admin` |

The original PDF (`LUXIKO_Product_Catalog_2027_K1.pdf`) was used to import all 247 products and their photos. The import data is in `seed/`.

---

## 1. Fill in your settings (the secrets file)

All API keys and passwords go in **one file: `.env.local`**. This file is listed in `.gitignore`, so it never ends up on GitHub.

```bash
cp .env.example .env.local
chmod 600 .env.local        # on a server: only you can read it
```

Open `.env.local`. Every setting has a comment explaining it. The ones you need are:

| Setting | Where to get it |
|---|---|
| `SITE_URL` | The address of the website, e.g. `https://catalog.luxiko.be`. **The QR codes point here.** |
| `AUTH_SECRET` | Run `openssl rand -base64 48` and paste the output |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | See step 2 |
| `ADMIN_EMAILS` | Your Google address(es), comma separated. Only these accounts can open the admin. |
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) |
| `MAIL_FROM` | e.g. `LUXIKO <offerte@luxiko.be>`. The domain must be verified in Resend (*Domains → Add domain*). |
| `QUOTE_TO_EMAIL` | The inbox that receives quote requests |
| `COMPANY_*` | Optional contact details for the website footer and the PDF back cover |

The admin **Settings** page shows which settings are still missing.

## 2. Google sign-in (one-time setup)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and create a project, or pick an existing one.
2. Open **APIs & Services → OAuth consent screen**, choose *External* and fill in the app name (LUXIKO Catalog) and your email.
3. Open **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorised redirect URIs:
     - `https://YOUR-SITE/api/auth/callback`
     - `http://localhost:3000/api/auth/callback` (for testing on your own computer)
4. Copy the *Client ID* and *Client secret* into `.env.local`.

## 3. Run it

**With Docker (recommended on a server or VPS):**

```bash
docker compose up -d --build
```

The site runs on port 3000. Put it behind your web server or reverse proxy (Caddy, Nginx, Cloudflare Tunnel…) with HTTPS on your domain. The database and uploaded files are stored in the Docker volume `catalog-data`, so back that up.

**Without Docker (Node.js 20.9 or newer):**

```bash
npm ci
npm run build
npm start          # http://localhost:3000
```

The data is stored in `./data` (the `DATA_DIR` setting).

On first start the database fills itself with the 247 products from the original catalog.

> Because the database and uploads live on disk, host it somewhere with a persistent disk (a VPS, Docker host, Railway or Render with a volume, etc.). Serverless hosts like Vercel reset the disk and won't work.

## 4. Using the admin

Open `https://YOUR-SITE/admin` and sign in with Google.

- **Products** – search and filter. Badges show which console files are uploaded (MA2 / MA3 / MQ / AVO).
  - 65 products are marked **Review**: their specs were cut off with "…" in the original PDF and were shortened automatically. Correct them, then switch off *Needs review*.
- **Product editor**
  - Basics: code, title, category, series, IP rating and description. Switch off *Visible on website* to hide a product.
  - **Specifications**: add, remove and reorder rows.
  - **Features**: toggle features such as Zoom, Prism and CMY on or off, or add your own.
  - **DMX modes**.
  - **Photos**: upload several. The star makes a photo the main one. Photos are resized and converted to WebP automatically. The photos taken from the old PDF are small (150×110 px), so uploading better ones is worth it.
  - **Console libraries**: upload or replace the file for grandMA2, grandMA3, ChamSys or Avolites. **If a file is missing, its download button is not shown on the website.**
- **Quotes** – every request from the website, with a status (new, answered, won, lost). Each request is also emailed to `QUOTE_TO_EMAIL` via Resend, with Reply-To set to the customer. The customer gets a confirmation email.
- **Settings**
  - **Download catalog PDF** builds the PDF from the current data.
  - **Console logos**: upload the official grandMA / ChamSys / Avolites logos. The site ships with neutral placeholder badges.

## 5. The PDF catalog

**The QR codes contain `SITE_URL`.** After you set your real domain, rebuild the PDF before printing:

- In the admin: **Settings → Download catalog PDF**, or
- From the command line: `npm run catalog:pdf`, which writes `catalog/LUXIKO_Product_Catalog_2027.pdf`.

Every QR code opens `SITE_URL/p/<PRODUCT CODE>`. Hidden products are left out.

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
tools/extract_catalog.py   the one-off PDF extractor (Python + PyMuPDF)
scripts/build-catalog.ts   CLI for the printable PDF
```

## Security notes

- Secrets live only in `.env.local`, which is git-ignored.
- Admin sign-in uses Google OAuth (authorization code flow with PKCE and a state check). Only verified emails in `ADMIN_EMAILS` get in, and the allow-list is checked again on every request.
- Sessions are signed, httpOnly, SameSite=Lax cookies. Admin API calls from other sites are rejected.
- The quote form has input validation, a honeypot field and a per-IP rate limit. Uploads are size-limited, and images are re-encoded.
