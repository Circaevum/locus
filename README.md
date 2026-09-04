# Circaevum Locus

Place-centered village simulator. **Circaevum Locus 0.1-dev**.

Topocentric frame: **XZ = ground**, **Y = time**.

Apache-2.0. Do not copy Circaevum Orbital source into this tree (that GL is AGPL).

## Run

From this repo (`CIR/yang/locus`), not CIR root:

```bash
npm install
npm start
```

Open **http://localhost:5176** — village simulator (`village-simulator/`).

- GeoJSON: http://localhost:5176/grid.geojson
- `npm start`, `npm run dev`, and `npm run sim` are the same command. Port **5176** is pinned (`strictPort`).
- Do **not** use :5177. That was an old `serve` of a stale copy.
