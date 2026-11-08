export interface Offered {
  /** BCP 47 tag, like "ru-RU". */
  tag: string;
  /** Primary language, like "ru". */
  code: string;
}

/**
 * Picks the offered language that best matches the browser's preference list.
 * The first preference that matches anything decides: an exact tag match first,
 * then the same primary language ("en-GB" matches an "en-US" page).
 */
export function pickLanguage<T extends Offered>(preferred: readonly string[], offered: readonly T[]): T | undefined {
  for (const raw of preferred) {
    const pref = raw.toLowerCase();
    const exact = offered.find((o) => o.tag.toLowerCase() === pref);
    if (exact) return exact;
    const primary = pref.split("-")[0];
    const loose = offered.find((o) => o.code.toLowerCase() === primary);
    if (loose) return loose;
  }
  return undefined;
}
