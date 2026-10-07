// Scroll-triggered entrances, the typed code, and the cycling worlds.

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const reveal = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('in-view');
      reveal.unobserve(entry.target);
      if (entry.target.matches('.worlds')) startWorlds(entry.target as HTMLElement);
    }
  },
  { threshold: 0.25 },
);
document.querySelectorAll('.reveal').forEach((section) => (reduced ? section.classList.add('in-view') : reveal.observe(section)));
if (reduced) document.querySelectorAll<HTMLElement>('.worlds').forEach((section) => startWorlds(section));

// Code drawing: lines appear one after another, as if typed.
function typeCode(root: HTMLElement) {
  const lines = [...root.querySelectorAll<HTMLElement>('.line')];
  lines.forEach((line, index) => line.style.setProperty('--line', String(index)));
  root.classList.add('typing');
  return lines.length * 140 + 400;
}

function startWorlds(section: HTMLElement) {
  if (section.dataset.started) return;
  section.dataset.started = '1';
  const code = section.querySelector<HTMLElement>('[data-typing]');
  const delay = code && !reduced ? typeCode(code) : 0;
  const tabs = [...section.querySelectorAll<HTMLButtonElement>('[data-world]')];
  const panels = [...section.querySelectorAll<HTMLElement>('[data-world-panel]')];
  const progress = section.querySelector<HTMLElement>('.worlds-progress');
  let current = 0;
  let timer = 0;
  const show = (index: number) => {
    current = index;
    tabs.forEach((tab, i) => tab.setAttribute('aria-selected', String(i === index)));
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
      if (i === index) {
        panel.classList.remove('enter');
        void panel.offsetWidth;
        panel.classList.add('enter');
      }
    });
    if (progress) {
      progress.classList.remove('run');
      void progress.offsetWidth;
      if (!reduced) progress.classList.add('run');
    }
  };
  const cycle = () => {
    window.clearInterval(timer);
    if (reduced) return;
    timer = window.setInterval(() => show((current + 1) % tabs.length), 3400);
  };
  tabs.forEach((tab, index) =>
    tab.addEventListener('click', () => {
      show(index);
      cycle();
    }),
  );
  window.setTimeout(() => {
    show(0);
    cycle();
  }, delay);
}
