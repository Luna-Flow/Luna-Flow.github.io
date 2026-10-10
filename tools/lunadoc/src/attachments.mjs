// Attachments live in doc/attachments/ and are shared by every locale.
//
//   <name>.typ               compiled to <name>.pdf
//   <name>.<locale>.typ      compiled to <name>.<locale>.pdf (locale variant)
//   <name>/main.typ          multi-file Typst project, compiled to <name>.pdf
//   <name>/main.<locale>.typ locale variant of a project
//   <name>.dot               compiled to <name>.svg
//   <name>.<locale>.dot      compiled to <name>.<locale>.svg (locale variant)
//   anything else            copied as is (images, data, prebuilt files)
//
// Pages link to the Typst or DOT source (or to the compiled output); the site
// resolves the link to the generated PDF or SVG and picks the page's locale.

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fromHtml } from 'hast-util-from-html';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { layout, walkFiles } from './layout.mjs';

const LOCALE_SUFFIX = /\.([a-z]{2}_[A-Z]{2})$/;

export function listAttachments(docDir) {
  const root = layout(docDir).attachments;
  const files = walkFiles(root);
  const projects = new Set(
    files
      .map((file) => file.match(/^(.+)\/main(\.[a-z]{2}_[A-Z]{2})?\.typ$/)?.[1])
      .filter(Boolean),
  );
  const items = [];
  for (const file of files) {
    const project = file.match(/^(.+)\/main(?:\.([a-z]{2}_[A-Z]{2}))?\.typ$/);
    if (project) {
      const [, name, locale = null] = project;
      items.push({ kind: 'typst', source: file, name, locale, output: `${name}${locale ? `.${locale}` : ''}.pdf` });
      continue;
    }
    if ([...projects].some((name) => file.startsWith(`${name}/`))) continue;
    if (file.endsWith('.dot')) {
      const stem = file.slice(0, -4);
      const locale = stem.match(LOCALE_SUFFIX)?.[1] ?? null;
      const name = locale ? stem.slice(0, -locale.length - 1) : stem;
      items.push({ kind: 'graphviz', source: file, name, locale, output: `${stem}.svg` });
      continue;
    }
    if (file.endsWith('.typ')) {
      const stem = file.slice(0, -4);
      const locale = stem.match(LOCALE_SUFFIX)?.[1] ?? null;
      const name = locale ? stem.slice(0, -locale.length - 1) : stem;
      items.push({ kind: 'typst', source: file, name, locale, output: `${stem}.pdf` });
      continue;
    }
    items.push({ kind: 'file', source: file, name: file, locale: null, output: file });
  }
  return items;
}

export function findAttachmentCollisions(items) {
  const byOutput = new Map();
  const collisions = [];
  for (const item of items) {
    const previous = byOutput.get(item.output);
    if (previous) collisions.push({ output: item.output, sources: [previous.source, item.source] });
    else byOutput.set(item.output, item);
  }
  return collisions;
}

// The published path a link inside the manual resolves to, or null when it
// does not point into attachments. `target` is relative to doc/attachments.
export function resolveAttachment(items, target, locale) {
  if (target.endsWith('.dot')) {
    const stem = target.slice(0, -4);
    const wanted = stem.match(LOCALE_SUFFIX)?.[1] ?? locale;
    const name = stem.replace(LOCALE_SUFFIX, '');
    const graphviz = items.filter((item) => item.kind === 'graphviz' && item.name === name);
    if (graphviz.length) {
      const pick = graphviz.find((item) => item.locale === wanted) ?? graphviz.find((item) => item.locale === null) ?? graphviz[0];
      return { ...pick, svg: true };
    }
  }
  const clean = target.replace(/\/main(\.[a-z]{2}_[A-Z]{2})?\.typ$/, '').replace(/\.(typ|pdf)$/, '');
  const typst = items.filter((item) => item.kind === 'typst' && item.name === clean.replace(LOCALE_SUFFIX, ''));
  if (typst.length) {
    const wanted = clean.match(LOCALE_SUFFIX)?.[1] ?? locale;
    const pick = typst.find((item) => item.locale === wanted) ?? typst.find((item) => item.locale === null) ?? typst[0];
    return { ...pick, pdf: true };
  }
  const file = items.find((item) => item.kind === 'file' && item.source === target);
  return file ? { ...file, pdf: file.source.endsWith('.pdf') } : null;
}

export function compileTypst(docDir, item, outDir, { typst = process.env.TYPST ?? 'typst' } = {}) {
  const root = layout(docDir).attachments;
  const output = path.join(outDir, item.output);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const result = spawnSync(typst, ['compile', '--root', root, path.join(root, item.source), output], {
    encoding: 'utf8',
  });
  if (result.error) return { ok: false, message: `cannot run ${typst}: ${result.error.message}` };
  if (result.status !== 0) return { ok: false, message: (result.stderr || result.stdout).trim() };
  return { ok: true, output };
}

const SVG_ELEMENTS = new Set([
  'svg', 'g', 'title', 'desc', 'ellipse', 'polygon', 'path', 'polyline', 'rect', 'text', 'tspan',
  'defs', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'marker', 'a',
]);
const SVG_ATTRIBUTES = new Set([
  'xmlns', 'xmlns:xlink', 'viewBox', 'width', 'height', 'version', 'preserveAspectRatio', 'id', 'class', 'transform',
  'fill', 'fill-rule', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray',
  'stroke-dashoffset', 'stroke-opacity', 'opacity', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor',
  'xml:space', 'x', 'y', 'cx', 'cy', 'rx', 'ry', 'r', 'x1', 'y1', 'x2', 'y2', 'd', 'points', 'offset', 'stop-color',
  'stop-opacity', 'gradientUnits', 'gradientTransform', 'marker-start', 'marker-mid', 'marker-end', 'clip-path', 'clip-rule',
  'href', 'xlink:href', 'role', 'aria-label', 'focusable',
]);
const URL_ATTRIBUTES = new Set(['fill', 'stroke', 'clip-path', 'marker-start', 'marker-mid', 'marker-end']);

function safeSvgHref(value) {
  return typeof value === 'string' && (/^https?:\/\//i.test(value) || value.startsWith('#'));
}

function mapSvgTree(root, prefix, { theme = false, accessibleLabel } = {}) {
  const ids = new Map();
  const collect = (node) => {
    if (node.nodeType !== 1) return;
    const id = node.getAttribute('id');
    if (id) ids.set(id, `${prefix}${id}`);
    for (let child = node.firstChild; child; child = child.nextSibling) collect(child);
  };
  collect(root);
  const clean = (node, rootNode = false) => {
    if (node.nodeType === 3 || node.nodeType === 4) return node.ownerDocument.createTextNode(node.data);
    if (node.nodeType !== 1 || !SVG_ELEMENTS.has(node.tagName)) return null;
    const element = node.ownerDocument.createElementNS(node.namespaceURI, node.tagName);
    for (let i = 0; i < node.attributes.length; i += 1) {
      const attr = node.attributes.item(i);
      const name = attr.name;
      if (!SVG_ATTRIBUTES.has(name) || /^on/i.test(name) || name === 'style' || name === 'src') continue;
      let value = attr.value;
      if (name === 'id') value = ids.get(value) ?? `${prefix}${value}`;
      if (name === 'href' || name === 'xlink:href') {
        if (!safeSvgHref(value)) continue;
        if (value.startsWith('#')) value = `#${ids.get(value.slice(1)) ?? `${prefix}${value.slice(1)}`}`;
      }
      if (URL_ATTRIBUTES.has(name) && /url\(/i.test(value)) {
        const urls = [...value.matchAll(/url\(([^)]+)\)/gi)];
        if (urls.some(([, target]) => !target.trim().replace(/^['"]|['"]$/g, '').startsWith('#'))) continue;
        value = value.replace(/url\(#([^)]+)\)/g, (_match, id) => `url(#${ids.get(id) ?? `${prefix}${id}`})`);
      }
      if (theme && name === 'stroke' && /^(?:black|#000000?)$/i.test(value)) value = 'currentColor';
      if (theme && name === 'fill' && /^(?:black|#000000?)$/i.test(value) && node.tagName === 'text') value = 'currentColor';
      element.setAttribute(name, value);
    }
    if (theme && node.tagName === 'text' && !element.hasAttribute('fill')) element.setAttribute('fill', 'currentColor');
    if (rootNode) {
      if (!element.getAttribute('id')) element.setAttribute('id', `${prefix}root`);
      if (theme) element.setAttribute('color', 'inherit');
      if (accessibleLabel !== undefined) {
        element.setAttribute('role', 'img');
        element.setAttribute('aria-label', accessibleLabel);
        element.setAttribute('focusable', 'false');
        element.setAttribute('class', `${element.getAttribute('class') ?? ''} graphviz-diagram`.trim());
      }
      element.setAttribute('data-lunadoc-graphviz', 'true');
    }
    for (let child = node.firstChild; child; child = child.nextSibling) {
      const sanitized = clean(child);
      if (sanitized) element.appendChild(sanitized);
    }
    return element;
  };
  return clean(root, true);
}

export function themeGraphvizSvg(svg, source = '') {
  const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = document.documentElement;
  if (!root || root.tagName !== 'svg') throw new Error('Graphviz output does not contain an SVG root element');
  const prefix = `lf-${createHash('sha256').update(source).digest('hex').slice(0, 10)}-`;
  return new XMLSerializer().serializeToString(mapSvgTree(root, prefix, { theme: true }));
}

export function sanitizeGraphvizSvg(svg, prefix, accessibleLabel) {
  const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = document.documentElement;
  if (!root || root.tagName !== 'svg') return null;
  const output = new XMLSerializer().serializeToString(mapSvgTree(root, prefix, { accessibleLabel }));
  return fromHtml(output, { fragment: true }).children.find((child) => child.type === 'element' && child.tagName === 'svg') ?? null;
}

export function compileGraphviz(docDir, item, outDir, {
  dot = process.env.GRAPHVIZ_DOT ?? 'dot',
  maxBuffer = 64 * 1024 * 1024,
  timeout = 30_000,
} = {}) {
  const root = layout(docDir).attachments;
  const output = path.join(outDir, item.output);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const result = spawnSync(dot, ['-Tsvg', '-Gbgcolor=transparent', path.join(root, item.source)], {
    encoding: 'utf8',
    maxBuffer,
    timeout,
  });
  if (result.error?.code === 'ETIMEDOUT') return { ok: false, message: `${dot} timed out after ${timeout} ms` };
  if (result.error?.code === 'ENOBUFS') return { ok: false, message: `${dot} output exceeded the ${maxBuffer}-byte limit` };
  if (result.error) return { ok: false, message: `cannot run ${dot}: ${result.error.message}` };
  if (result.status !== 0) {
    const details = [result.stderr?.trim(), result.stdout?.trim()].filter(Boolean).join('\n');
    return { ok: false, message: details || `${dot} exited with status ${result.status}` };
  }
  fs.writeFileSync(output, themeGraphvizSvg(result.stdout, item.source));
  return { ok: true, output, warnings: result.stderr?.trim() || undefined };
}

// Compiles Typst and Graphviz attachments and copies other files into outDir.
export function buildAttachments(docDir, outDir, options = {}) {
  const root = layout(docDir).attachments;
  const results = [];
  const items = listAttachments(docDir);
  const collisions = findAttachmentCollisions(items);
  if (collisions.length) {
    const details = collisions.map(({ output, sources }) => `${sources.join(' and ')} both produce ${output}`).join('; ');
    throw new Error(`attachment output collision: ${details}`);
  }
  for (const item of items) {
    if (item.kind === 'typst') {
      results.push({ item, ...compileTypst(docDir, item, outDir, options) });
    } else if (item.kind === 'graphviz') {
      results.push({ item, ...compileGraphviz(docDir, item, outDir, options) });
    } else {
      const output = path.join(outDir, item.output);
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.copyFileSync(path.join(root, item.source), output);
      results.push({ item, ok: true, output });
    }
  }
  return results;
}
