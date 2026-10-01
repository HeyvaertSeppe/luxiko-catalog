import { db } from "./db";

export type Section = { id: number; name: string; prefix: string; sortOrder: number };

export function listSections(): Section[] {
  return (
    db().prepare("SELECT id, name, prefix, sort_order FROM sections ORDER BY sort_order, id").all() as {
      id: number;
      name: string;
      prefix: string;
      sort_order: number;
    }[]
  ).map((r) => ({ id: r.id, name: r.name, prefix: r.prefix, sortOrder: r.sort_order }));
}

/** Position of a category in the catalog order (unknown ones go last). */
export function sectionOrder(): (name: string) => number {
  const list = listSections();
  const index = new Map(list.map((s, i) => [s.name, i]));
  return (name) => index.get(name) ?? list.length;
}

export function sectionPrefix(name: string) {
  return listSections().find((s) => s.name === name)?.prefix || name.slice(0, 2).toUpperCase();
}
