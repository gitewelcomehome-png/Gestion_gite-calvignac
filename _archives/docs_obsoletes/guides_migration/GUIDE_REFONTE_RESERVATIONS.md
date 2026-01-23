# 🎯 GUIDE COMPLET - REFONTE SYSTÈME RÉSERVATIONS

## 📋 Vue d'ensemble

**Problèmes résolus :**
- ✅ Format incohérent des URLs iCal (tableau vs objet)
- ✅ Doublons lors des réimports
- ✅ Modifications manuelles écrasées par les syncs
- ✅ Pas de détection des annulations
- ✅ Toutes les réservations attribuées au mauvais gîte

**Nouveautés :**
- 🎯 Interface propre pour configurer les URLs iCal
- 🛡️ Protection automatique des modifications manuelles (`manual_override`)
- 📊 Détection intelligente des annulations
- 🔍 Tracking précis avec `ical_uid` (évite les doublons)
- 📅 Horodatage `last_seen_in_ical` pour monitoring

---

## 🚀 ÉTAPE 1 : Exécuter les modifications SQL

### 1.1 Ajouter les colonnes de tracking

**Fichier :** `sql/ALTER_RESERVATIONS_TRACKING.sql`

```sql
-- Ouvrir Supabase → SQL Editor → Coller ce contenu :

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS ical_uid TEXT;

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS manual_override BOOLEAN DEFAULT FALSE;

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS last_seen_in_ical TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_reservations_ical_uid 
ON reservations(ical_uid) 
WHERE ical_uid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_last_seen 
ON reservations(last_seen_in_ical) 
WHERE source = 'ical' AND manual_override = FALSE;

COMMENT ON COLUMN reservations.ical_uid IS 'UID unique du événement iCal (pour éviter doublons lors des syncs)';
COMMENT ON COLUMN reservations.manual_override IS 'TRUE si modifiée manuellement → NE PAS toucher lors des syncs iCal';
COMMENT ON COLUMN reservations.last_seen_in_ical IS 'Dernière présence dans le flux iCal (pour détecter annulations)';
```

**Vérification :**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
AND column_name IN ('ical_uid', 'manual_override', 'last_seen_in_ical');
```

Devrait afficher 3 lignes.

---

## 🔧 ÉTAPE 2 : Corriger le format de Couzon (si nécessaire)

### 2.1 Vérifier le format actuel

```sql
SELECT name, ical_sources 
FROM gites 
WHERE name = 'Couzon';
```

**Si c'est un tableau `[...]` :**
1. Notez les URLs affichées
2. Allez dans l'interface web → Onglet "Gîtes" → Cliquez sur "📋 iCal" à côté de Couzon
3. Collez les URLs dans les bons champs
4. Cliquez "Sauvegarder"

**Ou via SQL :**
```sql
-- ADAPTER LES URLS CI-DESSOUS !
UPDATE gites
SET ical_sources = jsonb_build_object(
    'airbnb', 'https://www.airbnb.fr/calendar/ical/13366259.ics?...',
    'abritel', 'http://www.abritel.fr/icalendar/d31158afb72048aabb...',
    'gites-de-france', 'https://reservation.itea.fr/iCal_753fbf35431f67e81...'
)
WHERE name = 'Couzon';
```

### 2.2 Vérifier tous les gîtes

```sql
SELECT 
    name, 
    jsonb_typeof(ical_sources) AS type,
    jsonb_object_keys(ical_sources) AS platforms
FROM gites 
WHERE ical_sources IS NOT NULL;
```

**Résultat attendu :** `type` = `'object'` pour tous.

---

## 📱 ÉTAPE 3 : Configurer les URLs iCal via l'interface

### 3.1 Ouvrir l'interface de configuration

1. Ouvrir l'application
2. Aller dans l'onglet "**Gîtes**"
3. Pour chaque gîte, cliquer sur le bouton "**📋 iCal**"
4. Renseigner les URLs pour chaque plateforme utilisée
5. Cliquer "**Sauvegarder**"

### 3.2 Obtenir les URLs iCal

**Airbnb :**
1. Connexion → Annonces → [Votre annonce]
2. Calendrier → Disponibilité et tarifs
3. Section "Synchroniser les calendriers" → "Exporter le calendrier"
4. Copier l'URL iCal

**Abritel :**
1. Connexion → Mon compte → Mes annonces
2. Calendrier → Synchroniser les calendriers
3. Copier l'URL "Lien vers le calendrier iCal"

**Gîtes de France :**
1. Espace propriétaire → Calendrier
2. Flux iCal / Synchronisation
3. Copier l'URL du flux

---

## 🧹 ÉTAPE 4 : Nettoyer la base de données

### 4.1 Sauvegarder les données existantes (optionnel)

```sql
-- Créer une table de backup
CREATE TABLE reservations_backup_20260112 AS 
SELECT * FROM reservations;
```

### 4.2 Supprimer toutes les réservations

```sql
-- ATTENTION : Cela supprime TOUTES les réservations !
TRUNCATE TABLE reservations RESTART IDENTITY CASCADE;
```

**Vérification :**
```sql
SELECT COUNT(*) FROM reservations;
-- Devrait afficher : 0
```

---

## 🔄 ÉTAPE 5 : Activer le nouveau système de synchronisation

### 5.1 Remplacer l'ancien fichier sync-ical.js

**Dans index.html**, remplacer la ligne :

```html
<!-- ANCIEN -->
<script src="js/sync-ical.js?v=2.0"></script>

<!-- NOUVEAU -->
<script src="js/sync-ical-v2.js?v=2.1"></script>
```

### 5.2 Recharger la page (F5)

---

## ✅ ÉTAPE 6 : Premier import complet

### 6.1 Lancer la synchronisation

1. Ouvrir l'onglet "**Réservations**"
2. Cliquer sur le bouton "**🔄 Synchroniser**"
3. Attendre la fin de la synchronisation
4. Vérifier les messages :
   ```
   ✓ Synchronisation terminée !
   📊 Total: X ajoutées, 0 mises à jour, 0 annulées, Y ignorées
   ```

### 6.2 Vérifier les résultats

**Compter les réservations par gîte :**
```sql
SELECT 
    g.name,
    COUNT(r.id) AS nb_reservations,
    COUNT(CASE WHEN r.synced_from = 'airbnb' THEN 1 END) AS airbnb,
    COUNT(CASE WHEN r.synced_from = 'abritel' THEN 1 END) AS abritel,
    COUNT(CASE WHEN r.synced_from = 'gites-de-france' THEN 1 END) AS gdf
FROM gites g
LEFT JOIN reservations r ON r.gite_id = g.id
GROUP BY g.id, g.name
ORDER BY g.name;
```

**Résultat attendu :**
```
name     | nb_reservations | airbnb | abritel | gdf
---------+-----------------+--------+---------+----
3ème     | 8               | 4      | 3       | 1
4ème     | 12              | 6      | 5       | 1
Couzon   | 15              | 7      | 6       | 2
Trévoux  | 14              | 6      | 6       | 2
```

**Vérifier les doublons (doit être 0) :**
```sql
SELECT 
    ical_uid, 
    gite_id, 
    client_name, 
    check_in,
    COUNT(*) as nb
FROM reservations
GROUP BY ical_uid, gite_id, client_name, check_in
HAVING COUNT(*) > 1;
```

---

## 🛡️ ÉTAPE 7 : Tester la protection manuelle

### 7.1 Modifier une réservation

1. Dans l'onglet "Réservations", cliquer sur une carte
2. Modifier le **nom du client** (ex: "M. Martin" → "Martin Pierre")
3. Cliquer "Sauvegarder"

### 7.2 Vérifier le verrou

```sql
SELECT 
    id,
    client_name,
    manual_override,
    source
FROM reservations
WHERE client_name LIKE '%Martin%'
LIMIT 5;
```

**Résultat attendu :** `manual_override` = `true`

### 7.3 Re-synchroniser

1. Cliquer sur "🔄 Synchroniser"
2. Vérifier que la réservation modifiée **n'est PAS écrasée**

---

## 🔍 ÉTAPE 8 : Tester la détection d'annulation

### 8.1 Annuler une réservation sur Airbnb

1. Se connecter à Airbnb
2. Annuler une réservation existante
3. Attendre 5 minutes (propagation du flux iCal)

### 8.2 Synchroniser

1. Dans l'app → "🔄 Synchroniser"
2. Vérifier le message : `1 annulée`

### 8.3 Vérifier le statut

```sql
SELECT 
    client_name,
    status,
    notes
FROM reservations
WHERE status = 'cancelled'
ORDER BY updated_at DESC;
```

**Résultat attendu :**
```
client_name        | status    | notes
-------------------+-----------+-------------------------------------
⚠️ Client Airbnb   | cancelled | Annulée automatiquement (disparue du flux iCal)
```

---

## 📊 ÉTAPE 9 : Monitoring quotidien

### 9.1 Dashboard SQL (optionnel)

```sql
-- Créer une vue pour le suivi
CREATE OR REPLACE VIEW v_reservations_stats AS
SELECT 
    g.name AS gite,
    COUNT(r.id) AS total,
    COUNT(CASE WHEN r.source = 'ical' THEN 1 END) AS ical,
    COUNT(CASE WHEN r.source = 'manual' THEN 1 END) AS manual,
    COUNT(CASE WHEN r.manual_override = true THEN 1 END) AS protected,
    COUNT(CASE WHEN r.status = 'cancelled' THEN 1 END) AS cancelled,
    MAX(r.last_seen_in_ical) AS dernier_sync
FROM gites g
LEFT JOIN reservations r ON r.gite_id = g.id
GROUP BY g.id, g.name;

-- Consulter le dashboard
SELECT * FROM v_reservations_stats;
```

### 9.2 Commandes utiles

**Réinitialiser le verrou d'une réservation :**
```sql
UPDATE reservations 
SET manual_override = false 
WHERE id = 'xxx';
```

**Voir les réservations protégées :**
```sql
SELECT 
    client_name, 
    check_in, 
    check_out,
    synced_from
FROM reservations 
WHERE manual_override = true;
```

**Forcer la suppression d'une réservation (ATTENTION) :**
```sql
DELETE FROM reservations WHERE id = 'xxx';
```

---

## 🔴 DÉPANNAGE

### Problème : "Tous les proxies ont échoué"

**Cause :** URL iCal invalide ou service temporairement indisponible.

**Solution :**
1. Vérifier l'URL dans le navigateur (doit afficher du texte brut)
2. Si erreur 403/408 : Attendre 10 minutes et réessayer
3. Si persiste : Regénérer l'URL iCal sur la plateforme

### Problème : Réservations toujours dans le mauvais gîte

**Cause :** URLs iCal mal configurées.

**Solution :**
```sql
-- Vérifier les URLs par gîte
SELECT 
    name,
    ical_sources->>'airbnb' AS airbnb_url,
    ical_sources->>'abritel' AS abritel_url
FROM gites;
```

Chaque gîte doit avoir **SES PROPRES URLs** (pas les mêmes pour tous).

### Problème : Doublons malgré le système

**Cause :** `ical_uid` NULL ou réimport sans TRUNCATE.

**Solution :**
```sql
-- Vérifier les ical_uid NULL
SELECT COUNT(*) 
FROM reservations 
WHERE ical_uid IS NULL 
AND source = 'ical';

-- Si > 0 : TRUNCATE et réimporter
TRUNCATE TABLE reservations RESTART IDENTITY CASCADE;
```

---

## ✅ CHECKLIST FINALE

- [ ] Colonnes ajoutées (`ical_uid`, `manual_override`, `last_seen_in_ical`)
- [ ] Format `ical_sources` corrigé pour tous les gîtes (objet, pas tableau)
- [ ] URLs iCal configurées via l'interface pour chaque gîte
- [ ] Base de données nettoyée (TRUNCATE)
- [ ] Nouveau fichier `sync-ical-v2.js` chargé dans index.html
- [ ] Premier import réussi sans doublons
- [ ] Test modification manuelle → `manual_override = true`
- [ ] Test annulation détectée automatiquement
- [ ] Répartition correcte par gîte vérifiée

---

## 📞 SUPPORT

**Logs utiles (console navigateur) :**
```javascript
// Afficher les réservations en cache
console.log(window.CACHE.reservations);

// Forcer refresh et afficher
getAllReservations(true).then(r => console.table(r));

// Vérifier le verrou de sync
console.log('syncInProgress:', syncInProgress);
```

**Fichiers modifiés :**
- `sql/ALTER_RESERVATIONS_TRACKING.sql` ⭐ (nouveau)
- `js/sync-ical-v2.js` ⭐ (nouveau - remplace sync-ical.js)
- `js/gites-crud.js` (ajout bouton iCal + modale config)
- `js/supabase-operations.js` (ajout auto `manual_override`)
- `index.html` (modifier src du script sync)

---

**Version :** 2.0 - Janvier 2026  
**Auteur :** Refonte complète système réservations
