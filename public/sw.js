self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.endsWith('.mp4') || event.request.destination === 'video') {
    event.respondWith(
      caches.open('video-cache-v1').then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        
        if (cachedResponse) {
          const rangeHeader = event.request.headers.get('range');
          if (rangeHeader) {
            const buffer = await cachedResponse.arrayBuffer();
            const bytes = rangeHeader.match(/bytes=(\d+)-(.*)/);
            if (bytes) {
              const start = Number(bytes[1]);
              const end = bytes[2] ? Number(bytes[2]) : buffer.byteLength - 1;
              const chunk = buffer.slice(start, end + 1);
              return new Response(chunk, {
                status: 206,
                statusText: 'Partial Content',
                headers: new Headers({
                  'Content-Range': `bytes ${start}-${end}/${buffer.byteLength}`,
                  'Content-Length': chunk.byteLength.toString(),
                  'Content-Type': cachedResponse.headers.get('Content-Type') || 'video/mp4',
                  'Accept-Ranges': 'bytes'
                })
              });
            }
          }
          return cachedResponse;
        }

        const networkResponse = await fetch(event.request);
        if (networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      })
    );
  }
});

