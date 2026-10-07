// A paragraph whose only content is a link to a published PDF attachment
// becomes a collapsible reader (<lf-pdf>, defined in src/scripts/pdf-reader.ts).
// A link inside running text is left alone.
import { visit } from 'unist-util-visit';
import fs from 'node:fs';
import path from 'node:path';
import { toString } from 'mdast-util-to-string';

const PDF = /^\/attachments\/[^?#]+\.pdf(?:#page=(\d+))?$/;

const escape = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export default function remarkPdf() {
  return (tree) => {
    visit(tree, 'paragraph', (node, index, parent) => {
      const children = node.children.filter((child) => !(child.type === 'text' && !child.value.trim()));
      if (children.length !== 1 || children[0].type !== 'link') return;
      const link = children[0];
      const match = link.url.match(PDF);
      if (!match) return;
      const src = link.url.replace(/#.*$/, '');
      const title = toString(link);
      const file = path.resolve('public', `.${decodeURI(src)}`);
      const size = fs.existsSync(file) ? fs.statSync(file).size : 0;
      parent.children[index] = {
        type: 'html',
        value:
          `<lf-pdf src="${escape(src)}" title="${escape(title)}" size="${size}"${match[1] ? ` page="${match[1]}"` : ''}>` +
          `<a href="${escape(link.url)}">${escape(title)}</a></lf-pdf>`,
      };
    });
  };
}
