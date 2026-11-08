import { type Ctx, createCtx } from "./context";
import { loadData } from "./data";
import { type Locale, attr, loadLocale } from "./i18n";
import { type Assets, layout } from "./layout";
import { bodies } from "./pages";
import { robotsTxt, securityTxt, sitemapXml } from "./seo";

export interface RenderOptions {
  assets: Assets;
  now?: Date;
}

export interface RenderResult {
  /** Output path (relative to dist) to file contents. */
  files: Record<string, string>;
  warnings: string[];
}

/** '/' -> index.html, '/x' -> x.html, '/x/' -> x/index.html. Matches how GitHub Pages resolves URLs. */
export function outFile(urlPath: string): string {
  if (urlPath === "/") return "index.html";
  const trimmed = urlPath.replace(/^\//, "");
  return trimmed.endsWith("/") ? `${trimmed}index.html` : `${trimmed}.html`;
}

function redirectStub(target: string, c: Ctx): string {
  const js = JSON.stringify(target).replace(/</g, "\\u003c");
  return `<!DOCTYPE html>
<html lang="${attr(c.locale.code)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${c.t("redirect.title")}</title>
<meta http-equiv="refresh" content="0; url=${attr(target)}">
<link rel="canonical" href="${attr(target)}">
<script>location.replace(${js} + location.search + location.hash);</script>
</head>
<body>
<p>${c.t("redirect.text", target)}</p>
</body>
</html>
`;
}

export function renderSite({ assets, now = new Date() }: RenderOptions): RenderResult {
  const data = loadData();
  const fallback = loadLocale(data.site.defaultLocale);
  const locales: Locale[] = data.site.locales.map((id) => (id === fallback.id ? fallback : loadLocale(id)));

  if (!locales.includes(fallback)) throw new Error(`defaultLocale "${fallback.id}" must be listed in locales`);
  for (const loc of locales) {
    if (loc !== fallback && !loc.prefix) throw new Error(`${loc.id}: set "language.path" (for example "de") so it gets its own URL prefix`);
  }

  const warnings: string[] = [];
  const onMissing = (locale: string, key: string) => warnings.push(`${locale}: missing "${key}", using ${fallback.id}`);
  const ctxs = new Map<string, Ctx>();
  const files: Record<string, string> = {};

  for (const loc of locales) {
    for (const id of Object.keys(data.pages)) {
      const render = bodies[id];
      if (!render) throw new Error(`No body renderer for page "${id}" in build/pages.ts`);
      const c = createCtx(data, loc, fallback, locales, id, onMissing);
      ctxs.set(`${loc.id}:${id}`, c);
      files[outFile(c.pagePath(id))] = layout(c, render(c), assets);
    }
  }

  const home = ctxs.get(`${fallback.id}:home`) as Ctx;
  const notFound = createCtx(data, fallback, fallback, locales, "not_found", onMissing);
  files["404.html"] = layout(notFound, (bodies.not_found as NonNullable<(typeof bodies)["not_found"]>)(notFound), assets);

  const pagePaths = new Set(locales.flatMap((l) => Object.keys(data.pages).map((id) => (ctxs.get(`${l.id}:${id}`) as Ctx).pagePath(id))));
  for (const [from, to] of Object.entries(data.redirects)) {
    if (!from.startsWith("/") || from === "/") throw new Error(`Redirect source "${from}" must start with / and name a path`);
    if (from === "/game" || from.startsWith("/game/")) throw new Error(`Redirect source "${from}" collides with the Eaglercraft clients`);
    if (pagePaths.has(from)) throw new Error(`Redirect source "${from}" is also a page`);
    files[outFile(from)] = redirectStub(home.vars(to), home);
  }

  files["robots.txt"] = robotsTxt(data);
  files["sitemap.xml"] = sitemapXml(data, locales, ctxs);
  files[".well-known/security.txt"] = securityTxt(data, locales, now);
  files[`${data.site.indexnow.key}.txt`] = `${data.site.indexnow.key}\n`;

  return { files, warnings };
}
