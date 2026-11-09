import { useEffect, useRef } from 'preact/hooks'
import { fmtDay } from '../data'
import { clearFilters, clock, colos, countByDay, day, favs, groupBy, interestSummary, interests, narrow, picker, query, schedule, setQuery, view, filtered } from '../state'
import { ActiveChips, TeamButtons } from './Filters'

export function Toolbar() {
  const sched = schedule.value!
  const counts = countByDay.value
  const q = query.value
  const total = filtered.value.length
  const nInt = interests.value.length + colos.value.length
  const word = colos.value.length ? 'filter' : 'interest'
  const searching = q.trim().length >= 2
  // the toolbar wraps to two or three rows depending on width; the grid and the list need its
  // height to size their own scroll area, so it is measured and published as --toolbar-h
  const ref = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const set = () => document.documentElement.style.setProperty('--toolbar-h', `${el.offsetHeight}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // on a phone the toolbar slides away under the header on scroll-down and comes back on scroll-up,
  // so the list gets the screen; never while typing a search
  useEffect(() => {
    const root = document.documentElement
    let last = window.scrollY
    let hid = false
    const onScroll = () => {
      const y = window.scrollY
      const dy = y - last
      last = y
      let next = hid
      if (!narrow.value || y < 40 || dy < -4 || document.activeElement === input.current || picker.value) next = false
      else if (dy > 6 && y > 120) next = true
      if (next !== hid) {
        hid = next
        root.classList.toggle('tb-hide', hid)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      root.classList.remove('tb-hide')
    }
  }, [])
  // on a phone the keyboard covers half the screen: the results must start right under the box
  useEffect(() => {
    if (narrow.value) {
      window.scrollTo(0, 0)
      document.documentElement.classList.remove('tb-hide')
    }
  }, [q])
  return (
    <div class="toolbar" ref={ref}>
      <div class="row">
        <div class="search">
          <span class="icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          </span>
          <input
            ref={input}
            type="search"
            value={q}
            placeholder="Search talks, speakers, companies, projects… (fuzzy)"
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              // Enter on a phone keyboard: done typing, put the keyboard away, show the results
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
            autocomplete="off"
            enterkeyhint="search"
            spellcheck={false}
          />
          {q ? (
            <button class="clear" onClick={() => setQuery('')} title="Clear">×</button>
          ) : (
            <kbd>/</kbd>
          )}
        </div>
        <FiltButton n={nInt} cls="mob" />
        <span class="brk" />
        <div class="seg days" role="tablist" aria-label="Day">
          {sched.event.days.map((d) => (
            <button
              key={d.date}
              class={`${day.value === d.date ? 'on' : ''} ${clock.value.day === d.date ? 'today' : ''}`}
              onClick={() => (day.value = d.date)}
              title={`${fmtDay(d.date, true)} · ${d.note}`}
            >
              {d.label} <span class="dd">{d.date.slice(8)}</span>
              <b>{counts[d.date] ?? 0}</b>
            </button>
          ))}
        </div>
        <div class="seg views" aria-label="View">
          <button class={`desk ${view.value === 'grid' ? 'on' : ''}`} onClick={() => (view.value = 'grid')}>Grid</button>
          <button class={view.value === 'list' ? 'on' : ''} onClick={() => (view.value = 'list')}>List</button>
          <button class={view.value === 'mine' ? 'on' : ''} onClick={() => (view.value = 'mine')}>
            ★<span class="desk"> Mine</span><b>{favs.value.length}</b>
          </button>
        </div>
        {view.value === 'grid' && !narrow.value && (
          <div class="seg" aria-label="Columns">
            <button class={groupBy.value === 'type' ? 'on' : ''} onClick={() => (groupBy.value = 'type')} title="Columns are kinds of session">by type</button>
            <button class={groupBy.value === 'track' ? 'on' : ''} onClick={() => (groupBy.value = 'track')} title="Columns are tracks">by track</button>
            <button class={groupBy.value === 'room' ? 'on' : ''} onClick={() => (groupBy.value = 'room')} title="Columns are rooms">by room</button>
          </div>
        )}
        <span class="count desk">
          <b>{total}</b> {searching ? 'matches' : 'sessions'}
          {nInt ? ` · ${nInt} ${word}${nInt > 1 ? 's' : ''}` : ''}
        </span>
      </div>
      <div class="row desk">
        <div class="team">
          <span class="lbl">Team</span>
          <TeamButtons />
        </div>
        <span class="sep" />
        <FiltButton n={nInt} cls="desk" />
        <ActiveChips />
        {nInt > 1 && <button class="chip ghost" onClick={clearFilters}>clear all</button>}
      </div>
      <button class="summary mob" onClick={() => (picker.value = true)}>
        <b>{total}</b> {searching ? 'matches' : 'sessions'}
        <span class="what">{nInt ? ` · ${interestSummary.value}` : ' · all interests and events'}</span>
        <span class="chev">›</span>
      </button>
    </div>
  )
}

/** Opens the interest picker; the badge is how many interests are on. */
function FiltButton({ n, cls }: { n: number; cls: string }) {
  return (
    <button class={`filt ${cls} ${n ? 'on' : ''}`} onClick={() => (picker.value = true)} title="Interests, team presets, kinds of session">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18M6 12h12M10 19h4" /></svg>
      Interests
      {n > 0 && <b>{n}</b>}
    </button>
  )
}
