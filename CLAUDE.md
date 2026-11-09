# Working in this repository

Read [HANDOFF.md](HANDOFF.md) first: where things stand, what is next, what needs Rich. Then
[README.md](README.md) for what the app is and how to run it.

- **Work in the dev container.** Rich wants nothing installed on the Mac. From the host, without an
  editor: `npx @devcontainers/cli up --workspace-folder .` once, then
  `npx @devcontainers/cli exec --workspace-folder . <command>` for everything (npm, just, node).
  The container publishes 5173/4173/8787 to the host.
- **Gate claims on exit status.** `just check` is the gate: `npx tsc -b`, the node tests, the build.
- **Look at it.** `just dev` in the background, then `just shot` (or `node scripts/shot.mjs --url
  'http://localhost:5173/#d=2026-11-10&i=storage' --out shots/x.png`) and open the PNG. A screenshot
  with ERRORS in its output is a failed check.
- **The data is generated.** `public/data/schedule.json` comes from `scripts/fetch-schedule.mjs`
  (committed so the build works offline). Never hand-edit it; edit the rules in
  `scripts/interests.mjs` or the per-session map in `data/overrides.json`, then `just tag`.
- **Name paths when you commit.** No `git add -A`. `.devhome/`, `.cache/`, `shots/`, `.env` and
  `.dev.vars` never go in.
- Commit messages and PR bodies end with the attribution lines the session asks for.
