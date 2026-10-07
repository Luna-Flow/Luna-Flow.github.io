// UI strings for build-time plugins, read from the prepared site data.
import fs from 'node:fs';
import path from 'node:path';

let cache = null;
let stamp = 0;

export function stringsFor(url = '') {
  const file = path.resolve('.generated/site.json');
  const mtime = fs.existsSync(file) ? fs.statSync(file).mtimeMs : 0;
  if (!cache || mtime !== stamp) {
    cache = mtime ? JSON.parse(fs.readFileSync(file, 'utf8')).strings : {};
    stamp = mtime;
  }
  const lang = String(url).split('/')[1] ?? '';
  return { ...(cache.en ?? {}), ...(cache[lang] ?? {}) };
}
