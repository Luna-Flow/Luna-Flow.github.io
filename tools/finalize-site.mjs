// After `astro build`: redirect pages for the routes of the retired site, so
// existing links keep working. GitHub Pages serves /a/b from /a/b.html.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const site = JSON.parse(fs.readFileSync(path.join(root, '.generated', 'site.json'), 'utf8'));
let written = 0;

for (const { from, to } of site.redirects) {
  for (const file of [path.join(dist, `${from}.html`)]) {
    if (fs.existsSync(file)) continue;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      `<!doctype html><meta charset="utf-8"><title>Moved</title><link rel="canonical" href="${to}">` +
        `<meta http-equiv="refresh" content="0; url=${to}"><meta name="robots" content="noindex">` +
        `<script>location.replace(${JSON.stringify(to)} + location.hash)</script>` +
        `<p>This page has moved to <a href="${to}">${to}</a>.</p>\n`,
    );
    written += 1;
  }
}
console.log(`Wrote ${written} redirects.`);
