# 🐺 CALOU - Structure HTML pour Réservations

## Structure HTML Carte Réservation (Mode CALOU)

```html
<div class="calou-card" style="padding: 1.5rem; margin-bottom: 1rem; display: flex; flex-direction: column; gap: 1.5rem; border-left: 4px solid #6366f1;">
    <!-- Badge J-3 optionnel -->
    <div style="position: absolute; top: 1rem; right: 1rem; background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.3); color: #fbbf24; padding: 0.375rem 0.75rem; border-radius: 0.75rem; font-size: 0.75rem; font-weight: 700; animation: pulse 2s infinite;">⚡ J-3 Fiche</div>
    
    <!-- Contenu principal -->
    <div style="display: flex; align-items: center; gap: 1.5rem;">
        <!-- Icône circulaire -->
        <div style="width: 4rem; height: 4rem; background: rgba(99, 102, 241, 0.1); border-radius: 1rem; display: flex; align-items: center; justify-content: center; font-size: 2rem; flex-shrink: 0;">
            🏠
        </div>
        
        <!-- Informations -->
        <div style="flex: 1;">
            <h3 style="font-size: 1.25rem; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em; margin-bottom: 0.5rem;">
                DUPOND
            </h3>
            <p style="font-size: 0.875rem; font-weight: 600; color: #a5b4fc; margin: 0;">
                Séjour en cours • 22/01 → 25/01
            </p>
            <div style="display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.8rem; opacity: 0.6;">
                <span>🏠 Trévoux</span>
                <span>👥 2</span>
                <span>🕐 14:30 → 10:00</span>
                <span>3n</span>
            </div>
        </div>
        
        <!-- Paiement -->
        <span style="font-size: 1.5rem; opacity: 0.5;" title="Paiement">✅</span>
    </div>
    
    <!-- Boutons -->
    <div style="display: flex; gap: 0.5rem;">
        <button onclick="aperçuFicheClient('xxx')" style="flex: 1; padding: 0.75rem 1.5rem; background: white; color: black; font-size: 0.625rem; font-weight: 900; text-transform: uppercase; border-radius: 0.75rem; border: none; cursor: pointer; transition: transform 0.1s;">
            📄 Fiche Client
        </button>
        <button onclick="openEditReservation('xxx')" style="padding: 0.75rem 1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 0.75rem; cursor: pointer;">
            ✏️
        </button>
    </div>
</div>
```

## Structure HTML Carte Ménage (Mode CALOU)

```html
<div class="calou-card" style="border-left: 4px solid #6366f1; padding: 1rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 1rem;">
    <!-- Icône circulaire -->
    <div style="width: 3rem; height: 3rem; background: rgba(16, 185, 129, 0.1); border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">
        🌅
    </div>
    
    <!-- Informations -->
    <div style="flex: 1;">
        <div style="font-weight: 700; color: #6366f1; margin-bottom: 0.25rem; font-size: 1rem;">
            Trévoux
        </div>
        <div style="font-size: 0.875rem; opacity: 0.7;">
            📅 20/01/2026
        </div>
    </div>
    
    <!-- Statut -->
    <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="padding: 0.375rem 0.75rem; background: #10b981; color: white; border-radius: 0.75rem; font-weight: 700; font-size: 0.75rem; text-transform: uppercase;">
            Validé
        </span>
        <span style="font-size: 1.5rem;">✅</span>
    </div>
</div>
```

## Structure HTML Alerte (Mode CALOU)

```html
<div class="calou-card calou-alert-warning" style="padding: 1rem 1.25rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: transform 0.2s;">
    <span style="font-size: 1.5rem;">📄</span>
    <span style="flex: 1; font-weight: 600;">1 fiche(s) client à envoyer (J-3)</span>
    <span style="font-size: 1.2rem; opacity: 0.7;">→</span>
</div>
```

## Classes CSS à ajouter si besoin

```css
/* Classe pour bordure selon le statut */
.border-indigo { border-left-color: #6366f1 !important; }
.border-amber { border-left-color: #f59e0b !important; }
.border-green { border-left-color: #10b981 !important; }

/* Backgrounds icônes */
.bg-indigo-10 { background: rgba(99, 102, 241, 0.1); }
.bg-amber-10 { background: rgba(245, 158, 11, 0.1); }
.bg-green-10 { background: rgba(16, 185, 129, 0.1); }

/* Couleurs texte statut */
.text-indigo { color: #a5b4fc; }
.text-amber { color: #fbbf24; }
.text-green { color: #34d399; }
```

## Variables CSS CALOU

### Mode Jour (par défaut)
```css
--calou-bg: #f8fafc;
--calou-card: rgba(255, 255, 255, 0.9);
--calou-text: #1e293b;
--calou-border: rgba(0, 0, 0, 0.1);
--calou-accent: #6366f1;
```

### Mode Nuit
```css
--calou-bg: #0a0e1a;
--calou-card: rgba(15, 23, 42, 0.6);
--calou-text: #e2e8f0;
--calou-border: rgba(99, 102, 241, 0.12);
--calou-accent: #6366f1;
```

## Animation Pulse

```css
@keyframes pulse {
    0%, 100% { 
        opacity: 1; 
        transform: scale(1);
    }
    50% { 
        opacity: 0.85;
        transform: scale(1.05);
    }
}
```

## Notes importantes

1. **Backdrop-filter** : Les cartes utilisent `backdrop-filter: blur(16px)` pour l'effet glassmorphism
2. **Border-radius** : Utiliser 1rem (16px) pour cohérence
3. **Gaps** : Espacements de 1rem à 1.5rem entre les éléments
4. **Font** : Plus Jakarta Sans, poids 800 pour les titres
5. **Colors status** :
   - Séjour en cours : Indigo (#6366f1, #a5b4fc)
   - Arrivée prochaine : Amber (#f59e0b, #fbbf24)
   - Terminé : Green (#10b981, #34d399)
