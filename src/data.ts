// The schedule snapshot (public/data/schedule.json, made by scripts/fetch-schedule.mjs) and the
// small helpers that read it.

export type SessionType =
  | 'keynote' | 'talk' | 'lightning' | 'tutorial' | 'contribfest' | 'maintainer' | 'poster' | 'bof'
  | 'showcase' | 'colo' | 'experience' | 'break' | 'registration'

export interface Speaker {
  name: string
  company: string
  title: string
  photo?: string
  bio?: string
  links?: { title: string; url: string }[]
}

export interface Session {
  id: string
  src: string
  title: string
  abstract: string
  /** local wall time in Salt Lake City, no zone: "2026-11-10T09:00:00" */
  start: string
  end: string
  day: string
  mins: number
  room: string
  venue: string
  type: SessionType
  /** the co-located event, for type 'colo' from the CNCF-hosted feed */
  colo?: string
  format?: string
  tracks: string[]
  subtopics: string[]
  projects: string[]
  level: string
  sponsored: boolean
  endUser: boolean
  speakers: Speaker[]
  links: { slides?: string; github?: string; demo?: string; website?: string; map?: string }
  url: string
  interests: string[]
  why: Record<string, string[]>
}

export interface Interest { id: string; label: string; blurb: string }
export interface Member { id: string; name: string; about: string; interests: string[] }
export interface Day { date: string; label: string; note: string }

export interface Schedule {
  generatedAt: string
  sources: Record<string, string>
  event: { name: string; short: string; city: string; venue: string; tz: string; site: string; days: Day[] }
  types: Record<SessionType, string>
  interests: Interest[]
  team: Member[]
  sessions: Session[]
}

export const TZ = 'America/Denver'

/** The column order when the grid groups by type. */
export const TYPE_ORDER: SessionType[] = [
  'keynote', 'talk', 'lightning', 'tutorial', 'contribfest', 'maintainer', 'poster', 'bof', 'colo',
  'showcase', 'experience', 'break', 'registration',
]

/** Hidden until asked for: logistics, not content. */
export const DEFAULT_HIDDEN: SessionType[] = ['registration', 'break']

export async function loadSchedule(): Promise<Schedule> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/schedule.json`, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`schedule: HTTP ${res.status}`)
  return res.json()
}

// ---- time ------------------------------------------------------------------------------------
// Session times are Salt Lake City wall clock, with no zone, exactly as Sessionize gives them. The
// grid works in minutes of the day; "now" is the wall clock in Salt Lake City, wherever the viewer is.

export function minutesOf(iso: string): number {
  return Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16))
}

export function fmtTime(iso: string): string {
  const m = minutesOf(iso)
  return fmtMinutes(m)
}

export function fmtMinutes(m: number): string {
  const h = Math.floor(m / 60)
  const mm = m % 60
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(mm).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`
}

export function fmtRange(s: Session): string {
  return `${fmtTime(s.start)} – ${fmtTime(s.end)}`
}

export function fmtDur(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

const DAYNAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function fmtDay(date: string, long = false): string {
  const d = new Date(`${date}T12:00:00Z`)
  const name = DAYNAMES[d.getUTCDay()]
  return `${long ? name : name.slice(0, 3)} ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`
}

/** Salt Lake City's wall clock right now, as { day: 'YYYY-MM-DD', minutes }. */
export function nowInSLC(): { day: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return { day: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) }
}

/** Short room: "Salt Palace | Level 2 | 255 BC" → "255 BC · Salt Palace L2". */
export function shortRoom(room: string): string {
  if (!room) return ''
  const parts = room.split('|').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 1) return parts[0]
  const venue = parts[0].replace('Salt Palace', 'SP').replace('Hyatt Regency', 'Hyatt')
  const level = parts.find((p) => /^Level \d/.test(p))?.replace('Level ', 'L')
  const rest = parts.filter((p) => p !== parts[0] && !/^Level \d/.test(p))
  const name = rest.length > 1 ? rest[rest.length - 1] : rest[0] ?? ''
  return `${name} · ${venue}${level ? ' ' + level : ''}`
}

// ---- colour ----------------------------------------------------------------------------------
// A stable hue per track / event / type, so the same thing is the same colour everywhere.

const HUES = ['#3b9bff', '#3ddc84', '#8b7bff', '#ffb84d', '#ff6b8b', '#2fd4d4', '#f78fff', '#9fe870', '#ff9f5a', '#6ac8ff', '#d4b5ff', '#ffd166']
const FIXED: Record<string, string> = {
  'AI Inference + Agentic': '#3ddc84',
  'Cloud Native AI + Inference Day': '#3ddc84',
  'Agentics Day: MCP + Agents': '#9fe870',
  'Platform Engineering': '#8b7bff',
  'Platform Engineering Day': '#8b7bff',
  'Security': '#ff6b8b',
  'Open Source SecurityCon': '#ff6b8b',
  'Observability': '#ffb84d',
  'Observability Day': '#ffb84d',
  'Connectivity': '#2fd4d4',
  'CiliumCon': '#2fd4d4',
  'Data Processing + Storage': '#6ac8ff',
  'Operations + Performance': '#ff9f5a',
  'Application Development + Delivery': '#f78fff',
  'ArgoCon': '#f78fff',
  'FluxCon': '#d4b5ff',
  'Emerging + Advanced': '#ffd166',
  'Cloud Native Experience': '#9fe870',
  'Cloud Native Novice': '#b7c3dc',
  keynote: '#3b9bff',
  talk: '#8b7bff',
  lightning: '#ffd166',
  tutorial: '#2fd4d4',
  contribfest: '#ff9f5a',
  maintainer: '#3ddc84',
  poster: '#d4b5ff',
  bof: '#f78fff',
  colo: '#6ac8ff',
  showcase: '#ffb84d',
  experience: '#ff6b8b',
  break: '#56638a',
  registration: '#56638a',
}
export function colorOf(key: string): string {
  if (FIXED[key]) return FIXED[key]
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return HUES[h % HUES.length]
}

/** The colour a card wears: its track if it has one, else its event, else its type. */
export function sessionColor(s: Session): string {
  if (s.type === 'colo' && s.colo) return colorOf(s.colo)
  if (s.tracks[0] && s.type === 'talk') return colorOf(s.tracks[0])
  return colorOf(s.type)
}

export function isLogistics(s: Session): boolean {
  return s.type === 'break' || s.type === 'registration'
}
