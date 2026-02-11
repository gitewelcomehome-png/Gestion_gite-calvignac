// Script de debug à exécuter dans la console pour nettoyer les notifications
// Copier-coller dans la console du navigateur sur la page app.html

// 1. Vider le localStorage des notifications
console.log('🧹 Nettoyage des notifications locales...');
localStorage.removeItem('notif_lastCheck');
console.log('✅ localStorage nettoyé');

// 2. Forcer le reset du titre de la page
document.title = 'Gestion Gîtes';
console.log('✅ Titre de la page réinitialisé');

// 3. Masquer le badge de notifications
const badge = document.getElementById('notificationBadge');
if (badge) {
    badge.style.display = 'none';
    badge.textContent = '0';
    console.log('✅ Badge masqué');
}

// 4. Arrêter le système de notifications
if (window.notificationSystem) {
    window.notificationSystem.stop();
    console.log('✅ Système de notifications arrêté');
}

console.log('🎉 Nettoyage terminé ! Rechargez la page.');
