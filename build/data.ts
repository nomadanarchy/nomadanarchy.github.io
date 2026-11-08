import { readFileSync } from "node:fs";

export type Site = typeof import("../src/data/site.json");
export type Downloads = typeof import("../src/data/downloads.json");
export type News = typeof import("../src/data/news.json");
export type Votes = typeof import("../src/data/votes.json");
export type EaglerClients = typeof import("../src/data/eaglercraft.json");
export type Relays = typeof import("../src/data/relays.json");
export type Robots = typeof import("../src/data/robots.json");
export type Redirects = Record<string, string>;
export interface PageMeta {
  path: string;
  updated?: string;
  changefreq: string;
  priority: number;
  widget: boolean;
  eaglerLink: boolean;
}
export type Pages = Record<string, PageMeta>;

export interface SiteData {
  site: Site;
  pages: Pages;
  redirects: Redirects;
  news: News;
  votes: Votes;
  eagler: EaglerClients;
  relays: Relays;
  robots: Robots;
  downloads: Downloads;
}

const dataDir = new URL("../src/data/", import.meta.url);
const read = <T>(file: string): T => JSON.parse(readFileSync(new URL(file, dataDir), "utf8")) as T;

/** Read fresh every call so the dev server picks up edits without a restart. */
export function loadData(): SiteData {
  return {
    site: read("site.json"),
    pages: read("pages.json"),
    redirects: read("redirects.json"),
    news: read("news.json"),
    votes: read("votes.json"),
    eagler: read("eaglercraft.json"),
    relays: read("relays.json"),
    robots: read("robots.json"),
    downloads: read("downloads.json"),
  };
}

/** Values available to translations as {dotted.name}. */
export function buildVars(data: SiteData): Record<string, unknown> {
  const rows = data.downloads.rows;
  const first = rows[0]?.from ?? "";
  const last = rows[rows.length - 1]?.to ?? "";
  return {
    ...data.site,
    site: { name: data.site.name, origin: data.site.origin },
    mod: {
      ...data.site.mod,
      version: data.downloads.version,
      first,
      last,
      range: `${first} to ${last}`,
    },
  };
}

/** Last change date for a page. The home page follows its newest news entry. */
export function pageUpdated(data: SiteData, id: string): string | undefined {
  const own = data.pages[id]?.updated;
  if (own || id !== "home") return own;
  return data.news
    .map((n) => n.date)
    .sort()
    .at(-1);
}
