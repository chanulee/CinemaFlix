document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggleBtn');
  
    // On load, set the UI state from storage
    chrome.storage.local.get(['cinemaModeEnabled'], (res) => {
      const wasEnabled = !!res.cinemaModeEnabled;
      setPopupUI(wasEnabled);
    });
  
    toggleBtn.addEventListener('click', () => {
      // Flip the active class
      toggleBtn.classList.toggle('active');
      document.body.classList.toggle('active-mode');
  
      // isActive is whether we are turning cinema mode on or off
      const isActive = toggleBtn.classList.contains('active');
      setPopupUI(isActive);
  
      // Save to storage
      chrome.storage.local.set({ cinemaModeEnabled: isActive });
  
      // Send a message to the Netflix tab so content.js can do the same actions
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0] || !tabs[0].url.includes('netflix.com')) {
          console.log("Not a Netflix tab.");
          return;
        }
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleCinemaMode',
          enabled: isActive
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log("Error sending message:", chrome.runtime.lastError.message);
          } else {
            console.log("toggleCinemaMode message sent; response:", response);
          }
        });
      });
    });
  
    // A helper function to update popup button UI text based on mode
    function setPopupUI(isActive) {
      if (isActive) {
        toggleBtn.classList.add('active');
        document.body.classList.add('active-mode');
        toggleBtn.innerHTML = 'the <u>e</u>nd';
  
        document.getElementById('infoText').textContent = 'Now Netflix also became the place where';
        document.getElementById('secondText').textContent = 'the audience can\'t press the stop button.';
        document.getElementById('thirdText').textContent = 'CinemaFlix.';
      } else {
        toggleBtn.classList.remove('active');
        document.body.classList.remove('active-mode');
        toggleBtn.innerHTML = '<u>C</u>inema mode';
  
        document.getElementById('infoText').textContent = 'Movie theatres are the only place where';
        document.getElementById('secondText').textContent = 'the audience can\'t press the stop button.';
        document.getElementById('thirdText').textContent = 'Bong Joon-Ho.';
      }
    }
  });