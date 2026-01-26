<!DOCTYPE html>
<html lang="fr" data-theme="dark" id="app-root" class="style-sidebar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 Test Migration Lot 05 - Badges & Labels</title>
    
    <style>
        /* ==========================================================================
           VARIABLES & FONDATIONS (Base commune)
           ========================================================================== */
        :root {
            --upstay-cyan: #00C2CB;
            --upstay-blue: #005288;
            --upstay-gradient: linear-gradient(135deg, #00C2CB 0%, #005288 100%);
        }

        :root[data-theme="light"] {
            --bg-primary: #f5f5f7;
            --bg-secondary: #ffffff;
            --text-primary: #1d1d1f;
            --text-secondary: #86868b;
            --border-color: rgba(0, 0, 0, 0.1);
            --btn-neutral: rgba(0, 0, 0, 0.04);
            --btn-neutral-bg: #e5e7eb;
        }

        :root[data-theme="dark"] {
            --bg-primary: #050506;
            --bg-secondary: #111113;
            --text-primary: #ffffff;
            --text-secondary: #94a3b8;
            --border-color: rgba(255, 255, 255, 0.1);
            --btn-neutral: rgba(255, 255, 255, 0.06);
            --btn-neutral-bg: #2d2d30;
        }

        body {
            font-family: -apple-system, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            margin: 0;
            padding: 40px;
        }

        .container { max-width: 800px; margin: 0 auto; }
        .section-card { 
            background: var(--bg-secondary); 
            border: 1px solid var(--border-color); 
            border-radius: 16px; 
            padding: 30px; 
            margin-bottom: 30px; 
        }

        /* ==========================================================================
           LOGIQUE BADGES & LABELS (LOT 05)
           ========================================================================== */
        
        .badge {
            display: inline-flex;
            align-items: center;
            padding: 6px 12px;
            font-size: 0.85rem;
            font-weight: 600;
            line-height: 1;
            white-space: nowrap;
            gap: 6px;
        }

        /* Variantes de couleurs */
        .badge-success { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge-warning { background: rgba(251, 146, 60, 0.15); color: #fb923c; border: 1px solid rgba(251, 146, 60, 0.3); }
        .badge-danger  { background: rgba(239, 68, 68, 0.15);  color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        .badge-info    { background: rgba(59, 130, 246, 0.15);  color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); }
        .badge-neutral { background: var(--btn-neutral);       color: var(--text-primary); border: 1px solid var(--border-color); }

        /* Labels */
        .label {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.7rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }
        .label-primary { background: var(--upstay-gradient); color: white; }
        .label-secondary { background: var(--btn-neutral-bg); color: var(--text-secondary); }

        /* --- ADAPTATION STYLE APPLE --- */
        .style-apple .badge { border-radius: 20px; padding: 8px 14px; }
        .style-apple .label { border-radius: 4px; }

        /* --- ADAPTATION STYLE SIDEBAR --- */
        .style-sidebar .badge { border-radius: 4px; border-left-width: 4px; }
        .style-sidebar .label { border-radius: 0px; border-left: 2px solid white; }

        /* --- SWITCHERS UI --- */
        .controls { display: flex; gap: 10px; margin-bottom: 20px; background: #000; padding: 8px; border-radius: 12px; width: fit-content; }
        .ctrl-btn { background: #222; color: #fff; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; opacity: 0.6; }
        .ctrl-btn.active { background: var(--upstay-cyan); opacity: 1; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Migration Lot 05 : Badges & Labels</h1>
        
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

        <div class="section-card">
            <h3 style="margin-top:0">Statuts de Réservation (Badges)</h3>
            <p style="font-size: 14px; opacity: 0.7; margin-bottom: 20px;">Utilisés pour indiquer l'état immédiat d'une entité.</p>
            
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                <span class="badge badge-success">Confirmé</span>
                <span class="badge badge-warning">En attente</span>
                <span class="badge badge-danger">Annulé</span>
                <span class="badge badge-info">Info</span>
                <span class="badge badge-neutral">Archivé</span>
            </div>
        </div>

        <div class="section-card">
            <h3 style="margin-top:0">Étiquettes de Catégorie (Labels)</h3>
            <p style="font-size: 14px; opacity: 0.7; margin-bottom: 20px;">Plus petits, souvent utilisés pour des tags ou catégories fixes.</p>
            
            <div style="display: flex; gap: 10px;">
                <span class="label label-primary">Nouveau</span>
                <span class="label label-secondary">LMNP</span>
                <span class="label label-secondary">Gîte</span>
            </div>
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