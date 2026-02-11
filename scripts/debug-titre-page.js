// 🔍 SCRIPT DE DEBUG COMPLET - Diagnostic titre page "(50) Gestion Gîtes"
// Copier-coller dans la console du navigateur pour diagnostiquer le problème

console.log('\n=====================================');
console.log('🔍 DEBUG TITRE DE PAGE');
console.log('=====================================\n');

// 1. État actuel
console.log('📌 ÉTAT ACTUEL:');
console.log('  Titre actuel:', document.title);
console.log('  LocalStorage notif_lastCheck:', localStorage.getItem('notif_lastCheck'));
console.log('');

// 2. Scripts chargés
console.log('📦 SCRIPTS CHARGÉS:');
const scripts = Array.from(document.querySelectorAll('script[src]'));
const notifScripts = scripts.filter(s => s.src.includes('notification'));
console.log(`  Total scripts: ${scripts.length}`);
console.log(`  Scripts notifications:`, notifScripts.map(s => s.src));
console.log('');

// 3. NotificationSystem
console.log('🔔 SYSTÈME DE NOTIFICATIONS:');
console.log('  window.notificationSystem existe?', !!window.notificationSystem);
if (window.notificationSystem) {
    console.log('  NotificationSystem actif:', window.notificationSystem);
    console.log('  Notifications en mémoire:', window.notificationSystem.notifications?.length || 0);
}
console.log('');

// 4. Badge
console.log('🎯 BADGE NOTIFICATIONS:');
const badge = document.getElementById('notificationBadge');
if (badge) {
    console.log('  Badge existe: OUI');
    console.log('  Badge display:', badge.style.display);
    console.log('  Badge textContent:', badge.textContent);
    console.log('  Badge visible?', badge.offsetWidth > 0);
} else {
    console.log('  Badge existe: NON');
}
console.log('');

// 5. Bouton
console.log('🔘 BOUTON NOTIFICATIONS:');
const btn = document.getElementById('notificationBtn');
if (btn) {
    console.log('  Bouton existe: OUI');
    console.log('  Bouton display:', btn.style.display);
    console.log('  Bouton visible?', btn.offsetWidth > 0);
} else {
    console.log('  Bouton existe: NON');
}
console.log('');

// 6. Historique des modifications du titre
console.log('📝 PROTECTION DU TITRE:');
console.log('  Le titre est protégé contre les modifications non autorisées');
console.log('  Toute tentative sera loguée dans la console avec une stack trace');
console.log('');

// 7. Actions recommandées
console.log('🔧 ACTIONS POSSIBLES:');
console.log('  1. Pour nettoyer le localStorage:');
console.log('     localStorage.removeItem("notif_lastCheck");');
console.log('');
console.log('  2. Pour forcer le titre:');
console.log('     document.title = "Gestion Gîtes";');
console.log('');
console.log('  3. Pour désactiver NotificationSystem:');
console.log('     if (window.notificationSystem) window.notificationSystem.stop();');
console.log('');
console.log('  4. Pour masquer le badge:');
console.log('     const badge = document.getElementById("notificationBadge");');
console.log('     if (badge) badge.style.display = "none";');
console.log('');

console.log('=====================================');
console.log('✅ FIN DU DIAGNOSTIC');
console.log('=====================================\n');

// Retourner un objet avec toutes les infos
window.debugTitre = {
    titre: document.title,
    localStorage: localStorage.getItem('notif_lastCheck'),
    notificationSystem: !!window.notificationSystem,
    badge: !!badge,
    badgeVisible: badge ? badge.offsetWidth > 0 : false,
    scriptsNotif: notifScripts.length
};

console.log('📊 Résumé stocké dans window.debugTitre:', window.debugTitre);
