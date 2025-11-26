// Service Worker for Push Notifications
// Version: 2.1.0 - API URL fix for production
const SW_VERSION = '2.1.0';
console.log('Service Worker version:', SW_VERSION);

// API URL - será substituído durante o build
const API_URL = '__API_URL__';

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const payload = event.data.json();

  // Debug log
  console.log('=== Push Notification Received ===');
  console.log('Full payload:', JSON.stringify(payload, null, 2));

  // Extract URL - try all possible locations
  let actionUrl = '/';
  if (payload.url) {
    actionUrl = payload.url;
    console.log('URL found at payload.url:', actionUrl);
  } else if (payload.action_url) {
    actionUrl = payload.action_url;
    console.log('URL found at payload.action_url:', actionUrl);
  } else if (payload.data && payload.data.url) {
    actionUrl = payload.data.url;
    console.log('URL found at payload.data.url:', actionUrl);
  } else {
    console.warn('No URL found, using default:', actionUrl);
  }

  // Extract notification ID
  const notificationId = payload.notification_id || payload.notificationId || payload.data?.notification_id;

  // Extract customer ID
  const customerId = payload.customer_id || payload.data?.customer_id;

  console.log('Final action URL:', actionUrl);
  console.log('Notification ID:', notificationId);
  console.log('Customer ID:', customerId);

  const options = {
    body: payload.body || payload.message,
    icon: payload.icon || '/logo.png',
    badge: payload.badge || '/badge.png',
    image: payload.image,
    data: {
      url: actionUrl,
      notificationId: notificationId,
      customer_id: customerId
    },
    actions: payload.actions || [],
    requireInteraction: payload.requireInteraction || false,
    tag: payload.tag || 'default',
    renotify: payload.renotify || false
  };

  // Track notification delivered/viewed
  if (notificationId) {
    const deliveryData = customerId ? { customer_id: customerId } : {};
    const apiUrl = API_URL !== '__API_URL__' ? API_URL : 'http://localhost:3000/api';
    const trackingUrl = `${apiUrl}/public/notifications/${notificationId}/delivered`;

    console.log('Tracking delivery to:', trackingUrl);

    fetch(trackingUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deliveryData)
    }).catch(err => console.error('Error tracking delivery:', err));

    console.log('Delivery tracked with customer_id:', customerId);
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Nova Notificação', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  let urlToOpen = event.notification.data?.url || '/';
  const notificationId = event.notification.data?.notificationId;
  const customerId = event.notification.data?.customerId || event.notification.data?.customer_id;

  console.log('=== Notification Clicked ===');
  console.log('Notification data:', event.notification.data);
  console.log('Notification ID:', notificationId);
  console.log('Customer ID:', customerId);
  console.log('URL to open:', urlToOpen);

  // Ensure absolute URL
  if (urlToOpen && !urlToOpen.startsWith('http://') && !urlToOpen.startsWith('https://')) {
    // If it's a relative path, prepend the origin
    if (urlToOpen.startsWith('/')) {
      urlToOpen = self.location.origin + urlToOpen;
    } else {
      urlToOpen = self.location.origin + '/' + urlToOpen;
    }
    console.log('Converted to absolute URL:', urlToOpen);
  }

  // Track click first (before opening window)
  const apiUrl = API_URL !== '__API_URL__' ? API_URL : 'http://localhost:3000/api';
  const trackingUrl = `${apiUrl}/public/notifications/${notificationId}/clicked`;

  console.log('Tracking click to:', trackingUrl);

  const trackingPromise = notificationId
    ? fetch(trackingUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId })
      })
      .then(response => {
        console.log('Click tracked successfully. Response status:', response.status);
        return response.json();
      })
      .then(data => console.log('Click tracking response:', data))
      .catch(err => console.error('Error tracking click:', err))
    : Promise.resolve();

  // Then handle window opening
  const windowPromise = clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then((windowClients) => {
      console.log('Looking for existing windows. Found:', windowClients.length);

      // Check if there's already a window open with this URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        console.log('Checking window:', client.url);
        if (client.url === urlToOpen && 'focus' in client) {
          console.log('Focusing existing window');
          return client.focus();
        }
      }

      // If no window is open, open a new one
      if (clients.openWindow) {
        console.log('Opening new window with URL:', urlToOpen);
        return clients.openWindow(urlToOpen);
      }
    });

  // Wait for both to complete
  event.waitUntil(Promise.all([trackingPromise, windowPromise]));
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('Service Worker installing, version:', SW_VERSION);
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating, version:', SW_VERSION);
  event.waitUntil(
    clients.claim().then(() => {
      console.log('Service Worker activated and claimed clients');
    })
  );
});
