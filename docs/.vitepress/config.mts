import { defineConfig } from 'vitepress'
import siteData from './generated/site-data.mjs'

export default defineConfig({
  srcDir: './pages',
  title: 'Luna Flow',
  vite: {
    publicDir: '../.vitepress/public',
  },
  description: 'Luna Flow cross-repository documentation portal.',
  themeConfig: {
    logo: '/logo.svg',
    nav: siteData.nav,
    sidebar: siteData.sidebar,
    socialLinks: [{ icon: 'github', link: 'https://github.com/Luna-Flow' }],
    search: { provider: 'local' },
  },
})
