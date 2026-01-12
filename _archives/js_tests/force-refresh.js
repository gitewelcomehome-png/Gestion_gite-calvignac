// Force le rechargement sans cache
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister());
    });
}
if ('caches' in window) {
    caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
    });
}
setTimeout(() => {
    window.location.href = window.location.href + '?nocache=' + Date.now();
}, 100);
