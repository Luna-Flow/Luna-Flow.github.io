// Locates link and image destinations in Markdown source, with the exact
// source offsets of the destination text so tools can rewrite them in place.

import { parseMarkdown } from './markdown.mjs';

function readDestination(source, from) {
  let index = from;
  while (source[index] === ' ' || source[index] === '\t' || source[index] === '\n') index += 1;
  if (source[index] === '<') {
    const close = source.indexOf('>', index);
    return close < 0 ? null : { start: index + 1, end: close };
  }
  const start = index;
  let depth = 0;
  while (index < source.length) {
    const char = source[index];
    if (char === '\\') {
      index += 2;
      continue;
    }
    if (/\s/.test(char)) break;
    if (char === '(') depth += 1;
    if (char === ')') {
      if (depth === 0) break;
      depth -= 1;
    }
    index += 1;
  }
  return index > start ? { start, end: index } : null;
}

// [{ type, url, start, end, line }] for inline links, images and reference
// definitions. `url` is the raw destination as written.
export function findLinks(source) {
  const tree = parseMarkdown(source);
  const found = [];
  const walk = (node) => {
    if (node.type === 'code' || node.type === 'inlineCode' || node.type === 'math' || node.type === 'inlineMath') return;
    if ((node.type === 'link' || node.type === 'image') && node.position) {
      const { start, end } = { start: node.position.start.offset, end: node.position.end.offset };
      const slice = source.slice(start, end);
      if (slice.endsWith(')')) {
        const open = slice.lastIndexOf('](');
        const at = open >= 0 ? readDestination(source, start + open + 2) : null;
        if (at) found.push({ type: node.type, url: source.slice(at.start, at.end), ...at, line: node.position.start.line });
      }
    }
    if (node.type === 'definition' && node.position) {
      const start = node.position.start.offset;
      const colon = source.indexOf(']:', start);
      const at = colon >= 0 ? readDestination(source, colon + 2) : null;
      if (at) found.push({ type: 'definition', url: source.slice(at.start, at.end), ...at, line: node.position.start.line });
    }
    for (const child of node.children ?? []) walk(child);
  };
  walk(tree);
  return found;
}

export function isExternal(url) {
  return /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//') || url.startsWith('#') || url.startsWith('/');
}

export function splitHash(url) {
  const index = url.search(/[?#]/);
  return index < 0 ? [url, ''] : [url.slice(0, index), url.slice(index)];
}

export function rewriteLinks(source, rewrite) {
  const edits = findLinks(source)
    .map((link) => ({ ...link, next: rewrite(link.url, link) }))
    .filter((link) => link.next !== undefined && link.next !== link.url)
    .sort((a, b) => b.start - a.start);
  let out = source;
  for (const edit of edits) out = out.slice(0, edit.start) + edit.next + out.slice(edit.end);
  return out;
}
