import { siteData, tr } from "./data";

interface Member {
  username?: string;
  status?: string;
  avatar_url?: string;
}
interface WidgetData {
  name?: string;
  instant_invite?: string;
  presence_count?: number;
  members?: Member[];
}

const STATUS_ORDER: Record<string, number> = { online: 0, idle: 1, dnd: 2 };
const rank = (status = ""): number => STATUS_ORDER[status] ?? 3;

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const link = (href: string, text: string, className?: string): HTMLAnchorElement => {
  const a = el("a", className, text);
  a.href = href;
  a.rel = "noopener";
  a.target = "_blank";
  return a;
};

const fallbackInvite = (): string => `https://discord.gg/${siteData.discord.invite}`;

function render(box: HTMLElement, data: WidgetData): void {
  const list = el("div", "widget-list");
  const members = (data.members ?? [])
    .filter((m) => m.status && m.status !== "offline")
    .sort((a, b) => rank(a.status) - rank(b.status) || (a.username ?? "").localeCompare(b.username ?? ""));

  for (const m of members) {
    const row = el("div", "widget-row");
    const avatar = el("img", "widget-avatar");
    avatar.src = m.avatar_url ?? "";
    avatar.alt = "";
    avatar.width = 20;
    avatar.height = 20;
    avatar.loading = "lazy";
    avatar.referrerPolicy = "no-referrer";
    row.append(avatar, el("span", `widget-status ${m.status}`), el("span", "widget-name", m.username ?? ""));
    list.append(row);
  }

  box.replaceChildren(
    link(data.instant_invite ?? fallbackInvite(), data.name ?? "", "widget-link"),
    el("p", "widget-count", tr("client.widget.online", data.presence_count ?? 0)),
    list,
  );
}

function renderError(box: HTMLElement): void {
  box.replaceChildren(el("p", "widget-error", tr("client.widget.unavailable")), link(fallbackInvite(), tr("client.widget.join")));
}

export async function initWidget(): Promise<void> {
  const boxes = document.querySelectorAll<HTMLElement>(".discord-widget");
  if (!boxes.length) return;
  for (const box of boxes) box.textContent = tr("client.widget.loading");

  try {
    const res = await fetch(`https://discord.com/api/guilds/${siteData.discord.guildId}/widget.json`, {
      credentials: "omit",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`widget ${res.status}`);
    const data = (await res.json()) as WidgetData;
    for (const box of boxes) render(box, data);
  } catch {
    for (const box of boxes) renderError(box);
  }
}
