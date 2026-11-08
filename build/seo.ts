import type { Ctx } from "./context";
import { type SiteData, pageUpdated } from "./data";
import type { Locale } from "./i18n";
import { attr } from "./i18n";

/**
 * Disallow rules come first and there is no `Allow: /` (allowed is the default).
 * Crawlers that read rules top to bottom would otherwise stop at `Allow: /` and
 * ignore the Disallow below it. A bot that has its own group ignores the `*` group,
 * so every named group repeats the disallow list.
 */
export function robotsTxt(data: SiteData): string {
  const { disallow, named, blocked } = data.robots;
  const rules = disallow.map((path) => `Disallow: ${path}`).join("\n");
  const banner = (title: string): string => {
    const line = "#".repeat(title.length + 6);
    return `${line}\n## ${title} ##\n${line}`;
  };
  const sections = [
    `User-agent: *\n${rules}`,
    `${named.map((agent) => `User-agent: ${agent}`).join("\n")}\n${rules}`,
    ...blocked.map(({ title, agents }) => `${banner(title)}\n\n${agents.map((agent) => `User-agent: ${agent}\nDisallow: /`).join("\n\n")}`),
    `Sitemap: ${data.site.origin}/sitemap.xml`,
  ];
  return `${sections.join("\n\n")}\n`;
}

export function sitemapXml(data: SiteData, locales: Locale[], ctxs: Map<string, Ctx>): string {
  const multi = locales.length > 1;
  const entries: string[] = [];
  for (const loc of locales) {
    for (const [id, page] of Object.entries(data.pages)) {
      const c = ctxs.get(`${loc.id}:${id}`) as Ctx;
      const lastmod = pageUpdated(data, id);
      const alternates = multi
        ? locales
            .map(
              (l) =>
                `    <xhtml:link rel="alternate" hreflang="${l.og.replace("_", "-")}" href="${attr(data.site.origin + c.pagePathIn(l, id))}"/>`,
            )
            .join("\n")
        : "";
      entries.push(
        `  <url>
    <loc>${attr(data.site.origin + c.pagePath(id))}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority.toFixed(1)}</priority>${alternates ? `\n${alternates}` : ""}
  </url>`,
      );
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${multi ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : ""}>
${entries.join("\n")}
</urlset>
`;
}

/** The Expires date moves forward on every deploy, so there is nothing to renew by hand. */
export function securityTxt(data: SiteData, locales: Locale[], now: Date): string {
  const expires = new Date(now.getTime() + 360 * 24 * 60 * 60 * 1000).toISOString();
  return `Contact: https://discord.gg/${data.site.discord.invite}
Expires: ${expires}
Preferred-Languages: ${locales.map((l) => l.code).join(", ")}
Canonical: ${data.site.origin}/.well-known/security.txt
`;
}
