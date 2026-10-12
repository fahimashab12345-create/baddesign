/* ============================================================
   viewer.js — decides whether the turntable runs at all.

   Kept deliberately tiny and dependency-free. It checks two things,
   in order, and neither of them costs a download:

     1. Can this browser do WebGL?
     2. Does assets/3d/manifest.json name a model?

   Only if both are true does it import viewer-three.js, which is
   the first thing on the site to pull in a 3D engine. With no model
   set, three.js is never requested at all - the stage is a
   photograph and the page weighs what it weighs without it.
   ============================================================ */

const MANIFEST_URL = "assets/3d/manifest.json";

const host      = document.getElementById("stage");
const fallback  = document.getElementById("stageFallback");
const statusEl  = document.getElementById("viewerStatus");
const hintEl    = document.getElementById("dragHint");

/* The resting state: poster photograph, no canvas, no engine. */
function posterOnly(message) {
  host.classList.add("is-poster-only");
  host.classList.remove("is-live");
  if (statusEl) statusEl.textContent = message;
  if (hintEl) hintEl.remove();
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext &&
              (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch (e) {
    return false;
  }
}

if (!hasWebGL()) {
  posterOnly("3D view unavailable");
  fallback.hidden = false;
} else {
  fetch(MANIFEST_URL)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((manifest) => {
      const name = manifest && typeof manifest.model === "string"
        ? manifest.model
        : null;

      if (!name) {
        posterOnly("Product model · image coming soon");
        return null;
      }

      /* Resolve against the manifest's own folder, not the page.
         GLTFLoader resolves a bare filename against document.baseURI,
         so "product.glb" would be fetched from the site root and 404.
         An absolute URL in the manifest still works unchanged. */
      const modelUrl = new URL(name, new URL(MANIFEST_URL, location.href)).href;

      // Worth downloading a 3D engine now, and not before.
      return import("./viewer-three.js").then((mod) => mod.start(modelUrl));
    })
    .catch((e) => {
      console.warn("[viewer]", e);
      posterOnly("Model listing unavailable");
    });
}
