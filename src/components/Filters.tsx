// The interest filters: team presets, interest chips with counts, and the show/hide chips per kind
// of session. Shared by the desktop toolbar row and the phone's full-screen picker (Picker).
import { TYPE_ORDER, type SessionType } from '../data'
import { clearInterests, hidden, interestCounts, interests, memberState, schedule, toggleInterest, toggleMember, toggleType, typeCounts } from '../state'

export const MEMBER_COLORS: Record<string, string> = { matt: '#6ac8ff', mason: '#ffb84d', liam: '#8b7bff', rich: '#3ddc84' }

export function TeamButtons() {
  const sched = schedule.value!
  return (
    <>
      {sched.team.map((m) => {
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

/** The interest chips. `all`: every interest, the ones with no session dimmed; otherwise only those with sessions (or on). */
export function InterestChips({ all = false }: { all?: boolean }) {
  const sched = schedule.value!
  const ic = interestCounts.value
  return (
    <>
      {sched.interests.map((i) => {
        const on = interests.value.includes(i.id)
        const n = ic[i.id] ?? 0
        if (!on && n === 0 && !all) return null
        return (
          <button key={i.id} class={`chip ${on ? 'on' : ''} ${n === 0 ? 'zero' : ''}`} onClick={() => toggleInterest(i.id)} title={i.blurb}>
            {i.label}
            <span class="n">{n}</span>
          </button>
        )
      })}
      {interests.value.length > 0 && !all && (
        <button class="chip ghost" onClick={clearInterests}>clear interests</button>
      )}
    </>
  )
}

export function TypeChips() {
  const sched = schedule.value!
  const tc = typeCounts.value
  return (
    <>
      {TYPE_ORDER.filter((t) => tc[t]).map((t: SessionType) => (
        <button key={t} class={`chip ${hidden.value.includes(t) ? 'off' : ''}`} onClick={() => toggleType(t)} title={hidden.value.includes(t) ? 'hidden — click to show' : 'shown — click to hide'}>
          {sched.types[t]}
          <span class="n">{tc[t]}</span>
        </button>
      ))}
    </>
  )
}
