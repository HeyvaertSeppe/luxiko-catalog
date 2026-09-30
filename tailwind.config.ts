import type { Config } from "tailwindcss";

// House style of the LUXIKO 2027 catalog. Tailwind v3 compiles to plain CSS
// (no cascade layers / @property), so the site also works on older phones
// and in the in-app browsers that open when a QR code is scanned.
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    borderRadius: { none: "0", DEFAULT: "0", full: "9999px" },
    extend: {
      fontFamily: {
        sans: ['"Open Sauce One"', "ui-sans-serif", "system-ui", "-apple-system", '"Segoe UI"', "Roboto", "sans-serif"],
        label: ['"League Spartan"', '"Open Sauce One"', "ui-sans-serif", "sans-serif"],
      },
      colors: {
        ink: "#111111",
        navy: { DEFAULT: "#202a4b", dark: "#161d36" },
        orange: { DEFAULT: "#f2ae1c", dark: "#b87d05" },
        grey: "#6f7485",
        line: "#e3e5ec",
        zebra: "#f5f6f9",
        danger: "#c0392b",
        ok: "#1e8a4c",
      },
    },
  },
  plugins: [],
} satisfies Config;
