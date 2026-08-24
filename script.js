const config = {
  discordGuildId: "1540938382400692325",
  serverAddress: "nomad-anarchy.eagler.host"
};

const memberCount = document.getElementById("memberCount");
const discordStatus = document.getElementById("discordStatus");
const copyAddress = document.getElementById("copyAddress");
const verifyToast = document.getElementById("verifyToast");

async function updateDiscordWidget() {
  if (!config.discordGuildId || config.discordGuildId === "1540938382400692325") {
    memberCount.textContent = "—";
    discordStatus.textContent = "Add Discord Server ID";
    return;
  }
  try {
    const response = await fetch(`https://discord.com/api/guilds/${config.discordGuildId}/widget.json`, {cache:"no-store"});
    if (!response.ok) throw new Error();
    const data = await response.json();
    memberCount.textContent = typeof data.presence_count === "number" ? data.presence_count.toLocaleString() : "—";
    discordStatus.textContent = typeof data.presence_count === "number" ? "Members Online" : "Discord Online";
  } catch {
    memberCount.textContent = "—";
    discordStatus.textContent = "Discord Unavailable";
  }
}

let toastTimer;
async function copyServerAddress() {
  try {
    await navigator.clipboard.writeText(config.serverAddress);
  } catch {
    const input = document.createElement("input");
    input.value = config.serverAddress;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }
  clearTimeout(toastTimer);
  verifyToast.classList.remove("show");
  requestAnimationFrame(() => requestAnimationFrame(() => verifyToast.classList.add("show")));
  toastTimer = setTimeout(() => verifyToast.classList.remove("show"), 1800);
}

copyAddress.addEventListener("click", copyServerAddress);
updateDiscordWidget();
setInterval(updateDiscordWidget, 60000);
