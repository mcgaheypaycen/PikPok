# Assets Directory

This directory contains static assets for the PikPok application.

## Icon Files

Place your application icon files here:

- `icon.ico` - Windows icon file (required for .exe builds)
- `icon.icns` - macOS icon file (optional, for Mac builds)
- `icon.png` - Linux icon file (optional, for Linux builds)

## Icon Requirements

- **Format**: .ico file for Windows
- **Sizes**: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256 pixels
- **Design**: Simple, recognizable at small sizes, fits PikPok branding

The icon will be used for:
- Application window title bar
- Taskbar icon
- File associations
- Installer icon
- Desktop shortcut

## Current Configuration

The icon path is already configured in `package.json`:
```json
"build": {
  "win": {
    "icon": "assets/icon.ico"
  }
}
``` 