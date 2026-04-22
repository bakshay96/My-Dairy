// Register service worker for PWA functionality
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Check if app is running in standalone mode (installed PWA)
export const isStandalone = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
};

// Prompt user to install PWA
let deferredPrompt;

export const setupInstallPrompt = (onPromptReady) => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (onPromptReady) {
      onPromptReady(e);
    }
  });
};

export const promptInstall = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    deferredPrompt = null;
  }
};

// Check online/offline status
export const getOnlineStatus = () => {
  return navigator.onLine;
};

export const setupOnlineStatusListener = (onStatusChange) => {
  window.addEventListener('online', () => {
    if (onStatusChange) onStatusChange(true);
  });
  
  window.addEventListener('offline', () => {
    if (onStatusChange) onStatusChange(false);
  });
};

// Save data to localStorage for offline mode
export const saveOfflineData = (key, data) => {
  try {
    localStorage.setItem(`mydairy_${key}`, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving offline data:', error);
  }
};

// Retrieve data from localStorage
export const getOfflineData = (key) => {
  try {
    const data = localStorage.getItem(`mydairy_${key}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving offline data:', error);
    return null;
  }
};

// Clear offline data
export const clearOfflineData = (key) => {
  localStorage.removeItem(`mydairy_${key}`);
};
