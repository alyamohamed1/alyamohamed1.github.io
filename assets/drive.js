/* The 1989 Fujikama hard drive scan: turns slowly in the Projects header, spins up while a cartridge is read. */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const host = document.getElementById("drive");
const stat = document.getElementById("driveStat");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (host) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { host.classList.add("no3d"); }
  if (renderer) {
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.append(renderer.domElement);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
    cam.position.set(0, 0.25, 3.1); cam.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x0b1a10, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(2, 3, 3); scene.add(key);
    const rim = new THREE.PointLight(0x39ff88, 14, 6); rim.position.set(-1.6, 0.6, -1.2); scene.add(rim);
    const accent = new THREE.PointLight(0x39ff88, 0, 6); accent.position.set(1.4, -0.4, 1.4); scene.add(accent);

    const pivot = new THREE.Group(); scene.add(pivot);
    const fit = () => {
      const w = host.clientWidth, h = host.clientHeight;
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    };
    addEventListener("resize", fit); fit();

    new GLTFLoader().load("assets/drive.glb", (g) => {
      const m = g.scene;
      const box = new THREE.Box3().setFromObject(m), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
      const s = 1.55 / Math.max(size.x, size.y, size.z);
      m.scale.setScalar(s); m.position.copy(c.multiplyScalar(-s));
      pivot.add(m);
      pivot.rotation.set(-0.08, Math.PI / 2 - 0.5, 0.04);   // start label-side, three-quarter view
      host.classList.add("ready");
    }, undefined, () => host.classList.add("no3d"));

    let speed = 0.25, target = 0.25, t = 0;
    const green = new THREE.Color(0x39ff88), tint = new THREE.Color(0x39ff88);
    addEventListener("reader:state", (e) => {
      const { state, code, accent: col } = e.detail;
      if (col) tint.set(col);
      target = state === "read" ? 6 : state === "seek" ? 2.2 : 0.25;
      if (stat) stat.textContent = state === "read" ? `reading ${code} ...` : state === "seek" ? `seeking ${code || ""}` : code ? `${code} mounted` : "archive drive · idle";
      if (state === "idle" && !code) tint.copy(green);
    });

    // drag to spin (with momentum); arrow keys when focused
    let dragging = false, lx = 0, ly = 0, vx = 0, vy = 0, tilt = -0.08;
    const el = renderer.domElement;
    host.tabIndex = 0; host.setAttribute("role", "img");
    host.setAttribute("aria-label", "3D scan of a 1989 Fujikama 85MB hard drive. Drag or use the arrow keys to spin it.");
    host.removeAttribute("aria-hidden"); host.closest("figure")?.removeAttribute("aria-hidden");
    el.addEventListener("pointerdown", (e) => { dragging = true; lx = e.clientX; ly = e.clientY; vx = vy = 0; el.setPointerCapture(e.pointerId); host.classList.add("grabbing"); });
    el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      vx = dx * 0.012; vy = dy * 0.008;
      pivot.rotation.y += vx; tilt = Math.max(-0.9, Math.min(0.9, tilt + vy));
    });
    const up = () => { dragging = false; host.classList.remove("grabbing"); };
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    host.addEventListener("keydown", (e) => {
      const k = { ArrowLeft: [-0.25, 0], ArrowRight: [0.25, 0], ArrowUp: [0, -0.15], ArrowDown: [0, 0.15] }[e.key];
      if (!k) return; e.preventDefault(); vx = k[0] * 0.5; tilt = Math.max(-0.9, Math.min(0.9, tilt + k[1]));
    });

    let visible = true;
    new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(host);
    renderer.setAnimationLoop(() => {
      if (!visible || document.hidden) return;
      t += 0.016;
      speed += (target - speed) * 0.05;
      if (!dragging) {
        pivot.rotation.y += vx; vx *= 0.94;                        // momentum after a flick
        if (Math.abs(vx) < 0.002 && !reduce) pivot.rotation.y += speed * 0.016;
        tilt += (-0.08 - tilt) * 0.02;                             // ease back upright
      }
      pivot.rotation.x = tilt;
      if (!reduce) pivot.position.y = Math.sin(t * 1.3) * 0.025;
      accent.color.lerp(tint, 0.06); rim.color.lerp(tint, 0.06);
      accent.intensity += ((target > 1 ? 10 : 2) - accent.intensity) * 0.06;
      renderer.render(scene, cam);
    });
  }
}
