import { useEffect, useRef, useState } from 'preact/hooks'
import { TYPE_ORDER } from '../data'
import { clearFilters, coloCounts, colos, filtered, interests, narrow, picker, query, schedule, typeCounts } from '../state'
import { ColoChips, InterestChips, TeamButtons, TypeChips, matches } from './Filters'

/**
 * The interest browser: a dialog (full screen on a phone) with a filter box, the team presets,
 * every interest with its count, and the kinds of session. Scrolls vertically; typing narrows all three.
 */
export function Picker() {
  const sched = schedule.value!
  const n = interests.value.length + colos.value.length
  const word = colos.value.length ? 'filter' : 'interest'
  const total = filtered.value.length
  const [q, setQ] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const close = () => (picker.value = false)
  useEffect(() => {
    // the page behind must not scroll while the dialog is up; on a desktop the cursor goes to the box
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (!narrow.value) input.current?.focus()
    return () => {
      document.body.style.overflow = prev
    }
  }, [])
  const tc = typeCounts.value
  const anyMember = sched.team.some((m) => matches(q, m.name, m.about, ...m.interests))
  const anyInterest = sched.interests.some((i) => matches(q, i.label, i.blurb, i.id))
  const anyType = TYPE_ORDER.some((t) => tc[t] && matches(q, sched.types[t], t))
  const anyColo = Object.keys(coloCounts.value).some((name) => matches(q, name))
  return (
    <>
      <div class="scrim pk" onClick={close} />
      <div class="sheet" role="dialog" aria-modal="true" aria-label="Interests">
        <div class="sh">
          <div>
            <b>Interests</b>
            <span class="count">
              <b>{total}</b> {query.value.trim().length >= 2 ? 'matches' : 'sessions'}
              {n ? ` · ${n} ${word}${n > 1 ? 's' : ''}` : ''}
            </span>
          </div>
          {n > 0 && <button class="btn" onClick={clearFilters}>Clear</button>}
          <button class="btn primary" onClick={close}>Done</button>
        </div>
        <div class="ps">
          <input
            ref={input}
            type="search"
            value={q}
            placeholder="Filter topics: storage, agents, gpu, testing…"
            onInput={(e) => setQ((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
            autocomplete="off"
            enterkeyhint="done"
            spellcheck={false}
          />
          {q && <button class="clear" onClick={() => setQ('')} title="Clear">×</button>}
        </div>
        <div class="sb">
          {anyMember && (
            <>
              <h4>Team</h4>
              <div class="chips">
                <TeamButtons filter={q} />
              </div>
            </>
          )}
          {anyInterest && (
            <>
              <h4>Interests</h4>
              <div class="chips">
                <InterestChips filter={q} />
              </div>
            </>
          )}
          {anyColo && (
            <>
              <h4>Co-located events · Monday</h4>
              <div class="chips">
                <ColoChips filter={q} />
              </div>
            </>
          )}
          {anyType && (
            <>
              <h4>Kinds of session</h4>
              <div class="chips">
                <TypeChips filter={q} />
              </div>
            </>
          )}
          {!anyMember && !anyInterest && !anyColo && !anyType && <div class="hint">Nothing matches “{q}”.</div>}
          {!q && <div class="hint">Tap an interest to add it; a team member for their whole set; a co-located event to see only its sessions. Open a session to see why it was tagged.</div>}
        </div>
      </div>
    </>
  )
}
