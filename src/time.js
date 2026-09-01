/**
 * Time → world Y.
 *
 * Units are caller-chosen and must match (minutes, ms, …).
 *
 * playhead: now at y=0, past stacks +Y, future hangs −Y.
 *   Present lookback `window` fills `presentHeight`.
 *   Older past packs into `pastHeight`. Future packs into `futureHeight`.
 * absolute: t=0 at y=0, time stacks +Y at presentHeight/window.
 */

export class TimeContext {
  constructor(opts = {}) {
    this.mode = opts.mode === "absolute" ? "absolute" : "playhead";
    this.now = num(opts.now, 0);
    this.window = pos(opts.window, 120);
    this.presentHeight = pos(opts.presentHeight, 36);
    this.pastHeight = pos(opts.pastHeight, 9);
    this.futureHeight = pos(opts.futureHeight, 9);
    this.pastSpan = pos(opts.pastSpan, this.window * 4);
    this.futureSpan = pos(opts.futureSpan, this.window * 4);
  }

  setNow(t) {
    this.now = num(t, this.now);
    return this;
  }

  setWindow(w) {
    this.window = pos(w, this.window);
    return this;
  }

  /** World Y for timestamp t. */
  y(t) {
    const x = num(t, 0);
    if (this.mode === "absolute") {
      return (x / this.window) * this.presentHeight;
    }
    const age = this.now - x;
    if (age >= 0) {
      if (age <= this.window) return (age / this.window) * this.presentHeight;
      const extra = Math.min(age - this.window, this.pastSpan);
      return this.presentHeight + (extra / this.pastSpan) * this.pastHeight;
    }
    const ahead = Math.min(-age, this.futureSpan);
    return -(ahead / this.futureSpan) * this.futureHeight;
  }

  get presentTop() {
    return this.presentHeight;
  }

  get pastTop() {
    return this.presentHeight + this.pastHeight;
  }

  get futureBottom() {
    return -this.futureHeight;
  }
}

function num(v, d) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function pos(v, d) {
  const n = num(v, d);
  return n > 0 ? n : d;
}
