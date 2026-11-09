import { Header } from './components/Header'
import { Toolbar } from './components/Toolbar'
import { Grid } from './components/Grid'
import { ListView } from './components/ListView'
import { Mine } from './components/Mine'
import { Detail } from './components/Detail'
import { Picker } from './components/Picker'
import { error, picker, schedule, selectedSession, shownView, toast } from './state'

export function App() {
  const sched = schedule.value
  if (error.value) {
    return (
      <div class="empty">
        <h3>Couldn't load the schedule</h3>
        <div class="mono small">{error.value}</div>
      </div>
    )
  }
  return (
    <>
      <Header />
      {sched ? (
        <>
          <Toolbar />
          <div data-ready style="display:contents">
            {shownView.value === 'grid' && <Grid />}
            {shownView.value === 'list' && <ListView />}
            {shownView.value === 'mine' && <Mine />}
          </div>
          <footer class="ftr">
            <span>Times are Salt Lake City (Mountain).</span>
            <span>
              Data: the official <a href={sched.event.site + 'program/schedule/'} target="_blank" rel="noopener">schedule</a> and the{' '}
              <a href={sched.event.site + 'co-located-events/cncf-hosted-co-located-schedule/'} target="_blank" rel="noopener">co-located schedule</a>, via Sessionize, refreshed {new Date(sched.generatedAt).toLocaleString()}.
            </span>
            <span>Interest tags are keyword rules plus hand corrections; open a session to see why it was tagged.</span>
            <span>
              Built by <a href="https://patapsco.ai" target="_blank" rel="noopener">Patapsco.ai</a> · <a href="https://github.com/hotspoons/kubecon-2026" target="_blank" rel="noopener">source</a>
            </span>
          </footer>
        </>
      ) : (
        <div class="loading">
          <div>
            Loading the schedule…
            <div class="bar"><i /></div>
          </div>
        </div>
      )}
      {picker.value && <Picker />}
      {selectedSession.value && <Detail s={selectedSession.value} />}
      {toast.value && <div class="toast">{toast.value}</div>}
    </>
  )
}
