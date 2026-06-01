#!/bin/sh
set -e

DATA_DIR="/app/src/data"
BUNDLE_DIR="/app/data-bundled"

mkdir -p "$DATA_DIR"

if [ ! -f "$DATA_DIR/chuong_6_dan_toc_ton_giao_dataset.json" ]; then
  cp "$BUNDLE_DIR/chuong_6_dan_toc_ton_giao_dataset.json" "$DATA_DIR/"
fi

if [ ! -f "$DATA_DIR/chat-history.json" ]; then
  echo '{"sessions":[]}' > "$DATA_DIR/chat-history.json"
fi

exec node dist/server.js
