/* ============================================================
   motes.js — foreground constellation.

   A drifting particle web that pushes away from your cursor and
   links up with its neighbours. Sits above the nebula, below the
   page content. Pure 2D canvas, no dependencies.
   ============================================================ */

(function () {
  "use strict";

  var canvas = document.getElementById("motes");
  if (!canvas) return;

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    canvas.remove();
    return;
  }

  var ctx = canvas.getContext("2d");
  if (!ctx) { canvas.remove(); return; }

  var W = 0, H = 0, dpr = 1;
  var parts = [];
  var running = true;

  var pointer = { x: -9999, y: -9999, active: false };
  var PUSH = 175;      // cursor influence radius, px
  var LINK = 132;      // distance at which particles link, px
  var TINT = { h: 160, s: 90, l: 62 };  // cyan -> violet -> magenta

  function makePart(w, h) {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: 0.7 + Math.random() * 1.7,
      o: Math.random() * Math.PI * 2
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Density scales with area, but stay inside a sane budget.
    var target = Math.min(130, Math.max(45, Math.round((W * H) / 16000)));
    while (parts.length > target) parts.pop();
    while (parts.length < target) parts.push(makePart(W, H));
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  window.addEventListener("pointermove", function (e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
  }, { passive: true });

  window.addEventListener("pointerleave", function () { pointer.active = false; }, { passive: true });

  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
    if (running) requestAnimationFrame(frame);
  });

  function frame() {
    if (!running) return;

    var i, j, p, q;
    ctx.clearRect(0, 0, W, H);

    var t = performance.now() / 1000;
    var hue = (TINT.h + t * 12) % 360;

    /* ---- Update ---- */
    for (i = 0; i < parts.length; i++) {
      p = parts[i];

      p.x += p.vx;
      p.y += p.vy;

      // Cursor pushes particles outward — this is what makes the web ripple.
      if (pointer.active) {
        var dx = p.x - pointer.x;
        var dy = p.y - pointer.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < PUSH * PUSH && d2 > 0.01) {
          var d = Math.sqrt(d2);
          var f = (1 - d / PUSH) * 1.9;
          p.x += (dx / d) * f;
          p.y += (dy / d) * f;
        }
      }

      // Wrap around the edges.
      if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;
    }

    /* ---- Links between neighbours ---- */
    ctx.lineWidth = 1;
    for (i = 0; i < parts.length; i++) {
      p = parts[i];
      for (j = i + 1; j < parts.length; j++) {
        q = parts[j];
        var ax = p.x - q.x, ay = p.y - q.y;
        var dist2 = ax * ax + ay * ay;
        if (dist2 > LINK * LINK) continue;

        var alpha = (1 - Math.sqrt(dist2) / LINK) * 0.2;
        ctx.strokeStyle = "hsla(" + hue + ", " + TINT.s + "%, " + TINT.l + "%, " + alpha + ")";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }

    /* ---- Particles ---- */
    for (i = 0; i < parts.length; i++) {
      p = parts[i];

      // Twinkle
      var tw = 0.55 + 0.45 * Math.sin(t * 1.8 + p.o);

      // Brighten when the cursor is near
      var near = 0;
      if (pointer.active) {
        var cdx = p.x - pointer.x, cdy = p.y - pointer.y;
        var cd = Math.sqrt(cdx * cdx + cdy * cdy);
        if (cd < PUSH) near = 1 - cd / PUSH;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + near * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "hsla(" + hue + ", " + TINT.s + "%, " + (TINT.l + near * 25) + "%, " + (0.34 + tw * 0.3 + near * 0.3) + ")";
      ctx.fill();

      // Soft bloom on the ones nearest the cursor
      if (near > 0.35) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + 7 * near, 0, Math.PI * 2);
        ctx.fillStyle = "hsla(" + hue + ", 100%, 70%, " + (0.05 * near) + ")";
        ctx.fill();
      }
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
