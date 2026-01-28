<!DOCTYPE html>
<html lang="fr" data-theme="dark" id="app-root" class="style-sidebar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 Test Migration Lot 06 - Modales</title>
    
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
            margin: 0; padding: 40px;
        }

        /* ==========================================================================
           LOGIQUE MODALES (LOT 06)
           ========================================================================== */
        
        .modal {
            display: none;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            z-index: 9999;
            align-items: center;
            justify-content: center;
        }

        .modal.active { display: flex; }

        .modal-content {
            background: var(--bg-secondary);
            max-width: 500px;
            width: 90%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            animation: modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            border: 1px solid var(--border-color);
        }

        @keyframes modalSlideIn {
            from { opacity: 0; transform: scale(0.9) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .modal-header {
            padding: 20px 24px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-header h2 { margin: 0; font-size: 1.25rem; }

        .modal-close {
            background: transparent; border: none;
            font-size: 24px; color: var(--text-secondary);
            cursor: pointer; width: 40px; height: 40px;
            display: flex; align-items: center; justify-content: center;
            transition: 0.2s;
        }

        .modal-body { padding: 24px; line-height: 1.6; }

        .modal-footer {
            padding: 16px 24px;
            background: rgba(0,0,0,0.02);
            border-top: 1px solid var(--border-color);
            display: flex; justify-content: flex-end; gap: 12px;
        }

        /* --- ADAPTATION APPLE --- */
        .style-apple .modal-content { border-radius: 24px; }
        .style-apple .modal-close { border-radius: 50%; }
        .style-apple .btn-main { border-radius: 50px; background: var(--upstay-gradient); color: white; border: none; padding: 10px 20px; cursor: pointer; font-weight: 600; }

        /* --- ADAPTATION SIDEBAR --- */
        .style-sidebar .modal-content { border-radius: 8px; border-left: 5px solid var(--upstay-cyan); }
        .style-sidebar .modal-close { border-radius: 4px; }
        .style-sidebar .btn-main { border-radius: 4px; background: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color); border-left: 3px solid var(--upstay-cyan); padding: 10px 20px; cursor: pointer; font-weight: 600; }

        /* --- SWITCHERS UI --- */
        .controls { display: flex; gap: 10px; margin-bottom: 30px; background: #000; padding: 8px; border-radius: 12px; width: fit-content; }
        .ctrl-btn { background: #222; color: #fff; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; opacity: 0.6; }
        .ctrl-btn.active { background: var(--upstay-cyan); opacity: 1; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Migration Lot 06 : Modales</h1>
        
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

        <button class="btn-main" onclick="openModal()">OUVRIR LA MODALE DE TEST</button>

        <div class="modal" id="testModal" onclick="if(event.target == this) closeModal()">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Configuration Gîte</h2>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <p>Souhaitez-vous valider les modifications apportées au calendrier de réservation pour le <strong>Gîte de Calvignac</strong> ?</p>
                    <div style="background: var(--btn-neutral); padding: 15px; border-radius: 8px; font-size: 14px; margin-top: 15px;">
                        ℹ️ Cette action est irréversible et synchronisera les données avec vos plateformes (Airbnb, Booking).
                    </div>
                </div>
                <div class="modal-footer">
                    <button style="background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); padding: 10px 20px; border-radius: 8px; cursor: pointer;" onclick="closeModal()">Annuler</button>
                    <button class="btn-main">Confirmer la sync</button>
                </div>
            </div>
        </div>
    </div>

    

    <script>
        function openModal() { document.getElementById('testModal').classList.add('active'); }
        function closeModal() { document.getElementById('testModal').classList.remove('active'); }

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