<!DOCTYPE html>
<html lang="fr" data-theme="dark" id="app-root" class="style-sidebar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 Test Migration Lot 07 - Cartes</title>
    
    <style>
        /* ==========================================================================
           VARIABLES & FONDATIONS
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
            --border-color: rgba(0, 0, 0, 0.08);
            --shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        }

        :root[data-theme="dark"] {
            --bg-primary: #050506;
            --bg-secondary: #111113;
            --text-primary: #ffffff;
            --text-secondary: #94a3b8;
            --border-color: rgba(255, 255, 255, 0.1);
            --shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        }

        body {
            font-family: -apple-system, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            margin: 0; padding: 40px;
        }

        .container { max-width: 900px; margin: 0 auto; }

        /* ==========================================================================
           LOGIQUE CARTES (LOT 07)
           ========================================================================== */
        
        .card {
            background: var(--bg-secondary);
            border: 2px solid var(--border-color);
            border-radius: 12px;
            padding: 20px;
            transition: all 0.2s ease-in-out;
            margin-bottom: 20px;
        }

        .card-hover { cursor: pointer; }

        .card-hover:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow);
            border-color: var(--upstay-cyan);
        }

        .card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-bottom: 16px;
            margin-bottom: 16px;
            border-bottom: 2px solid var(--border-color);
        }

        .card-title { margin: 0; font-size: 1.2rem; font-weight: 700; }
        .card-text { color: var(--text-secondary); line-height: 1.6; }

        .card-footer {
            padding-top: 16px;
            margin-top: 16px;
            border-top: 2px solid var(--border-color);
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }

        /* --- ADAPTATION APPLE --- */
        .style-apple .card { border-radius: 20px; padding: 24px; border-width: 1px; }
        .style-apple .card-hover:hover {
            transform: translateY(-4px) scale(1.01);
        }

        /* --- ADAPTATION SIDEBAR --- */
        .style-sidebar .card { border-radius: 8px; border-left-width: 5px; }
        .style-sidebar .card-hover:hover {
            border-left-color: var(--upstay-cyan);
        }

        /* Boutique de styles (Switchers) */
        .controls { display: flex; gap: 10px; margin-bottom: 30px; background: #000; padding: 8px; border-radius: 12px; width: fit-content; }
        .ctrl-btn { background: #222; color: #fff; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; opacity: 0.6; }
        .ctrl-btn.active { background: var(--upstay-cyan); opacity: 1; }
        
        /* Helpers pour les boutons internes */
        .btn-sm { padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Migration Lot 07 : Cartes</h1>
        
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

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            
            <div class="card card-hover">
                <div class="card-header">
                    <span style="font-size: 24px;">🏠</span>
                    <h3 class="card-title">Gîte du Lot</h3>
                </div>
                <div class="card-body">
                    <p class="card-text">Vue d'ensemble des réservations pour cette propriété. Cliquez pour voir les détails.</p>
                </div>
                <div class="card-footer">
                    <button class="btn-sm">Modifier</button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span style="font-size: 24px;">📊</span>
                    <h3 class="card-title">Performance</h3>
                </div>
                <div class="card-body">
                    <p class="card-text">Taux d'occupation : <strong>85%</strong></p>
                    <p class="card-text">Revenu mensuel : <strong>2 450 €</strong></p>
                </div>
                <div class="card-footer">
                    <button class="btn-sm" style="background: var(--upstay-cyan); color: white; border: none;">Rapport complet</button>
                </div>
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