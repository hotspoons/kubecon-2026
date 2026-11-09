import { useEffect } from 'preact/hooks'
import { clearInterests, filtered, interests, picker, query } from '../state'
import { InterestChips, TeamButtons, TypeChips } from './Filters'

/** The phone's interest browser: a full-screen sheet with the team presets, every interest with its count, and the kinds of session. */
export function Picker() {
  const n = interests.value.length
  const total = filtered.value.length
  const close = () => (picker.value = false)
  // the page behind must not scroll while the sheet is up
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])
  return (
    <div class="sheet" role="dialog" aria-modal="true" aria-label="Interests">
      <div class="sh">
        <div>
          <b>Interests</b>
          <span class="count">
            <b>{total}</b> {query.value.trim().length >= 2 ? 'matches' : 'sessions'}
            {n ? ` · ${n} interest${n > 1 ? 's' : ''}` : ''}
          </span>
        </div>
        <button class="btn primary" onClick={close}>Done</button>
      </div>
      <div class="sb">
        <h4>Team</h4>
        <div class="chips">
          <TeamButtons />
        </div>
        <h4>
          Interests
          {n > 0 && <button class="lnk" onClick={clearInterests}>clear</button>}
        </h4>
        <div class="chips">
          <InterestChips all />
        </div>
        <h4>Kinds of session</h4>
        <div class="chips">
          <TypeChips />
        </div>
        <div class="hint">Tap an interest to add it; a team member for their whole set. Open a session to see why it was tagged.</div>
      </div>
    </div>
  )
}
