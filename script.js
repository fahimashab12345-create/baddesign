/* ============================================================
   script.js — page behaviour.
   Mission clock, scroll reveal, and the custom cursor ring.
   The nebula and the particle web live in space.js / motes.js.
   ============================================================ */

(function () {
  "use strict";

  /* ---------------- Mission clock ---------------- */

  var clock = document.getElementById("clock");

  function tick() {
    if (!clock) return;
    var now = new Date();
    clock.textContent = now.toLocaleTimeString("en-GB", { hour12: false });
  }

  tick();
  setInterval(tick, 1000);

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------------- Scroll reveal ---------------- */

  var targets = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("in"); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        observer.unobserve(entry.target); // reveal once, then stop watching
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });

    targets.forEach(function (el, i) {
      // Stagger siblings so a row of cards cascades instead of popping at once.
      el.style.transitionDelay = (i % 3) * 90 + "ms";
      observer.observe(el);
    });
  }

  /* ---------------- Custom cursor ring ---------------- */

  // Desktop pointers only — it would just get in the way on touch.
  if (window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var cursor = document.getElementById("cursor");
    if (cursor) {
      var x = window.innerWidth / 2, y = window.innerHeight / 2;
      var cx = x, cy = y;
      var running = false;

      document.body.classList.add("cursor-ready");

      window.addEventListener("pointermove", function (e) {
        x = e.clientX;
        y = e.clientY;
        if (!running) { running = true; requestAnimationFrame(follow); }
        cursor.classList.add("on");
      }, { passive: true });

      document.addEventListener("pointerleave", function () {
        cursor.classList.remove("on");
      });

      // Grow the ring over anything interactive.
      var hot = "a, button, .card, .skills li";
      document.querySelectorAll(hot).forEach(function (el) {
        el.addEventListener("pointerenter", function () { cursor.classList.add("hot"); });
        el.addEventListener("pointerleave", function () { cursor.classList.remove("hot"); });
      });

      // Eased follow — the ring trails the real pointer slightly.
      function follow() {
        cx += (x - cx) * 0.18;
        cy += (y - cy) * 0.18;
        cursor.style.transform = "translate(" + cx + "px," + cy + "px)";

        if (Math.abs(x - cx) > 0.4 || Math.abs(y - cy) > 0.4) {
          requestAnimationFrame(follow);
        } else {
          running = false;
        }
      }
    }
  }
})();
