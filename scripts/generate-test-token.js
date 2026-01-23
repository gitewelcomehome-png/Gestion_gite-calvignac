/**
 * Script pour générer un token de test pour la fiche client
 */

const crypto = require('crypto');

// Générer un token sécurisé
const token = crypto.randomBytes(32).toString('hex');

console.log('\n🔑 Token généré pour test :\n');
console.log(token);
console.log('\n📋 Commande SQL à exécuter dans Supabase :\n');

// Récupérer la première réservation pour le test
console.log(`-- 1. Trouvez un ID de réservation existant
SELECT id, client_nom FROM reservations LIMIT 1;

-- 2. Insérez le token (remplacez RESERVATION_ID par l'ID trouvé)
INSERT INTO client_access_tokens (token, reservation_id, expires_at, created_at)
VALUES (
  '${token}',
  'RESERVATION_ID',  -- Remplacez par un ID réel
  NOW() + INTERVAL '30 days',
  NOW()
);

-- 3. Utilisez ce lien pour tester :
-- pages/fiche-client.html?token=${token}
`);
