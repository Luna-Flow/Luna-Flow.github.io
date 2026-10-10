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
import { spawnSync } from 'node:child_process';
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

export function themeGraphvizSvg(svg) {
  return svg
    .replace(/\b(fill|stroke)="(?:black|#000(?:000)?)"/gi, '$1="currentColor"')
    .replace(/<svg\b([^>]*)>/, (_, attributes) => {
      const clean = attributes.replace(/\sdata-lunadoc-graphviz="[^"]*"/, '').replace(/\sstyle="[^"]*"/, '');
      return `<svg${clean} data-lunadoc-graphviz="true" style="color: inherit;">`;
    })
    .replace(/<text\b([^>]*)>/g, (_, attributes) =>
      /\bfill=/.test(attributes) ? `<text${attributes}>` : `<text fill="currentColor"${attributes}>`,
    );
}

export function compileGraphviz(docDir, item, outDir, { dot = process.env.GRAPHVIZ_DOT ?? 'dot' } = {}) {
  const root = layout(docDir).attachments;
  const output = path.join(outDir, item.output);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const result = spawnSync(dot, ['-Tsvg', '-Gbgcolor=transparent', path.join(root, item.source)], {
    encoding: 'utf8',
  });
  if (result.error) return { ok: false, message: `cannot run ${dot}: ${result.error.message}` };
  if (result.status !== 0) return { ok: false, message: (result.stderr || result.stdout).trim() };
  fs.writeFileSync(output, themeGraphvizSvg(result.stdout));
  return { ok: true, output };
}

// Compiles Typst and Graphviz attachments and copies other files into outDir.
export function buildAttachments(docDir, outDir, options = {}) {
  const root = layout(docDir).attachments;
  const results = [];
  for (const item of listAttachments(docDir)) {
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
