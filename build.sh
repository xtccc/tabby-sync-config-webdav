#!/bin/bash

set -e

echo "=== Terminus Sync Config Build Script ==="
echo "Building for Linux and Windows platforms..."

DIST_DIR="dist"
SYNC_TOOL_DIR="sync-tool"

# Clean and create dist directory
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Build TypeScript/Angular frontend
echo "Building TypeScript/Angular frontend..."
npm run build:ts

# Build Go sync-tool for Linux
echo "Building Go sync-tool for Linux..."
cd "$SYNC_TOOL_DIR"
GOOS=linux GOARCH=amd64 go build -o ../"$DIST_DIR"/sync-tool cmd/main.go

# Build Go sync-tool for Windows
echo "Building Go sync-tool for Windows..."
GOOS=windows GOARCH=amd64 go build -o ../"$DIST_DIR"/sync-tool.exe cmd/main.go
cd ..

cp package.json "$DIST_DIR"/
echo ""
echo "=== Build Complete ==="
echo "Output files in $DIST_DIR/:"
ls -lh "$DIST_DIR"/

echo ""
echo "windows: copy dist/ to %AppData%\tabby\plugins\node_modules\terminus-sync-config"
echo "linux: copy dist/ to /home/xtcc/.config/tabby/plugins/node_modulesterminus-sync-config"

