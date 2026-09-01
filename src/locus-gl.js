import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TimeContext } from "./time.js";
import { tessellateWorldline, worldlineBounds } from "./worldline.js";
import { tessellateGraph } from "./graph.js";
import { WATERMARK } from "./watermark.js";

/**
 * Mapbox-shaped host. Auth-free. No domain objects.
 *
 *   const gl = new LocusGL(el)
 *   gl.setTime({ now: 600, window: 120 })
 *   gl.addLayer("walk", { color: 0x3d8bfd })
 *   gl.setWorldlines("walk", [{ id, samples: [{ t, x, z }] }])
 */
export class LocusGL {
  constructor(container, options = {}) {
    this.container = typeof container === "string" ? document.querySelector(container) : container;
    if (!this.container) throw new Error("LocusGL: container required");

    this.time = options.time instanceof TimeContext ? options.time : new TimeContext(options.time || {});
    this.layers = new Map();
    this._raf = 0;
    this._playing = !!options.play;
    this._playRate = Number(options.playRate) || 1;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(options.background ?? 0x121214);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 4000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xfff2d8, 0.85);
    sun.position.set(40, 80, 20);
    this.scene.add(sun);

    this._ground = new THREE.GridHelper(80, 20, 0x2a2a30, 0x1c1c20);
    this.scene.add(this._ground);

    this._nowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshBasicMaterial({
        color: 0x2aa8b8,
        transparent: true,
        opacity: 0.06,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this._nowPlane.rotation.x = -Math.PI / 2;
    this.scene.add(this._nowPlane);

    this._mark = document.createElement("div");
    this._mark.textContent = WATERMARK;
    this._mark.style.cssText =
      "position:absolute;right:8px;bottom:6px;font:11px/1.2 ui-monospace,monospace;color:#9a9990;pointer-events:none;";
    const pos = getComputedStyle(this.container).position;
    if (pos === "static") this.container.style.position = "relative";
    this.container.appendChild(this._mark);

    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(this.container);
    this._resize();
    this.fit();
    this._tick = this._tick.bind(this);
    this._raf = requestAnimationFrame(this._tick);
  }

  setTime(partial) {
    if (partial instanceof TimeContext) {
      this.time = partial;
      return this._rebuild();
    }
    Object.assign(this.time, partial);
    if (partial.window != null) this.time.setWindow(partial.window);
    if (partial.now != null) this.time.setNow(partial.now);
    return this._rebuild();
  }

  addLayer(id, style = {}) {
    if (this.layers.has(id)) return this;
    const group = new THREE.Group();
    group.name = id;
    this.scene.add(group);
    this.layers.set(id, {
      id,
      color: style.color ?? 0x9aa8b8,
      group,
      worldlines: [],
      graph: null,
      _wl: null,
      _graph: null,
    });
    return this;
  }

  setWorldlines(layerId, lines) {
    const layer = this._need(layerId);
    layer.worldlines = lines || [];
    this._drawWorldlines(layer);
    return this;
  }

  setGraph(layerId, graph) {
    const layer = this._need(layerId);
    layer.graph = graph || null;
    this._drawGraph(layer);
    return this;
  }

  play(on = true) {
    this._playing = !!on;
    return this;
  }

  fit() {
    const all = [];
    for (const layer of this.layers.values()) all.push(...layer.worldlines);
    const b = worldlineBounds(all, this.time);
    const y = (b.y0 + b.y1) * 0.28;
    this.camera.position.set(b.x + b.r * 1.15, Math.max(18, b.r * 0.45), b.z + b.r * 1.25);
    this.controls.target.set(b.x, y, b.z);
    this.controls.update();
    this._ground.position.set(b.x, 0, b.z);
    this._nowPlane.position.set(b.x, 0, b.z);
    this._nowPlane.scale.setScalar(Math.max(1, b.r / 40));
    return this;
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    this._ro.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    this._mark.remove();
    this.renderer.domElement.remove();
    this.layers.clear();
  }

  _need(id) {
    if (!this.layers.has(id)) this.addLayer(id);
    return this.layers.get(id);
  }

  _rebuild() {
    for (const layer of this.layers.values()) this._drawWorldlines(layer);
    return this;
  }

  _drawWorldlines(layer) {
    const positions = [];
    for (const line of layer.worldlines) {
      const xyz = tessellateWorldline(line.samples || [], this.time);
      for (let i = 0; i + 5 < xyz.length; i += 3) {
        positions.push(xyz[i], xyz[i + 1], xyz[i + 2], xyz[i + 3], xyz[i + 4], xyz[i + 5]);
      }
    }
    if (!positions.length) {
      if (layer._wl) {
        layer.group.remove(layer._wl);
        layer._wl.geometry.dispose();
        layer._wl.material.dispose();
        layer._wl = null;
      }
      return;
    }
    if (layer._wl && layer._wl.geometry.attributes.position.count === positions.length / 3) {
      layer._wl.geometry.attributes.position.array.set(positions);
      layer._wl.geometry.attributes.position.needsUpdate = true;
      return;
    }
    if (layer._wl) {
      layer.group.remove(layer._wl);
      layer._wl.geometry.dispose();
      layer._wl.material.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color: layer.color, transparent: true, opacity: 0.85 });
    layer._wl = new THREE.LineSegments(geo, mat);
    layer.group.add(layer._wl);
  }

  _drawGraph(layer) {
    if (layer._graph) {
      layer.group.remove(layer._graph);
      layer._graph.geometry.dispose();
      layer._graph.material.dispose();
      layer._graph = null;
    }
    if (!layer.graph) return;
    const xyz = tessellateGraph(layer.graph.nodes, layer.graph.edges, 0);
    if (!xyz.length) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(xyz, 3));
    const mat = new THREE.LineBasicMaterial({ color: layer.color, opacity: 0.55, transparent: true });
    layer._graph = new THREE.LineSegments(geo, mat);
    layer.group.add(layer._graph);
  }

  _resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  _tick() {
    this._raf = requestAnimationFrame(this._tick);
    if (this._playing) {
      this.time.setNow(this.time.now + this._playRate);
      this._rebuild();
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
