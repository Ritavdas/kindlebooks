#!/bin/sh
# Ensure persistent data dirs exist on the mounted volume before starting.
mkdir -p "${DATA_DIR:-/data}"
mkdir -p "${LIBRARY_DIR:-/data/library}"
exec node server.js
