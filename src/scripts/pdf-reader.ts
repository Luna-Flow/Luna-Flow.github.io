// <lf-pdf src title page size>: a document reader that stays folded until
// the reader opens it. pdf.js is loaded on first open, pages are rendered when
// they scroll into view, and the original link remains as the fallback.

type Strings = Record<string, string>;

const strings: Strings = (() => {
  try {
    return JSON.parse(document.getElementById('pdf-strings')?.textContent ?? '{}');
  } catch {
    return {};
  }
})();

const ZOOM_STEPS = [0.5, 0.67, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3];

let pdfjsPromise: Promise<any> | null = null;
function loadPdfjs() {
  pdfjsPromise ??= Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(
    ([pdfjs, worker]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    },
  );
  return pdfjsPromise;
}

function formatSize(bytes: number) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> & { class?: string } = {}, ...children: (Node | string)[]) {
  const node = document.createElement(tag);
  const { class: className, ...rest } = props as any;
  if (className) node.className = className;
  Object.assign(node, rest);
  node.append(...children);
  return node;
}

const icon = (path: string) => {
  const span = document.createElement('span');
  span.className = 'pdf-icon';
  span.innerHTML = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">${path}</svg>`;
  return span;
};

class LfPdf extends HTMLElement {
  private doc: any = null;
  private zoom = 0; // 0 = fit width
  private pages: HTMLDivElement[] = [];
  private rendered = new Map<number, { scale: number; task?: any }>();
  private observer?: IntersectionObserver;
  private tracker?: IntersectionObserver;
  private pageInput!: HTMLInputElement;
  private pageCount!: HTMLSpanElement;
  private viewport!: HTMLDivElement;
  private body!: HTMLDivElement;
  private toggle!: HTMLButtonElement;
  private status!: HTMLParagraphElement;
  private current = 1;
  private generation = 0;
  private laidOutWidth = 0;
  private resizeTimer = 0;

  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = '1';
    const src = this.getAttribute('src') ?? '';
    const title = this.getAttribute('title') || src.split('/').pop() || 'PDF';
    this.removeAttribute('title');
    const size = formatSize(Number(this.getAttribute('size') ?? 0));
    const id = `pdf-${Math.random().toString(36).slice(2, 9)}`;

    this.toggle = el(
      'button',
      { class: 'pdf-toggle', type: 'button' },
      icon('<path d="M4 1.5h5.5L13 5v9.5H4z" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/><path d="M9.5 1.5V5H13" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/>'),
      el('span', { class: 'pdf-title' }, title),
      el('span', { class: 'pdf-meta' }, [strings.kind ?? 'PDF', size].filter(Boolean).join(' · ')),
      el('span', { class: 'pdf-chevron', ariaHidden: 'true' }),
    );
    this.toggle.setAttribute('aria-expanded', 'false');
    this.toggle.setAttribute('aria-controls', id);
    this.toggle.title = strings.expand ?? '';

    this.pageInput = el('input', { class: 'pdf-page-input', type: 'number', min: '1', value: '1', inputMode: 'numeric' });
    this.pageInput.setAttribute('aria-label', strings.page ?? 'Page');
    this.pageCount = el('span', { class: 'pdf-page-count' }, '');
    const button = (label: string, path: string, action: () => void) => {
      const node = el('button', { class: 'pdf-tool', type: 'button', title: label }, icon(path));
      node.setAttribute('aria-label', label);
      node.addEventListener('click', action);
      return node;
    };
    const link = (label: string, href: string, path: string, download = false) => {
      const node = el('a', { class: 'pdf-tool', href, title: label }, icon(path));
      node.setAttribute('aria-label', label);
      if (download) node.setAttribute('download', '');
      else node.target = '_blank';
      return node;
    };
    const toolbar = el(
      'div',
      { class: 'pdf-toolbar' },
      el('label', { class: 'pdf-pager' }, el('span', {}, strings.page ?? 'Page'), this.pageInput, this.pageCount),
      el(
        'div',
        { class: 'pdf-tools' },
        button(strings.zoomOut ?? '−', '<path d="M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>', () => this.step(-1)),
        button(strings.fit ?? 'Fit', '<path d="M2 5V2h3M11 2h3v3M14 11v3h-3M5 14H2v-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', () => this.setZoom(0)),
        button(strings.zoomIn ?? '+', '<path d="M3 8h10M8 3v10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>', () => this.step(1)),
        link(strings.open ?? 'Open', src, '<path d="M9 2h5v5M14 2 7.5 8.5M12 9.5V14H2V4h4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'),
        link(strings.download ?? 'Download', src, '<path d="M8 2v8M4.5 6.5 8 10l3.5-3.5M2.5 13.5h11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', true),
      ),
    );
    this.viewport = el('div', { class: 'pdf-viewport', tabIndex: 0 });
    this.viewport.setAttribute('aria-label', title);
    this.status = el('p', { class: 'pdf-status' }, '');
    this.body = el('div', { class: 'pdf-body', id, hidden: true }, toolbar, this.status, this.viewport);

    const figure = el('figure', { class: 'pdf' }, this.toggle, this.body);
    this.replaceChildren(figure);

    this.toggle.addEventListener('click', () => this.setOpen(this.body.hidden));
    this.pageInput.addEventListener('change', () => this.goTo(Number(this.pageInput.value)));
    new ResizeObserver(() => {
      if (!this.doc || this.zoom !== 0 || this.body.hidden) return;
      if (Math.abs(this.viewport.clientWidth - this.laidOutWidth) < 2) return;
      clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.rerender(), 150);
    }).observe(this.viewport);
  }

  private setOpen(open: boolean) {
    this.body.hidden = !open;
    this.toggle.setAttribute('aria-expanded', String(open));
    this.toggle.title = (open ? strings.collapse : strings.expand) ?? '';
    if (open && !this.doc) this.load();
  }

  private async load() {
    this.status.textContent = strings.loading ?? 'Loading…';
    try {
      const pdfjs = await loadPdfjs();
      this.doc = await pdfjs.getDocument({ url: this.getAttribute('src') }).promise;
      this.status.textContent = '';
      this.pageCount.textContent = `/ ${this.doc.numPages}`;
      this.pageInput.max = String(this.doc.numPages);
      await this.layoutPages();
      const start = Number(this.getAttribute('page') ?? 1);
      if (start > 1) this.goTo(start);
    } catch (error) {
      console.error(error);
      this.status.textContent = strings.error ?? 'The document could not be displayed.';
    }
  }

  private scaleFor(base: { width: number }) {
    if (this.zoom) return this.zoom;
    const width = this.viewport.clientWidth - 32;
    return Math.max(0.25, width / base.width);
  }

  private async layoutPages() {
    const generation = ++this.generation;
    this.laidOutWidth = this.viewport.clientWidth;
    this.observer?.disconnect();
    this.tracker?.disconnect();
    this.viewport.replaceChildren();
    this.pages = [];
    this.rendered.clear();
    const first = await this.doc.getPage(1);
    if (generation !== this.generation) return;
    const base = first.getViewport({ scale: 1 });
    this.observer = new IntersectionObserver((entries) => this.onVisible(entries), {
      root: this.viewport,
      rootMargin: '200% 0px',
    });
    const tracker = (this.tracker = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            this.current = Number((entry.target as HTMLElement).dataset.page);
            this.pageInput.value = String(this.current);
          }
        }
      },
      { root: this.viewport, threshold: [0.5] },
    ));
    for (let number = 1; number <= this.doc.numPages; number += 1) {
      const scale = this.scaleFor(base);
      const page = el('div', { class: 'pdf-page' });
      page.dataset.page = String(number);
      page.style.width = `${base.width * scale}px`;
      page.style.aspectRatio = `${base.width} / ${base.height}`;
      this.viewport.append(page);
      this.pages.push(page);
      this.observer.observe(page);
      tracker.observe(page);
    }
  }

  private onVisible(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      if (entry.isIntersecting) this.renderPage(Number((entry.target as HTMLElement).dataset.page));
    }
  }

  private async renderPage(number: number) {
    const generation = this.generation;
    const page = await this.doc.getPage(number);
    if (generation !== this.generation) return;
    const base = page.getViewport({ scale: 1 });
    const scale = this.scaleFor(base);
    const done = this.rendered.get(number);
    if (done && done.scale === scale) return;
    done?.task?.cancel?.();
    const viewport = page.getViewport({ scale });
    const ratio = window.devicePixelRatio || 1;
    const canvas = el('canvas');
    canvas.width = Math.floor(viewport.width * ratio);
    canvas.height = Math.floor(viewport.height * ratio);
    const holder = this.pages[number - 1];
    holder.style.width = `${viewport.width}px`;
    holder.style.aspectRatio = `${viewport.width} / ${viewport.height}`;
    const task = page.render({
      canvas,
      canvasContext: canvas.getContext('2d'),
      viewport,
      transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
    });
    this.rendered.set(number, { scale, task });
    try {
      await task.promise;
      if (generation === this.generation) holder.replaceChildren(canvas);
    } catch {
      /* cancelled by a newer render */
    }
  }

  private rerender() {
    const keep = this.current;
    this.rendered.clear();
    for (const holder of this.pages) holder.replaceChildren();
    this.layoutPages().then(() => this.goTo(keep, false));
  }

  private setZoom(zoom: number) {
    this.zoom = zoom;
    this.rerender();
  }

  private step(direction: number) {
    const now = this.zoom || this.scaleFor({ width: 612 });
    const next = direction > 0 ? ZOOM_STEPS.find((value) => value > now + 0.01) : [...ZOOM_STEPS].reverse().find((value) => value < now - 0.01);
    if (next) this.setZoom(next);
  }

  private goTo(number: number, smooth = true) {
    if (!this.doc) return;
    const target = Math.min(Math.max(1, Math.round(number) || 1), this.doc.numPages);
    this.pages[target - 1]?.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
    this.current = target;
    this.pageInput.value = String(target);
  }
}

if (!customElements.get('lf-pdf')) customElements.define('lf-pdf', LfPdf);
