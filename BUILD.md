# Build Script Usage

## Quick Start

```bash
# Make script executable
chmod +x build.sh

# Build for current platform (default)
./build.sh

# Build for all platforms (Linux + Windows + current)
./build.sh all

# Build for Linux only
./build.sh linux

# Build for Windows only
./build.sh windows

# Clean build directories
./build.sh clean

# Show help
./build.sh help
```

## Build Output

After building, you'll find the compiled files in `dist/`:

```
dist/
├── linux/           # Linux build (amd64)
│   ├── index.js     # Plugin UI (365KB)
│   ├── sync-tool    # Go binary (6.5MB)
│   └── package.json
├── windows/         # Windows build (amd64)
│   ├── index.js     # Plugin UI (365KB)
│   ├── sync-tool.exe # Go binary (6.6MB)
│   └── package.json
└── current/         # Current platform build
    ├── index.js
    ├── sync-tool
    └── package.json
```

## Installation

### Linux
```bash
mkdir -p ~/.config/tabby/plugins/terminus-sync-config
cp -r dist/linux/* ~/.config/tabby/plugins/terminus-sync-config/
```

### Windows
```powershell
# PowerShell
New-Item -ItemType Directory -Force -Path "$env:APPDATA\tabby\plugins\terminus-sync-config"
Copy-Item -Path "dist\windows\*" -Destination "$env:APPDATA\tabby\plugins\terminus-sync-config\" -Recurse
```

### macOS
```bash
mkdir -p ~/Library/Application\ Support/tabby/plugins/terminus-sync-config
cp -r dist/linux/* ~/Library/Application\ Support/tabby/plugins/terminus-sync-config/
```

## Cross Compilation

The script uses Go's cross-compilation feature:

- **Linux**: `GOOS=linux GOARCH=amd64`
- **Windows**: `GOOS=windows GOARCH=amd64`
- **macOS**: Currently builds as part of Linux (both are Unix-like)

To add macOS support, edit `build.sh`:

```bash
build_macos() {
    local macos_dir="$DIST_DIR/macos"
    mkdir -p "$macos_dir"
    build_go "darwin" "amd64" "sync-tool" "$macos_dir"  # Intel
    build_go "darwin" "arm64" "sync-tool-arm64" "$macos_dir"  # Apple Silicon
    copy_shared_files "$macos_dir"
    print_success "macOS build complete!"
}
```

## Build Flags

The Go binary is compiled with:
- `-ldflags="-s -w"` - Strip debug info to reduce size
- `GOOS`/`GOARCH` - Target platform

TypeScript is compiled with:
- `--mode=production` - Minified output

## Troubleshooting

### "Go is not installed"
Install Go from your package manager:
```bash
# Arch Linux
sudo pacman -S go

# Ubuntu/Debian
sudo apt-get install golang-go

# macOS
brew install go
```

### "Node.js is not installed"
Install Node.js:
```bash
# Arch Linux
sudo pacman -S nodejs npm

# Ubuntu/Debian
sudo apt-get install nodejs npm

# macOS
brew install node
```

### "node_modules not found"
The script will automatically run `npm install` if node_modules is missing.

### Build fails
Check the error messages. Common issues:
1. Missing dependencies - install Go and Node.js
2. Network issues - check your internet connection
3. Permission issues - make sure you have write access to the project directory

## File Sizes

After build (with `-ldflags="-s -w"`):
- **Go binary**: ~6.5MB (Linux), ~6.6MB (Windows)
- **TypeScript**: ~365KB
- **Total**: ~7MB per platform

## Dependencies

- **Go**: Required for building the sync-tool binary
- **Node.js**: Required for building TypeScript
- **npm**: Required for installing dependencies

## Notes

- The script automatically detects and installs npm dependencies if needed
- TypeScript is built once and shared across all platforms
- Only the Go binary is platform-specific
- The script uses colors for better readability (works in most terminals)
