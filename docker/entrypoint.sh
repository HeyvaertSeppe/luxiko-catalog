#!/bin/sh
# Prepares the data folder, then runs the app as the unprivileged "node" user.
set -e
DATA_DIR="${DATA_DIR:-/app/data}"
mkdir -p "$DATA_DIR"

if [ "$(id -u)" = "0" ]; then
  # Works with named volumes and with bind mounts such as ./data:/app/data
  chown -R node:node "$DATA_DIR"
  chmod 700 "$DATA_DIR"
  exec setpriv --reuid=node --regid=node --init-groups "$@"
fi
exec "$@"
