import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
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
  listAttachments,
  resolveAttachment,
  buildAttachments,
  compileGraphviz,
  themeGraphvizSvg,
  sanitizeGraphvizSvg,
  findAttachmentCollisions,
} from '../src/index.mjs';
import rehypeGraphvizInline from '../../../src/plugins/rehype-graphviz-inline.mjs';

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

const DOT_AVAILABLE = spawnSync(process.env.GRAPHVIZ_DOT ?? 'dot', ['-V'], { encoding: 'utf8' }).status === 0;

function makeDoc(markdown, { dot = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lunadoc-images-'));
  const docDir = path.join(root, 'doc');
  fs.mkdirSync(path.join(docDir, 'manual'), { recursive: true });
  fs.mkdirSync(path.join(docDir, 'attachments'), { recursive: true });
  fs.writeFileSync(path.join(docDir, 'conf.json'), JSON.stringify({ summary: 'Fixture', locales: [] }));
  fs.writeFileSync(path.join(docDir, 'manual', 'index.md'), markdown);
  fs.writeFileSync(path.join(docDir, 'attachments', 'figure.svg'), '<svg/>');
  if (dot) fs.writeFileSync(path.join(docDir, 'attachments', 'index_diagram.dot'), 'digraph { a -> b }');
  update(docDir);
  return { root, docDir };
}

test('lunadoc check accepts image alt and ignores code examples', (t) => {
  const valid = makeDoc('![A figure](../attachments/figure.svg)\n', { dot: false });
  t.after(() => fs.rmSync(valid.root, { recursive: true, force: true }));
  assert.deepEqual(check(valid.docDir, { repoRoot: valid.root }).errors, []);

  const emptySvg = makeDoc('![](../attachments/figure.svg)\n', { dot: false });
  t.after(() => fs.rmSync(emptySvg.root, { recursive: true, force: true }));
  assert.ok(check(emptySvg.docDir, { repoRoot: emptySvg.root }).errors.includes(
    'manual/index.md:1: image alt text is empty: ../attachments/figure.svg',
  ));

  const code = makeDoc('```md\n![](../attachments/index_diagram.dot)\n```\n', { dot: false });
  t.after(() => fs.rmSync(code.root, { recursive: true, force: true }));
  assert.deepEqual(check(code.docDir, { repoRoot: code.root }).errors, []);
});

test('lunadoc check rejects empty alt on a DOT image', { skip: DOT_AVAILABLE ? false : 'Graphviz is unavailable; skipped DOT-backed check case.' }, (t) => {
  const fixture = makeDoc('![](../attachments/index_diagram.dot)\n');
  t.after(() => fs.rmSync(fixture.root, { recursive: true, force: true }));
  assert.ok(check(fixture.docDir, { repoRoot: fixture.root }).errors.includes(
    'manual/index.md:1: image alt text is empty: ../attachments/index_diagram.dot',
  ));
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

test('alt validation handles reference images, HTML img, and whitespace-only emphasis', (t) => {
  const fixture = makeDoc([
    '![][empty]',
    '![x][]',
    '![**  **](../attachments/figure.svg)',
    '<img src="../attachments/figure.svg">',
    '',
    '[empty]: ../attachments/figure.svg',
    '[x]: ../attachments/figure.svg',
  ].join('\n') + '\n', { dot: false });
  t.after(() => fs.rmSync(fixture.root, { recursive: true, force: true }));
  const { errors } = check(fixture.docDir, { repoRoot: fixture.root });
  assert.equal(errors.filter((error) => error.includes('image alt text is empty')).length, 3);
  assert.ok(errors.some((error) => error.startsWith('manual/index.md:4: image alt text is empty')));
});

test('DOT attachments resolve to locale-aware SVG outputs', (t) => {
  const fixture = makeDoc('A graph.\n');
  t.after(() => fs.rmSync(fixture.root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(fixture.docDir, 'attachments', 'index_diagram.zh_CN.dot'), 'digraph { zh -> cn }');
  const items = listAttachments(fixture.docDir);
  assert.deepEqual(items.filter((item) => item.kind === 'graphviz').map(({ source, name, locale, output }) => ({ source, name, locale, output })), [
    { source: 'index_diagram.dot', name: 'index_diagram', locale: null, output: 'index_diagram.svg' },
    { source: 'index_diagram.zh_CN.dot', name: 'index_diagram', locale: 'zh_CN', output: 'index_diagram.zh_CN.svg' },
  ]);
  assert.equal(resolveAttachment(items, 'index_diagram.dot', 'zh_CN').output, 'index_diagram.zh_CN.svg');
  assert.equal(resolveAttachment(items, 'index_diagram.dot', 'ja_JP').output, 'index_diagram.svg');
});

test('Graphviz SVG theme postprocessing maps default black to currentColor', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><ellipse fill="none" stroke="#000000"/><text x="1" fill="#000000">label</text><path fill="#000000" stroke="#000"/></svg>';
  const themed = themeGraphvizSvg(svg);
  assert.match(themed, /data-lunadoc-graphviz="true"/);
  assert.match(themed, /color="inherit"/);
  assert.match(themed, /stroke="currentColor"/);
  assert.match(themed, /fill="currentColor"/);
  assert.match(themed, /<text x="1" fill="currentColor">/);
});

test('Graphviz SVG sanitizer removes active content and unsafe links, keeps safe fragments', () => {
  const source = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><script>alert(1)</script><foreignObject><iframe/></foreignObject><style>x{}</style><image href="/etc/passwd"/><a xlink:href="javascript:alert(1)"><text onload="x" style="x" fill="black">bad</text></a><a href="https://example.com"><text>external</text></a><a href="#node1"><text>local</text></a><g id="node1"><ellipse fill="#f00" stroke="black"/><path fill="url(https://evil.example/x.svg#paint)"/></g></svg>';
  const clean = sanitizeGraphvizSvg(source, 'safe-');
  const serialize = (node) => `${node.tagName ?? ''} ${Object.entries(node.properties ?? {}).map(([key, value]) => `${key}=${value}`).join(' ')} ${node.children?.map(serialize).join(' ') ?? ''}`;
  const text = serialize(clean);
  assert.doesNotMatch(text, /script|foreignObject|iframe|style=|onLoad|javascript:|passwd/);
  assert.match(text, /href=https:\/\/example\.com/);
  assert.match(text, /href=#safe-node1/);
  assert.match(text, /id=safe-node1/);
  assert.match(text, /fill=#f00/);
  assert.match(text, /stroke=black/);
});

test('explicit Graphviz filled colors survive theme postprocessing', () => {
  const themed = themeGraphvizSvg('<svg><ellipse fill="#f00" stroke="black"/><text fill="white">label</text></svg>', 'color.dot');
  assert.match(themed, /fill="#f00"/);
  assert.match(themed, /fill="white"/);
  assert.match(themed, /stroke="currentColor"/);
});

test('Graphviz attachments compile during build', { skip: DOT_AVAILABLE ? false : 'Graphviz is not installed; skipped DOT rendering test.' }, (t) => {
  const fixture = makeDoc('A graph.\n');
  t.after(() => fs.rmSync(fixture.root, { recursive: true, force: true }));
  const outDir = path.join(fixture.root, 'out');
  const [result] = buildAttachments(fixture.docDir, outDir);
  assert.equal(result.ok, true);
  const svg = fs.readFileSync(path.join(outDir, 'index_diagram.svg'), 'utf8');
  assert.match(svg, /<svg/);
  assert.match(svg, /currentColor/);
  assert.match(svg, /data-lunadoc-graphviz="true"/);
});

test('Graphviz markdown images become accessible inline SVG', (t) => {
  const publicDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lunadoc-graphviz-inline-'));
  t.after(() => fs.rmSync(publicDir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(publicDir, 'attachments'), { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'attachments', 'diagram.svg'), themeGraphvizSvg('<svg xmlns="http://www.w3.org/2000/svg"><text>graph</text></svg>'));
  const tree = {
    type: 'root',
    children: [{
      type: 'element',
      tagName: 'p',
      properties: {},
      children: [{ type: 'element', tagName: 'img', properties: { src: '/attachments/repo/diagram.svg', alt: 'Dependency graph' }, children: [] }],
    }],
  };
  const nestedDir = path.join(publicDir, 'attachments', 'repo');
  fs.mkdirSync(nestedDir, { recursive: true });
  fs.copyFileSync(path.join(publicDir, 'attachments', 'diagram.svg'), path.join(nestedDir, 'diagram.svg'));
  rehypeGraphvizInline({ publicDir, generatedFiles: new Set(['attachments/repo/diagram.svg']) })(tree);
  const diagram = tree.children[0].children[0];
  assert.equal(diagram.tagName, 'svg');
  assert.equal(diagram.properties.role, 'img');
  assert.equal(diagram.properties.ariaLabel, 'Dependency graph');
  assert.ok(diagram.properties.className.includes('graphviz-diagram'));
});

test('inline Graphviz requires generated manifest membership and gives repeated SVGs unique ids', (t) => {
  const publicDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lunadoc-graphviz-manifest-'));
  t.after(() => fs.rmSync(publicDir, { recursive: true, force: true }));
  const asset = path.join(publicDir, 'attachments', 'repo', 'diagram.svg');
  fs.mkdirSync(path.dirname(asset), { recursive: true });
  fs.writeFileSync(asset, '<svg xmlns="http://www.w3.org/2000/svg" data-lunadoc-graphviz="true"><g id="node1"><ellipse fill="none" stroke="currentColor"/></g></svg>');
  const makeTree = () => ({ type: 'root', children: [{ type: 'element', tagName: 'p', properties: {}, children: [
    { type: 'element', tagName: 'img', properties: { src: '/attachments/repo/diagram.svg', alt: 'Graph' }, children: [] },
    { type: 'element', tagName: 'img', properties: { src: '/attachments/repo/diagram.svg', alt: 'Graph' }, children: [] },
  ] }] });
  const untrusted = makeTree();
  rehypeGraphvizInline({ publicDir, generatedFiles: new Set() })(untrusted);
  assert.equal(untrusted.children[0].children[0].tagName, 'img');
  const trusted = makeTree();
  rehypeGraphvizInline({ publicDir, generatedFiles: new Set(['attachments/repo/diagram.svg']) })(trusted);
  const diagrams = trusted.children[0].children;
  const rootIds = diagrams.map((svg) => svg.properties.id);
  assert.equal(new Set(rootIds).size, 2);
  assert.notEqual(diagrams[0].children[0].properties.id, diagrams[1].children[0].properties.id);
});

test('lunadoc check reports Graphviz syntax errors with the source line', { skip: DOT_AVAILABLE ? false : 'Graphviz is not installed; skipped DOT syntax test.' }, (t) => {
  const fixture = makeDoc('![Graph](../attachments/diagram.dot)\n');
  t.after(() => fs.rmSync(fixture.root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(fixture.docDir, 'attachments', 'diagram.dot'), 'digraph {\n  a -> ;\n}\n');
  const { errors } = check(fixture.docDir, { repoRoot: fixture.root });
  const error = errors.find((entry) => entry.startsWith('attachments/diagram.dot does not compile:'));
  assert.ok(error);
  assert.match(error, /line 2/);
});

test('Graphviz execution failures name the configured command', (t) => {
  const fixture = makeDoc('A graph.\n');
  t.after(() => fs.rmSync(fixture.root, { recursive: true, force: true }));
  const result = compileGraphviz(fixture.docDir, listAttachments(fixture.docDir).find((item) => item.kind === 'graphviz'), path.join(fixture.root, 'out'), { dot: 'lunadoc-missing-dot' });
  assert.equal(result.ok, false);
  assert.match(result.message, /cannot run lunadoc-missing-dot/);
});

test('Graphviz compilation reports configured timeout and output limits', (t) => {
  const fixture = makeDoc('A graph.\n');
  t.after(() => fs.rmSync(fixture.root, { recursive: true, force: true }));
  const item = listAttachments(fixture.docDir).find((entry) => entry.kind === 'graphviz');
  const slow = path.join(fixture.root, 'slow-dot');
  fs.writeFileSync(slow, '#!/bin/sh\nsleep 5\n');
  fs.chmodSync(slow, 0o755);
  const timeout = compileGraphviz(fixture.docDir, item, path.join(fixture.root, 'timeout'), { dot: slow, timeout: 100 });
  assert.match(timeout.message, /timed out after 100 ms/);
  const noisy = path.join(fixture.root, 'noisy-dot');
  fs.writeFileSync(noisy, '#!/bin/sh\nnode -e \'process.stdout.write("x".repeat(4096))\'\n');
  fs.chmodSync(noisy, 0o755);
  const output = compileGraphviz(fixture.docDir, item, path.join(fixture.root, 'output'), { dot: noisy, maxBuffer: 1024 });
  assert.match(output.message, /output exceeded the 1024-byte limit/);
});

test('attachment output collisions are detected before building', (t) => {
  const fixture = makeDoc('A graph.\n');
  t.after(() => fs.rmSync(fixture.root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(fixture.docDir, 'attachments', 'index_diagram.svg'), '<svg/>');
  const collisions = findAttachmentCollisions(listAttachments(fixture.docDir));
  assert.deepEqual(collisions, [{ output: 'index_diagram.svg', sources: ['index_diagram.dot', 'index_diagram.svg'] }]);
  assert.throws(() => buildAttachments(fixture.docDir, path.join(fixture.root, 'out')), /attachment output collision/);
});

test('lunadoc check enforces page-prefixed DOT names', { skip: DOT_AVAILABLE ? false : 'Graphviz is unavailable; skipped DOT naming check.' }, (t) => {
  const fixture = makeDoc('![Graph](../attachments/diagram.dot)\n');
  t.after(() => fs.rmSync(fixture.root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(fixture.docDir, 'attachments', 'diagram.dot'), 'digraph { a -> b }');
  const { errors } = check(fixture.docDir, { repoRoot: fixture.root });
  assert.ok(errors.some((error) => error.includes('Graphviz attachment name must start with index_')));
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
