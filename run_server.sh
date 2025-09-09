#!/bin/bash

# Check if Python 3 is installed
if command -v python3 &>/dev/null; then
    echo "Starting server with Python 3..."
    python3 -m http.server 8000
# Check if Python is installed
elif command -v python &>/dev/null; then
    echo "Starting server with Python..."
    python -m http.server 8000
# Check if npx is installed
elif command -v npx &>/dev/null; then
    echo "Starting server with http-server..."
    npx http-server -p 8000
# If none of the above are installed
else
    echo "Error: Neither Python nor npx is installed. Please install one of them to run the server."
    exit 1
fi