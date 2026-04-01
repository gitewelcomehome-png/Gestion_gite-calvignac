# 🚀 GUIDE D'IMPLÉMENTATION COPILOT — LiveOwnerUnit

**Date :** 31 mars 2026
**Auteur :** Claude (CTO virtuel)
**Destinataire :** Copilot (développeur senior Codespace)
**Urgence :** 🔴 CRITIQUE — Commencer par la stratégie de backup

---

## ⚠️ PHASE 0 — SAUVEGARDER LE SITE (AVANT DE COMMENCER)

### Pourquoi ?
Nous allons modifier 20+ fichiers sur les Niveaux 1-3. Le risque de régression est réel. Cette phase met en place une stratégie de rollback en cas de problème.

### Plan de sauvegarde

#### 1. **Snapshot Git protégé** (5 min)
```bash
# Dans le Codespace, créer une branche de sauvegarde
git checkout main
git pull origin main
git branch backup/pre-improvements-2026-03-31
git push origin backup/pre-improvements-2026-03-31
```
Cette branche est **READ-ONLY** — elle capture l'état exact du site avant nos améliorations.

#### 2. **Snapshot Supabase** (2 min)
```bash
# Exporter un backup de toutes les tables
# Via la console Supabase : Settings → Backups → Create backup
# Nommer : "pre-improvements-2026-03-31"
# Cela crée une snapshot des données en cas de bug
```

**Ou via CLI :**
```bash
# Si vous avez accès à supabase CLI
supabase db pull --schema-only > backup-schema-2026-03-31.sql
```

#### 3. **Checklist de rollback rapide**
En cas de régression critique :
```
1. git reset --hard origin/backup/pre-improvements-2026-03-31
2. git push --force origin main  (attention : force push)
3. Vercel va auto-redéployer main en < 2 min
4. Vérifier liveownerunit.fr — le site revient à l'état safe
```

---

## 📋 STRUCTURE DES NIVEAUX D'AMÉLIORATION

```
Niveau 0 ✅ TERMINÉ
    ↓
Niveau 1 🔵 EN COURS (1.1 envoyé, 1.2-1.5 à faire)
    ↓
Niveau 2 ⬜ À VENIR (intelligence sans IA)
    ↓
Niveau 3 ⬜ À VENIR (IA Anthropic)
    ↓
Niveau 4 ⬜ À VENIR (long terme)
```

**Règle d'or :** ne pas passer au niveau suivant tant que le niveau actuel n'est pas 100% stable.

---

## 🔵 NIVEAU 1 — SOLIDITÉ DU CODE (Semaines 1-2)

### Objectif
Le code doit être **fiable**, **sans erreurs silencieuses**, et **gracieux** en cas de problème.

### État actuel
- ✅ 1.1 Utils partagées envoyé à Copilot (en attente commit)
- ⬜ 1.2 Loading skeletons
- ⬜ 1.3 Validation formulaires
- ⬜ 1.4 Détection hors-ligne
- ⬜ 1.5 Page 404 personnalisée

---

### 1.1 — Créer `js/utils.js` (utils partagées)
**Status :** 🔴 BLOQUANT — Copilot attend instruction

**Instruction pour Copilot :**
```
Fichier cible : js/utils.js (nouveau)

Créer une librairie de fonctions partagées :

export const showError = (msg, duration = 4000) => {
  // Toast rouge avec msg d'erreur
  // Auto-fermeture après duration
}

export const showSuccess = (msg, duration = 3000) => {
  // Toast vert avec msg succès
}

export const showLoading = (show = true) => {
  // Affiche ou cache un spinner global #global-loading
}

export const formatCurrency = (value) => {
  // Formate number en "1 234,56 €" (locale FR)
}

export const formatDate = (date) => {
  // Formate Date en "31 mar 2026"
}

export const truncate = (str, length = 50) => {
  // Tronque string avec "..."
}

Puis importer dans : app.js, pages/*.js, js/*.js
Partout où il y a des try-catch vides ou console.error() → utiliser showError()

Commit : "refactor: centralize utility functions in js/utils.js"
```

**Points d'attention :**
- Ne pas casser les appels existants (les toasts existent déjà, juste les centraliser)
- Vérifier que showLoading("global-loading") existe en HTML : `<div id="global-loading"></div>`
- Tester sur preprod avant merge sur main

---

### 1.2 — Loading skeletons (Dashboard)
**Status :** ⬜ À FAIRE

**Cible :** `/app` → tous les onglets doivent afficher un "skeleton" en attente de données Supabase.

**Instruction pour Copilot :**
```
Fichier : js/app.js

Avant d'afficher les tableaux (réservations, tâches, stats, etc), montrer des skeletons :

Pattern :
<div class="skeleton-loader">
  <div class="skeleton-line"></div>
  <div class="skeleton-line"></div>
  <div class="skeleton-line"></div>
</div>

Puis quand les données arrivent, remplacer par le vrai contenu.

Ajouter en CSS (style.css) :
.skeleton-loader { display: flex; flex-direction: column; gap: 10px; }
.skeleton-line {
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}
@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

Commit : "feat: add loading skeletons to dashboard tabs"
```

**Priorité :** haute (UX improvement)

---

### 1.3 — Validation des formulaires
**Status :** ⬜ À FAIRE

**Cibles :**
1. `/onboarding.html` — tunnel de création gîte (7 champs)
2. `options.html` — paramètres compte
3. `fiche-client.html` — champs dynamiques du guide

**Instruction pour Copilot :**
```
Fichier : js/onboarding.js (+ options.js, fiche-client.js)

Pour chaque formulaire :

1. Avant submit, valider les champs
   - Email : format email
   - Téléphone : format mobile FR (10 chiffres)
   - Prix : nombre positif
   - Champs requis : ne pas vides

2. Afficher erreur locale : <small class="error">Ce champ est requis</small>
   - Rouge (#e74c3c)
   - Sous le champ fautif

3. Pattern simple (pas de lib) :
const validateEmail = (email) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
const validatePhone = (phone) => /^\\d{10}$/.test(phone.replace(/\\s/g, ''));
const validatePrice = (price) => !isNaN(price) && price > 0;

4. Au submit :
   if (!validateForm(formData)) {
     showError("Veuillez corriger les erreurs");
     return;
   }

Commit : "feat: add form validation to onboarding, options, fiche-client"
```

**Priorité :** haute (prévient les bugs server-side)

---

### 1.4 — Détection hors-ligne (bannière)
**Status :** ⬜ À FAIRE

**Instruction pour Copilot :**
```
Fichier : js/app.js (+ window.addEventListener)

Détecter quand l'utilisateur perd la connexion :

// À l'initialisation
window.addEventListener('online', () => {
  document.getElementById('offline-banner').style.display = 'none';
  showSuccess("Vous êtes en ligne");
});

window.addEventListener('offline', () => {
  document.getElementById('offline-banner').style.display = 'flex';
  showError("Vous êtes hors-ligne. Les modifications seront synchronisées.");
});

// Vérifier au démarrage
if (!navigator.onLine) {
  document.getElementById('offline-banner').style.display = 'flex';
}

En HTML (app.html) ajouter en haut :
<div id="offline-banner" style="display: none; background: #e74c3c; color: white; padding: 10px; text-align: center;">
  ⚠️ Vous êtes hors-ligne. Les modifications seront synchronisées une fois la connexion rétablie.
</div>

Commit : "feat: add offline detection banner"
```

**Priorité :** moyenne (améliore UX sur mobile)

---

### 1.5 — Page 404 personnalisée
**Status :** ⬜ À FAIRE

**Instruction pour Copilot :**
```
Créer fichier : pages/404.html

Contenu :
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Page non trouvée — LiveOwnerUnit</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 100px auto; text-align: center; }
    h1 { font-size: 48px; color: #e74c3c; }
    p { font-size: 18px; color: #666; }
    a { color: #3498db; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <p>Oups ! Cette page n'existe pas.</p>
    <p><a href="/app">← Retour au dashboard</a></p>
  </div>
</body>
</html>

Puis configurer Vercel (vercel.json) :
{
  "rewrites": [
    { "source": "/404", "destination": "/pages/404.html" }
  ]
}

Commit : "feat: add custom 404 page"
```

**Priorité :** basse (cosmétique)

---

## ⬜ NIVEAU 2 — INTELLIGENCE SANS IA (Semaines 3-4)

### Objectif
Ajouter du calcul intelligent et des alertes automatiques, **sans appels API externes**.

---

### 2.1 — Calcul trésorerie réel
**Status :** ⬜ À FAIRE

**Cible :** `pages/dashboard-proposition.html` (onglet Trésorerie)

**Contexte :**
Actuellement, la trésorerie affiche `-` car la table `suivi_soldes_bancaires` est vide pour 2026.

**Instruction pour Copilot :**
```
Fichier : js/dashboard-proposition.js

Calculer la trésorerie en temps réel :

const calculateTreasury = async () => {
  const start = new Date(new Date().getFullYear(), 0, 1); // 1er jan 2026
  const end = new Date(); // aujourd'hui

  // Récupérer revenus (reservations confirmées + paiements)
  const { data: reservations } = await supabase
    .from('reservations')
    .select('prix_total, date_arrivee, paiement_statut')
    .gte('date_arrivee', start.toISOString())
    .lte('date_arrivee', end.toISOString())
    .eq('paiement_statut', 'payé');

  // Récupérer dépenses (factures, prestations, etc)
  const { data: expenses } = await supabase
    .from('facturation_proprietaire')
    .select('montant_total, date_facture')
    .gte('date_facture', start.toISOString())
    .lte('date_facture', end.toISOString());

  const totalRevenue = reservations.reduce((sum, r) => sum + r.prix_total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.montant_total, 0);
  const balance = totalRevenue - totalExpenses;

  return {
    totalRevenue,
    totalExpenses,
    balance,
    period: `${start.getFullYear()}-${start.getMonth() + 1} à ${end.getMonth() + 1}`
  };
};

Afficher en dashboard :
- Revenus YTD (année courante)
- Dépenses YTD
- Solde net
- Couleur verte si positif, rouge si négatif

Commit : "feat: calculate real treasury from reservations and expenses"
```

**Priorité :** haute (résout ANOM-001)

---

### 2.2 — Taux d'occupation calculé
**Status :** ⬜ À FAIRE

**Cible :** `pages/app.html` → onglet Stats

**Instruction pour Copilot :**
```
Fichier : js/stats.js

Calculer le taux d'occupation pour le mois courant :

const calculateOccupancyRate = async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();

  // Récupérer réservations confirmées du mois
  const { data: reservations } = await supabase
    .from('reservations')
    .select('date_arrivee, date_depart, statut')
    .gte('date_depart', monthStart.toISOString())
    .lte('date_arrivee', monthEnd.toISOString())
    .eq('statut', 'confirmée');

  // Compter jours occupés
  let occupiedDays = 0;
  reservations.forEach(r => {
    const arrival = new Date(r.date_arrivee);
    const departure = new Date(r.date_depart);
    const daysBooked = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));
    occupiedDays += daysBooked;
  });

  const rate = Math.round((occupiedDays / daysInMonth) * 100);
  return { rate, occupiedDays, daysInMonth };
};

Afficher : "74% occupé (23 jours sur 31)"
Couleur : rouge < 40%, orange 40-70%, vert > 70%

Commit : "feat: calculate occupancy rate for current month"
```

**Priorité :** haute (KPI important)

---

### 2.3 — Alertes automatiques
**Status :** ⬜ À FAIRE

**Instruction pour Copilot :**
```
Fichier : js/alerts.js (nouveau)

Vérifier automatiquement chaque heure :

1. Réservation confirmée sans ménage programmé
   → Alert rouge : "La réservation de [NOM] (31 mars) n'a pas de ménage. Programmer ?"

2. Facture impayée depuis > 30j
   → Alert orange : "[MONTANT]€ dus depuis 30 jours (facture [ID])"

3. Taux d'occupation < 30% pour le mois prochain
   → Alert jaune : "Taux d'occupation faible en avril (12%). Réduire le prix ?"

4. Femme de ménage absent prévu
   → Alert rouge : "Ménage prévu le 5 avril mais absente. Trouver remplaçant ?"

Pattern :
setInterval(async () => {
  const alerts = await fetchPendingAlerts();
  displayAlerts(alerts);
}, 60 * 60 * 1000); // Toutes les heures

Afficher en popup sticky en bas à gauche de l'app (non bloquant)

Commit : "feat: add automatic alert system for reservations and maintenance"
```

**Priorité :** haute (prévention de problèmes)

---

### 2.4 — Graphique revenus 12 mois
**Status :** ⬜ À FAIRE

**Instruction pour Copilot :**
```
Fichier : pages/app.html (onglet Stats), js/stats.js

Afficher un graphique en barres (Chart.js est déjà en CDN dans app.html)

Récupérer revenus des 12 derniers mois :
const data = [];
for (let i = 11; i >= 0; i--) {
  const date = new Date();
  date.setMonth(date.getMonth() - i);
  const { data: reservations } = await supabase
    .from('reservations')
    .select('prix_total')
    .gte('date_arrivee', startOfMonth(date))
    .lte('date_arrivee', endOfMonth(date))
    .eq('paiement_statut', 'payé');

  const total = reservations.reduce((sum, r) => sum + r.prix_total, 0);
  data.push(total);
}

new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Avr 25', 'Mai 25', ..., 'Mar 26'],
    datasets: [{
      label: 'Revenus',
      data: data,
      backgroundColor: '#27ae60'
    }]
  }
});

Commit : "feat: add 12-month revenue chart"
```

**Priorité :** moyenne (esthétique + insights)

---

### 2.5 — Guide voyageur dynamique
**Status :** ⬜ À FAIRE

**Cible :** `pages/fiche-client.html`

**Instruction pour Copilot :**
```
Fichier : js/fiche-client.js

Au chargement, récupérer le contexte et personnaliser :

1. Météo actuelle (API open-meteo gratuit)
   → Afficher "Aujourd'hui : 7°C, Clair"

2. Activités suggérées basées sur météo
   → Si beau : "Randonnée, pique-nique"
   → Si pluie : "Musée, restaurant, détente"

3. Conseils dynamiques basées sur période
   → Si été : "Apporter maillot de bain"
   → Si hiver : "Chauffage inclus, couvertures disponibles"

Pattern :
const context = {
  weather: await getWeather(),
  season: getSeason(),
  duration: daysBetween(arrival, departure),
  giteType: await getGiteInfo()
};

const suggestions = generateSuggestions(context);
displayDynamicContent(suggestions);

Commit : "feat: personalize fiche-client with weather and season-based suggestions"
```

**Priorité :** haute (préparation pour Niveau 3 IA)

---

## 🟠 NIVEAU 3 — INTÉGRATION IA (Semaines 5-6)

### Objectif
Ajouter 5 endpoints API Anthropic pour transformer le produit en expérience intelligente.

### Architecture

```
fiche-client.html
    ↓ fetch POST
/api/chat-guest (Vercel Edge Function)
    ↓ appel
Anthropic API (Claude 3 Haiku)
    ↓ streaming response
Browser
    ↓ affichage
Utilisateur voit chat en temps réel
```

---

### 3.1 — Créer `/api/chat-guest`
**Status :** ⬜ À FAIRE

**Fichier :** `api/chat-guest.js` (Vercel Edge Function)

**Instruction pour Copilot :**
```
Créer api/chat-guest.js :

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { message, context } = req.body; // context = gîte info, météo, etc
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const systemPrompt = `Tu es un assistant accueillant pour les voyageurs.
Tu aides avec les questions sur le gîte, la région, les activités.
Tu es chaleureux, utile et limités à 150 mots max.
Contexte : ${JSON.stringify(context)}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }]
      })
    });

    const data = await response.json();
    return res.json({
      reply: data.content[0].text,
      tokens: data.usage.input_tokens + data.usage.output_tokens
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

Config Vercel :
- Ajouter variable d'env : ANTHROPIC_API_KEY=sk-ant-...
- Redéployer via git push

Test :
curl -X POST http://localhost:3000/api/chat-guest \
  -H "Content-Type: application/json" \
  -d '{"message":"Quoi faire aujourd'\''hui ?","context":{"gite":"Maison cosy","weather":"Clair"}}'

Commit : "feat: add /api/chat-guest endpoint with streaming response"
```

**Priorité :** 🔴 CRITIQUE

---

### 3.2 — Intégrer chat dans fiche-client.html
**Status :** ⬜ À FAIRE

**Instruction pour Copilot :**
```
Fichier : pages/fiche-client.html, js/fiche-client.js

Ajouter un onglet "Chat" dans la fiche client :

HTML :
<section id="tab-chat">
  <h2>Besoin d'aide ?</h2>
  <div id="chat-messages" style="height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; margin-bottom: 10px;">
    <!-- Messages apparaissent ici -->
  </div>
  <div style="display: flex; gap: 5px;">
    <input id="chat-input" type="text" placeholder="Poser une question..." />
    <button id="chat-send">Envoyer</button>
  </div>
</section>

JS (js/fiche-client.js) :
document.getElementById('chat-send').addEventListener('click', async () => {
  const message = document.getElementById('chat-input').value;
  if (!message) return;

  // Afficher le message utilisateur
  addChatMessage(message, 'user');
  document.getElementById('chat-input').value = '';

  // Appeler l'API
  showLoading(true);
  try {
    const response = await fetch('/api/chat-guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        context: {
          gite: giteInfo.name,
          weather: currentWeather,
          region: giteInfo.region
        }
      })
    });
    const data = await response.json();
    addChatMessage(data.reply, 'assistant');
  } catch (error) {
    addChatMessage('Désolé, erreur de connexion.', 'error');
  }
  showLoading(false);
});

const addChatMessage = (text, role) => {
  const container = document.getElementById('chat-messages');
  const msgDiv = document.createElement('div');
  msgDiv.style.cssText = `margin: 10px 0; padding: 8px; background: ${role === 'user' ? '#e3f2fd' : '#f5f5f5'}; border-radius: 4px;`;
  msgDiv.textContent = text;
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
};

Test :
- Ouvrir fiche-client.html avec token valide
- Cliquer sur "Chat"
- Taper "Quoi faire aujourd'hui ?"
- Vérifier que la réponse IA apparaît

Commit : "feat: add chat interface to fiche-client with /api/chat-guest"
```

**Priorité :** 🔴 CRITIQUE

---

### 3.3 — Créer `/api/suggest-message`
**Status :** ⬜ À FAIRE

**Fichier :** `api/suggest-message.js`

**Instruction pour Copilot :**
```
Créer api/suggest-message.js

Objectif : suggérer un message d'accueil personnalisé au propriétaire

export default async (req, res) => {
  const { gite, reservation } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const systemPrompt = `Tu es un expert en accueil client pour gîtes.
Génère un message d'accueil chaleureux et personnalisé en 50-100 mots.
Utilise des infos : nom du gîte, dates, activités régionales.`;

  const userPrompt = `Gîte: ${gite.name}, région ${gite.region}.
Arrivée de ${reservation.guest_name} le ${reservation.date_arrivee}.
Personnalité: ${reservation.guest_profile || 'famille'}
Génère un message d'accueil.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const data = await response.json();
    return res.json({ suggestion: data.content[0].text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

Test:
curl -X POST http://localhost:3000/api/suggest-message \
  -H "Content-Type: application/json" \
  -d '{"gite":{"name":"Maison Cosy","region":"Dordogne"},"reservation":{"guest_name":"Marie","date_arrivee":"2026-04-05"}}'

Commit : "feat: add /api/suggest-message endpoint for personalized welcome"
```

**Priorité :** moyenne (Phase 2 du roadmap)

---

### 3.4 — Créer `/api/analyze-reviews`
**Status :** ⬜ À FAIRE

**Fichier :** `api/analyze-reviews.js`

**Instruction pour Copilot :**
```
Créer api/analyze-reviews.js

Objectif : analyser les commentaires clients et extraire insights

export default async (req, res) => {
  const { reviews } = req.body; // array of { text, rating, date }
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const systemPrompt = `Tu es un analyste expérience client.
Analyse les avis clients et fournis :
1. Points forts (3 max)
2. Axes d'amélioration (3 max)
3. Sentiment global (positif/neutre/négatif)
4. Recommandation d'action`;

  const userPrompt = `Avis clients : ${reviews.map(r => `"${r.text}" (${r.rating}/5)`).join('\n')}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const data = await response.json();
    return res.json({ analysis: data.content[0].text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

Commit : "feat: add /api/analyze-reviews endpoint for sentiment analysis"
```

**Priorité :** basse (Phase 3)

---

### 3.5 — Créer `/api/predict-revenue`
**Status :** ⬜ À FAIRE

**Fichier :** `api/predict-revenue.js`

**Instruction pour Copilot :**
```
Créer api/predict-revenue.js

Objectif : prédire les revenus des 3 prochains mois basé sur données historiques

export default async (req, res) => {
  const { historical_data, occupancy_rate } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const systemPrompt = `Tu es un expert en prévisions de revenus pour gîtes.
Basé sur données historiques et taux d'occupation actuel, prédis les revenus.
Fournis 3 scénarios : pessimiste, réaliste, optimiste.`;

  const userPrompt = `Données: revenus derniers 6 mois = ${JSON.stringify(historical_data)}.
Taux occupation actuel: ${occupancy_rate}%.
Prédis revenus avril-juin 2026.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const data = await response.json();
    return res.json({ prediction: data.content[0].text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

Commit : "feat: add /api/predict-revenue endpoint for forecasting"
```

**Priorité :** basse (Phase 3)

---

## 🟣 NIVEAU 4 — VISION LONG TERME (Après Niveau 3)

### Objectif
Automatiser complètement la gestion du gîte avec IA intelligente.

### 4.1 — Channel Manager IA
Synchroniser automatiquement les prix et disponibilités avec Airbnb, Booking, etc.

### 4.2 — Détection anomalies
Identifier les patterns suspects (fraude, paiements louches, etc.)

### 4.3 — Rapport fiscal auto
Générer automatiquement les documents pour le fisc (CA, TVA, déductions).

### 4.4 — Pricing dynamique
Ajuster les prix selon demande, météo, événements locaux.

---

## 📊 CHRONOGRAMME D'EXÉCUTION

```
Semaine 1 (1-7 avril)
├─ Phase 0 : Backup Git + Supabase ✓
├─ 1.1 : Utils partagées (en attente commit)
├─ 1.2 : Loading skeletons
└─ 1.3 : Validation formulaires

Semaine 2 (8-14 avril)
├─ 1.4 : Détection hors-ligne
├─ 1.5 : Page 404
├─ 2.1 : Calcul trésorerie
└─ 2.2 : Taux d'occupation

Semaine 3 (15-21 avril)
├─ 2.3 : Alertes automatiques
├─ 2.4 : Graphique revenus
├─ 2.5 : Guide dynamique
└─ TESTING complet Niveau 2

Semaine 4 (22-28 avril)
├─ 3.1 : /api/chat-guest
├─ 3.2 : Chat UI fiche-client
├─ Test streaming responses
└─ DÉPLOIEMENT Vercel

Semaine 5 (29 avr - 5 mai)
├─ 3.3 : /api/suggest-message
├─ 3.4 : /api/analyze-reviews
└─ Intégration dans dashboard

Semaine 6 (6-12 mai)
├─ 3.5 : /api/predict-revenue
├─ Setup monitoring (coûts API, latence)
└─ BILAN & optimisations
```

---

## ✅ CHECKLIST AVANT DE COMMENCER

- [ ] Branche `backup/pre-improvements-2026-03-31` créée et pushée
- [ ] Snapshot Supabase sauvegardé
- [ ] Lire ce document 100% (vous lisez probablement)
- [ ] Ouvrir le Codespace : https://solid-orbit-jjv9x4pjw5v425w5p.github.dev
- [ ] Vérifier `git log --oneline -5` pour voir commits récents
- [ ] Vérifier que preprod est accessible
- [ ] Commencer par instruction 1.1 (ou prochaine qui n'a pas de ✅)

---

## 🚨 RÈGLES DE QUALITÉ NON NÉGOCIABLES

1. **Un commit = une amélioration**
   Jamais 2-3 changements non liés dans un seul commit.

2. **Test sur preprod d'abord**
   Vérifier que ça marche avant de merger sur main.

3. **Pas de secrets dans le code**
   Clés API = variables d'env Vercel uniquement.

4. **États vides et erreurs gérés**
   Chaque feature doit avoir un UI pour "chargement", "erreur", "vide".

5. **Performance first**
   Les requêtes Supabase doivent être indexées.
   Les appels IA doivent être cachés quand possible.

6. **Documentation synchronisée**
   Après chaque commit, mettre à jour :
   - Ce document (marquer ✅ ou 🔵)
   - `docs/architecture.md` si changement majeur
   - `docs/SCHEMA.md` si nouvelles tables

---

## 📞 ESCALADE

**Si blocage :**
1. Poste le message d'erreur exact dans Copilot chat
2. Claude va analyser les logs
3. Si bug Supabase : aller sur console.supabase.io
4. Si bug Vercel : aller sur vercel.com/dashboard

**Si regression détectée :**
```bash
# Rollback immediate
git reset --hard origin/backup/pre-improvements-2026-03-31
git push --force origin main
# Vercel redéploie en < 2 min
# Analyser le bug sur preprod avant re-try
```

---

**Bonne chance ! 🚀**

*Document maintenu par Claude CTO | Dernière mise à jour : 31 mar 2026*