import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const workspaceRoot = process.env.LUNAFLOW_REPO_ROOT
  ? path.resolve(process.env.LUNAFLOW_REPO_ROOT)
  : path.resolve(repoRoot, '..');
const configPath = path.join(repoRoot, 'docs', 'repo-docs.config.json');
const generatedRoot = path.join(repoRoot, 'docs', 'pages');
const generatedDataDir = path.join(repoRoot, 'docs', '.vitepress', 'generated');

const localeLabels = { en_US: 'English', zh_CN: '简体中文', ja_JP: '日本語' };
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function mkdirp(target) {
  fs.mkdirSync(target, { recursive: true });
}

function listDirSafe(target) {
  return fs.existsSync(target) ? fs.readdirSync(target, { withFileTypes: true }) : [];
}

function rewriteLinks(content, repo, locale) {
  return content
    .replace(/\.\.\/\.\.\/README(?:\.md)?/g, './README.md')
    .replace(/\.\/README(?:\.md)?/g, './README.md')
    .replace(/\.\.\/\.\.\/CONTRIBUTING(?:\.md)?/g, './CONTRIBUTING.md')
    .replace(/\.\/doc_standard(?:\.md)?/g, './doc-standard.md')
    .replace(/\.\.\/zh_CN\/README(?:\.md)?/g, `/zh_CN/${repo}/README.md`)
    .replace(/\.\.\/en_US\/README(?:\.md)?/g, `/en_US/${repo}/README.md`)
    .replace(/\.\.\/ja_JP\/README(?:\.md)?/g, `/ja_JP/${repo}/README.md`);
}

function copyFileWithFrontmatter(source, dest, title, repo, locale) {
  const raw = rewriteLinks(
    fs.readFileSync(source, 'utf8').replace(/^---[\s\S]*?---\n/, ''),
    repo,
    locale,
  );
  const body = raw.startsWith('# ') ? raw : `# ${title}\\n\\n${raw}`;
  mkdirp(path.dirname(dest));
  fs.writeFileSync(dest, body.endsWith('\\n') ? body : `${body}\\n`);
}

function humanize(name) {
  return name
    .replace(/\\.md$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\\b\\w/g, (char) => char.toUpperCase());
}

function collectModuleFiles(localeDir) {
  const files = [];
  function walk(current, rel = '') {
    for (const entry of listDirSafe(current)) {
      const abs = path.join(current, entry.name);
      const nextRel = rel ? path.join(rel, entry.name) : entry.name;
      if (entry.isDirectory()) {
        walk(abs, nextRel);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        if (rel === '') continue;
        if (['api.md', 'tutorial.md', 'design.md'].includes(entry.name)) files.push(nextRel);
      }
    }
  }
  walk(localeDir);
  return files.sort();
}

function collectExtraRootFiles(localeDir) {
  return listDirSafe(localeDir)
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .filter((name) => !['README.md', 'doc_standard.md'].includes(name))
    .sort();
}

function validateModuleCoverage(repoName, locale, files) {
  const groups = new Map();
  for (const rel of files) {
    const dir = path.dirname(rel);
    const fileName = path.basename(rel);
    if (!groups.has(dir)) groups.set(dir, new Set());
    groups.get(dir).add(fileName);
  }
  for (const [dir, names] of groups.entries()) {
    for (const required of ['api.md', 'tutorial.md', 'design.md']) {
      if (!names.has(required)) throw new Error(`Missing ${required} for ${repoName} ${locale} ${dir}`);
    }
  }
}

function buildSidebarItems(repo, locale, files) {
  const items = [
    { text: 'Overview', link: `/${locale}/${repo}/index` },
    { text: 'Doc Standard', link: `/${locale}/${repo}/doc-standard` },
  ];
  const groups = new Map();
  for (const rel of files) {
    const parts = rel.split(path.sep);
    const fileName = parts.pop();
    const groupKey = parts.join('/');
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push({
      text: humanize(fileName),
      link: `/${locale}/${repo}/${rel.replace(/\\.md$/, '').split(path.sep).join('/')}`,
    });
  }
  for (const [groupKey, entries] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    items.push({
      text: groupKey ? humanize(groupKey) : 'Docs',
      items: entries.sort((a, b) => a.text.localeCompare(b.text)),
    });
  }
  return items;
}

rmrf(generatedRoot);
mkdirp(generatedRoot);
mkdirp(generatedDataDir);

const allLocales = ['zh_CN', 'en_US', 'ja_JP'];
const siteData = { nav: [], sidebar: {}, repos: [] };

const home = [
  '# Luna Flow Documentation',
  '',
  'This site aggregates standardized documentation from Luna-Flow repositories.',
  '',
  '- [简体中文](/zh_CN/index)',
  '- [English](/en_US/index)',
  '- [日本語](/ja_JP/index)',
  '',
].join('\\n');
fs.writeFileSync(path.join(generatedRoot, 'index.md'), home);
fs.writeFileSync(path.join(generatedRoot, 'README.md'), home);

for (const locale of allLocales) {
  const enabledRepos = config.repos.filter((repo) => repo.enabled && repo.locales.includes(locale)).sort((a, b) => a.order - b.order);
  const localeIndex = [
    `# ${localeLabels[locale]} Documentation`,
    '',
    ...enabledRepos.map((repo) => `- [${repo.title}](/${locale}/${repo.repo}/index)`),
    '',
  ].join('\\n');
  mkdirp(path.join(generatedRoot, locale));
  fs.writeFileSync(path.join(generatedRoot, locale, 'index.md'), localeIndex);
  fs.writeFileSync(path.join(generatedRoot, locale, 'README.md'), localeIndex);
  siteData.sidebar[`/${locale}/`] = [];
  for (const repo of enabledRepos) {
    const repoRootDir = path.join(workspaceRoot, repo.repo);
    const sourceBase = path.join(workspaceRoot, repo.repo, 'doc', locale);
    const readme = path.join(sourceBase, 'README.md');
    const standard = path.join(sourceBase, 'doc_standard.md');
    const rootContributing = path.join(repoRootDir, 'CONTRIBUTING.md');
    if (!fs.existsSync(readme)) throw new Error(`Missing README for ${repo.repo} ${locale}`);
    if (!fs.existsSync(standard)) throw new Error(`Missing doc_standard for ${repo.repo} ${locale}`);
    const files = collectModuleFiles(sourceBase);
    const extraFiles = collectExtraRootFiles(sourceBase);
    if (files.length === 0) throw new Error(`No module docs found for ${repo.repo} ${locale}`);
    validateModuleCoverage(repo.repo, locale, files);
    const targetBase = path.join(generatedRoot, locale, repo.repo);
    copyFileWithFrontmatter(readme, path.join(targetBase, 'index.md'), repo.title, repo.repo, locale);
    copyFileWithFrontmatter(readme, path.join(targetBase, 'README.md'), repo.title, repo.repo, locale);
    copyFileWithFrontmatter(standard, path.join(targetBase, 'doc-standard.md'), `${repo.title} Documentation Standard`, repo.repo, locale);
    copyFileWithFrontmatter(standard, path.join(targetBase, 'doc_standard.md'), `${repo.title} Documentation Standard`, repo.repo, locale);
    if (fs.existsSync(rootContributing)) {
      copyFileWithFrontmatter(rootContributing, path.join(targetBase, 'CONTRIBUTING.md'), `${repo.title} Contributing`, repo.repo, locale);
    }
    for (const extra of extraFiles) {
      copyFileWithFrontmatter(path.join(sourceBase, extra), path.join(targetBase, extra), `${repo.title} ${humanize(extra)}`, repo.repo, locale);
    }
    for (const rel of files) {
      copyFileWithFrontmatter(path.join(sourceBase, rel), path.join(targetBase, rel), `${repo.title} ${humanize(rel)}`, repo.repo, locale);
    }
    const sidebarItems = buildSidebarItems(repo.repo, locale, files);
    siteData.sidebar[`/${locale}/${repo.repo}/`] = sidebarItems;
    siteData.sidebar[`/${locale}/`].push({ text: repo.title, items: sidebarItems });
    siteData.repos.push({ locale, repo: repo.repo, title: repo.title, files });
  }
}

siteData.nav = [
  { text: 'Home', link: '/' },
  { text: '简体中文', link: '/zh_CN/index' },
  { text: 'English', link: '/en_US/index' },
  { text: '日本語', link: '/ja_JP/index' },
];

fs.writeFileSync(path.join(generatedDataDir, 'site-data.mjs'), `export default ${JSON.stringify(siteData, null, 2)};\n`);
