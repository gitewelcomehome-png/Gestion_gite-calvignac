<!DOCTYPE html>
<html lang="fr" data-theme="dark" id="app-root" class="style-sidebar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 Test Migration Lot 04 - Onglets</title>
    
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
            --border-color: rgba(0, 0, 0, 0.1);
            --btn-neutral: rgba(0, 0, 0, 0.04);
        }

        :root[data-theme="dark"] {
            --bg-primary: #050506;
            --bg-secondary: #111113;
            --text-primary: #ffffff;
            --text-secondary: #94a3b8;
            --border-color: rgba(255, 255, 255, 0.1);
            --btn-neutral: rgba(255, 255, 255, 0.06);
        }

        body {
            font-family: -apple-system, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            margin: 0;
            padding: 40px;
        }

        .container { max-width: 800px; margin: 0 auto; }

        /* ==========================================================================
           LOGIQUE ONGLETS (LOT 04)
           ========================================================================== */
        
        /* Conteneur des boutons d'onglets */
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            padding: 5px;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border-color);
        }

        .nav-tab {
            background: transparent;
            color: var(--text-secondary);
            border: none;
            padding: 12px 20px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        /* --- STYLE APPLE (Pilules) --- */
        .style-apple .tabs { border-bottom: none; }
        .style-apple .nav-tab {
            border-radius: 50px;
        }
        .style-apple .nav-tab.active {
            background: var(--upstay-gradient);
            color: white;
            box-shadow: 0 4px 12px rgba(0, 194, 203, 0.3);
            transform: scale(1.05);
        }

        /* --- STYLE SIDEBAR (Liseré) --- */
        .style-sidebar .nav-tab {
            border-radius: 4px;
            border-left: 3px solid transparent;
        }
        .style-sidebar .nav-tab.active {
            background: var(--btn-neutral);
            color: var(--upstay-cyan);
            border-left-color: var(--upstay-cyan);
        }

        /* Contenu des onglets */
        .tab-content {
            display: none;
            padding: 30px;
            background: var(--bg-secondary);
            border-radius: 16px;
            border: 1px solid var(--border-color);
            animation: tabFadeIn 0.4s ease;
        }

        .tab-content.active { display: block; }

        @keyframes tabFadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* --- SWITCHERS --- */
        .controls { display: flex; gap: 10px; margin-bottom: 30px; background: #000; padding: 8px; border-radius: 12px; width: fit-content; }
        .ctrl-btn { background: #222; color: #fff; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; opacity: 0.6; }
        .ctrl-btn.active { background: var(--upstay-cyan); opacity: 1; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Migration Lot 04 : Onglets</h1>
        
        <div style="display: flex; gap: 15px;">
            <div class="controls">
                <button class="ctrl-btn active" id="btn-sidebar" onclick="updateStyle('sidebar')">SIDEBAR</button>
                <button class="ctrl-btn" id="btn-apple" onclick="updateStyle('apple')">APPLE</button>
            </div>

            <div class="controls">
                <button class="ctrl-btn active" id="btn-dark" onclick="updateTheme('dark')">NUIT</button>
                <button class="ctrl-btn" id="btn-light" onclick="updateTheme('light')">JOUR</button>
            </div>
        </div>

        <div class="tabs">
            <button class="nav-tab active" onclick="switchTab(event, 'tab-general')">Vue Générale</button>
            <button class="nav-tab" onclick="switchTab(event, 'tab-reservations')">Réservations</button>
            <button class="nav-tab" onclick="switchTab(event, 'tab-fiscalite')">Fiscalité</button>
        </div>

        <div id="tab-general" class="tab-content active">
            <h3 style="margin-top:0">🏠 Vue Générale</h3>
            <p>Ici s'affichent les informations principales de vos gîtes.</p>
        </div>

        <div id="tab-reservations" class="tab-content">
            <h3 style="margin-top:0">📅 Réservations</h3>
            <p>Liste des séjours à venir et calendrier.</p>
        </div>

        <div id="tab-fiscalite" class="tab-content">
            <h3 style="margin-top:0">📊 Fiscalité</h3>
            <p>Rapports LMNP et calculs d'amortissements.</p>
        </div>
    </div>

    <script>
        // Logique de changement d'onglet
        function switchTab(event, tabId) {
            // Désactiver tous les onglets
            document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Activer l'onglet cliqué
            event.currentTarget.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        }

        // Changement de Style
        function updateStyle(style) {
            const root = document.getElementById('app-root');
            root.classList.remove('style-sidebar', 'style-apple');
            root.classList.add(`style-${style}`);
            
            document.getElementById('btn-sidebar').classList.toggle('active', style === 'sidebar');
            document.getElementById('btn-apple').classList.toggle('active', style === 'apple');
        }

        // Changement de Thème
        function updateTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            document.getElementById('btn-dark').classList.toggle('active', theme === 'dark');
            document.getElementById('btn-light').classList.toggle('active', theme === 'light');
        }
    </script>
</body>
</html>