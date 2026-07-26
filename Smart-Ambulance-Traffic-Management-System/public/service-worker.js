self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  self.registration.unregister()
    .then(function() {
      return self.clients.matchAll();
    })
    .then(function(clients) {
      clients.forEach(client => client.navigate(client.url))
    });
});

self.addEventListener('fetch', function(event) {
  // Do not cache anything, fetch from network
  event.respondWith(fetch(event.request));
});
