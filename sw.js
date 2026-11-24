// Wellness AI service worker: works offline after first successful load.
const CACHE = 'wellness-ai-v3';
const CORE = ['./','index.html','css/style.css','assets/illustrations/camera-standby.svg','assets/illustrations/ergonomic-hero.svg','assets/illustrations/tree-specimen.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).catch(()=>{})).then(()=>self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e => {
    const req = e.request;
    if(req.method !== 'GET' || req.headers.has('range')) return;           // let video range requests go to network
    e.respondWith(caches.open(CACHE).then(async cache => {
        const hit = await cache.match(req);
        const net = fetch(req).then(res => { if(res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;                                                   // cache-first, refresh in background
    }));
});
