<!DOCTYPE html>
<html lang="fr" data-theme="dark" id="app-root" class="style-sidebar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 Test Migration Lot 03 - Formulaires (Nettoyé)</title>
    
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
            --text-secondary: #86868b;
            --border-color: rgba(0, 0, 0, 0.12);
            --input-bg: #ffffff;
        }

        :root[data-theme="dark"] {
            --bg-primary: #050506;
            --bg-secondary: #111113;
            --text-primary: #ffffff;
            --text-secondary: #94a3b8;
            --border-color: rgba(255, 255, 255, 0.15);
            --input-bg: #1a1a1c;
        }

        body {
            font-family: -apple-system, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            margin: 0;
            padding: 40px;
        }

        .container { max-width: 600px; margin: 0 auto; }
        .section-card { 
            background: var(--bg-secondary); 
            border: 1px solid var(--border-color); 
            border-radius: 16px; 
            padding: 30px; 
            margin-bottom: 30px; 
        }

        /* ==========================================================================
           LOGIQUE FORMULAIRES (LOT 03)
           ========================================================================== */
        
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; }

        input, select, textarea {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid var(--border-color);
            background: var(--input-bg);
            color: var(--text-primary);
            font-family: inherit;
            font-size: 14px;
            transition: all 0.2s;
            outline: none;
            box-sizing: border-box;
        }

        input:focus, select:focus, textarea:focus {
            border-color: var(--upstay-cyan);
            box-shadow: 0 0 0 3px rgba(0, 194, 203, 0.1);
        }

        /* --- ADAPTATION STYLE APPLE --- */
        .style-apple input, .style-apple select, .style-apple textarea {
            border-radius: 12px;
        }

        /* --- ADAPTATION STYLE SIDEBAR --- */
        .style-sidebar input, .style-sidebar select, .style-sidebar textarea {
            border-radius: 4px;
            border-left: 3px solid var(--border-color);
        }
        .style-sidebar input:focus { border-left-color: var(--upstay-cyan); }

        /* --- SWITCHERS --- */
        .controls { display: flex; gap: 10px; margin-bottom: 20px; background: #000; padding: 8px; border-radius: 12px; width: fit-content; }
        .ctrl-btn { background: #222; color: #fff; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; opacity: 0.6; }
        .ctrl-btn.active { background: var(--upstay-cyan); opacity: 1; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Migration Lot 03</h1>
        
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
            <div class="form-group">
                <label>Nom du Gîte</label>
                <input type="text" placeholder="Entrez du texte...">
            </div>

            <div class="form-group">
                <label>Type de bien</label>
                <select>
                    <option>Appartement</option>
                    <option>Maison</option>
                    <option>Gîte Pro</option>
                </select>
            </div>

            <div class="form-group">
                <label>Commentaires</label>
                <textarea rows="3" placeholder="Notes..."></textarea>
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