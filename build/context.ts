import { type SiteData, buildVars } from "./data";
import { type Locale, type Translator, createTranslator } from "./i18n";

export interface Ctx extends Translator {
  data: SiteData;
  locale: Locale;
  locales: Locale[];
  pageId: string;
  /** URL path of a page id in this locale. */
  pagePath(id: string, hash?: string): string;
  /** URL path of a page id in another locale. */
  pagePathIn(locale: Locale, id: string): string;
  /** Resolve a nav-style href: {vars}, then @pageId, else as written. */
  href(href: string): string;
  /** "1st november 2026" style date from an ISO date. */
  date(iso: string, ordinal?: boolean): string;
  /** The "world started" line value, in the world's own time zone. */
  worldStarted(): string;
}

export function localizedPath(locale: Locale, path: string): string {
  if (!locale.prefix) return path;
  return path === "/" ? `/${locale.prefix}/` : `/${locale.prefix}${path}`;
}

export function createCtx(
  data: SiteData,
  locale: Locale,
  fallback: Locale,
  locales: Locale[],
  pageId: string,
  onMissing?: (locale: string, key: string) => void,
): Ctx {
  const pagePathIn = (loc: Locale, id: string, hash = ""): string => {
    const page = data.pages[id];
    if (!page) throw new Error(`Unknown page id "@${id}"`);
    return localizedPath(loc, page.path) + hash;
  };

  const tr = createTranslator({
    locale,
    fallback,
    vars: buildVars(data),
    link: (id, hash) => pagePathIn(locale, id, hash),
    onMissing: (key) => onMissing?.(locale.id, key),
  });

  const tag = locale.og.replace("_", "-");

  const ordinalOf = (n: number): string => {
    const category = new Intl.PluralRules(tag, { type: "ordinal" }).select(n);
    const key = `date.ordinal.${category}`;
    return tr.plain(tr.own(key) ? key : "date.ordinal.other", n);
  };

  const format = (y: number, m: number, d: number, ordinal: boolean): string =>
    tr.plain("date.long", ordinal ? ordinalOf(d) : String(d), tr.plain(`month.${m}`), String(y));

  return {
    ...tr,
    data,
    locale,
    locales,
    pageId,
    pagePath: (id, hash) => pagePathIn(locale, id, hash),
    pagePathIn: (loc, id) => pagePathIn(loc, id),
    href(href) {
      const resolved = tr.vars(href);
      const match = /^@([a-z0-9_]+)(#.*)?$/.exec(resolved);
      return match ? pagePathIn(locale, match[1] as string, match[2] ?? "") : resolved;
    },
    date(iso, ordinal = true) {
      const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
      return format(y, m, d, ordinal);
    },
    worldStarted() {
      const when = new Date(data.site.server.worldStarted);
      const zone = data.site.server.worldStartedZone;
      const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(
        when,
      );
      const part = (type: string): number => Number(parts.find((p) => p.type === type)?.value);
      const day = format(part("year"), part("month"), part("day"), false);
      const time = new Intl.DateTimeFormat(tag, { timeZone: zone, hour: "numeric", minute: "2-digit", timeZoneName: "short" })
        .format(when)
        .replace(/\u202f/g, " ");
      return tr.plain("date.with_time", day, time);
    },
  };
}
