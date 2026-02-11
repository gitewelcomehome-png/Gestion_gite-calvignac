# 🎉 Système de Prix Promotionnels - Calendrier Mobile

## 📋 Vue d'ensemble

L'application mobile supporte maintenant l'affichage des prix promotionnels avec indication visuelle claire.

## 🎨 Affichage Visuel

**Prix normal :**
- Affiché en bleu (#007AFF)
- Taille 10pt

**Prix en promo :**
- Prix original barré en gris (#8E8E93)
- Nouveau prix en rouge (#FF3B30), taille 11pt, gras
- Badge 🎉 pour indiquer la promotion

## 💾 Structure des Données

### Format dans `gites.tarifs_calendrier`

Le champ `tarifs_calendrier` est un objet JSON acceptant **deux formats** :

**1. Prix simple (format existant, compatible):**
```json
{
  "2026-02-16": 210,
  "2026-02-17": 210
}
```

**2. Prix avec promo (nouveau format):**
```json
{
  "2026-02-16": {
    "prix": 170,
    "promo": true,
    "prixOriginal": 210
  },
  "2026-02-17": {
    "prix": 170,
    "promo": true,
    "prixOriginal": 210
  }
}
```

### Propriétés de l'objet promo

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `prix` | number | ✅ Oui | Prix actuel (en promotion) |
| `promo` | boolean | ⚠️ Optionnel | `true` = affiche badge promo |
| `prixOriginal` | number | ⚠️ Optionnel | Prix avant promo (affiché barré) |

## 🔄 Import depuis les Plateformes

### Airbnb, Booking, Abritel

Ces plateformes fournissent parfois les prix promotionnels via leurs APIs ou flux iCal. Voici comment les importer :

#### Option 1 : Modification du script d'import iCal

Dans `/js/calendrier-tarifs.js`, modifier la fonction d'import pour détecter les prix promo :

```javascript
// Exemple d'import avec détection de promo
async function importPrixFromIcal(icalUrl, giteId) {
  // ... parsing iCal ...
  
  const tarifData = {};
  events.forEach(event => {
    const dateStr = formatDate(event.start);
    const prix = extractPrice(event);
    const prixOriginal = extractOriginalPrice(event); // Si disponible
    
    if (prixOriginal && prixOriginal > prix) {
      // Prix en promo
      tarifData[dateStr] = {
        prix: prix,
        promo: true,
        prixOriginal: prixOriginal
      };
    } else {
      // Prix normal
      tarifData[dateStr] = prix;
    }
  });
  
  // Sauvegarder dans la base
  await supabase
    .from('gites')
    .update({ tarifs_calendrier: tarifData })
    .eq('id', giteId);
}
```

#### Option 2 : Import manuel via SQL

Utiliser le script fourni `/sql/add_promo_example.sql` pour ajouter manuellement des promotions.

#### Option 3 : Interface Web

Modifier la page de gestion des tarifs (`/pages/tarifs.html`) pour permettre la saisie de prix promo :

```javascript
// Ajouter un checkbox "En promotion ?"
// Si coché, afficher un champ "Prix original"
const tarifObj = enPromo ? {
  prix: prixActuel,
  promo: true,
  prixOriginal: prixAvantPromo
} : prixActuel;
```

## 📱 Utilisation dans l'Application Mobile

L'application récupère automatiquement les tarifs depuis `gites.tarifs_calendrier` et :

1. **Détecte le format** (number ou objet)
2. **Affiche le prix** :
   - Si objet avec `promo: true` → Affichage promo (rouge + badge)
   - Si objet sans `promo` → Affichage normal
   - Si number → Affichage normal
3. **Gère la multi-sélection** pour simulations et modifications

## ✏️ Modification des Prix

Quand l'utilisateur modifie manuellement un prix via l'app :
- Le prix est enregistré comme **nombre simple** (pas de promo)
- Cela écrase les infos de promo si elles existaient

**⚠️ Important :** Les modifications manuelles ne créent PAS de promotions automatiquement.

## 🔧 Migration des Données Existantes

Les données existantes (format nombre simple) restent **100% compatibles**. Aucune migration n'est nécessaire.

Pour ajouter des infos de promo sur des tarifs existants :

```sql
-- Transformer un prix simple en prix promo
UPDATE gites
SET tarifs_calendrier = jsonb_set(
  tarifs_calendrier,
  '{2026-02-16}',
  '{"prix": 170, "promo": true, "prixOriginal": 210}'::jsonb
)
WHERE id = 'xxx-gite-id-xxx';
```

## 🎯 Prochaines Étapes Recommandées

1. **Automatiser l'import** : Modifier le script d'import iCal pour détecter automatiquement les prix promo depuis les plateformes

2. **Interface Web** : Ajouter l'interface de gestion des promos sur la page web de tarification

3. **Promotions automatiques** : Implémenter les règles de promo automatiques (Last Minute, Early Booking) déjà présentes dans le code web

4. **Synchronisation** : Mettre en place une synchronisation régulière des prix depuis les plateformes (cron job)

## 📞 Support

Pour toute question sur le système de prix promotionnels, consulter :
- Ce document
- `/sql/add_promo_example.sql` pour exemples SQL
- `/ios_apple_app/app/(tabs)/calendar.tsx` pour le code mobile
- `/js/calendrier-tarifs.js` pour le code web

---

**Dernière mise à jour :** 9 février 2026  
**Version :** 1.0
