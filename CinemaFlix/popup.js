document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleBtn');

  // On load, read from storage and set UI
  chrome.storage.local.get(['cinemaModeEnabled'], (res) => {
    const active = !!res.cinemaModeEnabled;
    setPopupUI(active);
  });

  // When the user clicks the popup button
  toggleBtn.addEventListener('click', () => {
    toggleBtn.classList.toggle('active');
    document.body.classList.toggle('active-mode');

    const isActive = toggleBtn.classList.contains('active');
    setPopupUI(isActive);

    // Save to storage
    chrome.storage.local.set({ cinemaModeEnabled: isActive });

    // Send a message to content.js, so it toggles visually
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url.includes('netflix.com')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleCinemaMode',
          enabled: isActive
        });
      }
    });
  });

  // Helper function to update the popup text based on isActive
  function setPopupUI(isActive) {
    if (isActive) {
      toggleBtn.classList.add('active');
      document.body.classList.add('active-mode');
      toggleBtn.innerHTML = 'the end';
      document.getElementById('infoText').textContent = 'Now Netflix also became the place where';
      document.getElementById('secondText').textContent = 'the audience can\'t press the stop button.';
      document.getElementById('thirdText').textContent = 'CinemaFlix.';
    } else {
      toggleBtn.classList.remove('active');
      document.body.classList.remove('active-mode');
      toggleBtn.innerHTML = 'enter';
      document.getElementById('infoText').textContent = 'Movie theatres are the only place where';
      document.getElementById('secondText').textContent = 'the audience can\'t press the stop button.';
      document.getElementById('thirdText').textContent = 'Bong Joon-Ho.';
    }
  }
});