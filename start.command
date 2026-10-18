#!/bin/sh
cd "$(dirname "$0")" || exit 1
if command -v node >/dev/null 2>&1; then
  exec node server.mjs
fi
runtime="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
if [ -x "$runtime" ]; then
  exec "$runtime" server.mjs
fi
printf 'Please install Node.js 20 or later, then run: node server.mjs\n'
read -r reply
