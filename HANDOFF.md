# Handoff

For whoever (or whatever) picks this up next, inside the dev container. Written 2026-11-08 evening,
the night before the event (co-located day is Monday Nov 9; main event Nov 10–12); the mobile
section updated 2026-11-09 03:40 UTC after the mobile pass was built and verified in the container.

## The mandate: mobile first

Rich, 2026-11-08: **"Make sure this is optimized for mobile, that is the primary use case, to
replace the atrocious app and website with something usable with a search feature and interest
browser."** Everything below is secondary to a phone in a hallway at the Salt Palace: one hand,
bad wifi, bright light, 30 seconds between sessions. Judge every change on the iPhone screenshot
(`node scripts/shot.mjs --mobile --url ... --out shots/mobile.png`), not the desktop one.

Where mobile stands (2026-11-09, iPhone 14 screenshots in `shots/m*.png`, all seven items of
the 2026-11-08 list done and screenshotted; nothing tried on a real phone yet):

1. **Interest browser.** Under 760px the team/chips row is gone; an **Interests** button beside
   the search opens a full-screen sheet (`src/components/Picker.tsx`): team presets, every
   interest with its count, the kinds of session, clear, Done. A summary line under the day tabs
   (`786 sessions · Matt, Disaggregated P/D ›`) says what is on and opens the sheet. The
   desktop row and the sheet share `src/components/Filters.tsx`.
2. **Chrome.** Header 50px; toolbar is search + Interests on one row, days + view on the next,
   the summary line: 27% of the iPhone 14 viewport at the top, then it slides under the header on
   scroll-down and returns on scroll-up (`html.tb-hide`, set from the scroll handler in Toolbar;
   never while the search box has focus).
3. **Day tabs** stretch across the row, equal width, no counts on a phone ("Tue 10"); nothing clips.
4. **No grid on a phone**: the Grid button is hidden and a `v=grid` link renders the list
   (`shownView` in state.ts); Mine is "★ n". A day-at-a-glance grid was not attempted.
5. **Offline / PWA.** `src/sw.js` is built into `dist/sw.js` by the `sw` plugin in
   `vite.config.ts` with the hashed asset list and a version; it precaches the shell, the bundle,
   `schedule.json`, the icons and the Google fonts (best effort), serves assets cache-first, the
   shell from cache, the schedule stale-while-revalidate. `public/manifest.webmanifest` +
   `public/icon-*.png` + `apple-touch-icon.png` (made by `just icons`) for the home screen;
   iOS standalone meta tags in `index.html`; safe-area insets in the CSS. Registered in
   production only (`main.tsx`); a toast says when a newer version is ready. **Verified:**
   `just preview` then `just offline` (`scripts/offline-check.mjs`) loads once, goes offline,
   reloads, and renders 198 cards with no console errors.
6. **Drawer on a phone**: full screen, slides up; a sticky bottom bar with ★ Add to my schedule
   and Close under the thumb; the phone's back gesture closes it (opening pushes a history entry,
   `select()` in state.ts). Broken speaker photos fall back to initials.
7. **Search on a phone**: results start under the box (the page scrolls to the top on every
   keystroke and the toolbar stays), the input is 16px so iOS does not zoom, Enter puts the
   keyboard away, the native ✕ is hidden in favour of ours.

Still to do for mobile, in order: try it on a real iPhone (`just tunnel` gives a public URL
for the dev server; or add the deployed site to the home screen) and fix what the emulator does
not show (rubber-band scroll vs. the hide-on-scroll, keyboard height, the standalone status bar);
the Patapsco panel (below); maybe a one-line-per-card day-at-a-glance for the grid.

Extra screenshot steps for agents: `scripts/shot.mjs` takes `--click <selector>`, `--type
<text>`, `--scroll <px>` (negative scrolls back up) and `--wait <ms>`, in order, before the shot.

## What this is

A KubeCon NA 2026 schedule browser for the Patapsco.ai team, to be promoted at the event.
Patapsco.ai is a Platinum sponsor of Cloud Native AI + Inference Day (Mon Nov 9) and a Silver
sponsor of the main event. Rich wants it to be better than the official app and to look cool.
README.md says what it does; this says where the work stands.

Liam's ask that shaped the interest feature: categorize talks by each team member's core
interests: storage and performance (Matt), testing (Mason), operators / DRA / disaggregated P/D
(Liam), agents and agentic (Rich). Rich added: align the taxonomy with inference, HPC, storage,
operators, scheduling, training, disagg P/D; allow a custom mapping per event; fuzzy search.

## Where things stand

Everything was built and verified inside the dev container: `just check` clean (tsc, 8 node
tests, build: 77 KB JS, 28 KB gzipped, plus the 2 MiB data file and a 4 KB service worker).
Screenshots are in `shots/` (gitignored): the desktop set from 2026-11-08 and the mobile set
`m0-before.png` … `m8-scrollback-final.png`, `offline.png`. The first commit was made
2026-11-09 from the container; nothing has been pushed or deployed (the push needs the secrets
below in place first, since every push to main runs the Deploy workflow).

Done and verified:

- `scripts/fetch-schedule.mjs` pulls the two public Sessionize feeds the official site renders
  (`svi82w6c` main, `ayajbd6b` CNCF-hosted co-located) and writes `public/data/schedule.json`
  (818 sessions, ~2 MiB raw, ~450 KiB compressed). Cached raw feeds in `.cache/sessionize/`.
  The sponsor-hosted feed (`etvmcsmr`) duplicates 14 placeholder blocks in the main feed; skipped.
  The co-located Sched site (colocatedeventsna2026.sched.com) is locked; not used.
- `scripts/interests.mjs`: 26 interests with keyword rules, scoring (title/label 3, abstract 1,
  threshold 3), team presets. `data/overrides.json`: per-session hand corrections. `just report`
  prints the distribution. Last run: Matt 117 talks, Mason 42, Liam 59, Rich 162; 78 untagged
  talks, mostly logistics (opening remarks, breaks typed as lightning, etc.).
- The app: Preact + signals + Fuse.js, Vite 8, TypeScript 6. Grid (15-minute rows × columns by
  type / track / room, 5 cards per cell then "+n more"), list view, My schedule with overlap
  detection and .ics export, detail drawer with "why tagged", fuzzy search, interest chips with
  counts, team presets, type show/hide chips, Now button and current-row highlight in Salt Lake
  City time, URL hash state for sharing, localStorage for stars and interests.
- Cloudflare: `wrangler.jsonc` (static assets Worker, custom domain `kubecon.siomporas.com`),
  `.github/workflows/deploy.yml` (push to main, manual, and every 2 hours Nov 8–13 UTC).
- The dev container: Node 24 image, git + gh features, `just`, Playwright Chromium, cloudflared;
  opencode/OpenChamber kept from piedmont with their `.devhome/` mounts; wrangler and gh login
  state mounted from `.devhome/` too. Ports 5173/4173/8787 published (`appPort`) so an agent on
  the host can reach them without an editor.

## What needs Rich

1. **Secrets for the deploy**: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the GitHub
   repository (README.md, "Deploy"). Until then every Deploy run fails at the last step. The
   token needs zone DNS + Workers Routes edit on `siomporas.com` for the custom domain to be made
   automatically; otherwise drop the `routes` entry and use the workers.dev URL.
2. **Review the tagging** for the four of you: `just report`, then open a few sessions in the app
   and read the "why". Wrong tags go in `data/overrides.json`; missing keywords in
   `scripts/interests.mjs`. `just tag` re-applies offline.
3. **Promotion**: there is no booth number, no QR code, no "visit us" panel yet. Once the booth
   number is known, a small banner in the header and a `/patapsco` deep link would be cheap.
   The Patapsco logo (`public/patapsco.svg`) is the one the LF sponsor page serves.

## Next, in order

- A "Patapsco at KubeCon" panel: booth, the Inference Day sponsorship, a short pitch, QR to the
  site. Needs the booth number and what Rich wants said.
- Tune the rules: `agents` (162) and `inference` (121) are broad because the AI track label plus
  one mention qualifies; consider raising the threshold for those two, or dropping the label hit.
  `testing` catches "test" in prose a lot; Mason may want `chaos`, `conformance`, `e2e` weighted up.
- Speaker company parse: a tagLine without a comma ("Director of Community Development at
  Tetrate") lands in `company` whole. Split on " at " too.
- The grid's empty rows at the far left when all of a slot's sessions are in a far-right column
  look bare; a row could carry a faint "→ 3 sessions off-screen" hint.
- Light theme: there is none. `color-scheme` is dark only.
- Offline is done (above). Speaker photos are not cached (left to the network); a small
  cache-first rule for `sessionize.com` images with a cap would make the drawer complete offline.
- Live refresh in the Worker (a cron trigger fetching Sessionize into KV) instead of the
  GitHub Actions timer, if two hours is too slow during the event.

## How to work here

```bash
just dev            # :5173 (from the host: npx @devcontainers/cli exec --workspace-folder . just dev)
just shot           # shots/app.png of the dev server; --url to pick a hash state; --mobile for the iPhone
                    # (node scripts/shot.mjs --mobile --url ... --click .filt for the picker, etc.)
just check          # the gate: tsc, node tests, build
just preview        # production build on :4173, then `just offline` proves it opens with no network
just fetch | tag | report
```

Agent notes are in CLAUDE.md. Rich prefers everything to run in the container, not on the Mac.
