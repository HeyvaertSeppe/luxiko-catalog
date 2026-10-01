/** Starting data for a fresh install — everything here is editable in the admin. */

export const DEFAULT_SECTIONS = [
  { name: "Moving Heads", prefix: "MV" },
  { name: "PAR Cans", prefix: "PR" },
  { name: "LED & Pixel Bars", prefix: "BR" },
  { name: "Wash / City Colors", prefix: "WL" },
  { name: "Blinders", prefix: "BL" },
  { name: "Strobes", prefix: "ST" },
  { name: "Effect Lights", prefix: "FX" },
  { name: "Pinspots", prefix: "PS" },
  { name: "Profiles & Spots", prefix: "PF" },
  { name: "Fresnels", prefix: "FR" },
  { name: "Gobo Projectors", prefix: "GP" },
  { name: "Lasers", prefix: "LS" },
  { name: "Matrix Panels", prefix: "MX" },
  { name: "Tube Lights", prefix: "TB" },
  { name: "Mirror Balls", prefix: "MB" },
  { name: "Retro & Vintage", prefix: "RT" },
  { name: "Fog & Haze Machines", prefix: "FM" },
  { name: "Accessories", prefix: "AC" },
];

/** Console / software brands for fixture library downloads. */
export const DEFAULT_BRANDS = [
  { slug: "grandma3", name: "grandMA3", short: "MA3", color: "#1a1a1a", textColor: "#ffffff", accept: ".xml,.gdtf,.zip", hint: "Fixture type (.xml / .gdtf)" },
  { slug: "grandma2", name: "grandMA2", short: "MA2", color: "#3a3a3a", textColor: "#ffffff", accept: ".xml,.xmlp,.zip", hint: "Fixture type (.xml)" },
  { slug: "chamsys", name: "ChamSys MagicQ", short: "MQ", color: "#0b4f9c", textColor: "#ffffff", accept: ".hed,.zip", hint: "Personality (.hed)" },
  { slug: "avolites", name: "Avolites Titan / Tiger Touch", short: "AVO", color: "#d7262e", textColor: "#ffffff", accept: ".d4,.zip", hint: "Personality (.d4)" },
];

/** Options of the "For" field in the quote form. */
export const DEFAULT_QUOTE_PURPOSES = [
  { label: "Purchase", enabled: true },
  { label: "Installation project", enabled: true },
  { label: "Rental", enabled: false },
  { label: "Other", enabled: true },
];

export const DEFAULT_IP_RATINGS = ["IP20", "IP25", "IP54", "IP56", "IP65", "IP66", "OUTDOOR", "IP N/A"];
