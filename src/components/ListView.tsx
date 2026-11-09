import { fmtDay, fmtMinutes, minutesOf, type Session } from '../data'
import { clock, filtered, query, searchHits, day } from '../state'
import { Card } from './Card'

/**
 * Every matching session, flat, by day and start time. With a search on, every day is shown and
 * the order inside a time slot is by match quality; otherwise only the chosen day.
 */
export function ListView() {
  const hits = searchHits.value
  const searching = !!hits
  const all = filtered.value
  const sessions = searching ? all : all.filter((s) => s.day === day.value)
  if (sessions.length === 0) {
    return (
      <div class="empty">
        <h3>{searching ? `Nothing matches “${query.value.trim()}”` : `Nothing on ${fmtDay(day.value, true)} matches`}</h3>
        <div>Try fewer words, fewer interests, or show more kinds of session.</div>
      </div>
    )
  }
  return <Days sessions={sessions} rank={hits} />
}

export function Days({ sessions, rank, conflicts }: { sessions: Session[]; rank?: Map<string, number> | null; conflicts?: Set<string> }) {
  const now = clock.value
  const byDay = new Map<string, Map<number, Session[]>>()
  for (const s of sessions) {
    const d = byDay.get(s.day) ?? new Map<number, Session[]>()
    const m = minutesOf(s.start)
    const list = d.get(m) ?? []
    list.push(s)
    d.set(m, list)
    byDay.set(s.day, d)
  }
  const days = [...byDay.keys()].sort()
  return (
    <div class="list">
      {days.map((d) => {
        const slots = [...byDay.get(d)!.entries()].sort((a, b) => a[0] - b[0])
        const n = slots.reduce((a, [, l]) => a + l.length, 0)
        const nowMin = now.day === d ? now.minutes : -1
        const nowSlot = nowMin >= 0 ? slots.find(([m]) => m >= nowMin - 30 && m <= nowMin + 60)?.[0] ?? -1 : -1
        return (
          <section key={d}>
            <div class="dayhead">
              {fmtDay(d, true)}
              <span class="n">{n} session{n === 1 ? '' : 's'}</span>
            </div>
            {slots.map(([m, list]) => {
              const sorted = rank ? [...list].sort((a, b) => (rank.get(a.id) ?? 1) - (rank.get(b.id) ?? 1)) : list
              const isNow = m === nowSlot
              return (
                <div key={m} class="slot">
                  <div class={`time ${isNow ? 'now' : ''}`} data-now={isNow ? '' : undefined}>{fmtMinutes(m)}</div>
                  <div class="cards">
                    {sorted.map((s) => (
                      <Card key={s.id} s={s} wide conflict={conflicts?.has(s.id)} />
                    ))}
                  </div>
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
