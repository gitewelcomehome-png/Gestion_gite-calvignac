#!/usr/bin/env python3
"""
Script de génération PDF du Business Plan avec Playwright
Convertit les 6 pages HTML en un seul PDF professionnel
"""

from playwright.sync_api import sync_playwright
from datetime import datetime
import os
import time

# Configuration
OUTPUT_FILE = "Business_Plan_Channel_Manager_GdF.pdf"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Pages à inclure dans l'ordre
PAGES = [
    ("index.html", "Résumé Exécutif"),
    ("etude-marche.html", "Étude de Marché"),
    ("analyse-concurrence.html", "Analyse Concurrence"),
    ("business-model.html", "Business Model"),
    ("projections.html", "Projections Financières"),
    ("strategie.html", "Stratégie Commerciale")
]

def create_cover_page():
    """Crée une page de couverture HTML"""
    return f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
            body {{
                font-family: 'Inter', sans-serif;
                margin: 0;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            }}
            .cover {{
                text-align: center;
                color: white;
                padding: 60px;
            }}
            h1 {{
                font-size: 56px;
                margin-bottom: 30px;
                font-weight: 800;
            }}
            h2 {{
                font-size: 42px;
                margin-bottom: 50px;
                font-weight: 700;
                line-height: 1.3;
            }}
            .subtitle {{
                font-size: 24px;
                margin-bottom: 20px;
                opacity: 0.95;
            }}
            .confidential {{
                font-size: 18px;
                opacity: 0.9;
                margin-top: 40px;
                padding: 15px 30px;
                border: 2px solid rgba(255,255,255,0.5);
                display: inline-block;
                border-radius: 8px;
            }}
            .date {{
                font-size: 16px;
                margin-top: 60px;
                opacity: 0.8;
            }}
            .footer {{
                margin-top: 40px;
                font-size: 14px;
                opacity: 0.7;
            }}
        </style>
    </head>
    <body>
        <div class="cover">
            <h1>📊 Business Plan</h1>
            <h2>Channel Manager<br>Gîtes de France</h2>
            <div class="subtitle">Solution B2B SaaS Multi-Tenant</div>
            <div class="confidential">🔒 Document Confidentiel</div>
            <div class="date">Généré le {datetime.now().strftime("%d/%m/%Y à %H:%M")}</div>
            <div class="footer">© 2026 - Gestion Gîte Calvignac</div>
        </div>
    </body>
    </html>
    """

def generate_pdf():
    """Génère le PDF complet du business plan"""
    
    print("🚀 Génération du Business Plan PDF avec Playwright...")
    print("=" * 70)
    
    with sync_playwright() as p:
        # Lancer le navigateur
        print("🌐 Lancement du navigateur...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Configuration PDF
        pdf_options = {
            'path': os.path.join(BASE_DIR, OUTPUT_FILE),
            'format': 'A4',
            'print_background': True,
            'margin': {
                'top': '20mm',
                'right': '15mm',
                'bottom': '20mm',
                'left': '15mm'
            },
            'display_header_footer': True,
            'header_template': '<div style="font-size: 9px; color: #64748b; text-align: right; width: 100%; padding-right: 20px;">Business Plan - Channel Manager Gîtes de France</div>',
            'footer_template': '<div style="font-size: 9px; color: #64748b; text-align: center; width: 100%;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
        }
        
        # Préparer toutes les pages HTML
        html_pages = []
        
        # Page de couverture
        cover_path = os.path.join(BASE_DIR, "temp_cover.html")
        with open(cover_path, 'w', encoding='utf-8') as f:
            f.write(create_cover_page())
        html_pages.append(cover_path)
        print("📄 Page de couverture créée")
        
        # Pages du business plan
        for page_file, page_title in PAGES:
            page_path = os.path.join(BASE_DIR, page_file)
            if os.path.exists(page_path):
                html_pages.append(page_path)
                print(f"📄 {page_title} ajoutée")
            else:
                print(f"⚠️  {page_file} introuvable")
        
        print(f"\n🔗 Combinaison de {len(html_pages)} pages...")
        
        # Créer un HTML combiné
        combined_html = """
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <link rel="stylesheet" href="style.css">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
            <style>
                .page-break { page-break-after: always; }
                .nav-header, .nav-tabs, .footer { display: none !important; }
                .hero { page-break-before: always; margin-top: 0; }
                body > .container > .hero:first-of-type { page-break-before: auto; }
                .card, .section, .table-container, .alert, .stats-grid { page-break-inside: avoid; }
            </style>
        </head>
        <body>
        """
        
        # Ajouter page de couverture
        with open(cover_path, 'r', encoding='utf-8') as f:
            cover_content = f.read()
            # Extraire le body
            start = cover_content.find('<body>') + 6
            end = cover_content.find('</body>')
            if start != -1 and end != -1:
                combined_html += cover_content[start:end]
                combined_html += '<div class="page-break"></div>'
        
        # Ajouter les autres pages
        for i, (page_file, page_title) in enumerate(PAGES, 1):
            page_path = os.path.join(BASE_DIR, page_file)
            if os.path.exists(page_path):
                with open(page_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Extraire le contenu du container
                    start = content.find('<div class="container">')
                    end = content.find('</body>')
                    if start != -1 and end != -1:
                        combined_html += content[start:end]
        
        combined_html += """
        </body>
        </html>
        """
        
        # Sauvegarder le HTML combiné
        temp_combined = os.path.join(BASE_DIR, "temp_combined.html")
        with open(temp_combined, 'w', encoding='utf-8') as f:
            f.write(combined_html)
        
        print("📝 HTML combiné créé")
        print("🎨 Rendu et génération du PDF...")
        
        # Charger et convertir en PDF
        page.goto(f'file://{temp_combined}')
        page.wait_for_load_state('networkidle')
        time.sleep(2)  # Laisser le temps au CSS de se charger
        
        page.pdf(**pdf_options)
        
        # Nettoyer les fichiers temporaires
        os.remove(cover_path)
        os.remove(temp_combined)
        
        browser.close()
        
        # Obtenir la taille du fichier
        output_path = os.path.join(BASE_DIR, OUTPUT_FILE)
        file_size = os.path.getsize(output_path) / (1024 * 1024)  # En Mo
        
        print("\n" + "=" * 70)
        print("✅ PDF généré avec succès!")
        print(f"📁 Fichier: {OUTPUT_FILE}")
        print(f"📊 Taille: {file_size:.2f} Mo")
        print(f"📍 Emplacement: {output_path}")
        print("=" * 70)
        
        return output_path

if __name__ == "__main__":
    try:
        pdf_path = generate_pdf()
        print(f"\n🎉 Business Plan PDF prêt à être partagé!")
        print(f"💡 Vous pouvez le télécharger depuis VS Code ou l'ouvrir avec:")
        print(f"   xdg-open '{pdf_path}'")
    except Exception as e:
        print(f"\n💥 Erreur: {str(e)}")
        import traceback
        traceback.print_exc()
        exit(1)
