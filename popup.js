document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('cinemaMode');
    
    // Load saved state
    chrome.storage.local.get(['cinemaModeEnabled'], function(result) {
        toggle.checked = result.cinemaModeEnabled || false;
    });
    
    // Save state when changed
    toggle.addEventListener('change', function() {
        chrome.storage.local.set({ cinemaModeEnabled: toggle.checked });
        
        // Send message to content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0].url.includes('netflix.com')) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleCinemaMode',
                    enabled: toggle.checked
                });
            }
        });
    });
});
