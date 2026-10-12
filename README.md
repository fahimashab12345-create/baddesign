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
| `lookbook3d.js` | Three.js turntable figure. ES module. |
| `favicon.svg` | The `A` mark. |

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
