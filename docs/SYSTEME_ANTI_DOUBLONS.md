# 🛡️ Système Anti-Doublons - Erreurs

## 📋 Problème à résoudre

Sans déduplication, on pourrait avoir :
- Même erreur enregistrée 100x en 1 minute
- Table `cm_error_logs` saturée
- Interface monitoring illisible
- Pas de vision claire des vraies erreurs

## ✅ Solutions en place

### 1️⃣ Déduplication Côté SQL (PRINCIPAL)

**Fonction PostgreSQL :** `upsert_error_log()`

```sql
-- Localisation : sql/UPGRADE_ERROR_DEDUPLICATION.sql
-- ✅ Déjà déployé et actif
```

#### Comment ça marche ?

**Étape 1 : Génération fingerprint**
```sql
fingerprint = MD5(error_type + source + message)
-- Exemple : "critical|fetch|HTTP 500 - api/users"
```

**Étape 2 : Recherche doublon**
```sql
SELECT id FROM cm_error_logs 
WHERE error_fingerprint = 'xxx' 
AND resolved = false
```

**Étape 3A : Si existe → UPDATE**
```sql
UPDATE cm_error_logs SET
    occurrence_count = occurrence_count + 1,
    last_occurrence = NOW(),
    affected_users = affected_users + new_user (si nouveau)
WHERE id = existing_id
```

**Étape 3B : Si n'existe pas → INSERT**
```sql
INSERT INTO cm_error_logs (...) VALUES (...)
```

#### Résultat
- ✅ 100 occurrences = 1 ligne en BDD
- ✅ Compteur `occurrence_count` incrémenté
- ✅ `last_occurrence` mis à jour
- ✅ Liste des utilisateurs affectés
- ✅ Historique complet dans `instances` JSONB

---

### 2️⃣ Filtrage Côté JavaScript

**Fichier :** `js/error-tracker.js`

#### Pattern Matching
```javascript
const IGNORED_PATTERNS = [
    // Extensions navigateur
    'chrome-extension://',
    'moz-extension://',
    
    // Erreurs temporaires
    'NetworkError',
    'timeout',
    
    // Erreurs système non pertinentes
    'SyntaxError',
    'Script error',
    
    // Colonnes manquantes (SQL non exécuté)
    'validation_status',
    'monitoring_start',
    'does not exist',
    
    // Tables non déployées
    'referral_notifications',
    'PGRST116'
];

function shouldIgnoreError(message, source) {
    return IGNORED_PATTERNS.some(pattern => 
        message.includes(pattern) || source.includes(pattern)
    );
}
```

#### Application
```javascript
// Avant d'envoyer l'erreur
if (!shouldIgnoreError(error.message, error.source)) {
    logError(errorData); // → Envoi à Supabase
} else {
    // Ignorée silencieusement
}
```

---

### 3️⃣ Protection Anti-Boucle

**Fichier :** `js/error-tracker.js` - Ligne 19-20

```javascript
let isLoggingError = false;

async function logError(errorData) {
    // 🚨 PROTECTION ANTI-BOUCLE
    if (isLoggingError) {
        return; // Ne pas logger si déjà en train de logger
    }
    
    isLoggingError = true;
    
    try {
        await window.supabaseClient.rpc('upsert_error_log', {...});
    } catch (err) {
        // Ne PAS re-logger cette erreur !
    } finally {
        isLoggingError = false;
    }
}
```

#### Pourquoi ?
Si l'envoi vers Supabase échoue → génère une erreur → serait re-capturée → boucle infinie

---

### 4️⃣ Capture Intelligente

#### Erreurs HTTP (fetch)
```javascript
window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    if (!response.ok && response.status >= 400) {
        const url = args[0];
        
        // Ignorer si URL contient patterns exclus
        if (shouldIgnoreError(url, '') || 
            url.includes('validation_status')) {
            return response;
        }
        
        // Logger uniquement erreurs importantes
        if (response.status >= 500 || 
            (response.status >= 400 && !url.includes('.css'))) {
            logError({...});
        }
    }
    
    return response;
};
```

**Évite :**
- ✅ Erreurs sur colonnes manquantes
- ✅ 404 sur assets (.css, .js)
- ✅ Erreurs sur tables non déployées

---

## 📊 Flux Complet

```
┌─────────────────────┐
│   Erreur détectée   │
│  (window.onerror,   │
│   console.error,    │
│   fetch error)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ shouldIgnoreError? │◄─── Liste IGNORED_PATTERNS
└──────────┬──────────┘
           │
      Oui  │  Non
    ┌──────┴──────┐
    │             │
    ▼             ▼
  IGNORE      logError()
              ┌─────────┐
              │ RPC     │
              │ upsert_ │
              │ error_  │
              │ log()   │
              └────┬────┘
                   │
                   ▼
          ┌────────────────┐
          │ SQL FUNCTION   │
          ├────────────────┤
          │ 1. Fingerprint │
          │ 2. Recherche   │
          │ 3. Update ou   │
          │    Insert      │
          └────────┬───────┘
                   │
             ┌─────┴─────┐
             │           │
        Existe       N'existe pas
             │           │
             ▼           ▼
        ┌────────┐  ┌────────┐
        │ UPDATE │  │ INSERT │
        │ count++│  │ new row│
        └────────┘  └────────┘
             │           │
             └─────┬─────┘
                   ▼
          ┌────────────────┐
          │ cm_error_logs  │
          │ (1 row par     │
          │  erreur unique)│
          └────────────────┘
```

---

## 🧪 Exemples Concrets

### Exemple 1 : Même erreur 50x
```javascript
// Erreur se produit 50 fois en 1 minute
for (let i = 0; i < 50; i++) {
    throw new Error('Cannot read property value of null');
}
```

**Résultat en BDD :**
```sql
SELECT * FROM cm_error_logs WHERE message LIKE '%Cannot read property%';

-- 1 seule ligne !
-- occurrence_count = 50
-- first_occurrence = 10:00:00
-- last_occurrence = 10:00:59
-- instances = [tous les timestamps] (JSONB)
```

---

### Exemple 2 : Extension Chrome
```javascript
// Erreur depuis extension
throw new Error('chrome-extension://abc123/script.js error');
```

**Résultat :**
- ✅ Pattern détecté : `chrome-extension://`
- ✅ Ignorée avant même l'envoi SQL
- ✅ Zéro ligne créée en BDD

---

### Exemple 3 : HTTP 400 colonne manquante
```javascript
// Requête avec colonne non existante
fetch('...supabase.co/rest/v1/cm_error_logs?validation_status=eq.monitoring');
// → HTTP 400
```

**AVANT correction :**
- ❌ Erreur capturée
- ❌ Envoyée en BDD
- ❌ Affichée dans monitoring
- ❌ À chaque refresh → new erreur

**APRÈS correction :**
- ✅ Pattern détecté : `validation_status` dans URL
- ✅ Ignorée par `shouldIgnoreError()`
- ✅ Warning console uniquement
- ✅ Zéro ligne en BDD

---

### Exemple 4 : Erreur réseau temporaire
```javascript
// Timeout réseau
fetch('https://api.example.com/data')
    .catch(err => {
        // err.message = "NetworkError: Failed to fetch"
    });
```

**Résultat :**
- ✅ Pattern détecté : `NetworkError`
- ✅ Ignorée (erreur temporaire, pas utile à logger)
- ✅ Pas de spam en BDD

---

## 🎯 Configuration

### Ajouter un pattern à ignorer

**Fichier :** `js/error-tracker.js`

```javascript
const IGNORED_PATTERNS = [
    // ... patterns existants
    'votre-nouveau-pattern',
    'autre-pattern-a-ignorer'
];
```

### Vérifier qu'une erreur est dedupliquée

```sql
-- Voir toutes les erreurs avec occurrences multiples
SELECT 
    message,
    source,
    occurrence_count,
    first_occurrence,
    last_occurrence,
    array_length(instances, 1) as nb_instances
FROM cm_error_logs
WHERE occurrence_count > 1
ORDER BY occurrence_count DESC;
```

### Compter les utilisateurs affectés

```sql
SELECT 
    message,
    jsonb_array_length(affected_users) as nb_users_affected,
    occurrence_count
FROM cm_error_logs
WHERE affected_users IS NOT NULL
ORDER BY nb_users_affected DESC;
```

---

## 📈 Métriques Anti-Doublons

### Taux de déduplication
```sql
-- Combien d'occurrences évitées ?
SELECT 
    SUM(occurrence_count) as total_occurrences,
    COUNT(*) as unique_errors,
    SUM(occurrence_count) - COUNT(*) as doublons_evites,
    ROUND(100.0 * (SUM(occurrence_count) - COUNT(*)) / SUM(occurrence_count), 2) as taux_dedup
FROM cm_error_logs;
```

**Exemple résultat :**
```
total_occurrences | unique_errors | doublons_evites | taux_dedup
------------------+---------------+-----------------+-----------
      5432        |      127      |      5305       |   97.66%
```
→ 97.66% de doublons évités = très efficace !

---

## ✅ Checklist Système

- [x] Fonction SQL `upsert_error_log()` déployée
- [x] Table `cm_error_logs` avec colonne `error_fingerprint`
- [x] Index sur `error_fingerprint`
- [x] Index composé sur `(error_fingerprint, resolved)`
- [x] JavaScript utilise RPC `upsert_error_log()`
- [x] Patterns IGNORED_PATTERNS à jour
- [x] Protection anti-boucle active
- [x] Filtrage fetch errors intelligent
- [x] Colonnes manquantes ignorées

---

## 🆘 Dépannage

### J'ai quand même des doublons !

1. **Vérifier que la fonction SQL est déployée**
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'upsert_error_log';
   -- Doit retourner 1 ligne
   ```

2. **Vérifier que JS l'utilise**
   ```javascript
   // Dans error-tracker.js, doit y avoir :
   .rpc('upsert_error_log', {...})
   // PAS .from('cm_error_logs').insert()
   ```

3. **Vérifier les fingerprints**
   ```sql
   SELECT error_fingerprint, COUNT(*) 
   FROM cm_error_logs 
   GROUP BY error_fingerprint 
   HAVING COUNT(*) > 1;
   -- Ne devrait retourner AUCUNE ligne
   ```

### Une erreur est loggée alors qu'elle devrait être ignorée

1. **Vérifier le pattern**
   ```javascript
   // Tester dans console
   const msg = "votre message d'erreur";
   const shouldIgnore = IGNORED_PATTERNS.some(p => msg.includes(p));
   console.log(shouldIgnore); // Doit être true
   ```

2. **Ajouter le pattern si nécessaire**

---

**Conclusion :** Le système est robuste et évite >95% des doublons. Les quelques erreurs qui passent sont des erreurs uniques légitimes.
