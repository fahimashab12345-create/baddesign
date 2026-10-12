/* ============================================================
   space.js — the trippy nebula.

   A single fullscreen fragment shader: domain-warped fractal noise
   for the nebula clouds, three parallax star layers, a gravitational
   lens around your cursor, and a ripple that fires when you click.

   If WebGL is unavailable the canvas is removed and the CSS radial
   gradient in styles.css takes over, so the page still looks fine.
   ============================================================ */

(function () {
  "use strict";

  var canvas = document.getElementById("cosmos");
  if (!canvas) return;

  // Respect the OS "reduce motion" setting — CSS has already hidden the canvas.
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    canvas.remove();
    return;
  }

  var gl = null;
  try {
    gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false })
      || canvas.getContext("experimental-webgl");
  } catch (e) { /* fall through to the fallback below */ }

  if (!gl) { canvas.remove(); return; }

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
    "uniform float u_pulse;",
    "uniform float u_speed;",

    // Random 2D vector in [-1,1] from a cell coordinate.
    "vec2 hash22(vec2 p) {",
    "  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));",
    "  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);",
    "}",

    // Gradient noise (Perlin-ish).
    "float gnoise(vec2 p) {",
    "  vec2 i = floor(p);",
    "  vec2 f = fract(p);",
    "  vec2 u = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(dot(hash22(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),",
    "                 dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),",
    "             mix(dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),",
    "                 dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);",
    "}",

    // 3 octaves — cheap, used for the warp layers.
    "float fbmCheap(vec2 p) {",
    "  mat2 R = mat2(0.80, 0.60, -0.60, 0.80);",
    "  float v = 0.0, a = 0.52;",
    "  for (int i = 0; i < 3; i++) { v += a * gnoise(p); p = R * p * 2.03; a *= 0.5; }",
    "  return v;",
    "}",

    // 5 octaves — the actual nebula detail.
    "float fbm(vec2 p) {",
    "  mat2 R = mat2(0.80, 0.60, -0.60, 0.80);",
    "  float v = 0.0, a = 0.52;",
    "  for (int i = 0; i < 5; i++) { v += a * gnoise(p); p = R * p * 2.03; a *= 0.5; }",
    "  return v;",
    "}",

    // One layer of twinkling stars on a jittered grid.
    "float stars(vec2 p, float scale, float seed) {",
    "  vec2 g = p * scale;",
    "  vec2 id = floor(g);",
    "  vec2 fp = fract(g) - 0.5;",
    "  vec2 rnd = hash22(id + seed);",
    "  float d = length(fp - rnd * 0.55);",
    "  float dot_ = smoothstep(0.055, 0.0, d);",
    "  float tw = 0.45 + 0.55 * sin(u_time * (1.1 + rnd.y * 2.2) + rnd.x * 44.0);",
    "  return dot_ * max(tw, 0.0);",
    "}",

    // Cosine palette — the psychedelic part.
    "vec3 trippy(float t) {",
    "  return 0.5 + 0.5 * cos(6.28318 * (vec3(1.0, 1.0, 1.0) * t + vec3(0.00, 0.33, 0.67)));",
    "}",

    "void main() {",
    "  vec2 p = (gl_FragCoord.xy * 2.0 - u_res) / min(u_res.x, u_res.y);",
    "  float t = u_time * 0.055;",

    // Cursor, in the same coordinate space.
    "  vec2 m = u_mouse * 2.0 - 1.0;",
    "  m.x *= u_res.x / u_res.y;",
    "  float md = length(p - m);",

    // Gravitational lens: bend space around the cursor.
    "  vec2 away = p - m + 1e-5;",
    "  float lens = smoothstep(0.62, 0.0, md) * 0.16;",
    "  p -= normalize(away) * lens;",

    // Expanding ripple after a click.
    "  if (u_pulse > 0.001) {",
    "    p += normalize(away) * (sin(md * 22.0 - u_pulse * 9.0) * exp(-md * 3.0) * u_pulse * 0.35);",
    "  }",

    // Domain warping: feed noise into itself for the swirling clouds.
    "  vec2 q = vec2(fbmCheap(p + vec2(0.0, t)),",
    "                fbmCheap(p + vec2(5.2, 1.3) - t * 0.8));",
    "  vec2 r = vec2(fbmCheap(p + 3.4 * q + vec2(1.7, 9.2) + t * 0.35),",
    "                fbmCheap(p + 3.4 * q + vec2(8.3, 2.8) - t * 0.28));",
    "  float f = fbm(p + 3.2 * r);",

    // Colour the clouds from the noise, hue drifting over time.
    "  vec3 col = trippy(f * 0.55 + t * 0.5 + 0.15);",
    "  col *= 0.26 + 0.72 * smoothstep(-0.35, 0.65, f);",
    "  col += vec3(0.012, 0.008, 0.030);",

    // Halo around the cursor.
    "  col += trippy(0.6) * exp(-md * 3.4) * 0.10;",

    // Stars, three depths. Scrolling speeds them up.
    "  float s = u_speed;",
    "  col += vec3(0.85, 0.92, 1.00) * stars(p + vec2(0.0, t * 0.9 * s),  26.0,  0.0) * 0.55;",
    "  col += vec3(1.00, 0.95, 0.85) * stars(p + vec2(3.7, -t * 1.7 * s), 52.0, 17.0) * 0.30;",
    "  col += vec3(0.75, 0.85, 1.00) * stars(p + vec2(9.1, t * 3.0 * s),  104.0, 41.0) * 0.16;",

    // Vignette keeps the edges dark so panels read cleanly.
    "  col *= 0.30 + 0.70 * smoothstep(1.60, 0.25, length(p));",

    // Click flash.
    "  col += vec3(0.6, 0.8, 1.0) * u_pulse * 0.12;",

    // Tone map + gamma so the highlights don't clip to flat white.
    "  col = 1.0 - exp(-col * 1.25);",
    "  col = pow(col, vec3(0.85));",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  /* ---------------- Compile ---------------- */

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn("[space.js] shader error:", gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.remove(); return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn("[space.js] link error:", gl.getProgramInfoLog(prog));
    canvas.remove();
    return;
  }
  gl.useProgram(prog);

  // Fullscreen triangle-pair
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uRes   = gl.getUniformLocation(prog, "u_res");
  var uTime  = gl.getUniformLocation(prog, "u_time");
  var uMouse = gl.getUniformLocation(prog, "u_mouse");
  var uPulse = gl.getUniformLocation(prog, "u_pulse");
  var uSpeed = gl.getUniformLocation(prog, "u_speed");

  /* ---------------- Input state ---------------- */

  var mouse = { x: 0.5, y: 0.5 };   // target, 0..1
  var smooth = { x: 0.5, y: 0.5 };  // eased toward target
  var pulse = 0;
  var speed = 1;
  var scrollVel = 0;

  window.addEventListener("pointermove", function (e) {
    mouse.x = e.clientX / window.innerWidth;
    mouse.y = 1 - e.clientY / window.innerHeight; // GL origin is bottom-left
  }, { passive: true });

  window.addEventListener("pointerdown", function () { pulse = 1; }, { passive: true });

  var lastScroll = window.scrollY;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    scrollVel = Math.min(Math.abs(y - lastScroll) / 45, 4);
    lastScroll = y;
  }, { passive: true });

  /* ---------------- Resize ---------------- */

  // Render below native resolution and let CSS scale up: the nebula is soft
  // anyway, and it keeps the fill rate sane on laptops and phones.
  var RENDER_SCALE = 0.7;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.floor(window.innerWidth  * dpr * RENDER_SCALE));
    var h = Math.max(1, Math.floor(window.innerHeight * dpr * RENDER_SCALE));
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  /* ---------------- Loop ---------------- */

  var t0 = performance.now();
  var running = true;

  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
    if (running) { t0 = performance.now(); requestAnimationFrame(frame); }
  });

  function frame(now) {
    if (!running) return;

    var t = (now - t0) / 1000;

    smooth.x += (mouse.x - smooth.x) * 0.055;
    smooth.y += (mouse.y - smooth.y) * 0.055;

    pulse *= 0.965;
    scrollVel *= 0.94;
    speed = 1 + scrollVel;

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.uniform2f(uMouse, smooth.x, smooth.y);
    gl.uniform1f(uPulse, pulse);
    gl.uniform1f(uSpeed, speed);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
