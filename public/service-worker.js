// Uncomment the lines below

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

const FILES_TO_CACHE = [
  '/',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/index.html',
  '/index.js',
  '/manifest.webmanifest',
  '/style.css',
  '/budgetDB.js'
];

// install
self.addEventListener("install", function (evt) {
    // pre cache what data?
    // evt.waitUntil(
    //   caches.open(DATA_CACHE_NAME).then((cache) => cache.add("/api/budget"))
    //   );
      
    // pre cache all static assets
    evt.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        console.log("You're files were pre-cached successfully!");
        cache.addAll(FILES_TO_CACHE)
      })
    );
  
    // tell the browser to activate this service worker immediately once it
    // has finished installing
    self.skipWaiting();
  });


  
  self.addEventListener("activate", function(evt) {
    evt.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("Removing old cache data", key);
              return caches.delete(key);
            }
          })
        );
      })
    );
  
    self.clients.claim();
  });
  

  // fetch
  self.addEventListener("fetch", function(evt) {
    // cache successful requests to the API
    if (evt.request.url.includes("/api/")) {
        console.log('[Service Worker] Fetch (data)', evt.request.url);
      evt.respondWith(
        caches.open(DATA_CACHE_NAME).then(cache => {
          return fetch(evt.request)
            .then(response => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }
  
              return response;
            })
            .catch(err => {
              // Network request failed, try to get it from the cache.
              return cache.match(evt.request);
            });
        }).catch(err => console.log(err))
      );
  
      return;
    };

    evt.respondWith(
      caches.open(CACHE_NAME).then(cache => {
          return cache.match(evt.request).then(response => {
          return response || fetch(evt.request);
        
      });
      })
    );

  });
