// Edit this block to update contact details everywhere on the site.
const CONFIG = {
  email: "alya.altawash@gmail.com",
  github: "https://github.com/alyamohamed1",
  linkedin: "https://www.linkedin.com/in/alya-altawash-25118a245/"
};

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// nav
const burger = document.querySelector(".burger");
if (burger) burger.addEventListener("click", () => {
  const open = document.querySelector(".nav ul").classList.toggle("open");
  burger.setAttribute("aria-expanded", open);
});

// typing: <el data-type='["line one","line two"]' data-prefix="1">
function typeInto(el, lines, speed = 28) {
  const prefix = el.dataset.prefix === "1";
  el.innerHTML = "";
  if (reduce) {
    lines.forEach(l => { const d = document.createElement("div"); if (prefix) d.className = "p"; d.textContent = l; el.append(d); });
    return;
  }
  let li = 0;
  const caret = Object.assign(document.createElement("span"), { className: "caret" });
  const next = () => {
    if (li >= lines.length) { el.append(caret); return; }
    const d = document.createElement("div"); if (prefix) d.className = "p";
    el.append(d); d.append(caret);
    let i = 0;
    const tick = () => {
      d.insertBefore(document.createTextNode(lines[li][i++]), caret);
      if (i < lines[li].length) setTimeout(tick, speed);
      else { li++; setTimeout(next, 260); }
    };
    tick();
  };
  next();
}
document.querySelectorAll("[data-type]").forEach(el => typeInto(el, JSON.parse(el.dataset.type), +el.dataset.speed || 28));

// live clock (about page)
const clock = document.getElementById("clock");
if (clock) {
  const t = () => { const d = new Date(); clock.textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };
  t(); setInterval(t, 20000);
  const dt = document.getElementById("date");
  if (dt) dt.textContent = new Date().toLocaleDateString([], { month: "short", day: "numeric" });
}

// contact links from CONFIG
document.querySelectorAll("[data-link]").forEach(a => {
  const k = a.dataset.link;
  if (k === "email") { if (CONFIG.email) a.href = "mailto:" + CONFIG.email; else { a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); } }
  else a.href = CONFIG[k];
  if (k !== "email") { a.target = "_blank"; a.rel = "noopener"; }
});

// project modal
const dlg = document.getElementById("pdialog");
const pdata = document.getElementById("pdata");
if (dlg && pdata) {
  const P = JSON.parse(pdata.textContent);
  document.querySelectorAll("button.more").forEach(b => b.addEventListener("click", () => {
    const p = P[b.dataset.id];
    dlg.querySelector("[data-f=title]").textContent = p.title;
    dlg.querySelector("[data-f=file]").textContent = "project_" + b.dataset.id + ".md";
    dlg.querySelector("[data-f=summary]").textContent = p.summary;
    dlg.querySelector("[data-f=role]").textContent = p.role;
    dlg.querySelector("[data-f=challenge]").textContent = p.challenge;
    dlg.querySelector("[data-f=learned]").textContent = p.learned;
    dlg.querySelector("[data-f=stack]").innerHTML = p.stack.map(s => `<span class="tag">${s}</span>`).join("");
    dlg.showModal();
  }));
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  dlg.querySelector(".x").addEventListener("click", () => dlg.close());
}

// rails
document.querySelectorAll(".rail-wrap").forEach(w => {
  const r = w.querySelector(".rail");
  w.querySelectorAll("[data-dir]").forEach(b => b.addEventListener("click", () => r.scrollBy({ left: +b.dataset.dir * 340, behavior: reduce ? "auto" : "smooth" })));
});

// contact form -> opens the visitor's mail app
const form = document.getElementById("cform");
if (form) form.addEventListener("submit", e => {
  e.preventDefault();
  const out = document.getElementById("cstatus");
  if (!CONFIG.email) { out.textContent = "> email not set yet. Use the GitHub or LinkedIn links."; return; }
  const f = new FormData(form);
  const body = `${f.get("message")}\n\n${f.get("name")} (${f.get("email")})`;
  location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Portfolio message from " + f.get("name"))}&body=${encodeURIComponent(body)}`;
  out.textContent = "> opening your mail app...";
});

// background: if a video is missing or blocked, draw binary rain instead
function binaryRain(host) {
  if (host.querySelector("canvas") || reduce) return;
  const c = document.createElement("canvas"); host.prepend(c);
  const x = c.getContext("2d"); let cols, drops, w, h;
  const size = 16;
  const resize = () => { w = c.width = innerWidth; h = c.height = innerHeight; cols = Math.ceil(w / size); drops = Array.from({ length: cols }, () => Math.random() * h / size); };
  resize(); addEventListener("resize", resize);
  setInterval(() => {
    x.fillStyle = "rgba(5,8,6,.12)"; x.fillRect(0, 0, w, h);
    x.fillStyle = "#39ff88"; x.font = size + "px monospace";
    drops.forEach((y, i) => { x.fillText(Math.random() > .5 ? "1" : "0", i * size, y * size); drops[i] = y * size > h && Math.random() > .975 ? 0 : y + 1; });
  }, 70);
}
document.querySelectorAll(".bg video").forEach(v => {
  const bad = () => { v.remove(); binaryRain(v.closest(".bg") || document.querySelector(".bg")); };
  v.addEventListener("error", bad);
  v.querySelector("source")?.addEventListener("error", bad);
  v.play?.().catch(() => {});
});
