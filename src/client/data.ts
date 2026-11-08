import { format } from "../shared/format";

interface SiteData {
  i18n: Record<string, string>;
  themeColor: { light: string; dark: string };
  discord: { guildId: string; invite: string };
  /** Languages that can be offered on this page, with their own banner text. */
  langs?: { tag: string; code: string; href: string; text: string; go: string; dismiss: string }[];
  current?: string;
}

export const siteData: SiteData = JSON.parse(document.getElementById("site-data")?.textContent ?? "{}");

/** Translate a `client.*` key the same way the build does: %s and %1$s placeholders. */
export const tr = (key: string, ...args: (string | number)[]): string => format(siteData.i18n[key] ?? key, args.map(String));
