/* Loading screen: binary cybersigil background, dove video, terminal output. */
(() => {
  const L = document.getElementById("loader");
  if (!L) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = L.querySelector(".ld-bg"), ctx = cv.getContext("2d");
  const codeEl = L.querySelector(".ld-code"), outEl = L.querySelector(".ld-out");
  const DUR = reduce ? 1500 : 5600;      // minimum time on screen
  const MAX = 10000;                     // never block longer than this
  const t0 = performance.now();
  let pageLoaded = document.readyState === "complete", finished = false;
  addEventListener("load", () => (pageLoaded = true), { once: true });

  /* ---------- seeded random so both halves of a sigil mirror exactly ---------- */
  const rng = (s) => () => ((s = (s + 0x6d2b79f5) | 0), (s = Math.imul(s ^ (s >>> 15), s | 1)), (s ^= s + Math.imul(s ^ (s >>> 7), s | 61)), ((s ^ (s >>> 14)) >>> 0) / 4294967296);
  const bz = (p, t) => { const u = 1 - t; return [0, 1].map((k) => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k]); };
  const dbz = (p, t) => { const u = 1 - t; return [0, 1].map((k) => 3 * u * u * (p[1][k] - p[0][k]) + 6 * u * t * (p[2][k] - p[1][k]) + 3 * t * t * (p[3][k] - p[2][k])); };

  // a tapered, curving thorn with smaller barbs branching off it
  function thorn(g, p, w, depth, rnd) {
    for (let i = 0; i <= 90; i++) {
      const t = i / 90, [x, y] = bz(p, t);
      g.beginPath(); g.arc(x, y, w * Math.pow(1 - t, 0.85) + 0.004, 0, 7); g.fill();
    }
    if (depth <= 0) return;
    const nb = 1 + Math.floor(rnd() * 2), span = Math.hypot(p[3][0] - p[0][0], p[3][1] - p[0][1]);
    for (let b = 0; b < nb; b++) {
      const t = 0.25 + rnd() * 0.5, pt = bz(p, t), d = dbz(p, t), m = Math.hypot(d[0], d[1]) || 1;
      const tg = [d[0] / m, d[1] / m], s = rnd() < 0.5 ? 1 : -1, n = [-tg[1] * s, tg[0] * s];
      const len = span * (0.28 + rnd() * 0.3);
      const end = [pt[0] + n[0] * len * 0.75 + tg[0] * len * 0.7, pt[1] + n[1] * len * 0.75 + tg[1] * len * 0.7];
      thorn(g, [pt, [pt[0] + n[0] * len * 0.55, pt[1] + n[1] * len * 0.55], [end[0] - tg[0] * len * 0.35 + n[0] * len * 0.25, end[1] - tg[1] * len * 0.35 + n[1] * len * 0.25], end], w * (1 - t) * 0.7, depth - 1, rnd);
    }
  }

  function half(g, rnd) {
    thorn(g, [[0, 0], [0.025, -0.35], [-0.02, -0.7], [0, -1.08]], 0.03, 0, rnd);  // spine up
    thorn(g, [[0, 0], [0.03, 0.4], [-0.03, 0.8], [0, 1.15]], 0.03, 0, rnd);       // spine down
    const n = 5 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const y0 = -0.75 + (1.5 * (i + 0.5)) / n + (rnd() - 0.5) * 0.12, up = rnd() < 0.55 ? -1 : 1;
      const reach = 0.35 + rnd() * 0.45, ey = y0 + up * (0.15 + rnd() * 0.45);
      thorn(g, [[0, y0], [reach * 0.3, y0 - up * (0.1 + rnd() * 0.2)], [reach + rnd() * 0.25, ey - up * 0.35], [reach, ey]], 0.012 + rnd() * 0.012, 2, rnd);
    }
    thorn(g, [[0, -0.55], [0.2, -0.75], [0.04, -0.95], [0.3, -1.12]], 0.016, 1, rnd);  // crown
    thorn(g, [[0, 0.75], [0.1, 1.05], [0.48, 1.06], [0.52, 0.78]], 0.016, 1, rnd);    // tail hook
  }

  function sigil(g, cx, cy, s, seed) {
    for (const sx of [1, -1]) { g.setTransform(sx * s, 0, 0, s, cx, cy); half(g, rng(seed)); }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* ---------- grid ---------- */
  let W, H, dpr, cell, cols, rows, cells = [], bgLayer;
  const seedA = (Math.random() * 1e9) | 0, seedB = (Math.random() * 1e9) | 0;

  function build() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cell = W < 700 ? 9 : 11;
    cols = Math.ceil(W / cell); rows = Math.ceil(H / cell);

    const m = document.createElement("canvas"); m.width = cols; m.height = rows;
    const g = m.getContext("2d"); g.fillStyle = "#fff";
    if (W / H > 1.15) {
      sigil(g, cols * 0.17, rows * 0.52, rows * 0.43, seedA);
      sigil(g, cols * 0.84, rows * 0.5, rows * 0.36, seedB);
    } else {
      sigil(g, cols * 0.5, rows * 0.5, Math.min(rows * 0.44, cols * 0.75), seedA);
    }
    const a = g.getImageData(0, 0, cols, rows).data;

    // faint ambient binary, drawn once
    bgLayer = document.createElement("canvas"); bgLayer.width = cv.width; bgLayer.height = cv.height;
    const b = bgLayer.getContext("2d");
    b.scale(dpr, dpr); b.font = `600 ${cell - 2}px "JetBrains Mono", monospace`; b.textAlign = "center"; b.textBaseline = "middle";
    b.fillStyle = "rgba(57,255,136,.075)";

    cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * cell + cell / 2, y = r * cell + cell / 2;
      if (a[(r * cols + c) * 4 + 3] > 60) {
        // reveal top-to-bottom like terminal output, with noise
        cells.push({ x, y, ch: Math.random() < 0.5 ? "0" : "1", at: (r / rows) * 0.72 + Math.random() * 0.22 });
      } else if (Math.random() < 0.1) {
        b.fillText(Math.random() < 0.5 ? "0" : "1", x, y);
      }
    }
  }

  /* ---------- scrolling code column ---------- */
  const tpl = [
    (n) => `${n}  FOR I = 1 TO LEN (SIGIL$)`, (n) => `${n}  CHAR$ = MID$ (SIGIL$,I,1)`, (n) => `${n}  GOSUB 9000`,
    (n) => `${n}  NEXT I`, (n) => `${n}  DLY% = MDY% / 80`, (n) => `${n}  X = X + 1`, (n) => `${n}  Y = Y + 2`,
    (n) => `${n}  STRING$ = "LOGIC BY DEFAULT"`, (n) => `${n}  STRING$ = "DRIVEN BY DESIGN"`, (n) => `${n}  POKE 53280, 0`,
    (n) => `${n}  REM == ALYA.SYS ==`, (n) => `${n}  IF BIT% = 1 THEN PSET (X,Y)`, (n) => `${n}  DATA 01101001, 11010010`,
  ];
  let ln = 2340, codeLines = [], lastCode = 0;
  function pushCode() {
    ln += 10; codeLines.push(tpl[(Math.random() * tpl.length) | 0](ln));
    if (codeLines.length > 22) codeLines.shift();
    codeEl.textContent = codeLines.join("\n");
  }

  /* ---------- terminal output under the video ---------- */
  const pad = (s) => s + " " + ".".repeat(Math.max(3, 30 - s.length)) + " ";
  const script = [
    { at: 0.0, text: "> initializing project..." },
    { at: 0.16, text: pad("> loading kernel/logic.sys"), ok: "OK" },
    { at: 0.32, text: pad("> loading kernel/design.sys"), ok: "OK" },
    { at: 0.48, text: pad("> compiling sigil.bin"), ok: "OK" },
    { at: 0.64, text: pad("> mounting /alya/portfolio"), ok: "OK" },
  ];
  let si = 0, typing = null;
  const barEl = document.createElement("div"); barEl.className = "ld-progress";
  function typeLine(item) {
    const div = document.createElement("div"); outEl.insertBefore(div, barEl);
    let i = 0;
    typing = setInterval(() => {
      div.textContent = item.text.slice(0, ++i);
      if (i >= item.text.length) {
        clearInterval(typing); typing = null;
        if (item.ok) { const s = document.createElement("span"); s.className = "ok"; s.textContent = item.ok; div.append(s); }
      }
    }, reduce ? 0 : 16);
  }
  outEl.append(barEl);
  function bar(p) {
    const n = 22, f = Math.round(p * n);
    barEl.innerHTML = `[<span class="ok">${"█".repeat(f)}</span><span class="dimbar">${"░".repeat(n - f)}</span>] ${String(Math.round(p * 100)).padStart(3)}%`;
  }

  /* ---------- drawing ---------- */
  let curP = 0;
  function draw(p) {
    curP = p;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(bgLayer, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `600 ${cell - 1}px "JetBrains Mono", monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const rp = p * 1.06; // finish the drawing slightly before the bar hits 100
    ctx.fillStyle = "#39ff88";
    for (const c of cells) {
      if (c.at > rp) continue;
      if (Math.random() < 0.006) c.ch = c.ch === "0" ? "1" : "0";
      if (rp - c.at < 0.05) continue;
      ctx.fillText(c.ch, c.x, c.y);
    }
    ctx.fillStyle = "#eafff2"; // bright leading edge
    for (const c of cells) if (c.at <= rp && rp - c.at < 0.05) ctx.fillText(c.ch, c.x, c.y);
  }

  /* ---------- loop ---------- */
  function frame(now) {
    if (finished) return;
    const el = now - t0;
    // hold at 99% until the page has actually loaded
    let p = Math.min(1, el / DUR);
    if (!pageLoaded && el < MAX) p = Math.min(p, 0.99);

    while (si < script.length && p >= script[si].at && !typing) typeLine(script[si++]);
    bar(p);
    if (!reduce && now - lastCode > 75) { pushCode(); lastCode = now; }
    draw(p);

    if (p >= 1) {
      finished = true;
      const last = document.createElement("div");
      last.innerHTML = '> system ready<span class="cur">_</span>';
      outEl.insertBefore(last, barEl);
      setTimeout(done, reduce ? 200 : 650);
      return;
    }
    requestAnimationFrame(frame);
  }

  // After the loader: the sigils stay on as the splash background, bits slowly flickering.
  function handoff() {
    const bg = document.querySelector(".bg");
    if (!bg) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", handoff, { once: true }); return; }
    cv.className = "sig"; bg.prepend(cv);
    let last = 0, p = reduce ? 1 : curP;
    (function ambient(now) {
      if (!cv.isConnected) return;
      if (p < 1) p = Math.min(1, p + 0.02);           // finish the drawing if the loader was skipped
      if (!document.hidden && (now - last > 140 || p < 1)) { draw(p); last = now; }
      if (!reduce) requestAnimationFrame(ambient);
    })(0);
  }

  function done() {
    finished = true;
    if (L.classList.contains("done")) return;
    try { sessionStorage.setItem("alya-booted", "1"); } catch (e) {}
    handoff();
    L.classList.add("done");
    removeEventListener("keydown", done); L.removeEventListener("click", done);
    window.__loaderDone = true;
    dispatchEvent(new Event("loader:done"));
    setTimeout(() => L.remove(), 900);
  }

  addEventListener("keydown", done); L.addEventListener("click", done);
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { build(); draw(curP); }, 150); });
  build();

  // Seen the full loader already this visit? Skip straight to the splash and just draw the sigils in.
  let seen = false;
  try { seen = sessionStorage.getItem("alya-booted") === "1"; } catch (e) {}
  if (seen) { L.classList.add("quick"); done(); return; }

  if (reduce) pushCode();
  requestAnimationFrame(frame);
})();
