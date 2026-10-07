// Attachments live in doc/attachments/ and are shared by every locale.
//
//   <name>.typ               compiled to <name>.pdf
//   <name>.<locale>.typ      compiled to <name>.<locale>.pdf (locale variant)
//   <name>/main.typ          multi-file Typst project, compiled to <name>.pdf
//   <name>/main.<locale>.typ locale variant of a project
//   anything else            copied as is (images, data, prebuilt files)
//
// Pages link to the Typst source (or to the PDF path); the site resolves the
// link to the compiled PDF and picks the variant of the page's locale.

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

// Compiles every Typst attachment and copies the other files into outDir.
export function buildAttachments(docDir, outDir, options = {}) {
  const root = layout(docDir).attachments;
  const results = [];
  for (const item of listAttachments(docDir)) {
    if (item.kind === 'typst') {
      results.push({ item, ...compileTypst(docDir, item, outDir, options) });
    } else {
      const output = path.join(outDir, item.output);
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.copyFileSync(path.join(root, item.source), output);
      results.push({ item, ok: true, output });
    }
  }
  return results;
}
