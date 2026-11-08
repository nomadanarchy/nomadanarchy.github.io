/** Close the language menu when clicking elsewhere or pressing Escape. */
export function initLangMenu(): void {
  const menu = document.querySelector<HTMLDetailsElement>(".lang-menu");
  if (!menu) return;
  document.addEventListener("click", (event) => {
    if (menu.open && event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
  });
  menu.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    menu.open = false;
    menu.querySelector("summary")?.focus();
  });
}
