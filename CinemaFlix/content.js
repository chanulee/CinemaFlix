(() => {
  let cinemaModeEnabled = false;

  function toggleCinemaMode(shouldEnable) {
    if (cinemaModeEnabled === shouldEnable) return;
    cinemaModeEnabled = shouldEnable;
    console.log("Cinema mode =>", cinemaModeEnabled);

    // **IMPORTANT**: Update storage so the popup sees the new state too
    chrome.storage.local.set({ cinemaModeEnabled });

    if (cinemaModeEnabled) {
      // Turn on: play video, go fullscreen, hide UI...
      const playerEl = document.querySelector('.watch-video') || document.querySelector('.NFPlayer') || document.querySelector('video') || document.body;
      if (playerEl) playerEl.click();

      const video = document.querySelector('video');
      if (video) {
        try {
          video.muted = true;
          const playPromise = video.play();
          if (playPromise) {
            playPromise.catch(err => {
              console.log("video.play() blocked:", err);
              dispatchKey(' ', 'Space', 32);
            });
          }
          video.muted = false;
        } catch (err) {
          console.log("video.play() error:", err);
          dispatchKey(' ', 'Space', 32);
        }
      }

      // Fullscreen
      const fsContainer = document.querySelector('.watch-video');
      if (fsContainer) {
        try {
          if (fsContainer.requestFullscreen) fsContainer.requestFullscreen();
          else if (fsContainer.webkitRequestFullscreen) fsContainer.webkitRequestFullscreen();
          else if (fsContainer.mozRequestFullScreen) fsContainer.mozRequestFullScreen();
          else if (fsContainer.msRequestFullscreen) fsContainer.msRequestFullscreen();
        } catch {}
      }

      // Hide controls
      applyCinemaMode(true);

    } else {
      // Turn off
      exitFullscreen();
      applyCinemaMode(false);
    }
  }

  function dispatchKey(key, code, keyCode) {
    const evt = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key,
      code,
      keyCode,
      which: keyCode
    });
    document.dispatchEvent(evt);
  }

  function applyCinemaMode(enable) {
    if (enable) {
      document.body.classList.add('cinema-mode');
      ['click','mousedown','mouseup','mousemove','dblclick'].forEach(e => {
        document.addEventListener(e, blockAllExceptToggle, true);
      });
      ['keydown','keyup','keypress'].forEach(e => {
        document.addEventListener(e, blockAllExceptToggle, true);
      });
    } else {
      document.body.classList.remove('cinema-mode');
      ['click','mousedown','mouseup','mousemove','dblclick','keydown','keyup','keypress'].forEach(e => {
        document.removeEventListener(e, blockAllExceptToggle, true);
      });
    }
  }

  function blockAllExceptToggle(e) {
    if (!cinemaModeEnabled) return;
    if (e.type === 'keydown' && e.key.toLowerCase() === 'c') return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  function exitFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(()=>{});
    } else if (document.webkitFullscreenElement) {
      document.webkitExitFullscreen();
    } else if (document.mozFullScreenElement) {
      document.mozCancelFullScreen();
    } else if (document.msFullscreenElement) {
      document.msExitFullscreen();
    }
  }

  function handleFullscreenChange() {
    if (cinemaModeEnabled &&
        !document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.mozFullScreenElement &&
        !document.msFullscreenElement
    ) {
      cinemaModeEnabled = false;
      chrome.storage.local.set({ cinemaModeEnabled: false });
      applyCinemaMode(false);
    }
  }
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);

  // Press 'C' => toggle in code
  document.addEventListener('keydown', (evt) => {
    if (evt.key.toLowerCase() === 'c' && !evt.ctrlKey && !evt.altKey && !evt.metaKey) {
      evt.preventDefault();
      toggleCinemaMode(!cinemaModeEnabled);
    }
  });

  // Listen for messages from popup => same function
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleCinemaMode') {
      toggleCinemaMode(request.enabled);
      sendResponse({ success: true, cinemaModeEnabled });
    }
  });

  // Minimal styling
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
    /* Hide Netflix UI... */
    .cinema-mode .watch-video--player-control-container,
    .cinema-mode .skip-intro,
    .cinema-mode .skip-credits,
    .cinema-mode .PlayerControlsNeo__layout,
    .cinema-mode .PlayerControlsNeo__all-controls,
    .cinema-mode .top-left-controls,
    .cinema-mode .top-right-controls,
    .cinema-mode .browse-header,
    .cinema-mode .pinning-header,
    .cinema-mode .watch-video--flag-container,
    .cinema-mode .watch-video--back-container,
    .cinema-mode .nf-loading-spinner,
    .cinema-mode .error-message,
    .cinema-mode .watch-video--skip-content,
    .cinema-mode [data-uia*="controls"],
    .cinema-mode [data-uia*="skip"],
    .cinema-mode [data-uia*="pause-"],
    .cinema-mode [data-uia*="play-"],
    .cinema-mode [data-uia*="rewind"],
    .cinema-mode [data-uia*="forward"],
    .cinema-mode [data-uia*="episodes-"] {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
    .cinema-mode .scrubber-container {
      opacity: 0.3 !important;
    }
    .cinema-mode .scrubber-container:hover {
      opacity: 0.6 !important;
    }
  `;
  document.head.appendChild(style);
})();