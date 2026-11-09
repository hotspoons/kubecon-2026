import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { defineConfig, type Plugin } from 'vite'
import preact from '@preact/preset-vite'

// One page. The schedule snapshot is a static file (public/data/schedule.json) fetched at start,
// so the bundle stays small and the data can be refreshed without a rebuild of the code.
export default defineConfig({
  plugins: [preact(), sw()],
  // the dependency scanner otherwise crawls every .html under the root, including ext/piedmont's
  optimizeDeps: { entries: ['index.html'] },
  server: { port: 5173, strictPort: true, fs: { deny: ['.devhome/**', 'ext/**'] } },
  preview: { port: 4173, strictPort: true },
  build: { sourcemap: false, target: 'es2022' },
})

/**
 * Emits dist/sw.js from src/sw.js with the list of files to precache (the shell, every hashed
 * asset, the schedule, the icons) and a version that changes whenever any of them does, so a
 * deploy that changes nothing leaves everyone's cache alone and one that does replaces it whole.
 */
function sw(): Plugin {
  return {
    name: 'kc26-sw',
    apply: 'build',
    generateBundle(_opts, bundle) {
      const assets = Object.keys(bundle).filter((f) => f.startsWith('assets/')).sort().map((f) => `/${f}`)
      const precache = ['/', '/data/schedule.json', '/manifest.webmanifest', '/favicon.svg', '/patapsco.svg', '/icon-192.png', '/icon-512.png', ...assets]
      const version = createHash('sha1')
        .update(readFileSync('index.html'))
        .update(readFileSync('src/sw.js'))
        .update(precache.join('\n'))
        .digest('hex')
        .slice(0, 12)
      const fontsCss = readFileSync('index.html', 'utf8').match(/href="(https:\/\/fonts\.googleapis\.com[^"]+)"/)?.[1] ?? ''
      const source = readFileSync('src/sw.js', 'utf8')
        .replace('__VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(precache))
        .replace('__FONTS_CSS__', fontsCss)
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}
