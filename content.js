// content.js
let cinemaModeEnabled = false;

function enterFullscreen() {
    const videoContainer = document.querySelector('.watch-video');
    if (videoContainer && videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen().catch(err => {
            console.log('Error attempting to enable fullscreen:', err);
        });
    } else if (videoContainer && videoContainer.webkitRequestFullscreen) { // Safari
        videoContainer.webkitRequestFullscreen();
    } else if (videoContainer && videoContainer.mozRequestFullScreen) { // Firefox
        videoContainer.mozRequestFullScreen();
    } else if (videoContainer && videoContainer.msRequestFullscreen) { // IE/Edge
        videoContainer.msRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
            console.log('Error attempting to exit fullscreen:', err);
        });
    } else if (document.webkitExitFullscreen) { // Safari
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) { // Firefox
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) { // IE/Edge
        document.msExitFullscreen();
    }
}

function toggleCinemaMode() {
    cinemaModeEnabled = !cinemaModeEnabled;
    // Save state
    chrome.storage.local.set({ cinemaModeEnabled: cinemaModeEnabled });
    
    if (cinemaModeEnabled) {
        enterFullscreen();
    } else {
        exitFullscreen();
    }
    
    applyCinemaMode();
    
    // Show notification
    showNotification(cinemaModeEnabled ? 'Cinema Mode Enabled' : 'Cinema Mode Disabled');
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 9999;
        font-family: Netflix Sans, Arial, sans-serif;
        font-size: 16px;
        transition: opacity 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove notification after 2 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

function blockAllVideoControls(e) {
    if (cinemaModeEnabled) {
        // Don't block the 'c' key for toggling
        if (e.type === 'keydown' && e.key.toLowerCase() === 'c') {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    }
}

function applyCinemaMode() {
    if (cinemaModeEnabled) {
        // Add cinema mode class
        document.body.classList.add('cinema-mode');
        
        // Ensure we're in fullscreen
        if (!document.fullscreenElement && 
            !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && 
            !document.msFullscreenElement) {
            enterFullscreen();
        }
        
        // Block ALL mouse events at the document level
        ['click', 'mousedown', 'mouseup', 'mousemove', 'dblclick'].forEach(eventType => {
            document.addEventListener(eventType, blockAllVideoControls, true);
        });

        // Block keyboard controls
        ['keydown', 'keyup', 'keypress'].forEach(eventType => {
            document.addEventListener(eventType, blockAllVideoControls, true);
        });

        // Specifically target ALL timeline/scrubber related elements
        const timelineElements = document.querySelectorAll(`
            .scrubber-container,
            .timeline-preview,
            .progress-control,
            .time-remaining,
            .time-progress,
            .scrubber-head,
            [data-uia*="timeline"],
            [data-uia*="progress"],
            .progress-bar,
            .playback-position,
            .trickplay
        `);

        timelineElements.forEach(element => {
            if (element) {
                element.style.pointerEvents = 'none';
                element.style.userSelect = 'none';
                ['click', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseenter', 'mouseleave'].forEach(eventType => {
                    element.addEventListener(eventType, blockAllVideoControls, true);
                });
                // Prevent dragging
                element.setAttribute('draggable', 'false');
            }
        });

        // Find and disable all clickable elements
        const clickableElements = document.querySelectorAll('button, a, input, [role="button"], .click-tracking, .PlayerControlsNeo__button-control-row, .watch-video--player-view');
        clickableElements.forEach(element => {
            if (element) {
                element.style.pointerEvents = 'none';
                ['click', 'mousedown', 'mouseup'].forEach(eventType => {
                    element.addEventListener(eventType, blockAllVideoControls, true);
                });
            }
        });

        // Specifically target the video element
        const videoElement = document.querySelector('video');
        if (videoElement) {
            videoElement.style.pointerEvents = 'none';
            videoElement.style.cursor = 'none';
            ['click', 'mousedown', 'mouseup', 'dblclick'].forEach(eventType => {
                videoElement.addEventListener(eventType, blockAllVideoControls, true);
            });
        }

        // Hide all controls
        const controls = document.querySelectorAll('.PlayerControlsNeo__button-control-row button, .PlayerControlsNeo__button-control-row [role="button"]');
        controls.forEach(control => {
            control.style.opacity = '0';
            control.style.pointerEvents = 'none';
        });

    } else {
        // Remove cinema mode
        document.body.classList.remove('cinema-mode');
        
        // Exit fullscreen if we're in it
        if (document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.mozFullScreenElement || 
            document.msFullscreenElement) {
            exitFullscreen();
        }
        
        // Remove all event listeners
        ['click', 'mousedown', 'mouseup', 'mousemove', 'dblclick', 'keydown', 'keyup', 'keypress'].forEach(eventType => {
            document.removeEventListener(eventType, blockAllVideoControls, true);
        });

        // Re-enable timeline elements
        const timelineElements = document.querySelectorAll(`
            .scrubber-container,
            .timeline-preview,
            .progress-control,
            .time-remaining,
            .time-progress,
            .scrubber-head,
            [data-uia*="timeline"],
            [data-uia*="progress"],
            .progress-bar,
            .playback-position,
            .trickplay
        `);

        timelineElements.forEach(element => {
            if (element) {
                element.style.pointerEvents = 'auto';
                element.style.userSelect = 'auto';
                ['click', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseenter', 'mouseleave'].forEach(eventType => {
                    element.removeEventListener(eventType, blockAllVideoControls, true);
                });
                element.removeAttribute('draggable');
            }
        });

        // Re-enable all clickable elements
        const clickableElements = document.querySelectorAll('button, a, input, [role="button"], .click-tracking, .PlayerControlsNeo__button-control-row, .watch-video--player-view');
        clickableElements.forEach(element => {
            if (element) {
                element.style.pointerEvents = 'auto';
                ['click', 'mousedown', 'mouseup'].forEach(eventType => {
                    element.removeEventListener(eventType, blockAllVideoControls, true);
                });
            }
        });

        // Re-enable video element
        const videoElement = document.querySelector('video');
        if (videoElement) {
            videoElement.style.pointerEvents = 'auto';
            videoElement.style.cursor = 'auto';
            ['click', 'mousedown', 'mouseup', 'dblclick'].forEach(eventType => {
                videoElement.removeEventListener(eventType, blockAllVideoControls, true);
            });
        }

        // Show all controls
        const controls = document.querySelectorAll('.PlayerControlsNeo__button-control-row button, .PlayerControlsNeo__button-control-row [role="button"]');
        controls.forEach(control => {
            control.style.opacity = '1';
            control.style.pointerEvents = 'auto';
        });
    }
}

// Handle fullscreen changes
function handleFullscreenChange() {
    if (cinemaModeEnabled && 
        !document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && 
        !document.msFullscreenElement) {
        // If we exit fullscreen while cinema mode is on, turn off cinema mode
        toggleCinemaMode();
    }
}

// Add keyboard shortcut listener
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        toggleCinemaMode();
    }
}, false);

// Add fullscreen change listeners
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

// Observer setup for dynamic content
const observer = new MutationObserver(() => {
    if (cinemaModeEnabled) {
        applyCinemaMode();
    }
});

// Start observing when video player loads
function startObserver() {
    const videoPlayer = document.querySelector('.watch-video');
    if (videoPlayer) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        applyCinemaMode();
    }
}

// Message listener for popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleCinemaMode') {
        cinemaModeEnabled = request.enabled;
        applyCinemaMode();
    }
});

// Initial state check
chrome.storage.local.get(['cinemaModeEnabled'], (result) => {
    cinemaModeEnabled = result.cinemaModeEnabled || false;
    if (cinemaModeEnabled) {
        startObserver();
    }
});

// Check for video player periodically
const checkInterval = setInterval(() => {
    if (document.querySelector('.watch-video')) {
        startObserver();
        clearInterval(checkInterval);
    }
}, 1000);

// Add styles
const style = document.createElement('style');
style.textContent = `
    .cinema-mode {
        cursor: none !important;
    }
    
    .cinema-mode * {
        cursor: none !important;
        user-select: none !important;
    }
    
    .cinema-mode video {
        pointer-events: none !important;
    }
    
    /* Hide all Netflix UI elements */
    .cinema-mode .watch-video--player-view:not(.player-cinema-mode) .watch-video--bottom-controls-container,
    .cinema-mode .watch-video--player-view:not(.player-cinema-mode) .watch-video--player-control-container,
    .cinema-mode .watch-video--player-view:not(.player-cinema-mode) .playback-control,
    .cinema-mode .watch-video--player-view:not(.player-cinema-mode) .secondary-controls,
    .cinema-mode .watch-video--player-view:not(.player-cinema-mode) .audio-subtitle-controller,
    .cinema-mode .evidence-overlay,
    .cinema-mode .PlayerControlsNeo__layout,
    .cinema-mode .PlayerControlsNeo__all-controls,
    .cinema-mode .button-nfplayerPlay,
    .cinema-mode .button-nfplayerPause,
    .cinema-mode .skip-credits,
    .cinema-mode .skip-intro,
    .cinema-mode .watch-video--skip-content,
    .cinema-mode .AkiraPlayer > div > div:not(:first-child),
    .cinema-mode .watch-video--player-view div[data-uia*="controls"],
    .cinema-mode .watch-video--player-view div[data-uia*="next-episode"],
    .cinema-mode .watch-video--player-view div[data-uia*="skip"],
    .cinema-mode .watch-video--player-view div[data-uia*="pause-"],
    .cinema-mode .watch-video--player-view div[data-uia*="play-"],
    .cinema-mode .watch-video--player-view div[data-uia*="rewind"],
    .cinema-mode .watch-video--player-view div[data-uia*="forward"],
    .cinema-mode .watch-video--player-view div[data-uia*="next-"],
    .cinema-mode .watch-video--player-view div[data-uia*="prev-"],
    .cinema-mode .watch-video--player-view div[data-uia*="audio-subtitle"],
    .cinema-mode .watch-video--player-view div[data-uia*="episodes-"],
    .cinema-mode .top-left-controls,
    .cinema-mode .top-right-controls,
    .cinema-mode .VideoContainer > div:not(:first-child) {
        opacity: 0 !important;
        pointer-events: none !important;
        visibility: hidden !important;
    }

    /* Keep only timeline visible but non-interactive */
    .cinema-mode .scrubber-container {
        opacity: 0.3 !important;
        pointer-events: none !important;
        cursor: none !important;
        visibility: visible !important;
    }

    .cinema-mode .scrubber-container:hover {
        opacity: 0.6 !important;
    }

    /* Hide top navigation bar */
    .cinema-mode .mainView > div:first-child,
    .cinema-mode .pinning-header,
    .cinema-mode .browse-header {
        display: none !important;
    }

    /* Hide profile icon and menu */
    .cinema-mode .account-menu-item,
    .cinema-mode .account-dropdown-button,
    .cinema-mode .account-menu {
        display: none !important;
    }

    /* Hide "Next Episode" overlay */
    .cinema-mode .watch-video--player-view div[data-uia="next-episode-seamless-button"],
    .cinema-mode .watch-video--player-view div[data-uia="next-episode-seamless-button-container"],
    .cinema-mode .watch-video--player-view div[data-uia="next-episode-recommendations"] {
        display: none !important;
    }

    /* Hide any tooltips or overlays */
    .cinema-mode .tp-tooltip,
    .cinema-mode .evidence-overlay,
    .cinema-mode .watch-video--default-overlay {
        display: none !important;
    }

    /* Hide "Skip Intro" and "Skip Credits" buttons */
    .cinema-mode .watch-video--skip-content,
    .cinema-mode button[data-uia="player-skip-intro"],
    .cinema-mode button[data-uia="player-skip-credits"] {
        display: none !important;
    }

    /* Hide any popup dialogs or modals */
    .cinema-mode .watch-video--player-view .popup-content,
    .cinema-mode .watch-video--player-view .popup-panel {
        display: none !important;
    }

    /* Hide network status indicator */
    .cinema-mode .nf-loading-spinner,
    .cinema-mode .error-message {
        display: none !important;
    }

    /* Hide subtitles menu but keep actual subtitles visible */
    .cinema-mode .track-list-container,
    .cinema-mode .audio-subtitle-controller {
        display: none !important;
    }

    /* Keep video player visible */
    .cinema-mode .VideoContainer > div:first-child,
    .cinema-mode video {
        visibility: visible !important;
    }
`;
document.head.appendChild(style);