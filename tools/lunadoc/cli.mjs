#!/usr/bin/env node
// lunadoc: gettext workflow and checks for Luna-Flow documentation.

import path from 'node:path';
import process from 'node:process';
import {
  buildAttachments,
  check,
  coverageOf,
  extractSegments,
  layout,
  listPages,
  readCatalog,
  readConf,
  readPage,
  translator,
  migrate,
  update,
} from './src/index.mjs';

const HELP = `Usage: lunadoc <command> [repo] [options]

Commands (repo defaults to the current directory; docs live in <repo>/doc):
  update                Regenerate locale/manual.pot and merge every locale .po
  status [--pages]      Translation coverage per locale (and per page)
  check [--compile]     Validate layout, catalogs, links and DOT; --compile builds Typst
  attachments --out D   Compile Typst and Graphviz attachments and copy files into D
  migrate               Convert the retired doc/<locale>/ layout

Options:
  --doc DIR             Documentation directory (default: <repo>/doc)
`;

const args = process.argv.slice(2);
const command = args.shift();
const flags = new Set(args.filter((arg) => arg.startsWith('--') && !arg.includes('=')));
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const positional = args.filter((arg, i) => !arg.startsWith('--') && !['--out', '--doc'].includes(args[i - 1]));
const repoRoot = path.resolve(positional[0] ?? '.');
const docDir = path.resolve(option('--doc') ?? path.join(repoRoot, 'doc'));

function percent(part, total) {
  return total ? `${((100 * part) / total).toFixed(1)}%` : '100%';
}

switch (command) {
  case 'update': {
    for (const row of update(docDir)) {
      console.log(`${row.locale}: ${row.translated}/${row.total} translated, ${row.fuzzy} fuzzy, ${row.untranslated} untranslated`);
    }
    break;
  }
  case 'status': {
    const conf = readConf(docDir);
    for (const locale of conf.locales) {
      const catalog = readCatalog(layout(docDir).po(locale));
      if (!catalog) {
        console.log(`${locale}: no catalog`);
        continue;
      }
      const c = coverageOf(catalog);
      console.log(`${locale}: ${percent(c.translated, c.total)} (${c.translated}/${c.total}, ${c.fuzzy} fuzzy)`);
      if (flags.has('--pages')) {
        const lookup = translator(catalog);
        for (const page of listPages(docDir)) {
          const segments = extractSegments(readPage(docDir, page));
          const done = segments.filter((segment) => lookup(segment.msgid)).length;
          console.log(`  ${percent(done, segments.length).padStart(6)}  ${page}`);
        }
      }
    }
    break;
  }
  case 'check': {
    const { errors, warnings } = check(docDir, { compile: flags.has('--compile'), repoRoot });
    for (const warning of warnings) console.log(`warning: ${warning}`);
    for (const error of errors) console.error(`error: ${error}`);
    console.log(`${errors.length} errors, ${warnings.length} warnings`);
    process.exitCode = errors.length ? 1 : 0;
    break;
  }
  case 'attachments': {
    const out = option('--out');
    if (!out) throw new Error('--out is required');
    let failed = 0;
    for (const result of buildAttachments(docDir, path.resolve(out))) {
      console.log(`${result.ok ? 'ok  ' : 'FAIL'} ${result.item.source}`);
      if (!result.ok) {
        failed += 1;
        console.error(result.message);
      }
    }
    process.exitCode = failed ? 1 : 0;
    break;
  }
  case 'migrate': {
    const report = migrate(repoRoot);
    console.log(JSON.stringify(report, null, 2));
    break;
  }
  default:
    console.log(HELP);
    process.exitCode = command && command !== 'help' ? 1 : 0;
}
