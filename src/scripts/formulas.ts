// The integral sign through the eras. The sign holds the centre of the
// stage; the formula around it, its typeface and the way it was printed or
// displayed change every few seconds, oldest first.

interface Era {
  style: string;
  sign: string;
  lhs: string;
  rhs: string;
}

// A montage at ten formulas a second that slows over its last steps, as if
// coming to rest, and stops on the vision.
const HOLD = 100;
const EASE_STEPS = 8;
const holdBefore = (next: number, last: number) => {
  const k = next - (last - EASE_STEPS);
  return k <= 0 ? HOLD : HOLD * (1 + 6 * (k / EASE_STEPS) ** 2);
};

// The sign is drawn on a canvas so that its visible height is the same in
// every era, whatever the typeface's proportions: the ink box of the glyph is
// measured and scaled to a fixed height, and centred.
async function drawSign(canvas: HTMLCanvasElement, char: string) {
  const style = getComputedStyle(canvas);
  const family = style.fontFamily;
  const italic = style.fontStyle === 'italic' ? 'italic ' : '';
  const color = style.color;
  // One visible height for every era, independent of each typeface's size.
  const target = Math.max(48, Math.min(84, window.innerWidth * 0.055));
  canvas.closest<HTMLElement>('.formula')?.style.setProperty('--sign-h', `${target}px`);
  try {
    await document.fonts.load(`${italic}100px ${family}`, char);
  } catch {}
  const probe = document.createElement('canvas').getContext('2d')!;
  probe.font = `${italic}100px ${family}`;
  const m = probe.measureText(char);
  const inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent || 100;
  const inkW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight || 50;
  const scale = target / inkH;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = Math.max(target * 0.75, inkW * scale + target * 0.3);
  const cssH = target * 1.25;
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  canvas.width = Math.round(cssW * ratio);
  canvas.height = Math.round(cssH * ratio);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  const x = cssW / 2 - ((m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2) * scale;
  const y = cssH / 2 - ((m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2) * scale;
  ctx.font = `${italic}${100 * scale}px ${family}`;
  ctx.fillStyle = color;
  ctx.fillText(char, x, y);
}

export function startFormulas(root: HTMLElement) {
  const eras: Era[] = JSON.parse(root.dataset.eras ?? '[]');
  const lhs = root.querySelector<HTMLElement>('.formula-lhs')!;
  const sym = root.querySelector<HTMLElement>('.formula-sym')!;
  const sign = document.createElement('canvas');
  sym.replaceChildren(sign);
  const rhs = root.querySelector<HTMLElement>('.formula-rhs')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = -1;
  let timer = 0;

  const show = (next: number) => {
    index = Math.max(0, Math.min(eras.length - 1, next));
    const era = eras[index];
    root.dataset.era = era.style;
    lhs.innerHTML = era.lhs;
    rhs.innerHTML = era.rhs;
    void drawSign(sign, era.sign);
    root.classList.toggle('final', era.style === 'vision');
  };


  const play = () => {
    window.clearTimeout(timer);
    if (reduced) {
      show(eras.length - 1);
      return;
    }
    show(0);
    const last = eras.length - 1;
    const step = () => {
      if (index >= last) return;
      show(index + 1);
      if (index < last) timer = window.setTimeout(step, holdBefore(index + 1, last));
    };
    timer = window.setTimeout(step, holdBefore(1, last));
  };

  // Every typeface is loaded before the montage, so no cut flashes.
  const ready = () =>
    Promise.all(
      [
        '20px KaTeX_Main',
        'italic 20px KaTeX_Math',
        '20px KaTeX_Size2',
        '20px KaTeX_AMS',
      ].map((font) => document.fonts.load(font).catch(() => [])),
    );

  return {
    begin(instant = false) {
      root.classList.add('on');
      void ready().then(() => (instant ? show(eras.length - 1) : play()));
    },
    enableClicks(host: HTMLElement) {
      let downX = 0;
      let downY = 0;
      host.addEventListener('pointerdown', (event) => {
        downX = event.clientX;
        downY = event.clientY;
      });
      host.addEventListener('click', (event) => {
        if ((event.target as HTMLElement).closest('a, button, .hero-copy')) return;
        if (Math.abs(event.clientX - downX) + Math.abs(event.clientY - downY) > 6) return;
        play();
      });
    },
  };
}
