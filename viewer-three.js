/* ============================================================
   viewer-three.js — the turntable itself.

   Imported dynamically by viewer.js, and only once a model has
   been named in the manifest. Until then none of this - including
   three.js - is downloaded.

   Loads a glTF (.glb) product model and lets you turn it. No
   geometry is generated here: this file is viewer code only, and
   the asset is supplied.

   Lighting is procedural. RoomEnvironment through PMREMGenerator
   gives image-based lighting for leather and metal with no HDR
   download and no third-party licence.

   Respects prefers-reduced-motion. Degrades to the poster if the
   model is named but will not download.
   ============================================================ */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function start(modelUrl) {

const host     = document.getElementById("stage");
const statusEl = document.getElementById("viewerStatus");
const hintEl   = document.getElementById("dragHint");

const reduce = window.matchMedia &&
               window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const setStatus = (t) => { if (statusEl) statusEl.textContent = t; };
function posterOnly(message) {
  host.classList.add("is-poster-only");
  host.classList.remove("is-live");
  setStatus(message);
  if (hintEl) hintEl.remove();
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch (e) {
  posterOnly("3D view unavailable");
  return;
}

/* ---------------- Renderer ---------------- */

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute("aria-hidden", "true");
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

/* ---------------- Image-based lighting ---------------- */

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();

const key = new THREE.DirectionalLight(0xf2ece0, 1.6);
key.position.set(3, 5, 4);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 0.5;
key.shadow.camera.far = 25;
key.shadow.camera.left = -4;
key.shadow.camera.right = 4;
key.shadow.camera.top = 4;
key.shadow.camera.bottom = -4;
key.shadow.bias = -0.0012;
scene.add(key);

const rim = new THREE.DirectionalLight(0xcfdcff, 1.9);
rim.position.set(-4, 2.5, -4);
scene.add(rim);

/* ---------------- Turntable ---------------- */

const turntable = new THREE.Group();
scene.add(turntable);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(6, 64),
  new THREE.MeshStandardMaterial({
    color: 0x0c0c10, roughness: 0.38, metalness: 0.5
  })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const ring = new THREE.Mesh(
  new THREE.TorusGeometry(2.55, 0.008, 8, 160),
  new THREE.MeshBasicMaterial({ color: 0x4e4e58 })
);
ring.rotation.x = Math.PI / 2;
ring.position.y = 0.004;
scene.add(ring);

/* ---------------- Loading ---------------- */

setStatus("Loading model");

const loader = new GLTFLoader();

/* Draco, for models compressed with it. Uncompressed works too. */
const draco = new DRACOLoader();
draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
loader.setDRACOLoader(draco);

let loaded = false;

loader.load(
  modelUrl,
  (gltf) => {
    loaded = true;
    draco.dispose();

    const model = gltf.scene;

    model.traverse((o) => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });

    /* Normalise. Nothing needs pre-scaling: measure, fit the longest
       axis to 2.6 units, centre on X/Z, drop the base to Y=0. */
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    model.scale.setScalar(2.6 / maxDim);

    const scaled = new THREE.Box3().setFromObject(model);
    const c = scaled.getCenter(new THREE.Vector3());
    model.position.x -= c.x;
    model.position.z -= c.z;
    model.position.y -= scaled.min.y;

    turntable.add(model);

    host.classList.remove("is-poster-only");
    host.classList.add("is-live");
    setStatus("Drag to rotate");

    if (hintEl) hintEl.classList.add("is-on");
  },
  (evt) => {
    if (evt.lengthComputable && evt.total > 0) {
      setStatus("Loading model · " + Math.round((evt.loaded / evt.total) * 100) + "%");
    }
  },
  () => {
    // Named in the manifest but will not download. Fall back to the
    // poster rather than leaving a dead canvas on the page. Not
    // logged: a model that is not there yet is a normal state.
    draco.dispose();
    posterOnly("Product model · image coming soon");
  }
);

/* ---------------- Interaction ----------------
   touch-action: pan-y on the canvas is what lets a phone still
   scroll the page while a horizontal drag turns the model. */

let rotY = 0, targetY = 0, vel = 0;
let dragging = false, lastX = 0, idle = 0;

const el = renderer.domElement;
el.style.cursor = "grab";
el.style.touchAction = "pan-y";

el.addEventListener("pointerdown", (e) => {
  if (!loaded) return;
  dragging = true; lastX = e.clientX; vel = 0;
  el.style.cursor = "grabbing";
  try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
});

el.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastX;
  lastX = e.clientX;
  targetY += dx * 0.011;
  vel = dx * 0.011;
  idle = 0;
});

const end = (e) => {
  if (!dragging) return;
  dragging = false;
  el.style.cursor = "grab";
  if (e && e.pointerId !== undefined) {
    try { el.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  }
};
el.addEventListener("pointerup", end);
el.addEventListener("pointercancel", end);
el.addEventListener("pointerleave", end);

/* Keyboard access for the same control */
host.setAttribute("tabindex", "0");
host.addEventListener("keydown", (e) => {
  if (!loaded) return;
  if (e.key === "ArrowLeft")  { targetY -= 0.18; idle = 0; e.preventDefault(); }
  if (e.key === "ArrowRight") { targetY += 0.18; idle = 0; e.preventDefault(); }
});

/* ---------------- Resize ---------------- */

function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // Portrait phones need the camera further back or the bag crops.
  camera.position.z = w < 700 ? 6.4 : 5.2;
  camera.position.y = w < 700 ? 1.5 : 1.4;
  camera.lookAt(0, 1.15, 0);
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize, { passive: true });
resize();

/* ---------------- Loop ----------------
   One sync() is re-checked by every signal. Browsers suspend rAF and
   IntersectionObserver in a background tab, so logic placed in an
   individual event handler would leave the canvas frozen whenever the
   page is opened in a tab that is not in front. */

const clock = new THREE.Clock();
let raf = 0, running = !document.hidden, visible = false;

function frame() {
  raf = requestAnimationFrame(frame);
  if (!running || !visible) return;

  // getDelta() must be read exactly once per frame. A second call in
  // the same frame returns ~0 because the timer has already reset,
  // which silently freezes the idle counter and stops auto-rotate.
  const dt = Math.min(clock.getDelta(), 0.05);
  idle += dt;

  if (!dragging) {
    targetY += vel;
    vel *= 0.94;
    if (!reduce && loaded && idle > 2) targetY += 0.0035;
  }

  rotY += (targetY - rotY) * 0.14;
  turntable.rotation.y = rotY;

  renderer.render(scene, camera);
}

function startLoop() {
  if (raf) return;
  clock.getDelta();          // discard the gap while stopped
  raf = requestAnimationFrame(frame);
}
function stopLoop() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}
function sync() {
  running = !document.hidden;
  if (running && visible) startLoop(); else stopLoop();
}

document.addEventListener("visibilitychange", sync);
window.addEventListener("pageshow", sync);
window.addEventListener("focus", sync);

if ("IntersectionObserver" in window) {
  new IntersectionObserver((entries) => {
    entries.forEach((en) => { visible = en.isIntersecting; sync(); });
  }, { threshold: 0.01 }).observe(host);
} else {
  visible = true;
  sync();
}

/* The observer only reports once on the first frame, which a tab
   opened in the background never gets. Fall back to a geometry test. */
setTimeout(() => {
  if (!visible) {
    const b = host.getBoundingClientRect();
    visible = b.top < window.innerHeight && b.bottom > 0;
    sync();
  }
}, 600);

window.__bdViewer = { scene, camera, renderer, turntable, THREE };

}
