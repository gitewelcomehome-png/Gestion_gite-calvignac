#!/usr/bin/env python3
"""
Script de génération PDF du Business Plan
Convertit les 6 pages HTML en un seul PDF professionnel
"""

from weasyprint import HTML, CSS
from datetime import datetime
import os

# Configuration
OUTPUT_FILE = "Business_Plan_Channel_Manager_GdF.pdf"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Pages à inclure dans l'ordre
PAGES = [
    "index.html",
    "etude-marche.html",
    "analyse-concurrence.html",
    "business-model.html",
    "projections.html",
    "strategie.html"
]

# CSS pour l'impression PDF (optimisations)
PDF_CSS = """
@page {
    size: A4;
    margin: 2cm 1.5cm;
    @top-right {
        content: "Business Plan - Channel Manager";
        font-size: 9pt;
        color: #64748b;
    }
    @bottom-right {
        content: "Page " counter(page);
        font-size: 9pt;
        color: #64748b;
    }
}

/* Masquer la navigation pour le PDF */
.nav-header {
    display: none !important;
}

.nav-tabs {
    display: none !important;
}

.footer {
    display: none !important;
}

/* Optimisation des cartes pour l'impression */
.card {
    page-break-inside: avoid;
    margin-bottom: 15px;
}

.section {
    page-break-inside: avoid;
}

.table-container {
    page-break-inside: avoid;
}

/* Saut de page avant chaque hero */
.hero {
    page-break-before: always;
    margin-top: 0;
}

/* Première page sans saut */
body > .container > .hero:first-of-type {
    page-break-before: auto;
}

/* Optimiser les tableaux */
table {
    font-size: 9pt;
}

/* Meilleure lisibilité */
body {
    font-size: 10pt;
    line-height: 1.4;
}

h1 {
    font-size: 24pt;
}

h2 {
    font-size: 18pt;
}

h3 {
    font-size: 14pt;
}

/* Éviter les coupures de sections importantes */
.alert, .stats-grid, .chart-container {
    page-break-inside: avoid;
}
"""

def generate_pdf():
    """Génère le PDF complet du business plan"""
    
    print("🚀 Génération du Business Plan PDF...")
    print("=" * 60)
    
    # Créer le HTML combiné
    combined_html = """
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Business Plan - Channel Manager Gîtes de France</title>
        <link rel="stylesheet" href="style.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    </head>
    <body>
    """
    
    # Page de couverture personnalisée
    combined_html += """
    <div style="text-align: center; padding: 100px 50px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; border-radius: 20px; margin-bottom: 50px;">
        <h1 style="font-size: 48pt; margin-bottom: 30px;">📊 Business Plan</h1>
        <h2 style="font-size: 32pt; margin-bottom: 40px;">Channel Manager<br>Gîtes de France</h2>
        <p style="font-size: 18pt; margin-bottom: 20px;">Solution B2B SaaS Multi-Tenant</p>
        <p style="font-size: 14pt; opacity: 0.9;">Document Confidentiel</p>
        <hr style="width: 200px; margin: 40px auto; border-color: rgba(255,255,255,0.3);">
        <p style="font-size: 12pt;">Généré le """ + datetime.now().strftime("%d/%m/%Y à %H:%M") + """</p>
        <p style="font-size: 12pt; margin-top: 10px;">© 2026 - Gestion Gîte Calvignac</p>
    </div>
    """
    
    # Sommaire
    combined_html += """
    <div style="padding: 40px; background: #f8fafc; border-radius: 16px; margin-bottom: 50px; page-break-after: always;">
        <h2 style="font-size: 28pt; margin-bottom: 30px; color: #1e293b;">📋 Sommaire</h2>
        <div style="font-size: 14pt; line-height: 2.5;">
            <p><strong>1.</strong> Résumé Exécutif & Vue d'Ensemble</p>
            <p><strong>2.</strong> Étude de Marché Détaillée</p>
            <p><strong>3.</strong> Analyse Concurrentielle</p>
            <p><strong>4.</strong> Business Model & Monétisation</p>
            <p><strong>5.</strong> Projections Financières 2026-2028</p>
            <p><strong>6.</strong> Stratégie Commerciale & Déploiement</p>
        </div>
        
        <div style="margin-top: 50px; padding: 20px; background: white; border-left: 4px solid #2563eb; border-radius: 8px;">
            <h3 style="color: #2563eb; margin-bottom: 15px;">🎯 Chiffres Clés</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 11pt;">
                <div><strong>Marché adressable:</strong> 55 000 membres GdF</div>
                <div><strong>Prix public:</strong> 15€/mois</div>
                <div><strong>Prix B2B:</strong> 8€/mois</div>
                <div><strong>Marge brute:</strong> 66%</div>
                <div><strong>CA Année 3:</strong> 660 000€</div>
                <div><strong>Bénéfice An 3:</strong> 340 000€ (52%)</div>
                <div><strong>LTV/CAC:</strong> 26,5x</div>
                <div><strong>ROI:</strong> 18 mois</div>
            </div>
        </div>
    </div>
    """
    
    # Ajouter chaque page
    for i, page in enumerate(PAGES, 1):
        page_path = os.path.join(BASE_DIR, page)
        print(f"📄 Traitement de {page}... ({i}/{len(PAGES)})")
        
        if os.path.exists(page_path):
            with open(page_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Extraire le contenu entre <body> et </body>
                start = content.find('<div class="container">')
                end = content.find('</body>')
                
                if start != -1 and end != -1:
                    page_content = content[start:end]
                    combined_html += page_content
                else:
                    print(f"⚠️  Attention: structure HTML inattendue dans {page}")
        else:
            print(f"❌ Erreur: {page} introuvable")
    
    combined_html += """
    </body>
    </html>
    """
    
    # Créer le fichier HTML temporaire
    temp_html = os.path.join(BASE_DIR, "temp_combined.html")
    with open(temp_html, 'w', encoding='utf-8') as f:
        f.write(combined_html)
    
    print("\n📝 HTML combiné créé")
    print("🎨 Application du CSS...")
    
    # Générer le PDF
    output_path = os.path.join(BASE_DIR, OUTPUT_FILE)
    
    try:
        # Lire le CSS existant
        css_path = os.path.join(BASE_DIR, "style.css")
        with open(css_path, 'r', encoding='utf-8') as f:
            base_css = f.read()
        
        # Créer le PDF
        html = HTML(filename=temp_html)
        css_list = [
            CSS(string=base_css),
            CSS(string=PDF_CSS)
        ]
        
        print("🖨️  Génération du PDF en cours...")
        html.write_pdf(output_path, stylesheets=css_list)
        
        # Nettoyer le fichier temporaire
        os.remove(temp_html)
        
        # Obtenir la taille du fichier
        file_size = os.path.getsize(output_path) / (1024 * 1024)  # En Mo
        
        print("\n" + "=" * 60)
        print("✅ PDF généré avec succès!")
        print(f"📁 Fichier: {OUTPUT_FILE}")
        print(f"📊 Taille: {file_size:.2f} Mo")
        print(f"📍 Emplacement: {output_path}")
        print("=" * 60)
        
        return output_path
        
    except Exception as e:
        print(f"\n❌ Erreur lors de la génération: {str(e)}")
        if os.path.exists(temp_html):
            os.remove(temp_html)
        raise

if __name__ == "__main__":
    try:
        pdf_path = generate_pdf()
        print(f"\n🎉 Business Plan PDF prêt à être partagé!")
        print(f"💡 Commande pour ouvrir: xdg-open {pdf_path}")
    except Exception as e:
        print(f"\n💥 Échec de la génération: {str(e)}")
        exit(1)
