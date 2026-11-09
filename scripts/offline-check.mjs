#!/usr/bin/env node
// Does the production build open with no network after a first visit? Against `just preview`
// (:4173) or any URL: load once online, wait for the service worker to finish precaching, go
// offline, reload, and expect the schedule to render. `just offline` runs it against the preview.
//   node scripts/offline-check.mjs [--url http://localhost:4173/] [--out shots/offline.png]
import { chromium, devices } from 'playwright'

const args = process.argv.slice(2)
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : dflt
}
const url = opt('url', 'http://localhost:4173/')
const out = opt('out', 'shots/offline.png')

const browser = await chromium.launch()
const context = await browser.newContext({ ...devices['iPhone 14'] })
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForSelector('[data-ready]', { timeout: 20000 })
// the worker is registered on load; wait for it to be active and its precache to be complete
const sw = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.ready
  for (let i = 0; i < 100 && !navigator.serviceWorker.controller; i++) await new Promise((r) => setTimeout(r, 100))
  const keys = await caches.keys()
  const c = await caches.open(keys.find((k) => k.startsWith('kc26-')) ?? '')
  const urls = (await c.keys()).map((r) => new URL(r.url))
  const cached = urls.filter((u) => u.origin === location.origin).map((u) => u.pathname)
  const fonts = urls.filter((u) => u.hostname === 'fonts.gstatic.com').length
  return { scope: reg.scope, controlled: !!navigator.serviceWorker.controller, cached, fonts }
})
console.log(`service worker: scope ${sw.scope}, controlling: ${sw.controlled}, cached ${sw.cached.length} urls${sw.fonts ? ` (${sw.fonts} font files)` : ' (no fonts: Google unreachable at install?)'}`)
const need = ['/', '/data/schedule.json']
const missing = need.filter((p) => !sw.cached.includes(p))
if (missing.length) errors.push(`not precached: ${missing.join(', ')}`)
if (!sw.cached.some((p) => p.startsWith('/assets/') && p.endsWith('.js'))) errors.push('no js bundle in the cache')

await context.setOffline(true)
await page.goto(url + '#d=2026-11-11&v=list', { waitUntil: 'domcontentloaded' }).catch((e) => errors.push(`offline reload failed: ${e.message}`))
const ready = await page.waitForSelector('[data-ready]', { timeout: 15000 }).then(() => true).catch(() => false)
if (!ready) errors.push('offline: the app did not render the schedule')
const cards = await page.locator('.card').count()
console.log(`offline reload: rendered=${ready}, ${cards} cards on screen`)
if (ready && cards === 0) errors.push('offline: rendered but no sessions')
await page.screenshot({ path: out })
await browser.close()
console.log(`wrote ${out}${errors.length ? `\nERRORS:\n  ${errors.join('\n  ')}` : '\nOK: the app works offline'}`)
process.exit(errors.length ? 1 : 0)
