# MIGRATION LOT 09 - TABLEAUX
**Date**: 26 janvier 2026  
**Version CSS**: 2.9.0

## 📋 Classes concernées

- `.table` - Tableau de base
- `.table-hover` - Lignes hover
- `.table-striped` - Lignes alternées
- `.table-bordered` - Avec bordures
- `.table-responsive` - Responsive wrapper

## 🎨 Styles CSS

```css
/* ═══════════════════════════════════════════════════════════════════════
   TABLEAUX - LOT 09 (26 JAN 2026)
   ═══════════════════════════════════════════════════════════════════════ */

.table-responsive {
    overflow-x: auto;
    border-radius: 12px;
    border: 2px solid var(--border-color);
}

.table {
    width: 100%;
    border-collapse: collapse;
    background: var(--bg-secondary);
}

.table thead th {
    padding: 16px;
    text-align: left;
    font-weight: 700;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary);
    border-bottom: 2px solid var(--border-color);
    background: var(--bg-primary);
}

.table tbody td {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
}

.table tbody tr:last-child td {
    border-bottom: none;
}

/* Table hover */
.table-hover tbody tr {
    transition: background 0.2s;
}

.table-hover tbody tr:hover {
    background: var(--btn-neutral);
}

/* Table striped */
.table-striped tbody tr:nth-child(even) {
    background: var(--bg-primary);
}

/* Table bordered */
.table-bordered {
    border: 2px solid var(--border-color);
}

.table-bordered thead th,
.table-bordered tbody td {
    border: 1px solid var(--border-color);
}

/* Adaptation APPLE */
html.style-apple .table-responsive {
    border-radius: 16px;
}

html.style-apple .table thead th {
    padding: 18px 20px;
}

/* Adaptation SIDEBAR */
html.style-sidebar .table-responsive {
    border-radius: 8px;
    border-left-width: 4px;
}

html.style-sidebar .table tbody tr:hover {
    border-left: 3px solid var(--upstay-cyan);
}

/* Responsive mobile */
@media (max-width: 768px) {
    .table thead {
        display: none;
    }
    
    .table tbody tr {
        display: block;
        margin-bottom: 16px;
        border: 2px solid var(--border-color);
        border-radius: 8px;
    }
    
    .table tbody td {
        display: block;
        text-align: right;
        padding: 12px;
        border-bottom: 1px solid var(--border-color);
    }
    
    .table tbody td:before {
        content: attr(data-label);
        float: left;
        font-weight: 700;
        color: var(--text-secondary);
    }
    
    .table tbody td:last-child {
        border-bottom: none;
    }
}
```

## 📝 Exemple HTML

```html
<div class="table-responsive">
    <table class="table table-hover table-striped">
        <thead>
            <tr>
                <th>Gîte</th>
                <th>Dates</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Statut</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td data-label="Gîte">Le Relais</td>
                <td data-label="Dates">26/01 - 02/02</td>
                <td data-label="Client">Martin Dupont</td>
                <td data-label="Montant">850 €</td>
                <td data-label="Statut">
                    <span class="badge badge-success">Confirmé</span>
                </td>
            </tr>
            <tr>
                <td data-label="Gîte">La Bergerie</td>
                <td data-label="Dates">02/02 - 09/02</td>
                <td data-label="Client">Sophie Martin</td>
                <td data-label="Montant">1200 €</td>
                <td data-label="Statut">
                    <span class="badge badge-warning">En attente</span>
                </td>
            </tr>
        </tbody>
    </table>
</div>
```

## ✅ Intégration

Styles ajoutés dans `css/main.css` après la section ALERTES.
Responsive mobile inclus avec `data-label` pour affichage vertical.
