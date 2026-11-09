#!/usr/bin/env bash
# Set up the dev environment for the KubeCon 2026 schedule app: `just`, the npm dependencies
# (Vite, TypeScript, Preact, wrangler, Playwright), headless Chromium for screenshots, and
# cloudflared for quick tunnels. Idempotent — safe to re-run (bash .devcontainer/post-create.sh).
set -euo pipefail

# just: the task runner (recipes live in ./justfile).
if ! command -v just >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y --no-install-recommends just
    sudo rm -rf /var/lib/apt/lists/*
fi

# The dependencies, from the lockfile. `npm ci` when a lockfile exists, else a plain install that
# makes one.
if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Headless Chromium for scripts/shot.mjs (screenshots of the running app, which is how an agent
# sees what it built). Deps via sudo apt; the browser lands in the USER's cache (sudo would hide
# it under /root). Best-effort: a flaky network must not kill container create. --yes: npx
# otherwise asks "Ok to proceed?" on a terminal nobody sees, and create hangs forever.
(sudo npx --yes playwright install-deps chromium && npx --yes playwright install chromium) \
    || echo "WARN: playwright setup failed — run 'just browser' to retry"

# cloudflared for `just tunnel` (anonymous quick tunnels; no account needed).
if ! command -v cloudflared >/dev/null 2>&1; then
    case "$(uname -m)" in aarch64|arm64) CF_ARCH=arm64 ;; *) CF_ARCH=amd64 ;; esac
    (curl -sSL -o /tmp/cloudflared "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$CF_ARCH" \
        && chmod +x /tmp/cloudflared && sudo mv /tmp/cloudflared /usr/local/bin/cloudflared) \
        || echo "WARN: cloudflared install failed — 'just tunnel' will not work"
fi

# ll: the stock Debian .bashrc ships it commented out, and ~/.bashrc lives in the container layer,
# so every rebuild loses it again. The guard anchors at line start — `#alias ll=` is already in
# there and would otherwise make this look done.
if ! grep -q "^alias ll=" ~/.bashrc 2>/dev/null; then
    printf '\n# ls\nalias ll=%s\n' "'ls -alF'" >>~/.bashrc
fi

# The schedule snapshot ships in the repository (public/data/schedule.json). Refresh it from
# Sessionize when the network is there; never fail create over it.
node scripts/fetch-schedule.mjs || echo "NOTE: could not refresh the schedule; the committed snapshot stands"

echo "Done. \`just dev\` starts the app on :5173; \`just shot\` screenshots it; HANDOFF.md says where things stand."
