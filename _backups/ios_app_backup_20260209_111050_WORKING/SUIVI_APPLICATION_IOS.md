# 📱 SUIVI APPLICATION iOS LIVEOWNERUNIT

**Date de création** : 9 février 2026  
**Statut** : ✅ En développement actif  
**Dossier** : `/ios_apple_app/`

---

## 🎯 OBJECTIF

Application mobile iOS pour la gestion des gîtes permettant aux propriétaires de :
- Consulter leurs réservations
- Gérer les ménages/nettoyages
- Voir les statistiques en temps réel
- Recevoir des notifications

---

## 🚀 DÉMARCHE DE TEST

### 1. Prérequis
- ✅ Compte Supabase configuré
- ✅ Variables d'environnement dans `.env`
- ✅ iPhone avec Expo Go installé
- ✅ CodeSpaces (pour développement à distance)

### 2. Commande de lancement
```bash
cd /workspaces/Gestion_gite-calvignac/ios_apple_app
npx expo start --tunnel
```

### 3. Connexion à l'app
- Scannez le QR code avec l'appareil photo iPhone
- Ouvrez dans Expo Go
- Connectez-vous avec vos identifiants web existants
- Les données sont automatiquement filtrées par `owner_user_id`

### 4. Logs en temps réel
Tous les logs de l'application s'affichent dans le terminal pendant l'utilisation :
- 🔍 Connexion utilisateur
- 📊 Chargement des données
- ❌ Erreurs éventuelles

---

## 📂 ARCHITECTURE DES FICHIERS

### 🔐 Authentification
| Fichier | Rôle | Status |
|---------|------|--------|
| `app/(auth)/login.tsx` | Écran de connexion | ✅ Corrigé (texte visible) |
| `providers/auth-provider.tsx` | Gestion session Supabase | ✅ Fonctionnel |
| `app/_layout.tsx` | Navigation auth/dashboard | ✅ Fonctionnel |

### 📊 Dashboard et Données
| Fichier | Rôle | Status |
|---------|------|--------|
| `app/(tabs)/index.tsx` | Dashboard principal | ✅ Fonctionnel avec owner_user_id |
| `app/(tabs)/calendar.tsx` | Calendrier réservations | 🔄 À développer |
| `app/(tabs)/cleaning.tsx` | Gestion ménages | 🔄 À développer |
| `app/(tabs)/stats.tsx` | Statistiques détaillées | 🔄 À développer |
| `app/(tabs)/settings.tsx` | Paramètres utilisateur | 🔄 À développer |

### 🔧 Configuration
| Fichier | Rôle | Status |
|---------|------|--------|
| `.env` | Variables Supabase (URL, Key) | ✅ Configuré |
| `constants/config.ts` | Chargement variables env | ✅ Fonctionnel |
| `services/supabase.ts` | Client Supabase | ✅ Fonctionnel |

### 🎨 Composants Réutilisables
| Fichier | Rôle | Status |
|---------|------|--------|
| `components/kpi-card.tsx` | Carte statistique | ✅ Utilisé |
| `components/reservation-card.tsx` | Carte réservation | ✅ Utilisé |
| `components/cleaning-card.tsx` | Carte ménage | ✅ Utilisé |
| `components/error-banner.tsx` | Bandeau erreur | ✅ Utilisé |
| `components/empty-state.tsx` | État vide | ✅ Utilisé |

### 📦 Types et Utilitaires
| Fichier | Rôle | Status |
|---------|------|--------|
| `types/models.ts` | Types TypeScript (Reservation, Gite, etc.) | ✅ Défini |
| `utils/dates.ts` | Fonctions gestion dates | ✅ Fonctionnel |

---

## 🔑 POINTS CLÉS TECHNIQUES

### Filtrage par utilisateur
**Toutes les requêtes Supabase** incluent `.eq('owner_user_id', user.id)` :
```typescript
const { data } = await supabase
  .from('reservations')
  .select('*')
  .eq('owner_user_id', user.id)  // ← ESSENTIEL
  .gte('check_in', today);
```

### Structure base de données
Chaque table a une colonne `owner_user_id` :
- `reservations.owner_user_id` → UUID de l'utilisateur
- `gites.owner_user_id` → UUID de l'utilisateur
- `cleaning_schedule.owner_user_id` → UUID de l'utilisateur

### Politiques RLS Supabase
Les politiques RLS existantes vérifient automatiquement `owner_user_id = auth.uid()`.

---

## 🐛 CORRECTIFS APPLIQUÉS

### ✅ 8-9 février 2026
1. **Problème** : Texte noir sur fond noir dans login
   - **Solution** : Ajout `backgroundColor: '#ffffff'` dans input styles
   - **Fichier** : `app/(auth)/login.tsx`

2. **Problème** : Requêtes retournaient 0 données
   - **Solution** : Ajout `.eq('owner_user_id', user.id)` sur toutes les requêtes
   - **Fichier** : `app/(tabs)/index.tsx`

3. **Problème** : Variables d'environnement non chargées
   - **Solution** : Redémarrage Expo avec `--clear` force le rechargement
   - **Commande** : `npx expo start --tunnel --clear`

---

## 📋 FONCTIONNALITÉS ACTUELLES

### ✅ Implémentées
- [x] Authentification email/mot de passe
- [x] Dashboard avec KPI (réservations, gîtes, ménages)
- [x] Liste des 3 prochaines arrivées
- [x] Liste des ménages du jour
- [x] Pull-to-refresh
- [x] Déconnexion
- [x] Filtrage automatique par owner_user_id

### 🔄 En cours
- [ ] Onglet Calendrier
- [ ] Onglet Ménages
- [ ] Onglet Statistiques
- [ ] Onglet Paramètres

### 📅 Prévues
- [ ] Notifications push
- [ ] Mode hors ligne
- [ ] Synchronisation en temps réel
- [ ] Ajout/modification de réservations
- [ ] Export PDF des réservations
- [ ] Photos des ménages

---

## 🚨 PROBLÈMES CONNUS

Aucun problème bloquant actuellement.

---

## 📞 SUPPORT

### Logs de débogage
Les logs s'affichent dans le terminal pendant l'utilisation de l'app :
```
LOG  🔍 Config chargée:
LOG    - SUPABASE_URL: ✅ Défini
LOG  🔄 loadData appelé
LOG  👤 Utilisateur: [uuid] [email]
LOG  ✅ Réservations chargées: X résultats
```

### En cas d'erreur
1. Vérifier que les variables `.env` sont présentes
2. Relancer Expo avec `--clear`
3. Vérifier la console pour les logs détaillés
4. Tester la connexion Supabase dans le navigateur

---

## 📝 HISTORIQUE DES VERSIONS

### v0.1.0 - 9 février 2026
- ✅ Authentification fonctionnelle
- ✅ Dashboard avec données réelles
- ✅ Correction problème texte invisible
- ✅ Filtrage par owner_user_id

---

## 🎯 PROCHAINES ÉTAPES

1. **Priorité 1** : Implémenter onglet Calendrier
2. **Priorité 2** : Implémenter onglet Ménages avec statuts
3. **Priorité 3** : Notifications push
4. **Priorité 4** : Mode hors ligne basique

---

## 📚 RESSOURCES

- [Documentation Expo](https://docs.expo.dev/)
- [Documentation Supabase](https://supabase.com/docs)
- [React Native](https://reactnative.dev/)
- [README principal](./README_UTILISATION.md)
