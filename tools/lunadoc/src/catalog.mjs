// Gettext catalogs with GNU msgmerge semantics: translations are kept by
// msgid, changed source strings become fuzzy with `#| msgid` pointing at the
// previous text, and unused translations are kept as obsolete entries so a
// later edit can still recover them.

import fs from 'node:fs';
import path from 'node:path';
import { po } from 'gettext-parser';

const FUZZY_THRESHOLD = 0.6;

export function emptyCatalog(language = '') {
  return { language, entries: new Map(), obsolete: new Map() };
}

export function readCatalog(file) {
  if (!fs.existsSync(file)) return null;
  const data = po.parse(fs.readFileSync(file));
  const catalog = emptyCatalog(data.headers?.Language ?? '');
  for (const [context, table] of Object.entries(data.translations ?? {})) {
    for (const entry of Object.values(table)) {
      if (!entry.msgid) continue;
      catalog.entries.set(entry.msgid, fromParsed(entry, context));
    }
  }
  for (const table of Object.values(data.obsolete ?? {})) {
    for (const entry of Object.values(table)) {
      if (entry.msgid) catalog.obsolete.set(entry.msgid, fromParsed(entry, ''));
    }
  }
  return catalog;
}

function fromParsed(entry, context) {
  const flags = new Set(
    (entry.comments?.flag ?? '')
      .split(/[,\s]+/)
      .map((flag) => flag.trim())
      .filter(Boolean),
  );
  const previous = entry.comments?.previous?.match(/^msgid "(.*)"$/s)?.[1];
  return {
    msgid: entry.msgid,
    msgctxt: context || undefined,
    msgstr: entry.msgstr?.[0] ?? '',
    references: (entry.comments?.reference ?? '').split(/\s+/).filter(Boolean),
    flags,
    previous: previous ? JSON.parse(`"${previous}"`) : undefined,
    translatorComment: entry.comments?.translator,
  };
}

export function writeCatalog(file, catalog, { template = false, project = 'Luna-Flow documentation' } = {}) {
  const headers = {
    'Project-Id-Version': project,
    'Report-Msgid-Bugs-To': 'https://github.com/Luna-Flow',
    Language: template ? '' : catalog.language,
    'MIME-Version': '1.0',
    'Content-Type': 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding': '8bit',
  };
  const toParsed = (entry) => {
    const comments = {};
    if (entry.translatorComment) comments.translator = entry.translatorComment;
    if (entry.references.length) comments.reference = entry.references.join('\n');
    if (entry.flags.size) comments.flag = [...entry.flags].join(', ');
    if (entry.previous !== undefined) comments.previous = `msgid ${JSON.stringify(entry.previous)}`;
    return { msgid: entry.msgid, msgstr: [template ? '' : entry.msgstr], comments };
  };
  const translations = { '': { '': { msgid: '', msgstr: [''] } } };
  for (const entry of catalog.entries.values()) translations[''][entry.msgid] = toParsed(entry);
  const obsolete = { '': {} };
  if (!template) {
    for (const entry of catalog.obsolete.values()) obsolete[''][entry.msgid] = toParsed({ ...entry, references: [] });
  }
  const output = po.compile(
    { charset: 'utf-8', headers, translations, obsolete },
    { foldLength: 0, sort: false },
  );
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${output.toString().trimEnd()}\n`);
}

// Builds a template catalog from extracted segments, merging duplicate
// msgids into one entry with several references.
export function templateFrom(units) {
  const catalog = emptyCatalog();
  for (const { msgid, reference } of units) {
    const existing = catalog.entries.get(msgid);
    if (existing) {
      if (!existing.references.includes(reference)) existing.references.push(reference);
    } else {
      catalog.entries.set(msgid, { msgid, msgstr: '', references: [reference], flags: new Set() });
    }
  }
  return catalog;
}

function words(text) {
  return text.toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? [];
}

export function similarity(a, b) {
  if (a === b) return 1;
  const left = words(a);
  const right = words(b);
  if (!left.length || !right.length) return 0;
  const counts = new Map();
  for (const word of left) counts.set(word, (counts.get(word) ?? 0) + 1);
  let common = 0;
  for (const word of right) {
    const count = counts.get(word) ?? 0;
    if (count > 0) {
      common += 1;
      counts.set(word, count - 1);
    }
  }
  return (2 * common) / (left.length + right.length);
}

// Merges `template` into the existing translation catalog `old`.
export function mergeCatalog(template, old, language) {
  const merged = emptyCatalog(language);
  const pool = new Map();
  for (const entry of old?.entries.values() ?? []) {
    if (!template.entries.has(entry.msgid) && entry.msgstr) pool.set(entry.msgid, entry);
  }
  for (const entry of old?.obsolete.values() ?? []) {
    if (!template.entries.has(entry.msgid) && entry.msgstr && !pool.has(entry.msgid)) pool.set(entry.msgid, entry);
  }

  for (const source of template.entries.values()) {
    const kept = old?.entries.get(source.msgid) ?? old?.obsolete.get(source.msgid);
    if (kept) {
      merged.entries.set(source.msgid, {
        ...source,
        msgstr: kept.msgstr,
        flags: new Set(kept.flags),
        previous: kept.flags.has('fuzzy') ? kept.previous : undefined,
        translatorComment: kept.translatorComment,
      });
      continue;
    }
    let best = null;
    let bestScore = FUZZY_THRESHOLD;
    for (const candidate of pool.values()) {
      const score = similarity(source.msgid, candidate.msgid);
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
    if (best) {
      merged.entries.set(source.msgid, {
        ...source,
        msgstr: best.msgstr,
        flags: new Set([...best.flags, 'fuzzy']),
        previous: best.msgid,
        translatorComment: best.translatorComment,
      });
    } else {
      merged.entries.set(source.msgid, { ...source, msgstr: '', flags: new Set(source.flags) });
    }
  }

  for (const entry of pool.values()) {
    const used = [...merged.entries.values()].some((item) => item.previous === entry.msgid);
    if (!used) merged.obsolete.set(entry.msgid, { ...entry, references: [] });
  }
  return merged;
}

// The lookup used for rendering: only finished, non-fuzzy translations.
export function translator(catalog) {
  return (msgid) => {
    const entry = catalog?.entries.get(msgid);
    if (!entry || !entry.msgstr || entry.flags.has('fuzzy')) return undefined;
    return entry.msgstr;
  };
}
