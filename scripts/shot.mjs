#!/usr/bin/env node
// Screenshot the running app with headless Chromium, so an agent can see what it built.
//   node scripts/shot.mjs --url http://localhost:5173/#d=2026-11-10 --out shots/tue.png [--width 1440] [--height 900] [--full] [--mobile]
//     [--click <selector>]... [--type <text>] [--scroll <px>] [--wait <ms>]
// --click, --type and --scroll happen in the order given, after the app is ready: --click clicks the
// first element the CSS selector matches, --type types into the search box, --scroll scrolls the page
// (a negative number scrolls back up by that much, after a scroll down, to see the toolbar return).
import { chromium, devices } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

const args = process.argv.slice(2)
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : dflt
}
const url = opt('url', 'http://localhost:5173/')
const out = opt('out', 'shots/app.png')
const width = Number(opt('width', 1440))
const height = Number(opt('height', 900))
const full = args.includes('--full')
const mobile = args.includes('--mobile')
const steps = []
for (let i = 0; i < args.length; i++) {
  if (['--click', '--type', '--scroll', '--wait'].includes(args[i])) steps.push([args[i].slice(2), args[++i]])
}

await mkdir(dirname(out), { recursive: true })
const browser = await chromium.launch()
const context = await browser.newContext(mobile ? { ...devices['iPhone 14'] } : { viewport: { width, height }, deviceScaleFactor: 1, colorScheme: 'dark' })
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForSelector('[data-ready]', { timeout: 20000 }).catch(() => errors.push('app never set [data-ready]'))
await page.waitForTimeout(300)
for (const [what, arg] of steps) {
  if (what === 'click') await page.click(arg)
  else if (what === 'type') await page.fill('.search input', arg)
  else if (what === 'scroll') {
    const n = Number(arg)
    // in steps, so the scroll-direction logic sees it like a thumb would
    for (let i = 0; i < 10; i++) await page.mouse.wheel(0, n / 10)
  } else if (what === 'wait') await page.waitForTimeout(Number(arg))
  await page.waitForTimeout(350)
}
await page.screenshot({ path: out, fullPage: full })
await browser.close()
console.log(`wrote ${out}${errors.length ? `\nERRORS:\n  ${errors.join('\n  ')}` : ''}`)
process.exit(errors.length ? 1 : 0)
