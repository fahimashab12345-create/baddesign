# baddesign

A single-page portfolio: a WebGL nebula, a particle constellation, and
plain HTML/CSS/JS on top. No build step, no framework, no dependencies.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole page. All content and copy live here. |
| `styles.css` | All styling — palette, panels, glitch, responsive. |
| `space.js` | The nebula. A fullscreen WebGL fragment shader. |
| `motes.js` | The foreground particle web that reacts to your cursor. |
| `script.js` | Mission clock, scroll reveal, custom cursor ring. |
| `favicon.svg` | The tab icon. |

## How it works

`space.js` draws a fullscreen triangle and runs one fragment shader per pixel:
domain-warped fractal noise for the nebula clouds, three parallax star layers
on jittered grids, a gravitational lens around the cursor, and a ripple that
fires on click. The colour comes from a cosine palette whose hue drifts over
time, which is why the sky cycles through purple, teal and gold.

It renders at 70% of native resolution and lets CSS scale it up — the nebula is
soft anyway and it keeps the fill rate sane. If WebGL is missing the canvas
removes itself and a CSS gradient takes over.

`prefers-reduced-motion` is respected: both canvases are removed, the glitch and
ticker animations stop, and the page falls back to a static gradient.

## Things to change

Open `index.html`. At the top there's a comment block listing the edits.

**Still placeholders — fill these in:**

- `[YOUR CITY]` — the hero status line
- `YOURGITHUB` — the GitHub link
- `you@example.com` — the email link

Also, the project cards point at `href="#"` (they currently jump to the top).
Replace those with real URLs, or delete the `<a class="card-link">` line.

## Deploying an update

```bash
git add .
git commit -m "update site"
git push
```

The GitHub push triggers a rebuild on SnapDeploy. Changes are live in about
two minutes.

## Previewing before you push

```bash
python -m http.server 8080
```

Then open <http://localhost:8080>. Opening `index.html` directly also works.
