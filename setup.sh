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

# Install project dependencies locally
npm install

echo "Setup complete. Use 'npm run serve' to run the game locally."
