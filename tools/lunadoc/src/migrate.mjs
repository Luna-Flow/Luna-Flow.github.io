// One-off migration from the retired per-locale layout
// (doc/en_US, doc/zh_CN, doc/ja_JP, loose files in doc/) to the gettext
// layout. English pages become doc/manual, existing translations are aligned
// block by block into the locale catalogs, and loose files become
// attachments. Pages that exist only in a translation are parked in
// doc/_unmigrated/<locale>/ for a human to translate into English.

import fs from 'node:fs';
import path from 'node:path';
import { emptyCatalog, mergeCatalog, writeCatalog } from './catalog.mjs';
import { DEFAULT_LOCALES, extractTemplate, layout, SOURCE_LOCALE, walkFiles } from './layout.mjs';
import { findLinks, isExternal, rewriteLinks, splitHash } from './links.mjs';
import { extractSegments } from './markdown.mjs';

const LEGACY = /^[a-z]{2}_[A-Z]{2}$/;

export const DOC_TYPES = ['api', 'design', 'tutorial', 'conformance', 'performance', 'integration'];

// Old pages lived as <package>/<type>.md; the manual groups them by type:
// <type>/<package>.md, so API, Design and Tutorial are the top-level chapters.
export function pageName(rel) {
  if (rel === 'README.md') return 'index.md';
  if (rel === 'doc_standard.md') return 'conventions.md';
  const parts = rel.split('/');
  const file = parts.pop().replace(/\.md$/, '');
  if (parts.length && DOC_TYPES.includes(file)) return `${file}/${parts.join('/')}.md`;
  return rel;
}

// A link to an old package directory now goes to that package's API page.
function packagePage(inner, files) {
  const dir = inner.replace(/\/$/, '');
  for (const type of DOC_TYPES) if (files.has(`${dir}/${type}.md`)) return `${type}/${dir}.md`;
  return null;
}

function readModuleSummary(repoRoot) {
  for (const file of ['moon.mod', 'moon.mod.json']) {
    const full = path.join(repoRoot, file);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, 'utf8');
    if (file.endsWith('.json')) return JSON.parse(text).description ?? '';
    return text.match(/^description\s*=\s*"((?:[^"\\]|\\.)*)"/m)?.[1] ?? '';
  }
  return '';
}

// Maps an absolute legacy path to its absolute new path (or itself).
function makeMapper(repoRoot) {
  const docDir = path.join(repoRoot, 'doc');
  const paths = layout(docDir);
  // Snapshot before the legacy tree is removed.
  const directories = new Set(
    walkFiles(docDir).flatMap((file) => {
      const parts = file.split('/');
      return parts.slice(0, -1).map((_, i) => path.join(docDir, ...parts.slice(0, i + 1)));
    }),
  );
  const legacyFiles = new Map(
    fs.readdirSync(docDir)
      .filter((entry) => LEGACY.test(entry))
      .map((entry) => [entry, new Set(walkFiles(path.join(docDir, entry)))]),
  );
  return (absolute) => {
    const rel = path.relative(docDir, absolute).split(path.sep).join('/');
    if (rel.startsWith('..')) return absolute;
    const [head, ...rest] = rel.split('/');
    if (LEGACY.test(head)) {
      const inner = rest.join('/');
      if (!inner) return paths.manual;
      const isMarkdown = inner.endsWith('.md');
      const isDirectory = directories.has(absolute.replace(/\/$/, ''));
      if (isMarkdown) return path.join(paths.manual, pageName(inner));
      if (isDirectory) {
        const target = packagePage(inner, legacyFiles.get(head) ?? new Set());
        return path.join(paths.manual, target ?? inner);
      }
      return path.join(paths.attachments, inner);
    }
    if (rest.length === 0 && head.endsWith('.md')) return path.join(paths.manual, head);
    if (rest.length === 0 && head.endsWith('.pdf')) {
      const typst = path.join(paths.attachments, head.replace(/\.pdf$/, '.typ'));
      if (fs.existsSync(path.join(docDir, head.replace(/\.pdf$/, '.typ')))) return typst;
    }
    if (head !== 'manual' && head !== 'attachments' && head !== 'locale' && head !== 'conf.json') {
      return path.join(paths.attachments, rel);
    }
    return absolute;
  };
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function rewriteFor(source, oldFile, newFile, mapPath) {
  return rewriteLinks(source, (url) => {
    if (isExternal(url)) return undefined;
    const [target, hash] = splitHash(url);
    if (!target) return undefined;
    let decoded;
    try {
      decoded = decodeURIComponent(target);
    } catch {
      decoded = target;
    }
    const mapped = mapPath(path.resolve(path.dirname(oldFile), decoded));
    let relative = toPosix(path.relative(path.dirname(newFile), mapped)) || '.';
    if (!relative.startsWith('.')) relative = `./${relative}`;
    if (relative.startsWith('./') && !target.startsWith('./')) relative = relative.slice(2);
    return encodeURI(relative) + hash;
  });
}

function signature(msgid) {
  const marks = [
    ...(msgid.match(/`[^`]+`/g) ?? []),
    ...(msgid.match(/\]\([^)]*\)/g) ?? []),
    ...(msgid.match(/\$[^$]+\$/g) ?? []),
    ...(msgid.match(/\b\d+(\.\d+)?\b/g) ?? []),
  ];
  return new Set(marks);
}

function overlap(a, b) {
  if (!a.size && !b.size) return 0.5;
  let common = 0;
  for (const item of a) if (b.has(item)) common += 1;
  return common / (a.size + b.size - common);
}

// Aligns English segments with translated segments of the same page.
// Returns [{ msgid, msgstr, fuzzy }].
export function alignSegments(english, translated) {
  const pairs = [];
  const fm = (list) => list.filter((segment) => segment.kind === 'frontmatter');
  for (const segment of fm(english)) {
    const match = fm(translated).find((other) => other.key === segment.key);
    if (match && match.msgid !== segment.msgid) pairs.push({ msgid: segment.msgid, msgstr: match.msgid, fuzzy: false });
  }

  const left = english.filter((segment) => segment.kind !== 'frontmatter');
  const right = translated.filter((segment) => segment.kind !== 'frontmatter');
  const sameShape = left.length === right.length && left.every((segment, i) => segment.kind === right[i].kind);
  const n = left.length;
  const m = right.length;
  const score = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
  const sigLeft = left.map((segment) => signature(segment.msgid));
  const sigRight = right.map((segment) => signature(segment.msgid));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      let best = Math.max(score[i + 1][j], score[i][j + 1]);
      if (left[i].kind === right[j].kind) best = Math.max(best, 1 + overlap(sigLeft[i], sigRight[j]) + score[i + 1][j + 1]);
      score[i][j] = best;
    }
  }
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    const evidence = overlap(sigLeft[i], sigRight[j]);
    if (left[i].kind === right[j].kind && score[i][j] === 1 + evidence + score[i + 1][j + 1]) {
      if (left[i].msgid !== right[j].msgid) {
        // Without shared marks (code, links, math, numbers) a pairing is only
        // trustworthy when both pages have exactly the same shape.
        const marked = sigLeft[i].size > 0 || sigRight[j].size > 0;
        // With marks, disagreeing marks mean the wrong paragraph even when the
        // shapes match.
        pairs.push({ msgid: left[i].msgid, msgstr: right[j].msgid, fuzzy: marked ? evidence < 0.5 : !sameShape });
      }
      i += 1;
      j += 1;
    } else if (score[i][j] === score[i + 1][j]) {
      i += 1;
    } else {
      j += 1;
    }
  }
  return pairs;
}

export function migrate(repoRoot, { log = () => {} } = {}) {
  const docDir = path.join(repoRoot, 'doc');
  const paths = layout(docDir);
  if (!fs.existsSync(path.join(docDir, SOURCE_LOCALE))) {
    throw new Error(`${repoRoot}: doc/${SOURCE_LOCALE} not found; nothing to migrate`);
  }
  const report = { pages: 0, attachments: [], unmigrated: [], locales: {}, rootLinks: [] };
  const mapPath = makeMapper(repoRoot);
  const entries = fs.readdirSync(docDir);
  const legacyLocales = entries.filter((entry) => LEGACY.test(entry) && entry !== SOURCE_LOCALE);

  // English pages and their non-Markdown neighbours.
  const englishDir = path.join(docDir, SOURCE_LOCALE);
  const writes = [];
  for (const rel of walkFiles(englishDir)) {
    const oldFile = path.join(englishDir, rel);
    const newFile = mapPath(oldFile);
    if (rel.endsWith('.md')) {
      writes.push([newFile, rewriteFor(fs.readFileSync(oldFile, 'utf8'), oldFile, newFile, mapPath)]);
      report.pages += 1;
    } else {
      writes.push([newFile, fs.readFileSync(oldFile)]);
      report.attachments.push(toPosix(path.relative(docDir, newFile)));
    }
  }

  // Loose files directly under doc/.
  for (const entry of entries) {
    const full = path.join(docDir, entry);
    if (LEGACY.test(entry) || ['manual', 'attachments', 'locale', 'conf.json', '_unmigrated'].includes(entry)) continue;
    if (fs.statSync(full).isDirectory()) {
      for (const rel of walkFiles(full)) {
        const oldFile = path.join(full, rel);
        writes.push([mapPath(oldFile), fs.readFileSync(oldFile)]);
        report.attachments.push(toPosix(path.relative(docDir, mapPath(oldFile))));
      }
      continue;
    }
    if (entry.endsWith('.pdf') && fs.existsSync(path.join(docDir, entry.replace(/\.pdf$/, '.typ')))) {
      report.attachments.push(`dropped doc/${entry}: rebuilt from its Typst source`);
      continue;
    }
    const newFile = mapPath(full);
    if (entry.endsWith('.md')) {
      writes.push([newFile, rewriteFor(fs.readFileSync(full, 'utf8'), full, newFile, mapPath)]);
      report.pages += 1;
    } else {
      writes.push([newFile, fs.readFileSync(full)]);
      report.attachments.push(toPosix(path.relative(docDir, newFile)));
    }
  }

  // Translations, rewritten as if they lived at the English location.
  const translations = {};
  for (const locale of legacyLocales) {
    const localeDir = path.join(docDir, locale);
    translations[locale] = [];
    for (const rel of walkFiles(localeDir)) {
      const oldFile = path.join(localeDir, rel);
      const englishTwin = path.join(englishDir, rel);
      if (!rel.endsWith('.md')) continue;
      if (!fs.existsSync(englishTwin)) {
        const parked = path.join(docDir, '_unmigrated', locale, rel);
        writes.push([parked, fs.readFileSync(oldFile)]);
        report.unmigrated.push(`${locale}/${rel}`);
        continue;
      }
      const newFile = mapPath(englishTwin);
      translations[locale].push({ newFile, text: rewriteFor(fs.readFileSync(oldFile, 'utf8'), oldFile, newFile, mapPath) });
    }
  }

  // Apply: drop the legacy tree, write the new one.
  for (const entry of entries) {
    const full = path.join(docDir, entry);
    if (['manual', 'attachments', 'locale', 'conf.json', '_unmigrated'].includes(entry)) continue;
    fs.rmSync(full, { recursive: true, force: true });
  }
  for (const [file, content] of writes) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }

  if (!fs.existsSync(paths.conf)) {
    const conf = {
      title: path.basename(repoRoot),
      summary: readModuleSummary(repoRoot),
      locales: DEFAULT_LOCALES.filter((locale) => legacyLocales.includes(locale)).concat(legacyLocales.filter((locale) => !DEFAULT_LOCALES.includes(locale))),
    };
    fs.writeFileSync(paths.conf, `${JSON.stringify(conf, null, 2)}\n`);
  }

  // Catalogs from aligned translations.
  const template = extractTemplate(docDir);
  writeCatalog(paths.pot, template, { template: true });
  for (const locale of legacyLocales) {
    const aligned = emptyCatalog(locale);
    let fuzzy = 0;
    for (const { newFile, text } of translations[locale]) {
      const english = extractSegments(fs.readFileSync(newFile, 'utf8'));
      for (const pair of alignSegments(english, extractSegments(text))) {
        if (aligned.entries.has(pair.msgid)) continue;
        if (pair.fuzzy) fuzzy += 1;
        aligned.entries.set(pair.msgid, {
          msgid: pair.msgid,
          msgstr: pair.msgstr,
          references: [],
          flags: new Set(pair.fuzzy ? ['fuzzy'] : []),
        });
      }
    }
    const merged = mergeCatalog(template, aligned, locale);
    merged.obsolete.clear();
    writeCatalog(paths.po(locale), merged);
    const translated = [...merged.entries.values()].filter((entry) => entry.msgstr && !entry.flags.has('fuzzy')).length;
    report.locales[locale] = { total: merged.entries.size, translated, fuzzy };
  }

  // Repository-level Markdown that pointed into the old tree.
  for (const rel of walkFiles(repoRoot, (name) => name.endsWith('.md'))) {
    if (rel.startsWith('doc/') || rel.includes('node_modules/') || rel.startsWith('_build/') || rel.startsWith('.mooncakes/')) continue;
    const file = path.join(repoRoot, rel);
    const source = fs.readFileSync(file, 'utf8');
    if (!findLinks(source).some((link) => /(^|\/)doc\//.test(link.url))) continue;
    const next = rewriteFor(source, file, file, mapPath);
    if (next !== source) {
      fs.writeFileSync(file, next);
      report.rootLinks.push(rel);
    }
  }

  log(report);
  return report;
}
