import { DEFAULT_QUOTE_PURPOSES } from "./defaults";
import { getSetting, setSetting } from "./settings";

export type QuoteOption = { label: string; enabled: boolean };

/** All options of the quote form's "For" field, as set in the admin. */
export function quoteOptions(): QuoteOption[] {
  const raw = getSetting("quote:purposes");
  if (!raw) return DEFAULT_QUOTE_PURPOSES;
  try {
    const list = JSON.parse(raw) as QuoteOption[];
    return Array.isArray(list) ? list.filter((o) => typeof o?.label === "string") : DEFAULT_QUOTE_PURPOSES;
  } catch {
    return DEFAULT_QUOTE_PURPOSES;
  }
}

/** The options visitors can pick (switched-on ones only). */
export function quotePurposes(): string[] {
  return quoteOptions()
    .filter((o) => o.enabled)
    .map((o) => o.label);
}

export function saveQuoteOptions(list: QuoteOption[]) {
  setSetting("quote:purposes", JSON.stringify(list));
}
