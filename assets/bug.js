/* Home page: a cyber insect loose on the screen. Click it and it bolts away from the cursor, but never leaves the screen.
   Three hits and it's "patched", logged, and a new one crawls in. */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const layer = document.getElementById("bugLayer");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (id) => document.getElementById(id);
const ui = { hits: $("bugHits"), fixed: $("bugFixed"), log: $("bugLog"), chip: $("bugChip"), chipTxt: $("bugChipTxt"), toggle: $("bugToggle"), debug: $("bugDebug"), loose: $("statLoose") };

if (layer) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { layer.remove(); ui.chip?.remove(); }
  if (renderer) run(renderer);
}

function run(renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  layer.append(renderer.domElement);

  let W = innerWidth, H = innerHeight;
  const small = () => W < 700;
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 1, 6000);
  cam.up.set(0, 0, -1); cam.position.set(0, 2000, 900); cam.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x203028, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(-300, 1200, 600); scene.add(key);
  const glow = new THREE.PointLight(0x39ff88, 3, 400, 0); scene.add(glow);

  // soft contact shadow
  const sc = document.createElement("canvas"); sc.width = sc.height = 64;
  const sg = sc.getContext("2d"), grd = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(0,0,0,.65)"); grd.addColorStop(1, "rgba(0,0,0,0)"); sg.fillStyle = grd; sg.fillRect(0, 0, 64, 64);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; scene.add(shadow);

  const bug = new THREE.Group(); scene.add(bug);
  const body = new THREE.Group(); bug.add(body);
  let model = null;

  const resize = () => {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H);
    Object.assign(cam, { left: -W / 2, right: W / 2, top: H / 2, bottom: -H / 2 }); cam.updateProjectionMatrix();
    if (model) { const s = (small() ? 76 : 116) / 2; body.scale.setScalar(s); shadow.scale.set(s * 2.4, s * 2.4, 1); }
  };
  addEventListener("resize", resize); resize();

  new GLTFLoader().load("assets/bug.glb", (g) => {
    model = g.scene;
    const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const s = 2 / Math.max(size.x, size.z);
    model.scale.setScalar(s); model.position.set(-c.x * s, -box.min.y * s, -c.z * s);   // feet on the ground, centred
    body.add(model); resize(); layer.classList.add("ready");
  });

  // ---- state (all in screen pixels) ----
  const navH = 64;
  const S = { x: W * (small() ? 0.7 : 0.78), y: H * 0.62, th: Math.PI * 0.9, v: 0, vT: 40, turn: 0, nextTurn: 0, mode: "wander", fleeUntil: 0, hits: 0, fixed: 0, born: performance.now(), off: false };
  try { S.off = sessionStorage.getItem("alya-bug-off") === "1"; } catch (e) {}
  layer._bug = S;   // handy for debugging from the console
  const P = { x: -999, y: -999 };
  const bounds = () => { const m = small() ? 34 : 50; return { x0: m, x1: W - m, y0: navH + m, y1: H - m - (small() ? 40 : 30) }; };
  const R = () => (small() ? 42 : 58);
  const near = (x, y) => Math.hypot(x - S.x, y - S.y) < R();
  const angLerp = (a, b, k) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * Math.min(1, k); };

  const ids = () => "0x" + (S.fixed + 1).toString(16).padStart(2, "0");
  const renderUI = () => {
    const dots = "●".repeat(S.hits) + "○".repeat(3 - S.hits);
    if (ui.hits) ui.hits.textContent = dots;
    if (ui.fixed) ui.fixed.textContent = S.fixed;
    if (ui.loose) ui.loose.textContent = S.off || S.mode === "caught" ? "0" : "1";
    if (ui.chipTxt) ui.chipTxt.textContent = S.off ? "bug hidden" : S.mode === "caught" ? `bug patched ✓ (${S.fixed} so far)` : S.hits ? `debugging... ${dots}` : "a bug got into the page. click it, fixing bugs is part of the job";
    if (ui.toggle) { ui.toggle.textContent = S.off ? "[ show ]" : "[x]"; ui.toggle.setAttribute("aria-label", S.off ? "Show the bug" : "Hide the bug"); }
    layer.classList.toggle("off", S.off);
  };
  const log = (msg) => {
    if (!ui.log) return;
    const li = document.createElement("li"); li.textContent = msg; ui.log.prepend(li);
    while (ui.log.children.length > 5) ui.log.lastChild.remove();
  };
  const toast = (txt) => {
    const t = document.createElement("div"); t.className = "bug-toast"; t.textContent = txt;
    t.style.left = S.x + "px"; t.style.top = S.y + "px"; document.body.append(t);
    setTimeout(() => t.remove(), 1400);
  };

  function hit(fromKeyboard) {
    if (S.off || S.mode === "caught") return;
    S.hits++;
    if (S.hits >= 3) return caught();
    S.mode = "flee"; S.fleeUntil = performance.now() + 1500;
    if (fromKeyboard) { P.x = S.x - Math.cos(S.th) * 80; P.y = S.y - Math.sin(S.th) * 80; }
    toast(S.hits === 1 ? "hit! 1/3" : "hit! 2/3");
    renderUI();
  }
  function caught() {
    S.mode = "caught"; S.fixed++;
    const secs = ((performance.now() - S.born) / 1000).toFixed(1);
    log(`> bug_0x${S.fixed.toString(16).padStart(2, "0")} patched in ${secs}s ✓`);
    toast("patched ✓");
    renderUI();
    let n = 0;
    const blink = setInterval(() => { bug.visible = !bug.visible; if (++n > 9) { clearInterval(blink); bug.visible = false; } }, 70);
    setTimeout(respawn, 2600);
  }
  function respawn() {
    const b = bounds(), side = Math.floor(Math.random() * 4);
    S.x = side === 0 ? b.x0 : side === 1 ? b.x1 : b.x0 + Math.random() * (b.x1 - b.x0);
    S.y = side === 2 ? b.y0 : side === 3 ? b.y1 : b.y0 + Math.random() * (b.y1 - b.y0);
    S.th = Math.atan2(H / 2 - S.y, W / 2 - S.x);
    S.hits = 0; S.mode = "wander"; S.born = performance.now(); bug.visible = true;
    log(`> new bug detected: bug_${ids()}`);
    renderUI();
  }

  // pointer: clicks on the bug never reach the page underneath
  let swallow = false;
  addEventListener("pointermove", (e) => {
    P.x = e.clientX; P.y = e.clientY;
    document.documentElement.classList.toggle("bug-near", !S.off && S.mode !== "caught" && near(P.x, P.y));
  }, { passive: true });
  addEventListener("pointerdown", (e) => {
    P.x = e.clientX; P.y = e.clientY;
    if (S.off || S.mode === "caught" || !near(e.clientX, e.clientY)) return;
    e.preventDefault(); e.stopPropagation(); swallow = true; hit();
  }, { capture: true });
  addEventListener("click", (e) => { if (swallow) { e.preventDefault(); e.stopPropagation(); swallow = false; } }, { capture: true });
  ui.debug?.addEventListener("click", () => { if (S.off) { S.off = false; save(); } hit(true); });
  const save = () => { try { sessionStorage.setItem("alya-bug-off", S.off ? "1" : "0"); } catch (e) {} renderUI(); };
  ui.toggle?.addEventListener("click", () => { S.off = !S.off; save(); });
  renderUI();
  if (ui.log) log(`> new bug detected: bug_${ids()}`);

  // ---- behaviour ----
  function step(dt, now) {
    const b = bounds(), k = small() ? 0.75 : 1;
    // push away from walls (stronger the closer it gets)
    const wall = (d, r = 130) => (d < r ? (1 - d / r) ** 2 : 0);
    const wx = wall(S.x - b.x0) - wall(b.x1 - S.x), wy = wall(S.y - b.y0) - wall(b.y1 - S.y);

    if (S.mode === "flee") {
      let ax = S.x - P.x, ay = S.y - P.y; const d = Math.hypot(ax, ay) || 1; ax /= d; ay /= d;
      const fx = ax + wx * 2.4, fy = ay + wy * 2.4;
      // cornered: slide along the wall instead of freezing
      const desired = Math.hypot(fx, fy) < 0.25 ? S.th + Math.PI / 2 : Math.atan2(fy, fx);
      S.th = angLerp(S.th, desired, dt * 9);
      const left = (S.fleeUntil - now) / 1500;
      S.vT = (180 + 300 * Math.max(0, left)) * k;
      if (now > S.fleeUntil) { S.mode = "wander"; S.vT = 0; S.nextTurn = now + 900; }   // catch its breath
    } else if (S.mode === "wander") {
      if (now > S.nextTurn) {
        S.nextTurn = now + 900 + Math.random() * 2200;
        S.turn = (Math.random() - 0.5) * 2.4;
        S.vT = Math.random() < 0.22 ? 0 : (30 + Math.random() * 45) * k;
      }
      S.th += S.turn * dt;
      if (wx || wy) S.th = angLerp(S.th, Math.atan2(wy + Math.sin(S.th) * 0.2, wx + Math.cos(S.th) * 0.2), dt * 3);
      // a bit jumpy when the cursor sneaks up on it
      if (Math.hypot(P.x - S.x, P.y - S.y) < R() * 1.4 && S.vT < 60 * k) S.vT = 60 * k;
    }
    if (reduce && S.mode === "wander") S.vT = 0;
    S.v += (S.vT - S.v) * Math.min(1, dt * (S.mode === "flee" ? 10 : 3));
    S.x += Math.cos(S.th) * S.v * dt; S.y += Math.sin(S.th) * S.v * dt;
    // hard limits: it never leaves the screen
    if (S.x < b.x0 || S.x > b.x1) { S.x = Math.min(b.x1, Math.max(b.x0, S.x)); S.th = Math.PI - S.th; }
    if (S.y < b.y0 || S.y > b.y1) { S.y = Math.min(b.y1, Math.max(b.y0, S.y)); S.th = -S.th; }
  }

  // screen px -> ground plane
  const ray = new THREE.Raycaster(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), v2 = new THREE.Vector2();
  const toGround = (x, y, out) => { v2.set((x / W) * 2 - 1, -(y / H) * 2 + 1); ray.setFromCamera(v2, cam); return ray.ray.intersectPlane(ground, out); };
  const g0 = new THREE.Vector3(), g1 = new THREE.Vector3();

  let last = performance.now(), t = 0;
  renderer.setAnimationLoop(() => {
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (document.hidden || S.off || !model) return;
    t += dt;
    if (S.mode !== "caught") step(dt, now);
    toGround(S.x, S.y, g0); toGround(S.x + Math.cos(S.th) * 10, S.y + Math.sin(S.th) * 10, g1);
    bug.position.copy(g0);
    bug.rotation.y = Math.atan2(g1.x - g0.x, g1.z - g0.z);
    const moving = Math.min(1, S.v / 60);
    const rate = S.mode === "flee" ? 46 : 26;
    body.position.y = Math.abs(Math.sin(t * rate)) * 3 * moving;                 // scuttle bob
    body.rotation.y = Math.sin(t * rate * 0.5) * 0.09 * moving;                  // waddle
    body.rotation.z = Math.sin(t * rate * 0.5 + 1) * 0.05 * moving;
    shadow.position.set(g0.x + 6, 0.5, g0.z + 8);
    glow.position.set(g0.x, 120, g0.z);
    glow.intensity = S.mode === "flee" ? 6 : 3;
    renderer.render(scene, cam);
  });
}
