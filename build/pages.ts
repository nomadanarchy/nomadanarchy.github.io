import type { Ctx } from "./context";
import { pageUpdated } from "./data";
import { attr, esc, raw } from "./i18n";

export interface Body {
  /** Contents of the scrolling centre panel. */
  main: string;
  /** Markup placed after the page wrapper (dialogs). */
  after?: string;
}

const lastUpdated = (c: Ctx): string => {
  const updated = pageUpdated(c.data, c.pageId);
  return updated ? `<p class="last-updated">${c.t("page.last_updated", c.date(updated))}</p>` : "";
};

function home(c: Ctx): Body {
  const news = c.data.news
    .map(
      (n) => `<div class="news-entry">
  <h3>${esc(c.date(n.date))}</h3>
  <p>${c.t(`news.${n.id}`)}</p>
</div>`,
    )
    .join("\n");
  return {
    main: `<h2 translate="no">${esc(c.data.site.name)}</h2>
<p>${c.t("page.home.intro")}</p>
<h2>${c.t("page.home.news")}</h2>
${news}
${lastUpdated(c)}`,
  };
}

function eaglercraft(c: Ctx): Body {
  const p = "page.eaglercraft.";
  const rows = c.data.eagler
    .map((cl) => {
      const build =
        "hacked" in cl && cl.hacked ? c.t(`${p}build_wasm_hacked`) : cl.wasm ? c.t(`${p}build_wasm`) : c.t(`${p}build_standard`);
      const text =
        "playName" in cl ? c.t(`${p}play_named`, cl.playName as string) : c.t(cl.wasm ? `${p}play_wasm` : `${p}play_standard`, cl.version);
      return `<tr>
  <td translate="no">${esc(cl.label)}</td>
  <td>${build}</td>
  <td><a href="/game/${attr(cl.file)}">${text}</a></td>
</tr>`;
    })
    .join("\n");
  return {
    main: `<h1>${c.t(`${p}heading`)}</h1>
<p>${c.t(`${p}intro_1`)}</p>
<p>${c.t(`${p}intro_2`)}</p>

<table class="eagler-table" aria-label="${attr(c.plain(`${p}table_label`))}">
  <thead>
    <tr>
      <th scope="col">${c.t(`${p}col_version`)}</th>
      <th scope="col">${c.t(`${p}col_build`)}</th>
      <th scope="col">${c.t(`${p}col_play`)}</th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>

<p>${c.t(`${p}footer`)}</p>
${lastUpdated(c)}`,
  };
}

function vote(c: Ctx): Body {
  const p = "page.vote.";
  const rewards = c.data.votes.rewards
    .map((r) => {
      const name = raw(c.t(`vote.reward.${r.id}`));
      return `<li>${r.code ? c.t(`${p}reward`, r.votes, name, r.code) : c.t(`${p}reward_nocode`, r.votes, name)}</li>`;
    })
    .join("\n");
  const sites = c.data.votes.sites
    .map((s) => {
      const mark = "important" in s && s.important ? `<span class="important">${c.t(`${p}most_important`)}</span> ` : "";
      return `<li>${mark}<a href="${attr(s.url)}" rel="noopener">${esc(s.name)}</a></li>`;
    })
    .join("\n");
  return {
    main: `<h1>${c.t(`${p}heading`)}</h1>
<p>${c.t(`${p}intro`)}</p>

<p>${c.t(`${p}rewards_intro`)}</p>
<ul>
${rewards}
</ul>

<ol class="vote-list">
${sites}
</ol>

${lastUpdated(c)}`,
  };
}

function anarchymod(c: Ctx): Body {
  const p = "page.anarchymod.";
  const { mod } = c.data.site;
  const { version, rows } = c.data.downloads;
  const table = rows
    .map((r) => {
      const jar = `${mod.repo}/releases/download/nightly/unblockbannedservers-mc-${r.from}-${r.to}-${version}.jar`;
      const cf = `${mod.curseforge}/files/${r.curseforge}`;
      const mr = `${mod.modrinth}/version/${r.modrinth}`;
      const series = r.series.length === 2 ? c.t(`${p}series_range`, ...r.series) : esc(r.series[0] ?? "");
      const label = r.from === r.to ? esc(r.from) : `${esc(r.from)}&ndash;${esc(r.to)}`;
      return `<tr>
  <td>${series}</td>
  <td translate="no">
    <a class="version-link" href="${attr(jar)}" data-curseforge="${attr(cf)}" data-modrinth="${attr(mr)}" rel="noopener" download>${label}</a>
    <span class="download-mirrors"><a href="${attr(cf)}" rel="noopener">CurseForge</a> &middot; <a href="${attr(mr)}" rel="noopener">Modrinth</a></span>
  </td>
</tr>`;
    })
    .join("\n");

  return {
    main: `<h1>${c.t(`${p}heading`)}</h1>
<p>${c.t(`${p}intro`)}</p>

<section id="installation">
  <h2>${c.t(`${p}install_heading`)}</h2>
  <ol>
    <li>
      ${c.t(`${p}install_1`)}
      <ul>
        <li>${c.t(`${p}loader_new`)}</li>
        <li>${c.t(`${p}loader_old`)}</li>
      </ul>
    </li>
    <li>${c.t(`${p}install_2`)}</li>
    <li>${c.t(`${p}install_3`)}</li>
    <li>${c.t(`${p}install_4`)}</li>
    <li>${c.t(`${p}install_5`)}</li>
  </ol>
</section>

<h2>${c.t(`${p}downloads_heading`)}</h2>
<p>${c.t(`${p}downloads_hint`)}</p>

<table id="downloads-table" class="eagler-table" aria-label="${attr(c.plain(`${p}table_label`))}">
  <thead>
    <tr>
      <th scope="col">${c.t(`${p}col_series`)}</th>
      <th scope="col">${c.t(`${p}col_versions`)}</th>
    </tr>
  </thead>
  <tbody>
${table}
  </tbody>
</table>

${lastUpdated(c)}`,
    after: `<dialog id="version-dialog" class="version-dialog" aria-labelledby="version-dialog-title">
  <h2 id="version-dialog-title" translate="no">${c.t(`${p}dialog_title`, raw('<span id="version-dialog-mc"></span>'))}</h2>
  <p>${c.t(`${p}dialog_hint`)}</p>
  <ul class="version-options" id="version-dialog-options"></ul>
  <button type="button" class="version-close" id="version-dialog-close">${c.t(`${p}dialog_cancel`)}</button>
</dialog>`,
  };
}

function privacy(c: Ctx): Body {
  const p = "page.privacy.";
  const relays = c.data.relays.map((r) => `<li>${c.t(`${p}relay`, r.host, r.operator, r.url, r.domain)}</li>`).join("\n");
  const section = (heading: string, ...paragraphs: string[]): string => `<h2>${c.t(`${p}${heading}`)}</h2>\n${paragraphs.join("\n")}`;
  const para = (key: string): string => `<p>${c.t(`${p}${key}`)}</p>`;
  return {
    main: `<h1>${c.t(`${p}heading`)}</h1>

${section("site_heading", para("site_text"))}

${section(
  "hosting_heading",
  para("hosting_text"),
  `<ul>\n<li>${c.t(`${p}hosting_github`)}</li>\n<li>${c.t(`${p}hosting_cloudflare`)}</li>\n</ul>`,
)}

${section("eagler_heading", para("eagler_text"), `<ul>\n${relays}\n</ul>`, para("eagler_relays"), para("eagler_storage"))}

${section("widget_heading", para("widget_text"), para("widget_policy"))}

${section("server_heading", para("server_text_1"), para("server_text_2"))}

${section("other_heading", para("other_text"))}

${section("contact_heading", para("contact_text"))}

${lastUpdated(c)}`,
  };
}

function notFound(c: Ctx): Body {
  const p = "page.not_found.";
  return {
    main: `<h1>${c.t(`${p}heading`)}</h1>
<p>${c.t(`${p}text`)}</p>
<p>${c.t(`${p}back`)}</p>`,
  };
}

export const bodies: Record<string, (c: Ctx) => Body> = {
  home,
  eaglercraft,
  vote,
  anarchymod,
  privacy,
  not_found: notFound,
};
