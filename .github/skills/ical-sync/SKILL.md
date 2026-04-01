---
name: ical-sync
description: 'Synchronisation iCal pour Gestion Gîte Calvignac. Utiliser pour : implémenter ou modifier l'import iCal, déboguer une synchronisation qui échoue, gérer les conflits de réservations, ajouter une nouvelle plateforme (Airbnb, Booking, Abritel, Homelidays), corriger des chevauchements de dates. Règles strictes de gestion des conflits et proxy CORS.'
argument-hint: 'Décris le problème ou la plateforme concernée (ex: import Airbnb qui échoue, conflit de dates Booking, ajouter Homelidays)'
---

# iCal Sync — Gestion Gîte Calvignac

> Fichier principal : `js/sync-ical-v2.js`  
> Proxy CORS interne : `/api/cors-proxy.js`

---

## Règles Métier Fondamentales

Ces règles ne sont **jamais négociables** :

1. **Un gîte = une seule réservation active à la fois** — pas de chevauchement
2. **Deux réservations ne peuvent pas démarrer le même jour** sur le même gîte
3. **En cas de conflit de dates lors d'un import** : conserver la réservation la plus courte
4. **Toujours vérifier les chevauchements** avant d'insérer une réservation importée

---

## Architecture de la Synchronisation

```
Plateformes (Airbnb, Booking, Abritel...)
    ↓  URL iCal
/api/cors-proxy  (proxy interne Vercel)
    ↓  contenu .ics brut
js/sync-ical-v2.js  (parsing + déduplication)
    ↓  réservations validées
Supabase → table reservations
```

---

## Gestion du Proxy CORS

**Règle absolue : toujours passer par `/api/cors-proxy` pour les URLs externes.**

```js
// ✅ Via proxy interne
const proxyUrl = `/api/cors-proxy?url=${encodeURIComponent(icalUrl)}`;
const response = await fetch(proxyUrl);

// ❌ Appel direct (bloqué par CORS en navigateur)
const response = await fetch(icalUrl);
```

**Particularités par plateforme :**

| Plateforme | Particularité | Traitement |
|------------|---------------|------------|
| Airbnb | URL stable, HTTPS | Proxy interne suffit |
| Booking.com | URL avec token, HTTPS | Proxy interne suffit |
| Abritel / VRBO | URL longue avec paramètres | Normaliser en HTTPS avant proxy |
| Homelidays | Retourne souvent 403 | Pas de fallback `corsproxy.io` — signaler l'erreur à l'utilisateur |

**Ne jamais utiliser `corsproxy.io` ou tout proxy tiers externe** — risque de fuite de données et instabilité.

---

## Parsing iCal

Structure d'un événement `.ics` :
```
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260401
DTEND;VALUE=DATE:20260408
SUMMARY:Airbnb (Réservé)
UID:airbnb_12345@airbnb.com
END:VEVENT
```

Points de vigilance :
- `DTEND` en iCal est **exclusif** (le dernier jour est le jour de départ, pas d'occupation)
- Les dates peuvent être en format `DATE` (YYYYMMDD) ou `DATE-TIME` (YYYYMMDDTHHmmssZ)
- Normaliser toujours en UTC avant de stocker en base
- Ignorer les événements `SUMMARY` contenant "Available" ou "Disponible" (marqueurs de disponibilité, pas des réservations)

---

## Détection et Résolution des Conflits

```js
// Vérifier chevauchement avec les réservations existantes
function hasOverlap(existing, newRes) {
  return newRes.date_debut < existing.date_fin &&
         newRes.date_fin > existing.date_debut;
}

// En cas de conflit : garder la plus courte
function resolveConflict(res1, res2) {
  const duration1 = new Date(res1.date_fin) - new Date(res1.date_debut);
  const duration2 = new Date(res2.date_fin) - new Date(res2.date_debut);
  return duration1 <= duration2 ? res1 : res2;
}
```

---

## Workflow d'Import

1. **Récupérer le contenu iCal** via proxy interne
2. **Parser les VEVENT** — extraire `DTSTART`, `DTEND`, `SUMMARY`, `UID`
3. **Normaliser les dates** en UTC / format ISO
4. **Filtrer les non-réservations** (Available, Disponible, etc.)
5. **Dédupliquer** par `UID` (éviter les doublons si import rejoué)
6. **Vérifier les chevauchements** avec les réservations existantes en base
7. **Résoudre les conflits** (garder la plus courte)
8. **Insérer en base** les nouvelles réservations uniquement
9. **Logger le résultat** : X insérées, Y ignorées (doublons), Z conflits résolus

---

## Déboguer un Import en Échec

| Symptôme | Vérification |
|----------|--------------|
| Erreur CORS | URL passée au proxy ? `encodeURIComponent` appliqué ? |
| 403 sur Homelidays | Normal — informer l'utilisateur, pas de contournement |
| 404 sur l'URL iCal | L'URL a changé sur la plateforme — demander à l'utilisateur de la régénérer |
| `DTSTART` non parsé | Format non standard — ajouter un cas dans le parser |
| Réservations en double | `UID` non utilisé pour la déduplication — vérifier la logique d'import |
| Date de fin incorrecte | `DTEND` iCal est exclusif — vérifier la normalisation |

---

## Ajouter une Nouvelle Plateforme

1. Vérifier le format de l'URL iCal fournie par la plateforme
2. Normaliser l'URL en HTTPS
3. Tester le proxy : `GET /api/cors-proxy?url=[URL_ENCODEE]`
4. Vérifier que le contenu `.ics` retourné est valide
5. Identifier les particularités de format (DTSTART, SUMMARY, encodage)
6. Ajouter la plateforme au tableau de configuration dans `js/ical-config-modern.js`
7. Documenter la particularité dans ce skill si elle est non standard
