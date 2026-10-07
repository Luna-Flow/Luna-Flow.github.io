// Copy buttons on code blocks and the active entry of "On this page".

for (const pre of document.querySelectorAll<HTMLPreElement>('.prose pre')) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy-button';
  button.setAttribute('aria-label', 'Copy');
  button.innerHTML =
    '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.25"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" fill="none" stroke="currentColor" stroke-width="1.25"/></svg>';
  button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(pre.querySelector('code')?.innerText ?? pre.innerText);
    button.dataset.copied = '1';
    setTimeout(() => delete button.dataset.copied, 1200);
  });
  const wrap = document.createElement('div');
  wrap.className = 'code-block';
  pre.replaceWith(wrap);
  wrap.append(pre, button);
}

const article = document.querySelector('.doc');
if (article && !article.querySelector('.sidenote')) article.classList.add('toc-sticky');

const links = new Map<string, HTMLAnchorElement>();
document.querySelectorAll<HTMLAnchorElement>('.toc a').forEach((link) => links.set(decodeURIComponent(link.hash.slice(1)), link));
if (links.size) {
  const visible = new Set<string>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      }
      const first = [...links.keys()].find((id) => visible.has(id));
      if (!first) return;
      links.forEach((link, id) => link.toggleAttribute('data-active', id === first));
    },
    { rootMargin: '-64px 0px -60% 0px' },
  );
  links.forEach((_, id) => {
    const heading = document.getElementById(id);
    if (heading) observer.observe(heading);
  });
}
