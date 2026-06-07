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

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const locales = [
  {
    id: 'root',
    source: 'en_US',
    outDir: '',
    label: 'English',
    title: 'Luna Flow Documentation',
    description: 'This site aggregates standardized documentation from Luna-Flow repositories.',
    navText: 'Home',
    overviewText: 'Overview',
    standardText: 'Doc Standard',
    docsText: 'Docs',
    lang: 'en-US',
  },
  {
    id: 'zh_CN',
    source: 'zh_CN',
    outDir: 'zh_CN',
    label: '简体中文',
    title: 'Luna Flow 文档',
    description: '这里聚合了 Luna-Flow 各仓库的标准化文档。',
    navText: '首页',
    overviewText: '概览',
    standardText: '文档规范',
    docsText: '文档',
    lang: 'zh-CN',
  },
  {
    id: 'ja_JP',
    source: 'ja_JP',
    outDir: 'ja_JP',
    label: '日本語',
    title: 'Luna Flow ドキュメント',
    description: 'このサイトは Luna-Flow 各リポジトリの標準化ドキュメントを集約します。',
    navText: 'ホーム',
    overviewText: '概要',
    standardText: '文書規約',
    docsText: 'ドキュメント',
    lang: 'ja-JP',
  },
];

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function mkdirp(target) {
  fs.mkdirSync(target, { recursive: true });
}

function listDirSafe(target) {
  return fs.existsSync(target) ? fs.readdirSync(target, { withFileTypes: true }) : [];
}

function localePrefix(locale) {
  return locale.outDir ? `/${locale.outDir}` : '';
}

function localeReadmePath(locale, repo) {
  return `${localePrefix(locale)}/${repo}/README.md` || `/${repo}/README.md`;
}

function rewriteLinks(content, repo) {
  return content
    .replace(/\.\.\/\.\.\/README(?:\.md)?/g, './README.md')
    .replace(/\.\/README(?:\.md)?/g, './README.md')
    .replace(/\.\.\/\.\.\/CONTRIBUTING(?:\.md)?/g, './CONTRIBUTING.md')
    .replace(/\.\/doc_standard(?:\.md)?/g, './doc-standard.md')
    .replace(/\.\.\/zh_CN\/README(?:\.md)?/g, localeReadmePath(locales[1], repo))
    .replace(/\.\.\/en_US\/README(?:\.md)?/g, localeReadmePath(locales[0], repo))
    .replace(/\.\.\/ja_JP\/README(?:\.md)?/g, localeReadmePath(locales[2], repo));
}

function writeMarkdownFile(file, content) {
  mkdirp(path.dirname(file));
  fs.writeFileSync(file, content.endsWith('\n') ? content : `${content}\n`);
}

function copyFileWithFrontmatter(source, dest, title, repo) {
  const raw = rewriteLinks(
    fs.readFileSync(source, 'utf8').replace(/^---[\s\S]*?---\n/, ''),
    repo,
  );
  const body = raw.startsWith('# ') ? raw : `# ${title}\n\n${raw}`;
  writeMarkdownFile(dest, body);
}

function humanize(input) {
  return input
    .replace(/\.md$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function docLabel(fileName) {
  const stem = fileName.replace(/\.md$/, '');
  if (stem === 'api') return 'API';
  if (stem === 'tutorial') return 'Tutorial';
  if (stem === 'design') return 'Design';
  return humanize(fileName);
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
        if (!rel) continue;
        if (['api.md', 'tutorial.md', 'design.md'].includes(entry.name)) {
          files.push(nextRel);
        }
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

function validateModuleCoverage(repoName, localeSource, files) {
  const groups = new Map();
  for (const rel of files) {
    const dir = path.dirname(rel);
    const fileName = path.basename(rel);
    if (!groups.has(dir)) groups.set(dir, new Set());
    groups.get(dir).add(fileName);
  }

  for (const [dir, names] of groups.entries()) {
    for (const required of ['api.md', 'tutorial.md', 'design.md']) {
      if (!names.has(required)) {
        throw new Error(`Missing ${required} for ${repoName} ${localeSource} ${dir}`);
      }
    }
  }
}

function linkFor(locale, repo, relPath) {
  const cleanRel = relPath.replace(/\.md$/, '').split(path.sep).join('/');
  const prefix = localePrefix(locale);
  return `${prefix}/${repo}/${cleanRel}`;
}

function buildSidebarItems(locale, repo, files) {
  const items = [
    { text: locale.overviewText, link: `${localePrefix(locale)}/${repo}/index` || `/${repo}/index` },
    { text: locale.standardText, link: `${localePrefix(locale)}/${repo}/doc-standard` || `/${repo}/doc-standard` },
  ];

  const groups = new Map();
  for (const rel of files) {
    const parts = rel.split(path.sep);
    const fileName = parts.pop();
    const groupKey = parts.join('/');
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push({
      text: docLabel(fileName),
      link: linkFor(locale, repo, rel),
    });
  }

  for (const [groupKey, entries] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    items.push({
      text: groupKey ? humanize(groupKey) : locale.docsText,
      items: entries.sort((a, b) => a.text.localeCompare(b.text)),
    });
  }

  return items;
}

function writeLocaleIndex(locale, repos) {
  const body = [
    `# ${locale.title}`,
    '',
    locale.description,
    '',
    ...repos.map((repo) => `- [${repo.title}](${localePrefix(locale)}/${repo.repo}/index)`),
    '',
  ].join('\n');

  const targetDir = locale.outDir ? path.join(generatedRoot, locale.outDir) : generatedRoot;
  writeMarkdownFile(path.join(targetDir, 'index.md'), body);
  writeMarkdownFile(path.join(targetDir, 'README.md'), body);
}

rmrf(generatedRoot);
mkdirp(generatedRoot);
mkdirp(generatedDataDir);

const enabledRepos = config.repos.filter((repo) => repo.enabled).sort((a, b) => a.order - b.order);
const siteData = { sidebars: {}, repos: [] };

for (const locale of locales) {
  writeLocaleIndex(locale, enabledRepos);
  siteData.sidebars[locale.id] = [];
  const targetLocaleDir = locale.outDir ? path.join(generatedRoot, locale.outDir) : generatedRoot;

  for (const repo of enabledRepos) {
    const repoRootDir = path.join(workspaceRoot, repo.repo);
    const sourceBase = path.join(repoRootDir, 'doc', locale.source);
    const readme = path.join(sourceBase, 'README.md');
    const standard = path.join(sourceBase, 'doc_standard.md');
    const rootContributing = path.join(repoRootDir, 'CONTRIBUTING.md');
    if (!fs.existsSync(readme)) throw new Error(`Missing README for ${repo.repo} ${locale.source}`);
    if (!fs.existsSync(standard)) throw new Error(`Missing doc_standard for ${repo.repo} ${locale.source}`);

    const files = collectModuleFiles(sourceBase);
    const extraFiles = collectExtraRootFiles(sourceBase);
    if (files.length === 0) throw new Error(`No module docs found for ${repo.repo} ${locale.source}`);
    validateModuleCoverage(repo.repo, locale.source, files);

    const targetBase = path.join(targetLocaleDir, repo.repo);
    copyFileWithFrontmatter(readme, path.join(targetBase, 'index.md'), repo.title, repo.repo);
    copyFileWithFrontmatter(readme, path.join(targetBase, 'README.md'), repo.title, repo.repo);
    copyFileWithFrontmatter(standard, path.join(targetBase, 'doc-standard.md'), `${repo.title} Documentation Standard`, repo.repo);
    copyFileWithFrontmatter(standard, path.join(targetBase, 'doc_standard.md'), `${repo.title} Documentation Standard`, repo.repo);

    if (fs.existsSync(rootContributing)) {
      copyFileWithFrontmatter(rootContributing, path.join(targetBase, 'CONTRIBUTING.md'), `${repo.title} Contributing`, repo.repo);
    }

    for (const extra of extraFiles) {
      copyFileWithFrontmatter(
        path.join(sourceBase, extra),
        path.join(targetBase, extra),
        `${repo.title} ${humanize(extra)}`,
        repo.repo,
      );
    }

    for (const rel of files) {
      copyFileWithFrontmatter(
        path.join(sourceBase, rel),
        path.join(targetBase, rel),
        `${repo.title} ${humanize(rel)}`,
        repo.repo,
      );
    }

    const sidebarItems = buildSidebarItems(locale, repo.repo, files);
    siteData.sidebars[locale.id].push({ text: repo.title, items: sidebarItems });
    siteData.repos.push({ locale: locale.id, repo: repo.repo, title: repo.title, files });
  }
}

writeMarkdownFile(
  path.join(generatedDataDir, 'site-data.mjs'),
  `export default ${JSON.stringify(siteData, null, 2)};\n`,
);
