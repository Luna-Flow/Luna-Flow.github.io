import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const config = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'docs', 'repo-docs.config.json'), 'utf8'),
);
const outputPath = process.argv[2];
const token = process.env.GH_TOKEN;

if (!outputPath) throw new Error('Usage: node scripts/discover-repos.mjs <output.json>');
if (!token) throw new Error('GH_TOKEN is required to discover repositories');

const excluded = new Set(config.exclude ?? []);
const repositories = [];

for (let page = 1; ; page += 1) {
  const response = await fetch(
    `https://api.github.com/orgs/Luna-Flow/repos?type=all&per_page=100&page=${page}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Luna-Flow-docs-builder',
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub repository discovery failed: ${response.status} ${response.statusText}`);
  }

  const pageItems = await response.json();
  for (const repository of pageItems) {
    if (!repository.private && !repository.fork && !excluded.has(repository.name)) {
      repositories.push(repository.name);
    }
  }

  if (pageItems.length < 100) break;
}

repositories.sort((left, right) => left.localeCompare(right));
fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
fs.writeFileSync(path.resolve(outputPath), `${JSON.stringify({ repositories }, null, 2)}\n`);
console.log(`Discovered ${repositories.length} public, non-fork repositories.`);
