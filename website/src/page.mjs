import { categories, marquee, settings } from "./content.mjs";

export const LANGS = ["en", "nl", "fr"];
/** Folder of each language on the website ("" = the root). */
export const DIR = { en: "", nl: "nl/", fr: "fr/" };

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const arrow = `<svg class="ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>`;
const external = `<svg class="ico" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>`;
const download = `<svg class="ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 4v11m-5-5 5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>`;
const check = `<svg class="ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m5 12 4 4 10-10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>`;

const catalogLink = (lang, query = "") => `${settings.catalogUrl}/${lang}${query}`;
const pageUrl = (lang) => `${settings.siteUrl.replace(/\/+$/, "")}/${DIR[lang]}`;

function langSwitch(lang, base, t, cls = "") {
  return `<nav class="langs ${cls}" aria-label="${esc(t.nav.language)}">${LANGS.map(
    (l) =>
      `<a href="${base}${DIR[l] || "./"}" hreflang="${l}" lang="${l}" data-lang="${l}"${l === lang ? ' aria-current="true"' : ""}>${l.toUpperCase()}</a>`,
  ).join("")}</nav>`;
}

function head(lang, base, t, { title, description, noindex = false, redirect = false }) {
  const alternates = LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${pageUrl(l)}">`).join("\n  ");
  // Root page only: send visitors to their own language (saved choice → device language).
  const auto = redirect
    ? `<script>(function(){var L=["en","nl","fr"],p=null;try{p=localStorage.getItem("lx_lang")}catch(e){}if(L.indexOf(p)<0){p=null;var ls=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||""];for(var i=0;i<ls.length&&!p;i++){var c=String(ls[i]).slice(0,2).toLowerCase();if(L.indexOf(c)>-1)p=c}}if(p&&p!=="en")location.replace(p+"/"+location.hash)})();</script>`
    : "";
  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${pageUrl(lang)}">\n  ${alternates}\n  <link rel="alternate" hreflang="x-default" href="${pageUrl("en")}">`}
  <meta name="theme-color" content="#202a4b">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="LUXIKO">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${pageUrl(lang)}">
  <meta property="og:image" content="${settings.siteUrl.replace(/\/+$/, "")}/assets/img/og.jpg">
  <meta property="og:locale" content="${{ en: "en_GB", nl: "nl_BE", fr: "fr_BE" }[lang]}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/png" href="${base}assets/img/icon.png">
  <link rel="apple-touch-icon" href="${base}assets/img/icon.png">
  <link rel="preload" href="${base}assets/fonts/open-sauce-one-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${base}assets/fonts/league-spartan-700.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${base}assets/site.css?v=__V__">
  <script>document.documentElement.className+=" js"</script>
  ${auto}
</head>`;
}

function header(lang, base, t) {
  const links = [
    ["#about", t.nav.about],
    ["#range", t.nav.range],
    ["#catalog", t.nav.catalog],
    ["#contact", t.nav.contact],
  ];
  return `<a class="skip" href="#main">${esc(t.nav.skip)}</a>
<header class="hdr" data-hdr>
  <div class="wrap hdr-in">
    <a class="logo" href="${base}${DIR[lang] || "./"}" aria-label="LUXIKO">
      <img class="logo-light" src="${base}assets/img/logo-light.png" alt="LUXIKO" width="476" height="176">
      <img class="logo-dark" src="${base}assets/img/logo-dark.png" alt="" width="476" height="176">
    </a>
    <nav class="nav" aria-label="Menu">
      ${links.map(([h, l]) => `<a href="${h}" data-nav>${esc(l)}</a>`).join("\n      ")}
    </nav>
    <div class="hdr-r">
      ${langSwitch(lang, base, t, "langs-hdr")}
      <a class="btn btn-o btn-sm hdr-shop" href="${settings.shopUrl}" rel="noopener">${esc(t.nav.shop)} ${external}</a>
      <button class="burger" type="button" aria-expanded="false" aria-controls="mnav" data-burger>
        <span class="sr">${esc(t.nav.menu)}</span><span class="burger-l"></span><span class="burger-l"></span>
      </button>
    </div>
  </div>
  <div class="mnav" id="mnav" data-mnav hidden>
    <nav class="wrap" aria-label="Menu">
      ${links.map(([h, l], i) => `<a href="${h}" style="--i:${i}">${esc(l)}</a>`).join("\n      ")}
      <a href="${settings.shopUrl}" rel="noopener" style="--i:4">${esc(t.nav.shop)} ${external}</a>
      ${langSwitch(lang, base, t, "langs-m")}
    </nav>
  </div>
</header>`;
}

function footer(lang, base, t) {
  const s = settings;
  const year = new Date().getFullYear();
  return `<footer class="ftr">
  <div class="wrap ftr-in">
    <div>
      <img class="ftr-logo" src="${base}assets/img/logo-light.png" alt="LUXIKO" width="476" height="176" loading="lazy">
      ${/* the logo already says it in Dutch */ lang === "nl" ? "" : `<p class="ftr-tag">${esc(t.footer.tagline)}</p>`}
    </div>
    <nav class="ftr-nav" aria-label="Footer">
      <a href="#about">${esc(t.nav.about)}</a>
      <a href="#range">${esc(t.nav.range)}</a>
      <a href="${catalogLink(lang)}">${esc(t.nav.catalog)}</a>
      <a href="${s.shopUrl}" rel="noopener">${esc(t.nav.shop)}</a>
      <a href="#contact">${esc(t.nav.contact)}</a>
    </nav>
    <div class="ftr-contact">
      ${s.email ? `<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>` : ""}
      ${s.phone ? `<a href="tel:${esc(s.phone.replace(/[^+\d]/g, ""))}">${esc(s.phone)}</a>` : ""}
      ${s.address ? `<span>${esc(s.address).replace(/\n/g, "<br>")}</span>` : ""}
      ${s.vat ? `<span>${esc(t.footer.vat)} ${esc(s.vat)}</span>` : ""}
    </div>
  </div>
  <div class="wrap ftr-bottom">
    <span>© ${year} LUXIKO. ${esc(t.footer.rights)}</span>
    ${langSwitch(lang, base, t, "langs-ftr")}
    <a href="#top" class="ftr-top">${esc(t.footer.top)} ↑</a>
  </div>
</footer>`;
}

export function homePage(lang, t) {
  const base = DIR[lang] ? "../" : "";
  const s = settings;
  const catName = (c) => (lang === "en" ? c.name : c[lang]);
  const sectionUrl = (c) => catalogLink(lang, `?section=${encodeURIComponent(c.name)}`);
  const strip = marquee
    .map((code) => `<li><img src="${base}assets/img/products/${code}.webp" alt="" width="300" height="220" loading="lazy" decoding="async"></li>`)
    .join("");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LUXIKO",
    url: s.siteUrl,
    logo: `${s.siteUrl.replace(/\/+$/, "")}/assets/img/icon.png`,
    slogan: t.footer.tagline,
    ...(s.email ? { email: s.email } : {}),
    ...(s.phone ? { telephone: s.phone } : {}),
  };

  return `<!doctype html>
<html lang="${t.htmlLang}">
${head(lang, base, t, { title: t.meta.title, description: t.meta.description, redirect: lang === "en" })}
<body>
${header(lang, base, t)}

<main id="main">
  <section class="hero" id="top">
    <div class="hero-bg" aria-hidden="true">
      <img src="${base}assets/img/hero-1920.webp" srcset="${base}assets/img/hero-960.webp 960w, ${base}assets/img/hero-1920.webp 1920w" sizes="100vw" alt="" fetchpriority="high">
    </div>
    <div class="beams" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>
    <div class="hero-shade" aria-hidden="true"></div>
    <div class="wrap hero-in">
      <p class="kicker kicker-light hero-k">${esc(t.hero.kicker)}</p>
      <h1 class="hero-title">
        <span class="line"><span>${esc(t.hero.title[0])}</span></span>
        <span class="line line-o"><span>${esc(t.hero.title[1])}</span></span>
      </h1>
      <p class="hero-lead">${esc(t.hero.text)}</p>
      <div class="btns hero-btns">
        <a class="btn btn-o" href="${catalogLink(lang)}">${esc(t.hero.catalog)} ${arrow}</a>
        <a class="btn btn-ghost" href="${s.shopUrl}" rel="noopener">${esc(t.hero.shop)} ${external}</a>
      </div>
    </div>
    <a class="scroll" href="#about"><span>${esc(t.hero.scroll)}</span><i></i></a>
  </section>

  <section class="stats" aria-label="LUXIKO">
    <div class="wrap stats-in">
      ${[
        [s.stats.fixtures, t.stats.fixtures],
        [s.stats.categories, t.stats.categories],
        [s.stats.outdoor, t.stats.outdoor],
        [s.stats.series, t.stats.series],
      ]
        .map(
          ([n, l], i) =>
            `<div class="stat" data-reveal style="--d:${i * 90}ms"><span class="stat-n" data-count="${n}">${n}</span><span class="stat-l">${esc(l)}</span></div>`,
        )
        .join("\n      ")}
    </div>
  </section>

  <section class="sec" id="about">
    <div class="wrap about">
      <div class="about-intro">
        <p class="kicker" data-reveal>${esc(t.about.kicker)}</p>
        <h2 class="h2" data-reveal style="--d:80ms">${esc(t.about.title)}</h2>
        <p class="lead" data-reveal style="--d:160ms">${esc(t.about.text)}</p>
      </div>
      <ol class="services">
        ${t.about.services
          .map(
            ([title, text], i) => `<li class="service" data-reveal style="--d:${i * 100}ms">
          <span class="service-n">${String(i + 1).padStart(2, "0")}</span>
          <div><h3>${esc(title)}</h3><p>${esc(text)}</p></div>
        </li>`,
          )
          .join("\n        ")}
      </ol>
    </div>
  </section>

  <div class="strip" aria-hidden="true">
    <ul class="strip-track">${strip}${strip}</ul>
  </div>

  <section class="sec" id="range">
    <div class="wrap">
      <div class="sec-head">
        <div>
          <p class="kicker" data-reveal>${esc(t.range.kicker)}</p>
          <h2 class="h2" data-reveal style="--d:80ms">${esc(t.range.title)}</h2>
        </div>
        <p class="sec-text" data-reveal style="--d:160ms">${esc(t.range.text)}</p>
      </div>
      <ul class="tiles">
        ${categories
          .map(
            (c, i) => `<li data-reveal style="--d:${(i % 6) * 60}ms"><a class="tile" href="${sectionUrl(c)}">
          <span class="tile-img"><img src="${base}assets/img/products/${c.img}.webp" alt="" width="300" height="220" loading="lazy" decoding="async"></span>
          <span class="tile-name">${esc(catName(c))}</span>
          <span class="tile-meta"><b>${c.count}</b> ${esc(t.range.fixtures)} ${arrow}</span>
        </a></li>`,
          )
          .join("\n        ")}
      </ul>
      <div class="center" data-reveal><a class="btn btn-navy" href="${catalogLink(lang)}">${esc(t.range.all)} ${arrow}</a></div>
    </div>
  </section>

  <section class="sec sec-zebra" id="series">
    <div class="wrap">
      <p class="kicker" data-reveal>${esc(t.series.kicker)}</p>
      <h2 class="h2" data-reveal style="--d:80ms">${esc(t.series.title)}</h2>
      <div class="series">
        ${t.series.items
          .map(
            ([id, name, text], i) => `<a class="serie serie-${id.toLowerCase()}" href="${catalogLink(lang, `?series=${id}`)}" data-reveal style="--d:${i * 120}ms">
          <span class="serie-bar"></span>
          <span class="serie-id">${id}</span>
          <span class="serie-name">${esc(name)}</span>
          <span class="serie-text">${esc(text)}</span>
          <span class="serie-link">${esc(t.series.view)} ${arrow}</span>
        </a>`,
          )
          .join("\n        ")}
      </div>
    </div>
  </section>

  <section class="cat" id="catalog">
    <div class="wrap cat-in">
      <div class="cat-text">
        <p class="kicker kicker-light" data-reveal>${esc(t.catalog.kicker)}</p>
        <h2 class="h2 h2-light" data-reveal style="--d:80ms">${esc(t.catalog.title)}</h2>
        <p class="lead lead-light" data-reveal style="--d:160ms">${esc(t.catalog.text)}</p>
        <ul class="checks">
          ${t.catalog.points.map((p, i) => `<li data-reveal style="--d:${200 + i * 80}ms">${check}<span>${esc(p)}</span></li>`).join("\n          ")}
        </ul>
        <div class="btns" data-reveal style="--d:520ms">
          <a class="btn btn-o" href="${catalogLink(lang)}">${esc(t.catalog.open)} ${arrow}</a>
          <a class="btn btn-ghost" href="${base}downloads/LUXIKO_Product_Catalog_2027.pdf" download>${esc(t.catalog.pdf)} ${download}</a>
        </div>
      </div>
      <div class="cat-visual" aria-hidden="true">
        <img class="page page-back" src="${base}assets/img/catalog-page.webp" alt="" width="600" height="849" loading="lazy">
        <img class="page page-front" src="${base}assets/img/catalog-cover.webp" alt="" width="600" height="849" loading="lazy">
      </div>
    </div>
  </section>

  <section class="shop" id="shop">
    <div class="wrap shop-in">
      <div data-reveal>
        <p class="kicker kicker-navy">${esc(t.shop.kicker)}</p>
        <h2 class="h2">${esc(t.shop.title)}</h2>
        <p class="shop-text">${esc(t.shop.text)}</p>
      </div>
      <a class="btn btn-navy btn-lg" href="${s.shopUrl}" rel="noopener" data-reveal style="--d:120ms">${esc(t.shop.cta)} ${external}</a>
    </div>
  </section>

  <section class="sec" id="contact">
    <div class="wrap contact">
      <div class="contact-intro">
        <p class="kicker" data-reveal>${esc(t.contact.kicker)}</p>
        <h2 class="h2" data-reveal style="--d:80ms">${esc(t.contact.title)}</h2>
        <p class="lead" data-reveal style="--d:160ms">${esc(t.contact.text)}</p>
        ${
          s.email || s.phone || s.address
            ? `<div class="direct" data-reveal style="--d:220ms">
          <p class="kicker">${esc(t.contact.direct)}</p>
          ${s.email ? `<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>` : ""}
          ${s.phone ? `<a href="tel:${esc(s.phone.replace(/[^+\d]/g, ""))}">${esc(s.phone)}</a>` : ""}
          ${s.address ? `<span>${esc(s.address).replace(/\n/g, "<br>")}</span>` : ""}
        </div>`
            : ""
        }
        <div class="tip" data-reveal style="--d:280ms">
          <p class="tip-title">${esc(t.contact.tipTitle)}</p>
          <p>${esc(t.contact.tip)}</p>
          <a class="link" href="${catalogLink(lang)}">${esc(t.contact.tipCta)} ${arrow}</a>
        </div>
      </div>
      <form class="form" data-form data-endpoint="${esc(s.contactEndpoint)}" data-lang="${lang}" data-sending="${esc(t.contact.sending)}" data-error="${esc(t.contact.error)}" novalidate data-reveal style="--d:120ms">
        <div class="form-fields">
          <label class="f f-half"><span>${esc(t.contact.name)} *</span><input name="name" required minlength="2" maxlength="120" autocomplete="name"></label>
          <label class="f f-half"><span>${esc(t.contact.company)}</span><input name="company" maxlength="160" autocomplete="organization"></label>
          <label class="f f-half"><span>${esc(t.contact.email)} *</span><input name="email" type="email" required maxlength="200" autocomplete="email"></label>
          <label class="f f-half"><span>${esc(t.contact.phone)}</span><input name="phone" type="tel" maxlength="40" autocomplete="tel"></label>
          <label class="f"><span>${esc(t.contact.message)} *</span><textarea name="message" rows="5" required minlength="5" maxlength="3000" placeholder="${esc(t.contact.placeholder)}"></textarea></label>
          <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <p class="form-error" data-error-box role="alert" hidden></p>
          <button class="btn btn-o btn-block" type="submit" data-submit>${esc(t.contact.send)} ${arrow}</button>
          <p class="form-note">${esc(t.contact.privacy)}</p>
        </div>
        <div class="form-done" data-done hidden>
          <span class="form-done-ico">${check}</span>
          <p class="h3">${esc(t.contact.sentTitle)}</p>
          <p>${esc(t.contact.sentText)}</p>
        </div>
      </form>
    </div>
  </section>
</main>

${footer(lang, base, t)}
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<script src="${base}assets/site.js?v=__V__" defer></script>
</body>
</html>
`;
}

/** Simple page for "not found" — uses absolute paths, because it can be shown at any address. */
export function notFoundPage(t) {
  const lang = "en";
  const base = "/";
  return `<!doctype html>
<html lang="en">
${head(lang, base, t, { title: `${t.notFound.title} · LUXIKO`, description: t.meta.description, noindex: true })}
<body class="nf-body">
<main class="nf">
  <a href="/"><img src="/assets/img/logo-dark.png" alt="LUXIKO" width="238" height="88"></a>
  <p class="kicker">404</p>
  <h1 class="h2">${esc(t.notFound.title)}</h1>
  <p class="lead">${esc(t.notFound.text)}</p>
  <div class="btns"><a class="btn btn-o" href="/">${esc(t.notFound.cta)} ${arrow}</a><a class="btn btn-navy" href="${catalogLink(lang)}">${esc(t.nav.catalog)} ${arrow}</a></div>
</main>
</body>
</html>
`;
}
