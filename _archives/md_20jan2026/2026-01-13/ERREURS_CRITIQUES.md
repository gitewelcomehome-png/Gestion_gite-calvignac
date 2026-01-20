# Erreurs Critiques & Solutions

> **Objectif:** Tracer les erreurs critiques rencontrées et leurs solutions pour éviter les régressions

---

## 📋 Format d'Entrée

```
### [DATE] - Titre de l'erreur

**Contexte:**
Description de la situation

**Erreur:**
Message d'erreur exact ou comportement

**Cause:**
Origine du problème

**Solution:**
Comment le problème a été résolu

**Prévention:**
Ce qu'il faut faire pour éviter que ça se reproduise

---
```

---

## 🔴 Erreurs Référencées

### [13 Janvier 2026] - Initialisation du fichier

**Note:** Ce fichier sera alimenté au fur et à mesure des erreurs critiques rencontrées.

---

<!-- NOUVELLES ERREURS À AJOUTER CI-DESSOUS -->

### [13 Janvier 2026] - Réservations fantômes (1 jour) bloquant le calendrier

**Contexte:**
Des réservations d'1 jour (ou moins) créées automatiquement par les imports iCal bloquent le calendrier

**Erreur:**
- Réservations visibles dans la BDD mais pas à l'écran
- Calendrier bloqué sur certaines dates
- Réservations fantômes encombrant la base

**Cause:**
Filtres insuffisants : `>= 1` au lieu de `> 1`

**Solution:**
1. Script SQL créé : `sql/SUPPRIMER_RESERVATIONS_FANTOMES.sql`
2. Filtre modifié dans `js/supabase-operations.js` : `r.nuits > 1`
3. Filtre déjà correct dans `js/checklists.js` et `js/dashboard.js`

**Prévention:**
- Toujours filtrer les réservations avec `> 1` nuit
- Nettoyer régulièrement les fantômes si imports iCal défectueux

---
