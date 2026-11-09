#!/usr/bin/env node
// The PNG icons the PWA manifest and iOS need, rendered from the favicon's design with headless
// Chromium (no image library in the container). `just icons` → public/icon-192.png, icon-512.png,
// apple-touch-icon.png. Square, no rounded corners: iOS and the maskable mask round them.
import { chromium } from 'playwright'
import { writeFile } from 'node:fs/promises'

const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#070b14"/>
  <g fill="none" stroke-width="5" stroke-linecap="round">
    <path d="M17 20h30" stroke="#3b9bff"/><path d="M17 32h18" stroke="#3ddc84"/><path d="M17 44h25" stroke="#8b7bff"/>
  </g>
</svg>`

const browser = await chromium.launch()
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 })
  await page.setContent(`<body style="margin:0;background:#070b14">${svg(size)}</body>`)
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: size, height: size }, omitBackground: false })
  await writeFile(`public/${name}`, png)
  console.log(`wrote public/${name} (${png.length} bytes)`)
  await page.close()
}
await browser.close()
