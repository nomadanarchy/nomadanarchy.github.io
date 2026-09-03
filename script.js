
const config={discordGuildId:"1540938382400692325",serverAddress:"play.nomadanarchy.online"};

const toast=document.getElementById("toast");
let toastTimer;
function showToast(text){
  if(!toast)return;
  toast.textContent=text;toast.classList.add("active");
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("active"),2200);
}
async function copyText(text){
  try{await navigator.clipboard.writeText(text)}
  catch{
    const input=document.createElement("input");input.value=text;
    document.body.appendChild(input);input.select();document.execCommand("copy");input.remove();
  }
  showToast("Copied "+text);
}
document.querySelectorAll("[data-copy]").forEach(el=>{
  el.addEventListener("click",()=>copyText(el.dataset.copy));
});

const nav=document.getElementById("navbar");
const progress=document.getElementById("scroll-progress");
function scrollUI(){
  const max=document.documentElement.scrollHeight-innerHeight;
  if(progress)progress.style.width=(max>0?(scrollY/max)*100:0)+"%";
  if(nav)nav.classList.toggle("scrolled",scrollY>35);
}
addEventListener("scroll",scrollUI,{passive:true});scrollUI();

const hamburger=document.getElementById("hamburger");
const mobileMenu=document.getElementById("mobileMenu");
hamburger?.addEventListener("click",()=>{
  hamburger.classList.toggle("active");mobileMenu.classList.toggle("active");
});
mobileMenu?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{
  hamburger.classList.remove("active");mobileMenu.classList.remove("active");
}));

async function updateDiscord(){
  const count=document.getElementById("memberCount");
  const status=document.getElementById("discordStatus");
  if(!count||!status)return;
  try{
    const r=await fetch(`https://discord.com/api/guilds/${config.discordGuildId}/widget.json`,{cache:"no-store"});
    if(!r.ok)throw new Error();
    const d=await r.json();
    if(typeof d.presence_count==="number"){
      count.textContent=d.presence_count.toLocaleString();
      status.textContent="Discord members online";
    }else{
      count.textContent="—";status.textContent="Discord online";
    }
  }catch{
    count.textContent="—";status.textContent="Discord unavailable";
  }
}
updateDiscord();setInterval(updateDiscord,60000);

/* Small mouse/parallax movement for the hero art. */
const art=document.querySelector(".hero-character img");
if(art && matchMedia("(pointer:fine)").matches){
  addEventListener("mousemove",e=>{
    const x=(e.clientX/innerWidth-.5)*8;
    const y=(e.clientY/innerHeight-.5)*8;
    art.style.marginLeft=`${x}px`;art.style.marginTop=`${y}px`;
  },{passive:true});
}
