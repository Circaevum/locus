/**
 * Samples { t, x, z } → packed xyz. x/z may drift; t maps through TimeContext.
 */

export function tessellateWorldline(samples, time) {
  const n = samples?.length || 0;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const s = samples[i];
    const o = i * 3;
    out[o] = Number(s.x) || 0;
    out[o + 1] = time.y(s.t);
    out[o + 2] = Number(s.z) || 0;
  }
  return out;
}

export function worldlineBounds(lines, time) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const line of lines) {
    for (const s of line.samples || []) {
      const x = Number(s.x) || 0;
      const z = Number(s.z) || 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
  }
  if (!Number.isFinite(minX)) {
    return { x: 0, z: 0, r: 16, y0: time.futureBottom, y1: time.pastTop };
  }
  const x = (minX + maxX) / 2;
  const z = (minZ + maxZ) / 2;
  const r = Math.max(8, Math.hypot(maxX - x, maxZ - z) + 4);
  return { x, z, r, y0: time.futureBottom, y1: time.pastTop };
}
