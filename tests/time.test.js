import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TimeContext } from "../src/time.js";

describe("TimeContext playhead", () => {
  const tc = new TimeContext({
    mode: "playhead",
    now: 600,
    window: 120,
    presentHeight: 36,
    pastHeight: 9,
    futureHeight: 9,
    pastSpan: 480,
    futureSpan: 840,
  });

  it("now sits at y=0", () => {
    assert.equal(tc.y(600), 0);
  });

  it("window lookback fills presentHeight", () => {
    assert.equal(tc.y(480), 36);
  });

  it("day-start packs to pastTop", () => {
    assert.equal(tc.y(0), 45);
  });

  it("future hangs below", () => {
    assert.ok(Math.abs(tc.y(720) - (-(120 / 840) * 9)) < 1e-9);
  });

  it("clamps past beyond span", () => {
    assert.equal(tc.y(-1e6), tc.pastTop);
  });
});

describe("TimeContext absolute", () => {
  const tc = new TimeContext({ mode: "absolute", window: 120, presentHeight: 36 });

  it("t=0 at ground", () => {
    assert.equal(tc.y(0), 0);
  });

  it("linear stack", () => {
    assert.equal(tc.y(120), 36);
  });
});
