// The interest filters: team presets, interest chips with counts, the show/hide chips per kind of
// session, and the chips currently on. Shared by the toolbar and the picker (Picker), which can
// narrow them with a `filter` string (matched against the label, the blurb and the id).
import { TYPE_ORDER, colorOf, type SessionType } from '../data'
import { coloCounts, colos, hidden, interestCounts, interests, memberState, schedule, toggleColo, toggleInterest, toggleMember, toggleType, typeCounts } from '../state'

export const MEMBER_COLORS: Record<string, string> = { matt: '#6ac8ff', mason: '#ffb84d', liam: '#8b7bff', rich: '#3ddc84', ed: '#ff6b8b', ryan: '#2fd4d4' }

export function matches(filter: string | undefined, ...texts: string[]): boolean {
  const q = (filter ?? '').trim().toLowerCase()
  if (!q) return true
  return q.split(/\s+/).every((w) => texts.some((t) => t.toLowerCase().includes(w)))
}

export function TeamButtons({ filter }: { filter?: string }) {
  const sched = schedule.value!
  return (
    <>
      {sched.team.map((m) => {
        if (!matches(filter, m.name, m.about, ...m.interests)) return null
        const st = memberState(m)
        return (
          <button
            key={m.id}
            class={`member ${st}`}
            style={`--c:${MEMBER_COLORS[m.id] ?? '#3b9bff'}`}
            onClick={() => toggleMember(m)}
            title={`${m.name}: ${m.about} → ${m.interests.join(', ')}`}
          >
            <span class="av">{m.name[0]}</span>
            {m.name}
          </button>
        )
      })}
    </>
  )
}

/** Every interest as a chip with its count under the current search and kinds; the ones with no session dimmed. */
export function InterestChips({ filter }: { filter?: string }) {
  const sched = schedule.value!
  const ic = interestCounts.value
  return (
    <>
      {sched.interests.map((i) => {
        if (!matches(filter, i.label, i.blurb, i.id)) return null
        const on = interests.value.includes(i.id)
        const n = ic[i.id] ?? 0
        return (
          <button key={i.id} class={`chip ${on ? 'on' : ''} ${n === 0 ? 'zero' : ''}`} onClick={() => toggleInterest(i.id)} title={i.blurb}>
            {i.label}
            <span class="n">{n}</span>
          </button>
        )
      })}
    </>
  )
}

/** The co-located events (Monday), each a chip with its count and the colour its cards wear. */
export function ColoChips({ filter }: { filter?: string }) {
  const cc = coloCounts.value
  const names = Object.keys(cc).sort((a, b) => a.localeCompare(b))
  return (
    <>
      {names.map((name) => {
        if (!matches(filter, name)) return null
        const on = colos.value.includes(name)
        return (
          <button key={name} class={`chip ${on ? 'on' : ''}`} style={`--c:${colorOf(name)}`} onClick={() => toggleColo(name)}>
            <span class="sw" />
            {name}
            <span class="n">{cc[name]}</span>
          </button>
        )
      })}
    </>
  )
}

/** The interests and co-located events currently on, each a chip that turns it off. */
export function ActiveChips() {
  const sched = schedule.value!
  const labels = new Map(sched.interests.map((i) => [i.id, i.label]))
  const ic = interestCounts.value
  const cc = coloCounts.value
  return (
    <>
      {colos.value.map((name) => (
        <button key={name} class="chip on" style={`--c:${colorOf(name)}`} onClick={() => toggleColo(name)} title="Click to turn off">
          <span class="sw" />
          {name}
          <span class="n">{cc[name] ?? 0}</span>
          <span class="x">×</span>
        </button>
      ))}
      {interests.value.map((id) => (
        <button key={id} class="chip on" onClick={() => toggleInterest(id)} title="Click to turn off">
          {labels.get(id) ?? id}
          <span class="n">{ic[id] ?? 0}</span>
          <span class="x">×</span>
        </button>
      ))}
    </>
  )
}

export function TypeChips({ filter }: { filter?: string }) {
  const sched = schedule.value!
  const tc = typeCounts.value
  return (
    <>
      {TYPE_ORDER.filter((t) => tc[t] && matches(filter, sched.types[t], t)).map((t: SessionType) => (
        <button key={t} class={`chip ${hidden.value.includes(t) ? 'off' : ''}`} onClick={() => toggleType(t)} title={hidden.value.includes(t) ? 'hidden — click to show' : 'shown — click to hide'}>
          {sched.types[t]}
          <span class="n">{tc[t]}</span>
        </button>
      ))}
    </>
  )
}
