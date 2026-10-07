import fs from 'node:fs';
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkAlerts from './src/plugins/remark-alerts.mjs';
import remarkPdf from './src/plugins/remark-pdf.mjs';
import rehypeHeadingIds from './src/plugins/rehype-heading-ids.mjs';
import rehypeSidenotes from './src/plugins/rehype-sidenotes.mjs';

const moonbit = JSON.parse(fs.readFileSync(new URL('./src/grammars/moonbit.tmLanguage.json', import.meta.url), 'utf8'));

export default defineConfig({
  site: 'https://lunaflow.cn',
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: {
    remarkPlugins: [remarkMath, remarkAlerts, remarkPdf],
    rehypePlugins: [rehypeHeadingIds, [rehypeKatex, { strict: false }], rehypeSidenotes],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
      defaultColor: false,
      langs: [{ ...moonbit, name: 'moonbit', aliases: ['mbt', 'mbtx', 'mbti', 'moon'] }],
      langAlias: { po: 'text', mbti: 'moonbit' },
    },
  },
  vite: {
    optimizeDeps: { exclude: ['pdfjs-dist'] },
  },
});
