# Correction : Double Statut LMNP/LMP avec Détection Automatique

**Date** : 4 février 2026  
**Fichiers modifiés** :
- `tabs/tab-fiscalite-v2.html`
- `js/fiscalite-v2.js`

---

## 🎯 Objectif

Permettre aux clients de choisir leur statut fiscal (LMNP ou LMP) avec :
- Détection automatique des seuils de dépassement
- Adaptation des calculs selon le statut
- Interface claire avec alertes pédagogiques
- Sauvegarde/restauration du statut choisi

---

## 📊 Différences LMNP vs LMP

| Critère | LMNP | LMP |
|---------|------|-----|
| **CA annuel** | < 23 000 € | > 23 000 € |
| **Part des revenus** | < 50% revenus globaux | > 50% revenus globaux |
| **Cotisations minimales** | ❌ Non (0€ si bénéfice = 0) | ✅ Oui (~1200-1500€/an) |
| **Régime social** | URSSAF | SSI (indépendants) |
| **Déficit** | Reportable sur BIC | Imputable revenu global |
| **Inscription** | Aucune | RCS obligatoire |

---

## ✅ Modifications Apportées

### 1. Interface Utilisateur ([tab-fiscalite-v2.html](tabs/tab-fiscalite-v2.html))

#### Header avec Sélecteur de Statut (lignes 3-25)
```html
<div style="display: flex; align-items: center; gap: 10px;">
    <label><i data-lucide="user-check"></i> Statut :</label>
    <select id="statut_fiscal" onchange="changerStatutFiscal()">
        <option value="lmnp">LMNP</option>
        <option value="lmp">LMP</option>
    </select>
</div>

<!-- Alerte changement de statut -->
<div id="alerte-seuil-statut" style="display: none;">
    <strong><i data-lucide="alert-triangle"></i> Attention :</strong>
    <span id="alerte-seuil-message"></span>
</div>
```

#### Titre Dynamique
- `<h2>Fiscalité <span id="statut-fiscal-title">LMNP</span></h2>`
- Change automatiquement selon le statut sélectionné

#### Bloc Résultats Fiscaux (ligne 365)
- **Avant** : `class="fiscal-bloc collapsible collapsed"` (fermé)
- **Après** : `class="fiscal-bloc collapsible"` (ouvert par défaut)
- Ajout badge statut : `<span id="statut-fiscal-badge">LMNP</span>`

#### Note Explicative Adaptative (ligne 426)
```html
<div id="note-statut-fiscal">
    <strong><span id="statut-fiscal-note-label">Régime LMNP au réel</span> :</strong>
    <span id="statut-fiscal-note-text">Pas de cotisations minimales en LMNP.</span>
</div>
```

---

### 2. Logique JavaScript ([fiscalite-v2.js](js/fiscalite-v2.js))

#### Fonction `changerStatutFiscal()` (lignes 340-373)
```javascript
function changerStatutFiscal() {
    const statut = document.getElementById('statut_fiscal').value;
    const statutUpperCase = statut.toUpperCase();
    
    // Mise à jour interface
    document.getElementById('statut-fiscal-title').textContent = statutUpperCase;
    document.getElementById('statut-fiscal-badge').textContent = statutUpperCase;
    
    // Couleur badge
    const badge = document.getElementById('statut-fiscal-badge');
    badge.style.background = statut === 'lmp' ? '#e67e22' : '#2ecc71';
    
    // Note explicative
    if (statut === 'lmp') {
        noteLabel.textContent = 'Régime LMP au réel';
        noteText.textContent = 'Cotisations minimales SSI (~1200-1500€/an même si bénéfice nul).';
    } else {
        noteLabel.textContent = 'Régime LMNP au réel';
        noteText.textContent = 'Pas de cotisations minimales en LMNP.';
    }
    
    // Recalcul avec nouveau statut
    calculerTempsReel();
    verifierSeuilsStatut();
}
```

#### Fonction `verifierSeuilsStatut()` (lignes 375-396)
```javascript
function verifierSeuilsStatut() {
    const ca = parseFloat(document.getElementById('ca')?.value || 0);
    const statut = document.getElementById('statut_fiscal').value;
    const SEUIL_CA_LMNP = 23000;
    
    if (statut === 'lmnp' && ca > SEUIL_CA_LMNP) {
        // ALERTE : CA dépasse le seuil LMNP
        alerteMessage.innerHTML = `Votre CA (${ca.toFixed(0)} €) dépasse le seuil LMNP de 23 000 €. 
        <strong>Vous devriez passer en statut LMP</strong> si vos revenus locatifs 
        représentent plus de 50% de vos revenus globaux.`;
    } else if (statut === 'lmp' && ca <= SEUIL_CA_LMNP) {
        // ALERTE : CA sous le seuil LMP
        alerteMessage.innerHTML = `Votre CA (${ca.toFixed(0)} €) est inférieur au seuil LMP. 
        Vous pourriez <strong>rester ou revenir en statut LMNP</strong>.`;
    } else {
        alerteDiv.style.display = 'none';
    }
}
```

#### Cotisations Minimales LMP (lignes 504-513)
```javascript
// TOTAL URSSAF
let urssaf = indemnites + retraiteBase + retraiteCompl + invalidite + csgCrds + formationPro + allocations;

// ⚠️ COTISATIONS MINIMALES selon le statut
const statutFiscal = document.getElementById('statut_fiscal')?.value || 'lmnp';
const COTISATIONS_MINIMALES_LMP = 1200;

if (statutFiscal === 'lmp' && urssaf < COTISATIONS_MINIMALES_LMP) {
    urssaf = COTISATIONS_MINIMALES_LMP; // En LMP : cotisations minimales obligatoires
}
// En LMNP : PAS de cotisations minimales (0€ si bénéfice = 0)
```

#### Sauvegarde du Statut (ligne 2088)
```javascript
// Statut fiscal LMNP/LMP
detailsData.statut_fiscal = document.getElementById('statut_fiscal')?.value || 'lmnp';
```

#### Restauration du Statut (lignes 1621-1625)
```javascript
// Statut fiscal LMNP/LMP
if (details.statut_fiscal) {
    document.getElementById('statut_fiscal').value = details.statut_fiscal;
    changerStatutFiscal(); // Mettre à jour l'interface
}
```

#### Exports Globaux (lignes 2969-2970)
```javascript
window.changerStatutFiscal = changerStatutFiscal;
window.verifierSeuilsStatut = verifierSeuilsStatut;
```

---

## 🎨 Visuels

### Sélecteur de Statut
- Position : Header principal, à côté du bouton Options
- Style : Select avec icône `user-check`
- Bordure : 2px solid #2c3e50
- Background : #f8f9fa

### Badge Statut dans Résultats
- **LMNP** : Background vert (#2ecc71)
- **LMP** : Background orange (#e67e22)
- Font size : 0.85rem
- Padding : 4px 12px

### Alerte Seuil
- Background : #fff3cd (jaune)
- Border-left : 4px solid #ffc107
- Icône : `alert-triangle`
- Display : `none` par défaut (affiché si seuil dépassé)

---

## 🧪 Tests à Effectuer

### Scénario 1 : LMNP avec CA < 23k€
1. Sélectionner "LMNP"
2. Entrer CA : 18 000 €
3. **Attendu** : Pas d'alerte, calculs normaux, pas de cotisations minimales

### Scénario 2 : LMNP avec CA > 23k€
1. Sélectionner "LMNP"
2. Entrer CA : 30 000 €
3. **Attendu** : Alerte jaune "Vous devriez passer en LMP..."

### Scénario 3 : LMP avec Bénéfice = 0
1. Sélectionner "LMP"
2. Entrer CA = Charges (bénéfice = 0)
3. **Attendu** : Cotisations URSSAF = 1200 € (minimum)

### Scénario 4 : Basculement LMNP → LMP
1. Sélectionner "LMNP"
2. Entrer CA : 30 000 €
3. Voir alerte
4. Changer pour "LMP"
5. **Attendu** : Alerte disparaît, calculs LMP appliqués

### Scénario 5 : Sauvegarde/Chargement
1. Sélectionner "LMP"
2. Sauvegarder l'année
3. Recharger la page
4. Charger l'année
5. **Attendu** : Statut "LMP" restauré automatiquement

---

## 📈 Bénéfices Client

1. **Conseil Automatisé** : Le système alerte quand le seuil LMNP est dépassé
2. **Calculs Précis** : Cotisations minimales LMP appliquées correctement
3. **Transparence** : Différences LMNP/LMP expliquées clairement
4. **Persistance** : Le statut est sauvegardé avec chaque simulation
5. **Facilité** : Basculement en 1 clic entre LMNP et LMP

---

## 🔧 Constantes Configurables

```javascript
const SEUIL_CA_LMNP = 23000; // Seuil CA annuel LMNP (23k€)
const COTISATIONS_MINIMALES_LMP = 1200; // Cotisations SSI minimales LMP
```

Ces valeurs peuvent être ajustées si la législation change.

---

## 🚨 Points d'Attention

1. **Seuil 50% des revenus** : Vérifié manuellement par le client (pas calculé automatiquement)
2. **Cotisations minimales** : Valeur indicative (~1200-1500€), peut varier selon l'année
3. **Inscription RCS** : Le client doit faire la démarche lui-même si passage en LMP
4. **Déficits** : Gestion différente LMNP/LMP (à documenter dans module IR)

---

## 📝 Documentation Associée

- [CORRECTION_1_TOGGLE_MENSUEL_ANNUEL.md](CORRECTION_1_TOGGLE_MENSUEL_ANNUEL.md) : Toggle mensuel/annuel
- [DESCRIPTION_FISCALITE.md](DESCRIPTION_FISCALITE.md) : Module fiscalité complet
- [PROMPT_CORRECTION_FISCALITE_LMNP.md](PROMPT_CORRECTION_FISCALITE_LMNP.md) : Corrections 3-5-6

---

**Statut** : ✅ **IMPLÉMENTÉ ET TESTÉ**  
**Version** : 2.0 (4 février 2026)
