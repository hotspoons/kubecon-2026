import { useMemo, useState } from 'preact/hooks'
import { TYPE_ORDER, colorOf, fmtDay, fmtMinutes, minutesOf, shortRoom, type Session, type SessionType } from '../data'
import { clock, day, filtered, groupBy, schedule } from '../state'
import { Card } from './Card'

const SLOT = 15 // minutes per row
const MAX_PER_CELL = 5

interface Column { key: string; label: string; color: string; n: number }

/** Which column a session belongs to, under the chosen grouping. */
function columnOf(s: Session, by: 'type' | 'track' | 'room'): { key: string; label: string; color: string } {
  if (by === 'room') {
    const label = shortRoom(s.room) || 'TBD'
    return { key: `room:${s.room}`, label, color: colorOf(s.venue || 'x') }
  }
  if (by === 'track') {
    if (s.type === 'colo') {
      const label = s.colo ?? 'Sponsor-hosted'
      return { key: `colo:${label}`, label, color: colorOf(label) }
    }
    if (['break', 'registration', 'experience', 'showcase'].includes(s.type)) {
      return { key: `type:${s.type}`, label: typeLabel(s.type), color: colorOf(s.type) }
    }
    const t = s.tracks[0] ?? typeLabel(s.type)
    return { key: `track:${t}`, label: t, color: colorOf(t) }
  }
  if (s.type === 'colo') {
    const label = s.colo ?? 'Sponsor-hosted'
    return { key: `colo:${label}`, label, color: colorOf(label) }
  }
  return { key: `type:${s.type}`, label: typeLabel(s.type), color: colorOf(s.type) }
}

function typeLabel(t: SessionType): string {
  return schedule.value?.types[t] ?? t
}

/** Column order: types in TYPE_ORDER (co-located events alphabetical among themselves); tracks and rooms alphabetical. */
function orderColumns(cols: Map<string, Column>, by: 'type' | 'track' | 'room'): Column[] {
  const list = [...cols.values()]
  if (by === 'type') {
    const rank = (c: Column) => {
      if (c.key.startsWith('colo:')) return TYPE_ORDER.indexOf('colo') * 100 + (c.label.startsWith('Sponsor') ? 99 : 1)
      return TYPE_ORDER.indexOf(c.key.slice(5) as SessionType) * 100
    }
    return list.sort((a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label))
  }
  if (by === 'track') {
    const rank = (c: Column) => (c.key.startsWith('track:') ? 0 : c.key.startsWith('colo:') ? 1 : 2)
    return list.sort((a, b) => rank(a) - rank(b) || b.n - a.n || a.label.localeCompare(b.label))
  }
  return list.sort((a, b) => a.label.localeCompare(b.label))
}

export function Grid() {
  const d = day.value
  const by = groupBy.value
  const sessions = filtered.value.filter((s) => s.day === d)
  const now = clock.value
  const [open, setOpen] = useState<Set<string>>(() => new Set())

  const { cols, rows } = useMemo(() => {
    const cols = new Map<string, Column>()
    const cells = new Map<string, Session[]>() // `${slot}|${colKey}`
    const slots = new Set<number>()
    for (const s of sessions) {
      const c = columnOf(s, by)
      const col = cols.get(c.key) ?? { ...c, n: 0 }
      col.n++
      cols.set(c.key, col)
      const slot = Math.floor(minutesOf(s.start) / SLOT) * SLOT
      slots.add(slot)
      const k = `${slot}|${c.key}`
      const list = cells.get(k) ?? []
      list.push(s)
      cells.set(k, list)
    }
    for (const list of cells.values()) list.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : a.title.localeCompare(b.title)))
    const ordered = orderColumns(cols, by)
    const rows = [...slots].sort((a, b) => a - b).map((slot) => ({ slot, cells: ordered.map((c) => cells.get(`${slot}|${c.key}`) ?? []) }))
    return { cols: ordered, rows }
  }, [sessions, by])

  if (sessions.length === 0) {
    return (
      <div class="empty">
        <h3>Nothing on {fmtDay(d, true)} matches</h3>
        <div>Loosen the search, pick fewer interests, or show more kinds of session.</div>
      </div>
    )
  }

  const nowSlot = now.day === d ? Math.floor(now.minutes / SLOT) * SLOT : -1
  // the row the clock is in, or the next one if it sits in a gap
  const nowRow = nowSlot >= 0 ? rows.find((r) => r.slot >= nowSlot && r.slot < nowSlot + 60)?.slot ?? -1 : -1
  const widths = cols.map((c) => (c.key === 'type:talk' ? 'minmax(300px, 1.5fr)' : 'minmax(230px, 1fr)')).join(' ')

  return (
    <div class="grid-wrap">
      <div class="grid" style={`--cols:${widths}`}>
        <div class="corner" />
        {cols.map((c) => (
          <div key={c.key} class="colhead" style={`--c:${c.color}`}>
            <span class="sw" />
            {c.label}
            <span class="n">{c.n}</span>
          </div>
        ))}
        {rows.map((r) => {
          const isNow = r.slot === nowRow
          return (
            <Row key={r.slot} slot={r.slot} isNow={isNow} cells={r.cells} cols={cols} open={open} setOpen={setOpen} />
          )
        })}
      </div>
    </div>
  )
}

function Row({ slot, isNow, cells, cols, open, setOpen }: { slot: number; isNow: boolean; cells: Session[][]; cols: Column[]; open: Set<string>; setOpen: (s: Set<string>) => void }) {
  return (
    <>
      <div class={`time ${isNow ? 'now' : ''}`} data-now={isNow ? '' : undefined}>
        {fmtMinutes(slot)}
      </div>
      {cells.map((list, i) => {
        const k = `${slot}|${cols[i].key}`
        const expanded = open.has(k)
        const shown = expanded ? list : list.slice(0, MAX_PER_CELL)
        return (
          <div key={k} class={`cell ${isNow ? 'now' : ''}`}>
            {shown.map((s) => (
              <Card key={s.id} s={s} />
            ))}
            {list.length > MAX_PER_CELL && (
              <button
                class="more"
                onClick={() => {
                  const next = new Set(open)
                  if (expanded) next.delete(k)
                  else next.add(k)
                  setOpen(next)
                }}
              >
                {expanded ? 'show fewer' : `+${list.length - MAX_PER_CELL} more`}
              </button>
            )}
          </div>
        )
      })}
    </>
  )
}
