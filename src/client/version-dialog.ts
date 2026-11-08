const source = (label: string, url: string, newTab: boolean): HTMLLIElement => {
  const item = document.createElement("li");
  const a = document.createElement("a");
  a.href = url;
  a.textContent = label;
  a.rel = "noopener";
  if (newTab) a.target = "_blank";
  item.append(a);
  return item;
};

/** Offers CurseForge, Modrinth and GitHub when a version link is clicked. Without JS the GitHub link just downloads. */
export function initVersionDialog(): void {
  const table = document.getElementById("downloads-table");
  const dialog = document.getElementById("version-dialog") as HTMLDialogElement | null;
  const label = document.getElementById("version-dialog-mc");
  const options = document.getElementById("version-dialog-options");
  const close = document.getElementById("version-dialog-close");
  if (!table || !dialog || !label || !options || !close || typeof dialog.showModal !== "function") return;

  table.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>("a.version-link");
    if (!link || !table.contains(link)) return;
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    const { curseforge, modrinth } = link.dataset;
    event.preventDefault();

    label.textContent = link.textContent?.trim() ?? "";
    options.replaceChildren(
      ...(curseforge ? [source("CurseForge", curseforge, true)] : []),
      ...(modrinth ? [source("Modrinth", modrinth, true)] : []),
      source("GitHub", link.href, false),
    );
    dialog.showModal();
  });

  options.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) dialog.close();
  });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}
