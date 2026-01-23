# 🛏️ Onglet Gestion des Draps - Guide d'utilisation

## Installation Supabase

**1. Créer la table dans Supabase :**
Connectez-vous à Supabase et exécutez le script SQL :
```bash
sql/create_stocks_draps.sql
```

Cela créera :
- La table `stocks_draps` avec tous les champs nécessaires
- Les données initiales pour Trévoux et Couzon (valeurs à 0)

## Fonctionnalités

### 1. Configuration des besoins
L'onglet affiche automatiquement les besoins par réservation pour chaque gîte :

**Trévoux** (6 lits doubles + 3 lits simples) :
- 6 draps plats grands
- 3 draps plats petits  
- 6 housses de couette grandes
- 3 housses de couette petites
- 15 taies d'oreillers
- 15 serviettes
- 3 tapis de bain

**Couzon** (4 lits doubles + 3 lits simples) :
- 4 draps plats grands
- 3 draps plats petits
- 4 housses de couette grandes
- 3 housses de couette petites
- 11 taies d'oreillers
- 11 serviettes
- 2 tapis de bain

### 2. Saisir vos stocks
1. Remplissez les champs de stock pour chaque gîte
2. Cliquez sur "💾 Sauvegarder les Stocks"
3. Les données sont enregistrées dans Supabase

### 3. Réservations Couvertes
Affiche automatiquement :
- Combien de réservations vous pouvez assurer avec vos stocks actuels
- Alertes visuelles :
  - ✅ Vert : Stock suffisant
  - ⚠️ Orange : Stock limite
  - ❌ Rouge : Stock insuffisant - commander rapidement

### 4. À Emmener dans les Gîtes
Calcule automatiquement ce qu'il faut préparer pour les 3 prochaines réservations de chaque gîte.

### 5. Simulation des Besoins Futurs
1. Sélectionnez une date limite
2. Cliquez sur "🔍 Calculer"
3. Le système affiche :
   - Nombre de réservations jusqu'à cette date
   - Total nécessaire par article
   - Stock actuel
   - **Ce qu'il faut commander** (avec badges rouge si manque)

## Exemple d'utilisation

### Scenario : Vous recevez un stock de draps

1. Allez dans l'onglet "🛏️ Gestion Draps"
2. Remplissez vos nouveaux stocks :
   - Trévoux : 30 draps plats grands, 15 draps plats petits, etc.
   - Couzon : 20 draps plats grands, 12 draps plats petits, etc.
3. Sauvegardez
4. Consultez "Réservations Couvertes" pour voir combien de réservations vous pouvez gérer
5. Regardez "À Emmener" pour préparer les prochains déplacements

### Scenario : Planifier une commande

1. Allez dans "Simulation des Besoins Futurs"
2. Sélectionnez par exemple le 30 juin 2026
3. Cliquez sur "Calculer"
4. Vous voyez un tableau détaillé montrant :
   - ✅ Les articles suffisants en stock
   - ❌ Les articles à commander avec les quantités exactes

## Notes importantes

- Les calculs se basent sur les réservations **confirmées** dans la table `reservations`
- Les stocks sont partagés entre les deux gîtes (réserve centrale)
- La simulation prend en compte uniquement les réservations avec date d'arrivée dans la période
- Pensez à mettre à jour vos stocks régulièrement après chaque commande ou utilisation
