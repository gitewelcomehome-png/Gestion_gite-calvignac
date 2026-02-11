# 📖 Guide Opérationnel - Gestion Gîte Calvignac

Guide unifié des procédures et opérations courantes.

---

## 🧹 Espace Femme de Ménage

### Accès
1. Connexion avec compte dédié
2. Onglet "Planning Ménages"
3. Vue planning semaine/mois

### Fonctionnalités
- ✅ Visualisation planning automatique
- ✅ Marquer ménages effectués
- ✅ Ajouter notes/observations
- ✅ Historique interventions

### Règles Automatiques
Le système génère automatiquement le planning selon :
- Durée entre réservations
- Type de passage (court/long)
- Gîte concerné
- Règles métier configurées

**Référence** : GUIDE_ESPACE_FEMME_MENAGE.md, GUIDE_REGLES_MENAGE.md

---

## 🛏️ Gestion des Draps

### Stock
- Inventaire par type (draps, housses, taies)
- Seuils d'alerte automatiques
- État (propre/sale/repassage)

### Besoins Automatiques
Le système calcule les besoins selon :
- Réservations à venir
- Stock disponible
- Délai lavage/repassage

### Opérations
- Enregistrer lavage
- Marquer propre/repassé
- Suivre mouvements stock
- Alertes manque

**Référence** : GUIDE_GESTION_DRAPS.md

---

## 💰 Fiscalité & Comptabilité

### Amortissements Automatiques
Le système calcule automatiquement :
- Amortissements linéaires
- Prorata temporis
- Par exercice fiscal
- Par bien/gîte

**Configuration** :
- Type bien (meuble, électroménager, travaux)
- Date acquisition
- Valeur
- Durée amortissement

**Référence** : GUIDE_AMORTISSEMENTS_AUTOMATIQUES.md

### Mise à Jour Taux Annuelle
Chaque année, ajuster :
- Taux TVA
- Taux impôts
- Barèmes kilométriques
- Charges forfaitaires

**Procédure** : GUIDE_MAJ_TAUX_ANNUELLE.md

### Frais Kilométriques
- Saisie trajets par gîte
- Calcul automatique selon barème
- Récapitulatif annuel
- Export comptable

**Référence** : GUIDE_KILOMETRES.md, IMPLEMENTATION_KILOMETRES.md

---

## 📋 Checklists

### Modèles
- Checklist arrivée client
- Checklist départ
- Checklist maintenance
- Personnalisables par gîte

### Utilisation
1. Ouvrir checklist depuis réservation
2. Cocher éléments
3. Ajouter notes si besoin
4. Marquer terminé

---

## 📱 Version Mobile

### Responsive
L'interface s'adapte automatiquement :
- Menu hamburger sur mobile
- Colonnes réduites tableaux
- Boutons tactiles agrandis
- Formulaires optimisés

### Test Rapide
**Référence** : GUIDE_TEST_MOBILE_RAPIDE.md, MOBILE_GUIDE_EXPRESS.md

---

## 🌍 Traduction Automatique

### Langues Disponibles
- Français (par défaut)
- Anglais
- Allemand
- Espagnol
- Italien
- Néerlandais

### Traduction Auto Infos Gîtes
Le système traduit automatiquement :
- Descriptions
- Équipements
- Infos pratiques
- Règlement intérieur

**Statut** : ✅ Terminé et activé  
**Référence** : TRADUCTION_MULTILINGUE_TERMINE.md, DIAGNOSTIC_TRADUCTION_AUTO.md

---

## 🔧 Dépannage

### Problèmes Courants

**Ménage ne s'affiche pas**
→ Vérifier règles définies
→ Vérifier dates réservations
→ Voir SOLUTION_PROBLEME_MENAGE.md

**Infos gîtes non sauvegardées**
→ Vérifier connexion Supabase
→ Vérifier RLS activé
→ Voir DIAGNOSTIC_INFOS_GITES.md

**Fichiers desktop protégés**
→ Voir FICHIERS_DESKTOP_PROTEGES.md

---

## 📊 Documentation Technique

**Structure tables fiscalité** : STRUCTURE_TABLES_FISCALITE.md  
**Implémentation kilomètres** : IMPLEMENTATION_KILOMETRES.md  
**Architecture complète** : [../ARCHITECTURE.md](../ARCHITECTURE.md)  
**Description site** : [../DESCRIPTION_COMPLETE_SITE.md](../DESCRIPTION_COMPLETE_SITE.md)

---

*Version 4.4 - Janvier 2026*
