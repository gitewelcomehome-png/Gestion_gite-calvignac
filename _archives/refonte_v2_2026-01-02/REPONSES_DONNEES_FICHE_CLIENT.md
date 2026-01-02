# 📊 RÉPONSES - DONNÉES FICHE CLIENT

## ❓ VOS 3 QUESTIONS

### 1️⃣ **Est-ce que les données viennent de la base de données ?**

**✅ OUI et ⚠️ NON (mixte)**

#### ✅ Depuis Supabase (BDD) :

```javascript
// Activités gîte
async function getActivitesGite(gite) {
    const { data } = await window.supabase
        .from('activites_gites')
        .select('*')
        .eq('gite', gite.toLowerCase())
        .order('distance', { ascending: true });
    return data || [];
}

// Planning ménage  
async function getProchainMenage(gite, dateApres) {
    const { data } = await window.supabase
        .from('cleaning_schedule')
        .select('*')
        .eq('gite', gite)
        .gte('scheduled_date', dateApres)
        .order('scheduled_date', { ascending: true })
        .limit(1)
        .single();
    return data;
}

// FAQ
const faqGite = await getFAQPourGite(reservation.gite.toLowerCase());
// Charge depuis table 'faq'
```

#### ⚠️ Depuis localStorage (pas BDD) :

```javascript
function loadInfosGites(gite) {
    const allInfos = JSON.parse(localStorage.getItem('infosGites') || '{}');
    return allInfos[gite] || {};
}
```

**PROBLÈME** : Les infos pratiques (WiFi, code boîte, GPS, etc.) sont dans `localStorage`, pas dans la table `infos_gites` !

### 🔧 SOLUTION : Charger depuis la BDD

Je dois modifier `loadInfosGites()` pour charger depuis Supabase :

```javascript
async function loadInfosGites(gite) {
    try {
        const { data, error } = await window.supabase
            .from('infos_gites')
            .select('*')
            .eq('gite', gite)
            .single();
        
        if (error) throw error;
        return data || {};
    } catch (error) {
        console.error('Erreur chargement infos gîte:', error);
        // Fallback localStorage
        const allInfos = JSON.parse(localStorage.getItem('infosGites') || '{}');
        return allInfos[gite] || {};
    }
}
```

---

### 2️⃣ **Les horaires d'arrivée dépendent-ils du ménage ?**

**✅ OUI, C'EST DÉJÀ CODÉ !**

#### Code actuel (ligne 1485-1520) :

```javascript
function genererOngletHoraires(reservation, prochainMenage) {
    // ✅ Détecte si ménage après-midi
    const bloqueAvant17h = prochainMenage && prochainMenage.time_of_day === 'afternoon';
    
    return `
        ${bloqueAvant17h ? `
        <div class="alert alert-warning">
            ⚠️ <strong>Arrivée possible à partir de 17h minimum</strong> 
            (ménage programmé l'après-midi).<br>
            Arrival possible from 5:00 PM minimum 
            (cleaning scheduled in the afternoon).
        </div>` : ''}
        
        <input type="range" 
               id="heure_arrivee" 
               min="${bloqueAvant17h ? 17 : 16}"  ← DYNAMIQUE !
               max="22" 
               step="0.5" 
               value="18">
        
        <span>${bloqueAvant17h ? '17:00' : '16:00'}</span>  ← AFFICHAGE
    `;
}
```

#### Comment ça fonctionne :

1. **getProchainMenage()** charge le ménage depuis `cleaning_schedule`
2. **Vérifie** si `time_of_day === 'afternoon'`
3. **Adapte** le slider :
   - Ménage **matin** → 16h-22h
   - Ménage **après-midi** → 17h-22h

#### Exemple cleaning_schedule :

```sql
INSERT INTO cleaning_schedule (gite, scheduled_date, time_of_day) VALUES
('Trévoux', '2026-01-10', 'afternoon'),  -- Arrivée 17h min
('Trévoux', '2026-01-17', 'morning');    -- Arrivée 16h min
```

---

### 3️⃣ **Où voir les retours clients (feedbacks) ?**

**❌ PAS D'INTERFACE ADMIN ACTUELLEMENT**

#### Ce qui existe :

✅ **Formulaire client** : Les clients remplissent dans l'onglet Feedback  
✅ **Table BDD** : `client_feedback` stocke tout  
❌ **Interface admin** : N'existe pas encore !

#### Structure table `client_feedback` :

```sql
CREATE TABLE client_feedback (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT REFERENCES reservations(id),
    
    -- Notes 1-5
    note_globale INT,
    note_proprete INT,
    note_confort INT,
    note_equipements INT,
    note_localisation INT,
    note_communication INT,
    
    -- Textes
    points_positifs TEXT,
    problemes_rencontres TEXT,
    suggestions TEXT,
    categories_problemes TEXT[],  -- ['proprete', 'wifi', ...]
    recommandation VARCHAR(20),    -- 'oui', 'non', 'peut-etre'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Comment voir les feedbacks MAINTENANT :

**Option 1 : Supabase Dashboard**
```
1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Table Editor → client_feedback
4. Voir tous les retours
```

**Option 2 : SQL Query**
```sql
SELECT 
    r.nom,
    r.gite,
    r.dateDebut,
    cf.note_globale,
    cf.points_positifs,
    cf.problemes_rencontres,
    cf.recommandation,
    cf.created_at
FROM client_feedback cf
JOIN reservations r ON r.id = cf.reservation_id
ORDER BY cf.created_at DESC;
```

---

## 🚀 ACTIONS À FAIRE

### 🔴 URGENT : Charger infos_gites depuis BDD

**Fichier** : `js/fiche-client-interactive.js` (ligne 2127)

**Avant** :
```javascript
function loadInfosGites(gite) {
    const allInfos = JSON.parse(localStorage.getItem('infosGites') || '{}');
    return allInfos[gite] || {};
}
```

**Après** :
```javascript
async function loadInfosGites(gite) {
    try {
        const { data, error } = await window.supabaseClient
            .from('infos_gites')
            .select('*')
            .eq('gite', gite)
            .single();
        
        if (error) throw error;
        return data || {};
    } catch (error) {
        console.error('Erreur chargement infos gîte:', error);
        return {};
    }
}
```

**Puis** : Mettre à jour l'appel dans `genererFicheClientComplete()` :
```javascript
const infosGite = await loadInfosGites(reservation.gite);  // ← await ajouté
```

---

### 🟡 MOYEN : Créer interface admin feedbacks

**Nouvel onglet** : `tab-feedbacks.html`

**Fonctionnalités** :
- Liste tous les feedbacks avec filtres (gîte, date, note)
- Affichage notes avec étoiles/emojis
- Textes positifs/problèmes/suggestions
- Export CSV
- Statistiques (note moyenne par critère)

**Code exemple** :

```html
<!-- Tab Feedbacks -->
<div id="tab-feedbacks" class="tab-pane">
    <h2>💬 Retours Clients</h2>
    
    <!-- Filtres -->
    <div class="filters">
        <select id="filter-gite">
            <option value="">Tous les gîtes</option>
            <option value="Trévoux">Trévoux</option>
            <option value="Calvignac">Calvignac</option>
        </select>
        
        <select id="filter-note">
            <option value="">Toutes les notes</option>
            <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
            <option value="4">⭐⭐⭐⭐ (4/5)</option>
            <option value="3">⭐⭐⭐ (3/5)</option>
            <option value="2">⭐⭐ (2/5)</option>
            <option value="1">⭐ (1/5)</option>
        </select>
        
        <button onclick="chargerFeedbacks()">🔍 Filtrer</button>
        <button onclick="exporterFeedbacksCSV()">📥 Export CSV</button>
    </div>
    
    <!-- Liste -->
    <div id="feedbacks-list"></div>
    
    <!-- Stats -->
    <div class="stats">
        <div class="stat-card">
            <h3>Note Moyenne</h3>
            <div class="emoji">😊</div>
            <div class="value" id="avg-global">4.2/5</div>
        </div>
        <div class="stat-card">
            <h3>Recommandations</h3>
            <div class="value" id="pct-reco">85%</div>
        </div>
    </div>
</div>
```

**JavaScript** : `js/feedbacks.js`

```javascript
async function chargerFeedbacks() {
    const gite = document.getElementById('filter-gite').value;
    const note = document.getElementById('filter-note').value;
    
    let query = window.supabaseClient
        .from('client_feedback')
        .select('*, reservations(nom, gite, dateDebut, dateFin)')
        .order('created_at', { ascending: false });
    
    if (gite) query = query.eq('reservations.gite', gite);
    if (note) query = query.eq('note_globale', note);
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Erreur:', error);
        return;
    }
    
    afficherFeedbacks(data);
}

function afficherFeedbacks(feedbacks) {
    const container = document.getElementById('feedbacks-list');
    
    const html = feedbacks.map(f => `
        <div class="feedback-card">
            <div class="feedback-header">
                <strong>${f.reservations.nom}</strong> - ${f.reservations.gite}
                <span class="date">${formatDate(f.created_at)}</span>
            </div>
            <div class="feedback-note">
                ${genererEmojis(f.note_globale)} ${f.note_globale}/5
            </div>
            ${f.points_positifs ? `
                <div class="feedback-section">
                    <strong>✅ Points positifs :</strong>
                    <p>${f.points_positifs}</p>
                </div>
            ` : ''}
            ${f.problemes_rencontres ? `
                <div class="feedback-section alert">
                    <strong>⚠️ Problèmes :</strong>
                    <p>${f.problemes_rencontres}</p>
                    ${f.categories_problemes ? `
                        <div class="tags">
                            ${f.categories_problemes.map(c => `<span class="tag">${c}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            ${f.suggestions ? `
                <div class="feedback-section">
                    <strong>💡 Suggestions :</strong>
                    <p>${f.suggestions}</p>
                </div>
            ` : ''}
            <div class="feedback-footer">
                Recommandation : ${f.recommandation === 'oui' ? '✅ Oui' : f.recommandation === 'peut-etre' ? '🤔 Peut-être' : '❌ Non'}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}
```

---

## 📋 CHECKLIST FINALE

### ✅ Déjà fait :
- [x] Formulaire feedback client complet
- [x] Table client_feedback créée
- [x] Horaires arrivée ajustés selon ménage
- [x] getProchainMenage() charge depuis BDD
- [x] getActivitesGite() charge depuis BDD

### ⚠️ À corriger :
- [ ] **loadInfosGites()** → charger depuis `infos_gites` (pas localStorage)
- [ ] **Ajouter await** dans genererFicheClientComplete()
- [ ] Vérifier que table `infos_gites` contient les données

### 🆕 À créer :
- [ ] Interface admin feedbacks (`tab-feedbacks.html`)
- [ ] JavaScript `feedbacks.js` (chargement, filtres, stats)
- [ ] Widget dashboard "Derniers avis clients"
- [ ] Export CSV des feedbacks
- [ ] Notifications email sur nouveau feedback négatif

---

## 🎯 RÉSUMÉ

| Question | Réponse | Status |
|----------|---------|--------|
| Données depuis BDD ? | **Mixte** : activités/ménage OUI, infos_gites NON | ⚠️ À corriger |
| Horaires selon ménage ? | **OUI** : 16h ou 17h selon time_of_day | ✅ Fonctionnel |
| Voir retours clients ? | **Dans Supabase** : pas d'interface admin encore | 🆕 À créer |

**Priorité 1** : Corriger loadInfosGites()  
**Priorité 2** : Créer interface admin feedbacks
