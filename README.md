# LUXIKO catalog 2027

This repo contains three things:

| | What | Where |
|---|---|---|
| **Printable catalog** | The A4 catalog in the original LUXIKO style, with a QR code for every product | `catalog/LUXIKO_Product_Catalog_2027.pdf` |
| **Product website** | Scanning a QR code opens the product page: photos, full specs, DMX modes, console library downloads, a quote form and a share button | `https://catalog.luxiko.be` |
| **Admin** | Products, photos, library files, quote requests, settings and API keys, and PDF export | `https://catalog.luxiko.be/admin` |

The whole thing runs in **one Docker container**. You don't need a config file: on the first start the container creates everything itself, and you enter your API keys later in **Admin → Settings**.

---

## 1. Start it

On a Linux server with Docker ([install Docker](https://docs.docker.com/engine/install/) or run `curl -fsSL https://get.docker.com | sh`):

```bash
git clone https://github.com/HeyvaertSeppe/luxiko-catalog.git
cd luxiko-catalog
docker compose up -d --build
```

The first build takes a few minutes. The site then runs on port **3000** of the server.

<details>
<summary>Private repository? Clone with a deploy key</summary>

```bash
ssh-keygen -t ed25519 -f ~/.ssh/luxiko_deploy -N ""
cat ~/.ssh/luxiko_deploy.pub     # GitHub → repo → Settings → Deploy keys → Add (read-only)
printf 'Host github.com\n  IdentityFile ~/.ssh/luxiko_deploy\n' >> ~/.ssh/config
git clone git@github.com:HeyvaertSeppe/luxiko-catalog.git
```
</details>

<details>
<summary>Without docker compose (plain docker run)</summary>

```bash
docker build -t luxiko-catalog .
docker run -d --name luxiko-catalog --restart unless-stopped \
  -p 3000:3000 -v luxiko-data:/app/data luxiko-catalog
```
</details>

## 2. Your admin login

On the first start the container creates the admin account and prints the login:

```bash
docker compose logs catalog
```

```
════════════════════════════════════════════════════════════════
  LUXIKO admin login   →  https://catalog.luxiko.be/admin

  Username:  admin
  Password:  AbCd-EfGh-JkMn-PqRs
════════════════════════════════════════════════════════════════
```

- **Username:** `admin`
- **Password:** randomly generated for your installation. It stays in the logs, and in `/app/data/initial-admin-password.txt`, until you change it. You can also show it with:
  ```bash
  docker compose exec -u node catalog cat /app/data/initial-admin-password.txt
  ```

Sign in at `/admin`, then open **Settings → Admin account** and choose your own password. The generated password file is deleted automatically.

> Want to choose the first password yourself? Uncomment `ADMIN_PASSWORD` in `docker-compose.yml` before the very first start.

**Forgot the password?**

```bash
docker compose exec -u node catalog node scripts/reset-admin-password.mjs
```

This prints a new password and signs out every session. You can also pass your own password as an argument.

## 3. Put it behind your reverse proxy

The default address is **`https://catalog.luxiko.be`**. Point your reverse proxy at `http://<docker-host>:3000`. The app uses the `X-Forwarded-Proto`, `X-Forwarded-Host` and `X-Forwarded-For` headers, which every common proxy sends.

**Nginx Proxy Manager:** add a Proxy Host for `catalog.luxiko.be` → forward to `http://<docker-host>:3000`. Turn on *Websockets Support* and *Block Common Exploits*, and on the SSL tab request a Let's Encrypt certificate with *Force SSL*. Under *Advanced*, allow large uploads:

```nginx
client_max_body_size 60m;
```

**Plain nginx:**

```nginx
server {
    server_name catalog.luxiko.be;
    listen 443 ssl http2;
    # ssl_certificate … / ssl_certificate_key …
    client_max_body_size 60m;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Caddy:**

```
catalog.luxiko.be {
    request_body { max_size 60MB }
    reverse_proxy 127.0.0.1:3000
}
```

**Traefik:** add labels to the service in `docker-compose.yml`, for example `traefik.http.routers.luxiko.rule=Host(\`catalog.luxiko.be\`)` and `traefik.http.services.luxiko.loadbalancer.server.port=3000`.

If the site uses a different domain, change it in **Admin → Settings → Website** and download a fresh PDF, because the QR codes contain the address.

## 4. Settings (API keys)

Everything is set in **Admin → Settings**. Each field has a link to where you get the value.

| Setting | Where to get it |
|---|---|
| Website address | Your domain, default `https://catalog.luxiko.be` |
| Resend API key | [resend.com/api-keys](https://resend.com/api-keys) — create a key with *Sending access* |
| Sender | An address on a domain you verified at [resend.com/domains](https://resend.com/domains), e.g. `LUXIKO <offerte@luxiko.be>` |
| Send quote requests to | Your inbox. The **Send test e-mail** button checks the setup. |
| Google sign-in (optional) | [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) → *Create OAuth client ID* → *Web application*. Paste the redirect URI shown in Settings. Also fill in the [consent screen](https://console.cloud.google.com/apis/credentials/consent). |
| Company details | Shown in the footer, in e-mails and on the PDF |

How settings are stored:

- Settings are saved in `/app/data/config.env` inside the Docker volume. Only the app can read that file (permission 600), and it is never served on the website.
- **API keys and secrets can't be read back.** After you save one, the admin only shows *"Saved (hidden)"*. To change it, type a new value.
- Changes apply immediately, without a restart.
- Environment variables with the same names (`RESEND_API_KEY`, `SITE_URL`, …) still work as a fallback. A value saved in the admin wins.

## 5. Update to a new version

```bash
cd luxiko-catalog
git pull
docker compose up -d --build
```

Products, photos, library files, quotes, settings and passwords live in the `catalog-data` volume, so they are kept.

## 6. Backups

Everything is in the `catalog-data` volume. To back it up:

```bash
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

`docker volume ls` shows the exact volume name.

## 7. Using the admin

- **Products** – search and filter. The MA2 / MA3 / MQ / AVO badges turn navy when that console's library file is uploaded. 65 products are marked **Review**: their specs were cut off in the original PDF. Check them and untick *Needs review*.
- **Product editor**
  - Code, title, category, series, IP rating and description.
  - Specifications, features (Yes/No), DMX modes and photos (the star makes a photo the main one).
  - Library files for grandMA2, grandMA3, ChamSys and Avolites. **No file = no download button** on the website.
  - Untick *Visible on website* to hide a product.
- **Quotes** – every request from the website, with a status. Each one is also e-mailed through Resend, with Reply-To set to the customer.
- **Settings**
  - Admin account, website address, e-mail and Google sign-in, company details.
  - **Download catalog PDF**.
  - Console logos.

## 8. The PDF catalog

Every QR code opens `https://catalog.luxiko.be/p/<PRODUCT CODE>`, using the website address from Settings. After changing the address, products or photos, download a fresh copy: **Admin → Settings → Download catalog PDF**.

## 9. Handy commands

| Task | Command |
|---|---|
| Status (shows *healthy*) | `docker compose ps` |
| Live logs | `docker compose logs -f catalog` |
| Restart | `docker compose restart` |
| Stop (data is kept) | `docker compose down` |
| Reset admin password | `docker compose exec -u node catalog node scripts/reset-admin-password.mjs` |

**Troubleshooting**

- **Login works on `http://server:3000` but not through the domain** – make sure the proxy sends `X-Forwarded-Proto` (all the examples above do).
- **Google says `redirect_uri_mismatch`** – copy the redirect URI exactly as shown in Settings → Google sign-in.
- **Uploads of big library files fail** – raise the proxy's body size limit (`client_max_body_size 60m`).
- **Port 3000 already in use** – change `"3000:3000"` to, for example, `"8080:3000"` in `docker-compose.yml`, and point the proxy there.

## Security

- **Database:** every query uses parameters (prepared statements), so no user input is ever pasted into SQL. Product codes and all settings are validated with strict schemas.
- **Admin password:**
  - Hashed with scrypt; the plain password is never stored.
  - Login is rate-limited (10 attempts / 15 min per IP, 100 in total).
  - Changing the password signs out every other session.
- **Sessions:** signed, HttpOnly, SameSite=Lax cookies (marked Secure behind HTTPS). The signing key is generated per installation.
- **Cross-site requests:** admin changes from other websites are blocked (Origin check).
- **Uploads:**
  - Size-limited.
  - Images are re-encoded.
  - File names are sanitised, and path traversal is blocked.
  - Library files are always served as downloads.
- **Headers:** Content-Security-Policy, X-Frame-Options, nosniff, Referrer-Policy and Permissions-Policy.
- **Container:** runs as the unprivileged `node` user. The data folder is private (700) and `config.env` is readable only by the app (600).

## Project layout

```
app/                  Next.js pages and API routes
  p/[code]/           product page
  s/[slug]/           short-link redirect
  admin/              admin (login + panel)
  api/                quote, share, auth, settings and admin endpoints
components/           UI components
lib/                  database, auth, settings store, mail, storage, PDF generator
instrumentation.ts    first-start setup (secret, database, admin account, photos)
docker/entrypoint.sh  prepares the data volume, then drops root privileges
seed/                 products + photos extracted from the original PDF
scripts/              PDF builder and admin password reset
tools/                one-off extractor for the original PDF (Python)
```
