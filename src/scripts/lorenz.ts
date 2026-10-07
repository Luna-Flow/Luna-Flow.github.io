// One RK4 integrator, two number systems. The Lorenz system is integrated
// twice from the same point with the same code: once rounding every operation
// to binary32 (Float), once in binary64 (Double). Chaos amplifies the rounding
// difference until the trajectories part ways. Starts when it scrolls into
// view; afterwards drag turns it and a click starts again from a new point.

type Vec = [number, number, number];
type Round = (x: number) => number;

const SIGMA = 10;
const RHO = 28;
const BETA = 8 / 3;
const H = 0.005;
const STEPS_PER_FRAME = 9;
const TRAIL = 2200;

function lorenz([x, y, z]: Vec, r: Round): Vec {
  return [r(SIGMA * r(y - x)), r(r(x * r(RHO - z)) - y), r(r(x * y) - r(BETA * z))];
}

// The algorithm is written once; `r` is the number system.
function rk4(s: Vec, r: Round): Vec {
  const add = (a: Vec, b: Vec, k: number): Vec => [r(a[0] + r(k * b[0])), r(a[1] + r(k * b[1])), r(a[2] + r(k * b[2]))];
  const k1 = lorenz(s, r);
  const k2 = lorenz(add(s, k1, H / 2), r);
  const k3 = lorenz(add(s, k2, H / 2), r);
  const k4 = lorenz(add(s, k3, H), r);
  return [0, 1, 2].map((i) => r(s[i] + r((H / 6) * r(r(k1[i] + r(2 * k2[i])) + r(r(2 * k3[i]) + k4[i]))))) as Vec;
}

export interface LorenzTick {
  t: number;
  gap: number;
  parted: number | null;
}

export function startLorenz(canvas: HTMLCanvasElement, onTick: (tick: LorenzTick) => void = () => {}) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const ctx = context;
  const host = canvas.parentElement!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['224,92,196', '244,238,228'];

  let width = 0;
  let height = 0;
  let ratio = 1;
  let spin = -0.6;
  let tilt = 1.2;
  let t = 0;
  let parted: number | null = null;
  let pulse = 0;
  let visible = false;
  let started = false;
  let appear = 0;
  let dragging = false;
  let runs: { state: Vec; round: Round; trail: Vec[] }[] = [];

  const seed = (start: Vec) => {
    runs = [
      { state: start.map(Math.fround) as Vec, round: Math.fround, trail: [] },
      { state: [...start] as Vec, round: (x) => x, trail: [] },
    ];
    t = 0;
    parted = null;
    pulse = 0;
  };
  seed([1, 1, 1]);
  const gap = () => Math.hypot(...([0, 1, 2].map((i) => runs[0].state[i] - runs[1].state[i])) as Vec);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }

  function project([x, y, z]: Vec, scale: number) {
    const px = x / 22;
    const py = y / 22;
    const pz = (z - 25) / 22;
    const x1 = px * Math.cos(spin) - py * Math.sin(spin);
    const y1 = px * Math.sin(spin) + py * Math.cos(spin);
    const y2 = y1 * Math.cos(tilt) - pz * Math.sin(tilt);
    const z2 = y1 * Math.sin(tilt) + pz * Math.cos(tilt);
    const p = 3.2 / (3.2 - z2);
    return [width / 2 + x1 * scale * p, height / 2 + y2 * scale * p, z2];
  }

  function draw() {
    const scale = Math.min(width, height) * 0.42 * (1 - (1 - appear) ** 3);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    runs.forEach((run, index) => {
      const trail = run.trail;
      for (let start = 0; start < trail.length - 1; start += 60) {
        const end = Math.min(trail.length - 1, start + 60);
        const age = end / TRAIL + (1 - trail.length / TRAIL);
        ctx.beginPath();
        let depth = 0;
        for (let i = start; i <= end; i += 1) {
          const p = project(trail[i], scale);
          depth += p[2];
          if (i === start) ctx.moveTo(p[0], p[1]);
          else ctx.lineTo(p[0], p[1]);
        }
        const near = Math.max(0, Math.min(1, 0.5 + depth / (end - start + 1) / 2));
        ctx.strokeStyle = `rgba(${COLORS[index]},${(0.05 + 0.55 * age * age) * (0.55 + 0.45 * near)})`;
        ctx.lineWidth = index === 0 ? 1.5 : 1;
        ctx.stroke();
      }
      const head = trail.at(-1);
      if (!head) return;
      const p = project(head, scale);
      const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 18);
      g.addColorStop(0, `rgba(${COLORS[index]},0.95)`);
      g.addColorStop(1, `rgba(${COLORS[index]},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(p[0] - 18, p[1] - 18, 36, 36);
      if (index === 0 && pulse > 0) {
        ctx.strokeStyle = `rgba(${COLORS[0]},${pulse})`;
        ctx.beginPath();
        ctx.arc(p[0], p[1], 10 + (1 - pulse) * 60, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    ctx.globalCompositeOperation = 'source-over';
  }

  function advance() {
    for (let step = 0; step < STEPS_PER_FRAME; step += 1) {
      for (const run of runs) {
        run.state = rk4(run.state, run.round);
        run.trail.push(run.state);
        if (run.trail.length > TRAIL) run.trail.shift();
      }
      t += H;
      if (parted === null && gap() > 1) {
        parted = t;
        pulse = 1;
      }
    }
  }

  function loop() {
    if (visible && started) {
      appear = Math.min(1, appear + 0.02);
      advance();
      pulse = Math.max(0, pulse - 0.012);
      if (!dragging) spin += 0.0018;
      draw();
      onTick({ t, gap: gap(), parted });
    }
    requestAnimationFrame(loop);
  }

  let moved = 0;
  let lastX = 0;
  let lastY = 0;
  host.addEventListener('pointerdown', (event) => {
    dragging = true;
    moved = 0;
    lastX = event.clientX;
    lastY = event.clientY;
    host.setPointerCapture(event.pointerId);
  });
  host.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    moved += Math.abs(event.clientX - lastX) + Math.abs(event.clientY - lastY);
    spin += (event.clientX - lastX) * 0.008;
    tilt = Math.max(0.2, Math.min(1.75, tilt + (event.clientY - lastY) * 0.006));
    lastX = event.clientX;
    lastY = event.clientY;
  });
  host.addEventListener('pointerup', (event) => {
    if (!dragging) return;
    dragging = false;
    if (moved < 6) {
      const rect = canvas.getBoundingClientRect();
      const u = (event.clientX - rect.left) / rect.width - 0.5;
      const v = (event.clientY - rect.top) / rect.height - 0.5;
      seed([u * 30, v * 30, 22 + v * 10]);
    }
  });

  resize();
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (visible) started = true;
    },
    { threshold: 0.3 },
  ).observe(canvas);

  if (reduced) {
    for (let i = 0; i < 700; i += 1) advance();
    appear = 1;
    draw();
    onTick({ t, gap: gap(), parted });
    return;
  }
  requestAnimationFrame(loop);
}
