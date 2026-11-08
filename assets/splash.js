import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const stage = document.getElementById("stage");
const bootEl = document.getElementById("boot");
const readout = document.getElementById("readout");
const btnL = document.getElementById("mLogic"), btnD = document.getElementById("mDesign");
let mode = "logic";

// boot text (starts once the loading screen has gone)
const boot = ["> initializing logic........ OK", "> applying design........... OK", "> alya.portfolio ready"];
let bi = 0;
function typeBoot() {
  if (bi >= boot.length) return;
  const line = document.createElement("div"); bootEl.append(line);
  let i = 0;
  const t = () => { line.textContent = boot[bi].slice(0, ++i); if (i < boot[bi].length && !reduce) setTimeout(t, 22); else { bi++; setTimeout(typeBoot, reduce ? 0 : 250); } };
  t();
}
if (document.getElementById("loader") && !window.__loaderDone) addEventListener("loader:done", () => setTimeout(typeBoot, 500), { once: true });
else setTimeout(typeBoot, 300);

/* ---------- renderer ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch (e) {
  stage.innerHTML = '<p style="position:absolute;inset:0;display:grid;place-content:center;font:.9rem monospace;color:#8fa597;text-align:center;padding:2rem">3D preview unavailable in this browser.<br>You can still enter the site.</p>';
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
stage.append(renderer.domElement);

const scene = new THREE.Scene();
const envTex = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
camera.position.set(0, 0.9, 6.4);
const controls = new OrbitControls(camera, renderer.domElement);
Object.assign(controls, { enableZoom: false, enablePan: false, enableDamping: true, dampingFactor: 0.08, autoRotate: !reduce, autoRotateSpeed: 0.9, minPolarAngle: 0.9, maxPolarAngle: 1.9 });

const hemi = new THREE.HemisphereLight(0xffffff, 0x111122, 0.4); scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(3, 4, 5); scene.add(key);
const violet = new THREE.PointLight(0x9b6bff, 0, 16); violet.position.set(-3.5, 1.5, 3); scene.add(violet);
const blue = new THREE.PointLight(0x3da9ff, 0, 16); blue.position.set(3.5, -0.5, 3); scene.add(blue);

const grid = new THREE.GridHelper(16, 32, 0x39ff88, 0x144428);
grid.material.transparent = true; grid.material.opacity = 0.3; scene.add(grid);

/* ---------- materials ---------- */
const GREEN = 0x39ff88, VIOLET = 0x9b6bff, BLUE = 0x3da9ff;
const wire = new THREE.MeshBasicMaterial({ color: GREEN, wireframe: true, transparent: true, opacity: 0.8 });

// Screen and keyboard textures ship in orange/purple. Strip them to greyscale so they can be lit in the site's colours.
function mono(tex) {
  const img = tex.image, c = document.createElement("canvas");
  c.width = img.width; c.height = img.height;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
  for (let i = 0; i < a.length; i += 4) {
    const l = Math.min(255, Math.pow((0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2]) / 255, 0.75) * 300);
    a[i] = a[i + 1] = a[i + 2] = l;
  }
  g.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.flipY = tex.flipY; t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = tex.wrapS; t.wrapT = tex.wrapT;
  t.repeat.copy(tex.repeat); t.offset.copy(tex.offset); t.center.copy(tex.center); t.rotation = tex.rotation;
  return t;
}
const glow = (map, color, opacity) => new THREE.MeshBasicMaterial({ map, color, transparent: true, opacity, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });

const parts = []; let model, verts = 0;

/* ---------- framing: keep the laptop clear of the headline ---------- */
function fit() {
  const w = stage.clientWidth, h = stage.clientHeight, wide = w / h > 1.1;
  renderer.setSize(w, h); camera.aspect = w / h;
  camera.position.setLength(wide ? 6.4 : 9.6);
  if (wide) camera.setViewOffset(w, h, -w * 0.2, 0, w, h);   // push the model right of the text
  else camera.setViewOffset(w, h, 0, -h * 0.14, w, h);       // phones: push it below the text
  camera.updateProjectionMatrix();
}
addEventListener("resize", fit); fit();

function place(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  const s = 3.3 / Math.max(size.x, size.y, size.z);
  obj.scale.setScalar(s); obj.position.sub(ctr.multiplyScalar(s));
  grid.position.y = -(size.y * s) / 2 - 0.08;
  scene.add(obj); model = obj;
}

new GLTFLoader().load("assets/laptop.glb", (gltf) => {
  const root = gltf.scene;
  root.traverse((o) => {
    if (!o.isMesh) return;
    verts += o.geometry.attributes.position.count;
    const m = o.material;
    if (m.transparent && m.emissiveMap) {            // the floating holo screen
      const map = mono(m.emissiveMap);
      parts.push({ o, logic: glow(map, GREEN, 0.95), design: glow(map, BLUE, 1) });
      o.renderOrder = 2;
    } else if (m.emissiveMap) {                       // the light-up keyboard
      const map = mono(m.emissiveMap);
      parts.push({ o, logic: glow(map, GREEN, 0.9), design: glow(map, VIOLET, 1) });
      o.renderOrder = 1;
    } else {                                          // the laptop body
      parts.push({ o, logic: wire, design: m });
    }
  });
  place(root);
  setMode(mode, true);
}, undefined, () => {
  // GLB missing: simple stand-in so the splash still works
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.8), new THREE.MeshStandardMaterial({ color: 0x2a2f2c }));
  const lid = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.7, 0.08), new THREE.MeshStandardMaterial({ color: 0x0b2a18, emissive: GREEN, emissiveIntensity: 0.25 }));
  lid.position.set(0, 0.85, -0.9); g.add(base, lid);
  g.traverse((o) => { if (o.isMesh) { parts.push({ o, logic: wire, design: o.material }); verts += o.geometry.attributes.position.count; } });
  place(g); setMode(mode, true);
});

let glitch = 0;
function setMode(m, silent) {
  mode = m;
  btnL.setAttribute("aria-pressed", m === "logic"); btnD.setAttribute("aria-pressed", m === "design");
  document.body.dataset.mode = m;
  if (!silent) glitch = reduce ? 0 : 14;
  parts.forEach((p) => { p.o.material = p[m]; });
  scene.environment = m === "design" ? envTex : null;
}
btnL.onclick = () => setMode("logic"); btnD.onclick = () => setMode("design");

/* ---------- loop ---------- */
let t = 0, dir = 1;
renderer.setAnimationLoop(() => {
  t += 0.016;
  // sway between three-quarter views instead of spinning to the back of the screen
  const azR = controls.getAzimuthalAngle();
  if (azR > 0.85) dir = -1; else if (azR < -0.85) dir = 1;
  controls.autoRotateSpeed = 0.9 * dir;
  controls.update();
  if (model && !reduce) model.position.y += Math.sin(t * 1.4) * 0.0012;   // slow hover
  const dz = mode === "design";
  violet.intensity += ((dz ? 60 : 0) - violet.intensity) * 0.08;
  blue.intensity += ((dz ? 55 : 0) - blue.intensity) * 0.08;
  key.intensity += ((dz ? 1.2 : 0.2) - key.intensity) * 0.08;
  grid.material.color.set(dz ? VIOLET : GREEN);
  if (glitch > 0) { glitch--; parts.forEach((p) => { p.o.visible = glitch % 3 !== 0; }); if (!glitch) parts.forEach((p) => (p.o.visible = true)); }
  const az = ((azR * 180) / Math.PI + 360) % 360;
  readout.textContent = `θ ${az.toFixed(1).padStart(5, "0")}°  ·  verts ${verts || "--"}  ·  lens ${mode}`;
  renderer.render(scene, camera);
});
