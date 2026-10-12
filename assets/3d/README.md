# Product model — drop zone

`viewer.js` looks for exactly one file:

```
assets/3d/product.glb
```

Drop it there. Nothing else to configure — no manifest, no registration,
no build step. The filename is a single constant at the top of `viewer.js`:

```js
const MODEL_URL = "assets/3d/product.glb";
```

## If the file is absent

This is the current, supported state. The viewer keeps the poster
photograph, the page keeps working, nothing is downloaded, and nothing
is written to the console. The status line reads
`Product model · image coming soon`.

## What the viewer expects

| Property | Needed | Why |
|---|---|---|
| Format | glTF 2.0 binary (`.glb`) | `GLTFLoader` reads it directly |
| Compression | Draco, or none | Draco decoder is wired; uncompressed works too |
| Up axis | Y-up | The viewer assumes it, then normalises anyway |
| Orientation | Front face towards +Z | Camera sits on +Z looking in |
| Triangles | 20k – 80k | Below 20k looks soft; above 80k is wasted on a phone |
| Textures | PBR, ≤ 2K, packed in the GLB | Larger textures dominate load time |
| Materials | 1–4 | One leather, one metal, done |
| File size | under 4 MB | Over that and the mobile drop-off gets bad |

You do **not** need to pre-scale it. The viewer measures the bounding
box, scales the longest axis to 2.6 units, centres it on X/Z, and drops
it onto the ground plane at Y=0. Anything you hand it will be framed.

## Lighting is procedural

`RoomEnvironment` via `PMREMGenerator` supplies the image-based
lighting. No HDR file is downloaded and there is no third-party
licence to track. A warm key from front-right and a cool rim from
behind-left are added on top. If the model reads too flat, that is a
material problem (roughness/metallic), not a missing HDRI.

## Runtime behaviours you can rely on

- Drag to rotate, with inertia. Arrow keys work if the stage has focus.
- `touch-action: pan-y` — horizontal drags turn the model, vertical
  drags still scroll the page on a phone.
- Auto-rotate resumes 2s after you stop dragging.
- `prefers-reduced-motion` disables auto-rotate entirely.
- The render loop stops when the stage scrolls out of view and when
  the tab is hidden, so it does not burn battery.

## Licence

Record the source and licence of any model you add, in this file, before
it ships. A Creative Commons licence covers copyright only — it does not
clear trademark, so a model of a recognisable branded bag is still off
limits no matter how it is licensed.
