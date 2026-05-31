#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  jobs -p | xargs kill 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting Brim backend (http://localhost:3001) and client (http://localhost:3000)…"
echo "Press Ctrl+C to stop both."

(cd "$ROOT/server" && npm run dev) &
(cd "$ROOT/client" && npm run dev) &

wait
