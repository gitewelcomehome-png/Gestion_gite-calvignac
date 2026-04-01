# Audit calculs Chambres d'hotes - 27/03/2026

## Portee
Ce document couvre uniquement les chiffres de la section Fiscalite Chambres d'hotes (CH):
- calcul du CA CH
- calcul des 3 options fiscales CH (Micro standard, Micro + VL, Reel)
- regles de selection de l'option appliquee au report IR
- details des champs UI utilises

Sources techniques:
- HTML: tabs/tab-fiscalite-v2.html
- JS: js/fiscalite-v2.js

## 1) Inventaire complet des champs CH

### 1.1 Champs de pilotage
- ch-statut-fiscal: choix du regime CH (micro ou reel)
- ch-tmi-auto: TMI foyer calcule automatiquement
- ch-option-vl: activation de l'option VL 1%
- ch-test-ca-input: valeur de CA CH de test
- ch-ca-annuel: CA CH annuel utilise par le moteur
- ch-ca-source: texte indiquant la provenance du CA

### 1.2 Champs de comptabilite reel CH
- ch-surface-totale
- ch-surface-utilisee
- ch-ratio-surface (affichage)
- ch-charge-electricite-maison
- ch-charge-eau-maison
- ch-charge-gaz-maison
- ch-charge-internet-maison
- ch-charge-assurance-pno
- ch-charge-taxe-fonciere
- ch-charge-linge
- ch-charge-menage
- ch-charge-commissions
- ch-charge-comptable
- ch-charge-frais-bancaires
- ch-charge-interets-emprunt
- ch-charge-assurance-emprunteur
- ch-charge-frais-dossier
- ch-frais-notaire

### 1.3 Sorties et affichages CH
- ch-total-micro-standard
- ch-cotis-micro-standard
- ch-ir-micro-standard
- ch-conditions-micro-standard
- ch-total-vl
- ch-cotis-vl
- ch-ir-vl
- ch-conditions-vl
- ch-total-reel
- ch-cotis-reel
- ch-ir-reel
- ch-conditions-reel
- ch-meilleure-option
- ch-report-lmp
- ch-avantage
- ch-alerte-obligations
- ch-alerte-obligations-message
- ch-alerte-plafond
- ch-alerte-tva
- ch-alerte-cotisations
- badges et overlays de cartes: ch-badge-*, ch-desactive-*

## 2) Parametres fiscaux utilises

Dans calculerFiscaliteCH, constantes appliquees:
- abattement micro CH: 50%
- plafond micro CH: 77 700 EUR
- seuil TVA CH: 37 500 EUR
- cotisations activite CH: 21,2%
- prelevements patrimoine: 17,2%
- seuil affiliation: 6 248 EUR

## 3) Calcul du CA CH

Fonction: synchroniserCaChDepuisReservations

Regles:
1. Si mode test CH actif et pas de force refresh, conserver la valeur de test.
2. Charger les hebergements et filtrer ceux detectes comme chambres d'hotes.
3. Charger toutes les reservations.
4. Conserver les reservations CH de l'annee de simulation (annee du check-in).
5. Calculer:

CA_CH = somme(montant reservation)

Montant reservation lu via total_price, sinon montant.

## 4) Calcul des charges reelles CH

Fonction: calculerChargesReellesCH

### 4.1 Prorata surface
ratio_surface = clamp(ch-surface-utilisee / ch-surface-totale, 0, 1)

### 4.2 Charges maison proratifiees
charges_maison_proratisees =
(ch-charge-electricite-maison
+ ch-charge-eau-maison
+ ch-charge-gaz-maison
+ ch-charge-internet-maison
+ ch-charge-assurance-pno
+ ch-charge-taxe-fonciere)
* ratio_surface

### 4.3 Charges courantes CH
charges_courantes =
charges_maison_proratisees
+ ch-charge-linge
+ ch-charge-menage
+ ch-charge-commissions
+ ch-charge-comptable
+ ch-charge-frais-bancaires
+ ch-charge-interets-emprunt
+ ch-charge-assurance-emprunteur
+ ch-charge-frais-dossier
+ ch-frais-notaire

### 4.4 Charges/Amortissements issus des listes globales
Le moteur recupere les listes globales Travaux/Frais divers/Produits d'accueil et ne garde que les lignes rattachees a des hebergements CH.
- sans type amortissement: charge immediate
- avec type amortissement: conversion en montant annuel amorti

### 4.5 Total charges reel CH
total_charges_reel_ch = charges_courantes + charges_immediates_liste + amortissements_liste

## 5) Calcul des 3 options CH

Fonction: calculerFiscaliteCH

Variables intermediaires:
- base_imposable_micro = CA_CH * 50%
- seuil social atteint si base_imposable_micro > 6 248

### 5.1 Option Micro standard
Cotisations:
- si seuil social atteint: cotis_micro = CA_CH * 21,2%
- sinon: cotis_micro = base_imposable_micro * 17,2%

Revenu location net pour impact IR:
revenu_location_net_micro = base_imposable_micro - cotis_micro

IR part location:
ir_micro = IR(foyer + revenu_location_net_micro) - IR(foyer)

Total micro:
total_micro = cotis_micro + ir_micro

### 5.2 Option Micro + VL 1%
Cotisations identiques au micro standard.

Versement liberatoire:
ir_vl = CA_CH * 1%

Total VL:
total_vl = cotis_micro + ir_vl

### 5.3 Option Reel BIC CH
Benefice reel:
benefice_reel = CA_CH - total_charges_reel_ch

Cotisations reel:
- si benefice_reel > 6 248: cotis_reel = benefice_reel * 21,2%
- sinon: cotis_reel = max(0, benefice_reel) * 17,2%

Revenu imposable reel CH:
revenu_imposable_reel_ch = max(0, benefice_reel - cotis_reel)

IR part location reel:
ir_reel = IR(foyer + revenu_imposable_reel_ch) - IR(foyer)

Total reel:
total_reel = cotis_reel + ir_reel

## 6) Selection de l'option appliquee au report IR

Important: la carte la moins chere affichee ne pilote pas forcement le report IR.

Regles appliquees:
1. statut CH = reel => report IR base sur option reel
2. statut CH = micro et micro autorise:
- si VL cochee => option VL appliquee
- sinon => option micro standard appliquee
3. micro non autorise (CA > 77 700) => bascule forcee vers reel

Valeur reportee:
- revenuImposableCH prend la valeur de l'option appliquee
- revenu_lmp recoit revenuImposableGites + revenuImposableCH
- ir-revenu-ch affiche montant CH + libelle du choix
- ch-report-lmp affiche le montant CH reporte

## 7) Regles d'eligibilite et alertes

- ch-alerte-plafond visible si CA_CH > 77 700
- ch-alerte-tva visible si CA_CH >= 37 500
- ch-alerte-cotisations visible si base_imposable_micro > 6 248
- ch-alerte-obligations utilise pour messages de bascule obligatoire

## 8) TMI CH

- ch-tmi-auto est derive du quotient familial calcule dans le bloc IR foyer.
- TMI retenu parmi: 0, 11, 30, 41, 45.
- ce TMI est utilise pour les calculs d'impact IR des options CH.

## 9) Causes principales d'ecarts de chiffres (a verifier en priorite)

1. Mode test CH actif (CA manuel conserve)
2. Statut CH reel/micro non conforme a l'attendu
3. Option VL cochee/decochée
4. Annee de simulation differente (filtre sur check-in)
5. TMI foyer modifie par saisies salaires/enfants
6. Charges reel CH incomplètes (surfaces, charges maison, listes globales)
7. Arrondis d'affichage differents selon zones (cartes en entier, report en 2 decimales)

## 10) Procedure de verification rapide

1. Verifier ch-ca-annuel et ch-ca-source
2. Verifier statut et VL
3. Verifier surfaces et ratio CH
4. Verifier les 15 champs de charges reel CH
5. Verifier lignes Travaux/Frais/Produits taguees CH
6. Comparer total_micro, total_vl, total_reel
7. Verifier choix applique au report (ir-revenu-ch et ch-report-lmp)
8. Verifier revenu_lmp final

## 11) References de code (audit)

- Calcul principal CH: js/fiscalite-v2.js (fonction calculerFiscaliteCH)
- Report CH vers IR: js/fiscalite-v2.js (fonction appliquerReportRevenuLmp)
- Sync CA CH depuis reservations: js/fiscalite-v2.js (fonction synchroniserCaChDepuisReservations)
- Charges reel CH: js/fiscalite-v2.js (fonction calculerChargesReellesCH)
- Detection CH: js/fiscalite-v2.js (fonction estChambreHotes)
- UI CH: tabs/tab-fiscalite-v2.html (section section-chambres-hotes)
