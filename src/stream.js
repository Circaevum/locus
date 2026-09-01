/**
 * Generic stacked series. No units assumed.
 *
 * rows: [{ t, values: { key: number } }]
 * baseline: "center" (ThemeRiver) | "zero"
 */

export function stackLayers(keys, rows, baseline = "center") {
  const layers = (keys || []).map((key) => ({
    key,
    t: [],
    bots: [],
    tops: [],
  }));
  for (const row of rows || []) {
    const values = row.values || {};
    let total = 0;
    for (const k of keys) total += Number(values[k]) || 0;
    let run = baseline === "zero" ? 0 : -total / 2;
    for (const layer of layers) {
      const v = Number(values[layer.key]) || 0;
      layer.t.push(row.t);
      layer.bots.push(run);
      run += v;
      layer.tops.push(run);
    }
  }
  return layers;
}
