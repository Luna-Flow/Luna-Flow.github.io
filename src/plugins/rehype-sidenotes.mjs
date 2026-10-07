// Copies each GFM footnote next to its reference as a margin note. Wide
// layouts show the margin notes and hide the footnote list; narrow layouts do
// the opposite (see styles/prose.css).
import { visit, SKIP } from 'unist-util-visit';

function definitions(tree) {
  const map = new Map();
  visit(tree, 'element', (node) => {
    if (node.tagName === 'li' && typeof node.properties?.id === 'string' && node.properties.id.includes('fn-')) {
      map.set(node.properties.id, node);
    }
  });
  return map;
}

function inline(nodes) {
  // Footnote bodies are paragraphs; margin notes must be phrasing content.
  const out = [];
  for (const node of nodes) {
    if (node.type === 'element' && node.tagName === 'p') {
      if (out.length) out.push({ type: 'text', value: ' ' });
      out.push(...inline(node.children));
    } else if (node.type === 'element' && node.tagName === 'a' && 'dataFootnoteBackref' in (node.properties ?? {})) {
      continue;
    } else if (!(node.type === 'text' && node.value === '\n')) {
      out.push(node);
    }
  }
  return out;
}

export default function rehypeSidenotes() {
  return (tree) => {
    const defs = definitions(tree);
    if (!defs.size) return;
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'sup' || !parent) return;
      const ref = node.children.find((child) => child.tagName === 'a' && 'dataFootnoteRef' in (child.properties ?? {}));
      if (!ref) return;
      const id = String(ref.properties.href ?? '').replace(/^#/, '');
      const def = defs.get(id);
      if (!def) return;
      const number = ref.children.map((child) => child.value ?? '').join('');
      const note = {
        type: 'element',
        tagName: 'span',
        properties: { className: ['sidenote'], role: 'note' },
        children: [
          { type: 'element', tagName: 'span', properties: { className: ['sidenote-number'] }, children: [{ type: 'text', value: number }] },
          { type: 'text', value: ' ' },
          ...structuredClone(inline(def.children)),
        ],
      };
      parent.children.splice(index + 1, 0, note);
      return [SKIP, index + 2];
    });
  };
}
