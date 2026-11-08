import type { Ctx } from "./context";
import { pageUpdated } from "./data";

type Json = Record<string, unknown>;

const listItems = (items: Json[]): Json[] => items.map((item, i) => ({ "@type": "ListItem", position: i + 1, ...item }));

/** Structured data for one page. Everything is derived from the same data the page body uses. */
export function jsonLd(c: Ctx, url: string, title: string, description: string): Json {
  const { site, pages, votes, eagler } = c.data;
  const origin = site.origin;
  const page = pages[c.pageId];
  const updated = pageUpdated(c.data, c.pageId);
  const id = (suffix: string): string => `${origin}${page?.path ?? "/"}#${suffix}`;
  const lang = c.locale.code;

  const graph: Json[] = [
    {
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      name: site.name,
      url: `${origin}/`,
      ...(c.pageId === "home" ? { description } : {}),
      inLanguage: lang,
      publisher: { "@id": `${origin}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${origin}/#organization`,
      name: site.name,
      url: `${origin}/`,
      logo: { "@type": "ImageObject", url: `${origin}/logo.png` },
      sameAs: [`https://discord.gg/${site.discord.invite}`, site.social.youtube, site.social.instagram, site.social.tiktok],
    },
  ];

  const webpage: Json = {
    "@type": "WebPage",
    "@id": id("webpage"),
    url,
    name: title,
    description,
    inLanguage: lang,
    isPartOf: { "@id": `${origin}/#website` },
    dateModified: updated,
  };
  const extra: Json[] = [];

  switch (c.pageId) {
    case "home": {
      webpage.mainEntity = { "@id": id("gameserver") };
      extra.push({
        "@type": "GameServer",
        "@id": id("gameserver"),
        name: site.name,
        url: `${origin}/`,
        game: { "@type": "VideoGame", name: "Minecraft", gamePlatform: "PC" },
        serverAddress: site.server.ip,
        description: c.plain("ld.gameserver.description"),
      });
      break;
    }
    case "eaglercraft": {
      webpage.mainEntity = { "@id": id("clients") };
      extra.push({
        "@type": "ItemList",
        "@id": id("clients"),
        name: c.plain("ld.eaglercraft.list_name"),
        description: c.plain("ld.eaglercraft.list_description"),
        numberOfItems: eagler.length,
        itemListOrder: "https://schema.org/ItemListUnordered",
        itemListElement: listItems(
          eagler.map((cl) => ({
            name: ("ldName" in cl ? cl.ldName : `${cl.label} ${cl.wasm ? "WASM" : "Standard"}`) as string,
            url: `${origin}/game/${cl.file}`,
          })),
        ),
      });
      break;
    }
    case "vote": {
      webpage.mainEntity = [{ "@id": id("voting-sites") }, { "@id": id("vote-rewards") }];
      extra.push(
        {
          "@type": "ItemList",
          "@id": id("voting-sites"),
          name: c.plain("ld.vote.sites_name"),
          description: c.plain("ld.vote.sites_description"),
          numberOfItems: votes.sites.length,
          itemListOrder: "https://schema.org/ItemListUnordered",
          itemListElement: listItems(votes.sites.map((s) => ({ name: s.name, url: s.url }))),
        },
        {
          "@type": "ItemList",
          "@id": id("vote-rewards"),
          name: c.plain("ld.vote.rewards_name"),
          description: c.plain("ld.vote.rewards_description"),
          numberOfItems: votes.rewards.length,
          itemListElement: listItems(
            votes.rewards.map((r) => ({
              name: c.plain(`vote.reward.${r.id}`),
              description: r.code ? c.plain("ld.vote.reward", r.votes, r.code) : c.plain("ld.vote.reward_nocode", r.votes),
            })),
          ),
        },
      );
      break;
    }
    case "anarchymod": {
      webpage.mainEntity = { "@id": id("software") };
      extra.push({
        "@type": "SoftwareApplication",
        "@id": id("software"),
        name: "UnblockBannedServers",
        url,
        description: c.plain("ld.software.description"),
        applicationCategory: "DesktopEnhancementApplication",
        operatingSystem: "Windows, macOS, Linux",
        runtimePlatform: "Java",
        softwareRequirements: c.plain("ld.software.requirements"),
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@id": `${origin}/#organization` },
      });
      break;
    }
    case "privacy": {
      webpage.mainEntity = { "@id": id("privacypolicy") };
      extra.push({
        "@type": "PrivacyPolicy",
        "@id": id("privacypolicy"),
        name: c.plain("ld.privacy.name"),
        url,
        dateModified: updated,
        publisher: { "@id": `${origin}/#organization` },
        about: { "@id": `${origin}/#organization` },
      });
      break;
    }
  }

  return { "@context": "https://schema.org", "@graph": [...graph, webpage, ...extra] };
}
