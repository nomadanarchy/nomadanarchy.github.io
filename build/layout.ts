import type { Ctx } from "./context";
import { jsonLd } from "./jsonld";
import { attr, esc } from "./i18n";
import type { Body } from "./pages";

export interface Assets {
  /** Dev server entry. Vite injects its client and styles at runtime. */
  dev?: boolean;
  js?: string;
  css: string[];
}

const json = (value: unknown): string => JSON.stringify(value).replace(/</g, "\\u003c");

/** Runs before first paint so the saved theme never flashes. */
const themeInit = (light: string, dark: string): string =>
  `(function(){var t='light';try{var s=localStorage.getItem('theme');if(s==='dark'||s==='light')t=s}catch(e){}document.documentElement.setAttribute('data-theme',t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t==='dark'?'${dark}':'${light}')})();`;

const GLOBE =
  '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><circle cx="8" cy="8" r="6.5"/><ellipse cx="8" cy="8" rx="2.8" ry="6.5"/><line x1="1.5" y1="8" x2="14.5" y2="8"/></svg>';

const tag = (loc: { og: string }): string => loc.og.replace("_", "-");

export function layout(c: Ctx, body: Body, assets: Assets): string {
  const { site, pages } = c.data;
  const id = c.pageId;
  const page = pages[id];
  const indexed = id !== "not_found";
  const path = indexed ? c.pagePath(id) : "/404.html";
  const url = `${site.origin}${path}`;
  const title = c.plain(`page.${id}.title`);
  const description = c.plain(`page.${id}.description`);
  const logo = `${site.origin}/logo.png`;
  const logoAlt = c.plain("site.logo_alt");
  const multi = c.locales.length > 1;

  const head: string[] = [
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${attr(description)}">`,
  ];

  if (indexed) {
    head.push(`<link rel="canonical" href="${attr(url)}">`);
    if (multi) {
      for (const loc of c.locales)
        head.push(`<link rel="alternate" hreflang="${tag(loc)}" href="${attr(site.origin + c.pagePathIn(loc, id))}">`);
      const def = c.locales.find((l) => l.id === site.defaultLocale);
      if (def) head.push(`<link rel="alternate" hreflang="x-default" href="${attr(site.origin + c.pagePathIn(def, id))}">`);
    }
    head.push(
      `<meta property="og:type" content="website">`,
      `<meta property="og:site_name" content="${attr(site.name)}">`,
      `<meta property="og:title" content="${attr(title)}">`,
      `<meta property="og:description" content="${attr(description)}">`,
      `<meta property="og:url" content="${attr(url)}">`,
      `<meta property="og:locale" content="${attr(c.locale.og)}">`,
      ...c.locales.filter((l) => l !== c.locale).map((l) => `<meta property="og:locale:alternate" content="${attr(l.og)}">`),
      `<meta property="og:image" content="${logo}">`,
      `<meta property="og:image:width" content="256">`,
      `<meta property="og:image:height" content="256">`,
      `<meta property="og:image:alt" content="${attr(logoAlt)}">`,
      `<meta name="twitter:card" content="summary">`,
      `<meta name="twitter:title" content="${attr(title)}">`,
      `<meta name="twitter:description" content="${attr(description)}">`,
      `<meta name="twitter:image" content="${logo}">`,
      `<meta name="twitter:image:alt" content="${attr(logoAlt)}">`,
    );
  } else {
    head.push(`<meta name="robots" content="noindex">`);
  }

  head.push(
    `<link rel="icon" href="/logo.png" type="image/png">`,
    `<link rel="apple-touch-icon" href="/logo.png">`,
    `<meta name="theme-color" content="${site.themeColor.light}">`,
    `<script>${themeInit(site.themeColor.light, site.themeColor.dark)}</script>`,
  );
  for (const css of assets.css) head.push(`<link rel="stylesheet" href="${attr(css)}">`);
  if (assets.dev) head.push(`<script type="module" src="/src/main.ts"></script>`);
  else if (assets.js) head.push(`<script type="module" src="${attr(assets.js)}"></script>`);
  if (indexed) head.push(`<script type="application/ld+json">${json(jsonLd(c, url, title, description))}</script>`);

  const clientStrings = Object.fromEntries(c.keys("client.").map((k) => [k, c.source(k)]));
  // Each language offers the banner in its own words. A language without the three strings is never suggested.
  const bannerKeys = ["banner.text", "banner.go", "banner.dismiss"] as const;
  const langs =
    multi && indexed
      ? c.locales
          .filter((l) => bannerKeys.every((k) => l.lang[k] !== undefined))
          .map((l) => ({
            tag: tag(l),
            code: l.code,
            href: c.pagePathIn(l, id),
            text: l.lang["banner.text"],
            go: l.lang["banner.go"],
            dismiss: l.lang["banner.dismiss"],
          }))
      : [];
  head.push(
    `<script type="application/json" id="site-data">${json({
      i18n: clientStrings,
      themeColor: site.themeColor,
      discord: site.discord,
      langs,
      current: tag(c.locale),
    })}</script>`,
  );

  const nav = site.nav
    .map((item) => {
      const href = c.href(item.href);
      const current = href === path ? ' aria-current="page"' : "";
      const rel = href.startsWith("http") ? ' rel="noopener"' : "";
      return `<a href="${attr(href)}"${current}${rel}>${c.t(item.label)}</a>`;
    })
    .join('<span class="nav-sep">&raquo;</span>\n        ');

  const homePath = c.pagePath("home");
  const siteTitle = `<a href="${homePath}">${esc(site.name)}</a>`;
  const titleEl =
    id === "home" ? `<h1 class="site-title" translate="no">${siteTitle}</h1>` : `<div class="site-title" translate="no">${siteTitle}</div>`;

  const eaglerLink = (page?.eaglerLink ?? true) ? `\n          <p>${c.t("sidebar.play_browser")}</p>` : "";
  const widget = page?.widget
    ? `\n        <div class="discord-widget" translate="no" aria-live="polite" role="region" aria-label="${attr(c.plain("sidebar.widget_label"))}"></div>`
    : "";

  const langLabel = attr(c.plain("nav.language"));
  const langMenu =
    multi && indexed
      ? `<details class="lang-menu">
          <summary aria-label="${langLabel}" title="${langLabel}">${GLOBE}<span lang="${tag(c.locale)}">${esc(c.locale.name)}</span></summary>
          <div class="lang-popup">
          <ul>
            ${c.locales
              .map((loc) =>
                loc === c.locale
                  ? `<li><span lang="${tag(loc)}" aria-current="true">${esc(loc.name)}</span></li>`
                  : `<li><a href="${attr(c.pagePathIn(loc, id))}" hreflang="${tag(loc)}" lang="${tag(loc)}">${esc(loc.name)}</a></li>`,
              )
              .join("\n            ")}
          </ul>
          <p class="lang-help">${c.t("nav.help_translate")}</p>
          </div>
        </details>
        `
      : "";

  return `<!DOCTYPE html>
<html lang="${attr(c.locale.code)}">
<head>
  ${head.join("\n  ")}
</head>
<body>
  <a class="skip" href="#main">${c.t("a11y.skip")}</a>

  <div class="wrap">
    <header>
      ${titleEl}
      <nav class="nav" aria-label="${attr(c.plain("a11y.nav"))}">
        ${langMenu}${nav}
        <button id="theme-btn" class="theme-btn" type="button"></button>
      </nav>
    </header>

    <div class="columns">
      <aside class="sidebar sidebar-left">
        <div class="panel">
          <p>${c.t("sidebar.server_ip")}</p>
          <span class="server-ip" translate="no">${esc(site.server.ip)}</span>
          <p>${c.t("sidebar.versions")}</p>${eaglerLink}
        </div>
      </aside>

      <div class="center">
        <main id="main" class="panel" tabindex="-1">
          <div class="center-scroll">
${body.main}
          </div>
        </main>
      </div>

      <aside class="sidebar sidebar-right">
        <div class="panel">
          <p>${c.t("sidebar.world_started", c.worldStarted())}</p>${widget}
          <div class="pinned-note">
            <ul class="links">
              <li><a href="/discord">${c.t("sidebar.discord")}</a></li>
              <li><a href="${attr(site.social.youtube)}" rel="noopener">${c.t("sidebar.youtube")}</a></li>
              <li><a href="${attr(site.social.instagram)}" rel="noopener">${c.t("sidebar.instagram")}</a></li>
              <li><a href="${attr(site.social.tiktok)}" rel="noopener">${c.t("sidebar.tiktok")}</a></li>
              <li><a href="${c.pagePath("privacy")}">${c.t("sidebar.privacy")}</a></li>
            </ul>
            <p>${c.t("sidebar.disclaimer")}</p>
          </div>
        </div>
      </aside>
    </div>
  </div>
${body.after ? `\n${body.after}\n` : ""}</body>
</html>
`;
}
