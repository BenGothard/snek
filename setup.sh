#!/usr/bin/env bash
set -e

# Install Node.js and npm if not already installed
if ! command -v node >/dev/null 2>&1; then
    echo "Node.js not found. Please install Node.js and npm manually." >&2
    if command -v apt-get >/dev/null 2>&1; then
        echo "For Debian/Ubuntu you can run:" >&2
        echo "  sudo apt-get update && sudo apt-get install -y nodejs npm" >&2
    fi
    exit 1
fi

# Install http-server globally for serving the project
if ! command -v http-server >/dev/null 2>&1; then
    npm install -g http-server
fi

echo "Setup complete. Use 'http-server' to run the game locally."
