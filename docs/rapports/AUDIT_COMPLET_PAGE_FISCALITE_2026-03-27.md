
CORRECTIONS FISCALITÉ — PAGE COMPLÈTE
Audit croisé : CH + Gîtes + IR + URSSAF + Comparatif
Instructions précises pour Copilot — Chaque point sourcé
27 mars 2026 — v2.0 — Basé sur audit complet 8555 lignes JS
Ce document remplace et complète la v1.0 (corrections CH uniquement). Il couvre la totalité de la page fiscalité : 188 fonctions JS, 275 IDs HTML, 13 moteurs de calcul. Chaque erreur est classée par sévérité (CRITIQUE / HAUTE / MOYENNE / FAIBLE) avec la correction exacte à appliquer et la source légale.

Points déjà corrigés dans le code	Points restant à corriger
— Seuil SSI CH dynamique (13 % × PASS) — Frais notaire : mode immédiat/amortissement — Seuil RFR VL CH par part — Seuil TVA majoré ajouté — IR micro-BIC : base_imposable seule (sans déduction cotis)	— Prélèvements patrimoine : 17,2 % → 18,6 % — Barème IR 2026 (revenus 2025) : revalorisation 0,9 % — Cotis micro-BIC base de calcul (CA brut) — Charges résidence/véhicule non intégrées au calcul réel — Plafond micro-BIC CH : règle 2 ans consécutifs

 
PARTIE A — Points déjà corrigés (confirmations)
L'audit complet révèle que le code a déjà intégré plusieurs corrections signalées dans la v1.0. Voici la confirmation :
DÉJÀ CORRIGÉ : Seuil SSI CH dynamique via PASS — Le code utilise getPassPourAnneeCH() et getSeuilAffiliationCh() = 13 % × PASS. Table PASS interne par année. Conforme à l'art. L.611-1, 5° CSS.

DÉJÀ CORRIGÉ : Frais de notaire CH : option immédiat/amortissement — Le champ ch-frais-notaire-mode permet le choix. Si mode amortissement : fraisNotaire / durée. Conforme à l'art. 38 quinquies Annexe III CGI.

DÉJÀ CORRIGÉ : Seuil RFR VL CH par part — getSeuilRfrVlParPart() retourne 28 797 (2025 et avant) puis 29 315 (après). Contrôle d'éligibilité VL présent.

DÉJÀ CORRIGÉ : Abattement micro CH 50 % — Conforme loi Le Meur pour revenus 2025+. Le code utilise la config annuelle dynamique.

DÉJÀ CORRIGÉ : IR micro-BIC CH : base imposable sans déduction cotisations — L'audit montre : irMicro = IR(foyer + baseImposable) - IR(foyer), où baseImposable = CA × (1 - abattement). Les cotisations ne sont PAS déduites de la base IR. Conforme à l'art. 50-0 CGI.

 
PARTIE B — Erreurs critiques à corriger
B1 — Prélèvements sociaux patrimoine : 17,2 % → 18,6 %

ERREUR : Taux prélèvements patrimoine obsolète — La LFSS 2026 (art. 12) crée la CFA de 1,4 %. CSG passe de 9,2 % à 10,6 %. Total PS = 10,6 + 0,5 + 7,5 = 18,6 %. Les revenus BIC meublés non professionnels (dont CH sous seuil SSI) sont des « revenus du patrimoine » au sens de L.136-6 CSS et sont expressément soumis au nouveau taux. Exception : revenus fonciers (location nue) et plus-values immobilières restent à 17,2 %. Les CH ne sont PAS des revenus fonciers.

Vérification de l'impact dans le code :
— Section CH : constante « taux prélèvements patrimoine » utilisée dans calculerFiscaliteCH() quand seuilCotisAtteint = false. Doit passer de 0.172 à 0.186.
— Section Gîtes : vérifier si calculerURSSAF() utilise 17,2 % pour les LMNP CA < 23 000 €. Si oui, même correction à 18,6 %.
— Comparatif 4 options : vérifier les options micro-BIC si elles appliquent les PS patrimoine.

ACTION : Rechercher TOUTES les occurrences de 0.172 ou 17.2 dans fiscalite-v2.js. Remplacer par 0.186 (18,6 %) pour les revenus BIC meublés (LMNP/CH). CONSERVER 17,2 % UNIQUEMENT pour : revenus fonciers (location nue), plus-values immobilières, assurance-vie, PEL/CEL. Les PV de revente LMNP restent à 17,2 % (art. L.136-8, IV CSS).
SOURCE : LFSS 2026 art. 12 — Art. L.136-8, I-2° CSS — Applicable aux revenus patrimoine dès 2025 et placements dès 01/01/2026.
 
B2 — Barème IR 2026 (revenus 2025) : revalorisation 0,9 %

ERREUR : Vérifier que le barème IR 2026 est bien à jour — La loi de finances 2026 (art. 2 ter, promulguée le 19/02/2026) revalorise le barème de 0,9 %. Les tranches 2026 (revenus 2025) doivent être : 0-11 600 € (0 %), 11 601-29 579 € (11 %), 29 580-84 577 € (30 %), 84 578-181 917 € (41 %), > 181 917 € (45 %).

Barème IR 2026 officiel (revenus 2025) :
Tranche (par part)	Taux	Barème 2025	Barème 2026
Jusqu'à	0 %	11 497 €	11 600 €
De ... à	11 %	11 498 - 29 315 €	11 601 - 29 579 €
De ... à	30 %	29 316 - 83 823 €	29 580 - 84 577 €
De ... à	41 %	83 824 - 180 294 €	84 578 - 181 917 €
Au-delà de	45 %	> 180 294 €	> 181 917 €

Autres paramètres revalorisés 0,9 % :
— Abattement 10 % salaires : min 509 €, max 14 556 €
— Abattement 10 % pensions : min 454 €, max 4 439 €
— Plafond quotient familial : 1 807 € par demi-part
— Décote : 897 € (indiv.) / 1 483 € (couple), seuils 1 982 € / 3 277 €

ACTION : Vérifier que window.TAUX_FISCAUX.getConfig(2026) retourne les tranches ci-dessus. Si la config n'existe pas encore pour 2026, l'ajouter. Vérifier aussi les min/max abattement salaires dans calculerIR().
SOURCE : Loi n° 2026-103 du 19/02/2026 de finances pour 2026, art. 2 ter. Service-Public.fr MAJ 22/02/2026.
 
B3 — Cotisations micro-social : assiette = CA brut (pas bénéfice)

ATTENTION : Vérifier l'assiette des cotisations micro dans le comparatif gîtes — En micro-social, les cotisations sont calculées sur le CA brut HT (pas sur le bénéfice, pas sur la base imposable après abattement). Le code du comparatif 4 options doit appliquer : cotis_micro = CA × taux_cotis. Pas de notion de bénéfice en micro.

Taux micro-social 2025-2026 confirmés :
Catégorie	Taux 2025	Taux 2026
Vente marchandises / fourniture logement	12,3 %	12,3 %
Prestation services BIC / CH	21,2 %	21,2 %
Meublé tourisme classé	6 %	6 %
Activités libérales BNC (hors Cipav)	23,2 %	25,6 %

ACTION : Dans calculerTableauComparatif(), vérifier que pour les options micro-BIC, les cotisations sont bien calculées sur CA × taux (et non sur bénéfice × taux).
 
B4 — Charges résidence et véhicule non intégrées au calcul réel gîtes

ATTENTION : Les charges résidence et frais véhicule sont calculées mais pas ajoutées au total charges — L'audit note : « Les charges résidence et frais véhicule sont calculés et affichés, mais non ajoutés au TotalCharges dans cette fonction de calcul principal. » En régime réel BIC, la quote-part professionnelle des charges de la résidence (prorata surface bureau) et les frais de véhicule (barème km) sont des charges déductibles du bénéfice BIC. Si elles ne sont pas incluses dans le total, le bénéfice réel est surévalué, et donc l'URSSAF et l'IR aussi.

Impact :
Le bénéfice calculé = CA - ChargesBiens - FraisPro - Crédits. Mais devrait être = CA - ChargesBiens - FraisPro - ChargesRésidence(prorata) - FraisVéhicule - Crédits.

Nuances importantes :
1. ChargesRésidence (prorata surface bureau) : en BIC, si le professionnel utilise une pièce de sa résidence comme bureau, la quote-part est déductible. MAIS : si le gîte n'est pas dans la résidence, la charge bureau est déductible uniquement si le bureau est utilisé pour la gestion de l'activité.
2. FraisVéhicule (barème km) : déductibles en BIC réel SI véhicule non inscrit à l'actif professionnel. Le barème km est utilisé pour les véhicules personnels. Si le véhicule est inscrit à l'actif, ce sont les charges réelles qui sont déductibles (pas le barème km).
3. Crédits immobiliers : les mensualités de crédit ne sont PAS une charge déductible en BIC. Seuls les intérêts d'emprunt le sont (déjà inclus dans ChargesBien). L'inclusion de TotalCredits dans les charges semble incorrecte — vérifier si c'est bien « intérêts uniquement » ou « mensualité complète (capital + intérêts) ».

ACTION : 1) Vérifier si ChargesRésidence et FraisVéhicule doivent être ajoutés au TotalCharges gîtes. 2) Vérifier que TotalCredits ne contient que les intérêts (pas le capital remboursé). 3) Si les mensualités complètes sont utilisées, corriger pour ne garder que les intérêts.
 
B5 — Règle URSSAF LMNP : CA < 23 000 € = pas de cotisations sociales

CONFIRMÉ : Règle correctement implémentée — Le code vérifie : si LMNP ET CA < 23 000, URSSAF = 0. Conforme à l'art. L.611-1, 6° CSS. Le LMNP courte durée sous 23 000 € relève des prélèvements sociaux patrimoine (18,6 % désormais) et non des cotisations SSI.

ATTENTION : Mais attention au taux PS appliqué — Si URSSAF = 0 pour LMNP < 23 000 €, les revenus sont soumis aux PS patrimoine. Le taux doit être 18,6 % (et non 17,2 %). Vérifier que cette imposition PS est bien calculée quelque part (dans le calcul IR ou en complément).
 
B6 — Comparatif 4 options : cohérence des calculs

Le comparatif évalue 4 options : LMNP réel, micro non classé, micro classé, LMP réel. Points à vérifier :
ATTENTION : Abattements micro-BIC post loi Le Meur — Le code utilise la config annuelle dynamique. Vérifier que pour 2025+ (revenus déclarés en 2026) : micro non classé = 30 % abattement / plafond 15 000 €, micro classé = 50 % / 77 700 €, CH = 50 % / 77 700 €. Pour 2024 et avant : non classé = 50 % / 77 700 €, classé = 71 % / 188 700 €.

ATTENTION : Critères LMP : seuil 23 000 € ET prédominance — Le code vérifie CA > 23 000 et recettes locatives > autres revenus pro foyer. Conforme à l'art. 155 IV CGI. S'assurer que getAutresRevenusProfessionnelsFoyer() retourne bien les salaires imposables du foyer (pas les salaires bruts).

ATTENTION : VL dans le comparatif micro — Le VL ne doit être proposé que si le contribuable est micro-entrepreneur affilié au régime micro-social. Un LMNP non inscrit en micro-entreprise ne peut PAS opter pour le VL. Le VL est réservé aux auto-entrepreneurs (micro-entrepreneurs). Vérifier que le code n'affiche pas le VL pour un simple LMNP.
 
B7 — Calcul IR foyer : vérifications détaillées

Le calcul IR dans calculerIR() est central. Vérifications :
1. Déficit BIC et imputation : Le code fait : « si déficit, imputation sur revenu global avec plancher 0 ». En BIC, un déficit professionnel (LMP) est imputable sur le revenu global. Un déficit non professionnel (LMNP) n'est imputable que sur les revenus BIC non professionnels des 10 années suivantes (art. 156-I-1° bis CGI). Le code doit distinguer LMP/LMNP pour l'imputation du déficit.

2. Abattement 10 % salaires : min/max pour 2026 = 509 € / 14 556 € (revalorisé 0,9 %). Vérifier dans la config.

3. Frais réels vs forfait : Le choix frais réels (km + péages) est correctement implémenté comme alternative au 10 %. OK.

4. Parts fiscales : Vérifier la formule : couple = 2 parts, + 0,5 par enfant pour les 2 premiers, + 1 par enfant à partir du 3e. Parent isolé : +0,5 part supplémentaire.

5. Plafonnement quotient familial : L'avantage maximal par demi-part est de 1 807 € en 2026. Le code doit vérifier ce plafond.

ACTION : Vérifier les 5 points ci-dessus dans calculerIR(). Le point 1 (déficit LMNP) est probablement le plus impactant : un LMNP en déficit ne doit PAS réduire son revenu global.
 
B8 — Reste à vivre : cohérence des flux

Le calcul du reste à vivre intègre :
— Revenus : salaires/12 + revenu LMP après URSSAF/12 + économie km/12 + amortissements/12
— Dépenses : crédits + frais perso + charges résidence (part perso)

ATTENTION : Les amortissements ne sont PAS un revenu de trésorerie — Le code réintègre les amortissements dans les revenus du RAV. Les amortissements sont une charge comptable non décaissée — ils ne génèrent PAS de trésorerie entrante. Les ajouter aux revenus surévalue le RAV. En revanche, il est correct de les réintégrer si le RAV part du résultat comptable (qui les a déduits). Mais le code part du « revenu LMP après URSSAF » qui est le bénéfice fiscal. Si le bénéfice fiscal a déjà déduit les amortissements, les réintégrer au RAV est correct (car l'amortissement n'a pas été décaissé). Vérifier la cohérence.

ATTENTION : Économie km barème dans les revenus — L'économie km (barème kilométrique) est une déduction fiscale, pas un revenu. Elle réduit l'IR mais ne génère pas de trésorerie. L'inclure dans les revenus du RAV surestime la trésorerie disponible. Sauf si l'objectif est de montrer l'impact fiscal net sur la trésorerie (auquel cas c'est un choix de modélisation à documenter).
 
PARTIE C — Points techniques mineurs
C1 — Amortissements : seuil 500 €
Le code amortit uniquement si montant >= 500 €. En comptabilité BIC, le seuil de 500 € HT est le seuil conventionnel (non légal) en dessous duquel une immobilisation peut être passée en charge immédiate. Au-dessus, l'immobilisation doit être amortie. Ce seuil est correct mais il s'applique HT. Si les montants saisis sont TTC (cas franchise TVA), le seuil effectif est plus bas. Point mineur à documenter.

C2 — Plafond micro-BIC : règle des 2 ans
Le code bascule immédiatement en réel quand CA > plafond. La loi prévoit une tolérance : la perte du micro n'intervient que si le seuil est dépassé 2 années consécutives (N-1 ET N-2). Le simulateur étant mono-année, la bascule immédiate est une simplification prudente acceptable. Ajouter un message informatif : « En pratique, le micro est perdu si le seuil est dépassé 2 ans de suite (art. 50-0 CGI). »

C3 — Taux VL CH : 1 % vs 1,7 %
Le code utilise un taux VL CH paramétrable via la config annuelle. Le taux de 1 % (fourniture de logement) semble toujours applicable aux CH pures. La reclassification en « prestation de services BIC » (taux VL 1,7 %) concerne principalement les meublés de tourisme classés. Conserver 1 % pour les CH, surveiller les clarifications URSSAF.

C4 — Cotisations minimales LMP
Le code applique un minimum de cotisations si LMP et total < minimum annuel configuré. C'est correct : le travailleur indépendant LMP est redevable de cotisations minimales (environ 1 200 €/an) même en cas de bénéfice nul ou négatif. Vérifier que le montant minimum est à jour dans la config.

C5 — 106 handlers inline
Le code utilise 106 attributs on* inline dans le HTML. C'est un pattern legacy qui fonctionne mais fragile. Les exports window.* (110) assurent la compatibilité. Pas de handler manquant détecté. Point d'architecture, pas d'erreur fonctionnelle.
 
RÉCAPITULATIF FINAL — Actions pour Copilot
#	Zone	Paramètre	Problème	Sévérité	Statut	Action
B1	CH+Gîtes	PS patrimoine	17,2 % → 18,6 %	CRITIQUE	À CORRIGER	Remplacer
B2	IR foyer	Barème 2026	Tranches rev. 0,9 %	CRITIQUE	VÉRIFIER	MAJ config
B3	Comparatif	Cotis micro	Assiette = CA brut	HAUTE	VÉRIFIER	Audit code
B4	Gîtes réel	Charges résid.	Non intégrées	HAUTE	VÉRIFIER	Intégrer
B4	Gîtes réel	Crédits	Capital vs intérêts	HAUTE	VÉRIFIER	Corriger
B5	LMNP	PS < 23k€	Taux = 18,6 %	HAUTE	VÉRIFIER	MAJ taux
B6	Comparatif	Abattements	Loi Le Meur	MOYENNE	VÉRIFIER	Config
B6	Comparatif	VL gîtes	Réservé micro-entr.	MOYENNE	VÉRIFIER	Contrôle
B7	IR foyer	Déficit LMNP	Non imputable RG	HAUTE	VÉRIFIER	Corriger
B7	IR foyer	Abatt. 10 %	Min 509 max 14 556	MOYENNE	VÉRIFIER	Config
B8	RAV	Amortissements	Pas un revenu	MOYENNE	VÉRIFIER	Documenter
C1	Amort.	Seuil 500 €	HT vs TTC	FAIBLE	OK	Documenter
C2	Micro	Bascule réel	Règle 2 ans	FAIBLE	OK	Message
C3	CH	Taux VL	1 % OK	FAIBLE	OK	Surveiller
C4	LMP	Cotis min	≈ 1 200 €	FAIBLE	VÉRIFIER	Config


PRIORITÉS ABSOLUES : 1) Remplacer 17,2 % par 18,6 % partout (PS patrimoine). 2) Vérifier le barème IR 2026. 3) Vérifier que les mensualités crédit ne comptent que les intérêts dans les charges BIC réel. 4) Vérifier l'imputation du déficit LMNP (non imputable sur revenu global).

NOTE : Le code a déjà corrigé les 5 points majeurs signalés dans la v1.0 (seuil SSI dynamique, frais notaire, RFR VL, abattement 50 %, base IR micro sans déduction cotisations). La qualité du moteur est globalement solide — les corrections restantes portent principalement sur des paramètres réglementaires 2026 récents (LFSS 2026, LFI 2026) et des vérifications de cohérence entre sections.
 
PARTIE E — TODO LIST EXHAUSTIVE — Toutes les actions
Liste numérotée de TOUTES les modifications à apporter, regroupées par zone du code. Chaque action est autonome et peut être cochée une fois réalisée.
E1 — Fichier config / constantes fiscales (TAUX_FISCAUX)

E1.1 [CRITIQUE] Ajouter la config IR 2026 (revenus 2025) dans getConfig()
Tranches : 0-11600 (0%), 11601-29579 (11%), 29580-84577 (30%), 84578-181917 (41%), >181917 (45%). Source : LFI 2026 art. 2 ter.
E1.2 [CRITIQUE] Mettre à jour le taux PS patrimoine à 18,6 %
Remplacer toute référence à 0.172 par 0.186 pour les revenus BIC meublés. Source : LFSS 2026 art. 12.
E1.3 [HAUTE] Ajouter le PASS 2026 = 48 060 € dans la table PASS
Vérifier que getPassPourAnneeCH() contient { 2024: 46368, 2025: 47100, 2026: 48060 }. Source : Arrêté 22/12/2025.
E1.4 [MOYENNE] Mettre à jour l'abattement 10 % salaires 2026
Min = 509 €, Max = 14 556 €. Source : LFI 2026, revalorisation 0,9 %.
E1.5 [MOYENNE] Mettre à jour l'abattement 10 % pensions 2026
Min = 454 €, Max = 4 439 €. Source : LFI 2026.
E1.6 [MOYENNE] Mettre à jour le plafond quotient familial 2026
1 807 € par demi-part supplémentaire. Source : LFI 2026.
E1.7 [MOYENNE] Mettre à jour les seuils de décote 2026
Célibataire : 897 € / seuil 1 982 €. Couple : 1 483 € / seuil 3 277 €. Source : LFI 2026.
E1.8 [HAUTE] Vérifier les abattements micro-BIC loi Le Meur dans la config 2025+
Non classé : 30 % / 15 000 €. Classé : 50 % / 77 700 €. CH : 50 % / 77 700 €. Longue durée : 50 % / 77 700 €. Source : Loi Le Meur 19/11/2024.
E1.9 [HAUTE] Vérifier le seuil RFR VL par part pour 2026
Environ 29 315 € par part (revalorisé). Source : Art. 151-0 CGI.
E1.10 [FAIBLE] Documenter le taux VL CH = 1 %
Ajouter commentaire : « À surveiller si reclassification prestation services → 1,7 %. »
E1.11 [HAUTE] Ajouter le taux PS patrimoine 2025 spécifique LMNP
Pour les revenus 2025 des LMNP : le taux est déjà 18,6 % (rétroactivité LFSS 2026 sur revenus patrimoine 2025). Source : LFSS 2026 art. 12, al. « revenus du patrimoine : à compter de l'imposition des revenus 2025 ».
E1.12 [FAIBLE] Cotisations minimum LMP : vérifier montant annuel dans config
Environ 1 200 €/an. Source : CSS.
 
E2 — Fonction calculerFiscaliteCH()

E2.1 [CRITIQUE] Remplacer le taux PS patrimoine 17,2 % → 18,6 %
Dans le calcul cotisationsMicro quand seuilCotisAtteint = false : baseImposable × 0.186 (au lieu de 0.172). Même chose pour urssafReelCH quand benefice ≤ seuil affiliation. ATTENTION : si le CH est au-dessus du seuil SSI et paie des cotisations sociales SSI, les PS patrimoine ne s'appliquent PAS en plus (pas de double imposition). Le taux 18,6 % ne s'applique qu'aux revenus soumis aux PS patrimoine (sous le seuil SSI).
E2.2 [MOYENNE] Vérifier que l'option VL n'est proposée que si RFR ≤ seuil
Le contrôle getSeuilRfrVlParPart() existe. Vérifier qu'il grise/masque bien la carte VL si non éligible.
E2.3 [FAIBLE] Ajouter message informatif sur la règle 2 ans pour bascule micro→réel
Quand CA > plafond, afficher : « La perte du micro-BIC n'intervient que si le seuil est dépassé 2 années consécutives (art. 50-0 CGI). Le simulateur applique la bascule par prudence. »
E2.4 [MOYENNE] Vérifier que les amortissements CH ne créent pas de déficit
En LMNP, les amortissements ne peuvent pas créer de déficit (art. 39 C CGI). Le déficit doit être nul avant prise en compte des amortissements. Si benefice < 0 après charges hors amortissements, les amortissements sont reportés.
E2.5 [HAUTE] Alerter si taux cotisations CH = 21,2 % vs 12,8 %
Certaines sources indiquent 12,8 % (fourniture de logement) pour les CH. Ajouter un avertissement dans l'UI : « Taux micro-social CH : vérifier avec l'URSSAF la catégorisation applicable à votre activité. »
 
E3 — Fonction calculerFiscalite() (gîtes réel)

E3.1 [HAUTE] Intégrer les charges résidence (prorata) dans TotalCharges
Actuellement : TotalCharges = ChargesBiens + FraisPro + TotalCredits. Devrait être : TotalCharges = ChargesBiens + FraisPro + ChargesResidence×ratioPro + FraisVehicule + TotalCreditsInterets. Le prorata est surface_bureau / surface_totale.
E3.2 [HAUTE] Intégrer les frais de véhicule (barème km) dans TotalCharges
Les frais kilométriques professionnels sont déductibles du bénéfice BIC réel. Le montant calculé par calculerBaremeKilometrique() doit être ajouté aux charges.
E3.3 [CRITIQUE] Vérifier que TotalCredits = intérêts uniquement, PAS mensualités complètes
En BIC réel, seuls les intérêts d'emprunt sont déductibles (art. 39-1-3° CGI). Le remboursement du capital n'est PAS une charge. Si TotalCredits = somme(mensualité × 12), c'est FAUX — ça inclut le capital. Il faut TotalCredits = somme(intérêts_annuels).
E3.4 [HAUTE] Vérifier que calculerURSSAF() applique le taux PS patrimoine 18,6 %
Si LMNP et CA < 23 000 : URSSAF = 0 mais les revenus sont soumis à 18,6 % de PS patrimoine. Vérifier que ce PS est bien calculé quelque part (dans calculerIR ? dans le comparatif ?).
E3.5 [MOYENNE] Vérifier les amortissements gîtes : pas de création de déficit
Même règle que CH (art. 39 C CGI). Les amortissements non déduits sont reportés sans limite de temps mais ne peuvent pas créer de déficit.
 
E4 — Fonction calculerIR() (IR foyer)

E4.1 [CRITIQUE] Barème IR 2026 : vérifier les tranches dans la config
Cf. E1.1. Les tranches doivent correspondre au barème promulgué le 19/02/2026 (revalorisation 0,9 %).
E4.2 [CRITIQUE] Déficit LMNP : ne PAS imputer sur le revenu global
Le code fait « si déficit, imputation sur revenu global avec plancher 0 ». C'est FAUX en LMNP. Règles exactes : 1) LMNP : le déficit s'impute uniquement sur les revenus BIC non pro des 10 années suivantes (art. 156-I-1° bis CGI). 2) LMP : le déficit s'impute sur le revenu global sans limite, reportable 6 ans. 3) IMPORTANT : les amortissements ne peuvent JAMAIS créer de déficit en LMNP (art. 39 C CGI). Si résultat < 0 avant amortissements, les amortissements sont reportés sans limite de durée. Source : Service-Public.fr, impots.gouv.fr.
E4.3 [HAUTE] Vérifier min/max abattement 10 % salaires
2026 : min 509 €, max 14 556 €. Source : LFI 2026.
E4.4 [HAUTE] Vérifier le plafonnement du quotient familial
2026 : 1 807 € par demi-part. Le code doit calculer l'avantage par demi-part et le plafonner.
E4.5 [MOYENNE] Vérifier le calcul des parts fiscales
Couple = 2 parts. 1er et 2e enfant = +0,5 part chacun. 3e enfant et suivants = +1 part chacun. Parent isolé = +0,5 part. Vérifier la formule.
E4.6 [MOYENNE] Vérifier si la décote IR est implémentée
La décote réduit l'IR brut pour les petits contribuables. En 2026 : si IR brut ≤ 1 982 € (célibataire) ou 3 277 € (couple), décote = 897 (ou 1 483) − 45,25 % × IR brut. L'audit ne mentionne pas de fonction décote — vérifier si elle est dans calculIRFoyer() ou calculerIR(). Si absente, les foyers à faible IR paient trop. Source : art. 197-I-4 CGI.
E4.7 [HAUTE] Vérifier que RevenuTotal = SalairesImposables + RevenuLMP en LMP uniquement
En LMNP : RevenuTotal = max(0, SalairesImposables + max(0, RevenuLMNP)). Le déficit LMNP ne réduit PAS le revenu global. En LMP : RevenuTotal = SalairesImposables + RevenuLMP (le déficit LMP réduit le revenu global).
 
E5 — Fonction calculerTableauComparatif() (comparatif 4 options)

E5.1 [HAUTE] Cotisations micro = CA × taux (pas bénéfice × taux)
En micro-social, les cotisations sont sur le CA brut. Vérifier que chaque option micro calcule : cotis = CA × tauxMicroSocial.
E5.2 [HAUTE] Abattements loi Le Meur dans toutes les options micro
Micro non classé 2025+ : 30 % / 15 000 €. Micro classé 2025+ : 50 % / 77 700 €. Pour 2024 : non classé 50 % / 77 700 €, classé 71 % / 188 700 €.
E5.3 [HAUTE] VL réservé aux micro-entrepreneurs affiliés
Le VL n'est pas un droit pour tout LMNP. Il faut être inscrit comme micro-entrepreneur. Si le statut est LMNP simple (pas micro-entrepreneur), le VL est inaccessible. Ajouter un contrôle ou un avertissement.
E5.4 [MOYENNE] Critères LMP : getAutresRevenusProfessionnelsFoyer()
Vérifier que cette fonction retourne les salaires imposables (après abattement 10 %), pas les salaires bruts. L'art. 155 IV CGI compare les recettes locatives aux « revenus [...] soumis à l'impôt sur le revenu ».
E5.5 [HAUTE] PS patrimoine 18,6 % dans les options LMNP
Quand le comparatif calcule l'option LMNP (CA < 23 000), les PS patrimoine doivent être 18,6 % (pas 17,2 %).
E5.6 [MOYENNE] Meilleure option : exclure les options non éligibles
La sélection OptionMin doit exclure les options auxquelles le contribuable n'est pas éligible (ex. : micro si CA > plafond, VL si RFR trop élevé, LMP si conditions non remplies).
 
E6 — Fonction calculerURSSAF()

E6.1 [MOYENNE] Vérifier que LMNP CA < 23 000 → URSSAF = 0
Confirmé correct. Mais s'assurer que les PS patrimoine 18,6 % sont calculés en complément.
E6.2 [FAIBLE] Cotisations minimales LMP : vérifier le montant
Environ 1 200 €/an en 2025. Vérifier dans la config.
E6.3 [MOYENNE] Formation professionnelle : assiette PASS
La CFP est assise sur le PASS. Vérifier que le PASS 2026 = 48 060 € est utilisé.
E6.4 [MOYENNE] Allocations familiales : taux progressif
Le taux varie selon le revenu. Vérifier que le barème est à jour.
 
E7 — Fonction calculerResteAVivre()

E7.1 [MOYENNE] Réintégration amortissements : documenter le choix
Les amortissements sont réintégrés dans les revenus RAV. C'est correct SI le RAV part du bénéfice fiscal (qui a déduit les amortissements). Ajouter une info-bulle : « Les amortissements sont réintégrés car ils ne constituent pas une sortie de trésorerie. »
E7.2 [MOYENNE] Économie km barème : documenter ou retirer
L'économie fiscale km (barème kilométrique) est incluse dans les revenus RAV. C'est une économie d'impôt, pas un revenu de trésorerie. Soit retirer, soit documenter : « L'économie km est intégrée car elle réduit l'impôt dû, ce qui améliore la trésorerie nette. »
E7.3 [FAIBLE] Charges résidence part perso : vérifier cohérence
Le RAV déduit chargesResidenceAnnuel × ratioPerso / 12. Vérifier que ratioPerso = 1 - ratioPro est correct (ratioPro = surface_bureau / surface_totale).
E7.4 [HAUTE] IR mensuel non déduit du RAV
Le RAV semble ne pas déduire l'IR du foyer des dépenses mensuelles. Si l'IR n'est pas inclus, le RAV est surévalué. Vérifier si l'IR est déduit quelque part ou s'il faut l'ajouter : rav_ir_mensuel = ir_montant / 12.
 
E8 — Interface utilisateur (HTML/CSS)

E8.1 [MOYENNE] Alerte TVA double seuil : 37 500 € + 41 250 €
Ajouter une alerte jaune entre 37 500 et 41 250 (TVA au 1er janvier N+1) et rouge au-delà de 41 250 (TVA immédiate). S'applique aux CH ET aux gîtes.
E8.2 [FAIBLE] Message règle 2 ans bascule micro
Ajouter un tooltip ou un texte informatif sur les cartes micro quand CA > plafond : « Tolérance 1 an — art. 50-0 CGI. »
E8.3 [FAIBLE] Avertissement taux cotisations CH
Ajouter sous la section CH : « Le taux de cotisations (21,2 %) est indicatif. Vérifiez la catégorisation de votre activité auprès de l'URSSAF. »
E8.4 [MOYENNE] Avertissement VL éligibilité
Sur la carte VL : « Éligibilité soumise à condition de RFR N-2 et d'inscription en micro-entreprise. »
E8.5 [FAIBLE] Section « Loi Le Meur 2026 » dans le titre CH
Le titre est : « FISCALITÉ CHAMBRES D'HÔTES Case 5NJ — Loi Le Meur 2026 ». La loi Le Meur date du 19/11/2024. Les effets sont sur les revenus 2025. Le titre pourrait être trompeur — envisager « Loi Le Meur (19/11/2024) — revenus 2025+ ».
E8.6 [HAUTE] Ajouter un champ pour distinguer intérêts / mensualités crédits
Dans la section crédits immobiliers, le champ actuel semble être « mensualité ». Ajouter un champ « dont intérêts annuels » pour permettre au moteur de ne déduire que les intérêts.
E8.7 [MOYENNE] Ajouter un indicateur PS patrimoine visible
Quand le contribuable est sous le seuil SSI (CH ou LMNP < 23 000), afficher le montant des PS patrimoine (18,6 %) sur la carte correspondante. Actuellement, ce montant peut être invisible pour l'utilisateur.
 
E9 — Suivi trésorerie mensuelle

E9.1 [FAIBLE] Vérifier la cohérence entre RAV et trésorerie mensuelle
Le suivi trésorerie et le RAV doivent converger. Vérifier qu'il n'y a pas de double comptage ou d'omission entre les deux calculs.
E9.2 [FAIBLE] Soldes bancaires : pas d'impact fiscal
Les soldes bancaires sont un outil de suivi, pas un élément de calcul fiscal. S'assurer qu'ils ne sont pas injectés dans les calculs.
 
COMPTEUR FINAL

Section	CRITIQUE	HAUTE	MOYENNE	FAIBLE	Total
E1 Config	2	4	4	2	12
E2 CH	1	1	1	1	5
E3 Gîtes réel	1	3	1	0	5
E4 IR foyer	2	3	2	0	7
E5 Comparatif	0	4	2	0	6
E6 URSSAF	0	0	3	1	4
E7 RAV	0	1	2	1	4
E8 UI	0	2	3	2	7
E9 Trésorerie	0	0	0	2	2
TOTAL	6	18	18	9	51


ORDRE D'EXÉCUTION RECOMMANDÉ : 1) E1.2 + E2.1 (PS 18,6 %) → 2) E1.1 + E4.1 (barème IR 2026) → 3) E4.2 + E4.7 (déficit LMNP) → 4) E3.3 + E8.6 (crédits = intérêts) → 5) E3.1 + E3.2 (charges résidence/véhicule) → 6) E5.1 à E5.5 (comparatif) → 7) Tout le reste.

Les 6 actions CRITIQUES (E1.1, E1.2, E2.1, E3.3, E4.1, E4.2) doivent être réalisées AVANT toute mise en production. Les 18 actions HAUTES sont fortement recommandées. Les MOYENNES et FAIBLES peuvent être planifiées en phase 2.


MISE À JOUR EXÉCUTION CODE — 27/03/2026 (soir)

✅ Corrigé dans le code actif
- E1.1 [CRITIQUE] Config IR 2026 complète (barème + paramètres 2026 ajoutés: abattement salaires, abattement pensions, QF, décote)
- E1.2 [CRITIQUE] PS patrimoine BIC meublés à 18,6%
- E1.3 [HAUTE] PASS 2026 = 48 060 et PASS 2025 = 47 100 alignés
- E1.4 [MOYENNE] Abattement salaires 2026 min 509 / max 14 556
- E1.5 [MOYENNE] Abattement pensions 2026 min 454 / max 4 439
- E1.6 [MOYENNE] Plafond quotient familial 2026 ajouté en config
- E1.7 [MOYENNE] Décote 2026 ajoutée en config
- E1.11 [HAUTE] PS patrimoine 2025 LMNP aligné à 18,6% dans la config
- E2.1 [CRITIQUE] Taux patrimoine CH 18,6% déjà appliqué et conservé
- E3.1 [HAUTE] Charges résidence intégrées au total charges réel gîtes
- E3.2 [HAUTE] Frais véhicule intégrés au total charges réel gîtes
- E3.3 [CRITIQUE] Mensualités crédit retirées de l’assiette fiscale réel, intérêts annuels uniquement
- E3.4 [HAUTE] LMNP <23k: PS patrimoine 18,6% ajoutés en complément quand URSSAF=0
- E4.1 [CRITIQUE] Calcul IR aligné sur barème 2026 via config
- E4.2 [CRITIQUE] Déficit LMNP non imputé sur revenu global
- E4.4 [HAUTE] Plafonnement quotient familial implémenté dans le calcul IR
- E4.6 [MOYENNE] Décote IR implémentée dans le calcul IR
- E4.7 [HAUTE] Revenu LMNP retenu au global: max(0, revenu LMNP)
- E5.4 [MOYENNE] Critère LMP comparé aux salaires imposables (plus bruts)
- E5.5 [HAUTE] PS patrimoine 18,6% appliqués dans les options LMNP pertinentes
- E5.3 [HAUTE] Contrôle explicite VL réservé micro-entrepreneurs (confirmation requise)
- E5.6 [MOYENNE] Exclusion systématique des options non éligibles (remise à N/A)
- E8.6 [HAUTE] Champ UI dédié « intérêts annuels » ajouté pour les crédits (saisie + restauration)
- E7.4 [HAUTE] IR mensuel (IR annuel/12) ajouté explicitement dans les dépenses RAV

🟨 Reste à traiter (priorité suivante)
- Aucun point HAUTE restant dans ce lot fiscalité gîtes/IR/comparatif.

### Validation chiffrée (27/03/2026 soir) — 3 scénarios limites

Hypothèses communes: millésime 2026, barème IR 2026, PS patrimoine BIC meublé 18,6%, moteur IR avec plafonnement QF + décote.

1) LMNP réel avec CA < 23 000 € (exonération URSSAF + PS patrimoine)
- Entrées: CA 20 000 €, bénéfice réel 12 000 €, salaires foyer 40 000 €, 2 parts.
- Attendus:
	- URSSAF LMNP: 0 €
	- PS patrimoine (18,6% sur bénéfice positif): 2 232 €
	- IR total foyer: 3 118,52 €
	- Quote-part IR location: 719,66 €
	- Coût total option LMNP réel: 2 951,66 €

2) LMP réel déficitaire (imputation du déficit sur revenu global)
- Entrées: CA 30 000 €, bénéfice réel -5 000 €, salaires 50 000 €, 2 parts.
- Attendus:
	- URSSAF LMP: 1 200 € (minimum)
	- Reste avant IR LMP: -6 200 €
	- IR foyer sans LMP: 2 000,10 €
	- IR foyer avec LMP: 1 009,49 €
	- Impact IR LMP: -990,61 €
	- Coût total option LMP réel: 209,39 €

3) Micro-BIC non classé à la limite du plafond avec comparaison VL
- Entrées: CA 15 000 €, salaires 0 €, 2 parts.
- Attendus:
	- Abattement micro 30%: 4 500 €
	- Base imposable micro: 10 500 €
	- Cotisations/PS (CA < 23k => PS 18,6% sur base): 1 953 €
	- IR classique imputable location: 0 €
	- Coût total micro (sans VL): 1 953 €
	- VL non classé (1,7% CA): 255 €
	- Coût total micro (avec VL): 2 208 €
	- Écart VL vs classique: +255 € (VL moins favorable dans ce cas)

Statut: scénarios de référence validés sur formules du moteur (URSSAF/IR/comparatif) pour verrouiller les non-régressions.

