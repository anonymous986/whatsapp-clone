const CACHE_NAME = 'whatsapp-clone-v1'
const STATIC_CACHE = 'static-cache-v1'
const API_CACHE = 'api-cache-v1'

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached')
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
              console.log('Service Worker: Clearing old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle API requests
  if (url.origin === 'https://api.supabase.io') {
    event.respondWith(
      caches.open(API_CACHE)
        .then((cache) => {
          return cache.match(request)
            .then((cachedResponse) => {
              // Return cached version if available
              if (cachedResponse) {
                // Fetch fresh data in background
                fetch(request)
                  .then((networkResponse) => {
                    // Cache the fresh response
                    if (networkResponse.ok) {
                      cache.put(request, networkResponse.clone())
                    }
                  })
                  .catch(() => {
                    // Network failed, continue with cached version
                  })

                return cachedResponse
              }

              // No cached version, fetch from network
              return fetch(request)
                .then((networkResponse) => {
                  // Cache the response
                  if (networkResponse.ok) {
                    cache.put(request, networkResponse.clone())
                  }
                  return networkResponse
                })
                .catch(() => {
                  // Network failed completely
                  return new Response(
                    JSON.stringify({ error: 'Network request failed' }),
                    {
                      status: 503,
                      statusText: 'Service Unavailable',
                      headers: { 'Content-Type': 'application/json' }
                    }
                  )
                })
            })
        })
    )
    return
  }

  // Handle static assets requests
  if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // Not in cache, fetch from network
          return fetch(request)
            .then((networkResponse) => {
              // Cache the response
              if (networkResponse.ok) {
                const responseClone = networkResponse.clone()
                caches.open(STATIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone)
                  })
              }
              return networkResponse
            })
        })
    )
    return
  }

  // For other requests, try network first, then cache
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache successful responses
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseClone)
            })
        }
        return networkResponse
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }

            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/')
            }

            // Return generic error response
            return new Response(
              JSON.stringify({ error: 'Offline - No cached version available' }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            )
          })
      })
  )
})

// Background sync for offline messages
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)

  if (event.tag === 'background-sync-messages') {
    event.waitUntil(
      // Handle offline message sync
      self.registration.showNotification('WhatsApp Clone', {
        body: 'Your pending messages have been synced',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'message-sync'
      })
    )
  }
})

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')

  const options = {
    body: event.data ? event.data.text() : 'You have a new message',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open Chat',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-96x96.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('WhatsApp Clone', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received')

  event.notification.close()

  if (event.action === 'explore') {
    // Open the app to the relevant chat
    event.waitUntil(
      clients.openWindow('/')
    )
  } else if (event.action === 'close') {
    // Just close the notification
    event.notification.close()
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Message handling from client
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(STATIC_CACHE)
        .then((cache) => {
          return cache.addAll(event.data.urls)
        })
    )
  }
})