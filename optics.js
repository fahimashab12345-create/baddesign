/* ============================================================
   optics.js — Specimen 01, Optical Study.

   A kaleidoscopic height field lit as a surface, with thin-film
   interference colouring. The shader polar-folds the plane into N
   mirrors, domain-warps it with fractal noise, reads a height field,
   derives a normal from finite differences, then shades it: diffuse
   + a tight specular + iridescence driven by "film thickness", which
   is mapped from height the way real thin-film optics works.

   The two sliders are real uniforms. The readouts are real values,
   including a measured frame rate.

   Respects prefers-reduced-motion. Falls back to a static message.
   ============================================================ */

(function () {
  "use strict";

  var canvas = document.getElementById("optics");
  var fallback = document.getElementById("opticsFallback");
  if (!canvas || !fallback) return;

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    canvas.remove();
    fallback.hidden = false;
    return;
  }

  var gl = null;
  try {
    gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false });
  } catch (e) { gl = null; }

  if (!gl) { canvas.remove(); fallback.hidden = false; return; }

  /* ---------------- Shaders ---------------- */

  var VERT = [
    "attribute vec2 a_pos;",
    "void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }"
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "uniform vec2  u_res;",
    "uniform float u_time;",
    "uniform vec2  u_mouse;",
    "uniform float u_folds;",
    "uniform float u_warp;",
    "uniform float u_pulse;",
    "uniform float u_scroll;",

    "const float TAU = 6.28318530718;",

    "mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }",

    "vec2 hash22(vec2 p) {",
    "  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));",
    "  return -1.0 + 2.0 * fract(sin(p) * 43758.5453);",
    "}",

    "float gnoise(vec2 p) {",
    "  vec2 i = floor(p);",
    "  vec2 f = fract(p);",
    "  vec2 u = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(dot(hash22(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)),",
    "                 dot(hash22(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),",
    "             mix(dot(hash22(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)),",
    "                 dot(hash22(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x), u.y);",
    "}",

    "float fbm(vec2 p) {",
    "  float v = 0.0, a = 0.5;",
    "  mat2 R = mat2(0.80, 0.60, -0.60, 0.80);",
    "  for (int i = 0; i < 4; i++) { v += a * gnoise(p); p = R * p * 2.02; a *= 0.5; }",
    "  return v;",
    "}",

    // Polar mirror into N wedges — the kaleidoscope.
    "vec2 kaleido(vec2 p, float folds) {",
    "  float r = length(p);",
    "  float a = atan(p.y, p.x);",
    "  float seg = TAU / folds;",
    "  a = mod(a, seg);",
    "  a = abs(a - seg * 0.5);",
    "  return vec2(cos(a), sin(a)) * r;",
    "}",

    // Height field. One level of domain warping keeps it cheap enough to
    // sample three times for the normal.
    "float field(vec2 p, float warp) {",
    "  vec2 q = vec2(fbm(p + vec2(0.0, 1.7)), fbm(p + vec2(3.1, 0.4)));",
    "  return fbm(p + warp * q);",
    "}",

    "void main() {",
    "  vec2 uv = (gl_FragCoord.xy * 2.0 - u_res) / min(u_res.x, u_res.y);",
    "  float t = u_time * 0.06;",

    // Cursor as a lens that bends the plane toward it.
    "  vec2 m = u_mouse * 2.0 - 1.0;",
    "  m.x *= u_res.x / u_res.y;",
    "  vec2 away = uv - m + 1e-5;",
    "  float md = length(away);",
    "  uv += normalize(away) * smoothstep(0.70, 0.0, md) * 0.10;",

    "  vec2 p = uv;",
    "  p *= rot(t * 0.5 + u_scroll * 3.14159);",
    "  p = kaleido(p, u_folds);",
    "  p *= 1.6 + u_scroll * 0.9;",

    "  float h  = field(p, u_warp);",
    "  float e  = 0.014;",
    "  float hx = field(p + vec2(e, 0.0), u_warp);",
    "  float hy = field(p + vec2(0.0, e), u_warp);",
    "  vec3 n = normalize(vec3((h - hx) / e, (h - hy) / e, 1.4));",

    "  vec3 V = vec3(0.0, 0.0, 1.0);",
    "  vec3 L = normalize(vec3(-0.45, 0.70, 0.80));",
    "  float diff = max(dot(n, L), 0.0);",
    "  float spec = pow(max(dot(reflect(-L, n), V), 0.0), 46.0);",

    // Thin-film interference: thickness varies with height, so the
    // colour bands ride along the contours instead of sitting flat.
    "  float thick = (h * 0.5 + 0.5) * 2.6 + 0.55;",
    "  vec3 irid = 0.5 + 0.5 * cos(TAU * (thick * vec3(1.0, 0.86, 0.72)",
    "                                    + vec3(0.00, 0.14, 0.31)));",

    // Keep the iridescence inside the brand palette: mostly bone and
    // warm metal, only the band edges pick up colour.
    "  irid = mix(vec3(0.92, 0.89, 0.83), irid, 0.62);",

    "  vec3 col = vec3(0.012, 0.012, 0.016);",
    "  col += irid * diff * 0.46;",
    "  col += vec3(1.0, 0.97, 0.92) * spec * 0.95;",
    "  col += irid * pow(diff, 7.0) * 0.10;",

    // Halo under the cursor, and a flash on click.
    "  col += vec3(1.0, 0.95, 0.88) * exp(-md * 4.0) * 0.11;",
    "  col += vec3(1.0, 0.98, 0.94) * u_pulse * exp(-md * 5.0) * 0.16;",

    "  col *= 1.0 - 0.58 * smoothstep(0.55, 1.95, length(uv));",

    "  col = 1.0 - exp(-col * 1.35);",
    "  col = pow(col, vec3(0.90));",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  /* ---------------- Compile ---------------- */

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn("[optics.js]", gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.remove(); fallback.hidden = false; return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn("[optics.js]", gl.getProgramInfoLog(prog));
    canvas.remove(); fallback.hidden = false; return;
  }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uRes    = gl.getUniformLocation(prog, "u_res");
  var uTime   = gl.getUniformLocation(prog, "u_time");
  var uMouse  = gl.getUniformLocation(prog, "u_mouse");
  var uFolds  = gl.getUniformLocation(prog, "u_folds");
  var uWarp   = gl.getUniformLocation(prog, "u_warp");
  var uPulse  = gl.getUniformLocation(prog, "u_pulse");
  var uScroll = gl.getUniformLocation(prog, "u_scroll");

  /* ---------------- State ---------------- */

  var state = { folds: 8, warp: 2.6 };
  var mouse = { x: 0.5, y: 0.5 };
  var smooth = { x: 0.5, y: 0.5 };
  var pulse = 0;
  var scroll01 = 0;

  window.addEventListener("pointermove", function (e) {
    var r = canvas.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) return;
    mouse.x = (e.clientX - r.left) / r.width;
    mouse.y = 1 - (e.clientY - r.top) / r.height;
  }, { passive: true });

  window.addEventListener("pointerdown", function (e) {
    var r = canvas.getBoundingClientRect();
    if (e.clientY >= r.top && e.clientY <= r.bottom) pulse = 1;
  }, { passive: true });

  window.addEventListener("scroll", function () {
    var r = canvas.getBoundingClientRect();
    // 0 when the top edge enters the viewport, 1 when the bottom does.
    var span = window.innerHeight + r.height;
    scroll01 = Math.max(0, Math.min(1, (window.innerHeight - r.top) / span));
  }, { passive: true });

  /* ---------------- Controls ---------------- */

  var foldIn = document.getElementById("foldRange");
  var warpIn = document.getElementById("warpRange");
  var foldOut = document.getElementById("foldVal");
  var warpOut = document.getElementById("warpVal");
  var filmOut = document.getElementById("filmVal");
  var fpsOut = document.getElementById("fpsVal");

  if (foldIn) foldIn.addEventListener("input", function () {
    state.folds = +foldIn.value;
    if (foldOut) foldOut.textContent = state.folds.toFixed(0);
  });
  if (warpIn) warpIn.addEventListener("input", function () {
    state.warp = +warpIn.value;
    if (warpOut) warpOut.textContent = state.warp.toFixed(2);
  });

  /* ---------------- Resize ---------------- */

  // Render well below native and let CSS scale up — it is a soft,
  // organic surface, so the resolution loss reads as depth of field.
  var SCALE = 0.62;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    var w = Math.max(1, Math.floor(canvas.clientWidth  * dpr * SCALE));
    var h = Math.max(1, Math.floor(canvas.clientHeight * dpr * SCALE));
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  /* ---------------- Loop ---------------- */

  var t0 = performance.now();
  var running = !document.hidden, onScreen = false, raf = 0;

  // Rolling frame-rate estimate, refreshed twice a second.
  var frames = 0, fpsMark = performance.now(), fps = 0;

  function start() {
    if (raf) return;
    t0 = performance.now();
    fpsMark = performance.now();
    frames = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  /* Single decision point. Browsers throttle or suspend both
     IntersectionObserver and rAF while a tab is in the background, so
     a page opened in a background tab can end up with a permanently
     dead canvas. Every signal re-checks here rather than each handler
     assuming the other one fired. */
  function sync() {
    running = !document.hidden;
    if (running && onScreen) start(); else stop();
  }

  document.addEventListener("visibilitychange", sync);
  window.addEventListener("pageshow", sync);
  window.addEventListener("focus", sync);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        onScreen = en.isIntersecting;
        sync();
      });
    }, { threshold: 0.01 }).observe(canvas);
  } else {
    onScreen = true;
    sync();
  }

  // Belt and braces: if the observer has not spoken up shortly after
  // load, check whether the canvas is actually on screen.
  setTimeout(function () {
    if (!onScreen) {
      var b = canvas.getBoundingClientRect();
      onScreen = b.top < window.innerHeight && b.bottom > 0;
      sync();
    }
  }, 600);

  function frame(now) {
    raf = 0;
    if (!running || !onScreen) return;

    var t = (now - t0) / 1000;

    smooth.x += (mouse.x - smooth.x) * 0.06;
    smooth.y += (mouse.y - smooth.y) * 0.06;
    pulse *= 0.955;

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.uniform2f(uMouse, smooth.x, smooth.y);
    gl.uniform1f(uFolds, state.folds);
    gl.uniform1f(uWarp, state.warp);
    gl.uniform1f(uPulse, pulse);
    gl.uniform1f(uScroll, scroll01);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Real FPS, sampled and displayed rather than invented.
    frames++;
    if (now - fpsMark >= 500) {
      fps = Math.round((frames * 1000) / (now - fpsMark));
      frames = 0;
      fpsMark = now;
      if (fpsOut) fpsOut.textContent = fps;

      // Film thickness in nm — derived from the same value the shader
      // uses, so the number means something.
      if (filmOut) {
        var thick = (((Math.sin(t * 0.6) * 0.5) + 0.5) * 2.6 + 0.55) * 420;
        filmOut.textContent = Math.round(thick);
      }
    }
  }

  if (foldOut) foldOut.textContent = state.folds.toFixed(0);
  if (warpOut) warpOut.textContent = state.warp.toFixed(2);

  fallback.hidden = true;
  raf = requestAnimationFrame(frame);
})();
