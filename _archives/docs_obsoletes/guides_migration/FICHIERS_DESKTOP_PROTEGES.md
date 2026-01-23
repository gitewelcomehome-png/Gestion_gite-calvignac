# 🚨 Fichiers Desktop Protégés - NE PAS MODIFIER

> **IMPORTANT** : Ces fichiers sont EN PRODUCTION et doivent rester STABLES pendant le développement mobile

## ⛔ Fichiers Desktop à NE PAS TOUCHER

### Fichiers HTML Desktop
- ✅ **index.html** - Page principale DESKTOP (avec garde-fou)
- ❌ **tabs/*.html** - Tous les onglets desktop

### Fichiers JavaScript Desktop
- ✅ **js/shared-utils.js** - Utilitaires partagés (avec garde-fou, contient switchTab)
- ✅ **js/dashboard.js** - Dashboard desktop (avec garde-fou)
- ❌ **js/reservations.js** - Réservations desktop
- ❌ **js/statistiques.js** - Statistiques
- ❌ **js/menage.js** - Gestion ménage
- ❌ **js/decouvrir.js** - Module découvrir
- ❌ **js/fiche-client.js** - Fiches clients
- ❌ **js/fiscalite-v2.js** - Fiscalité

### Fichiers CSS Desktop
- ❌ **css/main-inline.css** - Styles principaux desktop
- ❌ **css/flat-outline.css** - Thème desktop

## ✅ Fichiers Mobile (PEUVENT être modifiés)

### Fichiers HTML Mobile
- ✅ **tabs/mobile/reservations.html** - Réservations mobile (JS inline)
- ✅ **tabs/mobile/dashboard.html** - Dashboard mobile (à créer si besoin)

### Fichiers CSS Mobile
- ✅ **css/mobile/*.css** - Tous les styles mobiles

## 📋 Règles Strictes

### ❌ INTERDIT
- Modifier index.html sans demande explicite
- Modifier shared-utils.js (contient switchTab CRITICAL)
- Modifier dashboard.js desktop
- Toucher aux onglets desktop

### ✅ AUTORISÉ
- Créer de NOUVEAUX fichiers dans tabs/mobile/
- Modifier les fichiers existants dans tabs/mobile/
- Créer des styles dans css/mobile/
- Dupliquer du code desktop vers mobile (copie uniquement)

## 🔧 Méthodologie Mobile

1. **TOUJOURS** créer des fichiers séparés dans `tabs/mobile/`
2. **DUPLIQUER** le code desktop si besoin (ne pas partager)
3. **JavaScript INLINE** dans les fichiers HTML mobiles
4. **NE JAMAIS** toucher aux fichiers desktop sans accord explicite

## 🚀 Retrait des Garde-Fous

Les garde-fous seront retirés **UNIQUEMENT** quand le développement mobile sera terminé et validé.

---

**Dernière mise à jour** : 21 janvier 2026  
**Raison** : Éviter de casser les onglets desktop pendant le développement mobile
