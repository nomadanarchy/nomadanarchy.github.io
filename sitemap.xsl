<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  exclude-result-prefixes="sm">

  <xsl:output method="html" encoding="UTF-8" indent="yes"
    doctype-system="about:legacy-compat"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex"/>
        <title>Sitemap</title>
        <style>
          :root {
            --bg: #ffffff; --fg: #1a1a1a; --muted: #666;
            --border: #e2e2e2; --head: #f4f4f4; --link: #0b63ce;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --bg: #121212; --fg: #eaeaea; --muted: #9a9a9a;
              --border: #2c2c2c; --head: #1d1d1d; --link: #6cb2ff;
            }
          }
          * { box-sizing: border-box; }
          body {
            margin: 0; padding: 2rem 1rem;
            background: var(--bg); color: var(--fg);
            font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
          }
          main { max-width: 960px; margin: 0 auto; }
          h1 { margin: 0 0 .25rem; font-size: 1.6rem; }
          p.count { margin: 0 0 1.5rem; color: var(--muted); }
          .wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: .6rem .85rem; text-align: left; border-bottom: 1px solid var(--border); }
          th { background: var(--head); font-size: .85rem; text-transform: uppercase; letter-spacing: .04em; }
          tr:last-child td { border-bottom: 0; }
          td.url { word-break: break-all; }
          td.meta { white-space: nowrap; color: var(--muted); }
          a { color: var(--link); text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <main>
          <h1>Sitemap</h1>

          <xsl:choose>
            <!-- Sitemap index (links to other sitemaps) -->
            <xsl:when test="sm:sitemapindex">
              <p class="count"><xsl:value-of select="count(sm:sitemapindex/sm:sitemap)"/> sitemaps</p>
              <div class="wrap">
                <table>
                  <thead><tr><th>Sitemap</th><th>Last modified</th></tr></thead>
                  <tbody>
                    <xsl:for-each select="sm:sitemapindex/sm:sitemap">
                      <tr>
                        <td class="url">
                          <a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a>
                        </td>
                        <td class="meta"><xsl:value-of select="substring(sm:lastmod, 1, 10)"/></td>
                      </tr>
                    </xsl:for-each>
                  </tbody>
                </table>
              </div>
            </xsl:when>

            <!-- Normal URL sitemap -->
            <xsl:otherwise>
              <p class="count"><xsl:value-of select="count(sm:urlset/sm:url)"/> URLs</p>
              <div class="wrap">
                <table>
                  <thead>
                    <tr>
                      <th>URL</th>
                      <th>Last modified</th>
                      <th>Change freq.</th>
                      <th>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    <xsl:for-each select="sm:urlset/sm:url">
                      <tr>
                        <td class="url">
                          <a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a>
                        </td>
                        <td class="meta"><xsl:value-of select="substring(sm:lastmod, 1, 10)"/></td>
                        <td class="meta"><xsl:value-of select="sm:changefreq"/></td>
                        <td class="meta"><xsl:value-of select="sm:priority"/></td>
                      </tr>
                    </xsl:for-each>
                  </tbody>
                </table>
              </div>
            </xsl:otherwise>
          </xsl:choose>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
