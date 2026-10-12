# BAD DESIGN — storefront

A concept e-commerce front end for a fictional clothing label. No build
step, no framework, no dependencies. Static HTML, CSS and JavaScript,
served straight from the repo.

> **This is a demo.** Not a real business. The checkout button does
> nothing, no orders are taken, and the newsletter form never leaves the
> browser.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole page. All structure and copy. |
| `styles.css` | Design system, layout, responsive, reduced-motion. |
| `garments.js` | Technical-flat SVGs for the catalogue, plus the woven-fabric macro. |
| `app.js` | Catalogue data, cart, filters, search, menus, countdown, size guide. |
| `atmos.js` | Film grain and a slow light sweep on a fixed canvas. |
| `optics.js` | The kaleidoscopic thin-film shader and its instrument panel. |
| `lookbook3d.js` | Three.js turntable figure. ES module. |
| `img/campaign/` | Four editorial photographs (see Images). |
| `favicon.svg` | The `A` mark. |

## Images

Two different kinds of imagery, deliberately kept apart:

**Editorial (Campaign section) — real photographs.** `img/campaign/*.jpg`,
four dark fashion images from [Unsplash](https://unsplash.com), used under
the [Unsplash License](https://unsplash.com/license) — free for commercial
use, no attribution required (credited anyway, in the page footer). Pulled
down at `w=1400 q=72` so they total ~557 KB rather than several megabytes.

**Catalogue products — technical flats, not photos.** A stock photo of a
random person in a green sweater captioned *"Gravity Oversized Hoodie,
Onyx"* would be a lie about the product. The flats are the honest option,
they match the brand's spec-sheet language, and they cost zero bytes.

To use real product shots, see "Swapping in real photography" below.

## The optical study

`optics.js` is a single fullscreen fragment shader. It polar-folds the
plane into N mirrors, domain-warps it with fractal noise, reads a height
field, derives a normal from finite differences, then shades it — diffuse,
a tight specular, and thin-film interference whose "thickness" is mapped
from height the way real optics works, so the colour bands follow the
contours.

The **Fold** and **Warp** dials are real uniforms, and the readouts are
real values — including a measured frame rate, not a decorative one.

Both this and `lookbook3d.js` gate their render loop through one `sync()`
function re-checked by `visibilitychange`, `pageshow`, `focus` and the
`IntersectionObserver`. Browsers suspend both rAF and IntersectionObserver
in background tabs, so a per-handler assumption would leave the canvas
permanently frozen when the page is opened in a background tab.

## Atmosphere, and why it sits behind the page

The film grain (`atmos.js`) and the vignette are **fixed overlays**. They are
pinned at `z-index: -2` and `-1`, not `899` and `900`.

That is deliberate. They started above the content, which meant every glyph
on the site had animated noise and a darkening gradient sprayed across it —
small type disappeared and the whole page read as muddy.

The fix is a stacking-context trick:

```css
html  { background: var(--void); }   /* the colour lives here  */
body  { background: transparent; }    /* so negatives can show */
#grain     { z-index: -1; }           /* above the bg, below content */
.vignette  { z-index: -2; }
```

Grain belongs in the scene, not on top of the type.

The custom cursor also has **no `mix-blend-mode`** — `difference` inverted
every colour it passed over, which is the same problem wearing a hat.

## Typography

| Role | Face | Why |
|---|---|---|
| Display | **Clash Display** | Hero, section headers, marquee only |
| Body / UI | **Satoshi** | Everything you actually read |
| Editorial | **Instrument Serif** italic | Pull quotes and accents |
| Technical | **JetBrains Mono** | Labels, specs, buttons |

Clash Display is deliberately **not** used for product names, cart lines
or totals. It is a wide display face with unusual letterforms and it turns
to mush below about 1.5rem. Anything that gets read uses Satoshi in
sentence case — the same reason SSENSE and Net-a-Porter do it that way.

### Legibility floor

Two rules are enforced across the stylesheet:

- **No text below `.72rem`** (11.2px). The only exception is the numeric
  badge on the cart icon.
- **Nothing darker than `--muted`**, which is `#a8a49b` — 7.8:1 against the
  void. Body weight is 400, never 300; a light weight is too thin on
  near-black.

Measured: 243 text elements, **0 WCAG AA contrast failures**. If you change
a colour, re-check it — the numbers are in the tokens as comments.

## The 3D figure

`lookbook3d.js` builds a stylised faceless mannequin wearing the Drop 004
silhouette out of primitives, lit like a studio fashion shot. Drag to spin
it; it eases back into a slow turn after you let go.

It is **deliberately sculptural, not realistic**. A believable human needs
a real model built in Blender — code cannot generate a convincing face or
hands, and a bad attempt at one lands in uncanny-valley territory.

**To swap in a real `.glb`:** drop the file next to `index.html` as
`figure.glb` and follow the commented `loadExternalModel()` notes at the
bottom of `lookbook3d.js`. Scale the model to ~10 units tall to match the
plinth and camera framing. The loader import is commented out so the page
does not ship loading something it never uses.

If WebGL is unavailable the canvas is replaced with a plain message and
everything else on the page keeps working.

## Swapping in real photography

The catalogue renders SVG flats, not photos, so it ships at zero image
weight and carries no licensing. To use real product shots, in
`app.js`'s `productCard()` replace the `.media-a` markup:

```js
'<div class="media-a"><img src="img/' + p.flat + '.jpg" alt="' + p.name + '"></div>'
```

`.media-b` is the hover state — put the second angle there. Give the
images an `aspect-ratio: 4 / 5` object-fit cover and they drop straight in.

## Mobile

Measured in real viewports by loading the page in an iframe at 390×844,
360×740 and 768×1024:

- **0px horizontal overflow** at all three widths
- **0 tap targets under 30px** — footer links, cart quantity steppers,
  remove links, size-guide link and the optics dials were all flagged in
  an earlier pass and now carry a `min-height`. The dials get a full 44px
  target and a 20px handle under `(hover: none) and (pointer: coarse)`
- Single-column product grid and lookbook below 620px
- Burger nav replaces the desktop nav below 900px

## Catalogue, product view and checkout

Sixteen pieces across five categories. Bags lead the range, which is what
the photography supports best.

**Product view** — a full-screen detail sheet, opened from any card or
search result. Gallery, size, quantity, spec table, and four accordions
(fabric, origin, care, colours). It is addressable: opening
`#product/bd-101` deep-links straight to it, and the hash updates as you
browse.

**Checkout** — four steps (Bag, Shipping, Payment, Review) with a sticky
order summary. Three delivery tiers, live recalculation of shipping and
20% tax, and per-step validation that blocks progress and says which field
is missing. Placing an order generates a reference and clears the bag.

The payment step is **explicitly labelled as a demo** and instructs the
visitor not to enter real card details. Nothing is transmitted, stored or
sent anywhere — there is no backend. A real deployment would swap that
step for Stripe Elements or similar; never a raw card form.

## Imagery

All photography is from [Unsplash](https://unsplash.com) under the
[Unsplash License](https://unsplash.com/license) — free for commercial
use. Pulled at `w=1400 q=72` so 28 images total roughly 4 MB rather than
several times that.

- `img/campaign/` — editorial and campaign photography
- `img/product/` — catalogue imagery

No brand photography is used or imitated by name. The bags follow the
quilted-flap, chain-strap language but are original designs with original
names, because copying Chanel's product shots or trademark would be
infringement.

Every product image has an SVG technical flat behind it as an `onerror`
fallback, so a missing file degrades to the flat rather than a broken
icon.

## The figure

`lookbook3d.js` builds the mannequin from `LatheGeometry` — hand-authored
profiles spun around the vertical axis — rather than stacked cylinders.
That is why it reads as a display mannequin instead of a robot: each form
is one continuous surface of revolution with continuous normals, so there
is no seam where two primitives met. Proportions are 8.5 heads, the
fashion-illustration canon, with a slight contrapposto because a
perfectly symmetric figure reads as a prop.

Cloth carries a procedurally generated woven bump map so raking light
breaks across the surface instead of sliding over it.

To use a sculpted or scanned model instead, drop a `.glb` next to
`index.html` and follow the commented notes at the bottom of the file.

## Deploying an update

```bash
git add .
git commit -m "update"
git push
```

The GitHub push triggers a rebuild on SnapDeploy; changes are live in
about two minutes.

## Previewing before you push

```bash
python -m http.server 8080
```

Then open <http://localhost:8080>. An HTTP server rather than opening the
file directly, because `lookbook3d.js` is an ES module and browsers block
module imports from `file://`.
