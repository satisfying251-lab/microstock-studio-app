const CACHE='microstock-v320-shell-1';
const ASSETS=['./','./index.html','./manifest.webmanifest','./app.js?v=3.2.0'];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(ASSETS);
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('microstock-')&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(url.origin!==location.origin||event.request.method!=='GET')return;
 event.respondWith((async()=>{
  const cached=await caches.match(event.request);
  if(cached)return cached;
  const response=await fetch(event.request);
  if(response.ok){const cache=await caches.open(CACHE);cache.put(event.request,response.clone());}
  return response;
 })());
});
