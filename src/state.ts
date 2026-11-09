// All the app's state, as signals, and the URL hash that mirrors the shareable part of it.
import { signal, computed, effect, batch } from '@preact/signals'
import { DEFAULT_HIDDEN, loadSchedule, nowInSLC, type Member, type Schedule, type Session, type SessionType } from './data'
import { buildIndex, search } from './search'

export type View = 'grid' | 'list' | 'mine'
export type GroupBy = 'type' | 'track' | 'room'

export const schedule = signal<Schedule | null>(null)
export const error = signal<string | null>(null)
export const day = signal<string>('2026-11-10')
export const view = signal<View>(window.innerWidth < 760 ? 'list' : 'grid')
export const groupBy = signal<GroupBy>('type')
export const query = signal<string>('')
export const interests = signal<string[]>([])
/** Co-located events (Monday) to narrow to; empty is all. */
export const colos = signal<string[]>([])
export const hidden = signal<SessionType[]>([...DEFAULT_HIDDEN])
export const favs = signal<string[]>(readLS('kc26.favs', []))
export const selected = signal<string | null>(null)
export const clock = signal(nowInSLC())
export const toast = signal<string | null>(null)
/** A phone-sized screen (the CSS breakpoint, mirrored): no grid, the interest picker is a sheet. */
export const narrow = signal(window.matchMedia('(max-width: 760px)').matches)
window.matchMedia('(max-width: 760px)').addEventListener('change', (e) => (narrow.value = e.matches))
/** The full-screen interest picker (phones). */
export const picker = signal(false)

function readLS<T>(key: string, dflt: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : dflt
  } catch {
    return dflt
  }
}
function writeLS(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* private mode, full, whatever: the page still works */
  }
}

// ---- derived ---------------------------------------------------------------------------------

export const sessionsById = computed(() => new Map((schedule.value?.sessions ?? []).map((s) => [s.id, s])))
export const searchHits = computed(() => search(query.value))

/** Everything that survives the type and search filters: what the co-located event chips count. */
const pool0 = computed(() => {
  const all = schedule.value?.sessions ?? []
  const hide = new Set(hidden.value)
  const hits = searchHits.value
  return all.filter((s) => !hide.has(s.type) && (!hits || hits.has(s.id)))
})
/** …and the co-located event filter on top (not interests): what the interest chips count. */
export const pool = computed(() => {
  const want = colos.value
  if (want.length === 0) return pool0.value
  return pool0.value.filter((s) => s.colo && want.includes(s.colo))
})

/** …and the interest filter on top: what the grid and list show. */
export const filtered = computed(() => {
  const want = interests.value
  if (want.length === 0) return pool.value
  return pool.value.filter((s) => s.interests.some((i) => want.includes(i)))
})

export const countByDay = computed(() => {
  const out: Record<string, number> = {}
  for (const s of filtered.value) out[s.day] = (out[s.day] ?? 0) + 1
  return out
})

export const interestCounts = computed(() => {
  const out: Record<string, number> = {}
  for (const s of pool.value) for (const i of s.interests) out[i] = (out[i] ?? 0) + 1
  return out
})

export const coloCounts = computed(() => {
  const out: Record<string, number> = {}
  for (const s of pool0.value) if (s.colo) out[s.colo] = (out[s.colo] ?? 0) + 1
  return out
})

export const typeCounts = computed(() => {
  const out: Partial<Record<SessionType, number>> = {}
  for (const s of schedule.value?.sessions ?? []) out[s.type] = (out[s.type] ?? 0) + 1
  return out
})

export const favSessions = computed(() => {
  const by = sessionsById.value
  return favs.value.map((id) => by.get(id)).filter((s): s is Session => !!s).sort((a, b) => (a.start < b.start ? -1 : 1))
})

export const selectedSession = computed(() => (selected.value ? sessionsById.value.get(selected.value) ?? null : null))

/** The view actually rendered: the grid is a desktop thing, a phone gets the list instead. */
export const shownView = computed<View>(() => (narrow.value && view.value === 'grid' ? 'list' : view.value))

/** The active filters, said short: co-located events, members whose whole preset is on, then the rest by label. */
export const interestSummary = computed(() => {
  const sched = schedule.value
  const want = interests.value
  if (!sched || (want.length === 0 && colos.value.length === 0)) return ''
  const covered = new Set<string>()
  const parts: string[] = [...colos.value]
  for (const m of sched.team) {
    if (m.interests.every((i) => want.includes(i))) {
      parts.push(m.name)
      m.interests.forEach((i) => covered.add(i))
    }
  }
  const labels = new Map(sched.interests.map((i) => [i.id, i.label]))
  for (const i of want) if (!covered.has(i)) parts.push(labels.get(i) ?? i)
  return parts.join(', ')
})

/** Is the clock inside the event, and on which day? */
export const live = computed(() => {
  const days = schedule.value?.event.days.map((d) => d.date) ?? []
  return days.includes(clock.value.day)
})

// ---- actions ---------------------------------------------------------------------------------

export function toggleInterest(id: string) {
  const cur = interests.value
  interests.value = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
}
export function clearInterests() {
  interests.value = []
}
export function toggleColo(name: string) {
  const cur = colos.value
  colos.value = cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name]
}
/** Interests and co-located events both off. */
export function clearFilters() {
  batch(() => {
    interests.value = []
    colos.value = []
  })
}
export function memberState(m: Member): 'on' | 'half' | 'off' {
  const cur = new Set(interests.value)
  const n = m.interests.filter((i) => cur.has(i)).length
  return n === m.interests.length ? 'on' : n > 0 ? 'half' : 'off'
}
/** All of a member's interests on; if they already are, off. */
export function toggleMember(m: Member) {
  const cur = interests.value
  if (memberState(m) === 'on') interests.value = cur.filter((i) => !m.interests.includes(i))
  else interests.value = [...new Set([...cur, ...m.interests])]
}
export function toggleType(t: SessionType) {
  const cur = hidden.value
  hidden.value = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]
}
export function toggleFav(id: string) {
  const cur = favs.value
  favs.value = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
}
export function isFav(id: string) {
  return favs.value.includes(id)
}
// Opening a session pushes a history entry, so the phone's back gesture (and the browser's back
// button) closes the drawer instead of leaving the site. Closing pops it again.
let pushedForDrawer = false
export function select(id: string | null) {
  if (id && !selected.value) {
    history.pushState(history.state, '', location.href)
    pushedForDrawer = true
    selected.value = id
    return
  }
  selected.value = id
  if (!id && pushedForDrawer) {
    pushedForDrawer = false
    history.back()
  }
}
export function setQuery(q: string) {
  query.value = q
}

let toastTimer = 0
export function showToast(msg: string) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = null), 2200)
}

/** Today in Salt Lake City if the event is on, and scroll to the row the clock is in. */
export function jumpToNow() {
  const sched = schedule.value
  if (!sched) return
  const now = nowInSLC()
  clock.value = now
  const days = sched.event.days.map((d) => d.date)
  batch(() => {
    if (days.includes(now.day)) day.value = now.day
    else day.value = now.day < days[0] ? days[1] ?? days[0] : days[days.length - 1]
    if (view.value === 'mine') view.value = 'grid'
  })
  requestAnimationFrame(() => {
    document.querySelector('[data-now]')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}

export async function copyLink(s?: Session) {
  const url = new URL(location.href)
  url.hash = s ? `s=${s.id}&d=${s.day}` : location.hash
  try {
    await navigator.clipboard.writeText(url.toString())
    showToast('Link copied')
  } catch {
    showToast(url.toString())
  }
}

// ---- the URL hash ----------------------------------------------------------------------------
// #d=2026-11-10&v=grid&g=type&q=words&i=storage,agents&c=ArgoCon,FluxCon&h=break,registration&s=1234
// Only what differs from the defaults is written. Reading happens once at start; writing, on
// every change, with replaceState so the back button is not a filter history.

const DEFAULT_HIDDEN_KEY = [...DEFAULT_HIDDEN].sort().join(',')

function readHash() {
  const h = new URLSearchParams(location.hash.replace(/^#/, ''))
  const d = h.get('d')
  if (d) day.value = d
  const v = h.get('v')
  if (v === 'grid' || v === 'list' || v === 'mine') view.value = v
  const g = h.get('g')
  if (g === 'type' || g === 'track' || g === 'room') groupBy.value = g
  const q = h.get('q')
  if (q) query.value = q
  const i = h.get('i')
  if (i !== null) interests.value = i ? i.split(',').filter(Boolean) : []
  else interests.value = readLS('kc26.interests', [])
  const c = h.get('c')
  colos.value = c ? c.split(',').filter(Boolean) : []
  const hid = h.get('h')
  if (hid !== null) hidden.value = hid ? (hid.split(',') as SessionType[]) : []
  selected.value = h.get('s')
}

function writeHash() {
  const h = new URLSearchParams()
  h.set('d', day.value)
  if (view.value !== 'grid') h.set('v', view.value)
  if (groupBy.value !== 'type') h.set('g', groupBy.value)
  if (query.value.trim()) h.set('q', query.value.trim())
  if (interests.value.length) h.set('i', interests.value.join(','))
  if (colos.value.length) h.set('c', colos.value.join(','))
  const hk = [...hidden.value].sort().join(',')
  if (hk !== DEFAULT_HIDDEN_KEY) h.set('h', hk)
  if (selected.value) h.set('s', selected.value)
  const next = '#' + h.toString().replace(/%2C/g, ',')
  if (location.hash !== next) history.replaceState(history.state, '', next)
}

/** Pick the day to open on: today during the event, the first real day before it, the last after. */
function defaultDay(sched: Schedule): string {
  const days = sched.event.days.map((d) => d.date)
  const today = nowInSLC().day
  if (days.includes(today)) return today
  if (today < days[0]) return days[1] ?? days[0]
  return days[days.length - 1]
}

let started = false
export async function init() {
  if (started) return
  started = true
  try {
    const sched = await loadSchedule()
    buildIndex(sched.sessions)
    batch(() => {
      schedule.value = sched
      day.value = defaultDay(sched)
      readHash()
      if (!sched.event.days.some((d) => d.date === day.value)) day.value = defaultDay(sched)
    })
    effect(writeHash)
    effect(() => writeLS('kc26.favs', favs.value))
    effect(() => writeLS('kc26.interests', interests.value))
    window.addEventListener('hashchange', () => {
      pushedForDrawer = false
      batch(readHash)
    })
    setInterval(() => (clock.value = nowInSLC()), 30_000)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && picker.value) picker.value = false
      else if (e.key === 'Escape' && selected.value) select(null)
      if (e.key === '/' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('.search input')?.focus()
      }
    })
  } catch (e) {
    error.value = (e as Error).message
  }
}
