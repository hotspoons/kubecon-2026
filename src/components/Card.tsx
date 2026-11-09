import { fmtDur, fmtTime, minutesOf, sessionColor, shortRoom, type Session } from '../data'
import { clock, interests, isFav, select, selected, toggleFav } from '../state'

/** One session, compact. `wide` in the list views (a third title line, a few more pills). */
export function Card({ s, wide = false, conflict = false }: { s: Session; wide?: boolean; conflict?: boolean }) {
  const want = interests.value
  const fav = isFav(s.id)
  const past = clock.value.day > s.day || (clock.value.day === s.day && clock.value.minutes >= minutesOf(s.end))
  const who = s.speakers.slice(0, wide ? 4 : 2)
  const tags = s.interests
  const shown = wide ? tags : tags.slice(0, 3)
  const label = s.type === 'talk' ? s.tracks[0] : s.type === 'colo' ? s.colo ?? 'sponsor-hosted' : s.format ?? s.subtopics[0]
  return (
    <button
      class={`card ${selected.value === s.id ? 'sel' : ''} ${fav ? 'fav' : ''} ${past ? 'past' : ''} ${conflict ? 'conflict' : ''}`}
      style={`--c:${sessionColor(s)}`}
      onClick={() => select(s.id)}
      data-id={s.id}
    >
      <div class="top">
        <span class="t">{fmtTime(s.start)}</span>
        <span class="dur">{fmtDur(s.mins)}</span>
        {s.sponsored && <span class="pill spon">sponsored</span>}
        <span class="fill" />
        <span
          class={`star ${fav ? 'on' : ''}`}
          role="button"
          tabIndex={0}
          title={fav ? 'Remove from my schedule' : 'Add to my schedule'}
          onClick={(e) => {
            e.stopPropagation()
            toggleFav(s.id)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              toggleFav(s.id)
            }
          }}
        >
          {fav ? '★' : '☆'}
        </span>
      </div>
      <div class="ttl">{s.title}</div>
      {who.length > 0 && (
        <div class="who">
          {who.map((p, i) => (
            <span key={i}>
              {i > 0 && ', '}
              <b>{p.name}</b>
              {p.company ? ` · ${p.company}` : ''}
            </span>
          ))}
          {s.speakers.length > who.length && ` +${s.speakers.length - who.length}`}
        </div>
      )}
      <div class="meta">
        {label && <span class="pill">{label}</span>}
        {s.room && <span class="pill room">{shortRoom(s.room)}</span>}
        {shown.map((i) => (
          <span key={i} class={`pill int ${want.includes(i) ? 'hit' : ''}`}>{i}</span>
        ))}
        {tags.length > shown.length && <span class="pill more">+{tags.length - shown.length}</span>}
      </div>
    </button>
  )
}
