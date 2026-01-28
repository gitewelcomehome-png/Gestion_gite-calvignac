<!DOCTYPE html>
<html lang="fr" data-theme="dark" id="app-root" class="style-sidebar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 Test Migration Lot 09 - Tableaux</title>
    
    <style>
        /* ==========================================================================
           VARIABLES & FONDATIONS
           ========================================================================== */
        :root {
            --upstay-cyan: #00C2CB;
            --upstay-blue: #005288;
        }

        :root[data-theme="light"] {
            --bg-primary: #f5f5f7;
            --bg-secondary: #ffffff;
            --text-primary: #1d1d1f;
            --text-secondary: #86868b;
            --border-color: rgba(0, 0, 0, 0.08);
            --btn-neutral: rgba(0, 0, 0, 0.03);
        }

        :root[data-theme="dark"] {
            --bg-primary: #050506;
            --bg-secondary: #111113;
            --text-primary: #ffffff;
            --text-secondary: #94a3b8;
            --border-color: rgba(255, 255, 255, 0.1);
            --btn-neutral: rgba(255, 255, 255, 0.05);
        }

        body {
            font-family: -apple-system, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            margin: 0; padding: 40px;
        }

        .container { max-width: 1000px; margin: 0 auto; }

        /* ==========================================================================
           LOGIQUE TABLEAUX (LOT 09)
           ========================================================================== */
        
        .table-responsive {
            overflow-x: auto;
            border: 2px solid var(--border-color);
            background: var(--bg-secondary);
        }

        .table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.95rem;
        }

        .table thead th {
            padding: 16px;
            text-align: left;
            font-weight: 700;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-secondary);
            border-bottom: 2px solid var(--border-color);
            background: rgba(0,0,0,0.02);
        }

        .table tbody td {
            padding: 14px 16px;
            border-bottom: 1px solid var(--border-color);
            transition: all 0.2s;
        }

        /* Hover & Striped */
        .table-hover tbody tr:hover { background: var(--btn-neutral); }
        .table-striped tbody tr:nth-child(even) { background: rgba(125,125,125,0.02); }

        /* Badges pour le test */
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
        .badge-success { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .badge-warning { background: rgba(251, 146, 60, 0.2); color: #fb923c; }

        /* --- ADAPTATION APPLE --- */
        .style-apple .table-responsive { border-radius: 16px; border-width: 1px; }
        .style-apple .table thead th { background: transparent; }

        /* --- ADAPTATION SIDEBAR --- */
        .style-sidebar .table-responsive { border-radius: 4px; border-left-width: 5px; }
        .style-sidebar .table tbody tr:hover td:first-child { 
            box-shadow: inset 4px 0 0 var(--upstay-cyan); 
        }

        /* --- RESPONSIVE MOBILE --- */
        @media (max-width: 768px) {
            .table thead { display: none; }
            .table tbody tr { display: block; margin-bottom: 15px; border-bottom: 4px solid var(--border-color); }
            .table tbody td { 
                display: flex; justify-content: space-between; align-items: center;
                text-align: right; border-bottom: 1px solid var(--border-color);
            }
            .table tbody td::before { content: attr(data-label); font-weight: 700; color: var(--text-secondary); font-size: 12px; }
        }

        /* --- SWITCHERS --- */
        .controls { display: flex; gap: 10px; margin-bottom: 30px; background: #000; padding: 8px; border-radius: 12px; width: fit-content; }
        .ctrl-btn { background: #222; color: #fff; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; opacity: 0.6; }
        .ctrl-btn.active { background: var(--upstay-cyan); opacity: 1; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Migration Lot 09 : Tableaux de Données</h1>
        
        <div style="display: flex; gap: 15px; margin-bottom: 30px;">
            <div class="controls">
                <button class="ctrl-btn active" id="btn-sidebar" onclick="updateStyle('sidebar')">SIDEBAR</button>
                <button class="ctrl-btn" id="btn-apple" onclick="updateStyle('apple')">APPLE</button>
            </div>
            <div class="controls">
                <button class="ctrl-btn active" id="btn-dark" onclick="updateTheme('dark')">NUIT</button>
                <button class="ctrl-btn" id="btn-light" onclick="updateTheme('light')">JOUR</button>
            </div>
        </div>

        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead>
                    <tr>
                        <th>Hébergement</th>
                        <th>Période</th>
                        <th>Client</th>
                        <th>CA</th>
                        <th>Statut</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td data-label="Hébergement"><strong>Le Relais de Calvignac</strong></td>
                        <td data-label="Période">26 Jan - 02 Fév</td>
                        <td data-label="Client">Martin D.</td>
                        <td data-label="CA">850,00 €</td>
                        <td data-label="Statut"><span class="badge badge-success">Confirmé</span></td>
                    </tr>
                    <tr>
                        <td data-label="Hébergement"><strong>La Bergerie</strong></td>
                        <td data-label="Période">02 Fév - 09 Fév</td>
                        <td data-label="Client">Sophie M.</td>
                        <td data-label="CA">1 240,00 €</td>
                        <td data-label="Statut"><span class="badge badge-warning">En attente</span></td>
                    </tr>
                    <tr>
                        <td data-label="Hébergement"><strong>Studio Loft</strong></td>
                        <td data-label="Période">12 Fév - 15 Fév</td>
                        <td data-label="Client">Jean R.</td>
                        <td data-label="CA">450,00 €</td>
                        <td data-label="Statut"><span class="badge badge-success">Confirmé</span></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    

    <script>
        function updateStyle(style) {
            const root = document.getElementById('app-root');
            root.classList.remove('style-sidebar', 'style-apple');
            root.classList.add(`style-${style}`);
            document.getElementById('btn-sidebar').classList.toggle('active', style === 'sidebar');
            document.getElementById('btn-apple').classList.toggle('active', style === 'apple');
        }

        function updateTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            document.getElementById('btn-dark').classList.toggle('active', theme === 'dark');
            document.getElementById('btn-light').classList.toggle('active', theme === 'light');
        }
    </script>
</body>
</html>