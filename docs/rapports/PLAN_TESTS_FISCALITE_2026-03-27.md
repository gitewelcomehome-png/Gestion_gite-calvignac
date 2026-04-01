# Plan de tests complet — Fiscalite (LMNP/LMP/Micro/CH/IR/RAV)

Date: 27/03/2026
Portee: page Fiscalite complete (comparatif 4 options, regime reel, IR, reste a vivre, CH, sauvegarde/restauration)

## 1) Conditions prealables

- Etre connecte avec un compte proprietaire valide.
- Avoir au moins 1 gite actif (idealement 2 pour verifier les sommes multi-biens).
- Ouvrir la page Fiscalite.
- Selectionner l'annee de test dans le select d'annee.
- Verifier que le mode test est disponible (champ CA de test present).

## 2) Regles de validation globales (a appliquer sur tous les tests)

- Aucun crash UI, aucune erreur console bloquante.
- Les cartes non eligibles doivent afficher N/A et etre grisees.
- Les montants changent immediatement apres saisie/clic (recalcul temps reel).
- Les labels IR/VL doivent refléter l'option active (ex: IR: ou VL 1% / VL 1,7%).
- Les sauvegardes doivent restaurer les memes valeurs apres rechargement d'annee.

## 3) Jeu de donnees de reference complet (a saisir une fois)

Utiliser ce jeu pour les tests E2E principaux.

### 3.1 Bloc principal et comparatif

- Statut fiscal: LMNP
- CA annuel: 20000
- Classement meuble: Non classe
- Confirmation micro-entrepreneur: decochee
- Option versement liberatoire: decochee

### 3.2 Residence principale (partie reel)

- Surface bureau: 15
- Surface totale: 100
- Interets residence: 450 (mensuel)
- Assurance residence: 45 (mensuel)
- Electricite residence: 95 (mensuel)
- Internet residence: 39 (mensuel)
- Eau residence: 28 (mensuel)
- Assurance habitation residence: 22 (mensuel)
- Taxe fonciere residence: 1200 (annuel)

### 3.3 Frais professionnels (partie reel)

- Comptable: 1200
- Frais bancaires: 240
- Telephone: 35 (mensuel)
- Materiel info: 900
- RC Pro: 250
- Formation: 300
- Fournitures: 40 (mensuel)

### 3.4 Vehicule (partie reel)

- Ouvrir configuration vehicule -> Type thermique, 5 CV
- Ouvrir gestion trajets -> ajouter 3 trajets:
  - 15/03/2026, type Gestion, motif Menage entree, depart Domicile, destination Gite A, distance auto
  - 18/03/2026, type Maintenance, motif Intervention plomberie, depart Domicile, destination Gite A, distance auto
  - 22/03/2026, type Administratif, motif Banque/Assurance, depart Domicile, destination Autre (agence), distance auto
- Verifier resume km annuel > 0 et montant total > 0

### 3.5 Charges dynamiques (travaux/frais/produits)

- Travaux: 2 lignes
  - Ligne 1: description Peinture salon, gite A, montant 1800, type amortissement "travaux"
  - Ligne 2: description Reparation serrure, gite A, montant 220, type amortissement vide (charge immediate)
- Frais divers: 2 lignes
  - Ligne 1: description Frais de deplacement pro, gite A, montant 350, type amortissement vide
  - Ligne 2: description Petit equipement, gite A, montant 620, type amortissement "materiel"
- Produits accueil: 1 ligne
  - Ligne 1: description Panier accueil, gite A, montant 480, type amortissement vide

### 3.6 IR foyer

- Salaire madame: 24000
- Salaire monsieur: 16000
- Nombre enfants: 2
- Frais salarie: laisser forfait pour test de base

### 3.7 Credits et RAV

- Ajouter 1 credit immobilier:
  - Mensualite: 950
  - Capital restant: 120000
  - Interets annuels: 4200
- Ajouter 1 credit personnel:
  - Mensualite: 180
  - Capital restant: 8000
- Frais perso:
  - Internet: 35
  - Electricite: 95
  - Eau: 30
  - Assurance: 65
  - Taxe (annuelle): 900
  - Autres: 250

## 4) Jeux de tests detailes (clic par clic)

## JT-01 — Sanity complete de la page

Objectif: verifier le chargement global et le recalcul temps reel.

Etapes:
1. Ouvrir la page Fiscalite.
2. Selectionner l'annee en cours dans le select d'annee.
3. Remplir le jeu de donnees de reference (sections 3.1 a 3.7).
4. Ouvrir/fermer chaque bloc repliable une fois.
5. Verifier que le comparatif, les resultats fiscaux, IR et RAV sont alimentes.

Resultats attendus:
- Aucun bloc vide anormal.
- Les montants principaux sont non nuls (si CA/frais > 0).
- Pas de gel de l'interface.

## JT-02 — VL reserve micro-entrepreneur (nouvelle regle)

Objectif: valider le verrou metier VL.

Etapes:
1. Dans Comparatif, choisir statut fiscal "Micro-BIC".
2. Mettre CA dans plafond micro (ex: 15000 non classe).
3. Laisser "Je confirme etre declare en micro-entreprise" decoche.
4. Tenter de cocher "Versement liberatoire".
5. Cocher ensuite la confirmation micro-entrepreneur.
6. Cocher "Versement liberatoire".

Resultats attendus:
- Etape 4: VL reste desactive et message d'ineligibilite affiche.
- Etape 6: VL devient activable.
- Le label des cartes micro passe de IR a VL (1% ou 1,7%) selon classement.

## JT-03 — Exclusion stricte des options non eligibles (N/A)

Objectif: verifier la purge des residus visuels sur cartes ineligibles.

Etapes:
1. Statut LMNP, CA 30000, classement non classe.
2. Observer cartes micro non classe/classe et LMP.
3. Basculer classement vers "Classe" puis revenir "Non classe".
4. Basculer statut sur LMP force, puis revenir LMNP.

Resultats attendus:
- Toute carte ineligible affiche N/A sur total ET sous-lignes (cotis/IR).
- Aucune ancienne valeur n'est conservee sur une carte grisee.
- La meilleure option ne considere que les cartes eligibles.

## JT-04 — Cas limite LMNP < 23k (PS patrimoine 18,6%)

Objectif: verifier exoneration URSSAF LMNP + application PS patrimoine.

Donnees:
- CA 20000
- Benefice reel cible positif (utiliser le jeu de reference)
- Salaires foyer 40000
- 2 parts

Etapes:
1. Statut LMNP, CA 20000.
2. Remplir frais pour garder un benefice reel positif.
3. Noter URSSAF LMNP reel, IR LMNP reel et total LMNP reel.

Attendu metier:
- URSSAF LMNP = 0 si CA < 23000.
- Les PS patrimoine sont integres dans le cout total LMNP.

Reference numerique de controle:
- Sur le scenario theorique (benefice 12000, salaires 40000, 2 parts):
  - PS patrimoine: 2232
  - Quote-part IR location: 719,66
  - Total LMNP reel: 2951,66

## JT-05 — Cas limite LMP deficitaire (imputation autorisee)

Objectif: verifier deficit LMP imputable au revenu global.

Donnees:
- Statut LMP
- CA 30000
- Benefice reel negatif (forcer charges > CA)
- Salaires 50000

Etapes:
1. Passer statut a LMP.
2. Monter les charges pour obtenir un benefice reel negatif.
3. Relever IR avec et sans effet location (en observant la baisse d'IR).

Resultats attendus:
- Cotisations minimales LMP appliquees si necessaire.
- Impact IR de la location peut etre negatif (reduction d'IR).
- Pas d'erreur de signe dans total LMP.

Reference numerique theorique:
- benefice -5000, salaires 50000:
  - URSSAF LMP: 1200
  - Impact IR: -990,61
  - Total LMP: 209,39

## JT-06 — Cas limite Micro non classe au plafond + comparaison VL

Objectif: verifier calcul micro et effet VL.

Donnees:
- Statut Micro-BIC
- Classement non classe
- CA 15000
- Salaires 0

Etapes:
1. Cocher confirmation micro-entrepreneur.
2. Mesurer total micro sans VL.
3. Cocher VL puis relever total micro.

Resultats attendus:
- Sans VL: cotisations/PS calculees correctement sur base micro.
- Avec VL: taxe VL ajoutee (1,7% du CA) et label VL visible.

Reference theorique:
- Sans VL: 1953
- Avec VL: 2208
- Ecart: +255 (VL moins favorable dans ce cas)

## JT-07 — IR foyer (QF + decote + frais salarie)

Objectif: verifier robustesse calcul IR.

Etapes:
1. Saisir salaires madame/monsieur + enfants.
2. Noter IR montant.
3. Ouvrir modal frais salarie madame -> choisir frais reels -> saisir km/cv/peages -> valider.
4. Refaire pour monsieur avec un autre profil.
5. Relever IR montant apres frais reels.

Resultats attendus:
- IR se recalcule apres validation de chaque modal.
- Le nombre de parts est coherent avec les enfants.
- L'IR baisse si frais reels > forfait 10%.

## JT-08 — RAV avec deduction IR mensuel

Objectif: verifier que l'IR annuel est bien deduit au mois dans les depenses RAV.

Etapes:
1. Remplir credits + frais perso + IR (via salaires/revenus).
2. Relever "rav-total-depenses".
3. Modifier fortement les salaires pour augmenter IR.
4. Relever de nouveau "rav-total-depenses" et "rav-final".

Resultats attendus:
- Les depenses RAV augmentent quand l'IR augmente.
- Le reste a vivre diminue en consequence.

## JT-09 — Credits: interets annuels vs mensualites

Objectif: verifier l'assiette fiscale reel avec interets annuels.

Etapes:
1. Ajouter un credit immobilier avec mensualite forte et interets annuels faibles.
2. Observer le benefice imposable reel.
3. Doubler uniquement les interets annuels et recalculer.
4. Doubler uniquement la mensualite et recalculer.

Resultats attendus:
- Benefice/charges fiscales varient avec interets annuels.
- Le changement de mensualite seule ne doit pas impacter l'assiette fiscale reel.

## JT-10 — Sauvegarde/rechargement annee

Objectif: verifier persistance de toutes les donnees critiques.

Etapes:
1. Cliquer Sauvegarder.
2. Changer d'annee puis revenir.
3. Verifier restauration de:
   - statut fiscal, classement, CA
   - confirmation micro-entrepreneur + option VL
   - IR salaires/enfants
   - credits (dont interets annuels)
   - frais perso
   - donnees CH (statut, RFR N-2, frais notaire mode)

Resultats attendus:
- Toutes les valeurs reviennent a l'identique.
- Le comparatif et RAV sont recalcules correctement apres restauration.

## JT-11 — Parcours Chambres d'hotes (CH) complet

Objectif: verifier le moteur CH micro/VL/reel et alertes reglementaires.

Etapes:
1. Activer section CH (si depend des options personnelles).
2. Saisir CA CH annuel.
3. Saisir RFR N-2.
4. Tester statut CH Micro puis Reel.
5. Tester option VL CH cochee/decochée.
6. Remplir section compta CH complete (surfaces, charges maison, charges activite, interets, notaire + mode).

Resultats attendus:
- Cartes CH (micro standard, VL, reel) se mettent a jour.
- Alertes TVA/plafond/cotisations apparaissent selon CA.
- Le mode frais notaire modifie les resultats (immediat vs amortissement).

## JT-12 — Robustesse UI (modales et actions auxiliaires)

Objectif: garantir l'absence de regression sur les actions annexes.

Etapes:
1. Ouvrir/fermer modal options personnelles.
2. Ouvrir/fermer modal ajout solde + enregistrer un solde.
3. Ouvrir historique soldes + actualiser.
4. Ouvrir modal trajet, ajouter un trajet, exporter CSV trajets.

Resultats attendus:
- Toutes les modales s'ouvrent et se ferment correctement.
- Les actions n'effacent pas les saisies fiscales existantes.

## 5) Checklist de cloture (Go/No-Go)

- [ ] JT-01 a JT-12 executes
- [ ] 0 erreur bloquante
- [ ] 0 incoherence metier critique
- [ ] VL verrouille correctement par confirmation micro-entrepreneur
- [ ] Options ineligibles toujours en N/A (sans residu)
- [ ] RAV deduit bien l'IR mensuel
- [ ] Sauvegarde/restauration fiable

## 6) Mode de compte-rendu recommande

Pour chaque JT:
- Statut: OK / KO
- Capture: avant/apres (si KO)
- Valeur observee vs valeur attendue
- Etapes exactes pour reproduire
- Correctif propose
