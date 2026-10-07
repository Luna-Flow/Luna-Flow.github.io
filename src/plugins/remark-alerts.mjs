// GitHub alerts (`> [!NOTE]`) become <aside class="alert" data-kind="note">.
// The marker may stand on its own line or start the first paragraph, which is
// how a translated message keeps it.
import { visit } from 'unist-util-visit';
import { stringsFor } from './strings.mjs';

const KINDS = ['note', 'tip', 'important', 'warning', 'caution'];

export default function remarkAlerts() {
  return (tree, file) => {
    const strings = stringsFor(file.data?.astro?.frontmatter?.url);
    visit(tree, 'blockquote', (node) => {
      const first = node.children[0];
      const text = first?.type === 'paragraph' ? first.children[0] : null;
      if (!text || text.type !== 'text') return;
      const match = text.value.match(/^\[!(\w+)\][ \t]*\n?/);
      if (!match || !KINDS.includes(match[1].toLowerCase())) return;
      const kind = match[1].toLowerCase();
      text.value = text.value.slice(match[0].length);
      if (!text.value && first.children.length === 1) node.children.shift();
      node.children.unshift({
        type: 'paragraph',
        data: { hName: 'span', hProperties: { className: ['alert-label'] } },
        children: [{ type: 'text', value: strings[`alert.${kind}`] ?? kind }],
      });
      node.data = { hName: 'aside', hProperties: { className: ['alert'], dataKind: kind, role: 'note' } };
    });
  };
}
