// Search through the Pagefind index of the current language. Pagefind keeps
// one index per <html lang>, so results never mix languages.

interface PagefindResult {
  url: string;
  excerpt: string;
  meta: { title?: string; repo?: string };
  sub_results?: { url: string; title: string; excerpt: string }[];
}

let pagefind: any = null;

async function load() {
  if (pagefind) return pagefind;
  const path = '/pagefind/pagefind.js';
  pagefind = await import(/* @vite-ignore */ path);
  await pagefind.init?.();
  return pagefind;
}

export function initSearch() {
  const dialog = document.querySelector<HTMLDialogElement>('.search-dialog');
  if (!dialog) return;
  const input = dialog.querySelector('input')!;
  const list = dialog.querySelector<HTMLOListElement>('.search-results')!;
  const status = dialog.querySelector<HTMLParagraphElement>('.search-status')!;
  const strings = JSON.parse(dialog.dataset.strings ?? '{}');
  let active = -1;
  let token = 0;

  const open = () => {
    if (dialog.open) return;
    dialog.showModal();
    input.select();
  };

  document.querySelectorAll('[data-search-open]').forEach((button) => button.addEventListener('click', open));
  document.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement;
    const typing = target.closest('input, textarea, select, [contenteditable]');
    if ((event.key === '/' && !typing) || (event.key === 'k' && (event.metaKey || event.ctrlKey))) {
      event.preventDefault();
      open();
    }
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  const highlight = (index: number) => {
    const items = [...list.querySelectorAll<HTMLAnchorElement>('a')];
    if (!items.length) return;
    active = (index + items.length) % items.length;
    items.forEach((item, i) => item.setAttribute('aria-selected', String(i === active)));
    items[active].scrollIntoView({ block: 'nearest' });
  };

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      highlight(active + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      highlight(active - 1);
    } else if (event.key === 'Enter') {
      const item = list.querySelectorAll<HTMLAnchorElement>('a')[Math.max(active, 0)];
      if (item) {
        event.preventDefault();
        location.href = item.href;
      }
    }
  });

  input.addEventListener('input', async () => {
    const query = input.value.trim();
    const mine = ++token;
    active = -1;
    if (!query) {
      list.replaceChildren();
      status.textContent = '';
      return;
    }
    status.textContent = strings.loading;
    let engine;
    try {
      engine = await load();
    } catch {
      status.textContent = strings.unavailable;
      return;
    }
    const search = await engine.debouncedSearch(query);
    if (mine !== token || !search) return;
    const results: PagefindResult[] = await Promise.all(search.results.slice(0, 10).map((result: any) => result.data()));
    if (mine !== token) return;
    list.replaceChildren(
      ...results.map((result) => {
        const best = result.sub_results?.[0];
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = best?.url ?? result.url;
        link.setAttribute('role', 'option');
        const title = document.createElement('span');
        title.className = 'search-title';
        title.textContent = result.meta.title ?? result.url;
        const where = document.createElement('span');
        where.className = 'search-where';
        where.textContent = [result.meta.repo, best && best.title !== result.meta.title ? best.title : '']
          .filter(Boolean)
          .join(' › ');
        const excerpt = document.createElement('span');
        excerpt.className = 'search-excerpt';
        excerpt.innerHTML = best?.excerpt ?? result.excerpt;
        link.append(title, where, excerpt);
        item.append(link);
        return item;
      }),
    );
    status.textContent = results.length ? '' : strings.empty;
  });
}
