import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stackLayers } from "../src/stream.js";
import { tessellateWorldline } from "../src/worldline.js";
import { tessellateGraph } from "../src/graph.js";
import { TimeContext } from "../src/time.js";

describe("stackLayers", () => {
  const rows = [
    { t: 0, values: { a: 2, b: 4 } },
    { t: 1, values: { a: 0, b: 6 } },
  ];

  it("center baseline splits around zero", () => {
    const [a, b] = stackLayers(["a", "b"], rows, "center");
    assert.equal(a.bots[0], -3);
    assert.equal(a.tops[0], -1);
    assert.equal(b.bots[0], -1);
    assert.equal(b.tops[0], 3);
  });

  it("zero baseline stacks up from 0", () => {
    const [a, b] = stackLayers(["a", "b"], rows, "zero");
    assert.equal(a.bots[0], 0);
    assert.equal(a.tops[0], 2);
    assert.equal(b.bots[0], 2);
    assert.equal(b.tops[0], 6);
  });
});

describe("tessellateWorldline", () => {
  it("writes xyz from samples", () => {
    const tc = new TimeContext({ mode: "absolute", window: 10, presentHeight: 10 });
    const xyz = tessellateWorldline(
      [
        { t: 0, x: 1, z: 2 },
        { t: 10, x: 3, z: 4 },
      ],
      tc,
    );
    assert.deepEqual([...xyz], [1, 0, 2, 3, 10, 4]);
  });
});

describe("tessellateGraph", () => {
  it("skips missing nodes", () => {
    const xyz = tessellateGraph(
      [
        { id: "p", x: 0, z: 0 },
        { id: "q", x: 2, z: 0 },
      ],
      [
        { a: "p", b: "q" },
        { a: "p", b: "nope" },
      ],
    );
    assert.deepEqual([...xyz], [0, 0, 0, 2, 0, 0]);
  });
});
