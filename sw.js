/* Wisal — service worker (optional, enables full offline use)
   Drop this file next to your HTML on Netlify and the app works with no connection.
   Strategy: network-first for the page (so you always get the latest when online),
   cache-first for fonts, and a cached fallback when offline. */

var CACHE = 'wisal-v44';
var SHELL = ['./', './index.html'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(SHELL.map(function(u){
        return c.add(u).catch(function(){ /* ignore if a shell URL 404s */ });
      }));
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k !== CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
      for (var i = 0; i < list.length; i++){
        var c = list[i];
        if ('focus' in c){
          c.focus();
          if (c.navigate) { try { c.navigate(url); } catch(err){} }
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);

  // Page navigations: network-first, fall back to cached shell when offline.
  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); c.put('./', copy.clone()); });
        return res;
      }).catch(function(){
        return caches.match(req).then(function(m){ return m || caches.match('./') || caches.match('./index.html'); });
      })
    );
    return;
  }

  // Google Fonts (and other GETs): cache-first, then network, then cache the result.
  e.respondWith(
    caches.match(req).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(res){
        if(res && res.status === 200 && (url.origin === location.origin || url.hostname.indexOf('gstatic') >= 0 || url.hostname.indexOf('googleapis') >= 0 || url.hostname.indexOf('jsdelivr') >= 0)){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){ return hit; });
    })
  );
});
