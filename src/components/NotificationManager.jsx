import { useState, useEffect } from 'react';

const NotificationManager = () => {
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    // Check initial notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      // Show prompt if permission is default and user hasn't been asked recently
      const lastPrompt = localStorage.getItem('notificationPromptShown');
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      
      if (Notification.permission === 'default' && (!lastPrompt || parseInt(lastPrompt) < oneDayAgo)) {
        setTimeout(() => setShowNotificationPrompt(true), 3000); // Show after 3 seconds
      }
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          // Schedule daily notifications
          scheduleDailyNotification();
          setShowNotificationPrompt(false);
        }
        
        // Remember that we showed the prompt
        localStorage.setItem('notificationPromptShown', Date.now().toString());
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  const scheduleDailyNotification = () => {
    // Register for background sync if available
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        return registration.sync.register('daily-word-notification');
      }).catch(error => {
        console.log('Background sync registration failed:', error);
      });
    }
    
    // Fallback: Show immediate test notification
    if (Notification.permission === 'granted') {
      new Notification('Wordora Notifications Enabled! 🎉', {
        body: 'You\'ll receive daily word notifications at 9 AM',
        icon: '/icon-192.png',
        badge: '/icon-192.png'
      });
    }
  };

  const dismissPrompt = () => {
    setShowNotificationPrompt(false);
    localStorage.setItem('notificationPromptShown', Date.now().toString());
  };

  if (!('Notification' in window)) {
    return null; // Browser doesn't support notifications
  }

  return (
    <>
      {/* NYT-style Notification Banner */}
      {showNotificationPrompt && notificationPermission === 'default' && (
        <div className="fixed top-0 left-0 right-0 bg-black text-white p-4 z-50 animate-slide-up">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">Stay Informed</div>
              <div className="text-xs text-gray-300">
                Subscribe to daily vocabulary notifications and never miss a word.
              </div>
            </div>
            <div className="flex space-x-3 ml-4">
              <button
                onClick={requestNotificationPermission}
                className="px-4 py-2 bg-white text-black text-xs font-medium hover:bg-gray-100 transition-colors"
              >
                Subscribe
              </button>
              <button
                onClick={dismissPrompt}
                className="px-4 py-2 border border-gray-400 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Minimal Status Indicator */}
      {notificationPermission === 'granted' && (
        <div className="fixed top-4 right-4 bg-black text-white px-3 py-1 text-xs font-medium animate-fade-in">
          Subscribed ✓
        </div>
      )}
    </>
  );
};

export default NotificationManager;