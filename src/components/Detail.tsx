import { useState } from 'preact/hooks'
import { fmtDay, fmtDur, fmtRange, sessionColor, type Session } from '../data'
import { copyLink, interests, isFav, schedule, select, toggleFav, toggleInterest } from '../state'

export function Detail({ s }: { s: Session }) {
  const sched = schedule.value!
  const fav = isFav(s.id)
  const labels = new Map(sched.interests.map((i) => [i.id, i.label]))
  const kind = s.type === 'colo' ? s.colo ?? 'Sponsor-hosted event' : sched.types[s.type]
  return (
    <>
      <div class="scrim" onClick={() => select(null)} />
      <aside class="drawer" role="dialog" aria-modal="true" aria-label={s.title}>
        <div class="dh">
          <span class="pill" style={`--c:${sessionColor(s)}`}>{kind}</span>
          {s.tracks.map((t) => (
            <span key={t} class="pill" style={`--c:${sessionColor(s)}`}>{t}</span>
          ))}
          {s.format && <span class="pill lvl">{s.format}</span>}
          {s.level && <span class="pill lvl">{s.level}</span>}
          {s.sponsored && <span class="pill spon">sponsored</span>}
          <button class="x" onClick={() => select(null)} title="Close (Esc)">×</button>
        </div>
        <div class="body">
          <h2>{s.title}</h2>
          <div class="when">
            <div>
              <span class="k">When</span>
              {fmtDay(s.day, true)} · {fmtRange(s)} · {fmtDur(s.mins)}
            </div>
            <div>
              <span class="k">Where</span>
              {s.room || 'TBD'}
            </div>
          </div>
          <div class="acts">
            <button class={`btn star-btn ${fav ? 'on' : ''}`} onClick={() => toggleFav(s.id)}>
              {fav ? '★ In my schedule' : '☆ Add to my schedule'}
            </button>
            <a class="btn" href={s.url} target="_blank" rel="noopener">Official page ↗</a>
            {s.links.slides && <a class="btn" href={s.links.slides} target="_blank" rel="noopener">Slides ↗</a>}
            {s.links.github && <a class="btn" href={s.links.github} target="_blank" rel="noopener">GitHub ↗</a>}
            {s.links.demo && <a class="btn" href={s.links.demo} target="_blank" rel="noopener">Demo ↗</a>}
            {s.links.website && <a class="btn" href={s.links.website} target="_blank" rel="noopener">Website ↗</a>}
            {s.links.map && <a class="btn" href={s.links.map} target="_blank" rel="noopener">Map ↗</a>}
            <button class="btn" onClick={() => copyLink(s)}>Copy link</button>
          </div>
          {s.interests.length > 0 && (
            <div>
              <h4>Interests · why it's tagged</h4>
              <div class="tags">
                {s.interests.map((i) => (
                  <button key={i} class="why" onClick={() => toggleInterest(i)} title={interests.value.includes(i) ? 'Filtering on this; click to stop' : 'Click to filter on this interest'}>
                    <b>{interests.value.includes(i) ? '✓ ' : ''}{labels.get(i) ?? i}</b>
                    <span>{s.why[i]?.join(' · ')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {(s.projects.length > 0 || s.subtopics.length > 0 || s.endUser) && (
            <div class="tags">
              {s.projects.map((p) => (
                <span key={p} class="pill" style="--c:#6ac8ff">{p}</span>
              ))}
              {s.subtopics.map((p) => (
                <span key={p} class="pill lvl">{p}</span>
              ))}
              {s.endUser && <span class="pill lvl">end user talk</span>}
            </div>
          )}
          {s.abstract && (
            <div>
              <h4>About</h4>
              <div class="abs">{s.abstract}</div>
            </div>
          )}
          {s.speakers.length > 0 && (
            <div>
              <h4>Speakers</h4>
              {s.speakers.map((p, i) => (
                <SpeakerRow key={i} p={p} />
              ))}
            </div>
          )}
        </div>
        <div class="db mob">
          <button class={`btn star-btn ${fav ? 'on' : ''}`} onClick={() => toggleFav(s.id)}>
            {fav ? '★ In my schedule' : '☆ Add to my schedule'}
          </button>
          <button class="btn" onClick={() => select(null)}>Close</button>
        </div>
      </aside>
    </>
  )
}

function SpeakerRow({ p }: { p: Session['speakers'][number] }) {
  const [open, setOpen] = useState(false)
  const [broken, setBroken] = useState(false)
  const initials = p.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('')
  return (
    <div class="spk">
      {p.photo && !broken ? <img src={p.photo} alt="" loading="lazy" onError={() => setBroken(true)} /> : <div class="ph">{initials}</div>}
      <div style="min-width:0">
        <div class="nm">{p.name}</div>
        <div class="co">{[p.title, p.company].filter(Boolean).join(' · ')}</div>
        {p.bio && (
          <div class={`bio ${open ? 'open' : ''}`} onClick={() => setOpen(!open)} title={open ? '' : 'Click to read more'}>
            {p.bio}
          </div>
        )}
        {p.links && p.links.length > 0 && (
          <div class="lnk">
            {p.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener">{l.title}</a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
