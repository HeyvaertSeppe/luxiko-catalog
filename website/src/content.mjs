// ─────────────────────────────────────────────────────────────────────────────
//  LUXIKO main website — settings and texts.
//  Change anything here, then run:  node website/build.mjs
//  and upload the contents of website/public_html again.
// ─────────────────────────────────────────────────────────────────────────────

export const settings = {
  // Where this website lives (used for links to other languages, sitemap, social previews).
  siteUrl: "https://luxiko.be",
  catalogUrl: "https://catalog.luxiko.be",
  shopUrl: "https://shop.luxiko.be",
  // The contact form sends through the catalog (it uses the Resend settings there).
  // Set "Main website address" in Catalog admin → Settings to the address of this site.
  contactEndpoint: "https://catalog.luxiko.be/api/contact",
  // Shown in the contact section and the footer when filled in. Leave "" to hide.
  email: "",
  phone: "",
  address: "", // use \n for a new line
  vat: "",
  // Numbers in the counter band (from the 2027 catalog).
  stats: { fixtures: 239, categories: 18, outdoor: 92, series: 3 },
};

/** Category tiles: English name as used in the catalog, photo, number of fixtures. */
export const categories = [
  { name: "Moving Heads", img: "MVS760Z-3", count: 68, nl: "Moving heads", fr: "Lyres asservies" },
  { name: "PAR Cans", img: "PRS180Z", count: 43, nl: "PAR-spots", fr: "Projecteurs PAR" },
  { name: "LED & Pixel Bars", img: "BRS80B", count: 19, nl: "LED- & pixelbars", fr: "Barres LED & pixels" },
  { name: "Strobes", img: "STS240X", count: 21, nl: "Stroboscopen", fr: "Stroboscopes" },
  { name: "Effect Lights", img: "FXS25X", count: 13, nl: "Effectverlichting", fr: "Effets lumineux" },
  { name: "Blinders", img: "BLP400B", count: 9, nl: "Blinders", fr: "Blinders" },
  { name: "Wash / City Colors", img: "WLP480W", count: 9, nl: "Wash / City Colors", fr: "Wash / City Colors" },
  { name: "Gobo Projectors", img: "GPS400X", count: 7, nl: "Goboprojectoren", fr: "Projecteurs de gobos" },
  { name: "Retro & Vintage", img: "RTS60B", count: 7, nl: "Retro & vintage", fr: "Rétro & vintage" },
  { name: "Fog & Haze Machines", img: "FMS3000X", count: 6, nl: "Rook- & hazemachines", fr: "Machines à fumée & brouillard" },
  { name: "Lasers", img: "LSS20X", count: 5, nl: "Lasers", fr: "Lasers" },
  { name: "Matrix Panels", img: "MXS490X", count: 5, nl: "Matrixpanelen", fr: "Panneaux matriciels" },
  { name: "Pinspots", img: "PSS15Z", count: 5, nl: "Pinspots", fr: "Pinspots" },
  { name: "Profiles & Spots", img: "PFS200P", count: 3, nl: "Profielspots & spots", fr: "Découpes & spots" },
  { name: "Fresnels", img: "FRS100B", count: 3, nl: "Fresnels", fr: "Fresnels" },
  { name: "Tube Lights", img: "TBS40X", count: 2, nl: "Tubeverlichting", fr: "Tubes lumineux" },
  { name: "Mirror Balls", img: "MBSX", count: 2, nl: "Spiegelbollen", fr: "Boules à facettes" },
  { name: "Accessories", img: "ACSX-2", count: 12, nl: "Accessoires", fr: "Accessoires" },
];

/** Product photos in the moving strip. */
export const marquee = [
  "MVP1480Z", "PRS285Z", "MVS380B1411", "STS2000H", "FXP475W", "BRS180B", "BLS200X", "MVS720S",
  "WLP960W", "RTP480X", "GPS200X", "MXS49X", "MVS400H1218", "PRS200X", "STS1000X", "FXS24B",
];

const en = {
  htmlLang: "en",
  meta: {
    title: "LUXIKO · Affordable light & sound",
    description:
      "LUXIKO supplies professional stage lighting and sound for DJs, clubs, venues, event companies and installers. Browse the 2027 catalog or visit the shop.",
  },
  nav: { about: "What we do", range: "Range", catalog: "Catalog", contact: "Contact", shop: "Shop", menu: "Menu", close: "Close", language: "Language", skip: "Skip to content" },
  hero: {
    kicker: "Stage lighting & sound",
    title: ["Affordable", "light & sound"],
    text: "Professional lighting and sound for DJs, clubs, venues, event companies and installers. Built for the stage, priced for real budgets.",
    catalog: "Browse the catalog",
    shop: "Visit the shop",
    scroll: "Scroll",
  },
  stats: { fixtures: "fixtures in the 2027 catalog", categories: "categories", outdoor: "outdoor-rated fixtures", series: "series, budget to premium" },
  about: {
    kicker: "What we do",
    title: "Everything to light up a stage",
    text: "LUXIKO supplies stage lighting and sound equipment at honest prices. From a single PAR can to a full rig of moving heads, strobes and lasers: we help you choose the right fixtures, send you a clear price and make sure they work on your console from day one.",
    services: [
      ["Lighting & sound", "Moving heads, PARs, LED bars, strobes, blinders, lasers, effects, fog and haze. Over 230 fixtures in one catalog, for indoor and outdoor use."],
      ["Advice that fits", "Tell us about your venue, show or budget. We suggest the fixtures that make sense, from entry level to top of the range."],
      ["Projects & installations", "Equipping a club, venue, theatre or rental stock? We put together one complete quote for larger quantities and installation projects."],
      ["Console ready", "Where available, fixture files for grandMA3, grandMA2, ChamSys MagicQ and Avolites are ready to download on the product page, so you can start programming right away."],
    ],
  },
  range: { kicker: "The range", title: "18 categories, one catalog", text: "Open a category to see every fixture with photos and specifications.", fixtures: "fixtures", all: "View all fixtures" },
  series: {
    kicker: "Three series",
    title: "A fixture for every budget",
    items: [
      ["B", "Budget", "Entry level. The lowest cost per fixture, for clubs and mobile DJs."],
      ["S", "Standard", "The workhorse. Better build, brighter output and more DMX modes."],
      ["P", "Premium", "Top of the range. Highest output, full feature set, mostly IP rated."],
    ],
    view: "View the series",
  },
  catalog: {
    kicker: "Product catalog 2027",
    title: "Every fixture, every detail",
    text: "Photos, specifications, DMX modes and console files for every product. Each fixture in the printed catalog has a QR code that opens its page on your phone, in English, Dutch or French.",
    points: ["Search by code, type or wattage", "Request a quote in one tap", "Download console fixture files", "Send a short link to open it on your PC"],
    open: "Open the online catalog",
    pdf: "Download the PDF",
  },
  shop: { kicker: "Web shop", title: "Prefer to order online?", text: "Visit our web shop for items you can order straight away.", cta: "Go to shop.luxiko.be" },
  contact: {
    kicker: "Contact",
    title: "Let's light it up",
    text: "Tell us what you are planning. We usually reply within one business day.",
    name: "Name",
    company: "Company",
    email: "E-mail",
    phone: "Phone",
    message: "Message",
    placeholder: "Venue, quantities, timing…",
    send: "Send message",
    sending: "Sending…",
    sentTitle: "Thank you.",
    sentText: "We received your message and will get back to you soon.",
    error: "Something went wrong. Please try again in a moment.",
    privacy: "We only use your details to answer your message.",
    direct: "Directly",
    tipTitle: "A price for a specific fixture?",
    tip: "Open it in the catalog and tap Request a quote.",
    tipCta: "To the catalog",
  },
  footer: { tagline: "Affordable light & sound", rights: "All rights reserved.", vat: "VAT", top: "Back to top" },
  notFound: { title: "Page not found", text: "This page does not exist (anymore).", cta: "Go to the home page" },
};

const nl = {
  htmlLang: "nl",
  meta: {
    title: "LUXIKO · Betaalbaar licht & geluid",
    description:
      "LUXIKO levert professionele podiumverlichting en geluid voor dj's, clubs, zalen, eventbedrijven en installateurs. Bekijk de catalogus 2027 of bezoek de shop.",
  },
  nav: { about: "Wat we doen", range: "Assortiment", catalog: "Catalogus", contact: "Contact", shop: "Shop", menu: "Menu", close: "Sluiten", language: "Taal", skip: "Naar de inhoud" },
  hero: {
    kicker: "Podiumverlichting & geluid",
    title: ["Betaalbaar", "licht & geluid"],
    text: "Professionele verlichting en geluid voor dj's, clubs, zalen, eventbedrijven en installateurs. Gemaakt voor het podium, geprijsd voor echte budgetten.",
    catalog: "Bekijk de catalogus",
    shop: "Naar de shop",
    scroll: "Scroll",
  },
  stats: { fixtures: "armaturen in de catalogus 2027", categories: "categorieën", outdoor: "armaturen voor buiten", series: "reeksen, van budget tot premium" },
  about: {
    kicker: "Wat we doen",
    title: "Alles om een podium te laten schitteren",
    text: "LUXIKO levert podiumverlichting en geluid aan eerlijke prijzen. Van één PAR-spot tot een volledige rig met moving heads, stroboscopen en lasers: we helpen je de juiste armaturen kiezen, sturen je een duidelijke prijs en zorgen dat alles vanaf dag één op je lichttafel werkt.",
    services: [
      ["Licht & geluid", "Moving heads, PAR-spots, LED-bars, stroboscopen, blinders, lasers, effecten, rook en haze. Meer dan 230 armaturen in één catalogus, voor binnen en buiten."],
      ["Advies op maat", "Vertel ons over je zaal, show of budget. Wij stellen de armaturen voor die passen, van instapmodel tot topklasse."],
      ["Projecten & installaties", "Een club, zaal, theater of verhuurpark uitrusten? We maken één volledige offerte voor grotere aantallen en installatieprojecten."],
      ["Klaar voor je lichttafel", "Waar beschikbaar staan fixture-bestanden voor grandMA3, grandMA2, ChamSys MagicQ en Avolites klaar op de productpagina, zodat je meteen kunt programmeren."],
    ],
  },
  range: { kicker: "Het assortiment", title: "18 categorieën, één catalogus", text: "Open een categorie en bekijk elk armatuur met foto's en specificaties.", fixtures: "armaturen", all: "Alle armaturen bekijken" },
  series: {
    kicker: "Drie reeksen",
    title: "Een armatuur voor elk budget",
    items: [
      ["B", "Budget", "Instapmodel. De laagste prijs per armatuur, voor clubs en mobiele dj's."],
      ["S", "Standaard", "Het werkpaard. Steviger gebouwd, feller en meer DMX-modi."],
      ["P", "Premium", "Topklasse. Hoogste lichtopbrengst, alle functies, meestal IP-beschermd."],
    ],
    view: "Bekijk de reeks",
  },
  catalog: {
    kicker: "Productcatalogus 2027",
    title: "Elk armatuur, elk detail",
    text: "Foto's, specificaties, DMX-modi en lichttafelbestanden voor elk product. Elk armatuur in de gedrukte catalogus heeft een QR-code die de pagina op je gsm opent, in het Nederlands, Frans of Engels.",
    points: ["Zoeken op code, type of vermogen", "Offerte aanvragen met één tik", "Fixture-bestanden downloaden", "Korte link om op je pc te openen"],
    open: "Open de online catalogus",
    pdf: "Download de pdf",
  },
  shop: { kicker: "Webshop", title: "Liever online bestellen?", text: "Bezoek onze webshop voor artikelen die je meteen kunt bestellen.", cta: "Naar shop.luxiko.be" },
  contact: {
    kicker: "Contact",
    title: "Laten we het licht aandoen",
    text: "Vertel ons wat je van plan bent. We antwoorden meestal binnen één werkdag.",
    name: "Naam",
    company: "Bedrijf",
    email: "E-mail",
    phone: "Telefoon",
    message: "Bericht",
    placeholder: "Zaal, aantallen, timing…",
    send: "Bericht versturen",
    sending: "Versturen…",
    sentTitle: "Bedankt.",
    sentText: "We hebben je bericht ontvangen en nemen snel contact met je op.",
    error: "Er ging iets mis. Probeer het zo meteen opnieuw.",
    privacy: "We gebruiken je gegevens enkel om je bericht te beantwoorden.",
    direct: "Rechtstreeks",
    tipTitle: "Een prijs voor een bepaald armatuur?",
    tip: "Open het in de catalogus en tik op Offerte aanvragen.",
    tipCta: "Naar de catalogus",
  },
  footer: { tagline: "Betaalbaar licht & geluid", rights: "Alle rechten voorbehouden.", vat: "Btw", top: "Naar boven" },
  notFound: { title: "Pagina niet gevonden", text: "Deze pagina bestaat niet (meer).", cta: "Naar de startpagina" },
};

const fr = {
  htmlLang: "fr",
  meta: {
    title: "LUXIKO · Lumière & son abordables",
    description:
      "LUXIKO fournit de l'éclairage scénique et du son professionnels pour DJ, clubs, salles, sociétés événementielles et installateurs. Découvrez le catalogue 2027 ou la boutique.",
  },
  nav: { about: "Nos services", range: "Gamme", catalog: "Catalogue", contact: "Contact", shop: "Boutique", menu: "Menu", close: "Fermer", language: "Langue", skip: "Aller au contenu" },
  hero: {
    kicker: "Éclairage scénique & son",
    title: ["Lumière & son", "abordables"],
    text: "Éclairage et son professionnels pour DJ, clubs, salles, sociétés événementielles et installateurs. Conçus pour la scène, au prix de vrais budgets.",
    catalog: "Voir le catalogue",
    shop: "Visiter la boutique",
    scroll: "Défiler",
  },
  stats: { fixtures: "projecteurs au catalogue 2027", categories: "catégories", outdoor: "projecteurs pour l'extérieur", series: "gammes, de budget à premium" },
  about: {
    kicker: "Nos services",
    title: "Tout pour illuminer une scène",
    text: "LUXIKO fournit de l'éclairage scénique et du son à des prix honnêtes. D'un seul PAR à un kit complet de lyres, stroboscopes et lasers : nous vous aidons à choisir les bons projecteurs, vous envoyons un prix clair et veillons à ce qu'ils fonctionnent sur votre console dès le premier jour.",
    services: [
      ["Lumière & son", "Lyres, PAR, barres LED, stroboscopes, blinders, lasers, effets, fumée et brouillard. Plus de 230 projecteurs dans un seul catalogue, pour l'intérieur et l'extérieur."],
      ["Des conseils adaptés", "Parlez-nous de votre salle, de votre spectacle ou de votre budget. Nous proposons les projecteurs qui conviennent, de l'entrée de gamme au haut de gamme."],
      ["Projets & installations", "Vous équipez un club, une salle, un théâtre ou un parc de location ? Nous établissons un devis complet pour les grandes quantités et les projets d'installation."],
      ["Prêt pour votre console", "Lorsqu'ils sont disponibles, les fichiers de projecteurs pour grandMA3, grandMA2, ChamSys MagicQ et Avolites se téléchargent depuis la page produit : vous programmez tout de suite."],
    ],
  },
  range: { kicker: "La gamme", title: "18 catégories, un seul catalogue", text: "Ouvrez une catégorie pour voir chaque projecteur avec photos et caractéristiques.", fixtures: "projecteurs", all: "Voir tous les projecteurs" },
  series: {
    kicker: "Trois gammes",
    title: "Un projecteur pour chaque budget",
    items: [
      ["B", "Budget", "Entrée de gamme. Le prix le plus bas par projecteur, pour les clubs et les DJ mobiles."],
      ["S", "Standard", "La valeur sûre. Mieux construit, plus lumineux, plus de modes DMX."],
      ["P", "Premium", "Haut de gamme. Puissance maximale, toutes les fonctions, le plus souvent IP."],
    ],
    view: "Voir la gamme",
  },
  catalog: {
    kicker: "Catalogue produits 2027",
    title: "Chaque projecteur, chaque détail",
    text: "Photos, caractéristiques, modes DMX et fichiers console pour chaque produit. Chaque projecteur du catalogue imprimé a un QR code qui ouvre sa page sur votre téléphone, en français, néerlandais ou anglais.",
    points: ["Recherche par code, type ou puissance", "Demande de devis en un geste", "Fichiers console à télécharger", "Lien court pour l'ouvrir sur votre PC"],
    open: "Ouvrir le catalogue en ligne",
    pdf: "Télécharger le PDF",
  },
  shop: { kicker: "Boutique en ligne", title: "Vous préférez commander en ligne ?", text: "Rendez-vous sur notre boutique pour les articles à commander immédiatement.", cta: "Aller sur shop.luxiko.be" },
  contact: {
    kicker: "Contact",
    title: "Allumons la scène",
    text: "Dites-nous ce que vous préparez. Nous répondons en général sous un jour ouvrable.",
    name: "Nom",
    company: "Société",
    email: "E-mail",
    phone: "Téléphone",
    message: "Message",
    placeholder: "Salle, quantités, délais…",
    send: "Envoyer le message",
    sending: "Envoi…",
    sentTitle: "Merci.",
    sentText: "Nous avons bien reçu votre message et revenons vers vous rapidement.",
    error: "Une erreur s'est produite. Veuillez réessayer dans un instant.",
    privacy: "Nous utilisons vos données uniquement pour répondre à votre message.",
    direct: "En direct",
    tipTitle: "Un prix pour un projecteur précis ?",
    tip: "Ouvrez-le dans le catalogue et touchez Demander un devis.",
    tipCta: "Vers le catalogue",
  },
  footer: { tagline: "Lumière & son abordables", rights: "Tous droits réservés.", vat: "TVA", top: "Haut de page" },
  notFound: { title: "Page introuvable", text: "Cette page n'existe pas (ou plus).", cta: "Retour à l'accueil" },
};

export const languages = { en, nl, fr };
