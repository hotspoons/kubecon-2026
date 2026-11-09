# kubecon-2026

A KubeCon + CloudNativeCon North America 2026 schedule browser that doesn't suck, by
[Patapsco.ai](https://patapsco.ai). Salt Lake City, November 9–12, 2026. Live at
**[kubecon.siomporas.com](https://kubecon.siomporas.com)**.

- **A grid.** Time slots down the side, kinds of session across the top: keynotes, talks, lightning
  talks, tutorials, the maintainer track, Contribfest, every co-located event as its own column
  on Monday. Or group the columns by track, or by room.
- **Fuzzy search** over titles, speakers, companies, projects and abstracts. Typos welcome.
- **Interests.** Every session is tagged with what it is about: inference, agents, training,
  disaggregated P/D, DRA, GPUs, HPC, scheduling, storage, performance, testing, operators and
  more. Pick interests, or pick a team member (Matt, Mason, Liam, Rich) to load theirs. Open a
  session to see *why* it got a tag.
- **My schedule.** Star sessions, see overlaps, export an `.ics`.
- **Now.** During the event the grid knows what time it is in Salt Lake City.
- **Works offline.** After the first visit the whole schedule is on the phone; add it to the home
  screen and it opens like an app, conference wifi or not.
- Every view is a link: the day, the filters, the search and the open session are in the URL.

All 800-odd sessions of the main event and of the CNCF-hosted co-located day, from the same public
Sessionize feeds the official schedule page renders, refreshed at every deploy.

## Run it

The dev container is the supported environment (VS Code: *Reopen in Container*; or
`npx @devcontainers/cli up --workspace-folder .`). It installs Node 24, the dependencies, `just`,
headless Chromium and cloudflared. Without it: Node 24 and `npm install`.

```bash
just dev        # http://localhost:5173
just fetch      # refresh public/data/schedule.json from Sessionize, re-tag interests
just tag        # re-tag from the cached feeds after editing the rules or the overrides
just report     # how the tagging landed: per interest, per team member, untagged talks
just check      # typecheck, tests, production build
just shot       # screenshot the running app into shots/ (what an agent uses to look)
just offline    # with `just preview` running: does the build open with no network?
```

[HANDOFF.md](HANDOFF.md) says where the work stands and what is next.

## How the tagging works

[`scripts/interests.mjs`](scripts/interests.mjs) holds the taxonomy: each interest has keyword
rules (regular expressions, whole words, case-insensitive except acronyms). A hit in the title or
in a track/topic/project label scores 3, a distinct hit in the abstract 1; a session is tagged at 3
or more. [`data/overrides.json`](data/overrides.json) is the hand mapping per session: `add` and
`remove` by Sessionize id (the `?id=` in the official schedule link), applied last. The team
presets are in the same file as the taxonomy.

The app shows the matched words under each tag in the session drawer, so a wrong tag is a one-line
override away.

## Deploy

The app is a Cloudflare Worker with static assets ([`wrangler.jsonc`](wrangler.jsonc)) on the
custom domain `kubecon.siomporas.com`. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
builds and deploys on every push to `main`, by hand from the Actions tab, and every two hours
during the event week (the schedule is refetched at build time).

The repository needs two secrets:

| Secret | What |
|---|---|
| `CLOUDFLARE_API_TOKEN` | a token with **Workers Scripts: Edit**, **Account Settings: Read**, and on the `siomporas.com` zone **Zone: Read**, **DNS: Edit**, **Workers Routes: Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | the account id (dashboard → Workers & Pages, right column) |

On the first deploy wrangler creates the custom domain (DNS record and certificate) from the route
in `wrangler.jsonc`; `siomporas.com` must be a zone in that account. By hand from the container:
`npx wrangler login` once (the login persists in `.devhome/`), then `just deploy`.

## Licence

Apache-2.0. The schedule data is the Linux Foundation's and CNCF's; this just rearranges it.
