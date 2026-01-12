# 📅 PROMPT - Création de l'Onglet Calendrier & Tarifs

## ⚠️ Prompt adapté à votre infrastructure existante (Gestion Gîtes Calvignac)

---

## 🎯 OBJECTIF

Je souhaite que tu crées un nouvel onglet pour mon application web de gestion de gîtes. Cet onglet sera dédié à la **gestion complète d'un calendrier de location avec tarification dynamique** et doit s'intégrer parfaitement avec ma base de données Supabase existante.

---

## 🎨 STYLE GRAPHIQUE IMPOSÉ : Flat Outline (Neo-Brutalism)

**Le style doit être cohérent avec le reste du site** en utilisant le fichier CSS existant `/css/flat-outline.css`.

### Caractéristiques du style Flat Outline :
- **Bordures épaisses noires** : `2-3px solid var(--stroke)` où `--stroke: #2D3436`
- **Ombres portées dures** : `box-shadow: 4px 4px 0px var(--stroke)`
- **Couleurs vives** définies dans `:root` :
  - Bleu : `var(--c-blue)` → `#74b9ff`
  - Jaune : `var(--c-yellow)` → `#ffeaa7`
  - Rouge : `var(--c-red)` → `#ff7675`
  - Vert : `var(--c-green)` → `#55efc4`
  - Fond page : `var(--bg-page)` → `#f1f2f6`
  - Fond carte : `var(--white)` → `#ffffff`
- **Boutons avec effet 3D** : classe `.btn-neo`
  - Au hover : `transform: translate(-2px, -2px)` + `box-shadow: 6px 6px 0`
  - Au clic : `transform: translate(2px, 2px)` + `box-shadow: 2px 2px 0`
- **Typographie** : `font-weight: 700` (bold), `text-transform: uppercase` pour les titres
- **Espacement généreux** : `padding: 12px 24px` pour les boutons, `margin-bottom: 40px` entre sections
- **Bordures arrondies** : `border-radius: 10-12px`
- **Onglets Neo-Brutalism** : classe `.tab-neo` avec `.tab-neo.active` pour l'onglet sélectionné

**⚠️ Important** : Utiliser systématiquement les classes CSS existantes (`.btn-neo`, `.btn-save`, `.btn-delete`, `.btn-valid`, `.tab-neo`, etc.) plutôt que de créer des styles inline.

---

## 🗄️ INTÉGRATION BASE DE DONNÉES SUPABASE EXISTANTE

### Architecture Multi-tenant actuelle

Votre application utilise une architecture **multi-tenant** avec les tables principales :

```javascript
// Structure Supabase existante
{
  organizations: {
    id: UUID,
    name: TEXT,
    owner_id: UUID, // référence auth.users
    created_at: TIMESTAMPTZ
  },
  
  gites: {
    id: UUID,
    organization_id: UUID, // référence organizations
    name: TEXT,
    adresse: TEXT,
    capacite: INTEGER,
    display_order: INTEGER, // ajouté récemment
    created_at: TIMESTAMPTZ
  },
  
  reservations: {
    id: UUID,
    organization_id: UUID,
    gite_id: UUID,
    gite: TEXT, // nom du gîte (dénormalisé)
    check_in: DATE,
    check_out: DATE,
    client_name: TEXT,
    telephone: TEXT,
    nb_personnes: INTEGER,
    plateforme: TEXT, // 'Airbnb' | 'Booking' | 'Gîtes de France' | 'Direct' | 'Abritel' | etc.
    montant: DECIMAL(10,2),
    acompte: DECIMAL(10,2),
    paiement: TEXT,
    provenance: TEXT,
    synced_from: TEXT, // si importé depuis iCal
    message_envoye: BOOLEAN,
    created_at: TIMESTAMPTZ
  }
}
```

### 🆕 Nouvelles tables à créer pour la tarification

Tu dois créer les migrations SQL suivantes (dans `/sql/migrations/`) :

#### 1. Table `tarifs_base`
```sql
CREATE TABLE tarifs_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    prix_nuit DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(gite_id, date)
);

CREATE INDEX idx_tarifs_base_gite_date ON tarifs_base(gite_id, date);
ALTER TABLE tarifs_base ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage tarifs_base for their organization"
ON tarifs_base
FOR ALL
USING (organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = auth.uid()
));
```

#### 2. Table `regles_tarifaires`
```sql
CREATE TABLE regles_tarifaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    
    -- Grille tarifaire selon durée
    grille_duree JSONB DEFAULT '{
        "type": "pourcentage",
        "nuit_1": 100,
        "nuit_2": 95,
        "nuit_3": 90,
        "nuit_4": 90,
        "nuit_5": 85,
        "nuit_6": 85,
        "nuit_7": 80,
        "nuit_supp": 80
    }',
    
    -- Promotions automatiques
    promotions JSONB DEFAULT '{
        "long_sejour": {
            "actif": false,
            "pourcentage": 10,
            "a_partir_de": 7
        },
        "last_minute": {
            "actif": false,
            "pourcentage": 15,
            "jours_avant": 7
        },
        "early_booking": {
            "actif": false,
            "pourcentage": 10,
            "jours_avant": 60
        }
    }',
    
    -- Durée minimale
    duree_min_defaut INTEGER DEFAULT 2,
    periodes_duree_min JSONB DEFAULT '[]', -- [{date_debut, date_fin, nuits_min}]
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(gite_id)
);

CREATE INDEX idx_regles_tarifaires_gite ON regles_tarifaires(gite_id);
ALTER TABLE regles_tarifaires ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage regles_tarifaires for their organization"
ON regles_tarifaires
FOR ALL
USING (organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = auth.uid()
));
```

#### 3. Table `configuration_calendrier`
```sql
CREATE TABLE configuration_calendrier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    afficher_tableau_gdf BOOLEAN DEFAULT false,
    gite_actif_id UUID REFERENCES gites(id), -- Gîte actuellement sélectionné
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id)
);

ALTER TABLE configuration_calendrier ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage configuration_calendrier for their organization"
ON configuration_calendrier
FOR ALL
USING (organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = auth.uid()
));
```

### Fonctions Supabase JavaScript à utiliser

Utiliser le client Supabase global déjà configuré : `window.supabaseClient`

Structure des appels API :
```javascript
// Exemple : récupérer les tarifs d'un gîte
async function getTarifsGite(giteId) {
    const { data, error } = await window.supabaseClient
        .from('tarifs_base')
        .select('*')
        .eq('gite_id', giteId)
        .order('date', { ascending: true });
    
    if (error) throw error;
    return data;
}

// Exemple : sauvegarder des tarifs
async function saveTarifs(tarifs) {
    const { data, error } = await window.supabaseClient
        .from('tarifs_base')
        .upsert(tarifs, { onConflict: 'gite_id,date' })
        .select();
    
    if (error) throw error;
    window.invalidateCache('tarifs'); // Si cache existe
    return data;
}

// Exemple : récupérer les réservations
async function getReservations(giteId, dateDebut, dateFin) {
    const { data, error } = await window.supabaseClient
        .from('reservations')
        .select('*')
        .eq('gite_id', giteId)
        .gte('check_in', dateDebut)
        .lte('check_out', dateFin)
        .order('check_in', { ascending: true });
    
    if (error) throw error;
    return data;
}
```

**⚠️ Important** : 
- Toujours gérer les erreurs avec `try/catch`
- Utiliser les fonctions de cache existantes si disponibles (`window.invalidateCache()`)
- Respecter le multi-tenant : toujours filtrer par `organization_id`

---

## 🔧 FONCTIONNALITÉS DE L'ONGLET

### 📍 En-tête : Sélecteur de Gîte
**Toujours visible en haut de l'onglet**

```html
<!-- Exemple de structure -->
<div class="sticky-selector" style="position: sticky; top: 80px; z-index: 100; background: var(--bg-page); padding: 20px 0; border-bottom: 3px solid var(--stroke);">
    <div class="btn-neo" style="display: inline-flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.2rem;">🏡</span>
        <select id="gite-selector" class="custom-select">
            <!-- Options remplies dynamiquement depuis la table gites -->
        </select>
    </div>
    <button class="btn-neo btn-save" onclick="exportAll()">📊 Exporter Calendrier Complet</button>
    <button class="btn-neo btn-valid" onclick="exportReservations()">📋 Exporter Réservations</button>
</div>
```

---

### Section 1️⃣ : Configuration des Tarifs de Base (Accordéon)

**Accordéon extensible** avec classe `.accordion-neo` (à créer si nécessaire)

#### Contenu :
- **Calendrier mensuel** cliquable (affichage type grille)
- **Navigation** : `< Mois précédent` | `Janvier 2026` | `Mois suivant >`
- **Légende** :
  - 🟢 **Vert** (`var(--c-green)`) : Jour avec tarif défini
  - ⚪ **Blanc** : Jour sans tarif
  - 🟡 **Jaune** (`var(--c-yellow)`) : Jour sélectionné
- **Interactions** :
  - Clic sur un jour → Ouvre un **modal** pour définir le tarif
  - Shift + Clic → Sélection multiple de jours (tarification en masse)
  - Modal avec input `Prix de la nuit (€)` et bouton `.btn-save`
- **Sauvegarde** : Appel à `saveTarifs()` après chaque modification

#### Exemple de structure HTML :
```html
<div class="accordion-section">
    <button class="accordion-header" onclick="toggleSection('tarifs-base')">
        <span style="font-size: 1.5rem;">💰</span>
        <span>Configuration des Tarifs de Base</span>
        <span class="accordion-icon">▼</span>
    </button>
    <div id="tarifs-base" class="accordion-content" style="display: none;">
        <div class="calendar-controls">
            <button class="btn-neo" onclick="previousMonth()">◀ Précédent</button>
            <h3 id="current-month" style="display: inline-block; margin: 0 20px;">Janvier 2026</h3>
            <button class="btn-neo" onclick="nextMonth()">Suivant ▶</button>
        </div>
        <div id="calendar-grid" class="calendar-grid-tarifs">
            <!-- Génération dynamique des jours -->
        </div>
        <div class="legend" style="margin-top: 20px; display: flex; gap: 20px;">
            <div><span style="display: inline-block; width: 20px; height: 20px; background: var(--c-green); border: 2px solid var(--stroke);"></span> Tarif défini</div>
            <div><span style="display: inline-block; width: 20px; height: 20px; background: white; border: 2px solid var(--stroke);"></span> Sans tarif</div>
        </div>
    </div>
</div>
```

---

### Section 2️⃣ : Règles Tarifaires Dynamiques (Accordéon)

#### A. Grille tarifaire selon la durée

```html
<div class="rules-card" style="background: var(--white); border: 2px solid var(--stroke); border-radius: 12px; padding: 20px; box-shadow: 4px 4px 0 var(--stroke); margin-bottom: 20px;">
    <h4 style="font-weight: 700; margin-bottom: 15px;">📊 Tarification selon la durée</h4>
    
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
        <label class="toggle-switch">
            <input type="checkbox" id="type-tarif-toggle" onchange="toggleTarifType()">
            <span class="toggle-slider"></span>
        </label>
        <span id="type-tarif-label">Pourcentage du tarif de base</span>
    </div>
    
    <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
        <div>
            <label>1 nuit</label>
            <input type="number" id="nuit-1" class="input-neo" value="100" />
        </div>
        <div>
            <label>2 nuits</label>
            <input type="number" id="nuit-2" class="input-neo" value="95" />
        </div>
        <!-- etc. jusqu'à nuit_7 et nuit_supp -->
    </div>
</div>
```

#### B. Promotions automatiques

```html
<div class="rules-card">
    <h4>🎁 Promotions Automatiques</h4>
    <div class="promo-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
        
        <!-- Long Séjour -->
        <div class="promo-card" style="background: var(--c-green); border: 2px solid var(--stroke); padding: 15px; border-radius: 10px;">
            <label class="toggle-switch">
                <input type="checkbox" id="promo-long-sejour">
                <span class="toggle-slider"></span>
            </label>
            <span style="font-weight: 700; margin-left: 10px;">Long Séjour</span>
            <div style="margin-top: 10px;">
                <input type="number" id="long-sejour-pct" placeholder="% réduction" />
                <input type="number" id="long-sejour-nuits" placeholder="À partir de X nuits" />
            </div>
        </div>
        
        <!-- Last Minute -->
        <div class="promo-card" style="background: var(--c-yellow); ...">
            <!-- Même structure -->
        </div>
        
        <!-- Early Booking -->
        <div class="promo-card" style="background: var(--c-blue); ...">
            <!-- Même structure -->
        </div>
    </div>
</div>
```

#### C. Durée minimale de séjour

```html
<div class="rules-card">
    <h4>⏱️ Durée Minimale de Séjour</h4>
    <div style="margin-bottom: 15px;">
        <label>Durée minimale par défaut (toute l'année)</label>
        <input type="number" id="duree-min-defaut" class="input-neo" value="2" />
    </div>
    
    <h5>Périodes spécifiques :</h5>
    <div id="periodes-list">
        <!-- Liste dynamique des périodes -->
    </div>
    <button class="btn-neo btn-save" onclick="addPeriode()">+ Ajouter une période</button>
</div>
```

**Bouton final** :
```html
<button class="btn-neo btn-save" style="font-size: 1.1rem; margin-top: 20px;" onclick="saveRegles()">
    💾 SAUVEGARDER LES RÈGLES TARIFAIRES
</button>
```

---

### Section 3️⃣ : Calendrier de Réservations (Section Principale - Toujours visible)

**Affichage inspiré de l'image 2 fournie** (calendrier mensuel avec cartes pour chaque jour)

#### Structure du calendrier :
```html
<div class="calendar-main" style="margin-top: 40px;">
    <div class="calendar-header">
        <button class="btn-neo" onclick="prevMonthReservations()">◀</button>
        <h2 id="month-title" style="text-transform: uppercase;">Janvier 2026</h2>
        <button class="btn-neo" onclick="nextMonthReservations()">▶</button>
        <button class="btn-neo btn-save" onclick="openAddReservationModal()" style="margin-left: auto;">
            ➕ AJOUTER UNE RÉSERVATION
        </button>
    </div>
    
    <div class="calendar-grid-reservations" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-top: 30px;">
        <!-- En-têtes jours de la semaine -->
        <div class="day-header">Lun</div>
        <div class="day-header">Mar</div>
        <!-- ... -->
        
        <!-- Jours du mois (génération dynamique) -->
        <!-- Exemple jour : -->
        <div class="day-card" data-date="2026-01-15" onclick="showDayDetails('2026-01-15')" 
             style="background: var(--white); border: 2px solid var(--stroke); border-radius: 10px; padding: 15px; cursor: pointer; position: relative; box-shadow: 4px 4px 0 var(--stroke);">
            
            <div class="day-number" style="font-size: 1.5rem; font-weight: 700;">15</div>
            <div class="day-price" style="color: var(--c-blue); font-weight: 600;">250 €</div>
            
            <!-- Si réservé : overlay sombre -->
            <div class="reservation-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.85); border-radius: 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white;">
                <div style="font-weight: 700;">Lucas</div>
                <div style="font-size: 0.9rem;">👥 4 personnes</div>
                <div class="badge-platform" style="position: absolute; top: 5px; right: 5px; background: #FF5A5F; color: white; padding: 3px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: 700;">
                    Airbnb
                </div>
            </div>
        </div>
    </div>
</div>
```

#### Modal d'ajout de réservation :
```javascript
// Structure du modal (style Neo-Brutalism)
function openAddReservationModal() {
    // Créer un modal avec formulaire :
    // - Date d'arrivée (input type="date")
    // - Date de départ (input type="date")
    // - Nom du client (input text)
    // - Nombre de personnes (input number)
    // - Origine (select : Airbnb, Booking, Gîtes de France, Direct, Abritel, Autre)
    // - Calcul automatique du tarif affiché en temps réel
    // - Bouton "Confirmer" (appelle saveReservation())
}
```

#### Liste des réservations (sous le calendrier) :
```html
<div class="reservations-list" style="margin-top: 40px;">
    <h3 style="font-weight: 700; text-transform: uppercase; margin-bottom: 20px;">📋 Réservations du mois</h3>
    
    <!-- Filtres -->
    <div class="filters" style="display: flex; gap: 15px; margin-bottom: 20px;">
        <select id="filter-origine" class="select-neo" onchange="filterReservationsList()">
            <option value="">Toutes les origines</option>
            <option value="Airbnb">Airbnb</option>
            <option value="Booking">Booking.com</option>
            <!-- etc. -->
        </select>
        <select id="filter-statut" class="select-neo" onchange="filterReservationsList()">
            <option value="">Tous les statuts</option>
            <option value="confirmed">Confirmée</option>
            <option value="pending">En attente</option>
            <option value="cancelled">Annulée</option>
        </select>
    </div>
    
    <!-- Table ou cartes -->
    <div id="reservations-cards-list">
        <!-- Génération dynamique des cartes de réservation -->
    </div>
</div>
```

**Carte de réservation** (inspiré de votre style existant dans `reservations.js`) :
```html
<div class="reservation-card-item" style="background: var(--white); border: 2px solid var(--stroke); border-radius: 12px; padding: 20px; margin-bottom: 15px; box-shadow: 4px 4px 0 var(--stroke); position: relative;">
    <div class="reservation-header" style="display: flex; justify-content: space-between; align-items: start;">
        <div>
            <h4 style="font-weight: 700; font-size: 1.2rem;">Lucas</h4>
            <p>📅 15/01/2026 → 22/01/2026 (7 nuits)</p>
            <p>👥 4 personnes</p>
            <p>💰 1750 € | Acompte : 500 €</p>
        </div>
        <div style="display: flex; gap: 8px;">
            <button class="btn-neo" onclick="editReservation('res_001')" title="Modifier">✏️</button>
            <button class="btn-neo btn-delete" onclick="deleteReservation('res_001')" title="Supprimer">🗑️</button>
        </div>
    </div>
    <div class="badge-platform" style="display: inline-block; background: #FF5A5F; color: white; padding: 5px 12px; border-radius: 8px; border: 2px solid var(--stroke); font-weight: 700; margin-top: 10px;">
        Airbnb
    </div>
</div>
```

---

### Section 4️⃣ : Export Tableau Gîtes de France (Accordéon)

#### Toggle d'affichage permanent
```html
<div class="accordion-section">
    <button class="accordion-header" onclick="toggleSection('export-gdf')">
        <span>📊 Tableau Gîtes de France</span>
        <span class="accordion-icon">▼</span>
    </button>
    <div id="export-gdf" class="accordion-content">
        <div style="margin-bottom: 20px;">
            <label class="toggle-switch">
                <input type="checkbox" id="toggle-tableau-gdf" onchange="toggleTableauGDF()">
                <span class="toggle-slider"></span>
            </label>
            <span style="font-weight: 600; margin-left: 10px;">Afficher en permanence le tableau format Gîtes de France</span>
        </div>
        
        <div id="tableau-gdf-container" style="display: none;">
            <!-- Tableau généré automatiquement (inspiré de l'image 1) -->
            <table class="table-gdf" style="width: 100%; border-collapse: separate; border-spacing: 0; border: 2px solid var(--stroke); box-shadow: 4px 4px 0 var(--stroke); background: var(--white);">
                <thead>
                    <tr style="background: var(--c-blue); border-bottom: 2px solid var(--stroke);">
                        <th style="border: 2px solid var(--stroke); padding: 10px; font-weight: 700;">Arrivée</th>
                        <th>1 nuit</th>
                        <th>2 nuits</th>
                        <th>3 nuits</th>
                        <th>4 nuits</th>
                        <th>5 nuits</th>
                        <th>6 nuits</th>
                        <th>7 nuits</th>
                        <th>nuit supp</th>
                    </tr>
                </thead>
                <tbody id="tableau-gdf-body">
                    <!-- Génération dynamique des lignes -->
                    <!-- Exemple : -->
                    <tr>
                        <td style="border: 2px solid var(--stroke); padding: 8px; font-weight: 600;">Sa 03/01/2026</td>
                        <td style="border: 2px solid var(--stroke); padding: 8px; background: var(--c-green);">2700</td>
                        <td style="border: 2px solid var(--stroke); padding: 8px; background: var(--c-green);">3000</td>
                        <!-- etc. -->
                    </tr>
                </tbody>
            </table>
            
            <button class="btn-neo btn-save" style="margin-top: 20px;" onclick="exportTableauGDF()">
                📥 EXPORTER EN EXCEL
            </button>
        </div>
    </div>
</div>
```

#### Calcul automatique du tableau :
- **Colonnes** : Arrivée | 1 nuit | 2 nuits | ... | nuit supp
- **Lignes** : Toutes les dates de début de séjour possibles du mois affiché
- **Cellules** :
  - Fond vert (`var(--c-green)`) pour les dates disponibles
  - Fond blanc/gris si indisponible (réservé)
  - Tarif calculé selon les règles définies + promotions applicables

#### Export Excel :
```javascript
// Utiliser SheetJS (xlsx)
import * as XLSX from 'xlsx';

function exportTableauGDF() {
    const ws = XLSX.utils.table_to_sheet(document.querySelector('.table-gdf'));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tarifs GDF');
    
    const date = new Date();
    const fileName = `Tarifs_GDF_${date.getMonth()+1}_${date.getFullYear()}.xlsx`;
    XLSX.writeFile(wb, fileName);
}
```

---

## 🔧 SPÉCIFICATIONS TECHNIQUES

### Format & Stack
- **Type** : Nouvelle page HTML + fichiers JS/CSS dédiés
- **Nom des fichiers** :
  - `calendrier-tarifs.html`
  - `js/calendrier-tarifs.js`
  - CSS : Utiliser `/css/flat-outline.css` existant
- **Framework** : Vanilla JavaScript (pas de React, cohérent avec l'existant)
- **Styling** : Tailwind CSS **NON** (projet utilise CSS custom), utiliser les classes existantes dans `flat-outline.css`
- **Icônes** : Émojis Unicode (cohérent avec l'existant : 🏡 📅 💰 etc.)
- **Export Excel** : Bibliothèque [SheetJS (xlsx)](https://sheetjs.com/)
  ```html
  <script src="https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js"></script>
  ```
- **Stockage** : Supabase (via `window.supabaseClient`)
- **Gestion d'état** : Variables globales + fonctions asynchrones
- **Gestion d'erreurs** : `try/catch` avec affichage de toasts (fonction `showToast()` existante dans `shared-utils.js`)

### Responsive Design
- **Desktop** : Affichage complet
- **Tablette** : Calendrier adaptable en grille 4-3-3 colonnes
- **Mobile** : 
  - Calendrier en liste verticale
  - Accordéons fermés par défaut
  - Boutons pleine largeur

### Interactions & Feedback Utilisateur
- **Chargement** : Spinner Neo-Brutalism (icône ⏳ avec rotation CSS)
- **Succès/Erreur** : Toasts avec `showToast(message, type)` (existant)
- **Modals** : Créer une classe `.modal-neo` avec :
  - Fond overlay semi-transparent
  - Contenu centré avec bordures épaisses + ombre dure
  - Bouton fermeture (×) en haut à droite
- **Tooltips** : Attribut `title` sur les boutons d'action
- **Animations** : Transitions CSS douces (0.2s ease) sur les accordéons

---

## 📂 STRUCTURE DU CODE

### 1. Fichier HTML : `calendrier-tarifs.html`

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calendrier & Tarifs - Gestion Gîtes</title>
    
    <!-- CSS existant -->
    <link rel="stylesheet" href="css/flat-outline.css">
    <link rel="stylesheet" href="css/header-colonne.css">
    
    <!-- SheetJS pour export Excel -->
    <script src="https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js"></script>
</head>
<body>
    <!-- Header fixe (réutiliser structure existante) -->
    <header class="sticky-header">
        <div class="site-title">GESTION GÎTES</div>
        <div class="property-name" id="header-property-name">Calendrier & Tarifs</div>
    </header>
    
    <!-- Navigation (onglets) -->
    <nav class="nav-tabs-wrapper">
        <a href="index.html" class="tab-neo">
            <span class="tab-icon">🏠</span>
            <span>Dashboard</span>
        </a>
        <a href="reservations.html" class="tab-neo">
            <span class="tab-icon">📅</span>
            <span>Réservations</span>
        </a>
        <a href="calendrier-tarifs.html" class="tab-neo active">
            <span class="tab-icon">💰</span>
            <span>Calendrier & Tarifs</span>
        </a>
        <!-- Autres onglets existants -->
    </nav>
    
    <!-- Contenu principal -->
    <main style="max-width: 1400px; margin: 0 auto; padding: 20px;">
        <!-- Sélecteur de gîte + boutons export -->
        <div id="header-calendrier" class="sticky-selector">
            <!-- Voir section "En-tête" ci-dessus -->
        </div>
        
        <!-- Section 1 : Tarifs de Base (accordéon) -->
        <div id="section-tarifs-base">
            <!-- Voir détails ci-dessus -->
        </div>
        
        <!-- Section 2 : Règles Tarifaires (accordéon) -->
        <div id="section-regles-tarifaires">
            <!-- Voir détails ci-dessus -->
        </div>
        
        <!-- Section 3 : Calendrier Réservations (toujours visible) -->
        <div id="section-calendrier-reservations">
            <!-- Voir détails ci-dessus -->
        </div>
        
        <!-- Section 4 : Export Gîtes de France (accordéon) -->
        <div id="section-export-gdf">
            <!-- Voir détails ci-dessus -->
        </div>
    </main>
    
    <!-- Dépendances JS existantes -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/shared-config.js"></script>
    <script src="js/shared-utils.js"></script>
    <script src="js/auth.js"></script>
    
    <!-- Nouveau fichier JS dédié -->
    <script src="js/calendrier-tarifs.js"></script>
</body>
</html>
```

### 2. Fichier JavaScript : `js/calendrier-tarifs.js`

```javascript
// ==========================================
// 💰 MODULE CALENDRIER & TARIFS
// ==========================================

// ==========================================
// VARIABLES GLOBALES
// ==========================================

let currentGiteId = null;
let currentOrganizationId = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let tarifsCache = [];
let reservationsCache = [];
let reglesCache = null;

// ==========================================
// INITIALISATION
// ==========================================

async function initCalendrierTarifs() {
    try {
        // Vérifier authentification
        const user = await checkAuth();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        // Récupérer l'organization de l'utilisateur
        currentOrganizationId = await getUserOrganizationId();
        
        // Charger la liste des gîtes
        await loadGitesSelector();
        
        // Charger la configuration sauvegardée
        await loadConfiguration();
        
        // Charger les données du gîte actif
        if (currentGiteId) {
            await loadAllData();
        }
        
    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
        showToast('Erreur lors du chargement', 'error');
    }
}

// ==========================================
// CHARGEMENT DES GÎTES
// ==========================================

async function loadGitesSelector() {
    const { data: gites, error } = await window.supabaseClient
        .from('gites')
        .select('id, name')
        .eq('organization_id', currentOrganizationId)
        .order('display_order', { ascending: true });
    
    if (error) throw error;
    
    const selector = document.getElementById('gite-selector');
    gites.forEach(gite => {
        const option = document.createElement('option');
        option.value = gite.id;
        option.textContent = gite.name;
        selector.appendChild(option);
    });
    
    // Sélectionner le premier gîte par défaut
    if (gites.length > 0) {
        currentGiteId = gites[0].id;
        selector.value = currentGiteId;
    }
    
    selector.addEventListener('change', async (e) => {
        currentGiteId = e.target.value;
        await loadAllData();
        await saveConfiguration();
    });
}

// ==========================================
// SECTION 1 : TARIFS DE BASE
// ==========================================

async function loadTarifsBase() {
    const { data, error } = await window.supabaseClient
        .from('tarifs_base')
        .select('*')
        .eq('gite_id', currentGiteId);
    
    if (error) throw error;
    tarifsCache = data || [];
    renderCalendrierTarifs();
}

function renderCalendrierTarifs() {
    // Générer le calendrier mensuel avec les tarifs
    // Logique de rendu ici...
}

async function openTarifModal(date) {
    // Créer un modal pour définir le tarif d'un jour
    // ...
}

async function saveTarif(date, prix) {
    const { data, error } = await window.supabaseClient
        .from('tarifs_base')
        .upsert({
            organization_id: currentOrganizationId,
            gite_id: currentGiteId,
            date: date,
            prix_nuit: prix,
            updated_at: new Date().toISOString()
        }, { onConflict: 'gite_id,date' });
    
    if (error) throw error;
    showToast('Tarif enregistré', 'success');
    await loadTarifsBase();
}

// ==========================================
// SECTION 2 : RÈGLES TARIFAIRES
// ==========================================

async function loadRegles() {
    const { data, error } = await window.supabaseClient
        .from('regles_tarifaires')
        .select('*')
        .eq('gite_id', currentGiteId)
        .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    
    reglesCache = data || createDefaultRegles();
    renderReglesForm();
}

function createDefaultRegles() {
    return {
        gite_id: currentGiteId,
        organization_id: currentOrganizationId,
        grille_duree: {
            type: 'pourcentage',
            nuit_1: 100,
            nuit_2: 95,
            nuit_3: 90,
            nuit_4: 90,
            nuit_5: 85,
            nuit_6: 85,
            nuit_7: 80,
            nuit_supp: 80
        },
        promotions: {
            long_sejour: { actif: false, pourcentage: 10, a_partir_de: 7 },
            last_minute: { actif: false, pourcentage: 15, jours_avant: 7 },
            early_booking: { actif: false, pourcentage: 10, jours_avant: 60 }
        },
        duree_min_defaut: 2,
        periodes_duree_min: []
    };
}

function renderReglesForm() {
    // Remplir les inputs avec les valeurs de reglesCache
    // ...
}

async function saveRegles() {
    // Récupérer les valeurs des inputs
    const regles = {
        ...reglesCache,
        // Mettre à jour avec les valeurs du formulaire
        updated_at: new Date().toISOString()
    };
    
    const { data, error } = await window.supabaseClient
        .from('regles_tarifaires')
        .upsert(regles, { onConflict: 'gite_id' });
    
    if (error) throw error;
    showToast('Règles enregistrées', 'success');
    reglesCache = regles;
}

// ==========================================
// SECTION 3 : CALENDRIER RÉSERVATIONS
// ==========================================

async function loadReservations() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    const { data, error } = await window.supabaseClient
        .from('reservations')
        .select('*')
        .eq('gite_id', currentGiteId)
        .gte('check_in', firstDay.toISOString().split('T')[0])
        .lte('check_out', lastDay.toISOString().split('T')[0]);
    
    if (error) throw error;
    reservationsCache = data || [];
    renderCalendrierReservations();
    renderReservationsList();
}

function renderCalendrierReservations() {
    // Générer le calendrier avec les réservations et tarifs calculés
    // ...
}

function calculateTarif(dateDebut, dateFin) {
    // Calculer le tarif selon les règles définies
    const nbNuits = Math.ceil((new Date(dateFin) - new Date(dateDebut)) / (1000 * 60 * 60 * 24));
    
    // Récupérer les tarifs de base pour la période
    let tarifTotal = 0;
    for (let i = 0; i < nbNuits; i++) {
        const date = new Date(dateDebut);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const tarifBase = tarifsCache.find(t => t.date === dateStr)?.prix_nuit || 0;
        
        // Appliquer la grille de durée
        let multiplicateur = 1;
        if (reglesCache?.grille_duree) {
            const key = i < 7 ? `nuit_${i+1}` : 'nuit_supp';
            multiplicateur = reglesCache.grille_duree.type === 'pourcentage' 
                ? reglesCache.grille_duree[key] / 100 
                : reglesCache.grille_duree[key];
        }
        
        tarifTotal += tarifBase * multiplicateur;
    }
    
    // Appliquer les promotions
    if (reglesCache?.promotions) {
        const promos = reglesCache.promotions;
        
        // Long séjour
        if (promos.long_sejour?.actif && nbNuits >= promos.long_sejour.a_partir_de) {
            tarifTotal *= (1 - promos.long_sejour.pourcentage / 100);
        }
        
        // Last minute
        const joursAvantArrivee = Math.ceil((new Date(dateDebut) - new Date()) / (1000 * 60 * 60 * 24));
        if (promos.last_minute?.actif && joursAvantArrivee <= promos.last_minute.jours_avant) {
            tarifTotal *= (1 - promos.last_minute.pourcentage / 100);
        }
        
        // Early booking
        if (promos.early_booking?.actif && joursAvantArrivee >= promos.early_booking.jours_avant) {
            tarifTotal *= (1 - promos.early_booking.pourcentage / 100);
        }
    }
    
    return Math.round(tarifTotal * 100) / 100;
}

async function openAddReservationModal() {
    // Créer un modal avec formulaire
    // ...
}

async function saveReservation(reservationData) {
    const { data, error } = await window.supabaseClient
        .from('reservations')
        .insert({
            organization_id: currentOrganizationId,
            gite_id: currentGiteId,
            ...reservationData,
            created_at: new Date().toISOString()
        });
    
    if (error) throw error;
    showToast('Réservation enregistrée', 'success');
    await loadReservations();
}

// ==========================================
// SECTION 4 : EXPORT GÎTES DE FRANCE
// ==========================================

async function toggleTableauGDF() {
    const isActive = document.getElementById('toggle-tableau-gdf').checked;
    const container = document.getElementById('tableau-gdf-container');
    
    if (isActive) {
        container.style.display = 'block';
        await generateTableauGDF();
    } else {
        container.style.display = 'none';
    }
    
    // Sauvegarder la préférence
    await saveConfiguration();
}

async function generateTableauGDF() {
    // Générer le tableau avec toutes les dates du mois
    // et les tarifs calculés pour chaque durée
    // ...
}

function exportTableauGDF() {
    const table = document.querySelector('.table-gdf');
    const ws = XLSX.utils.table_to_sheet(table);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tarifs GDF');
    
    const monthName = new Date(currentYear, currentMonth).toLocaleString('fr-FR', { month: 'long' });
    const fileName = `Tarifs_GDF_${monthName}_${currentYear}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    showToast('Export Excel réussi', 'success');
}

// ==========================================
// EXPORTS GLOBAUX
// ==========================================

function exportAll() {
    // Exporter calendrier complet (tarifs + réservations)
    // ...
}

function exportReservations() {
    // Exporter liste des réservations
    // ...
}

// ==========================================
// CONFIGURATION
// ==========================================

async function loadConfiguration() {
    const { data, error } = await window.supabaseClient
        .from('configuration_calendrier')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
        if (data.gite_actif_id) {
            currentGiteId = data.gite_actif_id;
            document.getElementById('gite-selector').value = currentGiteId;
        }
        if (data.afficher_tableau_gdf) {
            document.getElementById('toggle-tableau-gdf').checked = true;
            await toggleTableauGDF();
        }
    }
}

async function saveConfiguration() {
    const config = {
        organization_id: currentOrganizationId,
        gite_actif_id: currentGiteId,
        afficher_tableau_gdf: document.getElementById('toggle-tableau-gdf')?.checked || false,
        updated_at: new Date().toISOString()
    };
    
    await window.supabaseClient
        .from('configuration_calendrier')
        .upsert(config, { onConflict: 'organization_id' });
}

// ==========================================
// HELPERS
// ==========================================

async function getUserOrganizationId() {
    const user = window.supabaseClient.auth.getUser();
    const { data, error } = await window.supabaseClient
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
    
    if (error) throw error;
    return data.organization_id;
}

async function loadAllData() {
    await loadTarifsBase();
    await loadRegles();
    await loadReservations();
}

// ==========================================
// LANCEMENT
// ==========================================

document.addEventListener('DOMContentLoaded', initCalendrierTarifs);
```

---

## 🎯 CAS D'USAGE PRINCIPAUX

### Scénario 1 : Configuration initiale des tarifs
1. L'utilisateur sélectionne un gîte dans le sélecteur
2. Il ouvre l'accordéon "Configuration des Tarifs de Base"
3. Il clique sur chaque jour du mois pour définir le tarif de base
4. Les tarifs sont sauvegardés automatiquement dans `tarifs_base`

### Scénario 2 : Définition des règles tarifaires
1. L'utilisateur ouvre l'accordéon "Règles Tarifaires Dynamiques"
2. Il configure la grille de durée (dégressivité selon nb de nuits)
3. Il active les promotions (long séjour, last minute, early booking)
4. Il définit les périodes de durée minimale (ex: 7 nuits en juillet-août)
5. Il clique sur "SAUVEGARDER LES RÈGLES TARIFAIRES"

### Scénario 3 : Visualisation et ajout de réservation
1. Le calendrier mensuel affiche automatiquement les tarifs calculés par jour
2. Les jours réservés apparaissent avec un overlay sombre
3. L'utilisateur clique sur "AJOUTER UNE RÉSERVATION"
4. Il remplit le formulaire (dates, client, origine)
5. Le tarif total est calculé automatiquement en temps réel
6. Il confirme → la réservation est enregistrée et visible immédiatement

### Scénario 4 : Export pour Gîtes de France
1. L'utilisateur active le toggle "Afficher le tableau format Gîtes de France"
2. Le tableau s'affiche avec toutes les dates d'arrivée possibles du mois
3. Chaque cellule affiche le tarif total selon la durée (1 à 7 nuits + nuit supp)
4. Il clique sur "EXPORTER EN EXCEL"
5. Un fichier .xlsx est téléchargé avec le nom `Tarifs_GDF_janvier_2026.xlsx`

### Scénario 5 : Exports comptables
1. L'utilisateur clique sur "📊 Exporter Calendrier Complet" → génère un Excel avec tous les tarifs et réservations
2. Il clique sur "📋 Exporter Réservations" → génère un Excel avec la liste détaillée des réservations du mois

---

## 🚀 PROCHAINES ÉTAPES

### Phase 1 : Création de la structure
1. ✅ Créer les migrations SQL pour les nouvelles tables
2. ✅ Créer le fichier `calendrier-tarifs.html` avec la structure
3. ✅ Créer le fichier `js/calendrier-tarifs.js` avec les fonctions principales

### Phase 2 : Développement des sections
1. Implémenter la section "Tarifs de Base" (calendrier + modal)
2. Implémenter la section "Règles Tarifaires" (formulaire complet)
3. Implémenter le "Calendrier Réservations" (affichage + calcul tarifs)
4. Implémenter le "Tableau Gîtes de France" (génération + export)

### Phase 3 : Tests et optimisations
1. Tester les calculs tarifaires avec différents scénarios
2. Vérifier la cohérence des exports Excel
3. Tester le responsive design (mobile/tablette/desktop)
4. Optimiser les performances (cache, requêtes Supabase)

### Phase 4 : Intégration
1. Ajouter l'onglet dans la navigation principale (`index.html`)
2. Mettre à jour la documentation (`README.md`)
3. Tester l'authentification et les permissions RLS
4. Déployer sur Vercel

---

## 📝 NOTES IMPORTANTES

- **Multi-tenant** : Toujours filtrer par `organization_id` dans les requêtes
- **RLS** : Les policies Supabase garantissent que chaque organisation voit uniquement ses données
- **Cache** : Utiliser `window.invalidateCache()` après les modifications si la fonction existe
- **Dates** : Utiliser le format `YYYY-MM-DD` pour la cohérence avec Supabase
- **Feedback** : Toujours afficher un toast après une action (succès/erreur)
- **Sécurité** : Valider les inputs côté client ET serveur (contraintes SQL)
- **Performance** : Limiter les requêtes en chargeant les données par mois uniquement

---

## ❓ QUESTIONS OUVERTES

- [ ] Faut-il gérer plusieurs monnaies (€, $, £) ?
- [ ] Les promotions peuvent-elles se cumuler ?
- [ ] Faut-il un historique des modifications de tarifs ?
- [ ] Faut-il une notification quand une réservation approche de la durée minimale ?

---

**🎯 OBJECTIF FINAL** : Un onglet complet, fonctionnel, esthétique et cohérent avec le reste de l'application, permettant une gestion intuitive et professionnelle des tarifs et réservations.

---

*Prompt généré le 11 janvier 2026*  
*Adapté pour : Gestion Gîtes Calvignac (Supabase + Flat Outline)*
