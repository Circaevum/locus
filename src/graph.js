/**
 * Ground graph: nodes { id, x, z }, edges { a, b }.
 * Returns packed xyz for a THREE.LineSegments at y=0.
 */

export function tessellateGraph(nodes, edges, y = 0) {
  const byId = new Map();
  for (const n of nodes || []) byId.set(n.id, n);
  const segs = [];
  for (const e of edges || []) {
    const A = byId.get(e.a);
    const B = byId.get(e.b);
    if (!A || !B) continue;
    segs.push(A.x, y, A.z, B.x, y, B.z);
  }
  return new Float32Array(segs);
}
