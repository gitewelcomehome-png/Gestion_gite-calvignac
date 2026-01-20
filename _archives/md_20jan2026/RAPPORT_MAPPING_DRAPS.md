# Rapport de Mapping - Onglet Draps

**Date:** 14 janvier 2026  
**Fichier:** `js/draps.js`  
**Table BDD:** `linen_stocks`

---

## 🔍 Problèmes Identifiés

### 1. ❌ **Table inexistante dans la BDD**
- **Problème:** Le code utilise la table `linen_stocks` qui n'existe PAS dans `SCHEMA_COMPLET_FINAL_2026.sql`
- **Trouvée:** Seulement `stocks_draps` avec une structure inadaptée (type_linge en ligne au lieu de colonnes)
- **Impact:** Toute sauvegarde/lecture échoue silencieusement

### 2. ❌ **UUID owner_user_id manquant**
- **Problème:** La fonction `sauvegarderStocks()` ne fournit PAS l'`owner_user_id`
- **Code actuel:**
  ```javascript
  const stocks = {
      gite_id: gite.id,  // ✅ OK
      draps_plats_grands: parseInt(...)
      // ❌ MANQUE: owner_user_id
  };
  ```
- **Impact:** Violation de contrainte NOT NULL sur `owner_user_id`

### 3. ❌ **Pas de filtre RLS dans la lecture**
- **Problème:** Le `chargerStocks()` ne filtre pas par `owner_user_id`
- **Code actuel:**
  ```javascript
  const { data, error } = await window.supabaseClient
      .from('linen_stocks')
      .select('*');  // ❌ Récupère TOUT sans filtre
  ```
- **Impact:** Potentiellement récupère les données d'autres utilisateurs

### 4. ⚠️ **Gestion d'erreur trop silencieuse**
- Les erreurs sont catchées mais pas remontées correctement
- Les logs console ne suffisent pas pour le debug

---

## ✅ Mapping Correct des Variables

### Structure BDD (table `linen_stocks`)

| Colonne BDD | Type | Contraintes | Usage Code JS |
|-------------|------|-------------|---------------|
| `id` | UUID | PK, auto | ✅ Auto-généré |
| `owner_user_id` | UUID | NOT NULL, FK | ❌ **MANQUANT** |
| `gite_id` | UUID | NOT NULL, FK, UNIQUE | ✅ Utilisé |
| `draps_plats_grands` | INT | >= 0 | ✅ Correct |
| `draps_plats_petits` | INT | >= 0 | ✅ Correct |
| `housses_couettes_grandes` | INT | >= 0 | ✅ Correct |
| `housses_couettes_petites` | INT | >= 0 | ✅ Correct |
| `taies_oreillers` | INT | >= 0 | ✅ Correct |
| `serviettes` | INT | >= 0 | ✅ Correct |
| `tapis_bain` | INT | >= 0 | ✅ Correct |
| `created_at` | TIMESTAMPTZ | auto | ✅ Auto-géré |
| `updated_at` | TIMESTAMPTZ | auto | ⚠️ Manuellement défini |

---

## 🔧 Corrections à Apporter

### Correction 1: Ajouter owner_user_id dans sauvegarderStocks()

**Avant:**
```javascript
const stocks = {
    gite_id: gite.id,
    draps_plats_grands: parseInt(...),
    // ...
    updated_at: new Date().toISOString()
};
```

**Après:**
```javascript
// Récupérer l'utilisateur connecté
const { data: { user } } = await window.supabaseClient.auth.getUser();
if (!user) throw new Error('Utilisateur non connecté');

const stocks = {
    owner_user_id: user.id,  // ✅ UUID obligatoire
    gite_id: gite.id,
    draps_plats_grands: parseInt(...),
    // ... autres champs
    updated_at: new Date().toISOString()
};
```

### Correction 2: Ajouter filtre RLS dans chargerStocks()

**Avant:**
```javascript
const { data, error } = await window.supabaseClient
    .from('linen_stocks')
    .select('*');
```

**Après:**
```javascript
const { data: { user } } = await window.supabaseClient.auth.getUser();
if (!user) throw new Error('Utilisateur non connecté');

const { data, error } = await window.supabaseClient
    .from('linen_stocks')
    .select('*')
    .eq('owner_user_id', user.id);  // ✅ Filtre RLS
```

### Correction 3: Améliorer la gestion d'erreur

**Avant:**
```javascript
if (error) throw error;
// ou
catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur');
}
```

**Après:**
```javascript
if (error) {
    console.error('Erreur Supabase:', error);
    throw new Error(`Erreur BDD: ${error.message}`);
}
// et
catch (error) {
    console.error('Erreur complète:', error);
    alert(`❌ Erreur: ${error.message}`);
}
```

---

## 📋 Plan d'Action

1. ✅ **Exécuter le script SQL** `fix_draps_table.sql` pour créer la table `linen_stocks`
2. ⏳ **Corriger le code JS** `js/draps.js` avec les UUID et filtres RLS
3. ⏳ **Mettre à jour** `SCHEMA_COMPLET_FINAL_2026.sql` avec la nouvelle structure
4. ⏳ **Tester** en dev puis en production

---

## 🎯 Résumé des Changements

| Élément | Avant | Après | Priorité |
|---------|-------|-------|----------|
| Table BDD | `stocks_draps` (mauvaise structure) | `linen_stocks` (colonnes) | 🔴 Critique |
| `owner_user_id` | ❌ Absent | ✅ Fourni dans upsert | 🔴 Critique |
| Filtre RLS | ❌ Absent | ✅ `.eq('owner_user_id', user.id)` | 🔴 Critique |
| Gestion erreurs | ⚠️ Basique | ✅ Détaillée | 🟡 Important |
| UUID auto | ❌ Non géré | ✅ Auto via `gen_random_uuid()` | ✅ OK |

---

**État:** Corrections en attente d'application
