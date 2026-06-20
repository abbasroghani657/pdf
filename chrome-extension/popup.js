// popup.js

document.addEventListener('DOMContentLoaded', () => {
  const offlineOverlay = document.getElementById('offlineOverlay');
  const proBadge = document.getElementById('proBadge');

  // Check storage for Pro token
  chrome.storage.local.get(['isPro', 'offlineToken'], (result) => {
    const isPro = result.isPro === true;

    if (isPro) {
      proBadge.style.display = 'inline-block';
    }

    // Smart Trick Logic: Free users must be online
    function checkConnectivity() {
      if (!navigator.onLine && !isPro) {
        offlineOverlay.classList.add('active');
      } else {
        offlineOverlay.classList.remove('active');
      }
    }

    // Initial check
    checkConnectivity();

    // Listen for connection changes
    window.addEventListener('online', checkConnectivity);
    window.addEventListener('offline', checkConnectivity);
  });
});
