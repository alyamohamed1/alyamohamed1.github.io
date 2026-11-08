/* Binary cybersigil background for the inner pages (same generator as the loading screen). */
(() => {
  const bg = document.querySelector(".bg");
  if (!bg) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = document.createElement("canvas"); cv.className = "sig"; bg.prepend(cv);
  const ctx = cv.getContext("2d");

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

  let W, H, dpr, cell, cols, rows, cells = [], field;
  const seedA = (Math.random() * 1e9) | 0, seedB = (Math.random() * 1e9) | 0;

  function build() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cell = W < 700 ? 9 : 11;
    cols = Math.ceil(W / cell); rows = Math.ceil(H / cell);
    const m = document.createElement("canvas"); m.width = cols; m.height = rows;
    const g = m.getContext("2d"); g.fillStyle = "#fff";
    if (W > 900) {                                   // one sigil hugging each edge, content stays clear
      sigil(g, cols * 0.075, rows * 0.55, rows * 0.44, seedA);
      sigil(g, cols * 0.925, rows * 0.48, rows * 0.4, seedB);
    } else {
      sigil(g, cols * 0.5, rows * 0.55, Math.min(rows * 0.42, cols * 0.7), seedA);
    }
    const a = g.getImageData(0, 0, cols, rows).data;
    field = document.createElement("canvas"); field.width = cv.width; field.height = cv.height;
    const f = field.getContext("2d");
    f.scale(dpr, dpr); f.font = `600 ${cell - 2}px "JetBrains Mono", monospace`; f.textAlign = "center"; f.textBaseline = "middle";
    f.fillStyle = "rgba(57,255,136,.07)";
    cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * cell + cell / 2, y = r * cell + cell / 2;
      if (a[(r * cols + c) * 4 + 3] > 60) cells.push({ x, y, ch: Math.random() < 0.5 ? "0" : "1", at: (r / rows) * 0.75 + Math.random() * 0.25 });
      else if (Math.random() < 0.08) f.fillText(Math.random() < 0.5 ? "0" : "1", x, y);
    }
  }

  function draw(p) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(field, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `600 ${cell - 1}px "JetBrains Mono", monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#39ff88";
    for (const c of cells) {
      if (c.at > p) continue;
      if (Math.random() < 0.006) c.ch = c.ch === "0" ? "1" : "0";
      if (p < 1 && p - c.at < 0.05) continue;
      ctx.fillText(c.ch, c.x, c.y);
    }
    if (p < 1) { ctx.fillStyle = "#eafff2"; for (const c of cells) if (c.at <= p && p - c.at < 0.05) ctx.fillText(c.ch, c.x, c.y); }
  }

  build();
  let p = reduce ? 1 : 0, last = 0;
  (function loop(now) {
    if (p < 1) { p = Math.min(1, p + 0.018); draw(p); last = now; }   // draws in over ~1s
    else if (!document.hidden && now - last > 140) { draw(1); last = now; }
    if (!reduce) requestAnimationFrame(loop);
  })(0);
  if (reduce) draw(1);
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { build(); draw(p); }, 150); });
})();
