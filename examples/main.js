import { LocusGL } from "../src/index.js";

const DAY = 24 * 60;
const N = 8;
const STEP = 5;

function plaza() {
  const lines = [];
  const nodes = [];
  const edges = [];
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2;
    const r = 12 + (i % 3) * 3;
    const samples = [];
    for (let t = 0; t <= DAY; t += STEP) {
      const spin = a0 + t / DAY * Math.PI * 0.35;
      samples.push({
        t,
        x: Math.cos(spin) * r,
        z: Math.sin(spin) * r,
      });
    }
    const id = `p${i}`;
    lines.push({ id, samples });
    nodes.push({ id, x: samples[0].x, z: samples[0].z });
    if (i) edges.push({ a: `p${i - 1}`, b: id });
  }
  edges.push({ a: `p${N - 1}`, b: "p0" });
  return { lines, nodes, edges };
}

const { lines, nodes, edges } = plaza();
const gl = new LocusGL("#stage", {
  time: { now: 600, window: 120, pastSpan: 480, futureSpan: 840 },
});
gl.addLayer("walk", { color: 0x3d8bfd });
gl.addLayer("ring", { color: 0x5ee0a0 });
gl.setWorldlines("walk", lines);
gl.setGraph("ring", { nodes, edges });
gl.fit();

const slider = document.getElementById("now");
const playBtn = document.getElementById("play");
slider.addEventListener("input", () => {
  gl.play(false);
  playBtn.textContent = "play";
  gl.setTime({ now: Number(slider.value) });
});
playBtn.addEventListener("click", () => {
  const on = playBtn.textContent === "play";
  gl.play(on);
  playBtn.textContent = on ? "pause" : "play";
});

setInterval(() => {
  slider.value = String(Math.max(0, Math.min(DAY, gl.time.now % (DAY + 1))));
}, 200);
