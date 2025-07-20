Product Requirements Document (PRD)

Project: MP4 Player with TikTok AestheticVersion: 1.1Date: July 20, 2025Author: ChatGPT

1. Overview

A lightweight desktop application (single EXE) that plays MP4 videos in a vertical, full‑screen “TikTok style” feed. Users can scroll through videos via trackpad, mouse wheel, or discrete up/down buttons; double‑click to “like”; and point the app to any folder of MP4s.

2. Objectives & Success Metrics

Objective 1: Deliver a scrollable vertical‑feed video player that mimics TikTok UX.

Objective 2: Ensure the app runs instantly from a standalone EXE (no install wizard).

Objective 3: Provide intuitive controls (scroll, buttons, double‑click like) without cluttering the video.

Objective 4: Allow users to select and switch video folders on demand.

Success Metrics:

Launch‑to‑first‑video time < 2 seconds

< 10 MB memory overhead when idle

90% of users can “like” and scroll intuitively within first session

Folder selection modifies playlist instantly (no restart)

3. Target Users

Content creators reviewing short clips

Marketers previewing promotional videos

Casual viewers who prefer offline, TikTok‑style playback

Educators or trainers using short instructional videos

4. User Stories

As a user, I want to scroll up/down through my local MP4s so that I can binge‑watch via trackpad or mouse wheel.

As a user, I want unobtrusive arrow buttons so that I can navigate without a mouse.

As a user, I want double‑click to register a “like” so that I can quickly favorite videos.

As a user, I want to choose any folder of MP4 files so that I can control my playlist.

5. Core Features

Feature

Description

Vertical Full‑Screen Playback

Each MP4 occupies entire window; next/prev video scrolls into view.

Scroll Navigation

Support trackpad swipe, mouse wheel.

Discrete Navigation Buttons

Up/down arrows overlaid in corners or edge; minimal opacity; hidden when mouse idle.

Double‑Click Like

Double‑click anywhere on video toggles “liked” state; a small heart briefly animates.

Folder Selection Dialog

“Open Folder” button to pick directory; loads all MP4s alphabetically/default order.

Lightweight & Portable EXE

Single executable, zero‑install; auto‑updates optional (via manual replace).

6. Functional Requirements

6.1 Video Playback

Play MP4s at native resolution or scale to fit width while preserving aspect ratio.

Pre‑buffer next video for smooth transitions.

Support basic controls: play/pause (via spacebar or click), mute/unmute (via “M”).

6.2 Navigation

Scroll wheel/trackpad: vertical scroll moves to next/previous video at window‑height increments.

Buttons: discreet “▲” and “▼” icons fixed at left or right edge, always clickable.

Keyboard arrows: optional support for Up/Down keys.

6.3 Like Functionality

Double‑click: toggles “like” flag.

Visual feedback: transient 500 ms heart animation at cursor location.

Data storage: store liked‑state in local JSON or SQLite file in user’s AppData folder.

6.4 Folder Management

“Open Folder” in menu or via “Ctrl+O” triggers OS folder picker.

Rescan on demand (e.g. “Refresh” button) to detect new/deleted MP4s without restart.

7. Non‑Functional Requirements

Performance: Cold‑start < 2 s, video transition latency < 100 ms.

Resource Usage: Idle memory ≤ 50 MB; CPU ≤ 5% when paused.

Compatibility: Windows 10+ (x64).

Portability: Single EXE; dependencies embedded (no admin rights).

Reliability: Graceful handling of missing/corrupted files; skip unreadable videos.

Security: Safe loading—no arbitrary code execution via filenames.

8. UI/UX Requirements

Layout: Full‑screen, vertical stack; only navigation buttons and heart animations overlay.

Buttons:

Semi‑transparent until hover.

Small size (e.g. 32×32 px) placed in bottom corners or side edges.

Animations: Smooth vertical swipe (0.2 s ease).

Theming: Dark background; video framed edge‑to‑edge.

Accessibility:

Keyboard support for all controls.

High‑contrast mode toggle.

9. Technical Architecture

Stack: Electron + Node.js

UI: HTML5, CSS (Tailwind optional), JavaScript/TypeScript with a frontend framework (e.g. React or plain DOM).

Media Playback: <video> element backed by bundled FFmpeg binaries for codec support.

Input Handling: Listen for wheel events, pointer/touch gestures, double-click events in JS.

Packaging: electron‑builder to compile into a single Windows EXE.

Data Storage: Local JSON (likes.json) under %APPDATA%\TikTokMP4Player.

Auto‑Update (Optional): Use Electron’s autoUpdater module (manual feed URL).

10. Dependencies & Constraints

Bundle a minimal FFmpeg build for decoding.

Use Electron APIs for file dialogs (dialog.showOpenDialog).

Ensure single-threaded render process; offload heavy decoding to Electron’s main process if needed.

11. Milestones & Timeline

Milestone

Deliverable

Target Date

Kick‑off & Spec Finalization

PRD sign‑off

Week 1 (Jul 27)

Prototype MVP

Basic Electron app + scroll nav

Week 3 (Aug 10)

Core Controls

Double‑click like + folder picker

Week 5 (Aug 24)

Performance Tuning

Fast startup + smooth transitions

Week 7 (Sep 7)

UI Polish & QA

Button animations + accessibility

Week 9 (Sep 21)

Release v1.0

Packaged EXE + docs

Week 10 (Sep 28)

12. Risks & Mitigations

App Size: FFmpeg bloat—use slim builds or dynamic loading.

Performance Hit: playback stutter—optimize video buffer size.

Gesture Conflicts: ensure scroll events on empty areas trigger navigation only.

13. Appendices

A. Iconography & Assets: Arrow SVGs, heart animation frames.

B. JSON Schema for Likes:  ```json
{
"videos": [
{ "path": "C:\Videos\1.mp4", "liked": true },
…
]
}



C. Accessibility Checklist

End of PRD v1.1

