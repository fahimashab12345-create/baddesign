/* ============================================================
   lookbook3d.js — the rotating figure.

   A stylised, faceless mannequin wearing the Drop 004 silhouette,
   built from geometry and lit like a studio fashion shot. Drag to
   spin it 360 degrees; it resumes a slow turn when you let go.

   The figure is deliberately sculptural rather than realistic — a
   photoreal human needs a real model built in Blender, not maths.
   To swap in a proper .glb asset, see loadExternalModel() below.

   Degrades to a flat message if the module or WebGL cannot load.
   ============================================================ */

import * as THREE from "three";

/* ---------------- Setup ---------------- */

const host = document.getElementById("stage");
const fallback = document.getElementById("stageFallback");

if (!host) { /* nothing on this page */ }
else if (!fallback) { /* nothing to do */ }
else {

const reduce = window.matchMedia &&
               window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer, scene, camera, figure, raf = 0, visible = true;

try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch (e) {
  renderer = null;
}

if (!renderer) {
  fallback.hidden = false;
} else {
  try { start(); } catch (e) { console.warn("[lookbook3d]", e); fallback.hidden = false; }
}

function start() {

  /* ---- Canvas ---- */
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  /* ---- Scene ---- */
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  // The figure stands ~9.6 units tall. At 34° fov this distance frames the
  // whole figure plus the plinth with a little air, nothing cropped.
  camera.position.set(0, 5.0, 17.6);
  camera.lookAt(0, 4.9, 0);

  /* ---- Lighting: key, rim, fill ----
     The rim is what makes it read as a fashion photograph — a hard
     light behind the subject drawing a bright edge down the silhouette. */

  const key = new THREE.DirectionalLight(0xf3ece0, 2.8);
  key.position.set(4.5, 9, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 12;
  key.shadow.camera.bottom = -2;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xd8e4ff, 3.4);
  rim.position.set(-6, 6, -7);
  scene.add(rim);

  const rim2 = new THREE.DirectionalLight(0xd6cebe, 1.5);
  rim2.position.set(7, 4, -5);
  scene.add(rim2);

  scene.add(new THREE.HemisphereLight(0x3a3a4a, 0x08080a, 0.85));

  /* ---- Materials ----
     Near-black, but light enough that the seam lines and sleeve weight
     actually read on screen. Pure #000 silhouettes disappear. */

  const cloth = new THREE.MeshStandardMaterial({
    color: 0x26262e, roughness: 0.93, metalness: 0.0
  });
  const clothDeep = new THREE.MeshStandardMaterial({
    color: 0x17171d, roughness: 0.97, metalness: 0.0
  });
  const skin = new THREE.MeshStandardMaterial({
    color: 0x3d3d46, roughness: 0.72, metalness: 0.05
  });
  const trim = new THREE.MeshStandardMaterial({
    color: 0xb5b0a6, roughness: 0.55, metalness: 0.3
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0x2c2c34, roughness: 0.72, metalness: 0.12
  });

  /* ---- Geometry helpers ---- */

  function tube(rTop, rBot, h, y, z, mat, seg) {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, seg || 28, 1, false);
    const m = new THREE.Mesh(g, mat || cloth);
    m.position.set(0, y, z || 0);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function ball(r, y, x, z, mat, detail) {
    const g = new THREE.SphereGeometry(r, detail || 32, detail || 24);
    const m = new THREE.Mesh(g, mat || skin);
    m.position.set(x || 0, y, z || 0);
    m.castShadow = true;
    return m;
  }

  /* ---- The figure ----
     Units: roughly 10 tall. Proportions are feminine-magazine —
     narrower shoulders, longer leg, deliberately faceless. */

  figure = new THREE.Group();

  // Hoodie body — flares out past the shoulders, which is the whole point
  const torso = tube(1.05, 1.15, 2.9, 6.85, 0, cloth, 32);
  torso.scale.z = 0.72;              // flatten front-to-back
  figure.add(torso);

  // Shoulder yoke gives the dropped-shoulder line
  const yoke = tube(1.12, 1.06, 0.5, 8.15, 0, cloth, 32);
  yoke.scale.z = 0.7;
  figure.add(yoke);

  // Hood, bunched behind the neck — raised and enlarged so it reads as a
  // hood from the side and back, not a lump behind the shoulders.
  const hood = ball(0.66, 8.62, 0, -0.40, clothDeep, 24);
  hood.scale.set(1.32, 0.72, 0.82);
  figure.add(hood);

  // Neck + head (faceless). Proportions kept close to a real head so it
  // does not read as an egg.
  figure.add(tube(0.19, 0.21, 0.4, 8.5, 0, skin));
  const head = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.50, 2),
    skin
  );
  head.position.set(0, 9.2, 0.03);
  head.scale.set(0.88, 1.05, 0.90);
  head.castShadow = true;
  figure.add(head);

  // Sleeves — wide and heavy, the Rick Owens silhouette. Brought in close
  // to the body and angled slightly forward so the figure is not stiff.
  [-1, 1].forEach((s) => {
    const arm = tube(0.40, 0.50, 3.0, 6.55, 0, cloth, 24);
    arm.position.set(s * 1.20, 6.55, 0.05);
    arm.rotation.z = s * 0.09;
    arm.rotation.x = -0.06;
    arm.scale.z = 0.85;
    figure.add(arm);

    // Cuff. No hands — a faceless mannequin reads far cleaner without them.
    const cuff = tube(0.46, 0.42, 0.3, 5.05, 0, clothDeep, 24);
    cuff.position.set(s * 1.33, 5.05, 0.05);
    cuff.rotation.z = s * 0.09;
    cuff.scale.z = 0.85;
    figure.add(cuff);
  });

  // Kangaroo pocket
  const pocket = tube(0.78, 0.84, 0.78, 5.75, 0.30, clothDeep, 24);
  pocket.scale.z = 0.42;
  figure.add(pocket);

  // Hoodie hem — flares wider than the body
  const hem = tube(1.16, 1.12, 0.42, 5.5, 0, clothDeep, 32);
  hem.scale.z = 0.72;
  figure.add(hem);

  // Cargo trousers — wide, straight, with a stacked break at the ankle
  const hips = tube(1.02, 1.10, 1.1, 5.0, 0, cloth, 28);
  hips.scale.z = 0.76;
  figure.add(hips);

  [-1, 1].forEach((s) => {
    // Radius and offset are tuned so a visible gap keeps the two legs
    // reading as two legs instead of merging into one slab.
    const leg = tube(0.50, 0.60, 3.9, 2.85, 0, cloth, 26);
    leg.position.set(s * 0.58, 2.85, 0);
    leg.scale.z = 0.86;
    figure.add(leg);

    // Cargo pocket on the outer thigh
    const cp = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.62, 0.48),
      clothDeep
    );
    cp.position.set(s * 1.00, 3.5, 0);
    cp.castShadow = true;
    figure.add(cp);

    // Stacked hem
    const cuffLeg = tube(0.50, 0.47, 0.34, 0.98, 0, clothDeep, 26);
    cuffLeg.position.set(s * 0.58, 0.98, 0);
    cuffLeg.scale.z = 0.86;
    figure.add(cuffLeg);

    // Boot — kept dark on purpose. A light sole drew the eye straight off
    // the clothing, which is the opposite of what the shot wants.
    const boot = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.32, 0.92),
      shoeMat
    );
    boot.position.set(s * 0.58, 0.33, 0.12);
    boot.castShadow = true;
    figure.add(boot);
  });

  // Drawcords
  [-1, 1].forEach((s) => {
    const cord = tube(0.025, 0.025, 0.85, 8.15, 0.42, trim, 8);
    cord.position.x = s * 0.2;
    figure.add(cord);
  });

  scene.add(figure);

  /* ---- Platform + contact shadow ---- */

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(2.9, 3.0, 0.16, 64),
    new THREE.MeshStandardMaterial({ color: 0x0b0b0e, roughness: 0.55, metalness: 0.35 })
  );
  plinth.position.y = 0.08;
  plinth.receiveShadow = true;
  scene.add(plinth);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.9, 0.012, 8, 128),
    new THREE.MeshBasicMaterial({ color: 0x6b6b74 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.17;
  scene.add(ring);

  // Fake contact shadow so the figure is anchored to the plinth
  const shadowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const rad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    rad.addColorStop(0, "rgba(0,0,0,0.72)");
    rad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rad;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 4.4),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.17;
  scene.add(blob);

  fallback.hidden = true;
  resize();

  /* ---- Interaction: drag to spin, inertia, auto-resume ---- */

  let rotY = 0, rotX = 0;
  let targetY = 0, targetX = 0;
  let vel = 0;
  let dragging = false, lastX = 0, lastY = 0;
  let idleTimer = 0;

  const el = renderer.domElement;
  el.style.cursor = "grab";
  el.style.touchAction = "pan-y";

  el.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    vel = 0;
    el.style.cursor = "grabbing";
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;

    targetY += dx * 0.011;
    targetX = THREE.MathUtils.clamp(targetX + dy * 0.004, -0.28, 0.28);
    vel = dx * 0.011;
    idleTimer = 0;
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    el.style.cursor = "grab";
    if (e && e.pointerId !== undefined) {
      try { el.releasePointerCapture(e.pointerId); } catch (err) { /* already gone */ }
    }
  }
  el.addEventListener("pointerup", endDrag);
  el.addEventListener("pointercancel", endDrag);
  el.addEventListener("pointerleave", endDrag);

  /* ---- Loop ---- */

  const clock = new THREE.Clock();

  function frame() {
    raf = requestAnimationFrame(frame);

    const dt = Math.min(clock.getDelta(), 0.05);
    idleTimer += dt;

    // Spin, with inertia carrying on after release
    if (dragging) {
      rotY += (targetY - rotY) * 0.25;
    } else {
      targetY += vel;
      vel *= 0.94;
      rotY += (targetY - rotY) * 0.16;

      // Ease back into a slow turn once they have stopped
      if (!reduce && idleTimer > 1.8) {
        targetY += 0.0026;
      }
    }

    // Ease the tilt back to level
    targetX += (0 - targetX) * 0.04;
    rotY += (targetY - rotY) * 0.35;
    rotX += (targetX - rotX) * 0.08;

    figure.rotation.y = rotY;
    figure.rotation.x = rotX;

    // Very slight idle breathing so it does not feel frozen
    if (!reduce) {
      const b = Math.sin(clock.elapsedTime * 0.9) * 0.012;
      figure.position.y = b;
      figure.scale.set(1, 1 + b * 0.35, 1);
    }

    renderer.render(scene, camera);
  }

  /* ---- Resize ---- */

  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;

    // Pull the camera back on narrow screens so the figure always fits
    camera.position.z = w < 700 ? 21 : 17.6;
    camera.position.y = w < 700 ? 5.2 : 5.0;
    camera.lookAt(0, 4.9, 0);
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", resize, { passive: true });

  /* ---- Only animate while it is on screen ---- */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting && !visible) {
          visible = true;
          clock.getDelta();
          raf = requestAnimationFrame(frame);
        } else if (!en.isIntersecting && visible) {
          visible = false;
          cancelAnimationFrame(raf);
        }
      });
    }, { threshold: 0.05 }).observe(host);
  }

  raf = requestAnimationFrame(frame);

  /* Expose for the optional real-model path below. */
  window.__bd3d = { scene, camera, renderer, figure, THREE };
}

/* ------------------------------------------------------------
   Optional upgrade path — a real sculpted or scanned .glb.

   Drop a model next to index.html as "figure.glb" and it replaces
   the procedural figure. GLTFLoader lives in the three examples
   bundle, so it needs one more import:

     import { GLTFLoader } from
       "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

   Then, inside start(), instead of building the primitives:

     new GLTFLoader().load("figure.glb", (gltf) => {
       figure.clear();
       const m = gltf.scene;
       m.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
       figure.add(m);
       scene.add(figure);
     });

   Scale the loaded model so it stands ~10 units tall to match the
   plinth and the camera framing. This path is left commented out so
   the page ships without loading an unused loader.
   ------------------------------------------------------------ */

}
