# 🔗 Guide d'Intégration API Abritel/Expedia Group

> **Documentation officielle** : https://developers.expediagroup.com/supply/lodging/docs/  
> **Date** : 23 janvier 2026  
> **Statut** : Phase de préparation

---

## 🎯 Objectif

Intégrer l'API officielle Abritel/Expedia Group pour :
- ✅ **Synchronisation bidirectionnelle** des réservations
- ✅ **Mise à jour automatique** des disponibilités
- ✅ **Gestion des tarifs** en temps réel
- ✅ **Récupération des données clients** (avec leur consentement)
- ✅ **Notifications instantanées** nouvelles réservations

---

## 📋 Prérequis Obligatoires

### 1. Avoir un Compte Professionnel Abritel
- ✅ **Compte actif** sur Abritel/HomeAway
- ✅ **Au moins 1 propriété publiée** et validée
- ✅ **Statut** : Propriétaire vérifié
- ✅ **Accès** : Extranet Abritel/Expedia

### 2. Prérequis Techniques
- ✅ **Environnement de développement** : Node.js ou équivalent
- ✅ **Serveur HTTPS** : Obligatoire pour webhooks
- ✅ **URL publique** : Pour recevoir les notifications
- ✅ **Stockage sécurisé** : Pour tokens et credentials

### 3. Prérequis Légaux
- ✅ **Entreprise enregistrée** (SIRET/SIREN pour France)
- ✅ **Conformité RGPD** : Politique de confidentialité à jour
- ✅ **CGU acceptées** : Expedia Group Developer Agreement
- ✅ **Assurances** : Responsabilité civile professionnelle

---

## 🚀 ÉTAPE 1 : Inscription au Programme Développeur

### 1.1 Créer un Compte Développeur

**🔗 URL d'inscription** : https://developers.expediagroup.com/

#### Actions à Effectuer :
1. **Cliquer sur "Sign Up" ou "Get Started"**
2. **Remplir le formulaire** :
   - Nom complet
   - Email professionnel (gite.welcomehome@gmail.com)
   - Nom de l'entreprise : "Welcome Home"
   - Type d'organisation : "Property Owner" ou "Property Manager"
   - Téléphone professionnel
   - Pays : France
   
3. **Accepter les conditions** :
   - ☑️ Expedia Group Developer Agreement
   - ☑️ Terms of Service
   - ☑️ Privacy Policy

4. **Vérifier l'email** :
   - Cliquer sur le lien de confirmation reçu
   - Compléter le profil si demandé

### 1.2 Compléter le Profil Développeur

Une fois connecté à votre compte développeur :

1. **Informations entreprise** :
   - Raison sociale
   - SIRET/SIREN
   - Adresse complète
   - Téléphone
   - Site web (si disponible)

2. **Type d'intégration souhaitée** :
   - ☑️ Lodging Supply API (gestion propriétés)
   - ☑️ Notification API (webhooks)
   - ☑️ Reservation API (si disponible)

3. **Cas d'usage** :
   - Description : "Synchronisation automatique des réservations et disponibilités entre notre système de gestion interne et Abritel/Expedia"
   - Volume estimé : "1-5 propriétés, <100 réservations/mois"

---

## 🔑 ÉTAPE 2 : Créer une Application

### 2.1 Accéder à l'Espace Applications

1. **Se connecter** : https://developers.expediagroup.com/
2. **Naviguer vers** : "My Applications" ou "Dashboard"
3. **Cliquer sur** : "Create New Application" ou "+ New App"

### 2.2 Configuration de l'Application

#### Informations Générales
```
Nom de l'application : Welcome Home - Gestion Gîtes
Description : Système de gestion centralisé pour locations saisonnières
Type : Lodging Supply Integration
Environnement : Production (après tests en Sandbox)
```

#### URLs de Callback (Webhooks)
```
Production : https://votre-domaine.com/api/webhooks/abritel
Test : https://votre-domaine-test.com/api/webhooks/abritel
```

#### Scopes (Permissions) Requis
Cocher les autorisations nécessaires :
- ✅ **read:properties** - Lire les informations des propriétés
- ✅ **write:properties** - Modifier les informations des propriétés
- ✅ **read:reservations** - Lire les réservations
- ✅ **write:rates** - Gérer les tarifs
- ✅ **write:availability** - Gérer les disponibilités
- ✅ **read:guests** - Lire les informations clients (si autorisé)
- ✅ **webhooks** - Recevoir notifications temps réel

### 2.3 Récupérer les Credentials

Une fois l'application créée, vous recevrez :

```javascript
{
  "client_id": "votre_client_id",
  "client_secret": "votre_client_secret", // ⚠️ NE JAMAIS PARTAGER
  "api_key": "votre_api_key",
  "sandbox_url": "https://api.sandbox.expediagroup.com",
  "production_url": "https://api.expediagroup.com"
}
```

**🚨 SÉCURITÉ CRITIQUE** :
- **NE JAMAIS** commiter ces credentials dans Git
- **Stocker** dans des variables d'environnement
- **Utiliser** Supabase Vault ou équivalent pour stockage sécurisé

---

## 🔐 ÉTAPE 3 : Authentification OAuth 2.0

### 3.1 Comprendre le Flow OAuth

L'API Abritel/Expedia utilise **OAuth 2.0 Client Credentials Flow** :

```
1. Votre App → Demande token avec client_id + client_secret
2. Expedia → Retourne access_token (valide ~1h)
3. Votre App → Utilise access_token dans toutes les requêtes
4. Token expire → Regénérer nouveau token
```

### 3.2 Obtenir un Access Token

#### Requête HTTP
```http
POST https://api.expediagroup.com/identity/oauth2/v3/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic base64(client_id:client_secret)

grant_type=client_credentials
&scope=read:properties write:properties read:reservations
```

#### Exemple avec Node.js/Fetch
```javascript
const clientId = process.env.ABRITEL_CLIENT_ID;
const clientSecret = process.env.ABRITEL_CLIENT_SECRET;

// Encoder credentials en Base64
const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

async function getAccessToken() {
  const response = await fetch('https://api.expediagroup.com/identity/oauth2/v3/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'read:properties write:properties read:reservations write:rates write:availability'
    })
  });

  const data = await response.json();
  
  return {
    access_token: data.access_token,
    expires_in: data.expires_in, // En secondes (généralement 3600 = 1h)
    token_type: data.token_type // "Bearer"
  };
}
```

#### Réponse Attendue
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read:properties write:properties read:reservations"
}
```

### 3.3 Utiliser le Token dans les Requêtes

```javascript
async function makeApiRequest(endpoint, method = 'GET', body = null) {
  const token = await getAccessToken(); // Récupérer ou utiliser token en cache
  
  const options = {
    method: method,
    headers: {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`https://api.expediagroup.com${endpoint}`, options);
  return await response.json();
}
```

### 3.4 Gestion du Refresh Token

**Important** : Les tokens expirent après ~1h. Stratégie recommandée :

```javascript
// Cache token avec timestamp
let cachedToken = null;
let tokenExpiry = null;

async function getValidToken() {
  const now = Date.now();
  
  // Si token existe et n'a pas expiré (avec marge de 5 min)
  if (cachedToken && tokenExpiry && now < tokenExpiry - 300000) {
    return cachedToken;
  }
  
  // Sinon, récupérer nouveau token
  const tokenData = await getAccessToken();
  cachedToken = tokenData.access_token;
  tokenExpiry = now + (tokenData.expires_in * 1000);
  
  return cachedToken;
}
```

---

## 🏠 ÉTAPE 4 : Lier vos Propriétés

### 4.1 Récupérer vos Propriétés Abritel

Une fois authentifié, récupérer la liste de vos propriétés :

```javascript
async function getProperties() {
  const properties = await makeApiRequest('/supply/lodging/v1/properties', 'GET');
  console.log('Propriétés trouvées:', properties);
  return properties;
}
```

#### Réponse Exemple
```json
{
  "properties": [
    {
      "property_id": "12345678",
      "name": "Gîte de Trevoux",
      "address": {
        "line1": "2 Grande Rue",
        "city": "Trevoux",
        "postal_code": "01600",
        "country": "FR"
      },
      "status": "active",
      "listing_id": "987654321"
    }
  ]
}
```

### 4.2 Mapper avec vos Gîtes Locaux

Dans votre table `gites`, ajouter une colonne :

```sql
ALTER TABLE gites 
ADD COLUMN abritel_property_id TEXT,
ADD COLUMN abritel_listing_id TEXT,
ADD COLUMN abritel_sync_enabled BOOLEAN DEFAULT false;
```

Puis faire le mapping :

```javascript
async function linkPropertyToGite(giteId, abritelPropertyId) {
  const { data, error } = await supabase
    .from('gites')
    .update({
      abritel_property_id: abritelPropertyId,
      abritel_sync_enabled: true
    })
    .eq('id', giteId);
    
  if (error) throw error;
  console.log('✅ Gîte lié à Abritel');
}
```

---

## 📅 ÉTAPE 5 : Synchroniser les Réservations

### 5.1 Récupérer les Réservations

```javascript
async function getReservations(propertyId, startDate, endDate) {
  const endpoint = `/supply/lodging/v1/properties/${propertyId}/reservations`;
  const params = new URLSearchParams({
    arrival_date_start: startDate, // Format: YYYY-MM-DD
    arrival_date_end: endDate
  });
  
  const reservations = await makeApiRequest(`${endpoint}?${params}`, 'GET');
  return reservations;
}

// Exemple d'utilisation
const reservations = await getReservations('12345678', '2026-01-01', '2026-12-31');
```

#### Structure Réservation Retournée
```json
{
  "reservations": [
    {
      "reservation_id": "ABC123456",
      "property_id": "12345678",
      "status": "confirmed",
      "guest": {
        "first_name": "Jean",
        "last_name": "Dupont",
        "email": "jean.dupont@example.com",
        "phone": "+33612345678"
      },
      "check_in": "2026-02-15",
      "check_out": "2026-02-22",
      "nights": 7,
      "guests": 4,
      "total_amount": 850.00,
      "currency": "EUR",
      "booking_date": "2026-01-10T14:30:00Z"
    }
  ]
}
```

### 5.2 Importer dans votre BDD

```javascript
async function importReservationFromAbritel(abritelReservation) {
  // 1. Trouver le gîte correspondant
  const { data: gite } = await supabase
    .from('gites')
    .select('id')
    .eq('abritel_property_id', abritelReservation.property_id)
    .single();
  
  if (!gite) {
    console.error('❌ Gîte non trouvé pour property_id:', abritelReservation.property_id);
    return;
  }
  
  // 2. Vérifier si réservation existe déjà
  const { data: existing } = await supabase
    .from('reservations')
    .select('id')
    .eq('external_booking_id', abritelReservation.reservation_id)
    .single();
  
  if (existing) {
    console.log('ℹ️ Réservation déjà importée');
    return;
  }
  
  // 3. Insérer la réservation
  const { data, error } = await supabase
    .from('reservations')
    .insert({
      gite_id: gite.id,
      external_booking_id: abritelReservation.reservation_id,
      platform: 'abritel',
      guest_name: `${abritelReservation.guest.first_name} ${abritelReservation.guest.last_name}`,
      guest_email: abritelReservation.guest.email,
      guest_phone: abritelReservation.guest.phone,
      check_in: abritelReservation.check_in,
      check_out: abritelReservation.check_out,
      nights: abritelReservation.nights,
      guests: abritelReservation.guests,
      total_price: abritelReservation.total_amount,
      currency: abritelReservation.currency,
      status: abritelReservation.status,
      booking_date: abritelReservation.booking_date
    });
  
  if (error) {
    console.error('❌ Erreur insertion:', error);
    throw error;
  }
  
  console.log('✅ Réservation importée:', data);
}
```

---

## 🔔 ÉTAPE 6 : Configurer les Webhooks (Notifications Temps Réel)

### 6.1 Pourquoi les Webhooks ?

Au lieu de poller l'API toutes les X minutes, recevez des notifications instantanées :
- ✅ **Nouvelle réservation**
- ✅ **Modification réservation**
- ✅ **Annulation**
- ✅ **Changement de statut**

### 6.2 Créer un Endpoint Webhook

**URL publique requise** : `https://votre-domaine.com/api/webhooks/abritel`

#### Exemple avec Supabase Edge Function

```typescript
// Fichier: supabase/functions/webhook-abritel/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Vérifier la signature (sécurité)
  const signature = req.headers.get('X-Expedia-Signature');
  // TODO: Valider signature avec webhook_secret
  
  // Parser le payload
  const payload = await req.json();
  console.log('📥 Webhook Abritel reçu:', payload);
  
  // Initialiser Supabase
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // Traiter selon le type d'événement
  switch (payload.event_type) {
    case 'reservation.created':
      await handleNewReservation(supabase, payload.data);
      break;
    case 'reservation.modified':
      await handleReservationUpdate(supabase, payload.data);
      break;
    case 'reservation.cancelled':
      await handleReservationCancellation(supabase, payload.data);
      break;
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  });
});

async function handleNewReservation(supabase, reservation) {
  // Logique d'import (similaire à 5.2)
  console.log('✅ Nouvelle réservation traitée');
}
```

### 6.3 Enregistrer le Webhook dans Expedia

Via le Developer Portal :

1. **Naviguer vers** : "Webhooks" ou "Notifications"
2. **Cliquer sur** : "Add Webhook"
3. **Configuration** :
   ```
   URL: https://votre-domaine.com/api/webhooks/abritel
   Events: 
     ☑️ reservation.created
     ☑️ reservation.modified
     ☑️ reservation.cancelled
   Secret: [généré automatiquement - À sauvegarder]
   ```

4. **Tester** : Expedia enverra un ping pour valider l'URL

---

## 📤 ÉTAPE 7 : Envoyer des Disponibilités (API → Abritel)

### 7.1 Bloquer des Dates

Lorsqu'une réservation est créée localement, bloquer les dates sur Abritel :

```javascript
async function blockDatesOnAbritel(propertyId, startDate, endDate) {
  const endpoint = `/supply/lodging/v1/properties/${propertyId}/availability`;
  
  const body = {
    availability: [
      {
        start_date: startDate, // YYYY-MM-DD
        end_date: endDate,
        status: "unavailable",
        min_stay: null,
        max_stay: null
      }
    ]
  };
  
  const response = await makeApiRequest(endpoint, 'PUT', body);
  console.log('✅ Dates bloquées sur Abritel:', response);
  return response;
}

// Utilisation
await blockDatesOnAbritel('12345678', '2026-03-15', '2026-03-22');
```

### 7.2 Libérer des Dates

En cas d'annulation :

```javascript
async function unblockDatesOnAbritel(propertyId, startDate, endDate) {
  const endpoint = `/supply/lodging/v1/properties/${propertyId}/availability`;
  
  const body = {
    availability: [
      {
        start_date: startDate,
        end_date: endDate,
        status: "available"
      }
    ]
  };
  
  await makeApiRequest(endpoint, 'PUT', body);
  console.log('✅ Dates libérées sur Abritel');
}
```

---

## 💰 ÉTAPE 8 : Gérer les Tarifs (Optionnel)

### 8.1 Mettre à Jour les Prix

```javascript
async function updateRatesOnAbritel(propertyId, rates) {
  const endpoint = `/supply/lodging/v1/properties/${propertyId}/rates`;
  
  const body = {
    rates: rates.map(rate => ({
      date: rate.date, // YYYY-MM-DD
      amount: rate.price,
      currency: "EUR"
    }))
  };
  
  await makeApiRequest(endpoint, 'PUT', body);
  console.log('✅ Tarifs mis à jour sur Abritel');
}

// Exemple
await updateRatesOnAbritel('12345678', [
  { date: '2026-07-01', price: 150 },
  { date: '2026-07-02', price: 150 },
  { date: '2026-08-15', price: 200 } // Haute saison
]);
```

---

## 🧪 ÉTAPE 9 : Tester en Sandbox

### 9.1 Environnement de Test

Avant production, tester avec l'environnement Sandbox :

```javascript
const SANDBOX_URL = 'https://api.sandbox.expediagroup.com';
const PRODUCTION_URL = 'https://api.expediagroup.com';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? PRODUCTION_URL 
  : SANDBOX_URL;
```

### 9.2 Scénarios de Test

1. ✅ **Authentification** : Obtenir token
2. ✅ **Lister propriétés** : Récupérer vos biens
3. ✅ **Créer réservation test** : Via le portail Sandbox
4. ✅ **Récupérer réservations** : Vérifier import
5. ✅ **Bloquer dates** : Tester disponibilités
6. ✅ **Webhook** : Recevoir notification test
7. ✅ **Annulation** : Tester le flow complet

---

## 📊 ÉTAPE 10 : Migration en Production

### 10.1 Checklist Avant Production

- [ ] **Tests Sandbox** : Tous scénarios validés
- [ ] **Credentials Production** : Client ID/Secret récupérés
- [ ] **Webhooks configurés** : URL HTTPS publique
- [ ] **Sécurité** : Credentials dans variables d'environnement
- [ ] **Logs** : Système de logging en place
- [ ] **Monitoring** : Alertes en cas d'erreur API
- [ ] **Backup** : Données critiques sauvegardées
- [ ] **Documentation** : Procédures d'urgence rédigées

### 10.2 Passer en Production

1. **Changer les credentials** :
   ```javascript
   // .env.production
   ABRITEL_CLIENT_ID=prod_client_id
   ABRITEL_CLIENT_SECRET=prod_client_secret
   ABRITEL_API_URL=https://api.expediagroup.com
   ```

2. **Mettre à jour les webhooks** :
   - URL production
   - Tester avec ping

3. **Synchronisation initiale** :
   ```javascript
   // Import de toutes les réservations existantes
   await importAllReservations();
   ```

4. **Activer le monitoring** :
   - Logs Supabase
   - Alertes email/SMS si erreur

---

## 🚨 Gestion des Erreurs

### Codes d'Erreur Courants

```javascript
async function handleApiError(response) {
  switch (response.status) {
    case 401:
      console.error('❌ Token invalide ou expiré - Régénérer');
      await getAccessToken(); // Forcer refresh
      break;
    case 403:
      console.error('❌ Permission refusée - Vérifier scopes');
      break;
    case 404:
      console.error('❌ Ressource non trouvée');
      break;
    case 429:
      console.error('⏸️ Rate limit atteint - Attendre');
      await sleep(60000); // Attendre 1 minute
      break;
    case 500:
      console.error('❌ Erreur serveur Expedia - Réessayer plus tard');
      break;
    default:
      console.error('❌ Erreur inconnue:', response.status);
  }
}
```

### Retry Logic

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return await response.json();
      
      if (i === maxRetries - 1) throw new Error(`Failed after ${maxRetries} retries`);
      
      await sleep(Math.pow(2, i) * 1000); // Backoff exponentiel
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

---

## 💡 Bonnes Pratiques

### Sécurité
1. ✅ **Jamais de credentials en dur** dans le code
2. ✅ **HTTPS obligatoire** pour webhooks
3. ✅ **Valider signatures** des webhooks
4. ✅ **Rate limiting** : Respecter les limites API
5. ✅ **Logs sensibles** : Ne pas logger tokens/secrets

### Performance
1. ✅ **Cache tokens** : Ne pas regénérer à chaque requête
2. ✅ **Batch operations** : Grouper mises à jour
3. ✅ **Pagination** : Gérer les grandes listes
4. ✅ **Webhooks > Polling** : Utiliser notifications temps réel

### Fiabilité
1. ✅ **Idempotence** : Gérer doublons (external_booking_id unique)
2. ✅ **Retry automatique** : En cas d'échec temporaire
3. ✅ **Monitoring** : Alertes en cas d'erreur
4. ✅ **Fallback iCal** : Si API down, utiliser iCal en backup

---

## 📞 Support et Documentation

### Ressources Officielles
- **Documentation API** : https://developers.expediagroup.com/supply/lodging/docs/
- **API Reference** : https://developers.expediagroup.com/supply/lodging/apis/
- **Status Page** : https://status.expediagroup.com/
- **Forum Développeurs** : https://community.expediagroup.com/

### Support Expedia
- **Email** : developer-support@expediagroup.com
- **Ticket** : Via Developer Portal
- **SLA** : Réponse sous 24-48h

---

## 🗺️ Roadmap d'Intégration

### Phase 1 : Préparation (Semaine 1-2)
- [ ] Créer compte développeur
- [ ] Créer application
- [ ] Obtenir credentials
- [ ] Tester authentification Sandbox

### Phase 2 : Développement (Semaine 3-4)
- [ ] Implémenter authentification OAuth
- [ ] Récupérer propriétés
- [ ] Mapper gîtes locaux
- [ ] Import réservations
- [ ] Tests Sandbox complets

### Phase 3 : Webhooks (Semaine 5)
- [ ] Créer endpoint webhook
- [ ] Configurer URL publique (HTTPS)
- [ ] Enregistrer webhooks Expedia
- [ ] Tester notifications

### Phase 4 : Synchronisation Bidirectionnelle (Semaine 6)
- [ ] Bloquer/libérer dates depuis local
- [ ] Mettre à jour tarifs (optionnel)
- [ ] Tests E2E complets

### Phase 5 : Production (Semaine 7-8)
- [ ] Checklist validation complète
- [ ] Migration credentials production
- [ ] Synchronisation initiale
- [ ] Monitoring actif
- [ ] Documentation finale

---

## ✅ Checklist Complète

### Compte et Accès
- [ ] Compte développeur créé
- [ ] Application créée et validée
- [ ] Credentials récupérés (client_id, client_secret)
- [ ] Accès API testé

### Base de Données
- [ ] Colonnes Abritel ajoutées à table `gites`
- [ ] Colonne `external_booking_id` unique
- [ ] Index créés pour performance

### Code
- [ ] Authentification OAuth fonctionnelle
- [ ] Cache tokens implémenté
- [ ] Import réservations testé
- [ ] Gestion erreurs robuste
- [ ] Logs configurés

### Webhooks
- [ ] Endpoint créé (HTTPS)
- [ ] Signature validation implémentée
- [ ] Événements gérés (create, update, cancel)
- [ ] Tests réussis

### Production
- [ ] Tests Sandbox OK
- [ ] Credentials production configurés
- [ ] Webhooks production enregistrés
- [ ] Monitoring en place
- [ ] Documentation à jour

---

## 📝 Notes Importantes

### Limitations API
- **Rate Limiting** : Vérifier les limites dans la doc (ex: 100 req/min)
- **Pagination** : Max 100 résultats par page généralement
- **Délai sync** : Peut prendre quelques minutes

### Données Personnelles (RGPD)
- **Consentement client** : Requis pour accéder aux données
- **Durée conservation** : Limiter au nécessaire
- **Droit à l'oubli** : Implémenter suppression

### Coûts
- **API gratuite** : Généralement incluse pour propriétaires
- **Volume** : Vérifier limites gratuites
- **Support** : Premium payant si besoin

---

**🎯 Prochaine Action** : Créer votre compte développeur sur https://developers.expediagroup.com/

**📧 Questions ?** : Contacter developer-support@expediagroup.com

---

**Document préparé pour Welcome Home - Gestion Gîte Calvignac**  
*Mise à jour au fur et à mesure de l'intégration*
