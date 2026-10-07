// Markdown segmentation for gettext.
//
// A page is split into translatable blocks: headings, paragraphs (including
// those inside lists, block quotes and footnotes), table cells, and the
// `title` / `description` front-matter keys. Code, math and raw HTML are never
// extracted. Rendering replaces each block's source slice with its
// translation, so everything that is not a message survives byte for byte.

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkFrontmatter from 'remark-frontmatter';
import GithubSlugger from 'github-slugger';
import YAML from 'yaml';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkFrontmatter, ['yaml']);

export const FRONTMATTER_KEYS = ['title', 'description'];

export function parseMarkdown(source) {
  return processor.parse(source);
}

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}　-〿＀-￯]/u;

// Joins soft-wrapped lines so re-wrapping the English source does not
// invalidate translations. Lines are joined with a space, except between two
// CJK characters. Hard breaks are kept as `\` + newline.
export function normalizeMessage(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  let out = '';
  lines.forEach((line, index) => {
    const trimmed = index === 0 ? line : line.trimStart();
    if (index === lines.length - 1) {
      out += trimmed.trimEnd();
      return;
    }
    if (/\\$/.test(trimmed) || / {2,}$/.test(trimmed)) {
      out += `${trimmed.replace(/(\\| +)$/, '')}\\\n`;
      return;
    }
    const head = trimmed.trimEnd();
    const next = lines[index + 1].trimStart();
    const glue = CJK.test(head.at(-1) ?? '') && CJK.test(next[0] ?? '') ? '' : ' ';
    out += head + glue;
  });
  return out.trim();
}

function visibleText(node) {
  if (node.type === 'inlineCode' || node.type === 'inlineMath' || node.type === 'html') return '';
  if (typeof node.value === 'string') return node.value;
  if (node.type === 'image') return node.alt ?? '';
  return (node.children ?? []).map(visibleText).join('');
}

function hasWords(node) {
  return /\p{L}/u.test(visibleText(node));
}

function childrenRange(node) {
  const first = node.children?.[0];
  const last = node.children?.at(-1);
  if (!first || !last) return null;
  return [first.position.start.offset, last.position.end.offset];
}

function readFrontmatter(node) {
  try {
    const data = YAML.parse(node.value) ?? {};
    return typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

// Returns the blocks of `source` in document order:
// { kind, msgid, line, start, end, key? }.
export function extractSegments(source) {
  const tree = parseMarkdown(source);
  const segments = [];

  let quoteDepth = 0;
  const push = (kind, node, start, end, extra = {}) => {
    let raw = source.slice(start, end);
    // Continuation lines of a block quote carry `>` markers that belong to the
    // quote, not to the message. Rendering puts them back.
    if (quoteDepth) raw = raw.replace(/\n[ \t]*(?:>[ \t]?)+/g, '\n');
    const msgid = normalizeMessage(raw);
    if (msgid) segments.push({ kind, msgid, line: node.position.start.line, start, end, ...extra });
  };

  const walk = (node) => {
    switch (node.type) {
      case 'yaml': {
        const data = readFrontmatter(node);
        for (const key of FRONTMATTER_KEYS) {
          if (typeof data[key] === 'string' && data[key].trim()) {
            segments.push({
              kind: 'frontmatter',
              key,
              msgid: data[key].trim(),
              line: node.position.start.line,
              start: node.position.start.offset,
              end: node.position.end.offset,
            });
          }
        }
        return;
      }
      case 'heading':
      case 'tableCell': {
        const range = childrenRange(node);
        if (range && hasWords(node)) push(node.type, node, ...range);
        return;
      }
      case 'paragraph':
        if (hasWords(node)) push('paragraph', node, node.position.start.offset, node.position.end.offset);
        return;
      case 'code':
      case 'math':
      case 'html':
      case 'definition':
      case 'thematicBreak':
        return;
      case 'blockquote':
        quoteDepth += 1;
        for (const child of node.children ?? []) walk(child);
        quoteDepth -= 1;
        return;
      default:
        for (const child of node.children ?? []) walk(child);
    }
  };

  walk(tree);
  return segments;
}

// English heading slugs in document order. Every locale reuses them so that
// anchors and the language switcher survive translation.
export function headingSlugs(source) {
  const slugger = new GithubSlugger();
  const tree = parseMarkdown(source);
  const slugs = [];
  const walk = (node) => {
    if (node.type === 'heading') {
      slugs.push({ depth: node.depth, text: visibleText(node).trim(), slug: slugger.slug(visibleText(node).trim()) });
      return;
    }
    if (node.type === 'code' || node.type === 'math' || node.type === 'html') return;
    for (const child of node.children ?? []) walk(child);
  };
  walk(tree);
  return slugs;
}

function escapeForKind(kind, text) {
  // A translation is one logical line; keep table cells and headings on it.
  if (kind === 'tableCell') return text.replace(/\n/g, ' ').replace(/(?<!\\)\|/g, '\\|');
  if (kind === 'heading') return text.replace(/\n/g, ' ');
  return text;
}

function indentContinuation(text, source, start) {
  // Continuation lines inside lists and block quotes need the prefix of the
  // line the block starts on.
  if (!text.includes('\n')) return text;
  const lineStart = source.lastIndexOf('\n', start - 1) + 1;
  const prefix = source.slice(lineStart, start).replace(/[^\s>]/g, ' ');
  return text.split('\n').join(`\n${prefix}`);
}

// Applies `translate(msgid) -> string | undefined` to the page.
// Returns { markdown, total, translated }.
export function renderTranslated(source, translate) {
  const segments = extractSegments(source);
  let total = 0;
  let translated = 0;
  const frontmatter = segments.filter((segment) => segment.kind === 'frontmatter');
  const blocks = segments.filter((segment) => segment.kind !== 'frontmatter');
  const replacements = [];

  for (const segment of blocks) {
    total += 1;
    const text = translate(segment.msgid);
    if (text) {
      translated += 1;
      replacements.push({
        start: segment.start,
        end: segment.end,
        text: indentContinuation(escapeForKind(segment.kind, text), source, segment.start),
      });
    }
  }

  if (frontmatter.length) {
    const node = parseMarkdown(source).children.find((child) => child.type === 'yaml');
    const data = readFrontmatter(node);
    let changed = false;
    for (const segment of frontmatter) {
      total += 1;
      const text = translate(segment.msgid);
      if (text) {
        translated += 1;
        data[segment.key] = text;
        changed = true;
      }
    }
    if (changed) {
      replacements.push({
        start: node.position.start.offset,
        end: node.position.end.offset,
        text: `---\n${YAML.stringify(data).trimEnd()}\n---`,
      });
    }
  }

  replacements.sort((a, b) => b.start - a.start);
  let markdown = source;
  for (const { start, end, text } of replacements) {
    markdown = markdown.slice(0, start) + text + markdown.slice(end);
  }
  return { markdown, total, translated };
}

export function frontmatterOf(source) {
  const node = parseMarkdown(source).children.find((child) => child.type === 'yaml');
  return node ? readFrontmatter(node) : {};
}
