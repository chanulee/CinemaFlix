(() => {
  let cinemaModeEnabled = false;

  /**
   * Toggles cinema mode ON or OFF.
   * - If turning on, we try to autoplay, then request fullscreen, then hide UI.
   * - If turning off, we exit fullscreen and restore UI.
   */
  function toggleCinemaMode(shouldEnable) {
    // If no state change, do nothing
    if (cinemaModeEnabled === shouldEnable) return;
    cinemaModeEnabled = shouldEnable;
    console.log("Cinema mode =>", cinemaModeEnabled);

    if (cinemaModeEnabled) {
      // ---- TURN ON ----

      // 1) Click Netflix player for focus so .play() or space key might work
      const playerEl =
        document.querySelector('.watch-video') ||
        document.querySelector('.NFPlayer') ||
        document.querySelector('video') ||
        document.body;
      if (playerEl) {
        playerEl.click();
      }

      // 2) Attempt immediate playback with .play(), fallback to space key
      const video = document.querySelector('video');
      if (video) {
        try {
          video.muted = true; // Muted playback usually isn't blocked
          const playPromise = video.play();
          if (playPromise instanceof Promise) {
            playPromise.catch(err => {
              console.log("video.play() blocked:", err);
              dispatchKey(' ', 'Space', 32);
            });
          }
          // Unmute after calling play
          video.muted = false;
        } catch (err) {
          console.log("Error trying video.play():", err);
          dispatchKey(' ', 'Space', 32);
        }
      }

      // 3) Request fullscreen on .watch-video if it exists
      const fsContainer = document.querySelector('.watch-video');
      if (fsContainer) {
        try {
          if (fsContainer.requestFullscreen) {
            fsContainer.requestFullscreen();
          } else if (fsContainer.webkitRequestFullscreen) {
            fsContainer.webkitRequestFullscreen();
          } else if (fsContainer.mozRequestFullScreen) {
            fsContainer.mozRequestFullScreen();
          } else if (fsContainer.msRequestFullscreen) {
            fsContainer.msRequestFullscreen();
          }
        } catch (fsErr) {
          console.log("Fullscreen request error:", fsErr);
        }
      }

      // 4) Apply the “cinema mode” overlay (hide controls, block events)
      applyCinemaMode(true);

    } else {
      // ---- TURN OFF ----

      // Exit fullscreen, restore Netflix UI
      exitFullscreen();
      applyCinemaMode(false);
    }
  }

  /**
   * A minimal function to dispatch a synthetic keydown, e.g. space or 'f'.
   */
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

  /**
   * Blocks all events except letting user press 'C' to toggle off.
   */
  function blockAllControls(e) {
    if (!cinemaModeEnabled) return;
    if (e.type === 'keydown' && e.key.toLowerCase() === 'c') return; // Let 'C' pass
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  /**
   * Applies or removes the "cinema mode" styling & event-blocking.
   */
  function applyCinemaMode(enable) {
    if (enable) {
      document.body.classList.add('cinema-mode');
      // Block mouse events
      ['click','mousedown','mouseup','mousemove','dblclick'].forEach(evt => {
        document.addEventListener(evt, blockAllControls, true);
      });
      // Block keyboard events
      ['keydown','keyup','keypress'].forEach(evt => {
        document.addEventListener(evt, blockAllControls, true);
      });

    } else {
      document.body.classList.remove('cinema-mode');
      // Unblock everything
      ['click','mousedown','mouseup','mousemove','dblclick','keydown','keyup','keypress'].forEach(evt => {
        document.removeEventListener(evt, blockAllControls, true);
      });
    }
  }

  /**
   * If user physically exits fullscreen (Esc, Netflix controls, etc.), disable cinema mode as well.
   */
  function handleFullscreenChange() {
    if (
      cinemaModeEnabled &&
      !document.fullscreenElement &&
      !document.webkitFullscreenElement &&
      !document.mozFullScreenElement &&
      !document.msFullscreenElement
    ) {
      cinemaModeEnabled = false;
      applyCinemaMode(false);
    }
  }
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);

  /**
   * If user presses 'C' while on Netflix, toggle on/off in the same code path
   */
  document.addEventListener('keydown', (evt) => {
    if (evt.key.toLowerCase() === 'c' && !evt.ctrlKey && !evt.altKey && !evt.metaKey) {
      evt.preventDefault();
      toggleCinemaMode(!cinemaModeEnabled);
    }
  });

  /**
   * Listen for messages from popup.js => call the same toggle function
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleCinemaMode') {
      toggleCinemaMode(request.enabled);
      sendResponse({ success: true, cinemaModeEnabled });
    }
  });

  /**
   * Helper: exit fullscreen if we are in it
   */
  function exitFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.log("exitFullscreen error:", err));
    } else if (document.webkitFullscreenElement) {
      document.webkitExitFullscreen();
    } else if (document.mozFullScreenElement) {
      document.mozCancelFullScreen();
    } else if (document.msFullscreenElement) {
      document.msExitFullscreen();
    }
  }

  // Inject minimal CSS
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
    .cinema-mode .nf-loading-spinner,
    .cinema-mode .error-message,
    .cinema-mode .watch-video--skip-content,
    .cinema-mode .watch-video--flag-container,
    .cinema-mode .watch-video--back-container,
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