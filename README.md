# PikPok 🎬

> ⚠️ **IMPORTANT WARNING** ⚠️
> 
> This application was created by a non-coder using AI assistance and should be used **at your own discretion**. While the app has been tested and appears to function correctly, it may contain bugs, security vulnerabilities, or unexpected behavior. Use this software responsibly and do not rely on it for critical tasks or sensitive data.
> 
---

A TikTok-style MP4 video player for desktop that provides an immersive, vertical scrolling video experience with social features like likes and favorites.

## 🌟 Features

### 📱 TikTok-Style Interface
- **Vertical video layout** - Optimized for portrait videos
- **Full-screen video playback** - Videos fill the entire app window
- **Smooth scrolling navigation** - Scroll wheel or arrow keys to navigate
- **Auto-hide UI** - Interface disappears when inactive for distraction-free viewing

### 🎮 Video Controls
- **Play/Pause** - Click video, spacebar, or control buttons
- **Mute/Unmute** - M key or control buttons
- **Full-screen toggle** - F key for immersive viewing
- **Video speed control** - Long press (500ms) to toggle between 1x and 2x speed
- **Progress bar** - Visual progress indicator at bottom of video with seek functionality
- **Seek control** - Hover over progress bar to see white dot, click or drag to seek
- **Time display** - Remaining time shown in bottom-right corner

### ❤️ Social Features
- **Like videos** - Double-click, L key, or right-side like button
- **Like counter** - Shows like count on right side of screen
- **Liked videos page** - Dedicated page to view all liked videos
- **Like persistence** - Likes are saved and persist between app sessions
- **Clear all likes** - Long press (1 second) on like button in header

### 📁 Folder Management
- **Folder selection** - Choose any folder containing MP4 files
- **Folder persistence** - App remembers last used folder
- **Auto-load on startup** - Automatically loads last folder when app starts
- **Folder validation** - Shows error if folder becomes unavailable
- **Random video ordering** - Videos are shuffled randomly each time a folder loads for a fresh experience

### ⚡ Auto-Play Features
- **Auto-play toggle** - Enable/disable automatic video playback
- **Auto-scroll** - Automatically advance to next video when current ends
- **Smart navigation** - Seamless video transitions

### 🎯 Navigation
- **Arrow keys** - Up/Down or W/S keys for navigation
- **Scroll wheel** - Mouse wheel to navigate videos
- **Navigation buttons** - Click buttons in header
- **Keyboard shortcuts** - Comprehensive keyboard support

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)

### Installation

1. **Clone or download** the project files
2. **Open terminal/command prompt** in the project directory
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the application**:
   ```bash
   npm start
   ```

### First Time Setup

1. **Launch PikPok** - The app will open with an empty state
2. **Select a folder** - Click the folder button in the header or use Ctrl+O
3. **Choose MP4 folder** - Select any folder containing MP4 video files
4. **Start watching** - Videos will load and auto-play (if enabled)

## 🎮 Controls & Shortcuts

### Video Navigation
| Action | Keyboard | Mouse | Description |
|--------|----------|-------|-------------|
| Next Video | ↓, S | Scroll down | Go to next video |
| Previous Video | ↑, W | Scroll up | Go to previous video |
| Play/Pause | Space | Click video | Toggle play/pause |
| Mute/Unmute | M | Control button | Toggle audio |
| Full-screen | F | - | Toggle full-screen |
| Video Speed | - | Long press (500ms) | Toggle 1x/2x speed |
| Seek Video | - | Click/drag progress bar | Jump to specific time |

### Social Features
| Action | Keyboard | Mouse | Description |
|--------|----------|-------|-------------|
| Like Video | L | Double-click | Like current video |
| Unlike Video | - | Right-click | Reset like count to 0 |
| View Liked | - | Like button in header | Go to liked videos page |
| Clear All Likes | - | Long press like button (1s) | Clear all likes |

### App Controls
| Action | Keyboard | Mouse | Description |
|--------|----------|-------|-------------|
| Open Folder | Ctrl+O | Folder button | Select video folder |
| Exit App | Escape | - | Show exit confirmation |
| Refresh | F5 | - | Reload current folder |

## 📱 Interface Guide

### Header Bar
- **Folder Info** - Shows current folder name and video count
- **Auto-play Toggle** - Enable/disable automatic video playback
- **Navigation Buttons** - Previous/Next video controls
- **Like Button** - Access liked videos (long press to clear all)

### Video Controls
- **Play/Pause Button** - ▶ when paused, ⏸ when playing
- **Mute Button** - 🔊 when unmuted, 🔇 when muted
- **Progress Bar** - Shows video playback progress with seek functionality
- **Seek Handle** - White dot that appears on hover, click or drag to seek
- **Time Display** - Shows remaining time

### Right-Side Like Counter
- **Heart Icon** - Shows ❤️ with like count
- **Auto-hide** - Disappears with header when inactive
- **Bounce Animation** - Animates when video is liked
- **Position** - Centered on right side of screen

### Liked Videos Page
- **Back Button** - Return to main video feed
- **Video Count** - Shows number of liked videos
- **Navigation** - Same controls as main page
- **Sorted by Likes** - Videos ordered by like count (highest first)

## 🔧 Advanced Features

### Auto-Play Modes
- **Auto-play ON** - Videos automatically play when navigated to
- **Auto-play OFF** - Videos must be manually started
- **Auto-scroll** - Automatically advance to next video when current ends

### Like System
- **Per-video likes** - Each video tracks its own like count
- **Persistent storage** - Likes saved to local file
- **Visual feedback** - Heart animations and counter updates
- **Like management** - Clear individual or all likes

### Folder Management
- **Multiple formats** - Supports all MP4 video files
- **Large folders** - Handles folders with hundreds of videos
- **Error handling** - Graceful handling of missing folders
- **Auto-recovery** - Remembers last folder for easy access
- **Random ordering** - Videos shuffled randomly on each folder load for unpredictable browsing

### Performance Features
- **FFmpeg integration** - Advanced video codec support
- **Hardware acceleration** - GPU-accelerated video playback
- **Memory efficient** - Only loads current video
- **Smooth transitions** - Optimized video switching

## 🛠️ Technical Details

### Supported Formats
- **Video**: MP4 files (all codecs supported by FFmpeg)
- **Audio**: All audio formats supported by HTML5 video
- **Resolution**: Any resolution (optimized for vertical videos)

### System Requirements
- **OS**: Windows, macOS, Linux
- **Memory**: 4GB RAM minimum (8GB recommended)
- **Storage**: 100MB for app + space for video files
- **Graphics**: Any modern GPU (hardware acceleration supported)

### File Structure
```
PikPok/
├── main.js          # Electron main process
├── index.html       # Main application interface
├── renderer.js      # Application logic and UI
├── styles.css       # Styling and animations
├── package.json     # Dependencies and build config
└── README.md        # This file
```

## 🚨 Troubleshooting

### Common Issues

**Videos not playing:**
- Ensure videos are valid MP4 files
- Check that FFmpeg is properly installed
- Try refreshing the folder (F5)

**Audio issues:**
- Check system audio settings
- Use M key to toggle mute
- Ensure video files have audio tracks

**Performance problems:**
- Close other applications
- Reduce video quality if needed
- Check available system memory

**Folder not loading:**
- Verify folder contains MP4 files
- Check folder permissions
- Try selecting folder again

### Error Messages

**"Folder Not Available"** - The previously used folder is no longer accessible
- Click "Select New Folder" to choose a different location

**"No videos found"** - Selected folder doesn't contain MP4 files
- Ensure folder contains .mp4 files
- Check file extensions are correct

## 📝 Development

### Building from Source
```bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Build for distribution
npm run build

# Create portable package
npm run pack
```

### Key Technologies
- **Electron** - Desktop application framework
- **HTML5 Video** - Video playback engine
- **FFmpeg** - Video codec support
- **Node.js** - Backend functionality

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📞 Support

For support, please:
1. Check this README for troubleshooting
2. Review the troubleshooting section above
3. Create an issue with detailed information about your problem

---

**PikPok** - Bringing the TikTok experience to your desktop videos! 🎬✨ 