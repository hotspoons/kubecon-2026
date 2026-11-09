import { render } from 'preact'
import { App } from './app'
import { init, showToast } from './state'
import './styles.css'

render(<App />, document.getElementById('app')!)
init()

// Offline: the service worker (src/sw.js, built by vite.config.ts) caches the app and the schedule.
// Production only; the dev server has no sw.js and a stale worker would hide live edits.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const had = !!navigator.serviceWorker.controller
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (had) showToast('A newer version is ready · reload to get it')
  })
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}
