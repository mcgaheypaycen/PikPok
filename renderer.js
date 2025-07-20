const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs-extra');

class TikTokMP4Player {
    constructor() {
        this.videos = [];
        this.currentIndex = 0;
        this.currentFolder = null;
        this.likes = { videos: [] };
        this.currentVideoElement = null; // Only track current video
        this.isNavigating = false;
        this.showLikedOnly = false; // Filter state
        this.autoPlayEnabled = true; // Auto-play toggle state
        this.cursorTimeout = null; // For UI auto-hide
        this.uiHidden = false; // Track UI visibility state
        this.currentPage = 'main'; // Track current page (main or liked)
        this.likedVideos = []; // Store liked videos for liked page
        this.likedCurrentIndex = 0; // Current index in liked videos
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.loadLikes();
        await this.loadLastFolder();
        this.updateUI();
    }

    setupEventListeners() {
        // Folder selection
        document.getElementById('folder-select-btn').addEventListener('click', () => {
            this.openFolder();
        });

        // Empty state folder selection
        document.getElementById('empty-open-folder').addEventListener('click', () => {
            this.openFolder();
        });

        // Auto-play toggle
        document.getElementById('auto-play-checkbox').addEventListener('change', (e) => {
            this.autoPlayEnabled = e.target.checked;
            console.log('Auto-play enabled:', this.autoPlayEnabled);
            
            // Update loop setting for current video
            if (this.currentVideoElement && this.currentVideoElement.video) {
                this.currentVideoElement.video.loop = !this.autoPlayEnabled;
                console.log('Updated video loop setting:', !this.autoPlayEnabled);
            }
        });

        // Liked videos page navigation with long press to clear likes
        const likedBtn = document.getElementById('view-liked-btn');
        let longPressTimer = null;
        let isLongPress = false;

        likedBtn.addEventListener('mousedown', () => {
            isLongPress = false;
            likedBtn.classList.add('long-pressing');
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                this.showClearLikesDialog();
            }, 1000); // 1 second long press
        });

        likedBtn.addEventListener('mouseup', () => {
            likedBtn.classList.remove('long-pressing');
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });

        likedBtn.addEventListener('mouseleave', () => {
            likedBtn.classList.remove('long-pressing');
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });

        likedBtn.addEventListener('click', (e) => {
            if (!isLongPress) {
                this.showLikedVideosPage();
            }
            isLongPress = false;
        });



        document.getElementById('back-to-main').addEventListener('click', () => {
            this.showMainPage();
        });

        // Liked videos navigation
        document.getElementById('liked-nav-up').addEventListener('click', () => {
            this.previousLikedVideo();
        });

        document.getElementById('liked-nav-down').addEventListener('click', () => {
            this.nextLikedVideo();
        });

        // Header navigation buttons
        document.getElementById('nav-up').addEventListener('click', () => {
            this.previousVideo();
        });

        document.getElementById('nav-down').addEventListener('click', () => {
            this.nextVideo();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // Scroll wheel navigation
        document.addEventListener('wheel', (e) => {
            this.handleScroll(e);
        });

        // Cursor movement tracking for UI auto-hide
        document.addEventListener('mousemove', () => {
            this.handleCursorMovement();
        });

        // IPC events from main process
        ipcRenderer.on('folder-selected', (event, folderPath) => {
            this.loadVideosFromFolder(folderPath);
        });

        ipcRenderer.on('refresh-videos', () => {
            if (this.currentFolder) {
                this.loadVideosFromFolder(this.currentFolder);
            }
        });
    }

    handleKeyboard(e) {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                this.previousVideo();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                this.nextVideo();
                break;
            case ' ':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'm':
            case 'M':
                e.preventDefault();
                this.toggleMute();
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                this.toggleFullScreen();
                this.showKeyboardFeedback('⛶');
                break;
            case 'l':
            case 'L':
                e.preventDefault();
                this.toggleLike(this.currentIndex, 0, 0);
                break;
            case 'o':
            case 'O':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.openFolder();
                    this.showKeyboardFeedback('📁');
                }
                break;
            case 'Escape':
                e.preventDefault();
                this.showExitConfirmation();
                this.showKeyboardFeedback('🚪');
                break;
            case 'F5':
                e.preventDefault();
                if (this.currentFolder) {
                    this.loadVideosFromFolder(this.currentFolder);
                    this.showKeyboardFeedback('🔄');
                }
                break;
        }
    }

    showKeyboardFeedback(symbol) {
        // Create a temporary visual feedback for keyboard actions
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 20px;
            border-radius: 50%;
            font-size: 32px;
            z-index: 1000;
            pointer-events: none;
            animation: keyboardFeedback 0.6s ease-out forwards;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(15px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
        `;
        feedback.textContent = symbol;
        document.body.appendChild(feedback);

        // Remove after animation
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, 600);
    }

    handleCursorMovement() {
        // Show UI if it was hidden
        if (this.uiHidden) {
            this.showUI();
        }

        // Reset the timeout
        if (this.cursorTimeout) {
            clearTimeout(this.cursorTimeout);
        }

        // Set new timeout to hide UI after 3 seconds
        this.cursorTimeout = setTimeout(() => {
            this.hideUI();
        }, 3000);
    }

    hideUI() {
        const header = document.getElementById('header');
        const rightLikeCount = document.querySelector('.right-like-count');
        
        if (header) {
            header.classList.add('ui-hidden');
            this.uiHidden = true;
            console.log('UI hidden due to cursor inactivity');
        }
        
        if (rightLikeCount) {
            rightLikeCount.classList.add('ui-hidden');
        }
    }

    showUI() {
        const header = document.getElementById('header');
        const rightLikeCount = document.querySelector('.right-like-count');
        
        if (header) {
            header.classList.remove('ui-hidden');
            this.uiHidden = false;
            console.log('UI shown due to cursor movement');
        }
        
        if (rightLikeCount) {
            rightLikeCount.classList.remove('ui-hidden');
        }
    }

    showLikedVideosPage() {
        this.currentPage = 'liked';
        
        // Stop all videos and clean up before switching
        this.stopAllVideos();
        
        this.loadLikedVideos();
        this.renderLikedVideos();
        
        // Hide main page, show liked page
        document.getElementById('app').classList.add('hidden');
        document.getElementById('liked-videos-page').classList.remove('hidden');
        

        
        console.log('Switched to liked videos page');
        console.log('Liked videos loaded:', this.likedVideos.length);
    }

    showMainPage() {
        this.currentPage = 'main';
        
        // Stop all videos and clean up before switching
        this.stopAllVideos();
        
        // Show main page, hide liked page
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('liked-videos-page').classList.add('hidden');
        

        
        // Re-render videos and auto-play if enabled
        if (this.videos.length > 0) {
            this.renderVideos();
            
            // Auto-play current video if enabled
            if (this.autoPlayEnabled) {
                // Wait a bit for video to load, then auto-play
                setTimeout(() => {
                    this.playCurrentVideo();
                }, 500);
            }
        }
        
        console.log('Switched to main page');
    }

    loadLikedVideos() {
        // Get all videos that have likes
        this.likedVideos = this.videos.filter(videoPath => this.getLikeCount(videoPath) > 0);
        
        // Randomize the order of liked videos for a fresh experience each time
        this.likedVideos.sort(() => Math.random() - 0.5);
        
        this.likedCurrentIndex = 0;
        
        // Update liked count display
        document.getElementById('liked-count').textContent = `${this.likedVideos.length} video${this.likedVideos.length !== 1 ? 's' : ''}`;
        
        console.log('Loaded liked videos:', this.likedVideos.length);
        console.log('Randomized liked video order:', this.likedVideos.map(v => path.basename(v)));
    }

    renderLikedVideos() {
        const likedVideoFeed = document.getElementById('liked-video-feed');
        likedVideoFeed.innerHTML = '';

        if (this.likedVideos.length === 0) {
            likedVideoFeed.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,0.7);">No liked videos found</div>';
            return;
        }

        // Only create the current liked video element
        const videoElement = this.createVideoElement(this.likedVideos[this.likedCurrentIndex], this.likedCurrentIndex);
        likedVideoFeed.appendChild(videoElement);

        this.updateLikedNavigationButtons();
        
        // Update like display for the current liked video
        const videoPath = this.likedVideos[this.likedCurrentIndex];
        const likeCount = this.getLikeCount(videoPath);
        this.updateVideoLikeDisplay(videoElement, likeCount);
        
        // Play the current video (if auto-play is enabled)
        if (this.autoPlayEnabled) {
            // Ensure video is unmuted before playing
            if (this.currentVideoElement && this.currentVideoElement.video) {
                this.currentVideoElement.video.muted = false;
            }
            this.playCurrentVideo();
        }
    }

    nextLikedVideo() {
        if (this.likedCurrentIndex < this.likedVideos.length - 1) {
            this.isNavigating = true;
            this.pauseCurrentVideo();
            this.likedCurrentIndex++;
            this.renderLikedVideos();
            this.isNavigating = false;
        }
    }

    previousLikedVideo() {
        if (this.likedCurrentIndex > 0) {
            this.isNavigating = true;
            this.pauseCurrentVideo();
            this.likedCurrentIndex--;
            this.renderLikedVideos();
            this.isNavigating = false;
        }
    }

    updateLikedNavigationButtons() {
        const upBtn = document.getElementById('liked-nav-up');
        const downBtn = document.getElementById('liked-nav-down');
        
        if (upBtn && downBtn) {
            upBtn.disabled = this.likedCurrentIndex === 0;
            downBtn.disabled = this.likedCurrentIndex === this.likedVideos.length - 1;
        }
    }

    updateLikedVideosButton() {
        const viewLikedBtn = document.getElementById('view-liked-btn');
        const likedCount = this.getLikedCount();
        
        if (viewLikedBtn) {
            if (likedCount > 0) {
                viewLikedBtn.style.display = 'block';
            } else {
                viewLikedBtn.style.display = 'none';
            }
        }
    }

    handleScroll(e) {
        if (this.videos.length === 0) return;
        
        // Prevent default scroll behavior
        e.preventDefault();
        
        // Add scroll threshold to prevent accidental navigation
        if (!this.scrollThreshold) {
            this.scrollThreshold = 0;
        }
        
        this.scrollThreshold += e.deltaY;
        
        // Navigate when threshold is reached
        if (Math.abs(this.scrollThreshold) > 50) {
            if (this.scrollThreshold > 0) {
                this.nextVideo();
            } else {
                this.previousVideo();
            }
            this.scrollThreshold = 0;
        }
    }

    async openFolder() {
        try {
            console.log('Opening folder dialog...');
            const result = await ipcRenderer.invoke('open-folder-dialog');
            console.log('Folder dialog result:', result);
            
            if (result && result.filePaths && result.filePaths.length > 0) {
                const folderPath = result.filePaths[0];
                console.log('Selected folder path:', folderPath);
                this.loadVideosFromFolder(folderPath);
            } else {
                console.log('No folder selected or dialog cancelled');
            }
        } catch (error) {
            console.error('Error opening folder:', error);
        }
    }

    async loadVideosFromFolder(folderPath) {
        try {
            this.showLoading(true);
            this.currentFolder = folderPath;
            
            console.log('Loading videos from folder:', folderPath);
            
            const files = await fs.readdir(folderPath);
            console.log('Total files found:', files.length);
            
            const mp4Files = files.filter(file => {
                const isMP4 = file.toLowerCase().endsWith('.mp4');
                if (isMP4) {
                    console.log('Found MP4 file:', file);
                }
                return isMP4;
            }).map(file => path.join(folderPath, file));

            console.log('MP4 files found:', mp4Files.length);
            console.log('MP4 file paths:', mp4Files);

            // Test if we can access the first video file
            if (mp4Files.length > 0) {
                const testFile = mp4Files[0];
                console.log('Testing file access for:', testFile);
                try {
                    const stats = await fs.stat(testFile);
                    console.log('File stats:', stats);
                } catch (fileError) {
                    console.error('Error accessing file:', fileError);
                }
            }

            // Randomize the order of videos for a fresh experience each time
            const shuffledVideos = [...mp4Files].sort(() => Math.random() - 0.5);
            console.log('Randomized video order:', shuffledVideos.map(v => path.basename(v)));

            this.videos = shuffledVideos;
            this.currentIndex = 0;
            
            // Save the folder path for next launch
            await this.saveLastFolder(folderPath);
            
            this.updateFolderInfo();
            this.renderVideos();
            this.showLoading(false);
            
            // Auto-play first video when folder is selected (if enabled)
            if (this.videos.length > 0 && this.autoPlayEnabled) {
                // Wait a bit for video to load, then auto-play
                setTimeout(() => {
                    this.playCurrentVideo();
                }, 500);
            }
            
            // Show/hide liked videos button based on video count
            const viewLikedBtn = document.getElementById('view-liked-btn');
            if (this.videos.length > 0) {
                this.showEmptyState(false);
                
                // Show liked videos button if there are liked videos
                const likedCount = this.getLikedCount();
                if (likedCount > 0) {
                    viewLikedBtn.style.display = 'block';
                } else {
                    viewLikedBtn.style.display = 'none';
                }
            } else {
                viewLikedBtn.style.display = 'none';
                this.showEmptyState(true);
            }
        } catch (error) {
            console.error('Error loading videos:', error);
            this.showLoading(false);
            this.showEmptyState(true);
        }
    }

    updateFolderInfo() {
        const folderInfo = document.getElementById('folder-info');
        folderInfo.classList.add('updating');
        
        const folderName = this.currentFolder ? path.basename(this.currentFolder) : 'No folder selected';
        const videoCount = this.videos.length;
        
        // Check if folder is unavailable (has path but no videos)
        const isUnavailable = this.currentFolder && this.videos.length === 0;
        
        document.getElementById('folder-name').textContent = `📁 ${folderName}`;
        document.getElementById('video-count').textContent = isUnavailable ? '(unavailable)' : `(${videoCount} videos)`;
        
        // Add visual indicator for unavailable folder
        if (isUnavailable) {
            folderInfo.classList.add('unavailable');
        } else {
            folderInfo.classList.remove('unavailable');
        }
        
        // Remove updating class after transition
        setTimeout(() => {
            folderInfo.classList.remove('updating');
        }, 300);
    }

    getLikedCount() {
        return this.likes.videos.filter(video => video.likeCount > 0).length;
    }

    getTotalLikes() {
        return this.likes.videos.reduce((total, video) => total + (video.likeCount || 0), 0);
    }

    updateVideoLikeDisplay(videoItem, likeCount) {
        // Remove existing like display from video
        const existingLikeDisplay = videoItem.querySelector('.video-like-count');
        if (existingLikeDisplay) {
            existingLikeDisplay.remove();
        }

        // Remove existing right-side like display
        const existingRightLikeDisplay = document.querySelector('.right-like-count');
        if (existingRightLikeDisplay) {
            existingRightLikeDisplay.remove();
        }

        // Create right-side like display if count > 0
        if (likeCount > 0) {
            const rightLikeDisplay = document.createElement('div');
            rightLikeDisplay.className = 'right-like-count';
            rightLikeDisplay.innerHTML = `
                <div class="heart-icon">❤️</div>
                <div class="like-number">${likeCount}</div>
            `;
            document.body.appendChild(rightLikeDisplay);
        }
    }



    showLikedVideos() {
        const likedVideos = this.videos.filter(videoPath => this.getLikeCount(videoPath) > 0);
        if (likedVideos.length > 0) {
            this.videos = likedVideos;
            this.currentIndex = 0;
            this.renderVideos();
            this.updateFolderInfo();
        } else {
            // Show message when no liked videos
            const videoFeed = document.getElementById('video-feed');
            videoFeed.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,0.7);">No liked videos found</div>';
        }
    }

    showAllVideos() {
        // Reload original videos from folder
        if (this.currentFolder) {
            this.loadVideosFromFolder(this.currentFolder);
        }
    }

    renderVideos() {
        const videoFeed = document.getElementById('video-feed');
        videoFeed.innerHTML = '';

        if (this.videos.length === 0) return;

        // Only create the current video element
        const videoElement = this.createVideoElement(this.videos[this.currentIndex], this.currentIndex);
        videoFeed.appendChild(videoElement);

        this.updateNavigationButtons();
        
        // Update like display for the current video
        const videoPath = this.videos[this.currentIndex];
        const likeCount = this.getLikeCount(videoPath);
        this.updateVideoLikeDisplay(videoElement, likeCount);
        
        // Play the current video (if auto-play is enabled)
        if (this.autoPlayEnabled) {
            // Ensure video is unmuted before playing
            if (this.currentVideoElement && this.currentVideoElement.video) {
                this.currentVideoElement.video.muted = false;
            }
            this.playCurrentVideo();
        }
    }

    createVideoElement(videoPath, index) {
        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        videoItem.dataset.index = index;
        videoItem.dataset.path = videoPath;

        const video = document.createElement('video');
        // Use simple file URL
        const fileUrl = `file:///${videoPath.replace(/\\/g, '/')}`;
        video.src = fileUrl;
        video.muted = false; // Start unmuted for auto-play
        video.loop = !this.autoPlayEnabled; // Loop only when auto-scroll is disabled
        video.playsInline = true;
        video.preload = 'auto';
        video.autoplay = false;
        
        // Store current video element reference
        this.currentVideoElement = { video, videoItem, index };

        // Video controls overlay
        const controls = document.createElement('div');
        controls.className = 'video-controls';
        
        const playPauseBtn = document.createElement('button');
        playPauseBtn.className = 'control-btn';
        playPauseBtn.innerHTML = '▶';
        playPauseBtn.onclick = (e) => {
            e.stopPropagation();
            this.togglePlayPause();
        };

        const muteBtn = document.createElement('button');
        muteBtn.className = 'control-btn';
        muteBtn.innerHTML = '🔊';
        muteBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleMute();
        };

        controls.appendChild(playPauseBtn);
        controls.appendChild(muteBtn);

        // Progress bar with seek functionality
        const progressContainer = document.createElement('div');
        progressContainer.className = 'video-progress';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'video-progress-bar';
        
        const seekHandle = document.createElement('div');
        seekHandle.className = 'video-seek-handle';
        
        progressContainer.appendChild(progressBar);
        progressContainer.appendChild(seekHandle);
        videoItem.appendChild(progressContainer);

        videoItem.appendChild(video);
        videoItem.appendChild(controls);

        // Remaining time display - add after video and controls
        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'video-time-display';
        timeDisplay.style.display = 'block'; // Show by default for testing
        timeDisplay.textContent = '0:00'; // Initial text
        videoItem.appendChild(timeDisplay);

        // Double-click to like
        videoItem.addEventListener('dblclick', (e) => {
            this.toggleLike(index, e.clientX, e.clientY);
        });

        // Right-click to unlike (reset like count)
        videoItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.unlikeVideo(index);
        });

        // Single click to play/pause
        videoItem.addEventListener('click', () => {
            this.togglePlayPause();
        });

        // Long press detection for speed control
        let longPressTimer = null;
        const longPressDelay = 500; // 500ms for long press

        // Mouse events for desktop
        videoItem.addEventListener('mousedown', () => {
            longPressTimer = setTimeout(() => {
                this.toggleVideoSpeed();
                this.showKeyboardFeedback('⚡');
            }, longPressDelay);
        });

        videoItem.addEventListener('mouseup', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });

        videoItem.addEventListener('mouseleave', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });

        // Touch events for mobile
        videoItem.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behavior
            longPressTimer = setTimeout(() => {
                this.toggleVideoSpeed();
                this.showKeyboardFeedback('⚡');
            }, longPressDelay);
        });

        videoItem.addEventListener('touchend', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });

        // Hover events for time display
        videoItem.addEventListener('mouseenter', () => {
            timeDisplay.style.display = 'block';
        });

        videoItem.addEventListener('mouseleave', () => {
            timeDisplay.style.display = 'none';
        });

        // Video event listeners
        video.addEventListener('loadstart', () => {
            console.log('Video load started:', videoPath);
        });

        video.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded:', videoPath);
            console.log('Video duration:', video.duration);
        });

        video.addEventListener('canplay', () => {
            console.log('Video can play:', videoPath);
            // Auto-play if this is the current video, we're not navigating, and auto-play is enabled
            if (index === this.currentIndex && !this.isNavigating && this.autoPlayEnabled) {
                this.playCurrentVideo();
            }
        });

        video.addEventListener('playing', () => {
            console.log('Video started playing:', videoPath);
        });

        video.addEventListener('error', (e) => {
            console.error('Video error:', e);
            console.error('Video error details:', video.error);
            videoItem.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,0.7);">Error loading video</div>';
        });

        video.addEventListener('play', () => {
            playPauseBtn.innerHTML = '⏸';
        });

        video.addEventListener('pause', () => {
            playPauseBtn.innerHTML = '▶';
        });

        video.addEventListener('volumechange', () => {
            muteBtn.innerHTML = video.muted ? '🔇' : '🔊';
        });

        // Update progress bar and time display
        video.addEventListener('timeupdate', () => {
            if (video.duration) {
                const progress = (video.currentTime / video.duration) * 100;
                progressBar.style.width = `${progress}%`;
                seekHandle.style.left = `${progress}%`;
                
                // Update remaining time display
                const remainingTime = video.duration - video.currentTime;
                const minutes = Math.floor(remainingTime / 60);
                const seconds = Math.floor(remainingTime % 60);
                const timeText = `-${minutes}:${seconds.toString().padStart(2, '0')}`;
                timeDisplay.textContent = timeText;
                console.log('Time display updated:', timeText);
            }
        });

        // Progress bar seek functionality
        let isDragging = false;
        let dragStartX = 0;
        let dragStartProgress = 0;

        // Show seek handle on hover
        progressContainer.addEventListener('mouseenter', () => {
            seekHandle.style.opacity = '1';
        });

        progressContainer.addEventListener('mouseleave', () => {
            if (!isDragging) {
                seekHandle.style.opacity = '0';
            }
        });

        // Click to seek
        progressContainer.addEventListener('click', (e) => {
            if (video.duration && !isDragging) {
                const rect = progressContainer.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const progress = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                const seekTime = (progress / 100) * video.duration;
                video.currentTime = seekTime;
                console.log('Seeking to:', seekTime, 'seconds (', progress.toFixed(1), '% of video)');
            }
        });

        // Drag to seek
        seekHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isDragging = true;
            dragStartX = e.clientX;
            dragStartProgress = video.currentTime / video.duration;
            
            // Add dragging class for visual feedback
            seekHandle.classList.add('dragging');
            seekHandle.style.opacity = '1'; // Keep visible while dragging
            
            // Prevent text selection during drag
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging && video.duration) {
                const rect = progressContainer.getBoundingClientRect();
                const deltaX = e.clientX - dragStartX;
                const deltaProgress = (deltaX / rect.width) * 100;
                const newProgress = Math.max(0, Math.min(100, (dragStartProgress * 100) + deltaProgress));
                const seekTime = (newProgress / 100) * video.duration;
                video.currentTime = seekTime;
                console.log('Dragging to:', seekTime, 'seconds (', newProgress.toFixed(1), '% of video)');
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                seekHandle.classList.remove('dragging');
                document.body.style.userSelect = '';
            }
        });

        // Touch support for mobile devices
        seekHandle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isDragging = true;
            dragStartX = e.touches[0].clientX;
            dragStartProgress = video.currentTime / video.duration;
            
            seekHandle.classList.add('dragging');
            seekHandle.style.opacity = '1'; // Keep visible while dragging
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('touchmove', (e) => {
            if (isDragging && video.duration) {
                e.preventDefault();
                const rect = progressContainer.getBoundingClientRect();
                const deltaX = e.touches[0].clientX - dragStartX;
                const deltaProgress = (deltaX / rect.width) * 100;
                const newProgress = Math.max(0, Math.min(100, (dragStartProgress * 100) + deltaProgress));
                const seekTime = (newProgress / 100) * video.duration;
                video.currentTime = seekTime;
            }
        });

        document.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                seekHandle.classList.remove('dragging');
                document.body.style.userSelect = '';
            }
        });

        // Auto-scroll to next video when current video ends
        video.addEventListener('ended', () => {
            if (this.autoPlayEnabled && this.currentIndex < this.videos.length - 1) {
                console.log('Video ended, auto-scrolling to next video');
                setTimeout(() => {
                    this.nextVideo();
                }, 500); // Small delay before auto-scrolling
            }
        });

        // Check if video is liked and show like count
        const likeCount = this.getLikeCount(videoPath);
        if (likeCount > 0) {
            videoItem.classList.add('liked');
            this.updateVideoLikeDisplay(videoItem, likeCount);
        }

        return videoItem;
    }

    nextVideo() {
        if (this.currentIndex < this.videos.length - 1) {
            this.isNavigating = true;
            this.pauseCurrentVideo();
            this.currentIndex++;
            this.renderVideos();
            this.isNavigating = false;
        }
    }

    previousVideo() {
        if (this.currentIndex > 0) {
            this.isNavigating = true;
            this.pauseCurrentVideo();
            this.currentIndex--;
            this.renderVideos();
            this.isNavigating = false;
        }
    }

    pauseCurrentVideo() {
        if (this.currentVideoElement && this.currentVideoElement.video) {
            this.currentVideoElement.video.pause();
        }
    }

    stopAllVideos() {
        // Stop current video element
        if (this.currentVideoElement && this.currentVideoElement.video) {
            this.currentVideoElement.video.pause();
            this.currentVideoElement.video.currentTime = 0;
        }
        
        // Stop all video elements in the DOM
        const allVideos = document.querySelectorAll('video');
        allVideos.forEach(video => {
            video.pause();
            video.currentTime = 0;
            video.muted = true; // Mute to prevent any audio
        });
        
        console.log('Stopped all videos and reset audio');
    }

    playCurrentVideo() {
        if (this.currentVideoElement && this.currentVideoElement.video) {
            const video = this.currentVideoElement.video;
            console.log('Playing current video:', video.src);
            
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Video playing successfully');
                }).catch((error) => {
                    console.error('Error playing video:', error);
                    // Retry after a delay
                    setTimeout(() => {
                        video.play().catch(console.error);
                    }, 1000);
                });
            }
        }
    }

    togglePlayPause() {
        if (this.currentVideoElement && this.currentVideoElement.video) {
            const video = this.currentVideoElement.video;
            let actionPerformed = '';
            
            if (video.paused) {
                this.playCurrentVideo();
                actionPerformed = '▶'; // Play button - user just played the video
            } else {
                video.pause();
                actionPerformed = '⏸'; // Pause icon - user just paused the video
            }
            
            // Show keyboard feedback with the action that was just performed
            this.showKeyboardFeedback(actionPerformed);
        }
    }

    toggleMute() {
        if (this.currentVideoElement && this.currentVideoElement.video) {
            const video = this.currentVideoElement.video;
            video.muted = !video.muted;
            
            // Show keyboard feedback with correct icon
            const icon = video.muted ? '🔇' : '🔊';
            this.showKeyboardFeedback(icon);
        }
    }

    updateNavigationButtons() {
        const navUp = document.getElementById('nav-up');
        const navDown = document.getElementById('nav-down');

        navUp.disabled = this.currentIndex === 0;
        navDown.disabled = this.currentIndex === this.videos.length - 1;
    }

    async loadLikes() {
        try {
            this.likes = await ipcRenderer.invoke('read-likes-file');
        } catch (error) {
            console.error('Error loading likes:', error);
            this.likes = { videos: [] };
        }
    }

    async saveLikes() {
        try {
            await ipcRenderer.invoke('write-likes-file', this.likes);
        } catch (error) {
            console.error('Error saving likes:', error);
        }
    }

    async saveLastFolder(folderPath) {
        try {
            await ipcRenderer.invoke('save-last-folder', folderPath);
        } catch (error) {
            console.error('Error saving last folder:', error);
        }
    }

    async loadLastFolder() {
        try {
            const lastFolder = await ipcRenderer.invoke('load-last-folder');
            if (lastFolder) {
                await this.checkAndLoadFolder(lastFolder);
            }
        } catch (error) {
            console.error('Error loading last folder:', error);
        }
    }

    async checkAndLoadFolder(folderPath) {
        try {
            // Check if folder exists and is accessible
            const folderExists = await ipcRenderer.invoke('check-folder-exists', folderPath);
            
            if (folderExists) {
                // Folder is available, load it
                await this.loadVideosFromFolder(folderPath);
            } else {
                // Folder is not available, show error
                this.showFolderUnavailableError(folderPath);
            }
        } catch (error) {
            console.error('Error checking folder:', error);
            this.showFolderUnavailableError(folderPath);
        }
    }

    showFolderUnavailableError(folderPath) {
        const folderName = path.basename(folderPath);
        this.showEmptyState(true);
        
        // Update empty state message
        const emptyState = document.getElementById('empty-state');
        const title = emptyState.querySelector('h2');
        const description = emptyState.querySelector('p');
        const button = emptyState.querySelector('button');
        
        title.textContent = 'Folder Not Available';
        description.textContent = `The folder "${folderName}" is no longer available. Please select a different folder.`;
        button.textContent = 'Select New Folder';
        
        // Update folder info to show unavailable folder
        this.currentFolder = folderPath;
        this.updateFolderInfo();
        
        console.log('Folder unavailable:', folderPath);
    }

    showClearLikesDialog() {
        const confirmed = confirm('Are you sure you want to clear all likes? This action cannot be undone.');
        if (confirmed) {
            this.clearAllLikes();
        }
    }

    async clearAllLikes() {
        try {
            // Reset all like counts to 0
            this.likes.videos.forEach(video => {
                video.likeCount = 0;
            });

            // Save the updated likes
            await this.saveLikes();

            // Update all video elements in the current view
            this.updateAllVideoLikeDisplays();

            // Update liked videos button visibility
            this.updateLikedVideosButton();

            // If on liked videos page, refresh it
            if (this.currentPage === 'liked') {
                this.loadLikedVideos();
                this.renderLikedVideos();
            }

            console.log('All likes cleared successfully');
            
            // Show visual feedback
            this.showClearLikesFeedback();
        } catch (error) {
            console.error('Error clearing likes:', error);
        }
    }

    showClearLikesFeedback() {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            font-size: 16px;
            z-index: 1000;
            pointer-events: none;
            animation: fadeInOut 2s ease-in-out forwards;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(15px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        `;
        feedback.textContent = 'All likes cleared!';
        document.body.appendChild(feedback);

        // Remove after animation
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, 2000);
    }

    updateAllVideoLikeDisplays() {
        // Update all video elements in the main feed
        const videoItems = document.querySelectorAll('.video-item');
        videoItems.forEach((videoItem, index) => {
            const videoPath = this.videos[index];
            if (videoPath) {
                const likeCount = this.getLikeCount(videoPath);
                videoItem.classList.toggle('liked', likeCount > 0);
                this.updateVideoLikeDisplay(videoItem, likeCount);
            }
        });
    }



    getLikeCount(videoPath) {
        const likeEntry = this.likes.videos.find(video => video.path === videoPath);
        return likeEntry ? likeEntry.likeCount : 0;
    }

    isLiked(videoPath) {
        const likeCount = this.getLikeCount(videoPath);
        return likeCount > 0;
    }

    async toggleLike(index, x, y) {
        const videoPath = this.videos[index];
        
        if (!videoPath) return;

        // Find existing like entry or create new one
        let likeEntry = this.likes.videos.find(video => video.path === videoPath);
        
        if (!likeEntry) {
            likeEntry = { path: videoPath, likeCount: 0 };
            this.likes.videos.push(likeEntry);
        }

        // Increment like count
        likeEntry.likeCount++;

        // Update UI for current video element
        if (this.currentVideoElement && this.currentVideoElement.index === index) {
            const videoItem = this.currentVideoElement.videoItem;
            videoItem.classList.add('liked');
            this.updateVideoLikeDisplay(videoItem, likeEntry.likeCount);
            
            // Add bounce animation to right-side like counter
            const rightLikeDisplay = document.querySelector('.right-like-count');
            if (rightLikeDisplay) {
                rightLikeDisplay.classList.add('bounce');
                setTimeout(() => {
                    rightLikeDisplay.classList.remove('bounce');
                }, 600);
            }
        }

        // Show heart animation
        this.showHeartAnimation(x, y);

        // Save to file
        await this.saveLikes();
        
        // Update liked videos button visibility
        this.updateLikedVideosButton();
        
        console.log(`Video liked (${likeEntry.likeCount} likes):`, videoPath);
    }

    async unlikeVideo(index) {
        const videoPath = this.videos[index];
        
        if (!videoPath) return;

        // Find existing like entry
        let likeEntry = this.likes.videos.find(video => video.path === videoPath);
        
        if (!likeEntry || likeEntry.likeCount === 0) return;

        // Reset like count to 0
        likeEntry.likeCount = 0;

        // Update UI for current video element
        if (this.currentVideoElement && this.currentVideoElement.index === index) {
            const videoItem = this.currentVideoElement.videoItem;
            videoItem.classList.remove('liked');
            this.updateVideoLikeDisplay(videoItem, 0);
        }

        // Save to file
        await this.saveLikes();
        
        // Update liked videos button visibility
        this.updateLikedVideosButton();
        
        console.log(`Video unliked:`, videoPath);
    }

    showHeartAnimation(x, y) {
        const heart = document.createElement('div');
        heart.className = 'like-heart';
        heart.innerHTML = '❤️';
        
        // If coordinates are 0,0 (keyboard trigger), center the heart
        if (x === 0 && y === 0) {
            heart.style.left = '50%';
            heart.style.top = '50%';
            heart.style.transform = 'translate(-50%, -50%)';
        } else {
            heart.style.left = `${x - 32}px`;
            heart.style.top = `${y - 32}px`;
        }

        document.getElementById('like-animations').appendChild(heart);

        // Remove after animation
        setTimeout(() => {
            heart.remove();
        }, 800);
    }

    showLoading(show) {
        document.getElementById('loading').classList.toggle('hidden', !show);
    }

    showEmptyState(show) {
        document.getElementById('empty-state').classList.toggle('hidden', !show);
    }

    updateUI() {
        this.updateFolderInfo();
        this.updateNavigationButtons();
    }

    showExitConfirmation() {
        const confirmed = confirm('Are you sure you want to exit PikPok?');
        if (confirmed) {
            // Send message to main process to close the app
            ipcRenderer.invoke('exit-app');
        }
    }

    toggleFullScreen() {
        if (this.currentVideoElement && this.currentVideoElement.video) {
            const video = this.currentVideoElement.video;
            
            if (!document.fullscreenElement) {
                // Enter full screen
                if (video.requestFullscreen) {
                    video.requestFullscreen();
                } else if (video.webkitRequestFullscreen) {
                    video.webkitRequestFullscreen();
                } else if (video.msRequestFullscreen) {
                    video.msRequestFullscreen();
                }
                console.log('Entering full screen mode');
            } else {
                // Exit full screen
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
                console.log('Exiting full screen mode');
            }
        }
    }

    toggleVideoSpeed() {
        if (this.currentVideoElement && this.currentVideoElement.video) {
            const video = this.currentVideoElement.video;
            
            // Toggle between 1x and 2x speed
            if (video.playbackRate === 1) {
                video.playbackRate = 2;
                console.log('Video speed set to 2x');
            } else {
                video.playbackRate = 1;
                console.log('Video speed set to 1x');
            }
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TikTokMP4Player();
}); 