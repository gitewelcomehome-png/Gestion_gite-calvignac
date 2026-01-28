<!DOCTYPE html>
<html lang="fr" data-theme="dark" id="app-root" class="style-sidebar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 Test Migration Lot 08 - Alertes</title>
    
    <style>
        /* ==========================================================================
           VARIABLES & FONDATIONS
           ========================================================================== */
        :root {
            --upstay-cyan: #00C2CB;
        }

        :root[data-theme="light"] {
            --bg-primary: #f5f5f7;
            --bg-secondary: #ffffff;
            --text-primary: #1d1d1f;
            --border-color: rgba(0, 0, 0, 0.08);
        }

        :root[data-theme="dark"] {
            --bg-primary: #050506;
            --bg-secondary: #111113;
            --text-primary: #ffffff;
            --border-color: rgba(255, 255, 255, 0.1);
        }

        body {
            font-family: -apple-system, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            margin: 0; padding: 40px;
        }

        .container { max-width: 700px; margin: 0 auto; }

        /* ==========================================================================
           LOGIQUE ALERTES (LOT 08)
           ========================================================================== */
        
        .alert {
            padding: 16px 20px;
            border-left: 4px solid;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 16px;
            animation: alertSlideIn 0.3s ease;
            position: relative;
        }

        @keyframes alertSlideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
        }

        .alert-success { background: rgba(16, 185, 129, 0.1); border-left-color: #10b981; color: #10b981; }
        .alert-warning { background: rgba(251, 146, 60, 0.1); border-left-color: #fb923c; color: #fb923c; }
        .alert-danger  { background: rgba(239, 68, 68, 0.1);  border-left-color: #ef4444; color: #ef4444; }
        .alert-info    { background: rgba(59, 130, 246, 0.1);  border-left-color: #3b82f6; color: #3b82f6; }

        .alert-dismissible { padding-right: 48px; }
        .alert-close {
            position: absolute; right: 12px; top: 12px;
            background: transparent; border: none; font-size: 1.2rem;
            cursor: pointer; opacity: 0.6; color: currentColor;
        }
        .alert-close:hover { opacity: 1; }

        /* --- ADAPTATION APPLE --- */
        .style-apple .alert { border-radius: 14px; padding: 18px 24px; border-left-width: 0; border: 1px solid currentColor; }

        /* --- ADAPTATION SIDEBAR --- */
        .style-sidebar .alert { border-radius: 4px; border-left-width: 6px; background: var(--bg-secondary); }

        /* --- SWITCHERS --- */
        .controls { display: flex; gap: 10px; margin-bottom: 30px; background: #000; padding: 8px; border-radius: 12px; width: fit-content; }
        .ctrl-btn { background: #222; color: #fff; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; opacity: 0.6; }
        .ctrl-btn.active { background: var(--upstay-cyan); opacity: 1; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Migration Lot 08 : Alertes</h1>
        
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

        <div class="alert alert-success alert-dismissible">
            <span>✅ <strong>Succès :</strong> La synchronisation iCal est terminée.</span>
            <button class="alert-close" onclick="this.parentElement.remove()">×</button>
        </div>

        <div class="alert alert-warning">
            <span>⚠️ <strong>Attention :</strong> Votre abonnement expire dans 3 jours.</span>
        </div>

        <div class="alert alert-danger">
            <span>❌ <strong>Erreur :</strong> Impossible de joindre le serveur de base de données.</span>
        </div>

        <div class="alert alert-info">
            <span>ℹ️ <strong>Note :</strong> Une mise à jour système est prévue ce soir à 23h.</span>
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