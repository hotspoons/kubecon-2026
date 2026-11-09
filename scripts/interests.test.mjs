import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tagSession, scoreSession, THRESHOLD, INTERESTS, TEAM } from './interests.mjs'
import { htmlToText, normalize } from './fetch-schedule.mjs'

test('a title hit alone is enough; one abstract mention is not', () => {
  const t = tagSession({ id: '1', title: 'Scaling DRA for 10k GPUs', abstract: '', labels: [] })
  assert.ok(t.tags.includes('dra'))
  assert.ok(t.tags.includes('gpu'))
  const a = tagSession({ id: '2', title: 'A talk', abstract: 'we mention storage once', labels: [] })
  assert.ok(!a.tags.includes('storage'))
})

test('acronyms are case-sensitive whole words: "dra" in prose is not DRA', () => {
  const s = scoreSession({ title: 'The hydra problem', abstract: 'dra dra dra', labels: [] })
  assert.equal(s.dra, undefined)
  const ci = scoreSession({ title: 'Our CI is slow', abstract: '', labels: [] })
  assert.ok(ci.testing.score >= THRESHOLD)
  const ciao = scoreSession({ title: 'Ciao Kubernetes', abstract: 'ci ci ci', labels: [] })
  assert.equal(ciao.testing, undefined)
})

test('a track label plus one supporting abstract mention qualifies', () => {
  const t = tagSession({ id: '3', title: 'Something', abstract: 'serving a model with vLLM', labels: ['AI Inference + Agentic'] })
  assert.ok(t.tags.includes('inference'))
  assert.ok(t.why.inference.length > 0)
})

test('overrides win both ways and say so', () => {
  const o = { '4': { add: ['wasm'], remove: ['dra'] } }
  const t = tagSession({ id: '4', title: 'DRA deep dive', abstract: '', labels: [] }, o)
  assert.ok(!t.tags.includes('dra'))
  assert.ok(t.tags.includes('wasm'))
  assert.deepEqual(t.why.wasm, ['hand-picked'])
})

test('every team preset names real interests', () => {
  const ids = new Set(INTERESTS.map((i) => i.id))
  for (const m of TEAM) for (const i of m.interests) assert.ok(ids.has(i), `${m.name}: ${i}`)
})

test('htmlToText keeps paragraphs, drops tags, decodes entities', () => {
  assert.equal(htmlToText('<p>Hello &amp; <b>world</b></p><p>Two<br>lines &#8217; &#x27;</p>'), 'Hello & world\nTwo\nlines ’ \'')
})

test('normalize: a main-feed talk', () => {
  const feed = {
    sessions: [{ id: 1, title: ' T ', description: '<p>D</p>', startsAt: '2026-11-10T09:00:00', endsAt: '2026-11-10T09:30:00', speakers: ['s1'], categoryItems: [10, 20, 30], questionAnswers: [{ questionId: 100, answerValue: 'https://x/slides' }], roomId: 5, status: 'Accepted' }],
    speakers: [{ id: 's1', firstName: 'A', lastName: 'B', tagLine: 'Acme, CTO', questionAnswers: [] }],
    rooms: [{ id: 5, name: 'Salt Palace | Level 1 | 151' }],
    questions: [{ id: 100, question: 'Presentation Slides' }],
    categories: [
      { title: 'All Sessions', items: [{ id: 10, name: 'AI Inference + Agentic' }] },
      { title: 'Audience Level', items: [{ id: 20, name: 'Any Level' }] },
      { title: 'CNCF Projects', items: [{ id: 30, name: 'KServe' }] },
    ],
  }
  const [s] = normalize(feed, { code: 'x', kind: 'main', page: 'https://p/' })
  assert.equal(s.title, 'T')
  assert.equal(s.type, 'talk')
  assert.deepEqual(s.tracks, ['AI Inference + Agentic'])
  assert.equal(s.level, 'Any level')
  assert.deepEqual(s.projects, ['KServe'])
  assert.equal(s.mins, 30)
  assert.equal(s.venue, 'Salt Palace')
  assert.equal(s.speakers[0].company, 'Acme')
  assert.equal(s.speakers[0].title, 'CTO')
  assert.equal(s.links.slides, 'https://x/slides')
  assert.equal(s.url, 'https://p/?id=1')
})

test('normalize: a co-located session takes its event and topic', () => {
  const feed = {
    sessions: [{ id: 2, title: 'C', description: '', startsAt: '2026-11-09T10:00:00', endsAt: '2026-11-09T10:20:00', speakers: [], categoryItems: [1, 2, 3], questionAnswers: [], roomId: 1, status: 'Accepted' }],
    speakers: [], rooms: [{ id: 1, name: 'R' }], questions: [],
    categories: [
      { title: 'All Sessions', items: [{ id: 1, name: 'Cloud Native AI + Inference Day' }] },
      { title: 'Cloud Native AI + Inference Day', items: [{ id: 2, name: 'LLMs + Generative AI' }] },
      { title: 'Session format', items: [{ id: 3, name: '⚡ Lightning Talk' }] },
    ],
  }
  const [s] = normalize(feed, { code: 'y', kind: 'colo', page: 'https://q/' })
  assert.equal(s.type, 'colo')
  assert.equal(s.colo, 'Cloud Native AI + Inference Day')
  assert.deepEqual(s.tracks, ['LLMs + Generative AI'])
  assert.equal(s.format, 'Lightning talk')
})
