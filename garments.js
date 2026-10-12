/* ============================================================
   garments.js — technical flats for the BAD DESIGN catalogue.

   Every product is drawn as a tech-pack flat: near-black fill, thin
   bone strokes, seam and ribbing detail. That is the language
   Stone Island and Nike's spec sheets use, so the catalogue reads
   as deliberate art direction rather than missing photography.

   SVGs use `fill: var(--flat-fill)` and `stroke: currentColor` so
   the whole set re-themes from CSS. To swap in real photography
   later, see the note in README.md — it is a one-line change.
   ============================================================ */

(function (root) {
  "use strict";

  /* Shared classes used by every flat.
     g-body  = garment silhouette      g-seam = seam / panel line
     g-d     = interior detail          g-hem  = ribbing
     g-hi    = highlight / specular     g-acc  = hardware, laces, eyelets */

  var OPEN = '<svg class="flat" viewBox="0 0 400 500" role="img" aria-hidden="true">';

  /* ---------------- 01 · Oversized hoodie ---------------- */

  var hoodie = OPEN +
    '<g class="flat-g">' +
      '<path class="g-body" d="M150,110 L250,110 L268,120 L276,196 L272,398 Q272,412 258,412 L142,412 Q128,412 128,398 L124,196 L132,120 Z"/>' +
      '<path class="g-body" d="M132,120 L99,133 Q89,138 91,152 L112,302 L154,308 L154,152 Z"/>' +
      '<path class="g-body" d="M268,120 L301,133 Q311,138 309,152 L288,302 L246,308 L246,152 Z"/>' +
      '<path class="g-seam" d="M150,112 C150,70 174,44 200,44 C226,44 250,70 250,112 Z"/>' +
      '<path class="g-seam" d="M168,112 C168,86 182,70 200,70 C218,70 232,86 232,112"/>' +
      '<path class="g-d" d="M152,300 L248,300 L244,358 L156,358 Z"/>' +
      '<path class="g-seam" d="M154,300 L246,300"/>' +
      '<path class="g-hem" d="M128,398 L272,398 L272,414 L128,414 Z"/>' +
      '<path class="g-hem" d="M112,296 L154,302 L154,318 L112,312 Z"/>' +
      '<path class="g-hem" d="M288,296 L246,302 L246,318 L288,312 Z"/>' +
      '<path class="g-acc" d="M186,112 L186,168"/>' +
      '<path class="g-acc" d="M214,112 L214,168"/>' +
      '<circle class="g-acc" cx="186" cy="172" r="4"/>' +
      '<circle class="g-acc" cx="214" cy="172" r="4"/>' +
      '<path class="g-hi" d="M136,130 Q130,240 134,388"/>' +
      '<path class="g-seam" d="M132,120 L268,120"/>' +
    '</g></svg>';

  /* ---------------- 02 · Cargo trouser ---------------- */

  var cargo = OPEN +
    '<g class="flat-g">' +
      '<path class="g-body" d="M128,96 L272,96 L272,124 L128,124 Z"/>' +
      '<path class="g-body" d="M128,124 L201,124 L199,424 L137,424 Z"/>' +
      '<path class="g-body" d="M201,124 L272,124 L263,424 L203,424 Z"/>' +
      '<path class="g-d" d="M136,224 L192,224 L190,300 L138,300 Z"/>' +
      '<path class="g-d" d="M208,224 L264,224 L262,300 L210,300 Z"/>' +
      '<path class="g-seam" d="M136,224 L192,224"/>' +
      '<path class="g-seam" d="M208,224 L264,224"/>' +
      '<path class="g-hem" d="M137,410 L199,410 L199,428 L137,428 Z"/>' +
      '<path class="g-hem" d="M203,410 L263,410 L263,428 L203,428 Z"/>' +
      '<path class="g-seam" d="M200,124 L200,424"/>' +
      '<path class="g-seam" d="M146,96 L146,124"/>' +
      '<path class="g-seam" d="M254,96 L254,124"/>' +
      '<path class="g-seam" d="M172,96 L172,124"/>' +
      '<path class="g-seam" d="M228,96 L228,124"/>' +
      '<path class="g-acc" d="M156,108 L244,108"/>' +
      '<path class="g-hi" d="M134,132 L134,400"/>' +
    '</g></svg>';

  /* ---------------- 03 · Track jacket ---------------- */

  var track = OPEN +
    '<g class="flat-g">' +
      '<path class="g-body" d="M152,122 L248,122 L266,132 L274,198 L270,386 Q270,400 256,400 L144,400 Q130,400 130,386 L126,198 L134,132 Z"/>' +
      '<path class="g-body" d="M134,132 L100,145 Q90,150 92,164 L112,300 L152,306 L152,164 Z"/>' +
      '<path class="g-body" d="M266,132 L300,145 Q310,150 308,164 L288,300 L248,306 L248,164 Z"/>' +
      '<path class="g-seam" d="M152,124 C158,106 178,96 200,96 C222,96 242,106 248,124 Z"/>' +
      '<path class="g-seam" d="M200,100 L200,396"/>' +
      '<path class="g-acc" d="M200,100 L200,396" stroke-dasharray="1 7"/>' +
      '<path class="g-d" d="M132,206 L196,206"/>' +
      '<path class="g-d" d="M204,206 L268,206"/>' +
      '<path class="g-hem" d="M130,386 L270,386 L270,404 L130,404 Z"/>' +
      '<path class="g-hem" d="M112,294 L152,300 L152,316 L112,310 Z"/>' +
      '<path class="g-hem" d="M288,294 L248,300 L248,316 L288,310 Z"/>' +
      '<path class="g-seam" d="M126,198 L274,198"/>' +
      '<path class="g-hi" d="M138,140 Q132,240 136,376"/>' +
    '</g></svg>';

  /* ---------------- 04 · Boxy tee ---------------- */

  var tee = OPEN +
    '<g class="flat-g">' +
      '<path class="g-body" d="M146,138 L254,138 L272,148 L280,214 L276,330 Q276,344 262,344 L138,344 Q124,344 124,330 L120,214 L128,148 Z"/>' +
      '<path class="g-body" d="M128,148 L92,160 Q82,164 84,178 L102,250 L142,254 L142,182 Z"/>' +
      '<path class="g-body" d="M272,148 L308,160 Q318,164 316,178 L298,250 L258,254 L258,182 Z"/>' +
      '<path class="g-seam" d="M146,140 C152,124 172,116 200,116 C228,116 248,124 254,140 Z"/>' +
      '<path class="g-seam" d="M166,140 C170,130 184,124 200,124 C216,124 230,130 234,140"/>' +
      '<path class="g-hem" d="M124,330 L276,330 L276,350 L124,350 Z"/>' +
      '<path class="g-seam" d="M120,214 L280,214"/>' +
      '<path class="g-hi" d="M134,156 Q128,230 132,322"/>' +
      '<path class="g-d" d="M124,258 L276,258"/>' +
    '</g></svg>';

  /* ---------------- 05 · Knit crew ---------------- */

  var knit = OPEN +
    '<g class="flat-g">' +
      '<path class="g-body" d="M150,130 L250,130 L268,140 L276,204 L272,382 Q272,396 258,396 L142,396 Q128,396 128,382 L124,204 L132,140 Z"/>' +
      '<path class="g-body" d="M132,140 L98,153 Q88,158 90,172 L110,306 L150,312 L150,174 Z"/>' +
      '<path class="g-body" d="M268,140 L302,153 Q312,158 310,172 L290,306 L250,312 L250,174 Z"/>' +
      '<path class="g-seam" d="M150,132 C156,114 176,104 200,104 C224,104 244,114 250,132 Z"/>' +
      '<path class="g-seam" d="M168,132 C172,122 184,116 200,116 C216,116 228,122 232,132"/>' +
      /* knit ribbing — horizontal courses down the body */
      '<path class="g-hem" d="M128,190 L272,190 M128,214 L272,214 M128,238 L272,238 M128,262 L272,262 M128,286 L272,286 M128,310 L272,310 M128,334 L272,334 M128,358 L272,358"/>' +
      '<path class="g-hem" d="M110,196 L150,201 M110,222 L150,227 M110,248 L150,253 M110,274 L150,279 M110,300 L150,305"/>' +
      '<path class="g-hem" d="M290,196 L250,201 M290,222 L250,227 M290,248 L250,253 M290,274 L250,279 M290,300 L250,305"/>' +
      '<path class="g-hem" d="M128,382 L272,382 L272,400 L128,400 Z"/>' +
      '<path class="g-hem" d="M110,300 L150,306 L150,324 L110,318 Z"/>' +
      '<path class="g-hem" d="M290,300 L250,306 L250,324 L290,318 Z"/>' +
      '<path class="g-seam" d="M124,204 L276,204"/>' +
    '</g></svg>';

  /* ---------------- 06 · Low-top sneaker (side profile) ---------------- */

  var shoe = '<svg class="flat" viewBox="0 0 400 300" role="img" aria-hidden="true">' +
    '<g class="flat-g">' +
      /* outsole */
      '<path class="g-body" d="M52,244 Q52,266 80,268 L324,268 Q352,266 354,246 L354,234 L52,234 Z"/>' +
      '<path class="g-seam" d="M52,244 L354,244"/>' +
      /* upper */
      '<path class="g-body" d="M74,234 L78,168 Q92,134 140,128 L246,122 Q300,126 320,158 L340,218 Q346,232 334,234 Z"/>' +
      /* heel counter */
      '<path class="g-d" d="M78,168 Q92,134 140,128 L136,234 L74,234 Z"/>' +
      /* toe cap */
      '<path class="g-seam" d="M286,132 Q312,142 322,166 L338,224 L296,224 Z"/>' +
      /* eyestay + tongue */
      '<path class="g-seam" d="M152,130 L206,128 L246,180 L168,182 Z"/>' +
      '<path class="g-seam" d="M170,182 L244,180"/>' +
      /* laces */
      '<path class="g-acc" d="M166,146 L206,152 M172,158 L212,164 M178,170 L218,176"/>' +
      '<circle class="g-acc" cx="164" cy="144" r="3"/>' +
      '<circle class="g-acc" cx="170" cy="156" r="3"/>' +
      '<circle class="g-acc" cx="176" cy="168" r="3"/>' +
      '<circle class="g-acc" cx="208" cy="150" r="3"/>' +
      '<circle class="g-acc" cx="214" cy="162" r="3"/>' +
      '<circle class="g-acc" cx="220" cy="174" r="3"/>' +
      /* side panel */
      '<path class="g-d" d="M232,190 L300,186 L312,224 L240,228 Z"/>' +
      /* heel tab */
      '<path class="g-seam" d="M80,150 L92,146 L92,168 L78,172 Z"/>' +
      /* highlights */
      '<path class="g-hi" d="M96,170 Q104,146 138,140"/>' +
      '<path class="g-hi" d="M300,150 Q316,164 326,192"/>' +
    '</g></svg>';

  /* ---------------- material macro swatch ----------------
     Woven texture built from a turbulence filter — used on the
     editorial tiles so the site has real fabric surfaces to look at. */

  var macro = '<svg class="macro-svg" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
    '<defs>' +
      '<filter id="bd-weave">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.9 0.02" numOctaves="4" seed="7" result="n"/>' +
        '<feColorMatrix in="n" type="saturate" values="0" result="g"/>' +
        '<feComponentTransfer in="g" result="c">' +
          '<feFuncA type="linear" slope="0.55"/>' +
        '</feComponentTransfer>' +
      '</filter>' +
      '<filter id="bd-weave2">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.02 0.9" numOctaves="4" seed="19" result="n"/>' +
        '<feColorMatrix in="n" type="saturate" values="0" result="g"/>' +
        '<feComponentTransfer in="g" result="c">' +
          '<feFuncA type="linear" slope="0.4"/>' +
        '</feComponentTransfer>' +
      '</filter>' +
      '<linearGradient id="bd-fall" x1="0" y1="0" x2="0.6" y2="1">' +
        '<stop offset="0%" stop-color="#3a3a40"/>' +
        '<stop offset="45%" stop-color="#131316"/>' +
        '<stop offset="100%" stop-color="#050506"/>' +
      '</linearGradient>' +
    '</defs>' +
    '<rect width="600" height="800" fill="url(#bd-fall)"/>' +
    '<rect width="600" height="800" filter="url(#bd-weave)" opacity="0.5"/>' +
    '<rect width="600" height="800" filter="url(#bd-weave2)" opacity="0.35"/>' +
    '<rect width="600" height="800" fill="url(#bd-fall)" opacity="0.35"/>' +
  '</svg>';

  root.BD_FLATS = {
    hoodie: hoodie,
    cargo:  cargo,
    track:  track,
    tee:    tee,
    knit:   knit,
    shoe:   shoe,
    macro:  macro
  };
})(window);
