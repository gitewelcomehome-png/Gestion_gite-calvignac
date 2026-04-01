# Guide d'execution IA - Plan tests fiscalite

Fichiers source:
- Plan principal: docs/rapports/PLAN_TESTS_FISCALITE_AI_2026-03-27.json
- Plan humain detaille: docs/rapports/PLAN_TESTS_FISCALITE_2026-03-27.md

URL cible pour l'IA:
- Production prioritaire: https://liveownerunit.fr/app.html?tab=charges
- Fallback Vercel: https://gestion-gite-calvignac.vercel.app/app.html?tab=charges

Note authentification:
- Si la session n'est pas connectee, l'agent doit d'abord passer par la page de login puis revenir sur l'URL fiscalite.

## 1) Interpreteur d'actions (recommande)

Le JSON utilise des actions generiques. Si ton agent ne les supporte pas nativement, appliquer le mapping ci-dessous.

- assertVisible -> attendre selector visible
- assertEnabled -> verifier element non disabled
- fill -> vider puis saisir valeur
- select -> select option by value
- click -> click selector
- check -> cocher checkbox
- uncheck -> decocher checkbox
- waitMs -> pause explicite
- clickByText -> cliquer bouton ayant le texte exact
- rememberMoney -> parser texte monetaire et stocker variable
- rememberValue -> stocker value d'input/select
- rememberChecked -> stocker etat checked
- selectPreviousOption -> choisir l'option precedente du select annee_selector

## 2) Interpreteur d'assertions

- visible -> element present et visible
- enabled -> !disabled
- disabled -> disabled === true
- textEquals -> textContent trim == value
- textNotEquals -> textContent trim != value
- textContains -> textContent contient value
- textContainsAny -> textContent contient au moins 1 valeur de values[]
- moneyGreaterThan -> parseMoney(target) > value
- moneyGreaterThanOrEqual -> parseMoney(target) >= value
- moneyLessThan -> parseMoney(target) < value
- moneyGreaterThanRemembered -> parseMoney(target) > remembered[name]
- valueEqualsRemembered -> element.value == remembered[name]
- checkedEqualsRemembered -> element.checked == remembered[name]

## 3) Parse monetaire

Regle parseMoney:
1. prendre textContent
2. supprimer tout caractere sauf chiffres, point, virgule, signe moins
3. remplacer virgule par point
4. parseFloat
5. si NaN -> 0

Exemple:
- "2 951,66 €" -> 2951.66
- "N/A" -> 0

## 4) Recommandations anti-flaky

- Apres chaque fill/select/check/uncheck: attendre 100 a 200 ms
- Avant assertion de montant: attendre que le target soit non vide
- En cas de toast/save: attendre disparition toast ou 1s max
- Pour changement d'annee: attendre 1s puis re-lire les champs cibles

## 5) Selecteurs critiques

- CA: #ca
- Statut fiscal: #statut_fiscal
- Classement: #classement_meuble
- Confirmation micro-entrepreneur: #option_micro_entrepreneur_confirmee
- VL: #option_versement_liberatoire
- Message VL: #vl-eligibilite-message
- Totaux comparatif: #total-lmnp-reel, #total-micro-non-classe, #total-micro-classe, #total-lmp-reel
- IR: #ir-montant
- RAV depenses: #rav-total-depenses
- RAV final: #rav-final
- CH total micro: #ch-total-micro-standard

## 6) Criteres de sortie campagne

- Tous les tests P0 passes
- Aucun KO bloquant sur sauvegarde/restauration
- Aucun KO sur verrou VL micro-entrepreneur
- Aucun KO sur exclusion N/A des options ineligibles
- Aucun KO sur deduction IR mensuel dans RAV
