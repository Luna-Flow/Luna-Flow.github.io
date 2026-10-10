import fs from 'node:fs';
import path from 'node:path';
import { sanitizeGraphvizSvg } from '../../tools/lunadoc/src/attachments.mjs';

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

export default function rehypeGraphvizInline({
  publicDir = path.resolve('public'),
  manifestPath = path.resolve('.generated/graphviz-manifest.json'),
  generatedFiles,
} = {}) {
  const assets = path.resolve(publicDir);
  const manifest = generatedFiles instanceof Set
    ? generatedFiles
    : new Set(generatedFiles ?? (fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : []));
  let diagramIndex = 0;
  return (tree) => {
    const visit = (parent) => {
      if (!Array.isArray(parent.children)) return;
      const children = [];
      for (const node of parent.children) {
        if (node.type === 'element' && node.tagName === 'img') {
          const file = graphvizAsset(node.properties?.src, assets);
          const assetKey = file && path.relative(assets, file).split(path.sep).join('/');
          if (assetKey && manifest.has(assetKey) && fs.existsSync(file)) {
            const svg = fs.readFileSync(file, 'utf8');
            const sanitized = sanitizeGraphvizSvg(svg, `inline-${diagramIndex++}-`, node.properties.alt ?? '');
            const diagram = sanitized && {
              type: 'element',
              tagName: 'svg',
              properties: sanitized.properties,
              children: sanitized.children,
            };
            if (diagram) {
              children.push(diagram);
              continue;
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
