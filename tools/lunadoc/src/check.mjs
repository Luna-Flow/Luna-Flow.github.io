// Validates one documentation tree. Errors fail CI; warnings are reported.

import fs from 'node:fs';
import path from 'node:path';
import { readCatalog } from './catalog.mjs';
import { compileTypst, listAttachments, resolveAttachment } from './attachments.mjs';
import { extractTemplate, layout, listPages, readConf, readPage, SOURCE_LOCALE } from './layout.mjs';
import { findLinks, isExternal, splitHash } from './links.mjs';

const LEGACY_LOCALE_DIR = /^[a-z]{2}_[A-Z]{2}$/;

export function check(docDir, { compile = false, repoRoot = path.dirname(docDir) } = {}) {
  const errors = [];
  const warnings = [];
  const paths = layout(docDir);

  if (!fs.existsSync(paths.conf)) errors.push('doc/conf.json is missing');
  let conf;
  try {
    conf = readConf(docDir);
  } catch (error) {
    errors.push(`doc/conf.json is not valid JSON: ${error.message}`);
    return { errors, warnings };
  }
  if (!conf.summary) warnings.push('doc/conf.json has no summary');
  if (!fs.existsSync(path.join(paths.manual, 'index.md'))) errors.push('doc/manual/index.md is missing');
  for (const entry of fs.existsSync(docDir) ? fs.readdirSync(docDir) : []) {
    if (LEGACY_LOCALE_DIR.test(entry)) errors.push(`doc/${entry}/ uses the retired per-locale layout`);
  }

  // Catalogs must match the current source.
  const template = extractTemplate(docDir);
  const pot = readCatalog(paths.pot);
  const sameKeys = (catalog) =>
    catalog &&
    catalog.entries.size === template.entries.size &&
    [...template.entries.keys()].every((msgid) => catalog.entries.has(msgid));
  if (!sameKeys(pot)) errors.push('doc/locale/manual.pot is out of date: run `lunadoc update`');
  for (const locale of conf.locales) {
    if (locale === SOURCE_LOCALE) continue;
    const catalog = readCatalog(paths.po(locale));
    if (!catalog) {
      errors.push(`doc/locale/${locale}/LC_MESSAGES/manual.po is missing: run \`lunadoc update\``);
      continue;
    }
    if (!sameKeys(catalog)) errors.push(`${locale} catalog is out of date: run \`lunadoc update\``);
    const fuzzy = [...catalog.entries.values()].filter((entry) => entry.flags.has('fuzzy')).length;
    if (fuzzy) warnings.push(`${locale}: ${fuzzy} fuzzy messages need review`);
  }

  // Links and attachments.
  const attachments = listAttachments(docDir);
  const pages = new Set(listPages(docDir));
  for (const page of pages) {
    const source = readPage(docDir, page);
    for (const link of findLinks(source)) {
      if (isExternal(link.url)) continue;
      const [target] = splitHash(link.url);
      if (!target) continue;
      const absolute = path.resolve(path.dirname(path.join(paths.manual, page)), decodeURIComponent(target));
      const where = `manual/${page}:${link.line}`;
      const inAttachments = path.relative(paths.attachments, absolute);
      if (!inAttachments.startsWith('..')) {
        const rel = inAttachments.split(path.sep).join('/');
        if (!resolveAttachment(attachments, rel, SOURCE_LOCALE)) errors.push(`${where}: missing attachment ${link.url}`);
        continue;
      }
      if (fs.existsSync(absolute)) {
        if (fs.statSync(absolute).isDirectory() && !fs.existsSync(path.join(absolute, 'index.md'))) {
          warnings.push(`${where}: directory link without index.md: ${link.url}`);
        }
        if (path.relative(repoRoot, absolute).startsWith('..')) errors.push(`${where}: link leaves the repository: ${link.url}`);
        continue;
      }
      errors.push(`${where}: broken link ${link.url}`);
    }
  }

  if (compile) {
    const scratch = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR ?? '/tmp'), 'lunadoc-'));
    for (const item of attachments.filter((entry) => entry.kind === 'typst')) {
      const result = compileTypst(docDir, item, scratch);
      if (!result.ok) errors.push(`attachments/${item.source} does not compile:\n${result.message}`);
    }
    fs.rmSync(scratch, { recursive: true, force: true });
  }

  return { errors, warnings };
}
