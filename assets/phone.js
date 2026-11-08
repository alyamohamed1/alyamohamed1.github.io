/* Contact page: cyberpunk phone that diffuses into particles around the cursor and bursts on click/tap. */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";

const host = document.getElementById("phone");
const hint = document.getElementById("phoneHint");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (hint && matchMedia("(hover: none)").matches) hint.textContent = hint.dataset.idle = "[ touch to diffuse · tap to burst ]";

if (host) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { host.classList.add("no3d"); }
  if (renderer) init(renderer);
}

function init(renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  cam.position.set(0, 0, 6.2);
  scene.add(new THREE.HemisphereLight(0xdfffee, 0x0a1410, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2, 3, 4); scene.add(key);
  const rim = new THREE.PointLight(0x39ff88, 18, 8); rim.position.set(-2, 1, -1.5); scene.add(rim);
  const pivot = new THREE.Group(); scene.add(pivot);

  const fit = () => { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  addEventListener("resize", fit); fit();

  const uniforms = {
    uMouse: { value: new THREE.Vector3(9, 9, 9) }, uHover: { value: 0 }, uBurst: { value: 0 },
    uTime: { value: 0 }, uSize: { value: Math.min(devicePixelRatio, 2) * 2.1 }, uRadius: { value: 0.85 }, uOpacity: { value: 0.35 },
    uJitter: { value: reduce ? 0 : 1 },
  };
  let solids = [], ready = false;

  new GLTFLoader().load("assets/phone.glb", (g) => {
    const root = g.scene;
    const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const s = 3.05 / Math.max(size.x, size.y, size.z);
    root.scale.setScalar(s); root.position.copy(c.multiplyScalar(-s));
    root.updateMatrixWorld(true);

    // sample the surface, coloured from each part's own texture
    const parts = [];
    root.traverse((o) => { if (o.isMesh) parts.push(o); });
    const areaOf = (geo) => {
      const p = geo.attributes.position, idx = geo.index, a = new THREE.Vector3(), b = new THREE.Vector3(), cc = new THREE.Vector3();
      let A = 0; const n = idx ? idx.count : p.count;
      for (let i = 0; i < n; i += 3) {
        const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
        a.fromBufferAttribute(p, i0); b.fromBufferAttribute(p, i1); cc.fromBufferAttribute(p, i2);
        A += b.sub(a).cross(cc.sub(a)).length() / 2;
      }
      return A;
    };
    const reader = (tex) => {
      if (!tex || !tex.image) return null;
      const img = tex.image, cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
      const x = cv.getContext("2d"); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, cv.width, cv.height).data;
      return (u, v) => { u -= Math.floor(u); v -= Math.floor(v); const i = ((Math.min(cv.height - 1, (v * cv.height) | 0) * cv.width) + Math.min(cv.width - 1, (u * cv.width) | 0)) * 4; return [d[i] / 255, d[i + 1] / 255, d[i + 2] / 255, d[i + 3] / 255]; };
    };
    const geos = parts.map((m) => { const geo = m.geometry.clone(); geo.applyMatrix4(m.matrixWorld); return geo; });
    const areas = geos.map(areaOf), total = areas.reduce((a, b) => a + b, 0);
    const N = innerWidth < 700 ? 9000 : 16000;
    const pos = [], col = [], rnd = [], seed = [];
    const P = new THREE.Vector3(), Nn = new THREE.Vector3(), C = new THREE.Color(), UV = new THREE.Vector2();
    const green = new THREE.Color(0x39ff88);
    parts.forEach((m, k) => {
      const mat = m.material, isScreen = !!mat.emissiveMap, isDecal = mat.transparent || mat.alphaMode === "BLEND";
      const rd = reader(isScreen ? mat.emissiveMap : mat.map), base = mat.color || new THREE.Color(1, 1, 1);
      const sampler = new MeshSurfaceSampler(new THREE.Mesh(geos[k])).build();
      const want = Math.max(200, Math.round((N * areas[k]) / total) * (isScreen ? 2 : 1));
      let made = 0, tries = 0;
      while (made < want && tries < want * 6) {
        tries++;
        sampler.sample(P, Nn, undefined, UV);
        let r = 0.5, gg = 0.5, b = 0.5, a = 1;
        if (rd) [r, gg, b, a] = rd(UV.x, UV.y);
        if (isDecal && a < 0.35) continue;
        if (isScreen) { const e = mat.emissive; C.setRGB(0.15 + r * (e.r + 0.6), 0.2 + gg * (e.g + 0.7), 0.3 + b * (e.b + 0.2)); }
        else { C.setRGB(r * base.r, gg * base.g, b * base.b).lerp(green, 0.45); C.offsetHSL(0, 0, 0.12); }
        pos.push(P.x + Nn.x * 0.004, P.y + Nn.y * 0.004, P.z + Nn.z * 0.004);
        col.push(C.r, C.g, C.b);
        const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(0.4 + Math.random() * 0.9).addScaledVector(Nn, 0.5);
        rnd.push(dir.x, dir.y, dir.z); seed.push(Math.random());
        made++;
      }
    });
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    pg.setAttribute("aColor", new THREE.Float32BufferAttribute(col, 3));
    pg.setAttribute("aRand", new THREE.Float32BufferAttribute(rnd, 3));
    pg.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
    const pm = new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        uniform vec3 uMouse; uniform float uHover, uBurst, uTime, uSize, uRadius, uJitter;
        attribute vec3 aColor, aRand; attribute float aSeed;
        varying vec3 vColor; varying float vA;
        void main(){
          vec3 p = position;
          vec3 d = p - uMouse; float dist = length(d);
          float f = smoothstep(uRadius, 0.0, dist) * uHover;
          vec3 dir = normalize(d + aRand * 0.7 + 1e-4);
          p += dir * f * (1.0 + aSeed * 0.9);
          p += aRand * uBurst * (1.6 + aSeed * 1.4);
          float j = (0.006 + f * 0.05 + uBurst * 0.08) * uJitter;
          p += vec3(sin(uTime*1.7 + aSeed*40.0), cos(uTime*1.3 + aSeed*25.0), sin(uTime*1.1 + aSeed*13.0)) * j;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * (1.0 + f * 0.9 + uBurst * 0.6) * (6.0 / -mv.z);
          vColor = aColor * (1.0 + f * 0.6);
          vA = 0.6 + 0.4 * max(f, uBurst);
        }`,
      fragmentShader: `
        uniform float uOpacity; varying vec3 vColor; varying float vA;
        void main(){
          float r = length(gl_PointCoord - 0.5); if (r > 0.5) discard;
          gl_FragColor = vec4(vColor, smoothstep(0.5, 0.1, r) * vA * uOpacity);
        }`,
    });
    const points = new THREE.Points(pg, pm); points.frustumCulled = false;

    root.traverse((o) => { if (o.isMesh) { o.material.transparent = true; solids.push(o.material); } });
    pivot.add(root, points);
    host.classList.add("ready"); ready = true;
  }, undefined, () => host.classList.add("no3d"));

  // interaction
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
  const mouseT = new THREE.Vector3(9, 9, 9);
  let hoverT = 0, burstT = 0, burstUntil = 0, px = 0, py = 0;
  const el = renderer.domElement;
  const move = (e) => {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    px = ndc.x; py = ndc.y;
    ray.setFromCamera(ndc, cam);
    if (ray.ray.intersectPlane(plane, hit)) { mouseT.copy(pivot.worldToLocal(hit.clone())); hoverT = 1; }
  };
  const burst = () => { burstT = 1; burstUntil = performance.now() + 420; if (hint) hint.textContent = "[ reassembling ... ]"; };
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerdown", (e) => { move(e); burst(); });
  el.addEventListener("pointerleave", () => { hoverT = 0; px = py = 0; });
  host.tabIndex = 0;
  host.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); burst(); } });

  let visible = true;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(host);
  let t = 0, tx = 0, ty = 0;
  renderer.setAnimationLoop(() => {
    if (!visible || document.hidden || !ready) return;
    t += 0.016; uniforms.uTime.value = t;
    if (performance.now() > burstUntil) burstT = 0;
    const u = uniforms;
    u.uHover.value += (hoverT - u.uHover.value) * 0.08;
    u.uBurst.value += (burstT - u.uBurst.value) * (burstT ? 0.16 : 0.035);
    u.uMouse.value.lerp(mouseT, 0.25);
    if (hint && !burstT && u.uBurst.value < 0.05 && hint.textContent !== hint.dataset.idle) hint.textContent = hint.dataset.idle;
    const diffuse = Math.min(1, u.uHover.value * 0.9 + u.uBurst.value * 1.5);
    u.uOpacity.value = 0.32 + diffuse * 0.68;
    solids.forEach((m) => { m.opacity = 1 - diffuse * 0.92; m.depthWrite = m.opacity > 0.6; });
    // sway between three-quarter views, lean toward the pointer
    tx += (px * 0.35 - tx) * 0.05; ty += (py * 0.2 - ty) * 0.05;
    pivot.rotation.y = Math.PI / 2 + (reduce ? 0 : Math.sin(t * 0.45) * 0.45 * (1 - u.uHover.value * 0.7)) + tx;
    pivot.rotation.x = -ty;
    pivot.position.y = reduce ? 0 : Math.sin(t * 1.2) * 0.04;
    renderer.render(scene, cam);
  });
}
