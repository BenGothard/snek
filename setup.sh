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

echo "Running npm audit to check for vulnerabilities..."
if npm audit > audit.log; then
    echo "Audit complete. Results saved to audit.log."
else
    echo "npm audit failed, possibly due to lack of network connectivity."
fi

echo "Setup complete. Use 'npm run serve' to run the game locally."
