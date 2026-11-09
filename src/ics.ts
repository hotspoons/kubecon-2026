// "My schedule" as an .ics file: one VEVENT per starred session, in Salt Lake City time.
import type { Session } from './data'
import { TZ } from './data'

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
const stamp = (iso: string) => iso.replace(/[-:]/g, '')
const fold = (line: string) => {
  const out: string[] = []
  let s = line
  while (s.length > 72) {
    out.push(s.slice(0, 72))
    s = ' ' + s.slice(72)
  }
  out.push(s)
  return out.join('\r\n')
}

export function toICS(sessions: Session[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//patapsco.ai//kubecon-2026//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:KubeCon NA 2026 — my schedule',
    `X-WR-TIMEZONE:${TZ}`,
    'BEGIN:VTIMEZONE',
    `TZID:${TZ}`,
    'BEGIN:STANDARD',
    'DTSTART:20261101T020000',
    'TZOFFSETFROM:-0600',
    'TZOFFSETTO:-0700',
    'TZNAME:MST',
    'END:STANDARD',
    'END:VTIMEZONE',
  ]
  for (const s of sessions) {
    const who = s.speakers.map((p) => `${p.name}${p.company ? ` (${p.company})` : ''}`).join(', ')
    lines.push(
      'BEGIN:VEVENT',
      `UID:${s.id}@kubecon.siomporas.com`,
      `DTSTAMP:${now}`,
      `DTSTART;TZID=${TZ}:${stamp(s.start)}`,
      `DTEND;TZID=${TZ}:${stamp(s.end)}`,
      fold(`SUMMARY:${esc(s.title)}`),
      fold(`LOCATION:${esc(s.room)}`),
      fold(`DESCRIPTION:${esc([who, s.url, '', s.abstract].filter(Boolean).join('\n'))}`),
      fold(`URL:${s.url}`),
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}

export function downloadICS(sessions: Session[]) {
  const blob = new Blob([toICS(sessions)], { type: 'text/calendar;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'kubecon-na-2026-my-schedule.ics'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    URL.revokeObjectURL(a.href)
    a.remove()
  }, 1000)
}
