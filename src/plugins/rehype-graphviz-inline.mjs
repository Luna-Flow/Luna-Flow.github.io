import fs from 'node:fs';
import path from 'node:path';
import { fromHtml } from 'hast-util-from-html';

function graphvizAsset(src, publicDir) {
  if (typeof src !== 'string') return null;
  const pathname = src.split(/[?#]/, 1)[0];
  if (!pathname.startsWith('/attachments/')) return null;
  let relative;
  try {
    relative = decodeURIComponent(pathname.slice(1));
  } catch {
    return null;
  }
  const file = path.resolve(publicDir, relative);
  return file.startsWith(`${publicDir}${path.sep}`) ? file : null;
}

export default function rehypeGraphvizInline({ publicDir = path.resolve('public') } = {}) {
  const assets = path.resolve(publicDir);
  return (tree) => {
    const visit = (parent) => {
      if (!Array.isArray(parent.children)) return;
      const children = [];
      for (const node of parent.children) {
        if (node.type === 'element' && node.tagName === 'img') {
          const file = graphvizAsset(node.properties?.src, assets);
          if (file && fs.existsSync(file)) {
            const svg = fs.readFileSync(file, 'utf8');
            if (svg.includes('data-lunadoc-graphviz="true"')) {
              const parsed = fromHtml(svg, { fragment: true });
              const diagram = parsed.children.find((child) => child.type === 'element' && child.tagName === 'svg');
              if (diagram) {
                diagram.properties = {
                  ...diagram.properties,
                  className: [...(diagram.properties?.className ?? []), 'graphviz-diagram'],
                  role: 'img',
                  ariaLabel: node.properties.alt ?? '',
                  focusable: 'false',
                };
                children.push(diagram);
                continue;
              }
            }
          }
        }
        visit(node);
        children.push(node);
      }
      parent.children = children;
    };
    visit(tree);
  };
}
