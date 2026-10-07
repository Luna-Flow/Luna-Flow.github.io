// The documentation layout of one repository (or of the site itself):
//
//   doc/
//     conf.json                      title, summary, locales
//     manual/                        English source pages (canonical)
//     attachments/                   locale-neutral files and Typst sources
//     locale/manual.pot              generated template
//     locale/<locale>/LC_MESSAGES/manual.po

import fs from 'node:fs';
import path from 'node:path';
import { extractSegments, headingSlugs, renderTranslated } from './markdown.mjs';
import { mergeCatalog, readCatalog, templateFrom, translator, writeCatalog } from './catalog.mjs';

export const SOURCE_LOCALE = 'en_US';
export const DEFAULT_LOCALES = ['zh_CN', 'ja_JP'];
export const DOMAIN = 'manual';
export const CONF_KEYS = ['summary'];

export function layout(docDir) {
  return {
    docDir,
    conf: path.join(docDir, 'conf.json'),
    manual: path.join(docDir, 'manual'),
    attachments: path.join(docDir, 'attachments'),
    locale: path.join(docDir, 'locale'),
    pot: path.join(docDir, 'locale', `${DOMAIN}.pot`),
    po: (locale) => path.join(docDir, 'locale', locale, 'LC_MESSAGES', `${DOMAIN}.po`),
  };
}

export function readConf(docDir) {
  const paths = layout(docDir);
  const raw = fs.existsSync(paths.conf) ? JSON.parse(fs.readFileSync(paths.conf, 'utf8')) : {};
  return {
    title: raw.title ?? path.basename(path.dirname(docDir)),
    summary: raw.summary ?? '',
    locales: raw.locales ?? DEFAULT_LOCALES,
    order: raw.order ?? [],
    strings: raw.strings ?? {},
    ...raw,
  };
}

export function walkFiles(dir, filter = () => true, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // Symbolic links point at files owned elsewhere (and may dangle after a
    // migration), so they are never part of a documentation tree.
    if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, filter, base));
    else if (filter(entry.name)) out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out.sort();
}

export function listPages(docDir) {
  return walkFiles(layout(docDir).manual, (name) => name.endsWith('.md'));
}

export function readPage(docDir, page) {
  return fs.readFileSync(path.join(layout(docDir).manual, page), 'utf8');
}

// All messages of the domain, in a stable order: conf.json first, then pages.
export function extractUnits(docDir) {
  const conf = readConf(docDir);
  const units = [];
  for (const key of CONF_KEYS) {
    if (typeof conf[key] === 'string' && conf[key].trim()) {
      units.push({ msgid: conf[key].trim(), reference: `conf.json:${key}` });
    }
  }
  for (const [key, text] of Object.entries(conf.strings ?? {})) {
    if (typeof text === 'string' && text.trim()) units.push({ msgid: text.trim(), reference: `conf.json:strings.${key}` });
  }
  for (const page of listPages(docDir)) {
    for (const segment of extractSegments(readPage(docDir, page))) {
      units.push({ msgid: segment.msgid, reference: `manual/${page}:${segment.line}` });
    }
  }
  return units;
}

export function extractTemplate(docDir) {
  return templateFrom(extractUnits(docDir));
}

// Regenerates the template and merges it into every locale catalog.
export function update(docDir, { project } = {}) {
  const paths = layout(docDir);
  const conf = readConf(docDir);
  const template = extractTemplate(docDir);
  writeCatalog(paths.pot, template, { template: true, project });
  const report = [];
  for (const locale of conf.locales) {
    const merged = mergeCatalog(template, readCatalog(paths.po(locale)), locale);
    writeCatalog(paths.po(locale), merged, { project });
    report.push({ locale, ...coverageOf(merged) });
  }
  return report;
}

export function coverageOf(catalog) {
  let translated = 0;
  let fuzzy = 0;
  for (const entry of catalog.entries.values()) {
    if (entry.msgstr && entry.flags.has('fuzzy')) fuzzy += 1;
    else if (entry.msgstr) translated += 1;
  }
  const total = catalog.entries.size;
  return { total, translated, fuzzy, untranslated: total - translated - fuzzy };
}

export function loadCatalog(docDir, locale) {
  if (locale === SOURCE_LOCALE) return null;
  return readCatalog(layout(docDir).po(locale));
}

// Renders one page for `locale`. The English source is returned unchanged.
export function renderPage(docDir, page, locale, catalog = loadCatalog(docDir, locale)) {
  const source = readPage(docDir, page);
  const headings = headingSlugs(source);
  if (locale === SOURCE_LOCALE) {
    const total = extractSegments(source).length;
    return { markdown: source, total, translated: total, headings };
  }
  return { ...renderTranslated(source, translator(catalog)), headings };
}

export function translateConf(docDir, locale, catalog = loadCatalog(docDir, locale)) {
  const conf = readConf(docDir);
  if (locale === SOURCE_LOCALE) return conf;
  const lookup = translator(catalog);
  const out = { ...conf };
  for (const key of CONF_KEYS) {
    if (typeof conf[key] === 'string') out[key] = lookup(conf[key].trim()) ?? conf[key];
  }
  out.strings = Object.fromEntries(
    Object.entries(conf.strings ?? {}).map(([key, text]) => [key, lookup(String(text).trim()) ?? text]),
  );
  return out;
}
