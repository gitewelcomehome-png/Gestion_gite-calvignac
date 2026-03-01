-- ================================================================
-- 🧠 SOLUTIONS DE BASE POUR L'IA
-- ================================================================
-- Insertion de solutions types pour démarrer l'auto-réponse
-- Contexte : Support pour utilisateurs de l'application de gestion
-- ================================================================

-- Solution 1 : Problème synchronisation calendrier
INSERT INTO cm_support_solutions (
    titre,
    description_probleme,
    symptomes,
    tags,
    categorie,
    solution,
    temps_resolution_estime,
    nb_utilisations,
    efficacite_score,
    created_at,
    updated_at
) VALUES (
    'Erreur de synchronisation du calendrier',
    'L''utilisateur ne voit pas ses réservations synchronisées avec les calendriers externes (Airbnb, Booking)',
    ARRAY['synchronisation', 'calendrier', 'ical', 'airbnb', 'booking', 'réservations', 'affichage'],
    ARRAY['technique', 'haute'],
    'technique',
    '🔄 **Problème de synchronisation calendrier** :

**Vérifications immédiates** :
1. Vérifiez que l''URL iCal est bien configurée dans les paramètres
2. La synchronisation peut prendre jusqu''à 15 minutes
3. Videz le cache du navigateur (Ctrl+Shift+Delete)

**Solution étape par étape** :
1. Allez dans **Paramètres** → **Calendriers**
2. Cliquez sur "Forcer la synchronisation"
3. Vérifiez que les URLs iCal sont actives (testez-les dans un navigateur)
4. Si le problème persiste, supprimez et recréez la connexion

**Causes fréquentes** :
- URL iCal expirée → Régénérez-la sur la plateforme source
- Trop de réservations → La synchronisation prend plus de temps
- Blocage CORS → Vérifiez vos paramètres de sécurité

💡 **Astuce** : Utilisez le mode "Debug" dans les paramètres pour voir les logs de synchronisation.',
    10,
    0,
    0.85,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Solution 2 : Problème de connexion
INSERT INTO cm_support_solutions (
    titre,
    description_probleme,
    symptomes,
    tags,
    categorie,
    solution,
    temps_resolution_estime,
    nb_utilisations,
    efficacite_score
) VALUES (
    'Impossible de se connecter à l''application',
    'L''utilisateur ne parvient pas à se connecter avec ses identifiants',
    ARRAY['connexion', 'login', 'mot de passe', 'authentification', 'accès'],
    ARRAY['technique', 'haute'],
    'technique',
    '🔐 **Problème de connexion** :

**Solutions rapides** :
1. **Mot de passe oublié ?** 
   - Cliquez sur "Mot de passe oublié" sur la page de connexion
   - Vérifiez vos emails (spam inclus)
   - Le lien est valide 1 heure

2. **Compte bloqué ?**
   - Après 5 tentatives échouées, le compte est bloqué 15 minutes
   - Attendez ou demandez un reset

3. **Vérifiez votre email**
   - Email correct ? Pas de faute de frappe ?
   - Majuscules/minuscules ne comptent pas

**Si ça ne fonctionne toujours pas** :
- Videz le cache navigateur
- Essayez en navigation privée
- Testez avec un autre navigateur
- Vérifiez que JavaScript est activé

⚠️ **Sécurité** : Nous ne demandons JAMAIS votre mot de passe par email ou téléphone.',
    5,
    0,
    0.95
) ON CONFLICT DO NOTHING;

-- Solution 3 : Erreur lors de la création de réservation
INSERT INTO cm_support_solutions (
    titre,
    description_probleme,
    symptomes,
    tags,
    categorie,
    solution,
    temps_resolution_estime,
    nb_utilisations,
    efficacite_score
) VALUES (
    'Erreur lors de la création de réservation',
    'Message d''erreur lors de la tentative de création d''une nouvelle réservation',
    ARRAY['réservation', 'erreur', 'création', 'sauvegarder', 'enregistrer'],
    ARRAY['bug', 'haute'],
    'bug',
    '❌ **Erreur création de réservation** :

**Vérifications** :
1. **Conflit de dates** : Vérifiez qu''aucune autre réservation n''existe sur ces dates
2. **Dates invalides** : Date de fin doit être après date de début
3. **Champs obligatoires** : Nom, dates, gîte doivent être remplis

**Solutions** :
1. Rafraîchissez la page (F5)
2. Vérifiez le calendrier pour voir les créneaux disponibles
3. Si le problème persiste, notez le message d''erreur exact

**Messages d''erreur courants** :
- "Conflit de dates" → Une réservation existe déjà
- "Champ requis" → Remplissez tous les champs obligatoires  
- "Erreur serveur" → Réessayez dans quelques minutes

📋 **Si l''erreur persiste**, envoyez-nous une capture d''écran avec le message d''erreur exact.',
    15,
    0,
    0.80
) ON CONFLICT DO NOTHING;

-- Solution 4 : Question sur la facturation
INSERT INTO cm_support_solutions (
    titre,
    description_probleme,
    symptomes,
    tags,
    categorie,
    solution,
    temps_resolution_estime,
    nb_utilisations,
    efficacite_score
) VALUES (
    'Questions sur la facturation et l''abonnement',
    'L''utilisateur a des questions sur son abonnement, sa facture ou son paiement',
    ARRAY['facturation', 'abonnement', 'paiement', 'facture', 'prix', 'tarif'],
    ARRAY['facturation', 'normale'],
    'facturation',
    '💰 **Facturation & Abonnement** :

**Votre abonnement** :
- Consultez vos factures dans **Paramètres** → **Facturation**
- Téléchargez vos factures en PDF
- Modifiez vos informations de facturation

**Formules disponibles** :
- **Gratuit** : Jusqu''à 2 gîtes, fonctionnalités de base
- **Pro** : Gîtes illimités, calendriers synchronisés, support prioritaire
- **Premium** : Tout inclus + IA, analytics avancés, API

**Paiement** :
- Paiements sécurisés par Stripe
- Cartes acceptées : CB, Visa, Mastercard, Amex
- Renouvellement automatique (annulable à tout moment)

**Modifier/Annuler** :
- Sans engagement, annulation possible à tout moment
- Remboursement au prorata si annulation en cours de mois

📧 Pour une demande spécifique, précisez votre numéro de facture dans votre réponse.',
    3,
    0,
    0.90
) ON CONFLICT DO NOTHING;

-- Solution 5 : Aide utilisation fonctionnalité
INSERT INTO cm_support_solutions (
    titre,
    description_probleme,
    symptomes,
    tags,
    categorie,
    solution,
    temps_resolution_estime,
    nb_utilisations,
    efficacite_score
) VALUES (
    'Comment utiliser une fonctionnalité',
    'L''utilisateur demande comment utiliser une fonctionnalité de l''application',
    ARRAY['comment', 'utiliser', 'fonctionnalité', 'aide', 'tutoriel', 'guide'],
    ARRAY['autre', 'basse'],
    'autre',
    '📚 **Guides d''utilisation** :

**Ressources disponibles** :
1. **Centre d''aide** : Documentation complète accessible via le menu
2. **Tutoriels vidéo** : Chaîne YouTube avec démos
3. **FAQ** : Questions fréquentes dans les paramètres

**Fonctionnalités principales** :

🏠 **Gestion des gîtes** :
- Ajoutez vos gîtes dans "Mes Gîtes"
- Configurez tarifs, équipements, photos

📅 **Calendrier** :
- Vue mensuelle/annuelle
- Import/Export iCal
- Synchronisation Airbnb, Booking

💰 **Facturation** :
- Génération automatique de factures
- Suivi des paiements
- Déclarations fiscales

📊 **Analytics** :
- Taux d''occupation
- Revenus
- Statistiques clients

💡 **Besoin d''aide précise ?** Indiquez quelle fonctionnalité vous souhaitez utiliser dans votre réponse.',
    2,
    0,
    0.92
) ON CONFLICT DO NOTHING;

-- ================================================================
-- ✅ SOLUTIONS DE BASE CRÉÉES (APPLICATION SAAS)
-- ================================================================
-- L'IA dispose maintenant de 5 solutions adaptées au support applicatif
-- ================================================================
