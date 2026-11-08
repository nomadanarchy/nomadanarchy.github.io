import { pickLanguage } from "../shared/match-language";
import { siteData } from "./data";

/** True when the visitor clicked through from another page of this site, for example via the language menu. */
function cameFromThisSite(): boolean {
  try {
    return !!document.referrer && new URL(document.referrer).origin === location.origin;
  } catch {
    return false;
  }
}

/**
 * Offers the page in the visitor's browser language. It never redirects and stores
 * nothing: no cookie, no localStorage. It stays quiet for visitors who navigated
 * within the site, so picking a language from the menu is respected.
 */
export function initLangSuggest(): void {
  const { langs, current } = siteData;
  if (!langs?.length) return;
  if (cameFromThisSite()) return;

  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
  const best = pickLanguage(preferred, langs);
  if (!best || best.tag === current) return;

  const bar = document.createElement("aside");
  bar.className = "lang-banner";
  bar.lang = best.tag;

  const text = document.createElement("span");
  text.textContent = best.text;

  const link = document.createElement("a");
  link.href = best.href;
  link.hreflang = best.tag;
  link.textContent = best.go;

  const close = document.createElement("button");
  close.type = "button";
  close.className = "lang-banner-close";
  close.textContent = "\u00d7";
  close.setAttribute("aria-label", best.dismiss);
  close.title = best.dismiss;
  close.addEventListener("click", () => bar.remove());

  bar.append(text, link, close);
  document.querySelector(".wrap")?.before(bar);
}
