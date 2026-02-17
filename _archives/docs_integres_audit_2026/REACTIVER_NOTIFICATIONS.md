# 🔔 Comment Réactiver le Système de Notifications

## État Actuel
Les notifications sont **désactivées** pour éviter le bug du (50) dans le titre.

## Pour Réactiver (quand vous serez prêt)

### 1. Dans app.html (ligne ~116) - Décommenter le script

**Décommentez :**
```html
<!-- 🔔 Notification System - DÉSACTIVÉ TEMPORAIREMENT -->
<script src="js/notification-system.js?v=2.1"></script>
```

### 2. Dans app.html (ligne ~4340) - Décommenter l'initialisation

**Décommentez ce bloc :**
```javascript
const waitForSupabase = setInterval(() => {
    if (window.supabaseClient) {
        clearInterval(waitForSupabase);
        
        // Initialiser le système de notifications
        window.notificationSystem = new NotificationSystem();
        window.notificationSystem.start();
    }
}, 100);

// Timeout après 5 secondes
setTimeout(() => clearInterval(waitForSupabase), 5000);
```

### 2. Supprimez le bloc de nettoyage localStorage (ligne ~4355)

**Supprimez :**
```javascript
// ⚠️ NETTOYAGE : Supprimer le localStorage corrompu
if (localStorage.getItem('notif_lastCheck')) {
    localStorage.removeItem('notif_lastCheck');
    document.title = 'Gestion Gîtes';
}

const badge = document.getElementById('notificationBadge');
if (badge) badge.style.display = 'none';
```

### 3. Vérifiez que la table existe dans Supabase

Exécutez le script : `sql/create-notifications-table.sql`

## Ce que vous aurez ensuite

✅ Badge rouge avec compteur de notifications  
✅ Titre de page "(X) Gestion Gîtes" quand nouvelles notifications  
✅ Panel cliquable pour voir les détails  
✅ Notifications pour :
   - Nouvelles demandes d'horaires
   - Nouvelles réservations
   - (Tâches de ménage - désactivé car table supprimée)

## Système de Notifications

- **Vérification :** Toutes les 30 secondes
- **Compteur :** Badge rouge sur le bouton 🔔
- **Titre :** `(X) Gestion Gîtes` si X notifications non lues
- **Panel :** Clic sur le bouton pour voir les détails
- **Marquer comme lu :** Fermer le panel

Tout est déjà codé et prêt à fonctionner.
