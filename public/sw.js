// public/sw.js
self.addEventListener('install', (event) => {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
  });
  
  // Handle push notifications
  self.addEventListener('push', (event) => {
    if (event.data) {
      const { title, feedTitle, newItemsCount } = event.data.json();
      const options = {
        body: `${feedTitle} has ${newItemsCount} new articles`,
        icon: '/favicon.ico',
        vibrate: [200, 100, 200]
      };
  
      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    }
  });
  
  // When someone clicks the notification
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
      clients.openWindow('/')
    );
  });