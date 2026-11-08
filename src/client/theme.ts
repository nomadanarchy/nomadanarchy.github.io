import { siteData, tr } from "./data";

type Theme = "light" | "dark";

const SUN =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><circle cx="8" cy="8" r="3"/><line x1="8" y1="1" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="1" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/><line x1="2.9" y1="2.9" x2="4.3" y2="4.3"/><line x1="11.7" y1="11.7" x2="13.1" y2="13.1"/><line x1="2.9" y1="13.1" x2="4.3" y2="11.7"/><line x1="11.7" y1="4.3" x2="13.1" y2="2.9"/></svg>';
const MOON =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M7.5 2.2A6 6 0 1 0 7.5 13.8A6 6 0 0 1 7.5 2.2z"/></svg>';

const root = document.documentElement;

const current = (): Theme => (root.dataset.theme === "dark" ? "dark" : "light");

export function initTheme(): void {
  const button = document.getElementById("theme-btn");
  if (!button) return;

  const render = (): void => {
    const theme = current();
    const label = tr(theme === "dark" ? "client.theme.to_light" : "client.theme.to_dark");
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    button.innerHTML = theme === "dark" ? SUN : MOON;
  };

  const set = (theme: Theme): void => {
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", siteData.themeColor[theme]);
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // Storage can be blocked. The theme still changes for this page view.
    }
    render();
  };

  // Start loading the other background the first time someone goes near the button.
  const warm = (): void => {
    new Image().src = current() === "dark" ? "/bg-light.jpg" : "/bg-dark.jpg";
  };
  for (const event of ["mouseenter", "focus", "touchstart"]) {
    button.addEventListener(event, warm, { once: true, passive: true });
  }

  button.addEventListener("click", () => set(current() === "dark" ? "light" : "dark"));
  render();
}
