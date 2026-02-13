# Backup Documentation Système d'Abonnements

**Date de sauvegarde :** 12 février 2026

## 📄 Fichiers sauvegardés

1. **PROPOSITION_ABONNEMENTS.md** (46 pages)
   - Proposition commerciale complète du système d'abonnements
   - 3 plans : Solo (10€), Duo (15€), Quattro (23€)
   - Matrice des fonctionnalités par niveau
   - Structure de support réaliste (email + RDV téléphone)
   - Recommandation chat Crisp (optionnel)
   - Note sur Gîtes de France (négociation fédération)
   - Projections business (18k-92k€/an)
   - Plan d'implémentation 18h

2. **IMPLEMENTATION_ABONNEMENTS.md** (997 lignes)
   - Guide technique complet d'implémentation
   - Schéma SQL Supabase (3 tables + RLS)
   - Classe JavaScript SubscriptionManager
   - Fonctions de contrôle des fonctionnalités
   - CSS complet pour features verrouillées et modales
   - Patterns HTML avec data-attributes
   - Guide d'intégration Crisp chat (2-3h)
   - Checklist d'implémentation phase par phase

## 🎯 État au moment de la sauvegarde

- ✅ Documentation finalisée et cohérente
- ✅ Support réaliste pour opérateur solo :
  - Solo : Email 48h ouvrées
  - Duo : Email prioritaire 24h ouvrées
  - Quattro : Email VIP 4h + RDV téléphone + WhatsApp
- ✅ Features JSONB : `support_level` = "email", "email_priority", "email_vip"
- ✅ Chat Crisp documenté comme option future
- ✅ Gîtes de France clarifié (négociation fédération, pas option client)

## 🚀 Prochaine étape

**Phase 1 - Création tables Supabase (2h)**
- Créer subscriptions_plans, user_subscriptions, subscription_usage
- Insérer les 3 plans avec features JSONB
- Configurer RLS et indexes
- Tout le code SQL prêt dans IMPLEMENTATION_ABONNEMENTS.md

## 📋 Feature Gating

| Fonctionnalité | SOLO | DUO | QUATTRO |
|----------------|------|-----|---------|
| Gîtes max | 1 | 2 | 4 |
| AI Autocomplétion | ❌ | ✅ | ✅ |
| Tableau GDF | ❌ | ✅ | ✅ |
| AI Communication/Conseil | ❌ | ❌ | ✅ |
| Accès API | ❌ | ❌ | ✅ |
| Formations | ❌ | 📹 Vidéos | 👤 1h perso |

## 🔗 Technologie

- **Base de données :** Supabase (PostgreSQL + RLS)
- **Paiement :** Stripe (3 produits × 2 prix engagé/sans engagement)
- **Chat (optionnel) :** Crisp (gratuit jusqu'à 2 agents)
- **Frontend :** Vanilla JavaScript + CSS
- **Mobile :** iOS app (Expo) - à synchroniser

---

**Sauvegarde créée le 12/02/2026 avant démarrage Phase 1 d'implémentation.**
