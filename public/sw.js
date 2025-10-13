/**
 * Service Worker for Intelligent Caching
 * 
 * Implements adaptive caching strategies based on:
 * - Route analysis and usage patterns
 * - Resource type and importance
 * - Performance requirements
 * - Cache invalidation strategies
 */

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `matbakh-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `matbakh-dynamic-${CACHE_VERSION}`;
const API_CACHE = `matbakh-api-${CACHE_VERSION}`;

// Default cache strategies
let cacheStrategies = [
  {
    name: 'static-assets',
    pattern: /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ico)$/,
    maxAge: 31536000, // 1 year
    staleWhileRevalidate: false,
    priority: 1,
    cacheName: STATIC_CACHE
  },
  {
    name: 'api-responses',
    pattern: /\/api\//,
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: true,
    priority: 2,
    cacheName: API_CACHE
  },
  {
    name: 'html-pages',
    pattern: /\.html$|\/$/,
    maxAge: 3600, // 1 hour
    staleWhileRevalidate: true,
    priority: 3,
    cacheName: DYNAMIC_CACHE
  },
  {
    name: 'dynamic-content',
    pattern: /\/vc\/|\/dashboard/,
    maxAge: 60, // 1 minute
    staleWhileRevalidate: true,
    priority: 4,
    cacheName: DYNAMIC_CACHE
  }
];

// Cache performance metrics
let cacheMetrics = {
  hits: 0,
  misses: 0,
  errors: 0,
  lastReset: Date.now()
};

/**
 * Service Worker Installation
 */
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Pre-cache critical static assets
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll([
          '/',
          '/manifest.json',
          '/favicon.ico'
        ]);
      }),
      
      // Initialize other caches
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE)
    ]).then(() => {
      console.log('Service Worker installed successfully');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName.includes('matbakh-') && 
                !cacheName.includes(CACHE_VERSION)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activated successfully');
    })
  );
});

/**
 * Fetch Event Handler - Main caching logic
 */
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Find matching cache strategy
  const strategy = findCacheStrategy(request.url);
  
  if (strategy) {
    event.respondWith(handleCachedRequest(request, strategy));
  } else {
    // Fallback to network-first for unmatched requests
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

/**
 * Message Handler - For dynamic cache strategy updates
 */
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'UPDATE_CACHE_STRATEGIES':
      cacheStrategies = data.strategies || cacheStrategies;
      console.log('Cache strategies updated:', cacheStrategies.length);
      break;
      
    case 'ADD_CACHE_STRATEGY':
      if (data.strategy) {
        cacheStrategies.push({
          ...data.strategy,
          cacheName: DYNAMIC_CACHE
        });
        console.log('Cache strategy added:', data.strategy.name);
      }
      break;
      
    case 'GET_CACHE_METRICS':
      event.ports[0].postMessage(cacheMetrics);
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'INVALIDATE_CACHE':
      if (data.pattern) {
        invalidateCacheByPattern(data.pattern).then(() => {
          event.ports[0].postMessage({ success: true });
        });
      }
      break;
  }
});

/**
 * Find matching cache strategy for a URL
 */
function findCacheStrategy(url) {
  return cacheStrategies
    .sort((a, b) => a.priority - b.priority)
    .find(strategy => strategy.pattern.test(url));
}

/**
 * Handle cached request based on strategy
 */
async function handleCachedRequest(request, strategy) {
  const cacheName = strategy.cacheName || DYNAMIC_CACHE;
  
  try {
    if (strategy.staleWhileRevalidate) {
      return await staleWhileRevalidate(request, cacheName, strategy);
    } else {
      return await cacheFirst(request, cacheName, strategy);
    }
  } catch (error) {
    console.error('Cache handling error:', error);
    cacheMetrics.errors++;
    return fetch(request);
  }
}

/**
 * Cache-first strategy
 */
async function cacheFirst(request, cacheName, strategy) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if cache is still valid
    const cacheTime = parseInt(cachedResponse.headers.get('sw-cache-time') || '0');
    const now = Date.now();
    
    if (now - cacheTime < strategy.maxAge * 1000) {
      cacheMetrics.hits++;
      
      // Add cache hit header (create new Response with modified headers)
      const base = cachedResponse.clone();
      const headers = new Headers(base.headers);
      headers.set('x-cache', 'HIT');
      headers.set('x-cache-strategy', strategy.name);
      
      return new Response(base.body, { 
        status: base.status, 
        statusText: base.statusText, 
        headers 
      });
    }
  }
  
  // Cache miss or expired - fetch from network
  cacheMetrics.misses++;
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    await cacheResponse(cache, request, networkResponse.clone(), strategy);
  }
  
  return networkResponse;
}

/**
 * Stale-while-revalidate strategy
 */
async function staleWhileRevalidate(request, cacheName, strategy) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch from network in background
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cacheResponse(cache, request, response.clone(), strategy);
    }
    return response;
  }).catch(error => {
    console.warn('Network fetch failed:', error);
    return null;
  });
  
  if (cachedResponse) {
    cacheMetrics.hits++;
    
    // Return cached response immediately (create new Response with modified headers)
    const base = cachedResponse.clone();
    const headers = new Headers(base.headers);
    headers.set('x-cache', 'HIT');
    headers.set('x-cache-strategy', strategy.name);
    
    // Update cache in background
    networkPromise.catch(() => {}); // Ignore network errors
    
    return new Response(base.body, { 
      status: base.status, 
      statusText: base.statusText, 
      headers 
    });
  }
  
  // No cached response - wait for network
  cacheMetrics.misses++;
  const networkResponse = await networkPromise;
  
  if (networkResponse) {
    return networkResponse;
  }
  
  // Network failed and no cache - return error
  return new Response('Network error and no cached version available', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

/**
 * Network-first strategy (fallback)
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cacheResponse(cache, request, networkResponse.clone(), {
        maxAge: 3600, // 1 hour default
        name: 'network-first-fallback'
      });
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed - try cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      cacheMetrics.hits++;
      
      const base = cachedResponse.clone();
      const headers = new Headers(base.headers);
      headers.set('x-cache', 'HIT');
      headers.set('x-cache-strategy', 'network-first-fallback');
      
      return new Response(base.body, { 
        status: base.status, 
        statusText: base.statusText, 
        headers 
      });
    }
    
    cacheMetrics.misses++;
    throw error;
  }
}

/**
 * Cache a response with metadata
 */
async function cacheResponse(cache, request, response, strategy) {
  try {
    // Clone response and add cache metadata
    const responseToCache = response.clone();
    
    // Add cache timestamp
    const headers = new Headers(responseToCache.headers);
    headers.set('sw-cache-time', Date.now().toString());
    headers.set('sw-cache-strategy', strategy.name);
    headers.set('sw-cache-max-age', strategy.maxAge.toString());
    
    const cachedResponse = new Response(responseToCache.body, {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers: headers
    });
    
    await cache.put(request, cachedResponse);
  } catch (error) {
    console.error('Failed to cache response:', error);
  }
}

/**
 * Clear all caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  
  await Promise.all(
    cacheNames.map(cacheName => {
      if (cacheName.includes('matbakh-')) {
        return caches.delete(cacheName);
      }
    })
  );
  
  // Reset metrics
  cacheMetrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    lastReset: Date.now()
  };
  
  console.log('All caches cleared');
}

/**
 * Invalidate cache entries matching a pattern
 */
async function invalidateCacheByPattern(pattern) {
  const cacheNames = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  
  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      const deletePromises = requests
        .filter(request => pattern.test(request.url))
        .map(request => cache.delete(request));
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error(`Failed to invalidate cache ${cacheName}:`, error);
    }
  }
  
  console.log('Cache invalidated for pattern:', pattern);
}

/**
 * Periodic cache cleanup
 */
if (typeof self !== 'undefined' && !self.__JEST__) {
  setInterval(async () => {
    try {
      const cacheNames = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const cacheTime = parseInt(response.headers.get('sw-cache-time') || '0');
            const maxAge = parseInt(response.headers.get('sw-cache-max-age') || '3600');
            const now = Date.now();
            
            // Delete expired entries
            if (now - cacheTime > maxAge * 1000) {
              await cache.delete(request);
            }
          }
        }
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }, 300000); // Run every 5 minutes
}

console.log('Service Worker loaded with intelligent caching strategies');