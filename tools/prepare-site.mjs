// Collects every repository's doc/ tree into the inputs of the Astro build:
//
//   .generated/pages/<lang>/<repo>/<page>.md   rendered pages, one per locale
//   .generated/site.json                       navigation, coverage, strings
//   public/attachments/<repo>/...              compiled Typst and copied files
//
// Every page exists in every locale. Untranslated messages fall back to
// English, so the language switcher never leads to a missing page.
//
// Inputs: LUNAFLOW_REPO_ROOT (default: the parent directory) and, in CI,
// LUNAFLOW_REPO_MANIFEST from tools/discover-repos.mjs. Without a manifest,
// every sibling directory with doc/conf.json is used.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import {
  buildAttachments,
  frontmatterOf,
  isExternal,
  listAttachments,
  listPages,
  loadCatalog,
  readConf,
  renderPage,
  resolveAttachment,
  rewriteLinks,
  splitHash,
  translateConf,
} from './lunadoc/src/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = path.resolve(process.env.LUNAFLOW_REPO_ROOT ?? path.join(root, '..'));
const manifestPath = process.env.LUNAFLOW_REPO_MANIFEST;
const out = path.join(root, '.generated');
const attachmentsOut = path.join(root, 'public', 'attachments');
const locales = JSON.parse(fs.readFileSync(path.join(root, 'config', 'locales.json'), 'utf8'));
const repoConfig = JSON.parse(fs.readFileSync(path.join(root, 'config', 'repos.json'), 'utf8'));
const { org, branch } = repoConfig;
const SITE = '_site';
const RESERVED = new Set(['library', 'about', 'contribute', 'attachments', 'pagefind', '_astro']);
const DOC_TYPES = ['api', 'design', 'tutorial', 'conformance', 'performance', 'integration'];

fs.rmSync(out, { recursive: true, force: true });
fs.rmSync(attachmentsOut, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// ---------------------------------------------------------------- sources

function discoverRepos() {
  if (manifestPath) {
    return JSON.parse(fs.readFileSync(path.resolve(manifestPath), 'utf8')).repositories;
  }
  return fs
    .readdirSync(workspace, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !repoConfig.exclude.includes(entry.name))
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(workspace, name, 'doc', 'conf.json')))
    .sort((a, b) => a.localeCompare(b));
}

const sources = [{ id: SITE, docDir: path.join(root, 'content'), repo: 'Luna-Flow.github.io', docPrefix: 'content' }];
const warnings = [];
for (const name of discoverRepos()) {
  const docDir = path.join(workspace, name, 'doc');
  if (!fs.existsSync(path.join(docDir, 'conf.json')) || !fs.existsSync(path.join(docDir, 'manual', 'index.md'))) {
    if (fs.existsSync(path.join(workspace, name, 'doc'))) warnings.push(`${name}: doc/ does not follow the gettext layout; skipped`);
    continue;
  }
  if (RESERVED.has(name)) {
    warnings.push(`${name}: repository name collides with a site route; skipped`);
    continue;
  }
  sources.push({ id: name, docDir, repo: name, docPrefix: 'doc' });
}

// ------------------------------------------------------------------ routes

const pageSlug = (page) => page.replace(/\.md$/, '').replace(/(^|\/)index$/, '');

function route(locale, source, page) {
  const parts = [locale.path];
  if (source.id !== SITE) parts.push(source.id);
  const slug = pageSlug(page);
  if (slug) parts.push(slug);
  return `/${parts.join('/')}/`;
}

const github = (source, kind, file) => `https://github.com/${org}/${source.repo}/${kind}/${branch}/${file}`;

function humanize(name) {
  const text = name.replace(/\.md$/, '').replace(/[_-]+/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function firstHeading(markdown) {
  return markdown.match(/^#\s+(.+?)\s*#*\s*$/m)?.[1];
}

// --------------------------------------------------------------- rendering

const site = { locales, categories: [], repos: {}, strings: {}, pages: {}, redirects: [], warnings };

function stripFrontmatter(markdown) {
  return markdown.replace(/^---\n[\s\S]*?\n---\n?/, '');
}

function linkRewriter(source, page, locale, attachments) {
  const manualDir = path.join(source.docDir, 'manual');
  const attachmentsDir = path.join(source.docDir, 'attachments');
  const repoRoot = path.dirname(source.docDir);
  return (url) => {
    if (isExternal(url)) return undefined;
    const [target, hash] = splitHash(url);
    if (!target) return undefined;
    let decoded;
    try {
      decoded = decodeURIComponent(target);
    } catch {
      decoded = target;
    }
    const absolute = path.resolve(path.dirname(path.join(manualDir, page)), decoded);
    const inManual = path.relative(manualDir, absolute).split(path.sep).join('/');
    if (!inManual.startsWith('..')) {
      let file = inManual;
      if (!file.endsWith('.md')) file = file ? `${file.replace(/\/$/, '')}/index.md` : 'index.md';
      return route(locale, source, file) + hash;
    }
    const inAttachments = path.relative(attachmentsDir, absolute).split(path.sep).join('/');
    if (!inAttachments.startsWith('..')) {
      const item = resolveAttachment(attachments, inAttachments, locale.id);
      if (item) return `/attachments/${source.id}/${item.output}${hash}`;
      return github(source, 'blob', `${source.docPrefix}/attachments/${inAttachments}`);
    }
    const inRepo = path.relative(repoRoot, absolute).split(path.sep).join('/');
    if (!inRepo.startsWith('..')) return github(source, fs.existsSync(absolute) && fs.statSync(absolute).isDirectory() ? 'tree' : 'blob', inRepo) + hash;
    return undefined;
  };
}

// Sidebar: overview, guides, then one chapter per document type (API, Design,
// Tutorial, ...) listing packages, then any other sections.
function navTree(entries, strings) {
  const overview = entries.find((entry) => entry.page === 'index.md');
  const guides = entries.filter((entry) => !entry.page.includes('/') && entry.page !== 'index.md');
  const tree = { children: new Map(), docs: [] };
  for (const entry of entries.filter((item) => item.page.includes('/'))) {
    const parts = entry.page.split('/');
    let node = tree;
    for (const part of parts.slice(0, -1)) {
      if (!node.children.has(part)) node.children.set(part, { children: new Map(), docs: [] });
      node = node.children.get(part);
    }
    node.docs.push(entry);
  }
  const indexOf = (node) => node.docs.find((entry) => entry.page.endsWith('/index.md'));
  const pages = (node) => node.docs.filter((entry) => !entry.page.endsWith('/index.md'));

  // Inside a document type, leaves and groups are package paths.
  const packages = (node) => [
    ...pages(node)
      .sort((a, b) => a.page.localeCompare(b.page))
      .map((entry) => ({ label: entry.page.split('/').at(-1).replace(/\.md$/, ''), url: entry.url, code: true })),
    ...[...node.children.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, child]) => ({ label: name, code: true, url: indexOf(child)?.url, items: packages(child) })),
  ];
  // Any other directory is a section titled by its index page.
  const sections = (node) => [
    ...pages(node)
      .sort((a, b) => a.page.localeCompare(b.page))
      .map((entry) => ({ label: entry.title, url: entry.url })),
    ...[...node.children.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, child]) => ({ label: indexOf(child)?.title ?? humanize(name), url: indexOf(child)?.url, items: sections(child) })),
  ];

  const typed = [...tree.children.entries()]
    .filter(([name]) => DOC_TYPES.includes(name))
    .sort(([a], [b]) => DOC_TYPES.indexOf(a) - DOC_TYPES.indexOf(b))
    .map(([name, child]) => ({
      label: strings[`doctype.${name}`] ?? humanize(name),
      url: indexOf(child)?.url,
      chapter: true,
      items: packages(child),
    }));
  const other = [...tree.children.entries()]
    .filter(([name]) => !DOC_TYPES.includes(name))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, child]) => ({ label: indexOf(child)?.title ?? humanize(name), url: indexOf(child)?.url, items: sections(child) }));

  return [
    ...(overview ? [{ label: overview.title, url: overview.url, overview: true }] : []),
    ...guides.sort((a, b) => a.page.localeCompare(b.page)).map((entry) => ({ label: entry.title, url: entry.url })),
    ...typed,
    ...other,
  ];
}


for (const source of sources) {
  const conf = readConf(source.docDir);
  const pages = listPages(source.docDir);
  const attachments = listAttachments(source.docDir);
  for (const result of buildAttachments(source.docDir, path.join(attachmentsOut, source.id))) {
    if (!result.ok) warnings.push(`${source.id}: attachment ${result.item.source} failed:\n${result.message}`);
  }
  const entry = { id: source.id, title: conf.title, repo: source.repo, summary: {}, coverage: {}, nav: {}, pages: pages.length };

  for (const locale of locales) {
    const catalog = loadCatalog(source.docDir, locale.id);
    const translatedConf = translateConf(source.docDir, locale.id, catalog);
    const siteStrings = translateConf(sources[0].docDir, locale.id).strings;
    if (source.id === SITE) site.strings[locale.path] = translatedConf.strings;
    entry.summary[locale.path] = translatedConf.summary;
    let total = 0;
    let translated = 0;
    const navEntries = [];
    for (const page of pages) {
      const rendered = renderPage(source.docDir, page, locale.id, catalog);
      total += rendered.total;
      translated += rendered.translated;
      const fm = frontmatterOf(rendered.markdown);
      let body = rewriteLinks(rendered.markdown, linkRewriter(source, page, locale, attachments));
      body = stripFrontmatter(body);
      const heading = firstHeading(body);
      const title = fm.title ?? heading ?? humanize(page.split('/').at(-1));
      const url = route(locale, source, page);
      const [head, ...rest] = page.replace(/\.md$/, '').split('/');
      const docType = rest.length && DOC_TYPES.includes(head) ? head : null;
      const pkg = docType ? rest.join('/') : '';
      navEntries.push({ page, title, url });
      const meta = {
        title,
        description: fm.description ?? '',
        repo: source.id,
        repoTitle: conf.title,
        page,
        package: pkg,
        docType,
        locale: locale.id,
        lang: locale.lang,
        url,
        hasH1: Boolean(heading),
        coverage: { total: rendered.total, translated: rendered.translated },
        headings: rendered.headings.map((item) => item.slug),
        sourceUrl: github(source, 'blob', `${source.docPrefix}/manual/${page}`),
        editUrl: github(source, 'edit', `${source.docPrefix}/manual/${page}`),
        translationUrl:
          locale.id === 'en_US' ? null : github(source, 'blob', `${source.docPrefix}/locale/${locale.id}/LC_MESSAGES/manual.po`),
        issueRepo: `https://github.com/${org}/${source.repo}/issues/new`,
      };
      const target = path.join(out, 'pages', ...url.split('/').filter(Boolean), 'index.md');
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, `---\n${YAML.stringify(meta).trimEnd()}\n---\n\n${body.trimStart()}`);
      site.pages[url] = { title, repo: source.id };
    }
    entry.coverage[locale.path] = total ? translated / total : 1;
    entry.nav[locale.path] = navTree(navEntries, siteStrings);
  }
  if (source.id !== SITE) site.repos[source.id] = entry;
  else site.site = entry;

  // Old VitePress routes: /<repo>/<page>, /zh_CN/<repo>/<page>, /ja_JP/...
  if (source.id !== SITE) {
    for (const page of pages) {
      const legacy = [page.replace(/\.md$/, '')];
      if (page === 'index.md') legacy.push('README');
      if (page === 'conventions.md') legacy.push('doc-standard', 'doc_standard');
      for (const locale of locales) {
        const prefix = locale.id === 'en_US' ? '' : `/${locale.id}`;
        for (const old of legacy) site.redirects.push({ from: `${prefix}/${source.id}/${old}`, to: route(locale, source, page) });
      }
    }
  }
}

for (const locale of locales) {
  const prefix = locale.id === 'en_US' ? '' : `/${locale.id}`;
  site.redirects.push({ from: `${prefix}/docs/index`, to: `/${locale.path}/library/` });
  if (prefix) site.redirects.push({ from: `${prefix}/index`, to: `/${locale.path}/` });
}

// Categories, with repositories missing from every category under "other".
const categorized = new Set(repoConfig.categories.flatMap((category) => category.repos));
site.categories = repoConfig.categories
  .map((category) => ({ id: category.id, repos: category.repos.filter((repo) => site.repos[repo]) }))
  .filter((category) => category.repos.length);
const others = Object.keys(site.repos).filter((repo) => !categorized.has(repo));
if (others.length) site.categories.push({ id: 'other', repos: others });

fs.writeFileSync(path.join(out, 'site.json'), `${JSON.stringify(site, null, 2)}\n`);
for (const warning of warnings) console.warn(`warning: ${warning}`);
console.log(`Prepared ${Object.keys(site.repos).length} repositories, ${Object.keys(site.pages).length} pages.`);
