import { readFileSync } from "node:fs";
import { format } from "../src/shared/format";

export type Lang = Record<string, string>;

export interface Locale {
  /** File name without extension, like Minecraft's `en_us`. */
  id: string;
  /** Value for <html lang>. */
  code: string;
  /** Value for og:locale. */
  og: string;
  /** URL prefix without slashes. Empty for the default locale. */
  prefix: string;
  name: string;
  lang: Lang;
}

const langDir = new URL("../src/lang/", import.meta.url);

/** "/ru/" and "ru" both mean the URL prefix `ru`. A stray leading slash used to produce //ru/, which browsers read as the host "ru". */
export function normalizePrefix(raw: string): string {
  const prefix = raw.replace(/^\/+|\/+$/g, "");
  if (prefix && !/^[a-z0-9-]+$/i.test(prefix)) {
    throw new Error(`"language.path" must be letters, digits or dashes, like "ru" (got "${raw}")`);
  }
  return prefix;
}

export function loadLocale(id: string): Locale {
  const lang = JSON.parse(readFileSync(new URL(`${id}.json`, langDir), "utf8")) as Lang;
  return {
    id,
    code: lang["language.code"] ?? id.split("_")[0] ?? id,
    og: lang["language.og"] ?? id,
    prefix: normalizePrefix(lang["language.path"] ?? ""),
    name: lang["language.name"] ?? id,
    lang,
  };
}

export const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const attr = (s: string): string => esc(s).replace(/"/g, "&quot;");

/** Marks a string as already-safe HTML so it is not escaped when used as an argument. */
export class Html {
  constructor(readonly html: string) {}
}
export const raw = (html: string): Html => new Html(html);

export type Arg = string | number | Html;

export interface Translator {
  /** Translation as trusted HTML. Arguments are escaped unless wrapped in raw(). */
  t(key: string, ...args: Arg[]): string;
  /** Translation as plain text (meta tags, JSON-LD). Must contain no markup. */
  plain(key: string, ...args: Arg[]): string;
  /** True if this locale itself (not the fallback) defines the key. */
  own(key: string): boolean;
  /** Resolve {vars} only, for non-translation strings such as redirect targets. */
  vars(s: string): string;
  /** The template with {vars} resolved and %s left in place, for strings formatted in the browser. */
  source(key: string): string;
  /** Every key of the default locale that starts with the prefix. */
  keys(prefix: string): string[];
}

export interface TranslatorOptions {
  locale: Locale;
  fallback: Locale;
  vars: Record<string, unknown>;
  /** Maps `@pageId` (plus optional #hash) to a URL path for this locale. */
  link(id: string, hash: string): string;
  /** Called once per key that falls back to the default locale. */
  onMissing?(key: string): void;
}

function dig(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
}

export function createTranslator(o: TranslatorOptions): Translator {
  const reported = new Set<string>();

  const lookup = (key: string): string => {
    const own = o.locale.lang[key];
    if (own !== undefined) return own;
    const fb = o.fallback.lang[key];
    if (fb === undefined) throw new Error(`Missing translation key "${key}" in ${o.fallback.id}`);
    if (!reported.has(key)) {
      reported.add(key);
      o.onMissing?.(key);
    }
    return fb;
  };

  const vars = (s: string): string =>
    s.replace(/\{([a-z][\w.]*)\}/gi, (_, name: string) => {
      const value = dig(o.vars, name);
      if (value === undefined || value === null || typeof value === "object") {
        throw new Error(`Unknown variable {${name}} in "${s.slice(0, 60)}"`);
      }
      return String(value);
    });

  const links = (s: string): string =>
    s.replace(/href="@([a-z0-9_]+)(#[^"]*)?"/g, (_, id: string, hash: string | undefined) => `href="${o.link(id, hash ?? "")}"`);

  const nt = (s: string): string => s.replace(/<nt>([\s\S]*?)<\/nt>/g, '<span translate="no" class="notranslate">$1</span>');

  return {
    t(key, ...args) {
      const escaped = args.map((a) => (a instanceof Html ? a.html : esc(String(a))));
      return format(nt(links(vars(lookup(key)))), escaped);
    },
    plain(key, ...args) {
      const out = format(
        vars(lookup(key)),
        args.map((a) => (a instanceof Html ? a.html : String(a))),
      );
      if (/[<>]/.test(out)) throw new Error(`Translation "${key}" is used as plain text but contains markup`);
      return out;
    },
    own: (key) => o.locale.lang[key] !== undefined,
    vars,
    source: (key) => vars(lookup(key)),
    keys: (prefix) => Object.keys(o.fallback.lang).filter((k) => k.startsWith(prefix)),
  };
}
