
CORRECTIONS DE L'AUDIT FISCAL CH
Erratum et rectifications après vérification réglementaire
Document destiné à Copilot pour correction du code
27 mars 2026 — v1.0
CONTEXTE : Ce document liste TOUTES les erreurs, imprécisions et paramètres obsolètes identifiés dans le moteur de calcul fiscalité CH (js/fiscalite-v2.js). Chaque point est sourcé avec les textes de loi en vigueur au 27/03/2026. Copilot doit corriger le code en suivant exactement ces instructions.

 
ERREUR 1 — Taux de prélèvements sociaux patrimoine obsolète
Valeur dans le code : 17,2 %
Valeur correcte en 2026 pour les LMNP/CH : 18,6 %

ERREUR : Le taux de 17,2 % est obsolète depuis le 1er janvier 2026 — La LFSS 2026 (art. 12) a créé la Contribution Financière pour l'Autonomie (CFA) de 1,4 % qui s'ajoute à la CSG. Le taux de CSG passe de 9,2 % à 10,6 %. Total prélèvements sociaux : 10,6 % (CSG) + 0,5 % (CRDS) + 7,5 % (prélèvement solidarité) = 18,6 %.

Détail de l'impact pour les CH
Les revenus BIC des loueurs en meublé non professionnels (dont les CH sous le seuil d'affiliation SSI) sont classés comme « revenus du patrimoine » au sens de l'art. L.136-6 CSS. Ils sont expressément soumis au nouveau taux de 10,6 % de CSG.
EXCEPTION : les revenus fonciers (location nue) et les plus-values immobilières restent à 17,2 %. Mais les CH ne sont PAS des revenus fonciers — ce sont des BIC.

Ce que Copilot doit faire
1. Remplacer la constante « prelevements patrimoine: 17,2% » par 18,6 % dans calculerFiscaliteCH.
2. S'assurer que TOUTES les utilisations de 17,2 % (0.172) pour les BIC meublés sont remplacées par 18,6 % (0.186).
3. Vérifier que le taux 17,2 % n'est PAS utilisé pour les gîtes (même logique BIC = 18,6 %).
Source : LFSS 2026, art. 12 — Art. L.136-8, I-2° CSS — Arrêté du 16/12/2025
 
ERREUR 2 — Seuil d'affiliation SSI CH erroné
Valeur dans le code : 6 248 €
Valeur correcte 2025 : 6 123 € (13 % × PASS 2025 = 13 % × 47 100 €)
Valeur correcte 2026 : 6 248 € (13 % × PASS 2026 = 13 % × 48 060 €)

ATTENTION : Le seuil de 6 248 € est correct UNIQUEMENT pour 2026 — La valeur codée en dur (6 248 €) correspond au calcul 13 % × 48 060 € (PASS 2026). Elle est donc correcte pour les simulations portant sur l'exercice 2026. MAIS elle est incorrecte pour les simulations portant sur 2025 (6 123 €) ou les années antérieures. Le code doit calculer dynamiquement ce seuil en fonction de l'année de simulation.

Formule exacte
seuil_affiliation_SSI_CH = 13 % × PASS de l'année simulée

Année	PASS	Seuil 13 %	Source
2024	46 368 €	6 028 €	JO 22/12/2023
2025	47 100 €	6 123 €	JO 20/12/2024
2026	48 060 €	6 248 €	JO 23/12/2025

Ce que Copilot doit faire
1. Créer une table de PASS par année : { 2024: 46368, 2025: 47100, 2026: 48060 }.
2. Calculer le seuil dynamiquement : seuil = PASS[anneeSimulation] × 0.13.
3. Utiliser ce seuil calculé à la place de la constante 6248 dans calculerFiscaliteCH.
Source : Art. L.611-1, 5° CSS — Arrêté du 22/12/2025 portant fixation du PASS 2026
 
ERREUR 3 — Abattement micro-BIC CH : le code utilise 50 %, VÉRIFICATION

Contexte législatif — Loi Le Meur
La loi n° 2024-1039 du 19 novembre 2024 (dite « Loi Le Meur ») a modifié les abattements micro-BIC pour les meublés de tourisme. Pour les chambres d'hôtes, l'abattement passe de 71 % à 50 % à compter des revenus perçus en 2025 (déclarés en 2026).

Type de bien	Avant 2025	À partir de 2025	Plafond
Meublé tourisme non classé	50 %	30 %	15 000 €
Meublé tourisme classé	71 %	50 %	77 700 €
CHAMBRES D'HÔTES	71 %	50 %	77 700 €
Meublé longue durée	50 %	50 %	77 700 €

CONFIRMÉ OK : Le code utilise 50 % — C'EST CORRECT pour les revenus 2025+ — Le taux de 50 % est conforme à l'art. 50-0 CGI modifié par la loi Le Meur. CEPENDANT, le code doit gérer le cas où l'année de simulation est 2024 ou antérieure : l'abattement était alors de 71 %. Si le simulateur permet de simuler des exercices passés, il doit appliquer 71 % pour 2024 et avant.

Ce que Copilot doit faire
1. Si le simulateur ne couvre que 2025+ : RAS, le 50 % est correct.
2. Si le simulateur permet de simuler 2024 ou avant : ajouter une condition anneeSimulation <= 2024 → abattement = 71 %.
3. Vérifier que le plafond micro-BIC CH est bien 77 700 € (pas 188 700 € qui était l'ancien plafond avant la loi Le Meur).
 
ERREUR 4 — Cotisations micro-BIC déduites du revenu imposable IR

ERREUR : ERREUR MAJEURE dans le calcul du revenu imposable micro-BIC — Le code calcule : revenu_location_net_micro = base_imposable_micro - cotis_micro, puis injecte ce revenu_location_net dans le calcul IR. C'est FAUX.

Règle fiscale exacte
En régime micro-BIC, le revenu imposable à l'IR est STRICTEMENT :
revenu_imposable_IR = CA × (1 − taux_abattement)
Soit pour les CH 2025+ : revenu_imposable_IR = CA × 50 %

Les cotisations SSI (21,2 %) sont un coût additionnel payé à l'URSSAF. Elles ne viennent PAS en déduction du revenu imposable à l'IR en régime micro.
Le principe du micro-BIC est justement que l'abattement forfaitaire (50 %) est censé couvrir TOUTES les charges, y compris les cotisations sociales. L'administration ne permet aucune déduction supplémentaire.

Conséquence de l'erreur actuelle
Exemple : CA = 30 000 € — Calcul actuel vs calcul correct
Étape	Code actuel (FAUX)	Calcul correct
Base imposable micro (CA × 50 %)	15 000 €	15 000 €
Seuil SSI atteint (> 6 248) ?	OUI	OUI
Cotisations SSI (CA × 21,2 %)	6 360 €	6 360 €
Revenu injecté dans IR	15 000 − 6 360 = 8 640 €	15 000 €
Écart	−6 360 €	0 €
Impact IR (TMI 30 %)	IR sous-évalué de ≈ 1 908 €	IR correct

L'erreur sous-évalue systématiquement l'IR de l'option micro-BIC, ce qui FAUSSE la comparaison micro vs réel. Le micro apparaît artificiellement plus avantageux qu'il ne l'est.

Ce que Copilot doit faire
1. Dans calculerFiscaliteCH, option Micro standard : remplacer revenu_location_net_micro = base_imposable_micro - cotis_micro par revenu_location_net_micro = base_imposable_micro (sans déduction des cotisations).
2. Le calcul IR micro doit être : ir_micro = IR(foyer + base_imposable_micro) − IR(foyer).
3. Le total_micro reste : cotis_micro + ir_micro. Mais ir_micro sera plus élevé qu'avant car calculé sur une base plus large.
4. Même correction pour l'option VL : le VL s'applique sur le CA, pas sur un revenu net de cotisations.
Source : Art. 50-0 CGI — BOI-BIC-DECLA-10-10-20 — impots.gouv.fr « un abattement de 50 % est automatiquement appliqué [...] Cet abattement forfaitaire représente la totalité de vos charges. Vous ne pouvez donc déduire aucune charge. »
 
ERREUR 5 — Taux du versement libératoire pour les CH
Valeur dans le code : 1 %

Analyse détaillée
Avant la loi Le Meur, les chambres d'hôtes étaient classées dans la catégorie « fourniture de logement » (BIC ventes de marchandises), avec un taux VL de 1 %.
La loi Le Meur reclasse les chambres d'hôtes dans la catégorie « prestations de services BIC » à compter des revenus 2025 pour les classés et 2026 pour les non classés.

ATTENTION : Le taux VL pourrait devoir passer à 1,7 % selon la catégorisation — Si les CH sont désormais catégorisées comme « prestations de services BIC » (suite à la loi Le Meur), le taux VL applicable serait de 1,7 % et non plus 1 %. CEPENDANT, la situation n'est pas totalement clarifiée pour les CH à ce jour (les textes visent principalement les meublés de tourisme classés). L'URSSAF indique 12,8 % de cotisations micro-social pour les CH, ce qui correspond à la catégorie « fourniture de logement ».

Ce que Copilot doit faire
1. CONSERVER 1 % pour le moment (catégorie fourniture de logement semble maintenue pour les CH pures).
2. Ajouter un commentaire dans le code : « Taux VL CH = 1 % (fourniture de logement). À surveiller si reclassification en prestation de services suite loi Le Meur → passerait à 1,7 %. »
3. Paramétrer le taux VL comme une constante modifiable (pas en dur dans la formule).
 
ERREUR 6 — Taux de cotisations micro-social CH
Valeur dans le code : 21,2 %
Valeur confirmée 2025-2026 : 21,2 % (BIC prestations de services)

CONFIRMÉ OK : Le taux de 21,2 % est correct pour 2025-2026 — Les sources URSSAF et Service-Public confirment un taux de cotisations micro-social de 21,2 % pour les activités de prestations de services BIC et les chambres d'hôtes. Cependant, certaines sources indiquent 12,8 % pour les CH au régime micro-social (catégorie fourniture de logement). Cette incohérence doit être surveillée.

Point d'attention : catégorie CH au micro-social
L'URSSAF présente deux taux différents selon la catégorisation :
— 12,3 % pour achat-revente / fourniture de logement (hors meublés)
— 21,2 % pour prestations de services commerciales/artisanales BIC et CH
— 12,8 % indiqué par certaines sources spécialisées pour les CH en micro-social

Ce que Copilot doit faire
1. Conserver 21,2 % comme valeur par défaut (cohérent avec les sources officielles majoritaires).
2. Rendre ce taux paramétrable pour permettre un ajustement si l'URSSAF clarifie la catégorisation des CH.
 
ERREUR 7 — Seuils TVA : franchise et tolérance
Valeur dans le code : seuil unique à 37 500 €

Seuils en vigueur 2025-2026
La loi du 3 novembre 2025 a supprimé la réforme du seuil unique à 25 000 €. Les seuils 2025 sont maintenus :
Type	Seuil franchise	Seuil majoré
Prestations de services BIC/BNC	37 500 €	41 250 €
Fourniture de logement / ventes	85 000 €	93 500 €
CH (prestation d'hébergement)	37 500 €	41 250 €

CONFIRMÉ OK : Le seuil de franchise de 37 500 € est correct — Conforme à l'art. 293 B CGI en vigueur.

ATTENTION : Le seuil majoré de tolérance (41 250 €) est absent du code — Le code ne déclenche l'alerte qu'à 37 500 €. Or, entre 37 500 € et 41 250 €, l'exploitant est en « zone de tolérance » : il devient assujetti à la TVA au 1er janvier N+1. Au-delà de 41 250 €, la franchise cesse IMMÉDIATEMENT (dès le jour du dépassement). Cette distinction est cruciale.

Ce que Copilot doit faire
1. Ajouter un second seuil TVA : 41 250 € (seuil majoré de tolérance).
2. Alerte jaune si CA ≥ 37 500 € et CA < 41 250 € : « Franchise TVA dépassée — TVA applicable au 1er janvier N+1. »
3. Alerte rouge si CA ≥ 41 250 € : « Seuil majoré TVA dépassé — TVA applicable immédiatement dès le jour du dépassement. »
 
ERREUR 8 — Frais de notaire traités comme charge immédiate

ERREUR : Les frais de notaire d'acquisition ne sont PAS une charge déductible immédiate en BIC réel — En régime réel BIC, les droits de mutation (« frais de notaire ») s'ajoutent au prix de revient de l'immobilisation. Ils sont soit amortis avec le bien (sur 20-30 ans), soit déduits immédiatement sur option (art. 38 quinquies Annexe III CGI). Le code les traite comme une charge courante déductible en totalité l'année de paiement, ce qui surestime les charges déductibles si l'option d'imputation immédiate n'a pas été exercée.

Nuance importante
L'art. 38 quinquies de l'Annexe III du CGI permet d'inscrire les droits de mutation soit en charges (déduction immédiate), soit dans le coût d'acquisition (amortissement). C'est une OPTION du contribuable, pas un automatisme.

Ce que Copilot doit faire
1. Ajouter un choix dans l'UI : « Frais de notaire : déduction immédiate (option art. 38 quinquies) OU amortissement avec le bien ».
2. Si amortissement : reporter ch-frais-notaire dans les amortissements (durée = durée d'amortissement du bien).
3. Si déduction immédiate : conserver le traitement actuel mais ajouter un avertissement : « Option art. 38 quinquies — Vérifier avec votre comptable. »
 
ERREUR 9 — Aucun contrôle d'éligibilité au versement libératoire

ATTENTION : Le VL n'est pas accessible à tous les contribuables — L'option pour le VL est subordonnée à une condition de revenu fiscal de référence (RFR) du foyer N-2. Pour l'option en 2025 : RFR 2023 ≤ 28 797 € par part de quotient familial. Pour l'option en 2026 : le seuil sera revalorisé (≈ 29 000-29 500 € par part). Si le RFR dépasse ce seuil, le VL est interdit. Le code ne vérifie pas cette condition.

Ce que Copilot doit faire
1. Ajouter un contrôle : si TMI foyer ≥ 30 %, alerter que le VL est probablement inaccessible (le seuil de RFR correspond grossièrement à un foyer non imposable ou à TMI 11 %).
2. Idéalement, ajouter un champ RFR N-2 pour un contrôle exact.
3. Si RFR non disponible, afficher un avertissement sur la carte VL : « Vérifiez votre éligibilité — RFR N-2 ≤ [seuil] € par part requis. »
 
ERREUR 10 — Plafond micro-BIC CH : vérification de la règle de dépassement
Valeur dans le code : bascule forcée vers réel si CA > 77 700 €

ATTENTION : La bascule n'est pas immédiate au premier dépassement — L'art. 50-0 CGI prévoit une tolérance : le régime micro est perdu si le seuil est dépassé pendant DEUX années civiles consécutives (N-1 ET N-2). Un dépassement ponctuel sur une seule année ne fait pas perdre le micro. Le code semble basculer immédiatement dès le premier dépassement, ce qui est plus restrictif que la loi.

Ce que Copilot doit faire
1. Si le simulateur est mono-année : afficher une alerte informative (pas une bascule forcée) : « CA > 77 700 € — Si vous dépassez aussi l'année suivante, vous perdrez le micro-BIC. »
2. La bascule forcée dans le calcul devrait rester (pour être prudent), mais l'interface doit mentionner la règle des 2 ans.
 
RÉCAPITULATIF — Tableau de synthèse pour Copilot
#	Paramètre	Valeur code	Valeur correcte	Sévérité	Action
1	Prélèvements patrimoine	17,2 %	18,6 %	CRITIQUE	Corriger
2	Seuil SSI CH	6 248 €	Dynamique (13%×PASS)	MOYENNE	Paramétrer
3	Abattement micro CH	50 %	50 % (2025+)	OK	Gérer historique
4	Cotis micro déduit IR	base−cotis	base seule	CRITIQUE	Corriger
5	Taux VL CH	1 %	1 % (à surveiller)	FAIBLE	Commentaire
6	Taux cotis SSI	21,2 %	21,2 %	OK	Paramétrer
7	Seuil TVA majoré	Absent	41 250 €	MOYENNE	Ajouter
8	Frais notaire	Charge immédiate	Option contribuable	HAUTE	Ajouter choix
9	Éligibilité VL	Pas de contrôle	RFR N-2 par part	MOYENNE	Ajouter alerte
10	Bascule micro	Immédiate	2 ans consécutifs	FAIBLE	Alerter


INSTRUCTION FINALE POUR COPILOT : Les erreurs #1 (taux 18,6 %) et #4 (cotisations non déductibles du revenu IR micro) sont les deux corrections les plus impactantes sur les résultats chiffrés. Elles doivent être traitées en PRIORITÉ ABSOLUE avant toute mise en production. L'erreur #4 fausse systématiquement la comparaison micro/réel en faveur du micro, ce qui peut conduire des exploitants à faire un mauvais choix fiscal.

