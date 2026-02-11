# 🔍 DEBUG: Demandes Horaires non visibles

## Problème identifié

Les demandes d'horaires ne s'affichent pas dans le dashboard. Plusieurs causes possibles:

## ✅ Solutions à appliquer dans l'ordre

### 1. **CRITIQUE: Activer les RLS Policies**
```sql
-- Exécuter ce fichier en PREMIER:
sql/add_rls_demandes_horaires.sql
```
**Sans les RLS policies, Supabase bloque TOUTES les requêtes sur la table !**

### 2. Vérifier l'état de la table
```sql
-- Exécuter pour diagnostiquer:
sql/check_demandes_horaires.sql
```
Ce script vérifie:
- ✅ La table existe ?
- ✅ Combien de lignes avec statut 'en_attente' ?
- ✅ Quels statuts sont utilisés ?

### 3. Créer une demande de test (si table vide)
```sql
-- Éditer puis exécuter:
sql/create_test_demande_horaire.sql
```
- Remplacer `VOTRE_USER_ID_ICI` par votre UUID
- Remplacer `VOTRE_RESERVATION_ID_ICI` par un UUID de réservation réel
- **IMPORTANT**: Le statut doit être `'en_attente'` (pas 'validee', 'refusee', etc.)

### 4. Ouvrir la console navigateur
Recharger le dashboard et chercher dans la console:
```
🔄 [DEBUG] refreshDashboard() démarré
📞 [DEBUG] Appel updateDemandesClients()...
🔍 [DEBUG] Chargement demandes_horaires...
📊 [DEBUG] Résultat demandes_horaires: { error: null, count: X, demandes: [...] }
✅ [DEBUG] updateDemandesClients() terminé
```

**Interprétation:**
- `count: 0` → Pas de demandes avec statut 'en_attente'
- `error: {...}` → Problème de requête (probablement RLS manquant)
- `count: > 0` → Les demandes existent, vérifier le HTML

## 🎯 Points de contrôle

| Check | Description | Fichier |
|-------|-------------|---------|
| ✅ RLS activé | Policies créées sur demandes_horaires | [sql/add_rls_demandes_horaires.sql](sql/add_rls_demandes_horaires.sql) |
| ✅ Table existe | Contient des lignes | [sql/check_demandes_horaires.sql](sql/check_demandes_horaires.sql) |
| ✅ Statut correct | Doit être `'en_attente'` exactement | Console logs |
| ✅ Fonction appelée | refreshDashboard() appelle updateDemandesClients() | [js/dashboard.js](js/dashboard.js#L2180) |
| ✅ HTML IDs | `dashboard-demandes-clients`, `liste-demandes-clients` | [tabs/tab-dashboard.html](tabs/tab-dashboard.html#L36) |

## 📝 Code modifié

### [js/dashboard.js](js/dashboard.js)
- Ligne 2503: `updateDemandesClients()` réactivée avec logs debug
- Ligne 2180: Ajoutée dans `refreshDashboard()`

### [tabs/tab-dashboard.html](tabs/tab-dashboard.html)
- Ligne 39: Titre changé → "DEMANDES HORAIRES (ARRIVÉE/DÉPART)"

## 🔧 Résolution rapide (commandes SQL)

```sql
-- 1. OBLIGATOIRE: Activer RLS
\i sql/add_rls_demandes_horaires.sql

-- 2. Vérifier état
\i sql/check_demandes_horaires.sql

-- 3. Si aucune demande, obtenir IDs pour test:
SELECT id, email FROM auth.users LIMIT 1;
SELECT id, client_name FROM reservations WHERE check_out >= CURRENT_DATE LIMIT 3;

-- 4. Créer demande test avec les IDs ci-dessus:
INSERT INTO demandes_horaires (owner_user_id, reservation_id, type, heure_demandee, motif, statut)
VALUES (
    'UUID_USER',
    'UUID_RESERVATION', 
    'arrivee',
    '15:00:00',
    'Test affichage dashboard',
    'en_attente'  -- ⚠️ CRITIQUE
);
```

## ✅ Résultat attendu

Après application des RLS policies et création d'une demande:
1. Dashboard affiche la section "DEMANDES HORAIRES"
2. Badge orange avec nombre de demandes
3. Carte affichant: Client, Gîte, Type (🏠/🧳), Heures (actuelle → demandée), Motif
4. Boutons ✓ Accepter / ✗ Refuser
