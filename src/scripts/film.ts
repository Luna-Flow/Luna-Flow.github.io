// The landing film, drawn on one canvas.
//
//  1 Construction  0.0–2.7 s  every compass circle at once, then the ruled
//                             lines, then the outline is traced.
//  2 Fill          2.7–4.2 s  colour runs along the spine of the mark, then
//                             into the bit; full, it flashes and settles into
//                             a clean wireframe.
//  3 Key           4.2–8.0 s  the camera swings into a deep perspective facing
//                             a plain 0. The mark slides into its counter along
//                             the shaft, and key and 0 turn half a turn together.
//  4 Surface       7.6 s –    a surface with peaks and valleys rises; its
//                             vertices are kicked and spring back, and the
//                             surface follows. From 11 s it blurs into the
//                             background of the formulas (see landing.css).

type Vec = [number, number, number];
type P2 = [number, number];
type Projected = [number, number, number];

const OUTLINE =
  'm 230,20 v 30 a 10,10 0 0 1 -10,10 h -70 a 10,10 0 0 0 -10,10 v 50 a 30,30 0 0 1 -30,30 H 30 A 30,30 0 0 1 0,120 V 20 A 10,10 0 0 1 10,10 h 30 a 10,10 0 0 1 10,10 v 75 a 5,5 0 0 0 5,5 h 30 a 5,5 0 0 0 5,-5 V 40 a 30,30 0 0 1 30,-30 h 100 a 10,10 0 0 1 10,10 z';
const BIT = 'm 220,75 v 30 a 5,5 0 0 1 -5,5 H 150 V 75 a 5,5 0 0 1 5,-5 h 60 a 5,5 0 0 1 5,5 z';
const SPINE = 'M 25 14 V 110 Q 25 125 40 125 H 100 Q 115 125 115 110 V 50 Q 115 35 130 35 H 232';
const BIT_SPINE = 'M 146 90 H 224';

// Construction: ruler lines (logo units) and compass circles.
const RULES: [number, number, number, number][] = [
  [-20, 10, 250, 10],
  [-20, 60, 250, 60],
  [-20, 150, 160, 150],
  [30, 100, 110, 100],
  [130, 70, 250, 70],
  [130, 110, 250, 110],
  [0, -10, 0, 165],
  [50, -10, 50, 120],
  [90, 120, 90, 25],
  [140, 165, 140, 45],
  [150, 50, 150, 125],
  [230, -5, 230, 70],
  [220, 55, 220, 125],
];
const CIRCLES: [number, number, number][] = [
  [30, 120, 30],
  [110, 120, 30],
  [120, 40, 30],
  [10, 20, 10],
  [40, 20, 10],
  [220, 20, 10],
  [220, 50, 10],
  [150, 70, 10],
];

const MAGENTA = '224,92,196';
const BRAND = '158,16,132';
const MOON = '244,238,228';
const AMBER = '242,179,90';
const CYAN = '95,211,230';
const VIOLET = '150,130,255';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const phase = (time: number, start: number, end: number) => clamp((time - start) / (end - start));
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const easeOut = (x: number) => 1 - (1 - x) ** 3;
const mix = (a: number, b: number, u: number) => a + (b - a) * u;

function sample(d: string, count: number): P2[] {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('style', 'position:absolute;width:0;height:0;visibility:hidden');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  svg.append(path);
  document.body.append(svg);
  const length = path.getTotalLength();
  const points: P2[] = [];
  for (let i = 0; i <= count; i += 1) {
    const p = path.getPointAtLength((i / count) * length);
    points.push([p.x, p.y]);
  }
  svg.remove();
  return points;
}

// Logo units to world units: the mark spans about two units, centred.
const W = ([x, y]: P2): P2 => [(x - 115) / 115, (y - 80) / 115];
const SHAFT = (35 - 80) / 115;
const TIP = (232 - 115) / 115;
const KEYHOLE_X = 2.15;

// ------------------------------------------------------------ colour by height

function levelColour(u: number) {
  const stops = [CYAN, VIOLET, MAGENTA, AMBER, MOON];
  const x = u * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const a = stops[i].split(',').map(Number);
  const b = stops[i + 1].split(',').map(Number);
  return a.map((v, k) => Math.round(mix(v, b[k], x - i))).join(',');
}

// ------------------------------------------------------------ camera

interface Camera {
  yaw: number;
  pitch: number;
  dist: number;
  target: Vec;
  scale: number;
  cx: number;
  cy: number;
}

function lerpCamera(a: Camera, b: Camera, u: number): Camera {
  return {
    yaw: mix(a.yaw, b.yaw, u),
    pitch: mix(a.pitch, b.pitch, u),
    dist: mix(a.dist, b.dist, u),
    target: [mix(a.target[0], b.target[0], u), mix(a.target[1], b.target[1], u), mix(a.target[2], b.target[2], u)],
    scale: mix(a.scale, b.scale, u),
    cx: mix(a.cx, b.cx, u),
    cy: mix(a.cy, b.cy, u),
  };
}

function projector(c: Camera) {
  const cyaw = Math.cos(c.yaw);
  const syaw = Math.sin(c.yaw);
  const cp = Math.cos(c.pitch);
  const sp = Math.sin(c.pitch);
  return ([x0, y0, z0]: Vec): Projected => {
    const x = x0 - c.target[0];
    const y = y0 - c.target[1];
    const z = z0 - c.target[2];
    const x1 = x * cyaw - y * syaw;
    const y1 = x * syaw + y * cyaw;
    const y2 = y1 * cp - z * sp;
    const z2 = y1 * sp + z * cp;
    const p = c.dist / Math.max(0.08, c.dist - z2);
    return [c.cx + x1 * c.scale * p, c.cy + y2 * c.scale * p, z2];
  };
}

// ------------------------------------------------------------ film

export interface FilmEvents {
  copy?: () => void;
  // `instant` is true when the film was skipped: show the final formula.
  symbol?: (instant: boolean) => void;
  interactive?: () => void;
}

// The moment the film rests: copy in place, surface behind the formulas.
const FINAL_TIME = 12.2;

export interface Film {
  skip(): void;
  readonly playing: boolean;
}

export function startFilm(canvas: HTMLCanvasElement, events: FilmEvents = {}, options: { skip?: boolean } = {}): Film | undefined {
  const context = canvas.getContext('2d');
  if (!context) return;
  const ctx = context;
  const host = canvas.closest<HTMLElement>('[data-hero]') ?? canvas.parentElement!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const outline = sample(OUTLINE, 360).map(W);
  const bitOutline = sample(BIT, 120).map(W);
  const spine = sample(SPINE, 300).map(W);
  const bitSpine = sample(BIT_SPINE, 60).map(W);
  const fill = document.createElement('canvas');
  const fctx = fill.getContext('2d')!;
  const maskCanvas = document.createElement('canvas');
  const mctx = maskCanvas.getContext('2d')!;

  let width = 0;
  let height_ = 0;
  let ratio = 1;
  let visible = true;
  let start = performance.now();
  let skipped = false;
  let fired = { copy: false, symbol: false, interactive: false };
  let orbit = 0;
  let userYaw = 0;
  let userPitch = 0;
  let dragging = false;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height_ = rect.height;
    for (const c of [canvas, fill, maskCanvas]) {
      c.width = Math.round(width * ratio);
      c.height = Math.round(height_ * ratio);
    }
  }

  // Where the scene sits: centred for the brand, to the right once the copy
  // is on screen (desktop); in the top band on narrow screens.
  function layout() {
    const narrow = width < 760;
    const unit = narrow ? width * 0.36 : Math.min(width * 0.2, height_ * 0.32);
    return {
      narrow,
      unit,
      brand: { x: width / 2, y: narrow ? 56 + width * 0.48 : height_ * 0.47 },
      stage: { x: narrow ? width / 2 : width * 0.7, y: narrow ? 56 + width * 0.48 : height_ * 0.48 },
    };
  }

  function cameraAt(time: number): Camera {
    const L = layout();
    const front: Camera = { yaw: 0, pitch: 0, dist: 6, target: [0, 0, 0], scale: L.unit, cx: L.brand.x, cy: L.brand.y };
    const keyhole: Camera = {
      yaw: -1.08,
      pitch: 1.18,
      dist: 3.1,
      target: [KEYHOLE_X - 0.6, SHAFT, 0.05],
      scale: L.unit * 0.6,
      cx: L.stage.x,
      cy: L.stage.y,
    };
    const land: Camera = {
      yaw: -0.65 + orbit + userYaw,
      pitch: clamp(1.02 + userPitch, 0.35, 1.45),
      dist: 3.6,
      target: [0, 0, 0.12],
      scale: L.unit * 0.78,
      cx: L.stage.x,
      cy: L.stage.y + (L.narrow ? 0 : L.unit * 0.1),
    };
    if (time < 4.2) return front;
    if (time < 7.4) return lerpCamera(front, keyhole, easeInOut(phase(time, 4.2, 5.6)));
    return lerpCamera(keyhole, land, easeInOut(phase(time, 7.4, 9.0)));
  }

  function path(points: Projected[], close = false) {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (close) ctx.closePath();
  }

  function glow(x: number, y: number, rgb: string, radius: number, alpha: number) {
    if (alpha <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, `rgba(${rgb},${alpha})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  // The key: the mark in the plane z = 0, slid along its shaft and turned
  // about it.
  function keyPoint([x, y]: P2, slide: number, turn: number): Vec {
    const dy = y - SHAFT;
    return [x + slide, SHAFT + dy * Math.cos(turn), dy * Math.sin(turn)];
  }

  function drawConstruction(project: (v: Vec) => Projected, time: number) {
    const fade = 1 - phase(time, 2.4, 3.2);
    if (fade <= 0) return;
    ctx.lineWidth = 0.8;
    RULES.forEach(([x1, y1, x2, y2], i) => {
      const u = easeOut(phase(time, 0.85 + i * 0.035, 1.25 + i * 0.035));
      if (u <= 0) return;
      const a = project([...W([x1, y1]), 0]);
      const b = project([...W([mix(x1, x2, u), mix(y1, y2, u)]), 0]);
      ctx.strokeStyle = `rgba(${MOON},${0.22 * fade})`;
      path([a, b]);
      ctx.stroke();
    });
    CIRCLES.forEach(([cx, cy, r]) => {
      const u = easeInOut(phase(time, 0.1, 0.85));
      if (u <= 0) return;
      const points: Projected[] = [];
      const sweep = u * Math.PI * 2;
      for (let k = 0; k <= 48; k += 1) {
        const a = -Math.PI / 2 + (k / 48) * sweep;
        points.push(project([...W([cx + r * Math.cos(a), cy + r * Math.sin(a)]), 0]));
      }
      ctx.strokeStyle = `rgba(${MOON},${0.2 * fade})`;
      path(points);
      ctx.stroke();
      const centre = project([...W([cx, cy]), 0]);
      ctx.fillStyle = `rgba(${MOON},${0.6 * fade})`;
      ctx.fillRect(centre[0] - 1.5, centre[1] - 1.5, 3, 3);
      if (u < 1) {
        // The compass leg: from the pivot to the pencil.
        const pencil = points.at(-1)!;
        ctx.strokeStyle = `rgba(${AMBER},${0.6 * fade})`;
        path([centre, pencil]);
        ctx.stroke();
        glow(pencil[0], pencil[1], AMBER, 6, 0.9 * fade);
      }
    });
    // Tracing the outline over the construction.
    const trace = easeInOut(phase(time, 1.5, 2.6));
    if (trace > 0) {
      const outer = outline.map((p) => project([...p, 0]));
      const inner = bitOutline.map((p) => project([...p, 0]));
      const n = Math.floor(outer.length * trace);
      ctx.strokeStyle = `rgba(${MOON},0.95)`;
      ctx.lineWidth = 1.4;
      path(outer.slice(0, Math.max(2, n)));
      ctx.stroke();
      path(inner.slice(0, Math.max(2, Math.floor(inner.length * trace))));
      ctx.stroke();
      if (trace < 1) glow(outer[n - 1]?.[0] ?? 0, outer[n - 1]?.[1] ?? 0, MOON, 14, 0.9);
    }
  }

  // Colour runs along the spine, then into the bit; full, it flashes.
  function drawFill(project: (v: Vec) => Projected, time: number, L: ReturnType<typeof layout>) {
    const run = phase(time, 2.7, 3.55);
    const bitRun = phase(time, 3.4, 3.75);
    const flash = time > 3.75 ? Math.max(0, 1 - (time - 3.75) / 0.45) : 0;
    const settle = 1 - phase(time, 3.9, 4.4);
    if (run <= 0 || settle <= 0) return;
    fctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    fctx.globalCompositeOperation = 'source-over';
    fctx.clearRect(0, 0, width, height_);
    fctx.fillStyle = `rgb(${BRAND})`;
    for (const shape of [outline, bitOutline]) {
      fctx.beginPath();
      shape.map((p) => project([...p, 0])).forEach(([x, y], i) => (i ? fctx.lineTo(x, y) : fctx.moveTo(x, y)));
      fctx.closePath();
      fctx.fill();
    }
    // Keep only what the running colour has reached: the spine, then the bit.
    mctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    mctx.clearRect(0, 0, width, height_);
    mctx.strokeStyle = '#000';
    mctx.lineCap = 'round';
    mctx.lineJoin = 'round';
    const stroke = (points: P2[], u: number, w: number) => {
      const n = Math.max(1, Math.floor(points.length * easeInOut(u)));
      mctx.lineWidth = (w / 115) * L.unit;
      mctx.beginPath();
      points.slice(0, n + 1).forEach((p, i) => {
        const [x, y] = project([...p, 0]);
        if (i) mctx.lineTo(x, y);
        else mctx.moveTo(x, y);
      });
      mctx.stroke();
    };
    stroke(spine, run, 62);
    if (bitRun > 0) stroke(bitSpine, bitRun, 48);
    fctx.globalCompositeOperation = 'destination-in';
    fctx.setTransform(1, 0, 0, 1, 0, 0);
    fctx.drawImage(maskCanvas, 0, 0);
    ctx.save();
    ctx.globalAlpha = settle;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(fill, 0, 0, width, height_);
    if (flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.55 * flash;
      ctx.filter = `blur(${8 + 18 * (1 - flash)}px)`;
      ctx.drawImage(fill, 0, 0, width, height_);
      ctx.filter = 'none';
      ctx.drawImage(fill, 0, 0, width, height_);
    }
    ctx.restore();
  }

  // Negative: clockwise as seen from the camera looking down the shaft.
  const keyTurn = (time: number) => -easeInOut(phase(time, 6.6, 7.3)) * (Math.PI / 2);

  function drawKey(project: (v: Vec) => Projected, time: number) {
    const show = phase(time, 3.85, 4.3) * (1 - phase(time, 7.6, 8.4));
    if (show <= 0) return;
    const slide = easeInOut(phase(time, 5.5, 6.5)) * (KEYHOLE_X + 0.12 - TIP);
    const turn = keyTurn(time);
    const at = (p: P2) => project(keyPoint(p, slide, turn));
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = `rgba(${MOON},${0.92 * show})`;
    path(outline.map(at), true);
    ctx.stroke();
    path(bitOutline.map(at), true);
    ctx.stroke();
  }

  // A plain 0, standing across the shaft. Its counter takes the key, and it
  // turns with the key.
  function drawZero(project: (v: Vec) => Projected, time: number) {
    const appear = easeOut(phase(time, 4.6, 5.6));
    const fade = 1 - phase(time, 7.6, 8.4);
    const a = appear * fade;
    if (a <= 0) return;
    const turn = keyTurn(time);
    const lit = time > 7.4 ? Math.max(0, 1 - (time - 7.4) / 0.8) : 0;
    const at = (y: number, z: number): Projected => {
      const c = Math.cos(turn);
      const sn = Math.sin(turn);
      return project([KEYHOLE_X, SHAFT + y * c - z * sn, y * sn + z * c]);
    };
    const oval = (ry: number, rz: number) => {
      const points: Projected[] = [];
      for (let k = 0; k <= 96; k += 1) {
        const t = (k / 96) * Math.PI * 2;
        points.push(at(ry * Math.cos(t), rz * Math.sin(t)));
      }
      return points;
    };
    ctx.save();
    ctx.shadowColor = `rgba(${MAGENTA},${0.8 * lit})`;
    ctx.shadowBlur = 30 * lit;
    ctx.strokeStyle = `rgba(${lit > 0 ? MAGENTA : MOON},${(0.9 + 0.1 * lit) * a})`;
    ctx.lineWidth = 1.4 + 1.2 * lit;
    // Long axis along the width of the mark, short axis across its (zero)
    // thickness, so the shaft enters the counter edge-on.
    path(oval(0.56, 0.36), true);
    ctx.stroke();
    path(oval(0.42, 0.22), true);
    ctx.stroke();
    ctx.restore();
  }

  // The surface: sharp peaks and valleys whose heights swing continuously and
  // whose centres drift, with a travelling ripple on top, like a live chart.
  // Colour follows height, from the lowest point in view to the highest.
  const bumps = [
    { x: 0.42, y: 0.25, s: 0.32, base: 1.0, w: 3.1, p: 0.0 },
    { x: -0.48, y: -0.38, s: 0.26, base: 0.85, w: 2.4, p: 1.7 },
    { x: -0.28, y: 0.58, s: 0.24, base: -0.8, w: 3.7, p: 0.6 },
    { x: 0.55, y: -0.55, s: 0.22, base: 0.7, w: 4.4, p: 2.9 },
    { x: -0.7, y: 0.12, s: 0.2, base: -0.55, w: 2.9, p: 4.1 },
    { x: 0.05, y: -0.1, s: 0.18, base: 0.6, w: 5.2, p: 3.3 },
    { x: 0.75, y: 0.7, s: 0.2, base: -0.5, w: 3.4, p: 5.0 },
    { x: -0.15, y: -0.72, s: 0.22, base: 0.55, w: 2.2, p: 0.9 },
  ];
  const N = 56;
  let clock = 0;

  function surfaceHeight(x: number, y: number) {
    let z = 0.07 * Math.sin(7 * x - 3.2 * clock) * Math.cos(5 * y + 1.3 * clock);
    for (const b of bumps) {
      const swing = 0.15 + 1.25 * (0.5 + 0.5 * Math.sin(b.w * clock + b.p)) ** 1.6;
      const cx = b.x + 0.08 * Math.sin(0.9 * clock + b.p);
      const cy = b.y + 0.08 * Math.cos(0.7 * clock + b.p);
      const r = Math.hypot(x - cx, y - cy);
      z += b.base * swing * Math.exp(-r / b.s);
    }
    return z;
  }

  function stepSurface(dt: number) {
    clock += dt;
  }

  function drawSurface(project: (v: Vec) => Projected, time: number, dim: number) {
    const rise = easeInOut(phase(time, 7.6, 9.0));
    if (rise <= 0) return;
    const scaleZ = 0.38 * rise;
    const grid: Projected[][] = [];
    const heights: number[][] = [];
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i <= N; i += 1) {
      grid.push([]);
      heights.push([]);
      for (let j = 0; j <= N; j += 1) {
        const x = -1 + (2 * i) / N;
        const y = -1 + (2 * j) / N;
        const h = surfaceHeight(x, y);
        lo = Math.min(lo, h);
        hi = Math.max(hi, h);
        heights[i].push(h);
        grid[i].push(project([x, y, h * scaleZ - 0.1]));
      }
    }
    const BINS = 14;
    const bins: number[][] = Array.from({ length: BINS }, () => []);
    const span = Math.max(1e-6, hi - lo);
    const bin = (h: number) => Math.max(0, Math.min(BINS - 1, Math.floor(((h - lo) / span) * BINS)));
    for (let i = 0; i <= N; i += 1) {
      for (let j = 0; j <= N; j += 1) {
        const p = grid[i][j];
        if (i < N) bins[bin((heights[i][j] + heights[i + 1][j]) / 2)].push(p[0], p[1], grid[i + 1][j][0], grid[i + 1][j][1]);
        if (j < N) bins[bin((heights[i][j] + heights[i][j + 1]) / 2)].push(p[0], p[1], grid[i][j + 1][0], grid[i][j + 1][1]);
      }
    }
    bins.forEach((segments, k) => {
      const u = k / (BINS - 1);
      ctx.strokeStyle = `rgba(${levelColour(u)},${(0.22 + 0.6 * u) * rise * dim})`;
      ctx.lineWidth = 0.55 + 0.75 * u;
      ctx.beginPath();
      for (let m = 0; m < segments.length; m += 4) {
        ctx.moveTo(segments[m], segments[m + 1]);
        ctx.lineTo(segments[m + 2], segments[m + 3]);
      }
      ctx.stroke();
    });
  }

  let last = performance.now();
  function render(time: number) {
    const L = layout();
    const camera = cameraAt(time);
    const project = projector(camera);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height_);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'lighter';
    drawConstruction(project, time);
    ctx.globalCompositeOperation = 'source-over';
    drawFill(project, time, L);
    ctx.globalCompositeOperation = 'lighter';
    drawKey(project, time);
    drawZero(project, time);
    const dim = 1;
    drawSurface(project, time, dim);
    ctx.globalCompositeOperation = 'source-over';
  }

  function loop(now: number) {
    const time = (now - start) / 1000;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (visible) {
      if (time > 7.6) stepSurface(dt);
      if (time > 9 && !dragging) orbit += dt * 0.05;
      if (!fired.copy && time > 5.0) {
        fired.copy = true;
        events.copy?.();
      }
      if (!fired.symbol && time > 10.8) {
        fired.symbol = true;
        events.symbol?.(skipped);
      }
      if (!fired.interactive && time > 12) {
        fired.interactive = true;
        host.classList.add('is-interactive');
        events.interactive?.();
      }
      render(time);
    }
    requestAnimationFrame(loop);
  }

  // Drag turns the landscape once the film has played.
  let lastX = 0;
  let lastY = 0;
  host.addEventListener('pointerdown', (event) => {
    if (!fired.interactive || (event.target as HTMLElement).closest('a, button, .hero-copy')) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    host.setPointerCapture(event.pointerId);
  });
  host.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    userYaw += (event.clientX - lastX) * 0.008;
    userPitch += (event.clientY - lastY) * 0.005;
    lastX = event.clientX;
    lastY = event.clientY;
  });
  host.addEventListener('pointerup', () => {
    dragging = false;
  });

  resize();
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
  }).observe(canvas);

  if (reduced) {
    fired = { copy: true, symbol: true, interactive: true };
    events.copy?.();
    events.symbol?.(true);
    host.classList.add('is-interactive');
    render(14);
    return { skip() {}, playing: false };
  }

  // Jump to the resting state; the next frame fires whatever events remain.
  const skip = () => {
    if (fired.interactive) return;
    skipped = true;
    start = performance.now() - FINAL_TIME * 1000;
  };
  start = performance.now();
  last = start;
  if (options.skip) skip();
  requestAnimationFrame(loop);
  return {
    skip,
    get playing() {
      return !fired.interactive;
    },
  };
}
