# 🧪 Scripts de Test - 4 Gîtes

## 📄 Fichiers disponibles

### `test_data_4_gites.sql` - Création des données de test
Crée 2 gîtes supplémentaires + 6 réservations pour tester l'affichage avec 4 colonnes.

**Gîtes créés :**
- 🏡 **Le Relèvement** - 2531 route de Gardelit, 01990 Trévoux (violet #9b59b6)
- 🏠 **La Bergerie** - 45 chemin des Vignes, 01600 Trévoux (orange #e67e22)

**Réservations créées :**
- 3 réservations pour "Le Relèvement" (Airbnb, Gîtes de France, Abritel)
- 3 réservations pour "La Bergerie" (Airbnb, Gîtes de France, autre)

### `cleanup_test_data_4_gites.sql` - Suppression des données de test
Supprime proprement les 2 gîtes et leurs réservations.

---

## 🚀 Comment utiliser

### Méthode 1 : Via Supabase Dashboard (Recommandé)

1. **Aller sur Supabase Dashboard**
   - https://supabase.com/dashboard
   - Projet : votre projet
   - Menu : SQL Editor

2. **Créer les données de test**
   - Cliquer sur "+ New query"
   - Copier le contenu de `test_data_4_gites.sql`
   - Cliquer sur "Run"
   - ✅ Vérifier les messages de succès

3. **Supprimer les données de test**
   - Nouvelle query
   - Copier le contenu de `cleanup_test_data_4_gites.sql`
   - Cliquer sur "Run"

### Méthode 2 : Via ligne de commande

```bash
# Se connecter à Supabase (nécessite supabase CLI)
cd /workspaces/Gestion_gite-calvignac

# Créer les données de test
supabase db execute --file sql/test_data_4_gites.sql

# Supprimer les données de test
supabase db execute --file sql/cleanup_test_data_4_gites.sql
```

---

## 📊 Détails des données créées

### Gîte 3 : Le Relèvement
- **Capacité :** 8 personnes
- **Couleur :** Violet (#9b59b6)
- **Icône :** Villa
- **Réservations :**
  - Famille Martin (Airbnb) - Semaine en cours - 850€
  - Sophie Leroy (Gîtes de France) - Semaine prochaine - 920€
  - Jean Dubois (Abritel) - Dans 2 semaines - 780€

### Gîte 4 : La Bergerie
- **Capacité :** 6 personnes
- **Couleur :** Orange (#e67e22)
- **Icône :** Cabin
- **Réservations :**
  - Claire Bernard (Airbnb) - Dans 2 jours - 680€
  - Marc Petit (autre → Gîtes de France) - Dans 10 jours - 720€
  - Laura Rousseau (Gîtes de France) - Dans 3 semaines - 790€

---

## ⚠️ Important

- Les réservations utilisent `CURRENT_DATE` → dates relatives à aujourd'hui
- Suppression en CASCADE : les réservations sont automatiquement supprimées avec les gîtes
- Les scripts vérifient l'existence d'une organisation
- Messages de log détaillés pour suivre l'exécution

---

## 🎯 Cas d'usage

✅ Tester l'affichage avec 4 colonnes de gîtes  
✅ Vérifier la gestion des couleurs personnalisées  
✅ Tester les badges de plateformes (dont "autre" → Gîtes de France)  
✅ Valider le responsive sur plusieurs colonnes  
✅ Tester les performances avec plus de données

---

## 🔄 Exécution multiple

Vous pouvez exécuter ces scripts plusieurs fois :
- **Création** : détecte automatiquement l'organisation existante
- **Suppression** : vérifie l'existence des gîtes avant suppression
- Pas de risque de doublons (slug unique)

---

**Date de création :** 10 janvier 2026  
**Auteur :** Scripts automatisés de test
