import { clock, jumpToNow, live, schedule } from '../state'
import { fmtMinutes } from '../data'

export function Header() {
  const sched = schedule.value
  return (
    <header class="hdr">
      <div class="brand">
        <span class="name">
          <em>KubeCon</em> NA 2026
        </span>
        <span class="where">{sched ? `${sched.event.city} · Nov 9–12 · ${sched.event.venue}` : ''}</span>
      </div>
      <div class="spacer" />
      <button class={`now-btn ${live.value ? 'live' : ''}`} onClick={jumpToNow} title="Jump to what's on right now (Salt Lake City time)">
        <span class="dot" />
        {live.value ? `Now · ${fmtMinutes(clock.value.minutes)}` : 'Now'}
      </button>
      <div class="sponsor">
        <a href="https://patapsco.ai" target="_blank" rel="noopener" title="Patapsco.ai — the sovereign AI platform">
          <img src="/patapsco.svg" alt="Patapsco.ai" />
        </a>
        <div class="tiers">
          <b>Patapsco.ai</b>
          <span>Platinum · Cloud Native AI + Inference Day</span>
          <span>Silver · KubeCon + CloudNativeCon</span>
        </div>
      </div>
    </header>
  )
}
