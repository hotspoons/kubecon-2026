# kubecon-2026 — task recipes (https://just.systems)
#
#   src/                the app (Preact + signals, Vite)                       :5173
#   scripts/            the schedule fetch + interest tagging, screenshots
#   public/data/        the schedule snapshot the app loads (committed, refreshed by `just fetch`)
#   data/overrides.json hand-made interest corrections per session
#   wrangler.jsonc      the Cloudflare Worker (static assets) + custom domain

set shell := ["bash", "-euo", "pipefail", "-c"]

# list recipes
default:
    @just --list --unsorted

# --- dev loop ---------------------------------------------------------------

# the dev server on :5173
dev:
    npm run dev

# production build (typecheck + bundle) into dist/
build:
    npm run build

# serve the production build on :4173
preview:
    npm run build && npm run preview

# the Worker itself, locally, against the production build, on :8787
worker:
    npm run build && npx wrangler dev --port 8787 --ip 0.0.0.0

# --- data -------------------------------------------------------------------

# refresh public/data/schedule.json from Sessionize (main + co-located feeds), re-tag interests
fetch:
    node scripts/fetch-schedule.mjs

# re-tag interests from the cached raw feeds, no network (after editing scripts/interests.mjs or data/overrides.json)
tag:
    node scripts/fetch-schedule.mjs --offline

# how the tagging landed: counts per interest, per team member, and untagged talks
report:
    node scripts/fetch-schedule.mjs --offline --report

# --- checks -----------------------------------------------------------------

check:
    npx tsc -b
    node --test scripts/*.test.mjs
    npm run build

typecheck:
    npx tsc -b

test:
    node --test scripts/*.test.mjs

# --- seeing it --------------------------------------------------------------

# screenshot the running app (dev server by default) into shots/; `just shot "#d=2026-11-10&i=storage"`
shot hash="" out="shots/app.png" url="http://localhost:5173/":
    node scripts/shot.mjs --url "{{ url }}{{ hash }}" --out "{{ out }}"

# does the production build open with no network after a first visit? needs `just preview` on :4173
offline:
    node scripts/offline-check.mjs

# a Cloudflare quick tunnel to the dev server, for a phone
tunnel port="5173":
    cloudflared tunnel --url http://localhost:{{ port }}

# the PWA icons (public/icon-*.png, apple-touch-icon.png), rendered with the headless Chromium
icons:
    node scripts/icons.mjs

# (re)install the headless Chromium the screenshots use
browser:
    sudo npx playwright install-deps chromium && npx playwright install chromium

# --- deploy -----------------------------------------------------------------
# CI deploys on every push to main (.github/workflows/deploy.yml) and on a timer during the event.
# By hand, with `npx wrangler login` done once (its state persists in .devhome/.config/.wrangler):

deploy:
    npm run build && npx wrangler deploy

clean:
    rm -rf dist node_modules/.vite shots
