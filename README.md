# Circaevum Locus

Place-centered worldline graphics library. **Circaevum Locus 0.1-dev**.

Sister of Circaevum Orbital / Circadian. This frame is topocentric: **XZ = ground**, **Y = time**. One origin. Many loci in a scene.

Apache-2.0. No account. No IEEE. No kWh. Apps (e.g. smart village simulator) sit on top.

## Frame

- `TimeContext` maps a timestamp to world Y. Default **playhead** mode: now at y=0, past stacks up, future hangs down. `absolute` mode stacks from t=0.
- **Worldline** = samples `{ t, x, z }` tessellated through that map.
- **Graph** = ground nodes/edges at y=0.
- **Stream** = generic stacked series (`stackLayers`). Tessellator only — semantics belong in the app.

Do not copy Circaevum Orbital source into this tree (that GL is AGPL).

## Run

```bash
npm install
npm test
npm run dev
```

Open http://localhost:5176 — plaza walk, time slider.

## API

```js
import { LocusGL } from "@circaevum/locus";

const gl = new LocusGL("#stage");
gl.setTime({ now: 600, window: 120 });
gl.addLayer("walk", { color: 0x3d8bfd });
gl.setWorldlines("walk", [{ id: "a", samples: [{ t: 0, x: 0, z: 0 }] }]);
gl.setGraph("paths", { nodes: [{ id: "a", x: 0, z: 0 }], edges: [] });
```

Watermark: `Circaevum Locus 0.1-dev` until a hashed `locus-0.1` tag exists.
