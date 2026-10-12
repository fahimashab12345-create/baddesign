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

/* ============================================================
   HOODIE WORDMARK
   The chest print, drawn to a canvas and mapped onto a shallow
   panel that sits a few millimetres proud of the hoodie shell.

   Drawn at runtime rather than baked into the GLB on purpose: the
   brand face is already loaded by the page, so the wordmark comes out
   in the real typeface instead of whatever font happened to be
   available offline. It also keeps the asset free of texture plumbing,
   and editing the word is editing one string.
   ============================================================ */

/* Placement is derived from the model's own bounding box, not fixed in
   metres. The print then lands in the same place on any hoodie built
   from this pipeline, and does not hang in mid air if the proportions
   are retuned. Fractions are of total height, measured from the floor. */
const CHEST = {
  yLow: 0.740,        // bottom of the print, as a fraction of height
  yHigh: 0.796,
  halfW: 0.070,       // half width, as a fraction of height
  standOff: 0.004     // how far it sits proud of the shell, in metres
};

function makeWordmark(text) {
  const W = 1024, H = 512;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");

  x.clearRect(0, 0, W, H);
  x.fillStyle = "#ffffff";

  const stack = text.split("|");
  x.textAlign = "center";
  x.textBaseline = "middle";

  /* Fit each line inside a padded box rather than to the full canvas, so
     the mark keeps clear margins and never reaches the panel edge. */
  const PAD_X = 0.14, PAD_Y = 0.16;
  const innerW = W * (1 - PAD_X * 2);
  const innerH = H * (1 - PAD_Y * 2);
  const lh = innerH / stack.length;
  stack.forEach((line, i) => {
    let size = Math.floor(lh * 0.96);
    x.font = '700 ' + size + 'px "Clash Display", "Satoshi", system-ui, sans-serif';
    const m = x.measureText(line);
    if (m.width > innerW) {
      size = Math.floor(size * innerW / m.width);
      x.font = '700 ' + size + 'px "Clash Display", "Satoshi", system-ui, sans-serif';
    }
    x.fillText(line, W / 2, PAD_Y * H + lh * (i + 0.5));
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function attachPrint(model, text) {
  /* Box3.setFromObject returns WORLD coordinates, but the print is parented
     to the model, whose scale and position are already applied. Measuring
     in world and then parenting in local space transforms the panel twice
     and leaves it hovering above the head. Undo the model's own transform
     to get back to the space the child will actually live in. */
  /* Read the local bounds straight off the geometry attributes.

     Two things make this the reliable route. Box3.setFromObject returns
     world coordinates, but the print is parented to the model whose scale
     and offset are already baked in, so measuring in one space and
     placing in the other double-transforms it. And model.matrixWorld is
     only refreshed during a render, so inverting it before the first
     frame hands back a stale matrix. The position attribute already lives
     in the space the child will occupy, which removes both problems. */
  /* GLTFLoader hands back a Group wrapping the mesh, so model.geometry is
     undefined until the mesh is found. Measuring through setFromObject
     worked by traversing; reading attributes directly does not, so the
     target is resolved first. */
  let target = null;
  if (model.geometry && model.geometry.attributes &&
      model.geometry.attributes.position) {
    target = model;
  } else {
    model.traverse((o) => {
      if (!target && o.isMesh && o.geometry && o.geometry.attributes &&
          o.geometry.attributes.position) target = o;
    });
  }
  if (!target) return null;

  const ap = target.geometry.attributes.position;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < ap.count; i++) {
    const x = ap.getX(i), y = ap.getY(i), z = ap.getZ(i);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  const h = maxY - minY;
  const w = maxX - minX;

  /* Only a standing figure gets a print. Anything much wider than it is
     tall is a folded garment or a bag, and a wordmark would float. */
  if (h < w * 1.9) return null;

  const y0 = minY + h * CHEST.yLow;
  const y1 = minY + h * CHEST.yHigh;
  const halfW = h * CHEST.halfW;

  const segs = 28, rings = 12;
  const pos = [], uv = [], idx = [];

  /* Place every panel vertex just outside the garment directly beneath it.
     An earlier version sampled a coarse grid and interpolated between cells.
     That is where this went wrong several times: cells that caught no mesh
     vertex came back empty, were filled from distant neighbours, and the
     print sank behind the chest in bands. Scanning a small neighbourhood per
     vertex is exact, and at this vertex count the cost is nothing. */
  const BAND = 0.022;         // x/y search radius, in model units
  const STANDOFF = 0.0035;

  /* Band-wide frontmost z, used only where a vertex finds nothing local. */
  let zBand = -Infinity;
  for (let i = 0; i < ap.count; i++) {
    const y = ap.getY(i), z = ap.getZ(i);
    if (y >= y0 - 0.02 && y <= y1 + 0.02 && z > zBand) zBand = z;
  }
  if (!isFinite(zBand)) zBand = maxZ;

  function frontAt(x, y) {
    let best = -Infinity;
    for (let i = 0; i < ap.count; i++) {
      const ax = ap.getX(i), ay = ap.getY(i), az = ap.getZ(i);
      if (az <= best) continue;
      if (Math.abs(ax - x) > BAND || Math.abs(ay - y) > BAND) continue;
      best = az;
    }
    return isFinite(best) ? best : zBand;
  }

  for (let i = 0; i < rings; i++) {
    const t = i / (rings - 1);
    const y = y0 + (y1 - y0) * t;
    for (let j = 0; j < segs; j++) {
      const u = j / (segs - 1);
      const a = (u - 0.5) * 2;                        // -1 .. 1
      /* Full width, no taper. Pinching the geometry to zero at both ends
         while the UVs stay linear crushes the texture there and shears the
         outer letters. The padding belongs in the canvas, where it costs
         nothing, rather than in the mesh. */
      const x = halfW * a;
      const z = frontAt(x, y) + STANDOFF;
      pos.push(x, y, z);
      uv.push(u, t);
    }
  }
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < segs - 1; j++) {
      const a = i * segs + j;
      idx.push(a, a + 1, a + segs + 1, a, a + segs + 1, a + segs);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();

  const map = makeWordmark(text);
  const mat = new THREE.MeshStandardMaterial({
    map: map,
    emissiveMap: map,
    /* A white print on near-black wool has almost no light of its own to
       catch. The emissive lift is what keeps it legible when the chest
       turns away from the key light. */
    emissive: 0xffffff,
    emissiveIntensity: 0.34,
    transparent: true,
    alphaTest: 0.4,
    roughness: 0.78,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(g, mat);
  mesh.name = "chestPrint";
  mesh.renderOrder = 2;
  /* Parented to the mesh, not the group, so it inherits whatever local
     transform the mesh carries and turns with the model. */
  target.add(mesh);
  return mesh;
}


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

const key = new THREE.DirectionalLight(0xf2ece0, 2.6);
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

/* A hard cool rim behind. A matte black figure on a near-black stage has
   almost no tonal separation, so the rim is what draws the silhouette. */
const rim = new THREE.DirectionalLight(0xbcd4ff, 4.2);
rim.position.set(-4, 2.5, -4);
scene.add(rim);

const fill = new THREE.DirectionalLight(0x8f9bb5, 0.7);
fill.position.set(-2, 1.2, 3);
scene.add(fill);

/* ---------------- Turntable ---------------- */

const turntable = new THREE.Group();
scene.add(turntable);

/* The floor is sized to the figure, not to the world. At radius 6 a disc
   dwarfed a 2.6-unit model and the empty stage read as the subject. */
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(2.4, 64),
  new THREE.MeshStandardMaterial({
    color: 0x0a0a0e, roughness: 0.42, metalness: 0.55
  })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* Fade the floor out instead of ending it on a hard rim. */
const groundFade = new THREE.Mesh(
  new THREE.RingGeometry(1.5, 3.4, 64),
  new THREE.MeshBasicMaterial({
    color: 0x0a0a0e, transparent: true, opacity: 0.85,
    side: THREE.DoubleSide, depthWrite: false
  })
);
groundFade.rotation.x = -Math.PI / 2;
groundFade.position.y = 0.002;
scene.add(groundFade);

const ring = new THREE.Mesh(
  new THREE.TorusGeometry(0.78, 0.006, 8, 128),
  new THREE.MeshBasicMaterial({ color: 0x5a5a68 })
);
ring.rotation.x = Math.PI / 2;
ring.position.y = 0.006;
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

    /* Wait for the brand face before drawing the wordmark, otherwise the
       canvas falls back to system-ui and the print is in the wrong
       typeface for good. */
    const word = "BAD|DESIGN";
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { attachPrint(model, word); });
    } else {
      attachPrint(model, word);
    }

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

  /* Frame the 2.6-unit figure so it fills the height with a little air.
     A narrow stage needs the camera further back or the figure crops at
     the top and the floor edge crowds the bottom. */
  const portrait = h > w * 0.85;
  const wide = w > 1500;
  camera.position.z = portrait ? 5.6 : wide ? 5.3 : 4.9;
  camera.position.y = portrait ? 1.42 : 1.32;
  camera.lookAt(0, portrait ? 1.26 : 1.30, 0);
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
