# 🎨 ROADMAP MULTI-TENANT - PARTIE 4/4
# FEATURES & PRIORISATION

**Date**: 7 janvier 2026  
**Suite de**: PART3_IMPLEMENTATION.md  
**Focus**: Toutes les fonctionnalités restantes avec priorités

---

## 📋 PHASES RESTANTES

### PHASE 2 - MIGRATION DONNÉES (3 jours - 18h)
### PHASE 3 - ONBOARDING (1 semaine - 30h)
### PHASE 4 - CHANNEL MANAGER (3 semaines - 90h)
### PHASE 5 - BOOKING ENGINE (2 semaines - 60h)
### PHASE 6 - FEATURES PREMIUM (4 semaines - 120h)
### PHASE 7 - POLISH & LAUNCH (1 semaine - 30h)

---

## 🔄 PHASE 2 - MIGRATION DONNÉES (3 jours - 18h)

### Objectif
Migrer vos données existantes vers nouveau schéma

### 2.1 - Créer votre organization (2h)

**Script SQL**:
```sql
-- 1. Créer votre organization
INSERT INTO organizations (
    name, slug, owner_user_id, plan, max_gites, max_users,
    email, phone, city, country
) VALUES (
    'Gîtes Calvignac',
    'gites-calvignac',
    'VOTRE_USER_ID', -- À remplacer
    'pro',
    999, -- Illimité
    999,
    'contact@gites-calvignac.fr',
    '06XXXXXXXX',
    'Calvignac',
    'France'
) RETURNING id;

-- Sauvegarder l'ID retourné
-- Ex: 'd8f5e6c7-1234-5678-90ab-cdef12345678'
```

### 2.2 - Créer vos gîtes (4h)

```sql
-- 2. Créer le gîte Trévoux
INSERT INTO gites (
    organization_id,
    name,
    slug,
    display_name,
    max_personnes,
    nombre_chambres,
    nombre_lits_doubles,
    adresse,
    ville,
    code_postal,
    latitude,
    longitude,
    prix_nuit_base,
    caution,
    frais_menage
) VALUES (
    'ORGANIZATION_ID', -- Remplacer
    'Trévoux',
    'trevoux',
    'Gîte Le Trévoux - Vue sur la vallée',
    6,
    3,
    3,
    'Adresse du Trévoux',
    'Calvignac',
    '46160',
    44.4773,
    1.9170,
    120.00,
    300.00,
    60.00
) RETURNING id;

-- 3. Créer le gîte Couzon
INSERT INTO gites (
    organization_id,
    name,
    slug,
    display_name,
    max_personnes,
    nombre_chambres,
    nombre_lits_doubles,
    adresse,
    ville,
    code_postal,
    latitude,
    longitude,
    prix_nuit_base,
    caution,
    frais_menage
) VALUES (
    'ORGANIZATION_ID',
    'Couzon',
    'couzon',
    'Gîte Le Couzon - Charme et authenticité',
    4,
    2,
    2,
    'Adresse du Couzon',
    'Calvignac',
    '46160',
    44.4773,
    1.9170,
    100.00,
    300.00,
    60.00
) RETURNING id;
```

### 2.3 - Migrer les réservations existantes (8h)

```sql
-- 4. Migrer réservations Trévoux
UPDATE reservations
SET 
    organization_id = 'ORGANIZATION_ID',
    gite_id = 'TREVOUX_GITE_ID'
WHERE LOWER(gite) LIKE '%trévoux%' OR LOWER(gite) LIKE '%trevoux%';

-- 5. Migrer réservations Couzon
UPDATE reservations
SET 
    organization_id = 'ORGANIZATION_ID',
    gite_id = 'COUZON_GITE_ID'
WHERE LOWER(gite) LIKE '%couzon%';

-- 6. Vérification
SELECT 
    COUNT(*) as total,
    COUNT(organization_id) as migrated,
    COUNT(*) - COUNT(organization_id) as remaining
FROM reservations;

-- 7. Rendre obligatoire après validation
ALTER TABLE reservations ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE reservations ALTER COLUMN gite_id SET NOT NULL;
```

### 2.4 - Migrer les autres tables (4h)

**Script automatique**:
```sql
-- Pattern pour chaque table:
-- cleaning_schedule, stocks_draps, retours_menage, charges, todos, etc.

-- 1. Associer au bon gîte selon colonne 'gite'
UPDATE cleaning_schedule cs
SET 
    organization_id = 'ORGANIZATION_ID',
    gite_id = (
        SELECT g.id 
        FROM gites g 
        WHERE LOWER(g.slug) = LOWER(cs.gite)
        AND g.organization_id = 'ORGANIZATION_ID'
        LIMIT 1
    );

-- 2. Vérifier
SELECT COUNT(*) as migrated 
FROM cleaning_schedule 
WHERE organization_id IS NOT NULL;

-- Répéter pour toutes les tables...
```

---

## 🎓 PHASE 3 - ONBOARDING (1 semaine - 30h)

### Objectif
Expérience zero-config pour nouveaux clients

### 3.1 - Page d'inscription améliorée (8h)

**Fichier**: `signup.html`

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <title>Créez votre compte - Gestion Gîtes</title>
</head>
<body>
    <div class="signup-container">
        <h1>🏡 Gérez vos gîtes simplement</h1>
        <p class="subtitle">Essai gratuit 14 jours • Sans carte bancaire</p>
        
        <form id="signupForm">
            <div class="form-group">
                <label>Votre email professionnel</label>
                <input type="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label>Mot de passe</label>
                <input type="password" name="password" required minlength="8">
                <small>8 caractères minimum</small>
            </div>
            
            <div class="form-group">
                <label>Nom de votre établissement</label>
                <input type="text" name="organization_name" placeholder="Ex: Gîtes du Moulin" required>
            </div>
            
            <button type="submit" class="btn-primary">
                Démarrer mon essai gratuit →
            </button>
        </form>
        
        <p class="terms">
            En continuant, vous acceptez nos 
            <a href="/cgu.html">CGU</a> et 
            <a href="/privacy.html">Politique de confidentialité</a>
        </p>
    </div>
    
    <script>
        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const email = formData.get('email');
            const password = formData.get('password');
            const orgName = formData.get('organization_name');
            
            try {
                // 1. Créer le compte Supabase Auth
                const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            organization_name: orgName
                        }
                    }
                });
                
                if (authError) throw authError;
                
                // 2. Rediriger vers onboarding
                window.location.href = `/onboarding.html?step=1&org=${encodeURIComponent(orgName)}`;
                
            } catch (error) {
                console.error('Erreur inscription:', error);
                alert('Erreur: ' + error.message);
            }
        });
    </script>
</body>
</html>
```

### 3.2 - Wizard onboarding (16h)

**Fichier**: `onboarding.html`

```html
<!-- ÉTAPE 1: Nombre de gîtes -->
<div id="step-1" class="onboarding-step active">
    <h2>Combien de gîtes gérez-vous ?</h2>
    
    <div class="number-selector">
        <button class="number-btn" data-count="1">1 gîte</button>
        <button class="number-btn" data-count="2">2 gîtes</button>
        <button class="number-btn" data-count="3-5">3 à 5</button>
        <button class="number-btn" data-count="6+">Plus de 5</button>
    </div>
    
    <input type="number" id="exact-count" min="1" max="50" 
           placeholder="Ou entrez le nombre exact">
    
    <button onclick="nextStep(2)">Suivant →</button>
</div>

<!-- ÉTAPE 2: Informations des gîtes -->
<div id="step-2" class="onboarding-step">
    <h2>Configurons vos gîtes</h2>
    <p>Renseignez les informations de base</p>
    
    <div id="gites-forms">
        <!-- Généré dynamiquement selon nombre choisi -->
        <div class="gite-form" data-index="0">
            <h3>🏠 Gîte 1</h3>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Nom du gîte *</label>
                    <input type="text" name="gite_name_0" placeholder="Ex: Le Trévoux" required>
                </div>
                
                <div class="form-group">
                    <label>Capacité (personnes) *</label>
                    <input type="number" name="gite_capacity_0" min="1" max="20" value="4" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Nombre de chambres</label>
                    <input type="number" name="gite_bedrooms_0" min="1" max="10" value="2">
                </div>
                
                <div class="form-group">
                    <label>Ville</label>
                    <input type="text" name="gite_city_0" placeholder="Ex: Calvignac">
                </div>
            </div>
            
            <div class="form-group">
                <label>Adresse complète</label>
                <input type="text" name="gite_address_0" placeholder="12 rue du Moulin">
            </div>
        </div>
        
        <!-- Répété N fois -->
    </div>
    
    <button onclick="prevStep(1)">← Retour</button>
    <button onclick="nextStep(3)">Suivant →</button>
</div>

<!-- ÉTAPE 3: Choix du plan -->
<div id="step-3" class="onboarding-step">
    <h2>Choisissez votre formule</h2>
    
    <div class="pricing-cards">
        <div class="price-card" data-plan="free">
            <div class="badge">GRATUIT</div>
            <h3>Découverte</h3>
            <div class="price">0€<span>/mois</span></div>
            <ul>
                <li>✅ 1 gîte</li>
                <li>✅ Réservations illimitées</li>
                <li>✅ Planning ménage</li>
                <li>✅ Sync iCal (import)</li>
                <li>❌ Channel Manager</li>
                <li>❌ Moteur de réservation</li>
            </ul>
            <button onclick="selectPlan('free')">Démarrer gratuitement</button>
        </div>
        
        <div class="price-card popular" data-plan="starter">
            <div class="badge">POPULAIRE</div>
            <h3>Starter</h3>
            <div class="price">15€<span>/mois</span></div>
            <ul>
                <li>✅ Jusqu'à 5 gîtes</li>
                <li>✅ Tout du plan Gratuit</li>
                <li>✅ Sync iCal bidirectionnel</li>
                <li>✅ Multi-utilisateurs (3 max)</li>
                <li>✅ Support prioritaire</li>
                <li>❌ Channel Manager avancé</li>
            </ul>
            <button onclick="selectPlan('starter')">Essai 14 jours</button>
        </div>
        
        <div class="price-card" data-plan="pro">
            <div class="badge">PRO</div>
            <h3>Professionnel</h3>
            <div class="price">29€<span>/mois</span></div>
            <ul>
                <li>✅ Gîtes illimités</li>
                <li>✅ Tout du plan Starter</li>
                <li>✅ Channel Manager complet</li>
                <li>✅ Booking Engine intégré</li>
                <li>✅ Paiement en ligne Stripe</li>
                <li>✅ Utilisateurs illimités</li>
                <li>✅ API & Webhooks</li>
            </ul>
            <button onclick="selectPlan('pro')">Essai 14 jours</button>
        </div>
    </div>
    
    <p class="note">💳 Aucune carte bancaire requise pendant l'essai</p>
    
    <button onclick="prevStep(2)">← Retour</button>
</div>

<!-- ÉTAPE 4: Création en cours -->
<div id="step-4" class="onboarding-step">
    <div class="loading-animation">
        <div class="spinner"></div>
        <h2>✨ Création de votre espace en cours...</h2>
        <p id="progress-text">Initialisation...</p>
        
        <div class="progress-steps">
            <div class="step done">✓ Organization créée</div>
            <div class="step loading">⏳ Configuration des gîtes...</div>
            <div class="step">⏳ Import des templates...</div>
            <div class="step">⏳ Finalisation...</div>
        </div>
    </div>
</div>

<script>
async function completeOnboarding(formData) {
    updateProgress('Organization créée');
    
    // 1. Créer organization
    const { data: org, error: orgError } = await supabaseClient
        .from('organizations')
        .insert({
            name: formData.orgName,
            slug: generateSlug(formData.orgName),
            owner_user_id: (await supabaseClient.auth.getUser()).data.user.id,
            plan: formData.selectedPlan,
            max_gites: formData.selectedPlan === 'free' ? 1 : (formData.selectedPlan === 'starter' ? 5 : 999)
        })
        .select()
        .single();
    
    if (orgError) throw orgError;
    
    updateProgress('Configuration des gîtes...');
    
    // 2. Créer les gîtes
    const gitesData = formData.gites.map((g, i) => ({
        organization_id: org.id,
        name: g.name,
        slug: generateSlug(g.name),
        max_personnes: g.capacity,
        nombre_chambres: g.bedrooms,
        ville: g.city,
        adresse: g.address,
        display_order: i
    }));
    
    const { error: gitesError } = await supabaseClient
        .from('gites')
        .insert(gitesData);
    
    if (gitesError) throw gitesError;
    
    updateProgress('Import des templates...');
    
    // 3. Créer le membre owner
    const { error: memberError } = await supabaseClient
        .from('organization_members')
        .insert({
            organization_id: org.id,
            user_id: (await supabaseClient.auth.getUser()).data.user.id,
            role: 'owner',
            accepted_at: new Date().toISOString()
        });
    
    if (memberError) throw memberError;
    
    updateProgress('Finalisation...');
    
    // 4. Marquer onboarding comme complété
    await supabaseClient
        .from('organizations')
        .update({ onboarding_completed: true })
        .eq('id', org.id);
    
    // 5. Rediriger vers dashboard
    setTimeout(() => {
        window.location.href = '/index.html';
    }, 1000);
}
</script>
```

### 3.3 - Edge Function pour setup auto (6h)

**Fichier**: `supabase/functions/onboarding-setup/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { organizationId, gites, userId } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // 1. Créer templates FAQ par défaut
    await supabase.from('faq').insert([
      {
        organization_id: organizationId,
        question: 'Comment accéder au WiFi ?',
        reponse: 'Le code WiFi est affiché dans le salon',
        categorie: 'internet'
      },
      // ... autres FAQs par défaut
    ])
    
    // 2. Créer checklist ménage par défaut
    for (const gite of gites) {
      await supabase.from('checklist_templates').insert({
        organization_id: organizationId,
        gite_id: gite.id,
        nom: 'Checklist ménage standard',
        items: [
          { ordre: 1, texte: 'Faire les lits avec draps propres' },
          { ordre: 2, texte: 'Passer l\'aspirateur' },
          { ordre: 3, texte: 'Nettoyer salle de bain' },
          { ordre: 4, texte: 'Vider poubelles' },
          { ordre: 5, texte: 'Vérifier stock PQ/savon' }
        ]
      })
    }
    
    // 3. Créer stock draps initial
    for (const gite of gites) {
      await supabase.from('stocks_draps').insert({
        organization_id: organizationId,
        gite_id: gite.id,
        nb_simples_propres: 4,
        nb_doubles_propres: 4,
        nb_simples_sales: 0,
        nb_doubles_sales: 0
      })
    }
    
    // 4. Envoyer email de bienvenue
    // ... (Resend/SendGrid)
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

---

## 🔄 PHASE 4 - CHANNEL MANAGER (3 semaines - 90h)

### Objectif
Sync BIDIRECTIONNEL avec plateformes

### 4.1 - Export iCal par gîte (12h)

**Endpoint**: `/api/ical/export/[token].ics`

```javascript
// Edge Function: supabase/functions/ical-export/index.ts

export async function handler(req) {
    const token = new URL(req.url).pathname.split('/').pop().replace('.ics', '');
    
    // 1. Trouver le gîte par token
    const { data: gite } = await supabase
        .from('gites')
        .select('*, organization_id')
        .eq('ical_export_token', token)
        .single();
    
    if (!gite) {
        return new Response('Token invalide', { status: 404 });
    }
    
    // 2. Récupérer réservations futures
    const { data: reservations } = await supabase
        .from('reservations')
        .select('*')
        .eq('gite_id', gite.id)
        .gte('date_fin', new Date().toISOString().split('T')[0])
        .order('date_debut');
    
    // 3. Générer iCal
    let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Gestion Gîtes//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${gite.name}
X-WR-TIMEZONE:Europe/Paris
`;
    
    for (const resa of reservations) {
        const uid = `resa-${resa.id}@gestion-gites.com`;
        const summary = resa.client_nom || 'Réservé';
        
        ical += `
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatICalDate(new Date())}
DTSTART;VALUE=DATE:${formatICalDateOnly(resa.date_debut)}
DTEND;VALUE=DATE:${formatICalDateOnly(resa.date_fin)}
SUMMARY:${summary}
DESCRIPTION:Réservation ${gite.name}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
`;
    }
    
    ical += 'END:VCALENDAR';
    
    return new Response(ical, {
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="${gite.slug}.ics"`
        }
    });
}
```

### 4.2 - UI Configuration URLs (8h)

**Page**: `settings/channels.html`

```html
<div class="channels-config">
    <h2>📡 Channel Manager</h2>
    
    <!-- Pour chaque gîte -->
    <div class="gite-channels" data-gite-id="xxx">
        <h3>🏠 Trévoux</h3>
        
        <!-- EXPORT (donner aux plateformes) -->
        <div class="export-section">
            <h4>📤 Export iCal (à copier sur vos plateformes)</h4>
            <p>Copiez cette URL et ajoutez-la dans les paramètres de calendrier de chaque plateforme:</p>
            
            <div class="url-box">
                <input type="text" readonly value="https://votreapp.com/ical/export/abc123def456.ics" id="export-url-trevoux">
                <button onclick="copyUrl('export-url-trevoux')">📋 Copier</button>
            </div>
            
            <div class="platform-links">
                <a href="#" class="platform-guide">
                    <img src="/images/airbnb-logo.png">
                    Guide Airbnb →
                </a>
                <a href="#" class="platform-guide">
                    <img src="/images/booking-logo.png">
                    Guide Booking.com →
                </a>
                <a href="#" class="platform-guide">
                    <img src="/images/abritel-logo.png">
                    Guide Abritel →
                </a>
            </div>
        </div>
        
        <!-- IMPORT (récupérer depuis plateformes) -->
        <div class="import-section">
            <h4>📥 Import iCal (depuis vos plateformes)</h4>
            
            <div class="platform-import">
                <label>
                    <img src="/images/airbnb-logo.png" width="24">
                    Airbnb
                </label>
                <input type="url" placeholder="Collez l'URL iCal Airbnb..." id="airbnb-import-trevoux">
                <button onclick="saveImportUrl('trevoux', 'airbnb')">💾 Enregistrer</button>
            </div>
            
            <div class="platform-import">
                <label>
                    <img src="/images/booking-logo.png" width="24">
                    Booking.com
                </label>
                <input type="url" placeholder="Collez l'URL iCal Booking..." id="booking-import-trevoux">
                <button onclick="saveImportUrl('trevoux', 'booking')">💾 Enregistrer</button>
            </div>
            
            <div class="platform-import">
                <label>
                    <img src="/images/abritel-logo.png" width="24">
                    Abritel
                </label>
                <input type="url" placeholder="Collez l'URL iCal Abritel..." id="abritel-import-trevoux">
                <button onclick="saveImportUrl('trevoux', 'abritel')">💾 Enregistrer</button>
            </div>
            
            <div class="platform-import">
                <label>+ Autre plateforme</label>
                <input type="text" placeholder="Nom (ex: Gites de France)">
                <input type="url" placeholder="URL iCal...">
                <button onclick="addCustomPlatform()">➕ Ajouter</button>
            </div>
        </div>
        
        <!-- SYNCHRONISATION -->
        <div class="sync-section">
            <button onclick="syncNow('trevoux')" class="btn-primary">
                🔄 Synchroniser maintenant
            </button>
            
            <div class="sync-status">
                <div class="status-item">
                    <span class="label">Dernière sync:</span>
                    <span class="value">Il y a 2 heures</span>
                </div>
                <div class="status-item">
                    <span class="label">Réservations importées:</span>
                    <span class="value">12 nouvelles</span>
                </div>
                <div class="status-item">
                    <span class="label">Statut:</span>
                    <span class="value success">✓ OK</span>
                </div>
            </div>
        </div>
    </div>
</div>
```

### 4.3 - Sync auto toutes les heures (16h)

**Edge Function Cron**: `supabase/functions/sync-all-calendars/index.ts`

```typescript
// Déclenchée toutes les heures par Supabase Cron
// https://supabase.com/docs/guides/functions/schedule-functions

export async function handler(req) {
    const supabase = createClient(...)
    
    // 1. Récupérer tous les gîtes avec URLs iCal configurées
    const { data: gites } = await supabase
        .from('gites')
        .select('*, organizations(id, name)')
        .not('ical_airbnb_url', 'is', null)
        .or('ical_booking_url.neq.null,ical_abritel_url.neq.null');
    
    const results = [];
    
    for (const gite of gites) {
        // 2. Sync chaque URL
        const urls = {
            'airbnb': gite.ical_airbnb_url,
            'booking': gite.ical_booking_url,
            'abritel': gite.ical_abritel_url
        };
        
        for (const [platform, url] of Object.entries(urls)) {
            if (!url) continue;
            
            try {
                const result = await syncCalendar(gite, platform, url);
                results.push({
                    gite: gite.name,
                    platform,
                    success: true,
                    added: result.added,
                    deleted: result.deleted
                });
            } catch (error) {
                results.push({
                    gite: gite.name,
                    platform,
                    success: false,
                    error: error.message
                });
            }
        }
        
        // 3. Mettre à jour last_sync
        await supabase
            .from('gites')
            .update({ last_ical_sync_at: new Date().toISOString() })
            .eq('id', gite.id);
    }
    
    // 4. Envoyer notification si erreurs
    const errors = results.filter(r => !r.success);
    if (errors.length > 0) {
        // Notifier admins par email
        await sendErrorNotification(errors);
    }
    
    return new Response(JSON.stringify({ results }));
}

async function syncCalendar(gite, platform, url) {
    // Logique sync identique à sync-ical.js actuel
    // Mais avec gestion organisation_id + gite_id
    // ...
}
```

### 4.4 - Détection conflits (12h)

```sql
-- Fonction pour détecter les chevauchements

CREATE OR REPLACE FUNCTION detect_booking_conflicts(p_gite_id UUID)
RETURNS TABLE (
    resa1_id UUID,
    resa2_id UUID,
    date_debut_conflit DATE,
    date_fin_conflit DATE,
    severity TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r1.id as resa1_id,
        r2.id as resa2_id,
        GREATEST(r1.date_debut, r2.date_debut) as date_debut_conflit,
        LEAST(r1.date_fin, r2.date_fin) as date_fin_conflit,
        CASE 
            WHEN r1.date_debut = r2.date_debut AND r1.date_fin = r2.date_fin THEN 'DUPLICATE'
            ELSE 'OVERLAP'
        END as severity
    FROM reservations r1
    CROSS JOIN reservations r2
    WHERE r1.gite_id = p_gite_id
    AND r2.gite_id = p_gite_id
    AND r1.id < r2.id -- Éviter doublons
    AND r1.statut NOT IN ('annulee', 'no_show')
    AND r2.statut NOT IN ('annulee', 'no_show')
    AND daterange(r1.date_debut, r1.date_fin, '[]') && daterange(r2.date_debut, r2.date_fin, '[]');
END;
$$ LANGUAGE plpgsql;
```

**UI Alertes**:
```javascript
// dashboard.js - Afficher widget conflits

async function checkConflicts() {
    const giteId = window.TenantContext.currentGiteId;
    
    const { data: conflicts } = await supabaseClient
        .rpc('detect_booking_conflicts', { p_gite_id: giteId });
    
    if (conflicts && conflicts.length > 0) {
        showConflictAlert(conflicts);
    }
}

function showConflictAlert(conflicts) {
    const html = `
        <div class="alert alert-danger">
            <h4>⚠️ ${conflicts.length} conflit(s) de réservation détecté(s)</h4>
            ${conflicts.map(c => `
                <div class="conflict-item">
                    <strong>Conflit du ${c.date_debut_conflit} au ${c.date_fin_conflit}</strong><br>
                    Réservations #${c.resa1_id} et #${c.resa2_id}
                    <button onclick="resolveConflict('${c.resa1_id}', '${c.resa2_id}')">
                        Résoudre
                    </button>
                </div>
            `).join('')}
        </div>
    `;
    
    document.getElementById('conflicts-container').innerHTML = html;
}
```

### 4.5 - APIs officielles (42h - PHASE FUTURE)

**Airbnb API** (difficile, non publique):
- Nécessite partenariat Airbnb
- Remplacer par iCal pour l'instant

**Booking.com API**:
```javascript
// Nécessite certification Booking.com
// Alternative: Channex.io (aggregateur payant)
```

**Pour le MVP: Rester sur iCal** ✅

---

## 💰 PHASE 5 - BOOKING ENGINE (2 semaines - 60h)

### Objectif
Moteur réservation direct (sans commission)

### 5.1 - Calendrier disponibilités public (16h)

**Page**: `booking/[slug].html`

```html
<!-- URL publique: https://votreapp.com/booking/gites-calvignac/trevoux -->

<!DOCTYPE html>
<html lang="fr">
<head>
    <title>Réserver Gîte Le Trévoux - Gîtes Calvignac</title>
    <meta name="description" content="Réservez directement votre séjour au Gîte Le Trévoux. Calendrier en temps réel, paiement sécurisé, confirmation immédiate.">
</head>
<body>
    <div class="booking-container">
        <!-- Header avec branding client -->
        <header style="background: var(--primary-color)">
            <img src="logo-gites-calvignac.png" alt="Gîtes Calvignac">
            <h1>Gîte Le Trévoux</h1>
            <p>Calvignac, Lot (46) • 6 personnes • 3 chambres</p>
        </header>
        
        <!-- Galerie photos -->
        <div class="photo-gallery">
            <!-- Carousel photos gîte -->
        </div>
        
        <!-- Calendrier + Formulaire réservation -->
        <div class="booking-main">
            <div class="calendar-section">
                <h2>Disponibilités</h2>
                <div id="booking-calendar"></div>
                
                <div class="legend">
                    <span class="available">Disponible</span>
                    <span class="booked">Réservé</span>
                    <span class="selected">Sélectionné</span>
                </div>
            </div>
            
            <div class="booking-form-section">
                <form id="bookingForm">
                    <h3>Votre réservation</h3>
                    
                    <div class="selected-dates" id="selectedDates">
                        <p>Sélectionnez vos dates sur le calendrier</p>
                    </div>
                    
                    <div class="form-group">
                        <label>Nombre de personnes</label>
                        <select name="nb_personnes" required>
                            <option value="1">1 personne</option>
                            <option value="2" selected>2 personnes</option>
                            <option value="3">3 personnes</option>
                            <option value="4">4 personnes</option>
                            <option value="5">5 personnes</option>
                            <option value="6">6 personnes</option>
                        </select>
                    </div>
                    
                    <div class="price-breakdown" id="priceBreakdown">
                        <!-- Rempli dynamiquement -->
                    </div>
                    
                    <div class="form-group">
                        <label>Nom</label>
                        <input type="text" name="nom" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Téléphone</label>
                        <input type="tel" name="telephone" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Message (optionnel)</label>
                        <textarea name="message" rows="3"></textarea>
                    </div>
                    
                    <button type="submit" class="btn-book">
                        Réserver maintenant
                    </button>
                    
                    <p class="terms">
                        En réservant, vous acceptez les 
                        <a href="/cgv.html" target="_blank">CGV</a>
                    </p>
                </form>
            </div>
        </div>
        
        <!-- Description gîte -->
        <div class="gite-description">
            <!-- Infos, équipements, etc. -->
        </div>
    </div>
    
    <script>
        // Charger disponibilités
        async function loadAvailability() {
            const { data: gite } = await supabaseClient
                .from('gites')
                .select('*, reservations(*)')
                .eq('slug', 'trevoux')
                .eq('is_published', true)
                .single();
            
            renderCalendar(gite, gite.reservations);
        }
        
        // Calculer prix
        function calculatePrice(dateDebut, dateFin, nbPersonnes) {
            const nuits = calculateNights(dateDebut, dateFin);
            let total = gite.prix_nuit_base * nuits;
            
            // Personne supplémentaire
            if (nbPersonnes > 2) {
                total += (nbPersonnes - 2) * gite.prix_personne_supp * nuits;
            }
            
            // Frais ménage
            total += gite.frais_menage;
            
            // Taxe séjour
            total += gite.taxe_sejour_par_nuit * nuits * nbPersonnes;
            
            return total;
        }
        
        // Soumettre réservation
        document.getElementById('bookingForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            
            // 1. Créer réservation en statut 'devis'
            const { data: reservation, error } = await supabaseClient
                .from('reservations')
                .insert({
                    organization_id: gite.organization_id,
                    gite_id: gite.id,
                    date_debut: selectedDateDebut,
                    date_fin: selectedDateFin,
                    client_nom: formData.get('nom'),
                    client_email: formData.get('email'),
                    client_telephone: formData.get('telephone'),
                    nb_adultes: formData.get('nb_personnes'),
                    prix_total_ttc: totalPrice,
                    source: 'direct',
                    statut: 'devis'
                })
                .select()
                .single();
            
            // 2. Rediriger vers paiement
            window.location.href = `/payment/${reservation.id}`;
        });
    </script>
</body>
</html>
```

### 5.2 - Paiement Stripe (20h)

**Page**: `payment/[reservation_id].html`

```javascript
// Intégration Stripe Checkout

async function initiatePayment(reservationId) {
    // 1. Créer PaymentIntent via Edge Function
    const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId })
    });
    
    const { clientSecret } = await response.json();
    
    // 2. Afficher formulaire Stripe
    const stripe = Stripe('pk_live_XXX');
    const elements = stripe.elements({ clientSecret });
    
    const paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');
    
    // 3. Gérer soumission
    document.getElementById('payment-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `https://votreapp.com/payment/success?reservation=${reservationId}`
            }
        });
        
        if (error) {
            showError(error.message);
        }
    });
}
```

**Edge Function**: `supabase/functions/create-payment-intent/index.ts`

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

export async function handler(req) {
    const { reservationId } = await req.json();
    
    // 1. Récupérer réservation
    const { data: reservation } = await supabase
        .from('reservations')
        .select('*, gites(*), organizations(*)')
        .eq('id', reservationId)
        .single();
    
    // 2. Créer PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(reservation.prix_total_ttc * 100), // en centimes
        currency: 'eur',
        metadata: {
            reservation_id: reservationId,
            organization_id: reservation.organization_id,
            gite_id: reservation.gite_id
        },
        description: `Réservation ${reservation.gites.name} du ${reservation.date_debut} au ${reservation.date_fin}`,
        receipt_email: reservation.client_email
    });
    
    // 3. Enregistrer PaymentIntent ID
    await supabase
        .from('reservations')
        .update({ stripe_payment_intent_id: paymentIntent.id })
        .eq('id', reservationId);
    
    return new Response(JSON.stringify({
        clientSecret: paymentIntent.client_secret
    }));
}
```

### 5.3 - Webhooks Stripe (12h)

**Edge Function**: `supabase/functions/stripe-webhook/index.ts`

```typescript
export async function handler(req) {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            Deno.env.get('STRIPE_WEBHOOK_SECRET')!
        );
    } catch (err) {
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
    
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            
            // Marquer réservation comme payée
            await supabase
                .from('reservations')
                .update({
                    statut: 'confirmee',
                    statut_paiement: 'paye',
                    date_confirmation: new Date().toISOString(),
                    date_paiement_solde: new Date().toISOString()
                })
                .eq('stripe_payment_intent_id', paymentIntent.id);
            
            // Envoyer email de confirmation
            // ...
            break;
        
        case 'payment_intent.payment_failed':
            // Notifier échec paiement
            break;
    }
    
    return new Response(JSON.stringify({ received: true }));
}
```

### 5.4 - Widget embeddable (12h)

**Script**: `booking-widget.js`

```html
<!-- À intégrer sur site externe -->
<script src="https://votreapp.com/widget/booking-widget.js"></script>
<div id="gites-booking-widget" 
     data-organization="gites-calvignac" 
     data-gite="trevoux"
     data-primary-color="#667eea">
</div>

<script>
    GitesBookingWidget.init({
        containerId: 'gites-booking-widget',
        organization: 'gites-calvignac',
        gite: 'trevoux',
        primaryColor: '#667eea',
        language: 'fr'
    });
</script>
```

---

## 🎁 PHASE 6 - FEATURES PREMIUM (4 semaines - 120h)

### 6.1 - Tarification dynamique (24h)

**Table**: `pricing_rules`

```sql
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    
    -- Type de règle
    type TEXT NOT NULL CHECK (type IN ('seasonal', 'weekend', 'duration', 'last_minute', 'early_bird')),
    
    -- Période (seasonal)
    date_debut DATE,
    date_fin DATE,
    
    -- Jours (weekend)
    jours_semaine INTEGER[], -- [0=dimanche, 1=lundi, ..., 6=samedi]
    
    -- Durée (duration)
    nuits_min INTEGER,
    nuits_max INTEGER,
    
    -- Délai (last_minute/early_bird)
    jours_avant_arrivee_min INTEGER,
    jours_avant_arrivee_max INTEGER,
    
    -- Modification prix
    prix_type TEXT CHECK (prix_type IN ('fixed', 'percentage')),
    prix_valeur DECIMAL(10,2),
    
    -- Priorité
    priorite INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Fonction calcul**:
```sql
CREATE OR REPLACE FUNCTION calculate_dynamic_price(
    p_gite_id UUID,
    p_date_debut DATE,
    p_date_fin DATE,
    p_nb_personnes INTEGER
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_gite RECORD;
    v_prix_base DECIMAL(10,2);
    v_prix_final DECIMAL(10,2);
    v_nuits INTEGER;
BEGIN
    -- Récupérer info gîte
    SELECT * INTO v_gite FROM gites WHERE id = p_gite_id;
    
    v_nuits := p_date_fin - p_date_debut;
    v_prix_base := v_gite.prix_nuit_base;
    v_prix_final := v_prix_base * v_nuits;
    
    -- Appliquer règles de tarification
    -- 1. Seasonal rules
    -- 2. Weekend supplements
    -- 3. Duration discounts
    -- 4. Last minute
    -- ...
    
    -- Personnes supplémentaires
    IF p_nb_personnes > 2 THEN
        v_prix_final := v_prix_final + ((p_nb_personnes - 2) * v_gite.prix_personne_supp * v_nuits);
    END IF;
    
    RETURN v_prix_final;
END;
$$ LANGUAGE plpgsql;
```

### 6.2 - Emails automatiques (20h)

**Templates**: `email_templates`

```sql
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Type
    type TEXT NOT NULL CHECK (type IN (
        'confirmation',
        'rappel_3j',
        'check_in',
        'check_out',
        'demande_avis',
        'paiement_echoue',
        'annulation'
    )),
    
    -- Contenu
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    
    -- Variables disponibles
    -- {{client_nom}}, {{gite_nom}}, {{date_debut}}, etc.
    
    -- État
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Automation**:
```typescript
// Edge Function Cron: check-email-triggers

export async function handler() {
    // 1. Rappels J-3
    const demain = addDays(new Date(), 1);
    const { data: resasJ3 } = await supabase
        .from('reservations')
        .select('*')
        .eq('date_debut', demain)
        .eq('rappel_envoye', false);
    
    for (const resa of resasJ3) {
        await sendEmail(resa, 'rappel_3j');
    }
    
    // 2. Demande d'avis J+2
    const avanthier = addDays(new Date(), -2);
    const { data: resasAvis } = await supabase
        .from('reservations')
        .select('*')
        .eq('date_fin', avanthier)
        .is('note_globale', null);
    
    for (const resa of resasAvis) {
        await sendEmail(resa, 'demande_avis');
    }
}
```

### 6.3 - Rapports avancés (24h)

**Page**: `reports/index.html`

```html
<div class="reports-dashboard">
    <h1>📊 Rapports et Analyses</h1>
    
    <!-- Filtres globaux -->
    <div class="filters">
        <select id="report-gite">
            <option value="all">Tous les gîtes</option>
            <option value="xxx">Trévoux</option>
            <option value="yyy">Couzon</option>
        </select>
        
        <input type="date" id="report-start">
        <input type="date" id="report-end">
        
        <button onclick="generateReport()">Générer</button>
    </div>
    
    <!-- KPIs -->
    <div class="kpis-grid">
        <div class="kpi-card">
            <div class="kpi-value">€12,450</div>
            <div class="kpi-label">Revenus période</div>
            <div class="kpi-trend up">+15%</div>
        </div>
        
        <div class="kpi-card">
            <div class="kpi-value">72%</div>
            <div class="kpi-label">Taux d'occupation</div>
            <div class="kpi-trend up">+8%</div>
        </div>
        
        <div class="kpi-card">
            <div class="kpi-value">€142</div>
            <div class="kpi-label">Prix moyen nuit</div>
            <div class="kpi-trend down">-3%</div>
        </div>
        
        <div class="kpi-card">
            <div class="kpi-value">€87</div>
            <div class="kpi-label">RevPAR</div>
            <div class="kpi-trend up">+12%</div>
        </div>
    </div>
    
    <!-- Graphiques -->
    <div class="charts-grid">
        <div class="chart-card">
            <h3>Revenus mensuels</h3>
            <canvas id="revenue-chart"></canvas>
        </div>
        
        <div class="chart-card">
            <h3>Taux d'occupation</h3>
            <canvas id="occupancy-chart"></canvas>
        </div>
        
        <div class="chart-card">
            <h3>Réservations par source</h3>
            <canvas id="sources-chart"></canvas>
        </div>
        
        <div class="chart-card">
            <h3>Durée moyenne séjour</h3>
            <canvas id="duration-chart"></canvas>
        </div>
    </div>
    
    <!-- Export -->
    <div class="export-section">
        <button onclick="exportPDF()">📄 Export PDF</button>
        <button onclick="exportExcel()">📊 Export Excel</button>
        <button onclick="exportCSV()">📋 Export CSV</button>
    </div>
</div>
```

### 6.4 - Multi-langues (16h)

**Système i18n**:
```javascript
// js/i18n.js

const translations = {
    fr: {
        'reservation.title': 'Réservations',
        'reservation.add': 'Ajouter une réservation',
        'calendar.months': ['Janvier', 'Février', 'Mars', ...],
        // ...
    },
    en: {
        'reservation.title': 'Bookings',
        'reservation.add': 'Add booking',
        'calendar.months': ['January', 'February', 'March', ...],
        // ...
    },
    de: {
        'reservation.title': 'Buchungen',
        'reservation.add': 'Buchung hinzufügen',
        // ...
    }
};

function t(key) {
    const lang = window.TenantContext.organization.settings.language || 'fr';
    return translations[lang][key] || key;
}

// Utilisation:
document.querySelector('h1').textContent = t('reservation.title');
```

### 6.5 - API publique (36h)

**Documentation**: `https://votreapp.com/api/docs`

```yaml
# API REST endpoints

# Authentification
POST /api/v1/auth/token
  Body: { api_key: "xxx" }
  Response: { access_token: "jwt...", expires_in: 3600 }

# Réservations
GET /api/v1/reservations
  Headers: Authorization: Bearer {token}
  Query: ?gite_id=xxx&date_debut_gte=2026-01-01
  Response: { data: [...], pagination: {...} }

POST /api/v1/reservations
  Body: { gite_id, date_debut, date_fin, client_nom, ... }
  Response: { data: {...}, id: "uuid" }

# Disponibilités
GET /api/v1/availability/{gite_id}
  Query: ?date_debut=2026-01-01&date_fin=2026-12-31
  Response: { available_dates: [...], booked_dates: [...] }

# Webhooks
POST /api/v1/webhooks
  Body: { url: "https://...", events: ["reservation.created", ...] }
```

---

## 🎨 PHASE 7 - POLISH & LAUNCH (1 semaine - 30h)

### 7.1 - Tests utilisateurs (8h)
- 5 propriétaires de gîtes beta testers
- Protocole de test complet
- Feedback structuré

### 7.2 - Documentation utilisateur (8h)
- Guide de démarrage
- Tutoriels vidéo
- FAQ
- Base de connaissance

### 7.3 - Landing page (8h)
```html
<!-- https://votreapp.com -->
<div class="landing">
    <header>
        <nav>
            <logo>Gestion Gîtes</logo>
            <menu>
                <a href="#features">Fonctionnalités</a>
                <a href="#pricing">Tarifs</a>
                <a href="#demo">Démo</a>
                <a href="/login">Connexion</a>
            </menu>
        </nav>
    </header>
    
    <section class="hero">
        <h1>Le logiciel qui simplifie la gestion de vos gîtes</h1>
        <p>Réservations, ménage, finances : tout en un seul endroit</p>
        <button onclick="location.href='/signup'">
            Essai gratuit 14 jours →
        </button>
    </section>
    
    <!-- Features, témoignages, pricing, etc. -->
</div>
```

### 7.4 - SEO & Performance (6h)
- Meta tags optimisés
- Sitemap.xml
- Robots.txt
- Lighthouse 90+
- Analytics

---

## 📊 RÉCAPITULATIF FINAL

| Phase | Fonctionnalités | Effort | Impact Business | Priority |
|-------|----------------|--------|-----------------|----------|
| **0** | Préparation | 12h | N/A | Setup |
| **1** | Multi-Tenant Base | 60h | 🔥 CRITIQUE | P0 |
| **2** | Migration Données | 18h | 🔥 CRITIQUE | P0 |
| **3** | Onboarding | 30h | 🔥 CRITIQUE | P0 |
| **4** | Channel Manager | 90h | 💰 Très High | P1 |
| **5** | Booking Engine | 60h | 💰 Très High | P1 |
| **6** | Features Premium | 120h | 💡 Medium | P2 |
| **7** | Polish & Launch | 30h | ✅ Finition | P3 |

**TOTAL**: 420 heures (~3,5 mois à temps plein)

---

## 🎯 STRATÉGIE DE DÉPLOIEMENT

### MVP 1.0 (6 semaines)
- Phase 0-3: Multi-tenant + Onboarding
- **Go-live**: Accepter premiers clients

### Version 2.0 (+ 3 semaines)
- Phase 4: Channel Manager
- **Différenciateur**: Sync bidirectionnel

### Version 3.0 (+ 2 semaines)
- Phase 5: Booking Engine
- **Monétisation**: Commissions réduites

### Version 4.0 (+ 4 semaines)
- Phase 6-7: Premium + Polish
- **Scaling**: Prêt pour 1000+ clients

---

## 💰 INVESTISSEMENT vs RETOUR

**Investissement total**: 420h × 50€/h = **21 000€** (votre temps)

**Retour attendu**:
- 50 clients × 15€/mois = **750€/mois** (an 1)
- 250 clients × 15€/mois = **3 750€/mois** (an 2)
- 1000 clients × 15€/mois = **15 000€/mois** (an 3)

**ROI**: 7 mois pour rentabiliser

---

## 📝 CONCLUSION

Vous avez maintenant **LA ROADMAP COMPLÈTE** pour transformer votre projet en SaaS commercial.

**Documents créés**:
1. ✅ PART1 - Analyse concurrentielle
2. ✅ PART2 - Architecture technique
3. ✅ PART3 - Plan implémentation Phase 0-1
4. ✅ PART4 - Features Premium & Roadmap complète

**Prêt à démarrer ?** 🚀
