import { minutesOf } from '../data'
import { downloadICS } from '../ics'
import { favSessions, favs, showToast, view } from '../state'
import { Days } from './ListView'

/** The starred sessions, by day, with overlaps marked, and an .ics of them. */
export function Mine() {
  const mine = favSessions.value
  if (mine.length === 0) {
    return (
      <div class="empty">
        <h3>Nothing starred yet</h3>
        <div>Tap ☆ on any session to build your own schedule. It stays in this browser.</div>
        <div class="acts">
          <button class="btn primary" onClick={() => (view.value = 'list')}>Browse the schedule</button>
        </div>
      </div>
    )
  }
  const conflicts = new Set<string>()
  for (let i = 0; i < mine.length; i++) {
    for (let j = i + 1; j < mine.length; j++) {
      const a = mine[i]
      const b = mine[j]
      if (a.day !== b.day) continue
      if (minutesOf(b.start) < minutesOf(a.end) && minutesOf(a.start) < minutesOf(b.end)) {
        conflicts.add(a.id)
        conflicts.add(b.id)
      }
    }
  }
  return (
    <>
      <div class="row" style="padding:12px 16px 0;max-width:980px;margin:0 auto;width:100%">
        <span class="count">
          <b>{mine.length}</b> starred{conflicts.size ? ` · ${conflicts.size} overlap` : ''}
        </span>
        <span style="flex:1" />
        <button class="btn" onClick={() => downloadICS(mine)}>Export .ics</button>
        <button
          class="btn danger"
          onClick={() => {
            if (confirm('Clear every starred session?')) {
              favs.value = []
              showToast('Cleared')
            }
          }}
        >
          Clear
        </button>
      </div>
      <Days sessions={mine} conflicts={conflicts} />
    </>
  )
}
