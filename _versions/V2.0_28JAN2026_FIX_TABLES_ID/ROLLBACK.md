# 🔄 ROLLBACK - Version 2.0 vers 1.1

## ⚠️ Procédure de Rollback d'Urgence

Si vous devez revenir à la version précédente (V1.1), suivez ces étapes :

### 📋 Étape 1 : Vérification
```bash
# Vérifier la version actuelle
cat _versions/CURRENT_VERSION.txt

# Lister les versions disponibles
ls _versions/
```

### 🔙 Étape 2 : Restauration des Fichiers

#### Option A : Restauration Complète
```bash
# Copier tous les fichiers de la V1.1
cp -r _versions/V1.1_28JAN2026_RESTAURATION_TABLES_CLIENTS/* .

# Mettre à jour la version
echo "V1.1_28JAN2026_RESTAURATION_TABLES_CLIENTS - ROLLBACK depuis V2.0" > _versions/CURRENT_VERSION.txt
```

#### Option B : Restauration Sélective
```bash
# Seulement les fichiers JS
cp -r _versions/V1.1_28JAN2026_RESTAURATION_TABLES_CLIENTS/js/* js/

# Seulement les fichiers SQL
cp -r _versions/V1.1_28JAN2026_RESTAURATION_TABLES_CLIENTS/sql/* sql/
```

### 🗄️ Étape 3 : Rollback Base de Données

⚠️ **ATTENTION** : Le rollback SQL annulera les colonnes `id` ajoutées !

```sql
-- À exécuter dans Supabase SQL Editor
BEGIN;

-- Supprimer colonne id de demandes_horaires
ALTER TABLE demandes_horaires DROP COLUMN IF EXISTS id;

-- Supprimer colonne id de problemes_signales
ALTER TABLE problemes_signales DROP COLUMN IF EXISTS id;

COMMIT;
```

### 🔍 Étape 4 : Vérification

```bash
# Tester l'application
npm run dev

# Vérifier les erreurs console
# Tester la création de réservations
```

### 📝 Étape 5 : Commit

```bash
git add .
git commit -m "🔙 ROLLBACK V2.0 → V1.1"
git push origin main
```

### 🚨 Que Faire si le Rollback Échoue

1. **Contacter le support** immédiatement
2. **Ne pas effectuer d'autres modifications**
3. **Documenter l'erreur exacte**
4. **Vérifier les logs Supabase**

### 📊 Impact du Rollback

- ❌ Perte des colonnes `id` auto-générées
- ❌ Retour aux problèmes de création UUID
- ✅ Restauration de l'état V1.1 stable

### 🔗 Documentation

- [CHANGELOG V2.0](CHANGELOG.md)
- [ERREURS_CRITIQUES.md](../../docs/ERREURS_CRITIQUES.md)

---

**⚠️ Ce rollback doit être utilisé uniquement en cas d'urgence !**
