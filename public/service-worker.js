const CACHE_NAME = 'clipit-v1';
const DOCUMENT_CACHE_NAME = 'clipit-documents-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DOCUMENT_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle PDF caching and serve assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip unsupported URL schemes (chrome-extension, moz-extension, etc.)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }
  
  // Handle document files (PDFs, text files, etc.)
  const isDocument = event.request.url.match(/\.(pdf|txt|md|html|htm|json|xml|csv)(\?|$)/i) || 
                     event.request.headers.get('accept')?.includes('application/pdf') ||
                     event.request.headers.get('accept')?.includes('text/');
  
  if (isDocument) {
    event.respondWith(
      caches.open(DOCUMENT_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('Serving document from cache:', event.request.url);
            return cachedResponse;
          }
          
          // Fetch and cache document
          return fetch(event.request).then((response) => {
            if (response.ok) {
              console.log('Caching document:', event.request.url);
              // Only cache if it's a valid URL scheme
              const requestUrl = new URL(event.request.url);
              if (requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:') {
                cache.put(event.request, response.clone());
              }
            }
            return response;
          }).catch((error) => {
            console.warn('Failed to fetch document:', event.request.url, error);
            // Return a network fetch as fallback
            return fetch(event.request);
          });
        });
      })
    );
    return;
  }
  
  // Handle other requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch((error) => {
        console.warn('Service worker fetch failed:', event.request.url, error);
        // If offline and requesting HTML, return cached index.html
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
        // For other requests, just let them fail gracefully
        return new Response('Network error', { status: 408 });
      })
  );
});

// Background sync for offline document loading
self.addEventListener('sync', (event) => {
  if (event.tag === 'document-sync') {
    event.waitUntil(syncDocuments());
  }
});

// Sync documents for offline access
async function syncDocuments() {
  try {
    const cache = await caches.open(DOCUMENT_CACHE_NAME);
    const requests = await cache.keys();
    console.log(`Synced ${requests.length} documents for offline access`);
  } catch (error) {
    console.error('Failed to sync documents:', error);
  }
}

// Handle notification clicks (for future reading reminders)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Message handling for manual document caching
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_DOCUMENT') {
    event.waitUntil(
      caches.open(DOCUMENT_CACHE_NAME).then((cache) => {
        return cache.add(event.data.url);
      })
    );
  }
});