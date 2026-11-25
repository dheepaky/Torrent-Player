import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Plugin that auto-generates dynamic sitemap.xml and robots.txt based on environment or relative paths
function autoSeoPlugin() {
  return {
    name: 'auto-seo-plugin',
    generateBundle() {
      const siteUrl = (process.env.VITE_SITE_URL || process.env.SITE_URL || '').replace(/\/+$/, '')
      const today = new Date().toISOString().split('T')[0]
      const locUrl = siteUrl ? `${siteUrl}/` : './'
      const sitemapUrl = siteUrl ? `${siteUrl}/sitemap.xml` : 'sitemap.xml'

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${locUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`,
      })

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    autoSeoPlugin(),
  ],
  base: './',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/webtorrent': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
