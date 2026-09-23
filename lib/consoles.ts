export const CONSOLES = [
  {
    id: "grandma2",
    name: "grandMA2",
    maker: "MA Lighting",
    hint: "Fixture type (.xml)",
    accept: ".xml,.xmlp,.zip",
  },
  {
    id: "grandma3",
    name: "grandMA3",
    maker: "MA Lighting",
    hint: "Fixture type (.xml / .gdtf)",
    accept: ".xml,.gdtf,.zip",
  },
  {
    id: "chamsys",
    name: "ChamSys MagicQ",
    maker: "ChamSys",
    hint: "Personality (.hed)",
    accept: ".hed,.zip",
  },
  {
    id: "avolites",
    name: "Avolites Tiger Touch",
    maker: "Avolites",
    hint: "Personality (.d4)",
    accept: ".d4,.zip",
  },
] as const;

export type ConsoleId = (typeof CONSOLES)[number]["id"];

export function isConsoleId(v: string): v is ConsoleId {
  return CONSOLES.some((c) => c.id === v);
}

export function consoleById(id: string) {
  return CONSOLES.find((c) => c.id === id);
}
