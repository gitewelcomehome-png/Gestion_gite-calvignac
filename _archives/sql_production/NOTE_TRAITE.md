# NOTE IMPORTANTE : Colonne TRAITE

## Statut actuel

La table `problemes_signales` n'a **PAS** de colonne `traite` (BOOLEAN).

Elle possède à la place :
- `traite_le` (TIMESTAMPTZ) - Date/heure de traitement
- `statut` (TEXT) - Statut du problème ('nouveau', 'en_cours', 'resolu', 'cloture')

## Code JavaScript actuel

Le code dans `dashboard.js` a été **corrigé** pour ne PAS filtrer sur `traite`.

**Requête actuelle** (lignes 1517-1521) :
```javascript
const { data: problemes, error } = await supabaseClient
    .from('problemes_signales')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
```

Cette requête récupère les 50 derniers problèmes, sans filtrage.

## Fonction traiterProbleme

Lorsqu'un problème est marqué comme "traité", il est **supprimé** (DELETE) au lieu d'être mis à jour.

Cela simplifie la gestion car :
- Pas besoin de la colonne `traite`
- Pas de confusion avec le champ `statut`
- L'historique peut être conservé si nécessaire via un système d'archivage

## Si vous souhaitez garder l'historique

Option 1 : Utiliser le champ `statut` existant
```javascript
.update({ statut: 'cloture', traite_le: new Date().toISOString() })
```

Option 2 : Ajouter la colonne `traite` (fichier SQL fourni)
```sql
ALTER TABLE problemes_signales ADD COLUMN traite BOOLEAN DEFAULT FALSE;
```

Puis filtrer sur :
```javascript
.is('traite', false)
```

---

**Date**: 2026-01-04
**Version dashboard.js**: 2.1.0
