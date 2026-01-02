// ================================================================
// MODULE FICHE CLIENT PERSONNALISÉE INTERACTI VE
// ================================================================
// Génère une page HTML complète envoyable au client
// Avec formulaire d'horaires et FAQ personnalisée

const supabase = window.supabase;
import { getFAQPourGite } from './faq.js';

/**
 * Génère la fiche client HTML complète personnalisée
 */
export async function genererFicheClientComplete(reservation) {
    // Charger toutes les données nécessaires
    const infosGite = loadInfosGites(reservation.gite);
    const faqGite = await getFAQPourGite(reservation.gite.toLowerCase());
    const prochainMenage = await getProchainMenage(reservation.gite, reservation.dateFin);
    
    // Calculer les horaires disponibles
    const horairesArrivee = calculerHorairesArrivee(prochainMenage);
    const horairesDepart = calculerHorairesDepart(reservation.dateFin, prochainMenage);
    
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue ${reservation.nom} - Gîte ${reservation.gite}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.95;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .section {
            margin-bottom: 40px;
            padding: 25px;
            border-radius: 15px;
            border-left: 5px solid #667eea;
        }
        
        .section-info { background: #f0f4ff; }
        .section-acces { background: #e8f5e9; border-left-color: #27AE60; }
        .section-horaires { background: #fff8e1; border-left-color: #f39c12; }
        .section-faq { background: #f3e5f5; border-left-color: #9c27b0; }
        
        .section h2 {
            font-size: 1.8rem;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .info-item {
            margin-bottom: 15px;
            font-size: 1.1rem;
        }
        
        .info-item strong {
            color: #333;
            display: inline-block;
            min-width: 120px;
        }
        
        .code-box {
            background: #27AE60;
            color: white;
            padding: 8px 20px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 1.4rem;
            display: inline-block;
            margin-left: 10px;
            letter-spacing: 2px;
        }
        
        .form-group {
            margin-bottom: 25px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
            font-size: 1.1rem;
        }
        
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
            font-family: inherit;
        }
        
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .btn-submit {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 40px;
            border: none;
            border-radius: 10px;
            font-size: 1.2rem;
            font-weight: 700;
            cursor: pointer;
            width: 100%;
            transition: transform 0.2s;
        }
        
        .btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
        
        .btn-submit:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .alert {
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .alert-info {
            background: #e3f2fd;
            color: #1976d2;
            border-left: 4px solid #1976d2;
        }
        
        .alert-warning {
            background: #fff3e0;
            color: #f57c00;
            border-left: 4px solid #f57c00;
        }
        
        .alert-success {
            background: #e8f5e9;
            color: #27AE60;
            border-left: 4px solid #27AE60;
        }
        
        .faq-item {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .faq-question {
            font-weight: 700;
            color: #333;
            margin-bottom: 10px;
            font-size: 1.1rem;
        }
        
        .faq-reponse {
            color: #555;
            line-height: 1.7;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 2px solid #e0e0e0;
            color: #666;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .container {
                box-shadow: none;
            }
            
            .section-horaires {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🏡 Bienvenue ${reservation.nom} !</h1>
            <p>Gîte ${reservation.gite}</p>
        </div>
        
        <div class="content">
            <!-- Informations du séjour -->
            <div class="section section-info">
                <h2>📅 Votre Séjour</h2>
                <div class="info-item"><strong>Arrivée :</strong> ${formatDateLong(reservation.date_debut)}</div>
                <div class="info-item"><strong>Départ :</strong> ${formatDateLong(reservation.date_fin)}</div>
                <div class="info-item"><strong>Durée :</strong> ${calculerNuits(reservation.date_debut, reservation.date_fin)} nuit(s)</div>
                ${infosGite.adresse ? `<div class="info-item"><strong>📍 Adresse :</strong> ${infosGite.adresse}</div>` : ''}
                ${infosGite.gpsLat && infosGite.gpsLon ? `
                <div class="info-item">
                    <strong>🗺️ GPS :</strong> 
                    <a href="https://www.google.com/maps?q=${infosGite.gpsLat},${infosGite.gpsLon}" target="_blank" style="color: #667eea; text-decoration: none;">
                        ${infosGite.gpsLat}, ${infosGite.gpsLon} (Ouvrir dans Maps)
                    </a>
                </div>` : ''}
            </div>
            
            <!-- Accès -->
            <div class="section section-acces">
                <h2>🔑 Accès au Gîte</h2>
                ${infosGite.code_cle ? `
                <div class="info-item">
                    <strong>Code boîte à clés :</strong>
                    <span class="code-box">${infosGite.code_cle}</span>
                </div>` : '<div class="alert alert-info">Le code d\'accès vous sera communiqué 48h avant votre arrivée.</div>'}
                
                ${infosGite.wifi ? `
                <div class="info-item">
                    <strong>📶 WiFi :</strong>
                    <span class="code-box" style="background: #667eea;">${infosGite.wifi}</span>
                </div>` : ''}
                
                ${infosGite.telephone ? `
                <div class="info-item">
                    <strong>📞 Urgence :</strong> ${infosGite.telephone}
                </div>` : ''}
                
                ${infosGite.instructions_arrivee ? `
                <div style="margin-top: 20px; background: white; padding: 20px; border-radius: 10px;">
                    <h3 style="margin-bottom: 15px;">✅ Instructions d'Arrivée</h3>
                    <div style="white-space: pre-wrap; line-height: 1.8;">${infosGite.instructions_arrivee}</div>
                </div>` : ''}
                
                ${infosGite.instructions_depart ? `
                <div style="margin-top: 20px; background: white; padding: 20px; border-radius: 10px;">
                    <h3 style="margin-bottom: 15px;">🚪 Instructions de Départ</h3>
                    <div style="white-space: pre-wrap; line-height: 1.8;">${infosGite.instructions_depart}</div>
                </div>` : ''}
            </div>
            
            <!-- Formulaire horaires -->
            <div class="section section-horaires">
                <h2>⏰ Vos Horaires de Séjour</h2>
                <div class="alert alert-info">
                    📝 Merci de renseigner vos horaires d'arrivée et de départ pour que nous puissions mieux vous accueillir.
                </div>
                
                ${horairesArrivee.bloqueAvant17h ? `
                <div class="alert alert-warning">
                    ⚠️ Arrivée possible à partir de <strong>17h minimum</strong> (ménage programmé l'après-midi).
                </div>` : ''}
                
                <form id="form-horaires" onsubmit="return soumettreHoraires(event)">
                    <input type="hidden" id="reservation_id" value="${reservation.id}">
                    
                    <div class="form-group">
                        <label for="heure_arrivee">🔑 Heure d'arrivée souhaitée</label>
                        <select id="heure_arrivee" required>
                            <option value="">-- Sélectionnez --</option>
                            ${genererOptionsHoraires(horairesArrivee.heures)}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="heure_depart">🚪 Heure de départ souhaitée</label>
                        <select id="heure_depart" required>
                            <option value="">-- Sélectionnez --</option>
                            ${genererOptionsHoraires(horairesDepart.heures)}
                        </select>
                        ${horairesDepart.dimancheJusque17h ? `
                        <small style="color: #27AE60;">✅ Dimanche : départ possible jusqu'à 17h</small>` : ''}
                    </div>
                    
                    <div class="form-group">
                        <label for="commentaires">💬 Commentaires (optionnel)</label>
                        <textarea id="commentaires" rows="3" placeholder="Informations complémentaires..."></textarea>
                    </div>
                    
                    <button type="submit" class="btn-submit" id="btn-submit">
                        📩 Envoyer mes horaires
                    </button>
                    
                    <div id="message-confirmation" style="display: none;" class="alert alert-success" style="margin-top: 20px;">
                        ✅ Merci ! Vos horaires ont été enregistrés.
                    </div>
                </form>
            </div>
            
            <!-- FAQ -->
            <div class="section section-faq">
                <h2>❓ Questions Fréquentes</h2>
                ${genererFAQHTML(faqGite)}
            </div>
            
            ${infosGite.restaurants ? `
            <div class="section" style="background: #fff5f7; border-left-color: #f5576c;">
                <h2>🍽️ Nos Restaurants Recommandés</h2>
                <div style="white-space: pre-wrap; line-height: 1.8;">${infosGite.restaurants}</div>
            </div>` : ''}
            
            ${infosGite.activites ? `
            <div class="section" style="background: #f0f9ff; border-left-color: #4facfe;">
                <h2>🎯 Activités à Proximité</h2>
                <div style="white-space: pre-wrap; line-height: 1.8;">${infosGite.activites}</div>
            </div>` : ''}
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <h3 style="margin-bottom: 15px;">Nous vous souhaitons un excellent séjour ! 🌟</h3>
            <p>Pour toute question, n'hésitez pas à nous contacter.</p>
            ${infosGite.email ? `<p style="margin-top: 10px;"><strong>Email :</strong> ${infosGite.email}</p>` : ''}
            ${infosGite.telephone ? `<p><strong>Téléphone :</strong> ${infosGite.telephone}</p>` : ''}
        </div>
    </div>
    
    <script>
        // URL de l'API Supabase (à remplacer par votre vraie URL)
        const SUPABASE_URL = '${getSupabaseConfig().url}';
        const SUPABASE_ANON_KEY = '${getSupabaseConfig().anonKey}';
        
        async function soumettreHoraires(event) {
            event.preventDefault();
            
            const btn = document.getElementById('btn-submit');
            btn.disabled = true;
            btn.textContent = '⏳ Envoi en cours...';
            
            const data = {
                reservation_id: document.getElementById('reservation_id').value,
                heure_arrivee: document.getElementById('heure_arrivee').value,
                heure_depart: document.getElementById('heure_depart').value,
                commentaires: document.getElementById('commentaires').value
            };
            
            try {
                const response = await fetch(\`\${SUPABASE_URL}/rest/v1/clients_preferences\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': \`Bearer \${SUPABASE_ANON_KEY}\`,
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    document.getElementById('form-horaires').style.display = 'none';
                    document.getElementById('message-confirmation').style.display = 'block';
                    
                    // Enregistrer la consultation
                    await fetch(\`\${SUPABASE_URL}/rest/v1/fiches_consultations\`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': \`Bearer \${SUPABASE_ANON_KEY}\`
                        },
                        body: JSON.stringify({
                            reservation_id: data.reservation_id,
                            user_agent: navigator.userAgent
                        })
                    });
                } else {
                    alert('Une erreur est survenue. Veuillez réessayer.');
                    btn.disabled = false;
                    btn.textContent = '📩 Envoyer mes horaires';
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert('Une erreur est survenue. Veuillez réessayer.');
                btn.disabled = false;
                btn.textContent = '📩 Envoyer mes horaires';
            }
            
            return false;
        }
    </script>
</body>
</html>
    `;
    
    return html;
}

/**
 * Calcule les horaires d'arrivée disponibles
 */
function calculerHorairesArrivee(prochainMenage) {
    const heures = [];
    const bloqueAvant17h = prochainMenage && prochainMenage.heure_debut && 
                           prochainMenage.heure_debut < '17:00:00';
    
    const heureMin = bloqueAvant17h ? 17 : 16;
    
    for (let h = heureMin; h <= 22; h++) {
        heures.push(`${h.toString().padStart(2, '0')}:00`);
        if (h < 22) {
            heures.push(`${h.toString().padStart(2, '0')}:30`);
        }
    }
    
    return { heures, bloqueAvant17h };
}

/**
 * Calcule les horaires de départ disponibles
 */
function calculerHorairesDepart(dateDepart, prochainMenage) {
    const heures = [];
    const jourSemaine = new Date(dateDepart).getDay();
    const estDimanche = jourSemaine === 0;
    const dimancheJusque17h = estDimanche && (!prochainMenage || !prochainMenage.heure_debut);
    
    const heureMax = dimancheJusque17h ? 17 : 12;
    
    for (let h = 8; h <= heureMax; h++) {
        heures.push(`${h.toString().padStart(2, '0')}:00`);
        if (h < heureMax) {
            heures.push(`${h.toString().padStart(2, '0')}:30`);
        }
    }
    
    return { heures, dimancheJusque17h };
}

/**
 * Récupère le prochain ménage après une date
 */
async function getProchainMenage(gite, dateApres) {
    const { data, error } = await supabase
        .from('planning_menage')
        .select('*')
        .eq('gite', gite)
        .gte('date', dateApres)
        .order('date', { ascending: true })
        .limit(1)
        .single();
    
    return data;
}

/**
 * Génère les options HTML pour les horaires
 */
function genererOptionsHoraires(heures) {
    return heures.map(h => `<option value="${h}">${h}</option>`).join('');
}

/**
 * Génère le HTML de la FAQ
 */
function genererFAQHTML(faqItems) {
    if (!faqItems || faqItems.length === 0) {
        return '<p>Aucune question fréquente disponible.</p>';
    }
    
    // Grouper par catégorie
    const parCategorie = {};
    faqItems.forEach(item => {
        if (!parCategorie[item.categorie]) {
            parCategorie[item.categorie] = [];
        }
        parCategorie[item.categorie].push(item);
    });
    
    let html = '';
    Object.entries(parCategorie).forEach(([categorie, items]) => {
        items.forEach(item => {
            html += `
                <div class="faq-item">
                    <div class="faq-question">❔ ${item.question}</div>
                    <div class="faq-reponse">${item.reponse}</div>
                </div>
            `;
        });
    });
    
    return html;
}

/**
 * Formate une date en français
 */
function formatDateLong(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Calcule le nombre de nuits
 */
function calculerNuits(debut, fin) {
    const d1 = new Date(debut);
    const d2 = new Date(fin);
    return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * Récupère la configuration Supabase
 */
function getSupabaseConfig() {
    return {
        url: window.SUPABASE_URL || '',
        anonKey: window.SUPABASE_ANON_KEY || ''
    };
}

/**
 * Charge les infos du gîte depuis localStorage
 */
function loadInfosGites(gite) {
    const allInfos = JSON.parse(localStorage.getItem('infosGites') || '{}');
    return allInfos[gite] || {};
}

// Export des fonctions
export {
    calculerHorairesArrivee,
    calculerHorairesDepart,
    genererFAQHTML
};
