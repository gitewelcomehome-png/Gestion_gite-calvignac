# Plan de tests CH avec resultats attendus

Date: 27/03/2026
Perimetre: Fiscalite Chambres d'hotes (CH) uniquement
Cible: tabs/tab-fiscalite-v2.html + js/fiscalite-v2.js
Version: 1.1 (pret pour validation IA)

## Objectif du document
Ce document est destine a une IA de verification pour confirmer que les corrections CH sont conformes.
La validation doit se faire test par test, avec preuves observables et verdict final GO/NO-GO.

## Mode d'utilisation par IA (strict)
1. Executer les TC dans l'ordre TC-01 a TC-12.
2. Pour chaque TC, fournir un verdict: PASS, FAIL ou BLOCKED.
3. En cas de FAIL, indiquer:
   - valeur observee
   - valeur attendue
   - ecart
   - hypothese de cause
4. Ne jamais compenser un FAIL par un autre PASS.
5. Produire un verdict global uniquement a la fin.

## Preconditions
- Serveur local actif: http://127.0.0.1:8080/app.html
- Aller dans l'onglet Fiscalite.
- La section CH doit etre visible (au moins 1 hebergement CH detecte).
- Pour les tests chiffrés stables, mettre:
  - Salaire Madame = 0
  - Salaire Monsieur = 0
  - Nombre d'enfants = 0
  - Statut CH = Micro-BIC (sauf cas specifique)
  - Option VL decochee (sauf cas specifique)

## Rappels d'affichage
- Les cartes CH affichent en euros arrondis a l'unite.
- Le report CH vers IR (ch-report-lmp) est affiche en 2 decimales.

---

## TC-01 - Taux patrimoine CH 18,6% (sous seuil SSI)
Objectif: verifier que le taux patrimoine n'est plus 17,2%.

Etapes:
1. Annee simulation = 2026.
2. CA CH = 12 000.
3. Verifier que base imposable = 6 000 (50%).
4. Base 6 000 < seuil SSI 2026 (6 248), donc regime patrimoine.

Resultat attendu:
- Cotisations micro CH = 6 000 x 18,6% = 1 116,00 EUR.
- Champ ch-cotis-micro-standard doit afficher environ 1 116 EUR.
- Champ ch-total-micro-standard doit etre identique si IR = 0.

---

## TC-02 - Seuil SSI dynamique par annee (2025 vs 2026)
Objectif: verifier le calcul 13% PASS par annee.

Donnees communes:
- CA CH = 12 300
- Base micro = 6 150

Etapes A (annee 2025):
1. Annee simulation = 2025.
2. Seuil attendu = 13% x 47 100 = 6 123.
3. Base 6 150 > 6 123 => taux activite 21,2%.

Resultat attendu A:
- Cotisations micro = 12 300 x 21,2% = 2 607,60 EUR (~2 608 EUR affiche).

Etapes B (annee 2026):
1. Annee simulation = 2026.
2. Seuil attendu = 13% x 48 060 = 6 248.
3. Base 6 150 < 6 248 => taux patrimoine 18,6% sur la base.

Resultat attendu B:
- Cotisations micro = 6 150 x 18,6% = 1 143,90 EUR (~1 144 EUR affiche).

---

## TC-03 - Abattement historique (2024 vs 2025+)
Objectif: verifier 71% en 2024 puis 50% a partir de 2025.

Etapes:
1. CA CH = 20 000.
2. Tester annee 2024 puis 2025.

Resultat attendu:
- Annee 2024: base imposable = 20 000 x 29% = 5 800.
- Annee 2025: base imposable = 20 000 x 50% = 10 000.
- Les conditions micro doivent refléter la base correspondante.

---

## TC-04 - IR micro calcule sur la base micro brute (correction majeure)
Objectif: verifier que les cotisations ne sont plus deduites de la base IR micro.

Etapes:
1. Mettre des salaires suffisants pour avoir une TMI > 0 (ex: 80 000 au total foyer).
2. Annee 2026, CA CH = 30 000.
3. Option micro standard.

Reference attendue:
- Base micro = 15 000.
- Cotisations micro (si seuil atteint): 30 000 x 21,2% = 6 360.
- IR micro doit etre calcule sur 15 000 (et non 8 640).

Resultat attendu:
- ch-ir-micro-standard doit correspondre a l'impact IR de +15 000 de revenu location.
- Le micro ne doit plus etre artificiellement trop avantageux.

---

## TC-05 - VL conserve a 1% et parametre
Objectif: verifier formule VL.

Etapes:
1. Annee 2026, CA CH = 20 000.
2. Cocher Option VL.

Resultat attendu:
- IR VL = 20 000 x 1% = 200 EUR.
- ch-ir-vl ~ 200 EUR.
- ch-total-vl = cotisations micro + 200 EUR.

---

## TC-06 - Seuil TVA double (37 500 et 41 250)
Objectif: verifier les 2 paliers d'alerte TVA.

Etapes A:
1. CA CH = 38 000.

Resultat attendu A:
- Alerte TVA visible en mode "franchise depassee" (jaune).
- Message: TVA applicable au 1er janvier N+1.

Etapes B:
1. CA CH = 42 000.

Resultat attendu B:
- Alerte TVA visible en mode "seuil majore depasse" (rouge).
- Message: TVA applicable immediatement.

---

## TC-07 - Frais notaire mode immediat vs amortissement
Objectif: verifier le choix de traitement fiscal notaire.

Donnees:
- ch-frais-notaire = 10 000
- Laisser les autres charges CH a 0

Etapes A (immediat):
1. ch-frais-notaire-mode = immediat.
2. Statut CH = reel.

Resultat attendu A:
- 10 000 est pris dans charges courantes de l'annee.
- Warning "option art. 38 quinquies" visible.

Etapes B (amortissement):
1. ch-frais-notaire-mode = amortissement.

Resultat attendu B:
- Charge annuelle notaire = 10 000 / 25 = 400 EUR (par defaut).
- Warning d'amortissement visible.
- Le total charges reel baisse fortement par rapport au mode immediat.

---

## TC-08 - Eligibilite VL via RFR N-2
Objectif: verifier l'alerte d'eligibilite.

Etapes:
1. Nombre d'enfants = 0 (2 parts).
2. Seuil indicatif par part 2026 = 29 315 => foyer 58 630.
3. Saisir ch-rfr-n2 = 70 000.
4. Statut CH micro.

Resultat attendu:
- Option VL desactivee ou message d'ineligibilite explicite.
- Alerte obligations mentionnant RFR N-2.

---

## TC-09 - Plafond micro > 77 700 et message 2 ans
Objectif: verifier la communication metier en cas depassement plafond.

Etapes:
1. CA CH = 80 000.
2. Statut CH micro.

Resultat attendu:
- Carte micro desactivee en simulation prudente.
- Message obligations mentionne la regle legale des 2 annees consecutives.
- Report IR bascule sur reel dans la simulation.

---

## TC-10 - Cohérence option la plus economique vs option appliquee IR
Objectif: verifier l'absence d'ambiguite UI.

Etapes:
1. Utiliser un scenario ou la meilleure carte est differente du statut selectionne.
2. Observer ch-meilleure-option puis ch-option-appliquee-ir.

Resultat attendu:
- Les 2 informations sont affichees separement.
- ch-option-appliquee-ir reflete le statut/choix actif (micro, micro+VL, reel).

---

## TC-11 - Persistance des nouveaux champs CH
Objectif: verifier sauvegarde/rechargement.

Etapes:
1. Renseigner:
   - ch-rfr-n2
   - ch-frais-notaire
   - ch-frais-notaire-mode
   - quelques charges CH
2. Sauvegarder (auto ou action de sauvegarde), puis recharger l'annee.

Resultat attendu:
- Toutes les valeurs reviennent a l'identique.
- Le mode notaire reste identique apres rechargement.

---

## TC-12 - Non-regression affichage report CH
Objectif: verifier cohérence report vers IR.

Etapes:
1. Lancer calcul CH avec un cas non nul.
2. Observer:
   - ch-report-lmp
   - revenu_lmp
   - ir-revenu-ch

Resultat attendu:
- revenu_lmp = revenuImposableGites + revenuImposableCH.
- ch-report-lmp affiche le revenu CH reporte en 2 decimales.
- ir-revenu-ch affiche montant CH + libelle d'option.

---

## Definition de done (Go production)
- Tous les TC-01 a TC-12 passes.
- Aucun ecart de formule sur TC-01, TC-02, TC-04, TC-06, TC-07.
- Aucun blocage UI ni erreur console bloquante sur le parcours CH.

---

## Matrice de couverture (audit -> tests)

| Erreur audit | Sujet | Tests de preuve |
|---|---|---|
| #1 | Taux patrimoine 18,6% | TC-01, TC-02 |
| #2 | Seuil SSI dynamique (PASS) | TC-02 |
| #3 | Abattement historique 71%/50% | TC-03 |
| #4 | IR micro sur base brute | TC-04 |
| #5 | VL a 1% parametre | TC-05 |
| #6 | Cotisations micro 21,2% parametre | TC-02, TC-05 |
| #7 | Double seuil TVA 37 500 / 41 250 | TC-06 |
| #8 | Frais notaire immediat/amorti | TC-07 |
| #9 | Eligibilite VL (RFR N-2) | TC-08 |
| #10 | Message regle des 2 ans | TC-09 |

---

## Format de compte-rendu attendu (copier/coller)

### Resultats par test
| Test | Statut | Valeur observee | Valeur attendue | Ecart | Commentaire |
|---|---|---|---|---|---|
| TC-01 |  |  |  |  |  |
| TC-02 |  |  |  |  |  |
| TC-03 |  |  |  |  |  |
| TC-04 |  |  |  |  |  |
| TC-05 |  |  |  |  |  |
| TC-06 |  |  |  |  |  |
| TC-07 |  |  |  |  |  |
| TC-08 |  |  |  |  |  |
| TC-09 |  |  |  |  |  |
| TC-10 |  |  |  |  |  |
| TC-11 |  |  |  |  |  |
| TC-12 |  |  |  |  |  |

### Incidents bloquants
- (aucun) ou liste detaillee

### Verdict global
- GO: tous les tests PASS, aucun BLOCKED, aucun ecart critique
- NO-GO: au moins un FAIL critique (TC-01, TC-02, TC-04, TC-06, TC-07) ou un BLOCKED non resolu

### Actions correctives proposees (si NO-GO)
1. 
2. 
3. 

---

## Regles de severite
- Critique: erreur de formule fiscale ou de seuil legal (TC-01, TC-02, TC-04, TC-06, TC-07)
- Majeure: logique d'option ou de persistance incorrecte (TC-08, TC-09, TC-11, TC-12)
- Mineure: affichage/ergonomie sans impact formule (TC-10)
