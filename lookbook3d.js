/* ============================================================
   lookbook3d.js — the figure.

   A stylised, faceless mannequin wearing the Drop 004 silhouette.

   The earlier version stacked CylinderGeometry primitives, which is
   why it read as a robot: every limb was a hard tube with a visible
   seam where two tubes met. This rebuild uses LatheGeometry — a
   hand-authored profile spun around the vertical axis — so each form
   is a single continuous surface of revolution with smooth normals
   and no joints. That is how display mannequins are actually
   modelled, and it is the difference between "robot" and "atelier".

   Proportions are 8.5 heads, the fashion-illustration canon.
   Cloth carries a generated woven bump map so the light breaks up
   across the surface instead of sliding over it.

   A photoreal human is not achievable from code — that needs a
   sculpted or scanned .glb. Drop one in and use the notes at the
   bottom of this file.

   Degrades to a plain message if WebGL or the module cannot load.
   ============================================================ */

import * as THREE from "three";

const host = document.getElementById("stage");
const fallback = document.getElementById("stageFallback");

if (host && fallback) {

const reduce = window.matchMedia &&
               window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch (e) { renderer = null; }

if (!renderer) {
  fallback.hidden = false;
} else {
  try { start(); } catch (e) { console.warn("[lookbook3d]", e); fallback.hidden = false; }
}

function start() {

  /* ---------------- Renderer / scene / camera ---------------- */

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 5.0, 17.6);
  camera.lookAt(0, 4.9, 0);

  /* ---------------- Lighting ----------------
     Studio three-point. The rim behind is what makes it read as a
     fashion photograph rather than a 3D preview. */

  const key = new THREE.DirectionalLight(0xf5efe4, 2.6);
  key.position.set(4.2, 9.5, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 32;
  key.shadow.camera.left = -7;
  key.shadow.camera.right = 7;
  key.shadow.camera.top = 13;
  key.shadow.camera.bottom = -2;
  key.shadow.bias = -0.0015;
  key.shadow.radius = 2;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xd6e2ff, 3.8);
  rim.position.set(-6.5, 6.5, -7);
  scene.add(rim);

  const rim2 = new THREE.DirectionalLight(0xe0d6c2, 1.7);
  rim2.position.set(7, 4.5, -5);
  scene.add(rim2);

  const fill = new THREE.DirectionalLight(0x8a8a9c, 0.55);
  fill.position.set(-3, 2, 7);
  scene.add(fill);

  scene.add(new THREE.HemisphereLight(0x3c3c4e, 0x08080a, 0.9));

  /* ---------------- Woven bump map ----------------
     Generated rather than downloaded: a plain weave with a little
     irregularity, used as a bumpMap so raking light catches the
     texture instead of sliding off a perfectly smooth shell. */

  function weaveTexture() {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");

    g.fillStyle = "#808080";
    g.fillRect(0, 0, size, size);

    // over-under weave: alternating warp and weft bands
    const pitch = 8;
    for (let y = 0; y < size; y += pitch) {
      for (let x = 0; x < size; x += pitch) {
        const even = ((x / pitch) + (y / pitch)) % 2 === 0;
        g.fillStyle = even ? "#9a9a9a" : "#666666";
        g.fillRect(x, y, pitch - 1, pitch - 1);
        // thread highlight along the top edge of each cell
        g.fillStyle = even ? "#b4b4b4" : "#7a7a7a";
        g.fillRect(x, y, pitch - 1, 2);
      }
    }

    // fine irregularity so it does not look like a checkerboard
    const img = g.getImageData(0, 0, size, size);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 26;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = d[i]; d[i + 2] = d[i];
    }
    g.putImageData(img, 0, 0);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(9, 9);
    return tex;
  }

  const weave = weaveTexture();

  /* ---------------- Materials ---------------- */

  const cloth = new THREE.MeshStandardMaterial({
    color: 0x27272f, roughness: 0.92, metalness: 0.0,
    bumpMap: weave, bumpScale: 0.022
  });
  const clothDeep = new THREE.MeshStandardMaterial({
    color: 0x17171d, roughness: 0.95, metalness: 0.0,
    bumpMap: weave, bumpScale: 0.03
  });
  const knitMat = new THREE.MeshStandardMaterial({
    color: 0x2c2c34, roughness: 0.97, metalness: 0.0,
    bumpMap: weave, bumpScale: 0.05
  });
  const skin = new THREE.MeshStandardMaterial({
    color: 0x4a4a55, roughness: 0.62, metalness: 0.04
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c22, roughness: 0.58, metalness: 0.18
  });
  const trim = new THREE.MeshStandardMaterial({
    color: 0x9e9a92, roughness: 0.42, metalness: 0.45
  });

  /* ---------------- Geometry helpers ---------------- */

  /* Spin a profile around Y. profile = [[radius, y], ...] top to
     bottom. Starting and ending at radius 0 closes the solid, so
     there is no open seam and normals stay continuous. */
  function lathe(profile, material, seg) {
    const pts = profile.map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    const g = new THREE.LatheGeometry(pts, seg || 64);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, material);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  /* ---------------- The figure ----------------
     8.5 heads tall. Total 10 units: head 9.0–10.0, shoulder 8.75,
     chest 8.05, waist 7.15, hip 6.2, knee 3.6, ankle 0.8. */

  const figure = new THREE.Group();

  // Torso: one continuous shell, shoulders to hem. Slight forward
  // flattening (scale.z) keeps it from reading as a barrel.
  const torso = lathe([
    [0.00, 8.98], [0.28, 8.94], [0.58, 8.86], [0.80, 8.74],
    [0.94, 8.55], [1.00, 8.25], [1.03, 7.85], [1.02, 7.45],
    [1.03, 7.10], [1.08, 6.72], [1.14, 6.35], [1.17, 6.05],
    [1.16, 5.86], [1.08, 5.78], [0.60, 5.76], [0.00, 5.76]
  ], cloth, 72);
  torso.scale.z = 0.74;
  figure.add(torso);

  // Neck
  figure.add(lathe([
    [0.00, 9.30], [0.19, 9.22], [0.21, 8.95], [0.25, 8.80],
    [0.40, 8.70], [0.00, 8.70]
  ], skin, 40));

  // Head: a lathe egg, slightly narrower than deep. Faceless on
  // purpose — a mannequin, not a person.
  const head = lathe([
    [0.00, 10.00], [0.20, 9.96], [0.34, 9.84], [0.44, 9.62],
    [0.48, 9.36], [0.47, 9.12], [0.40, 8.96], [0.26, 8.88],
    [0.00, 8.86]
  ], skin, 56);
  head.scale.set(0.90, 1.0, 0.94);
  head.position.set(0, 0.02, 0.04);
  figure.add(head);

  // Hood: bunched behind the neck, big enough to read from any angle.
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.62, 48, 32), clothDeep);
  hood.scale.set(1.34, 0.78, 0.86);
  hood.position.set(0, 8.86, -0.34);
  hood.castShadow = true;
  figure.add(hood);

  const hoodRim = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.055, 12, 48), cloth);
  hoodRim.rotation.x = Math.PI / 2.35;
  hoodRim.position.set(0, 8.72, -0.18);
  hoodRim.scale.set(1.1, 1.0, 1.0);
  hoodRim.castShadow = true;
  figure.add(hoodRim);

  // Sleeves: single tapered forms, angled out and very slightly
  // forward. No separate cuff cylinder — the taper carries it.
  [-1, 1].forEach(function (s) {
    const arm = lathe([
      [0.00, 0.00], [0.30, 0.03], [0.40, 0.20], [0.45, 0.70],
      [0.46, 1.50], [0.43, 2.30], [0.38, 2.95], [0.34, 3.20],
      [0.00, 3.22]
    ], cloth, 44);
    arm.scale.z = 0.88;
    arm.position.set(s * 0.92, 8.60, 0.02);
    arm.rotation.z = s * 0.135;
    arm.rotation.x = -0.075;
    figure.add(arm);

    // Ribbed cuff, a short band at the sleeve end
    const cuff = lathe([
      [0.00, 0.00], [0.33, 0.01], [0.36, 0.10], [0.35, 0.26],
      [0.32, 0.28], [0.00, 0.28]
    ], clothDeep, 36);
    cuff.scale.z = 0.88;
    cuff.position.set(s * 1.20, 5.42, 0.14);
    cuff.rotation.z = s * 0.135;
    figure.add(cuff);
  });

  // Kangaroo pocket, shallow so it reads as a seam not a box
  const pocket = lathe([
    [0.00, 0.00], [0.62, 0.02], [0.70, 0.22], [0.66, 0.34],
    [0.00, 0.34]
  ], clothDeep, 44);
  pocket.scale.set(1.0, 1.0, 0.34);
  pocket.position.set(0, 6.02, 0.60);
  figure.add(pocket);

  // Hips into legs: one wide form, then two legs that overlap at
  // the thigh and separate at the ankle, so it reads as a body.
  const hips = lathe([
    [0.00, 5.90], [0.62, 5.86], [0.86, 5.66], [0.94, 5.30],
    [0.92, 4.95], [0.70, 4.80], [0.00, 4.78]
  ], cloth, 64);
  hips.scale.z = 0.80;
  figure.add(hips);

  [-1, 1].forEach(function (s) {
    const leg = lathe([
      [0.00, 0.00], [0.42, 0.03], [0.46, 0.35], [0.54, 1.10],
      [0.62, 1.95], [0.68, 2.70], [0.71, 3.30], [0.72, 3.75],
      [0.60, 3.92], [0.00, 3.96]
    ], cloth, 52);
    leg.scale.z = 0.88;
    leg.position.set(s * 0.44, 1.30, 0);
    figure.add(leg);

    // Stacked hem at the ankle
    const hem = lathe([
      [0.00, 0.00], [0.46, 0.01], [0.50, 0.14], [0.49, 0.32],
      [0.44, 0.34], [0.00, 0.34]
    ], clothDeep, 40);
    hem.scale.z = 0.88;
    hem.position.set(s * 0.44, 0.98, 0);
    figure.add(hem);

    // Cargo pocket on the outer thigh
    const cp = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.66, 0.50), clothDeep);
    cp.position.set(s * 0.98, 3.10, 0);
    cp.castShadow = true;
    figure.add(cp);

    // Boot: a rounded wedge, dark on purpose
    const boot = lathe([
      [0.00, 0.00], [0.40, 0.01], [0.46, 0.14], [0.46, 0.34],
      [0.42, 0.46], [0.30, 0.52], [0.00, 0.54]
    ], shoeMat, 40);
    boot.scale.set(1.0, 1.0, 1.55);
    boot.position.set(s * 0.44, 0.52, 0.16);
    figure.add(boot);

    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.13, 1.34), trim);
    sole.position.set(s * 0.44, 0.065, 0.18);
    sole.castShadow = true;
    sole.receiveShadow = true;
    figure.add(sole);
  });

  // Drawcords
  [-1, 1].forEach(function (s) {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.78, 8), trim);
    cord.position.set(s * 0.17, 8.40, 0.52);
    cord.rotation.z = s * 0.06;
    figure.add(cord);
  });

  /* Contrapposto: shift the shoulder line and the hip line in
     opposite directions. A perfectly symmetric figure reads as a
     mannequin prop; a slight offset reads as a body. */
  const upper = new THREE.Group();
  figure.children.slice().forEach(function (m) { if (m.position.y > 5.7) upper.add(m); });
  upper.rotation.z = -0.035;
  figure.add(upper);

  figure.position.x = 0.02;
  scene.add(figure);

  /* ---------------- Plinth ---------------- */

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(2.7, 2.82, 0.18, 72),
    new THREE.MeshStandardMaterial({ color: 0x0b0b0e, roughness: 0.42, metalness: 0.4 })
  );
  plinth.position.y = 0.09;
  plinth.receiveShadow = true;
  scene.add(plinth);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.7, 0.011, 8, 140),
    new THREE.MeshBasicMaterial({ color: 0x5a5a64 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.185;
  scene.add(ring);

  const shadowTex = (function () {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const rad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    rad.addColorStop(0, "rgba(0,0,0,0.78)");
    rad.addColorStop(0.55, "rgba(0,0,0,0.30)");
    rad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rad;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 4.6),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.19;
  scene.add(blob);

  fallback.hidden = true;
  resize();

  /* ---------------- Interaction ---------------- */

  let rotY = 0, rotX = 0, targetY = 0, targetX = 0, vel = 0;
  let dragging = false, lastX = 0, lastY = 0, idleTimer = 0;

  const el = renderer.domElement;
  el.style.cursor = "grab";
  el.style.touchAction = "pan-y";

  el.addEventListener("pointerdown", function (e) {
    dragging = true; lastX = e.clientX; lastY = e.clientY; vel = 0;
    el.style.cursor = "grabbing";
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });

  el.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    targetY += dx * 0.011;
    targetX = THREE.MathUtils.clamp(targetX + dy * 0.004, -0.26, 0.26);
    vel = dx * 0.011;
    idleTimer = 0;
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    el.style.cursor = "grab";
    if (e && e.pointerId !== undefined) {
      try { el.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
  }
  el.addEventListener("pointerup", endDrag);
  el.addEventListener("pointercancel", endDrag);
  el.addEventListener("pointerleave", endDrag);

  /* ---------------- Loop ---------------- */

  const clock = new THREE.Clock();

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!running || !visible) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    idleTimer += dt;

    if (dragging) {
      rotY += (targetY - rotY) * 0.25;
    } else {
      targetY += vel;
      vel *= 0.94;
      rotY += (targetY - rotY) * 0.16;
      if (!reduce && idleTimer > 1.8) targetY += 0.0026;
    }

    targetX += (0 - targetX) * 0.04;
    rotY += (targetY - rotY) * 0.35;
    rotX += (targetX - rotX) * 0.08;

    figure.rotation.y = rotY;
    figure.rotation.x = rotX;

    // Barely-there breathing so it is not frozen
    if (!reduce) {
      const b = Math.sin(clock.elapsedTime * 0.8) * 0.008;
      figure.position.y = b;
    }

    renderer.render(scene, camera);
  }

  /* ---------------- Resize ---------------- */

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 700 ? 20.5 : 17.6;
    camera.position.y = w < 700 ? 5.2 : 5.0;
    camera.lookAt(0, 4.9, 0);
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", resize, { passive: true });

  /* ---------------- Lifecycle ----------------
     One sync() re-checked by every signal. Browsers suspend rAF and
     IntersectionObserver in background tabs, so per-handler logic
     leaves the canvas frozen when a page is opened in a new tab. */

  let raf = 0, running = !document.hidden, visible = false;

  function startLoop() {
    if (raf) return;
    clock.getDelta();
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
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        visible = en.isIntersecting;
        sync();
      });
    }, { threshold: 0.01 }).observe(host);
  } else {
    visible = true;
    sync();
  }

  setTimeout(function () {
    if (!visible) {
      var b = host.getBoundingClientRect();
      visible = b.top < window.innerHeight && b.bottom > 0;
      sync();
    }
  }, 600);

  window.__bd3d = { scene, camera, renderer, figure, THREE };
}

/* ------------------------------------------------------------
   Optional upgrade path — a sculpted or scanned .glb.

   Drop a model next to index.html as "figure.glb" and it replaces
   the procedural figure. GLTFLoader lives in the three examples
   bundle, so it needs one more import:

     import { GLTFLoader } from
       "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

   Then, inside start(), instead of the procedural build:

     new GLTFLoader().load("figure.glb", function (gltf) {
       const m = gltf.scene;
       m.traverse(function (o) {
         if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
       });
       // scale so the model stands ~10 units tall to match the
       // plinth and the camera framing, then drop it in
       m.scale.setScalar(10 / modelHeight(m));
       figure.add(m);
       scene.add(figure);
     });

   The loader import is left out so the page ships without loading
   something it never uses.
   ------------------------------------------------------------ */

}
