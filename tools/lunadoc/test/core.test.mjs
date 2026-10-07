import test from 'node:test';
import assert from 'node:assert/strict';
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
