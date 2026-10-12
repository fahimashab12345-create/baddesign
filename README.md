# baddesign

A single-page portfolio site. Plain HTML, CSS and JavaScript — no build step,
no framework, no dependencies.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole page. All your content lives here. |
| `styles.css` | All the styling. |
| `script.js` | Scroll fade-in and the live clock. Nothing essential. |
| `favicon.svg` | The little `B` tab icon. |

## How to change things

Open `index.html` in any text editor. At the very top there's a comment block
listing every edit. The short version:

- **Your name** — search for `YOUR NAME` (4 places: nav, hero, about, footer)
- **Your city** — search for `[YOUR CITY]`
- **Projects** — the three `<article class="card">` blocks in section 02
- **Skills** — the `<li>` tags in section 03
- **Links** — the `<a>` tags in section 05

Edit, save, push to GitHub. SnapDeploy rebuilds and the change is live in about
two minutes.

## Deploying an update

```bash
git add .
git commit -m "update site"
git push
```

That's it — the GitHub push triggers a rebuild automatically.

## Previewing before you push

Double-click `index.html`, or from this folder:

```bash
python -m http.server 8080
```

Then open <http://localhost:8080>.
