// Fuzzy search over every session, with Fuse.js. One index for the lifetime of the page.
import Fuse from 'fuse.js'
import type { Session } from './data'

let fuse: Fuse<Session> | null = null

export function buildIndex(sessions: Session[]) {
  fuse = new Fuse(sessions, {
    includeScore: true,
    ignoreLocation: true,
    threshold: 0.34,
    minMatchCharLength: 2,
    useExtendedSearch: false,
    keys: [
      { name: 'title', weight: 3 },
      { name: 'speakers.name', weight: 2 },
      { name: 'speakers.company', weight: 1.4 },
      { name: 'tracks', weight: 1 },
      { name: 'projects', weight: 1.2 },
      { name: 'colo', weight: 1 },
      { name: 'interests', weight: 0.8 },
      { name: 'room', weight: 0.6 },
      { name: 'abstract', weight: 0.5 },
    ],
  })
}

/** Session ids matching the query, best first, or null when the query is too short to mean anything. */
export function search(query: string): Map<string, number> | null {
  const q = query.trim()
  if (q.length < 2 || !fuse) return null
  const out = new Map<string, number>()
  for (const r of fuse.search(q, { limit: 400 })) out.set(r.item.id, r.score ?? 1)
  return out
}
