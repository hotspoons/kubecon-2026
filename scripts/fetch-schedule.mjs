#!/usr/bin/env node
// Fetch the KubeCon + CloudNativeCon North America 2026 schedule from Sessionize and write the one
// file the app loads: public/data/schedule.json. Every session of the main event and of the
// CNCF-hosted co-located day in one list, normalised, with interests tagged (scripts/interests.mjs
// + data/overrides.json).
//
// THE SOURCE. The official schedule page (events.linuxfoundation.org/.../program/schedule/) is a
// WordPress block that renders Sessionize's public "All" view; its config names the feed:
//   https://sessionize.com/api/v2/svi82w6c/view/All     the main event (Nov 8–12)
//   https://sessionize.com/api/v2/ayajbd6b/view/All     the CNCF-hosted co-located events (Nov 9)
//   https://sessionize.com/api/v2/etvmcsmr/view/All     the sponsor-hosted ones — the same 14
//                                                       placeholder blocks the main feed carries,
//                                                       so it is not fetched
// No key, no login. (The co-located Sched site is locked to registered attendees; this is not it.)
//
//   node scripts/fetch-schedule.mjs             fetch, cache the raw feeds in .cache/sessionize/, write
//   node scripts/fetch-schedule.mjs --offline   re-normalise and re-tag from the cache, no network
//   node scripts/fetch-schedule.mjs --report    …and print how the tagging landed
//
// A failed fetch falls back to the cache, then to nothing: the committed snapshot stands and the
// exit status says so (1), so CI deploys what it has and warns.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { INTERESTS, TEAM, tagSession } from './interests.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = resolve(ROOT, '.cache/sessionize')
const OUT = resolve(ROOT, 'public/data/schedule.json')
const OVERRIDES = resolve(ROOT, 'data/overrides.json')

const LF = 'https://events.linuxfoundation.org/kubecon-cloudnativecon-north-america'

export const FEEDS = [
  { code: 'svi82w6c', kind: 'main', page: `${LF}/program/schedule/` },
  { code: 'ayajbd6b', kind: 'colo', page: `${LF}/co-located-events/cncf-hosted-co-located-schedule/` },
]

export const EVENT = {
  name: 'KubeCon + CloudNativeCon North America 2026',
  short: 'KubeCon NA 2026',
  city: 'Salt Lake City, Utah',
  venue: 'Salt Palace Convention Center',
  tz: 'America/Denver',
  site: `${LF}/`,
  days: [
    { date: '2026-11-08', label: 'Sun', note: 'registration' },
    { date: '2026-11-09', label: 'Mon', note: 'co-located events' },
    { date: '2026-11-10', label: 'Tue', note: 'day 1' },
    { date: '2026-11-11', label: 'Wed', note: 'day 2' },
    { date: '2026-11-12', label: 'Thu', note: 'day 3' },
  ],
}

// ---------------------------------------------------------------------------------------------
// HTML → text, for the abstracts. Paragraphs and line breaks become newlines; everything else is
// dropped; entities are decoded. Good enough for Sessionize's output (p, br, a, strong, em, ul/li).

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' }
export function htmlToText(html) {
  if (!html) return ''
  return html
    .replace(/\r\n?/g, '\n')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/\s*(p|div|li|h[1-6]|tr)\s*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') {
        const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
        return Number.isFinite(code) ? String.fromCodePoint(code) : m
      }
      return ENTITIES[e.toLowerCase()] ?? m
    })
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ---------------------------------------------------------------------------------------------
// The type: which column a session sits in when the grid groups by type. From the "All Sessions"
// labels (the main feed) or the event name (the co-located feed). First match wins, in this order.

const TYPE_RULES = [
  ['keynote', /^Keynote Sessions$/],
  ['lightning', /Lightning Talks$/],
  ['tutorial', /Tutorials$/],
  ['contribfest', /Contribfest$/],
  ['poster', /Poster Sessions$/],
  ['maintainer', /^Maintainer Track$/],
  ['showcase', /^(Cloud Native Theater|Sponsor Demo Theater|Project Pavilion Stage|Project Pavilion Tours|Solutions Showcase)$/],
  ['colo', /Co-located Events$/],
  ['experience', /^(Experiences|🎉 Experiences|Inclusion \+ Accessibility|Project Opportunities)$/],
  ['break', /Breaks$/],
  ['registration', /^Registration$/],
]
export const TYPES = {
  keynote: 'Keynotes',
  talk: 'Talks',
  lightning: 'Lightning talks',
  tutorial: 'Tutorials',
  contribfest: 'Contribfest',
  maintainer: 'Maintainer track',
  poster: 'Posters',
  bof: 'BoFs',
  showcase: 'Showcase & theaters',
  colo: 'Co-located',
  experience: 'Experiences & community',
  break: 'Breaks',
  registration: 'Registration',
}

function typeOf(labels, subtopics) {
  for (const [type, re] of TYPE_RULES) if (labels.some((l) => re.test(l))) return type
  if (subtopics.includes('BoF')) return 'bof'
  return 'talk'
}

// ---------------------------------------------------------------------------------------------

/** One Sessionize "All" feed → our sessions. */
export function normalize(feed, { code, kind, page }) {
  const cat = new Map() // item id → { group, name }
  for (const c of feed.categories) for (const i of c.items) cat.set(i.id, { group: c.title, name: i.name })
  const rooms = new Map(feed.rooms.map((r) => [r.id, r.name]))
  const speakers = new Map(feed.speakers.map((s) => [s.id, s]))
  const question = new Map(feed.questions.map((q) => [q.id, q.question]))
  const answers = (qa) => {
    const o = {}
    for (const a of qa ?? []) {
      const v = (a.answerValue ?? '').trim()
      if (v) o[question.get(a.questionId) ?? String(a.questionId)] = v
    }
    return o
  }
  const topicGroups = new Set(feed.categories.filter((c) => /Topics|Day$/.test(c.title)).map((c) => c.title))

  const out = []
  for (const s of feed.sessions) {
    if (s.status && s.status !== 'Accepted') continue
    const items = s.categoryItems.map((id) => cat.get(id)).filter(Boolean)
    const by = (group) => items.filter((i) => i.group === group).map((i) => i.name)
    const all = by('All Sessions')
    const subtopics = [...by('SubTopic'), ...by('Solutions Showcase Programming')]
    const level = (by('Audience Level')[0] ?? '').replace(/^Any Level$/, 'Any level')
    let type, colo, tracks, format
    if (kind === 'colo') {
      // All Sessions = the event; the per-event "<Event> Topics" groups = its tracks
      const ev = all.find((n) => !/Breaks|Experiences|Registration/.test(n))
      const t = typeOf(all, subtopics)
      type = t === 'talk' && ev ? 'colo' : t
      colo = ev
      tracks = items.filter((i) => topicGroups.has(i.group)).map((i) => i.name)
      format = by('Session format')[0]
      if (format && /Lightning/.test(format)) format = 'Lightning talk'
      if (format && /Keynote/.test(format)) format = 'Keynote'
    } else {
      type = typeOf(all, subtopics)
      tracks = all.filter((n) => !TYPE_RULES.some(([, re]) => re.test(n)))
    }
    const qa = answers(s.questionAnswers)
    const room = rooms.get(s.roomId) ?? ''
    const venue = room.split('|')[0].trim()
    const start = s.startsAt
    const end = s.endsAt
    const mins = Math.round((Date.parse(end + 'Z') - Date.parse(start + 'Z')) / 60000)
    const links = {}
    if (qa['Presentation Slides']) links.slides = qa['Presentation Slides']
    if (qa['GitHub Repository']) links.github = qa['GitHub Repository']
    if (qa['Project Demo']) links.demo = qa['Project Demo']
    if (qa['Website']) links.website = qa['Website']
    if (qa['Location Map']) links.map = qa['Location Map']
    out.push({
      id: String(s.id),
      src: code,
      title: s.title.trim(),
      abstract: htmlToText(s.description),
      start,
      end,
      day: start.slice(0, 10),
      mins,
      room,
      venue,
      type,
      ...(colo ? { colo } : {}),
      ...(format ? { format } : {}),
      tracks,
      subtopics,
      projects: by('CNCF Projects'),
      level,
      sponsored: by('Is Sponsored Keynote').length > 0 || by('Subtopic').includes('Sponsored'),
      endUser: by('End User Programming').length > 0,
      speakers: s.speakers.map((id) => speakers.get(id)).filter(Boolean).map((sp) => {
        const a = answers(sp.questionAnswers)
        let company = a['Company Override'] || a['Company'] || ''
        let title = a['Speaker Title'] || ''
        if (!company && sp.tagLine) {
          const [c, ...rest] = sp.tagLine.split(',')
          company = c.trim()
          if (!title) title = rest.join(',').trim()
        }
        return {
          name: a['Speaker Name Display'] || sp.fullName || `${sp.firstName} ${sp.lastName}`.trim(),
          company,
          title,
          ...(sp.profilePicture ? { photo: sp.profilePicture } : {}),
          ...(sp.bio ? { bio: htmlToText(sp.bio) } : {}),
          ...(sp.links?.length ? { links: sp.links.map((l) => ({ title: l.title, url: l.url })) } : {}),
        }
      }),
      links,
      url: `${page}?id=${s.id}`,
    })
  }
  return out
}

/** Tag every session; the labels fed to the rules are its tracks, subtopics, projects and co-located event. */
export function tagAll(sessions, overrides) {
  for (const s of sessions) {
    const { tags, why } = tagSession(
      { id: s.id, title: s.title, abstract: s.abstract, labels: [...s.tracks, ...s.subtopics, ...s.projects, s.colo ?? ''] },
      overrides,
    )
    s.interests = tags
    s.why = why
  }
  return sessions
}

async function fetchFeed(code, offline) {
  const file = resolve(CACHE, `${code}.json`)
  if (!offline) {
    try {
      const res = await fetch(`https://sessionize.com/api/v2/${code}/view/All`, { headers: { accept: 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const data = JSON.parse(text)
      if (!Array.isArray(data.sessions)) throw new Error('no sessions in feed')
      await mkdir(CACHE, { recursive: true })
      await writeFile(file, text)
      return { data, from: 'network' }
    } catch (e) {
      console.warn(`WARN: fetch of ${code} failed (${e.message}); trying the cache`)
    }
  }
  if (existsSync(file)) return { data: JSON.parse(await readFile(file, 'utf8')), from: 'cache' }
  throw new Error(`no feed for ${code}: fetch failed and nothing in ${CACHE}`)
}

export function report(sessions) {
  const talks = sessions.filter((s) => !['break', 'registration', 'experience', 'showcase'].includes(s.type))
  console.log(`\n${sessions.length} sessions, ${talks.length} of them talks (not breaks/registration/experiences/showcase)\n`)
  console.log('per interest (talks):')
  for (const i of INTERESTS) {
    const n = talks.filter((s) => s.interests.includes(i.id)).length
    console.log(`  ${i.id.padEnd(14)} ${String(n).padStart(4)}  ${i.label}`)
  }
  console.log('\nper team member (talks matching any of their interests):')
  for (const t of TEAM) {
    const n = talks.filter((s) => s.interests.some((x) => t.interests.includes(x))).length
    console.log(`  ${t.name.padEnd(6)} ${String(n).padStart(4)}  ${t.interests.join(', ')}`)
  }
  const untagged = talks.filter((s) => s.interests.length === 0)
  console.log(`\nuntagged talks: ${untagged.length}`)
  for (const s of untagged.slice(0, 25)) console.log(`  ${s.id}  [${s.type}] ${s.title}`)
  const per = talks.map((s) => s.interests.length)
  console.log(`\ninterests per talk: mean ${(per.reduce((a, b) => a + b, 0) / per.length).toFixed(2)}, max ${Math.max(...per)}`)
}

async function main() {
  const args = new Set(process.argv.slice(2))
  const offline = args.has('--offline')
  const overrides = JSON.parse(await readFile(OVERRIDES, 'utf8'))
  delete overrides._readme
  const seen = new Set()
  const sessions = []
  const sources = {}
  for (const feed of FEEDS) {
    const { data, from } = await fetchFeed(feed.code, offline)
    sources[feed.code] = from
    for (const s of normalize(data, feed)) {
      if (seen.has(s.id)) continue
      seen.add(s.id)
      sessions.push(s)
    }
  }
  // the main feed's all-day placeholders for the CNCF-hosted co-located events, now that the real
  // sessions are here
  const detailed = new Set(sessions.filter((s) => s.colo).map((s) => s.colo))
  const kept = sessions.filter((s) => !(s.type === 'colo' && !s.colo && s.tracks.length === 0 && s.src === 'svi82w6c' && detailed.size > 0 && /CNCF-hosted/.test(s.title) === false && isPlaceholder(s, detailed)))
  kept.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : a.title.localeCompare(b.title)))
  tagAll(kept, overrides)

  const out = {
    generatedAt: new Date().toISOString(),
    sources,
    event: EVENT,
    types: TYPES,
    interests: INTERESTS.map(({ id, label, blurb }) => ({ id, label, blurb })),
    team: TEAM,
    sessions: kept,
  }
  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(out))
  const bytes = Buffer.byteLength(JSON.stringify(out))
  console.log(`wrote ${OUT}: ${kept.length} sessions, ${(bytes / 1024).toFixed(0)} KiB (${Object.entries(sources).map(([c, f]) => `${c} from ${f}`).join(', ')})`)
  if (args.has('--report')) report(kept)
}

/** A main-feed block that stands for a whole co-located event we have the real sessions of. */
function isPlaceholder(s, detailed) {
  for (const name of detailed) if (s.title.startsWith(name)) return true
  return false
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(`ERROR: ${e.message}`)
    process.exit(1)
  })
}
