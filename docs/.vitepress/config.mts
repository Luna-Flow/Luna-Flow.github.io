import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import siteData from './generated/site-data.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const moonbitGrammar = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'grammars', 'moonbit.tmLanguage.json'), 'utf8'),
)

export default defineConfig({
  srcDir: './pages',
  title: 'Luna Flow',
  description: 'Luna Flow cross-repository documentation portal.',
  vite: {
    publicDir: '../.vitepress/public',
  },
  markdown: {
    languages: [
      {
        ...moonbitGrammar,
        aliases: ['mbt', 'mbtx', 'mbti', 'moon', 'moonbit-package', 'moonbit_package'],
      },
    ],
  },
  themeConfig: {
    logo: '/logo.svg',
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/Luna-Flow' }],
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: [{ text: 'Home', link: '/' }],
        sidebar: siteData.sidebars.root,
      },
    },
    '/zh_CN/': {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh_CN/',
      themeConfig: {
        nav: [{ text: '首页', link: '/zh_CN/' }],
        sidebar: siteData.sidebars.zh_CN,
      },
    },
    '/ja_JP/': {
      label: '日本語',
      lang: 'ja-JP',
      link: '/ja_JP/',
      themeConfig: {
        nav: [{ text: 'ホーム', link: '/ja_JP/' }],
        sidebar: siteData.sidebars.ja_JP,
      },
    },
  },
})
