# LUXIKO main website (luxiko.be)

A fast static website in the same style as the catalog. It needs no PHP, database or Node.js on the server.

- **English, Dutch and French.** The home page `/` opens in the visitor's device language (`/nl/`, `/fr/`, or English). The **EN | NL | FR** switch at the top changes it, and the choice is remembered.
- **Sections:** what you do, the range (18 categories with photos), the three series, the catalog with a PDF download, the shop and a contact form.
- **Links:** the catalog buttons open `catalog.luxiko.be` in the same language, and the category and series tiles open it already filtered. The shop buttons go to `shop.luxiko.be`.
- **Animations:**
  - Moving-head light beams sweep over the hero photo.
  - Text slides in, sections appear as you scroll, and the numbers count up.
  - A strip of product photos keeps moving, and the catalog pages float.
  - People who turn on "reduce motion" on their device get a calm version.

## Put it on FastPanel

1. In FastPanel, open the site for **luxiko.be**, then go to **File manager**.
2. Open the site's root folder (usually `public_html`, or the folder FastPanel shows as the document root).
3. Upload **everything inside** [`website/public_html`](public_html). Upload the contents, not the folder itself, so `index.html` ends up directly in the root next to the `assets`, `nl`, `fr` and `downloads` folders.
4. Open https://luxiko.be.

Optional: to show the LUXIKO page for broken links, add this to the site's nginx config in FastPanel:

```nginx
error_page 404 /404.html;
```

## Turn on the contact form

The website is static, so it sends messages through the catalog server, which already has your Resend e-mail settings. Messages arrive by e-mail like quote requests. They are also listed in **Catalog admin → Quotes** as "Website message", and the sender gets a confirmation in their own language.

1. In the catalog admin, go to **Settings → Website → Main website address** and enter `https://luxiko.be`. That is the default, so you only need to change it for a different address. The `www.` version is allowed automatically.
2. Make sure the Resend fields under **Settings → E-mail** are filled in.

Only your own website can use the form; other sites are refused. It also has spam protection and a send limit per visitor.

## Change texts, contact details or photos

Everything is in [`src/content.mjs`](src/content.mjs):

- `settings`: e-mail, phone, address and VAT number (shown in the contact section and footer when filled in), the shop, catalog and website addresses, and the numbers in the counter band.
- `categories`: the category tiles (name, photo, number of fixtures).
- `marquee`: the product photos in the moving strip.
- `en`, `nl`, `fr`: all texts per language.

Then rebuild and upload again. Run this in the project folder; it only needs Node.js:

```bash
node website/build.mjs
```

| File | What it is |
| --- | --- |
| `public_html/assets/site.css` | Styling and animations (edit directly, then rebuild) |
| `public_html/assets/site.js` | Menu, language memory, animations, contact form |
| `src/page.mjs` | The page layout |
| `public_html/downloads/LUXIKO_Product_Catalog_2027.pdf` | The PDF behind "Download the PDF". After changing the catalog, download a new one from Catalog admin → Settings, put it in `catalog/` (same name) and rebuild, or upload it over this file. |
