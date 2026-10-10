import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  alignSegments,
  emptyCatalog,
  extractSegments,
  headingSlugs,
  mergeCatalog,
  normalizeMessage,
  renderTranslated,
  rewriteLinks,
  templateFrom,
  findLinks,
  findImages,
  check,
  update,
  readCatalog,
  layout,
} from '../src/index.mjs';

const page = `---
title: Generic algebra
order: 2
---

# Overview

The \`Ring\` trait models
rings with $0$ and $1$.

- First item
  wraps here.
- \`only_code\`

| Name | Meaning |
| --- | --- |
| \`Zero\` | additive identity |

\`\`\`moonbit
fn main { println("not extracted") }
\`\`\`

$$
x + 0 = x
$$
`;

test('normalizeMessage joins soft wraps and keeps CJK tight', () => {
  assert.equal(normalizeMessage('a\n  b'), 'a b');
  assert.equal(normalizeMessage('同态\n映射'), '同态映射');
  assert.equal(normalizeMessage('hard  \nbreak'), 'hard\\\nbreak');
});

test('extractSegments skips code, math and word-less blocks', () => {
  const ids = extractSegments(page).map((segment) => segment.msgid);
  assert.deepEqual(ids, [
    'Generic algebra',
    'Overview',
    'The `Ring` trait models rings with $0$ and $1$.',
    'First item wraps here.',
    'Name',
    'Meaning',
    'additive identity',
  ]);
});

test('renderTranslated replaces only messages and counts coverage', () => {
  const zh = new Map([
    ['Generic algebra', '泛型代数'],
    ['Overview', '概览'],
    ['The `Ring` trait models rings with $0$ and $1$.', '`Ring` trait 刻画带 $0$ 与 $1$ 的环。'],
    ['additive identity', '加法单位元 | 零'],
  ]);
  const { markdown, total, translated } = renderTranslated(page, (id) => zh.get(id));
  assert.equal(total, 7);
  assert.equal(translated, 4);
  assert.match(markdown, /^---\ntitle: 泛型代数\norder: 2\n---/);
  assert.match(markdown, /# 概览/);
  assert.match(markdown, /\| `Zero` \| 加法单位元 \\\| 零 \|/);
  assert.match(markdown, /- First item\n  wraps here\./);
  assert.match(markdown, /println\("not extracted"\)/);
});

test('headingSlugs follow the English source', () => {
  assert.deepEqual(headingSlugs('# A B\n\n## A B\n'), [
    { depth: 1, text: 'A B', slug: 'a-b' },
    { depth: 2, text: 'A B', slug: 'a-b-1' },
  ]);
});

test('mergeCatalog keeps, fuzzies and obsoletes like msgmerge', () => {
  const old = emptyCatalog('zh_CN');
  old.entries.set('Ring homomorphisms preserve one.', { msgid: 'Ring homomorphisms preserve one.', msgstr: '环同态保持 1。', references: [], flags: new Set() });
  old.entries.set('Kept.', { msgid: 'Kept.', msgstr: '保留。', references: [], flags: new Set() });
  old.entries.set('Gone entirely.', { msgid: 'Gone entirely.', msgstr: '删除。', references: [], flags: new Set() });
  const template = templateFrom([
    { msgid: 'Kept.', reference: 'a.md:1' },
    { msgid: 'Ring homomorphisms preserve one and zero.', reference: 'a.md:3' },
  ]);
  const merged = mergeCatalog(template, old, 'zh_CN');
  assert.equal(merged.entries.get('Kept.').msgstr, '保留。');
  const changed = merged.entries.get('Ring homomorphisms preserve one and zero.');
  assert.ok(changed.flags.has('fuzzy'));
  assert.equal(changed.previous, 'Ring homomorphisms preserve one.');
  assert.ok(merged.obsolete.has('Gone entirely.'));
});

test('alignSegments pairs blocks of the same shape', () => {
  const en = extractSegments('# Title\n\nUse `x` here.\n\nPlain prose.\n');
  const zh = extractSegments('# 标题\n\n在这里用 `x`。\n\n纯文本。\n');
  assert.deepEqual(alignSegments(en, zh), [
    { msgid: 'Title', msgstr: '标题', fuzzy: false },
    { msgid: 'Use `x` here.', msgstr: '在这里用 `x`。', fuzzy: false },
    { msgid: 'Plain prose.', msgstr: '纯文本。', fuzzy: false },
  ]);
});

test('links are found and rewritten in place, code is ignored', () => {
  const source = 'See [api](../en_US/api.md#x) and ![fig](img.png).\n\n`[no](skip.md)`\n\n[ref]: <a b.md>\n';
  assert.deepEqual(findLinks(source).map((link) => link.url), ['../en_US/api.md#x', 'img.png', 'a b.md']);
  assert.equal(
    rewriteLinks(source, (url) => url.replace('en_US', 'manual')),
    'See [api](../manual/api.md#x) and ![fig](img.png).\n\n`[no](skip.md)`\n\n[ref]: <a b.md>\n',
  );
});

function makeDoc(markdown) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lunadoc-images-'));
  const docDir = path.join(root, 'doc');
  fs.mkdirSync(path.join(docDir, 'manual'), { recursive: true });
  fs.mkdirSync(path.join(docDir, 'attachments'), { recursive: true });
  fs.writeFileSync(path.join(docDir, 'conf.json'), JSON.stringify({ summary: 'Fixture', locales: [] }));
  fs.writeFileSync(path.join(docDir, 'manual', 'index.md'), markdown);
  fs.writeFileSync(path.join(docDir, 'attachments', 'figure.svg'), '<svg/>');
  fs.writeFileSync(path.join(docDir, 'attachments', 'diagram.dot'), 'digraph {}');
  update(docDir);
  return { root, docDir };
}

test('lunadoc check requires non-empty alt text for images, including DOT targets', (t) => {
  const valid = makeDoc('![A figure](../attachments/figure.svg)\n');
  t.after(() => fs.rmSync(valid.root, { recursive: true, force: true }));
  assert.deepEqual(check(valid.docDir, { repoRoot: valid.root }).errors, []);

  const emptySvg = makeDoc('![](../attachments/figure.svg)\n');
  t.after(() => fs.rmSync(emptySvg.root, { recursive: true, force: true }));
  assert.ok(check(emptySvg.docDir, { repoRoot: emptySvg.root }).errors.includes(
    'manual/index.md:1: image alt text is empty: ../attachments/figure.svg',
  ));

  const emptyDot = makeDoc('![](../attachments/diagram.dot)\n');
  t.after(() => fs.rmSync(emptyDot.root, { recursive: true, force: true }));
  assert.ok(check(emptyDot.docDir, { repoRoot: emptyDot.root }).errors.includes(
    'manual/index.md:1: image alt text is empty: ../attachments/diagram.dot',
  ));

  const code = makeDoc('```md\n![](../attachments/diagram.dot)\n```\n');
  t.after(() => fs.rmSync(code.root, { recursive: true, force: true }));
  assert.deepEqual(check(code.docDir, { repoRoot: code.root }).errors, []);
});

test('lunadoc update extracts image alt text for translation', (t) => {
  const fixture = makeDoc('![A diagram](../attachments/diagram.dot)\n');
  t.after(() => fs.rmSync(fixture.root, { recursive: true, force: true }));
  const catalog = readCatalog(layout(fixture.docDir).pot);
  assert.ok(catalog.entries.has('![A diagram](../attachments/diagram.dot)'));
  const translated = renderTranslated('![A diagram](../attachments/diagram.dot)\n', () => '![示意图](../attachments/diagram.dot)');
  assert.equal(translated.markdown, '![示意图](../attachments/diagram.dot)\n');
});

test('findImages excludes code examples and reports image source positions', () => {
  const source = '![Figure](figure.svg)\n\n```md\n![](diagram.dot)\n```\n';
  assert.deepEqual(findImages(source), [{ alt: 'Figure', url: 'figure.svg', line: 1 }]);
});

import { pageName } from '../src/index.mjs';

test('pageName groups package pages by document type', () => {
  assert.equal(pageName('README.md'), 'index.md');
  assert.equal(pageName('doc_standard.md'), 'conventions.md');
  assert.equal(pageName('core/api.md'), 'api/core.md');
  assert.equal(pageName('backend/dense/tutorial.md'), 'tutorial/backend/dense.md');
  assert.equal(pageName('getting_started.md'), 'getting_started.md');
  assert.equal(pageName('api.md'), 'api.md');
});

test('block quote continuation markers stay out of messages and come back on render', () => {
  const source = '> [!NOTE]\n> Fixed-width integers wrap.\n';
  assert.deepEqual(extractSegments(source).map((segment) => segment.msgid), ['[!NOTE] Fixed-width integers wrap.']);
  const { markdown } = renderTranslated(source, () => '[!NOTE]\n定宽整数会回绕。');
  assert.equal(markdown, '> [!NOTE]\n> 定宽整数会回绕。\n');
});

test('alignment of unmarked blocks across different shapes is fuzzy', () => {
  const pairs = alignSegments(extractSegments('## Mutation\n\n## Usage\n'), extractSegments('## 运算\n'));
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].fuzzy, true);
});

test('alignment with disagreeing inline code is fuzzy even for the same shape', () => {
  const pairs = alignSegments(extractSegments('# Guide\n\nUses `foo` here.\n'), extractSegments('# 指南\n\n使用 `bar`。\n'));
  assert.deepEqual(pairs.map((pair) => pair.fuzzy), [false, true]);
});
