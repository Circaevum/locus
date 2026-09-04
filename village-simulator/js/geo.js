/**
 * Schematic WGS84 for the village footprint.
 * Local ENU metres: +X east, −Z north (matches NORTH in layout).
 * Third GeoJSON ordinate is metres above local ground, not Locus time-Y.
 */

import {
  BOARDS,
  DTMS,
  FEEDERS,
  GRID_SEGS,
  HOUSES,
  MAIN_GEN,
  MAIN_XFMR,
  POLES,
  STATIONS,
  TRANSFORMERS,
} from "./village-worldline-layout.js";

/** Metres per degree of latitude (spherical WGS84 approx). */
export const M_PER_DEG_LAT = 111320;

/**
 * Fake origin — Null Island. Not a real settlement.
 * Pin a real lat/lon later by changing these two numbers only.
 */
export const ORIGIN = {
  lon: 0,
  lat: 0,
  alt: 0,
  name: "Null Island",
  note: "Schematic ISV village. Local metres from here; +X east, −Z north.",
};

/** Must match hang offsets in village-worldline-day.js (LINE_HANG = 1.15). */
export const HANG = {
  ground: 0,
  secondary: 1.15,
  primary: 1.23,
  trunk: 1.33,
  pole: 1.15,
  xfmr: 1.43,
  ems: 1.65,
  dtm: 1.65,
};

function mPerDegLon(lat) {
  return M_PER_DEG_LAT * Math.max(1e-9, Math.cos((lat * Math.PI) / 180));
}

/** Local ENU metres → GeoJSON position [lon, lat, alt]. */
export function enuToLonLat(x, z, h = 0, origin = ORIGIN) {
  const east = x;
  const north = -z;
  return [
    origin.lon + east / mPerDegLon(origin.lat),
    origin.lat + north / M_PER_DEG_LAT,
    (origin.alt || 0) + h,
  ];
}

function roundM(n) {
  return +Number(n).toFixed(3);
}

function roundDeg(n) {
  return +Number(n).toFixed(8);
}

/** RFC 7946 Point Feature. geometry = WGS84; properties hold local ENU + tags. */
export function geoidBlock(id, kind, x, z, hang = 0, extra = {}) {
  const [lon, lat, alt] = enuToLonLat(x, z, hang);
  return {
    type: "Feature",
    id,
    properties: {
      id,
      kind,
      hang,
      x: roundM(x),
      z: roundM(z),
      ...extra,
    },
    geometry: {
      type: "Point",
      coordinates: [roundDeg(lon), roundDeg(lat), roundM(alt)],
    },
  };
}

export function geoidCollection(features, name = "ISV village schematic") {
  return {
    type: "FeatureCollection",
    name,
    features,
  };
}

/** GeoJSON position → local ENU metres. */
export function lonLatToEnu(lon, lat, alt = 0, origin = ORIGIN) {
  const east = (lon - origin.lon) * mPerDegLon(origin.lat);
  const north = (lat - origin.lat) * M_PER_DEG_LAT;
  return { x: east, z: -north, h: alt - (origin.alt || 0) };
}

function point(id, kind, x, z, h, props = {}) {
  return geoidBlock(id, kind, x, z, h, props);
}

function line(id, kind, ax, az, bx, bz, h, props = {}) {
  return {
    type: "Feature",
    id,
    properties: {
      id,
      kind,
      hang: h,
      ax: roundM(ax),
      az: roundM(az),
      bx: roundM(bx),
      bz: roundM(bz),
      ...props,
    },
    geometry: {
      type: "LineString",
      coordinates: [enuToLonLat(ax, az, h), enuToLonLat(bx, bz, h)].map(([lon, lat, alt]) => [
        roundDeg(lon),
        roundDeg(lat),
        roundM(alt),
      ]),
    },
  };
}

export function villageGeoJSON() {
  const features = [
    point("gen", "gen", MAIN_GEN.x, MAIN_GEN.z, HANG.ground, { label: "gen + solar" }),
    point("xfmr-main", "station", MAIN_XFMR.x, MAIN_XFMR.z, HANG.xfmr, {
      label: STATIONS[0]?.label || "main LV xfmr",
    }),
  ];

  for (const h of HOUSES) {
    features.push(
      point(h.id, "house", h.x, h.z, HANG.ground, {
        name: h.name,
        cluster: h.cluster,
        feederId: h.feederId,
        boardId: h.boardId,
        xfmrId: h.xfmrId,
        phase: h.phase,
      }),
    );
  }
  for (const p of POLES) {
    features.push(
      point(`pole-${features.length}`, "pole", p.x, p.z, HANG.pole, { feederId: p.feederId }),
    );
  }
  for (const t of TRANSFORMERS) {
    features.push(
      point(t.id, "xfmr", t.x, t.z, HANG.xfmr, {
        feederId: t.feederId,
        cluster: t.cluster,
        label: t.label,
      }),
    );
  }
  for (const f of FEEDERS) {
    features.push(point(f.id, "feeder", f.x, f.z, HANG.pole, { cluster: f.cluster, label: f.label }));
  }
  for (const b of BOARDS) {
    features.push(
      point(b.id, "ems", b.x, b.z, HANG.ems, {
        feederId: b.feederId,
        xfmrId: b.xfmrId,
        houseIds: b.houseIds,
        label: b.label,
      }),
    );
  }
  for (const d of DTMS) {
    features.push(
      point(d.id, "dtm", d.x, d.z, HANG.dtm, { feederId: d.feederId, label: d.label }),
    );
  }
  GRID_SEGS.forEach((s, i) => {
    const h = HANG[s.kind] ?? HANG.secondary;
    features.push(
      line(`seg-${i}`, s.kind, s.ax, s.az, s.bx, s.bz, h, {
        feederId: s.feederId,
        xfmrId: s.xfmrId,
        houseId: s.houseId,
        capW: s.capW,
      }),
    );
  });

  return geoidCollection(features, "ISV village schematic");
}
