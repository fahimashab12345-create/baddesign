/* ============================================================
   atmos.js — atmosphere.

   Film grain plus a slow specular sweep, drawn on one fixed canvas
   behind everything. The grain texture is generated once into a
   small offscreen buffer and then jittered each frame, which is
   far cheaper than regenerating noise per pixel.

   Respects prefers-reduced-motion: it just paints a static grain.
   ============================================================ */

(function () {
  "use strict";

  var canvas = document.getElementById("grain");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  if (!ctx) { canvas.remove(); return; }

  var reduce = window.matchMedia &&
               window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 0, H = 0, dpr = 1;
  var TILE = 220;
  var buffer = document.createElement("canvas");
  var bctx = buffer.getContext("2d");

  /* Build one tile of monochrome noise once. */
  function buildTile() {
    buffer.width = TILE;
    buffer.height = TILE;
    var img = bctx.createImageData(TILE, TILE);
    var d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var v = 128 + (Math.random() - 0.5) * 255;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    bctx.putImageData(img, 0, 0);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();
  buildTile();

  var pat = ctx.createPattern(buffer, "repeat");
  var running = true;

  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
    if (running) requestAnimationFrame(frame);
  });

  function frame(now) {
    if (!running) return;

    var t = now / 1000;

    /* ---- grain: tile the buffer at a jittered offset ---- */
    ctx.save();
    ctx.globalAlpha = reduce ? 0.045 : 0.035;
    ctx.globalCompositeOperation = "overlay";
    ctx.translate(-Math.random() * TILE, -Math.random() * TILE);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W + TILE * 2, H + TILE * 2);
    ctx.restore();

    /* ---- slow specular sweep across the page ---- */
    if (!reduce) {
      var x = W * (0.5 + Math.sin(t * 0.085) * 0.6);
      var y = H * (0.25 + Math.cos(t * 0.06) * 0.35);
      var r = Math.max(W, H) * 0.75;

      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(214, 206, 190, 0.05)");
      g.addColorStop(0.5, "rgba(150, 150, 170, 0.018)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
