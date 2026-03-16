// ==========================================
// 📄 MODULE GESTION INFOS GÎTES & COMMUNICATION CLIENTS
// ==========================================
// Génération pages clients, envoi WhatsApp/SMS, gestion activités

// ==========================================
// 📱 GÉNÉRATION & ENVOI PAGE CLIENT
// ==========================================

async function loadInfosGites(gite) {
    // Charger depuis Supabase uniquement
    const { data, error } = await supabase
        .from('infos_gites')
        .select('*')
        .eq('gite', gite.toLowerCase())
        .maybeSingle();
    
    if (error || !data) {
        console.warn(`⚠️ Aucune info pour ${gite}`);
        return {
            wifi: '',
            codeCle: '',
            adresse: '',
            instructionsArrivee: '',
            instructionsDepart: '',
            infosComplementaires: ''
        };
    }
    
    // Transformer au format attendu par l'ancien système (compatibilité)
    return {
        wifi: data.wifi_password || '',
        codeCle: data.code_acces || '',
        adresse: data.adresse || '',
        instructionsArrivee: data.instructions_cles || '',
        instructionsDepart: data.checklist_depart || '',
        infosComplementaires: ''
    };
}

async function genererPageClient(reservationId) {
    const reservations = await getAllReservations();
    const reservation = reservations.find(r => r.id === reservationId);
    
    if (!reservation) {
        showToast('Réservation introuvable', 'error');
        return;
    }
    
    // Vérifier si le téléphone est renseigné
    if (!reservation.telephone || reservation.telephone.trim() === '') {
        if (confirm('⚠️ Aucun numéro de téléphone renseigné.\n\nVoulez-vous ajouter un téléphone maintenant ?')) {
            openEditModal(reservationId);
        }
        return;
    }
    
    // Créer un modal de choix personnalisé
    const choixModal = document.createElement('div');
    choixModal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    window.SecurityUtils.setInnerHTML(choixModal, `
        <div style="background: white; padding: 30px; border-radius: 20px; max-width: 550px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <h2 style="margin-bottom: 20px; color: #667eea;">📱 Envoyer les infos au client</h2>
            <p style="margin-bottom: 10px; font-size: 1.1rem;"><strong>${reservation.nom}</strong></p>
            <p style="margin-bottom: 25px; color: #666;">📱 ${reservation.telephone}</p>
            
            <div style="background: #E8F5E9; padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: left; font-size: 0.9rem;">
                <strong style="color: #25D366;">💡 Conseil WhatsApp Business :</strong><br>
                <span style="color: #555;">
                • Installez "WhatsApp Business" (app séparée)<br>
                • Utilisez votre numéro professionnel<br>
                • Gardez votre WhatsApp perso séparé
                </span>
            </div>
            
            <div style="display: grid; gap: 15px; margin-bottom: 20px;">
                <button onclick="aperçuFicheClient(${reservationId})" style="padding: 15px; border: none; border-radius: 12px; background: linear-gradient(135deg, #FF6B6B 0%, #EE5A52 100%); color: white; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 15px rgba(255,107,107,0.3);">
                    <svg style="width:24px;height:24px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> <span>Aperçu Fiche Client</span>
                </button>
                
                <button onclick="envoyerViaWhatsApp(${reservationId})" style="padding: 15px; border: none; border-radius: 12px; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 15px rgba(37,211,102,0.3);">
                    <svg style="width:24px;height:24px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> <span>WhatsApp Business</span>
                </button>
                
                <button onclick="envoyerViaSMS(${reservationId})" style="padding: 15px; border: none; border-radius: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 15px rgba(102,126,234,0.3);">
                    <svg style="width:24px;height:24px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> <span>SMS</span>
                </button>
                
                <button onclick="telechargerSeulementHTML(${reservationId})" style="padding: 12px; border: none; border-radius: 10px; background: #f0f0f0; color: #666; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <svg style="width:20px;height:20px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> <span>Télécharger HTML seulement</span>
                </button>
            </div>
            
            <button onclick="this.closest('div').parentElement.remove()" style="padding: 10px 20px; border: 1px solid #ddd; border-radius: 8px; background: white; color: #666; cursor: pointer; font-size: 0.95rem;">
                Annuler
            </button>
            
            <div style="margin-top: 20px; padding: 15px; background: #FFF3E0; border-radius: 10px; text-align: left; font-size: 0.85rem;">
                <strong style="color: #F57C00;">⚠️ Première utilisation :</strong><br>
                <span style="color: #666;">
                1. Téléchargez "WhatsApp Business" depuis Play Store/App Store<br>
                2. Configurez avec votre numéro professionnel des gîtes<br>
                3. Créez un profil avec nom et adresse<br>
                4. Cliquez sur "WhatsApp Business" ci-dessus
                </span>
            </div>
        </div>
    `);
    document.body.appendChild(choixModal);
}

async function envoyerViaWhatsApp(reservationId) {
    // Fermer le modal
    document.querySelectorAll('div[style*="z-index: 10000"]').forEach(el => el.remove());
    
    const reservations = await getAllReservations();
    const reservation = reservations.find(r => r.id === reservationId);
    const infosGite = await loadInfosGites(reservation.gite);
    
    // Nettoyer le numéro de téléphone pour WhatsApp
    let telephone = reservation.telephone.replace(/\s/g, '').replace(/\+/g, '');
    
    // Si commence par 0, remplacer par 33
    if (telephone.startsWith('0')) {
        telephone = '33' + telephone.substring(1);
    } else if (!telephone.startsWith('33')) {
        telephone = '33' + telephone;
    }
    
    // Construire le message
    let message = `Bonjour ${reservation.nom},\n\n`;
    message += `Bienvenue au Gîte de ${reservation.gite} ! 🏡\n\n`;
    message += `📅 *Votre séjour*\n`;
    message += `Arrivée: ${formatDate(reservation.dateDebut)}\n`;
    message += `Départ: ${formatDate(reservation.dateFin)}\n`;
    message += `Durée: ${reservation.nuits} nuit${reservation.nuits > 1 ? 's' : ''}\n\n`;
    
    if (infosGite.adresse) {
        message += `📍 *Adresse*\n${infosGite.adresse}\n\n`;
    }
    
    message += `🔑 *Accès au gîte*\n`;
    if (infosGite.codeCle) {
        message += `Code boîte à clés: *${infosGite.codeCle}*\n`;
    }
    if (infosGite.wifi) {
        message += `WiFi: *${infosGite.wifi}*\n`;
    }
    
    message += `\nNous vous souhaitons un excellent séjour ! 🌟`;
    
    // Ouvrir WhatsApp
    const whatsappLink = `https://wa.me/${telephone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
    
    // Marquer comme envoyé
    await updateReservation(reservationId, { messageEnvoye: true });
    await updateReservationsList();
    
    // Aussi télécharger la page HTML
    setTimeout(() => {
        telechargerPageHTML(reservation);
    }, 1000);
    
    showToast(`✓ WhatsApp ouvert pour ${reservation.nom}`);
}

async function envoyerViaSMS(reservationId) {
    // Fermer le modal
    document.querySelectorAll('div[style*="z-index: 10000"]').forEach(el => el.remove());
    
    const reservations = await getAllReservations();
    const reservation = reservations.find(r => r.id === reservationId);
    const infosGite = await loadInfosGites(reservation.gite);
    
    // Nettoyer le numéro de téléphone
    let telephone = reservation.telephone.replace(/\s/g, '');
    
    // Si le numéro ne commence pas par +, ajouter +33
    if (!telephone.startsWith('+')) {
        if (telephone.startsWith('0')) {
            telephone = '+33' + telephone.substring(1);
        } else if (!telephone.startsWith('33')) {
            telephone = '+33' + telephone;
        }
    }
    
    // Construire le message SMS
    let message = `Bonjour ${reservation.nom},\n\n`;
    message += `Bienvenue au Gîte de ${reservation.gite} !\n\n`;
    message += `📅 Séjour du ${formatDate(reservation.dateDebut)} au ${formatDate(reservation.dateFin)}\n\n`;
    
    if (infosGite.adresse) {
        message += `📍 ${infosGite.adresse}\n\n`;
    }
    
    if (infosGite.codeCle) {
        message += `🔑 Code: ${infosGite.codeCle}\n`;
    }
    
    if (infosGite.wifi) {
        message += `📶 WiFi: ${infosGite.wifi}\n`;
    }
    
    message += `\nBon séjour ! 🌟`;
    
    // Créer le lien SMS
    const smsLink = `sms:${telephone}?body=${encodeURIComponent(message)}`;
    window.location.href = smsLink;
    
    // Marquer comme envoyé
    await updateReservation(reservationId, { messageEnvoye: true });
    await updateReservationsList();
    
    // Aussi télécharger la page HTML
    setTimeout(() => {
        telechargerPageHTML(reservation);
    }, 500);
    
    showToast(`✓ SMS préparé pour ${reservation.nom}`);
}

async function telechargerSeulementHTML(reservationId) {
    // Fermer le modal
    document.querySelectorAll('div[style*="z-index: 10000"]').forEach(el => el.remove());
    
    // Utiliser la nouvelle fonction de génération complète
    await aperçuFicheClient(reservationId);
}

async function telechargerPageHTML(reservation) {
    const infosGite = await loadInfosGites(reservation.gite);
    
    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue ${reservation.nom} - Gîte ${reservation.gite}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Work+Sans:wght@300;400;600&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Work Sans', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            color: #2C3E50;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        h1 {
            font-family: 'Playfair Display', serif;
            color: #667eea;
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-align: center;
        }
        
        .subtitle {
            text-align: center;
            font-size: 1.2rem;
            color: #666;
            margin-bottom: 30px;
            font-weight: 300;
        }
        
        .info-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 10px;
        }
        
        .info-box h2 {
            color: #667eea;
            font-size: 1.5rem;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .info-item {
            margin: 10px 0;
            font-size: 1.1rem;
            line-height: 1.6;
        }
        
        .info-item strong {
            color: #2C3E50;
            display: inline-block;
            min-width: 150px;
        }
        
        .code {
            background: #667eea;
            color: white;
            padding: 5px 15px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1.3rem;
            display: inline-block;
            margin-left: 10px;
        }
        
        .section {
            margin: 30px 0;
        }
        
        ul {
            margin-left: 20px;
            margin-top: 10px;
        }
        
        li {
            margin: 8px 0;
            line-height: 1.6;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            color: #666;
        }
        
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
        }
    <\/style>
<\/head>
<body>
    <div class="container">
        <h1>🏡 Bienvenue ${reservation.nom} !</h1>
        <div class="subtitle">Gîte de ${reservation.gite}</div>
        
        <div class="info-box">
            <h2>📅 Votre Séjour</h2>
            <div class="info-item"><strong>Arrivée :</strong> ${formatDate(reservation.dateDebut)}</div>
            <div class="info-item"><strong>Départ :</strong> ${formatDate(reservation.dateFin)}</div>
            <div class="info-item"><strong>Durée :</strong> ${reservation.nuits} nuit${reservation.nuits > 1 ? 's' : ''}</div>
            ${infosGite.adresse ? `<div class="info-item"><strong>📍 Adresse :</strong> ${infosGite.adresse}</div>` : ''}
        </div>
        
        <div class="info-box">
            <h2>🔑 Accès au Gîte</h2>
            ${infosGite.codeCle ? `<div class="info-item"><strong>Code boîte à clés :</strong><span class="code">${infosGite.codeCle}</span></div>` : '<div class="info-item">Le code vous sera communiqué séparément.</div>'}
            ${infosGite.wifi ? `<div class="info-item"><strong>📶 WiFi :</strong><span class="code">${infosGite.wifi}</span></div>` : ''}
        </div>
        
        ${infosGite.instructionsArrivee ? `
        <div class="section">
            <h2 style="color: #27AE60; margin-bottom: 15px;">✅ Instructions d'Arrivée</h2>
            <div style="background: #f0f9f4; padding: 20px; border-radius: 10px; white-space: pre-wrap;">${infosGite.instructionsArrivee}</div>
        </div>
        ` : ''}
        
        ${infosGite.instructionsDepart ? `
        <div class="section">
            <h2 style="color: #E74C3C; margin-bottom: 15px;">🚪 Instructions de Départ</h2>
            <div style="background: #fef5f5; padding: 20px; border-radius: 10px; white-space: pre-wrap;">${infosGite.instructionsDepart}</div>
        </div>
        ` : ''}
        
        ${infosGite.infosComplementaires ? `
        <div class="section">
            <h2 style="color: #667eea; margin-bottom: 15px;">ℹ️ Informations Complémentaires</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; white-space: pre-wrap;">${infosGite.infosComplementaires}</div>
        </div>
        ` : ''}
        
        ${(() => {
            // Charger les activités selon le gîte
            const restaurants = JSON.parse(localStorage.getItem('restaurants') || '{}');
            const activites = JSON.parse(localStorage.getItem('activites') || '{}');
            const restaurantsGite = reservation.gite === 'Trévoux' ? restaurants.trevoux : restaurants.couzon;
            const activitesGite = reservation.gite === 'Trévoux' ? activites.trevoux : activites.couzon;
            const lyon = localStorage.getItem('activitesLyon') || '';
            const dombes = localStorage.getItem('activitesDombes') || '';
            const parcsZoo = localStorage.getItem('parcsZoo') || '';
            
            let sectionsHTML = '';
            
            // Restaurants
            if (restaurantsGite) {
                sectionsHTML += `
                <div class="section">
                    <h2 style="color: #f5576c; margin-bottom: 15px;">🍽️ Nos Restaurants Recommandés</h2>
                    <div style="background: #fff5f7; padding: 20px; border-radius: 10px; white-space: pre-wrap; line-height: 1.8;">${restaurantsGite}</div>
                </div>`;
            }
            
            // Activités locales
            if (activitesGite) {
                sectionsHTML += `
                <div class="section">
                    <h2 style="color: #4facfe; margin-bottom: 15px;">🎯 Activités à Proximité</h2>
                    <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; white-space: pre-wrap; line-height: 1.8;">${activitesGite}</div>
                </div>`;
            }
            
            // Lyon
            if (lyon) {
                sectionsHTML += `
                <div class="section">
                    <h2 style="color: #fa709a; margin-bottom: 15px;">🏛️ Découvrir Lyon (30-40 min)</h2>
                    <div style="background: #fff8f0; padding: 20px; border-radius: 10px; white-space: pre-wrap; line-height: 1.8;">${lyon}</div>
                </div>`;
            }
            
            // Dombes
            if (dombes) {
                sectionsHTML += `
                <div class="section">
                    <h2 style="color: #a8edea; margin-bottom: 15px;">🦆 Les Dombes (15-30 min)</h2>
                    <div style="background: #f0fffe; padding: 20px; border-radius: 10px; white-space: pre-wrap; line-height: 1.8;">${dombes}</div>
                </div>`;
            }
            
            // Parcs Zoo
            if (parcsZoo) {
                sectionsHTML += `
                <div class="section">
                    <h2 style="color: #fcb69f; margin-bottom: 15px;">🦁 Parcs Animaliers du Secteur</h2>
                    <div style="background: #fff8f0; padding: 20px; border-radius: 10px; white-space: pre-wrap; line-height: 1.8;">${parcsZoo}</div>
                </div>`;
            }
            
            return sectionsHTML;
        })()}
        
        <div class="footer">
            <p>Nous vous souhaitons un excellent séjour ! 🌟</p>
            <p style="margin-top: 10px; font-size: 0.9rem;">Pour toute question, n'hésitez pas à nous contacter.</p>
        </div>
    </div>
</body>
</html>`;
    
    // Télécharger le fichier HTML
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateToday = new Date().toISOString().split('T')[0];
    a.download = `Bienvenue_${reservation.nom.replace(/[^a-zA-Z0-9]/g, '_')}_${dateToday}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast(`✓ Page client générée pour ${reservation.nom}`);
}

// ==========================================
// 🎯 GESTION ACTIVITÉS & SORTIES
// ==========================================

function sauvegarderRestaurants() {
    const data = {
        trevoux: document.getElementById('restaurantsTrevoux').value,
        couzon: document.getElementById('restaurantsCouzon').value
    };
    localStorage.setItem('restaurants', JSON.stringify(data));
    showToast('✓ Restaurants sauvegardés');
}

function sauvegarderActivites() {
    const data = {
        trevoux: document.getElementById('activitesTrevoux').value,
        couzon: document.getElementById('activitesCouzon').value
    };
    localStorage.setItem('activites', JSON.stringify(data));
    showToast('✓ Activités sauvegardées');
}

function sauvegarderLyon() {
    localStorage.setItem('activitesLyon', document.getElementById('activitesLyon').value);
    showToast('✓ Activités Lyon sauvegardées');
}

function sauvegarderDombes() {
    localStorage.setItem('activitesDombes', document.getElementById('activitesDombes').value);
    showToast('✓ Activités Dombes sauvegardées');
}

function sauvegarderParcsZoo() {
    localStorage.setItem('parcsZoo', document.getElementById('parcsZoo').value);
    showToast('✓ Parcs Zoo sauvegardés');
}

function chargerActivitesEtSorties() {
    // Restaurants
    const restaurants = localStorage.getItem('restaurants');
    if (restaurants) {
        const data = JSON.parse(restaurants);
        if (document.getElementById('restaurantsTrevoux')) {
            document.getElementById('restaurantsTrevoux').value = data.trevoux || '';
        }
        if (document.getElementById('restaurantsCouzon')) {
            document.getElementById('restaurantsCouzon').value = data.couzon || '';
        }
    }
    
    // Activités
    const activites = localStorage.getItem('activites');
    if (activites) {
        const data = JSON.parse(activites);
        if (document.getElementById('activitesTrevoux')) {
            document.getElementById('activitesTrevoux').value = data.trevoux || '';
        }
        if (document.getElementById('activitesCouzon')) {
            document.getElementById('activitesCouzon').value = data.couzon || '';
        }
    }
    
    // Lyon
    const lyon = localStorage.getItem('activitesLyon');
    if (lyon && document.getElementById('activitesLyon')) {
        document.getElementById('activitesLyon').value = lyon;
    }
    
    // Dombes
    const dombes = localStorage.getItem('activitesDombes');
    if (dombes && document.getElementById('activitesDombes')) {
        document.getElementById('activitesDombes').value = dombes;
    }
    
    // Parcs Zoo
    const parcsZoo = localStorage.getItem('parcsZoo');
    if (parcsZoo && document.getElementById('parcsZoo')) {
        document.getElementById('parcsZoo').value = parcsZoo;
    }
}

function rechercherEvenements() {
    const resultatDiv = document.getElementById('evenementsResultat');
    if (!resultatDiv) return;
    
    window.SecurityUtils.setInnerHTML(resultatDiv, `
        <div style="padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; color: white; margin-top: 20px;">
            <h3 style="margin-bottom: 20px; font-size: 1.5rem;">🎭 Guide des Événements & Sorties</h3>
            
            <div style="background: white; color: #333; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h4 style="color: #667eea; margin-bottom: 15px;">🗓️ Calendrier Annuel</h4>
                
                <div style="margin-bottom: 15px;">
                    <strong>🌸 Printemps (Mars - Mai)</strong>
                    <ul style="margin-left: 20px; margin-top: 5px;">
                        <li>Fête médiévale de Pérouges (Pâques)</li>
                        <li>Brocantes et vide-greniers dans les villages</li>
                        <li>Marchés fermiers hebdomadaires</li>
                    </ul>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong>☀️ Été (Juin - Août)</strong>
                    <ul style="margin-left: 20px; margin-top: 5px;">
                        <li>Fête des Lumières à Lyon (8 décembre)</li>
                        <li>Concerts en plein air</li>
                        <li>Festivals de théâtre de rue</li>
                        <li>Marchés nocturnes</li>
                    </ul>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong>🍂 Automne (Sept - Nov)</strong>
                    <ul style="margin-left: 20px; margin-top: 5px;">
                        <li>Fête des vendanges</li>
                        <li>Journées du Patrimoine</li>
                        <li>Salons gastronomiques</li>
                    </ul>
                </div>
                
                <div>
                    <strong>❄️ Hiver (Déc - Fév)</strong>
                    <ul style="margin-left: 20px; margin-top: 5px;">
                        <li>Marchés de Noël (Trévoux, Lyon)</li>
                        <li>Patinoire éphémère à Lyon</li>
                        <li>Fête des Lumières de Lyon (8 décembre)</li>
                    </ul>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <a href="https://www.ain-tourisme.com/agenda/" target="_blank" style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; text-decoration: none; color: white; display: block; transition: 0.3s;">
                    <strong>🗓️ Agenda Ain Tourisme</strong><br>
                    <small>Tous les événements du département</small>
                </a>
                
                <a href="https://www.lyon.fr/agenda" target="_blank" style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; text-decoration: none; color: white; display: block;">
                    <strong>🎭 Agenda Lyon</strong><br>
                    <small>Événements culturels et festivités</small>
                </a>
                
                <a href="https://www.billetreduc.com/lyon.htm" target="_blank" style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; text-decoration: none; color: white; display: block;">
                    <strong>🎫 Billets spectacles</strong><br>
                    <small>Théâtre, concerts, one-man-show</small>
                </a>
                
                <a href="https://www.tripadvisor.fr/Attractions-g187265-Activities-Trevoux_Ain_Auvergne_Rhone_Alpes.html" target="_blank" style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; text-decoration: none; color: white; display: block;">
                    <strong>⭐ TripAdvisor Trévoux</strong><br>
                    <small>Activités et avis voyageurs</small>
                </a>
            </div>
            
            <p style="margin-top: 20px; font-size: 0.9rem; opacity: 0.9;">
                💡 <strong>Astuce :</strong> Les offices de tourisme de Trévoux et Lyon proposent des guides gratuits avec les événements du mois.
            </p>
        </div>
    `);
}

function clearAllData() {
    if (!confirm('⚠️ ATTENTION !\n\nVoulez-vous vraiment SUPPRIMER TOUTES LES DONNÉES ?\n\n✓ Ceci supprimera :\n- Toutes les réservations\n- Toutes les charges\n- Toutes les données historiques\n- Toutes les informations des gîtes\n- Tous les paramètres\n\n❌ Cette action est IRRÉVERSIBLE !\n\nCliquez sur OK pour confirmer la suppression totale.')) {
        return;
    }
    
    if (!confirm('🔴 DERNIÈRE CONFIRMATION\n\nVous êtes sur le point de tout effacer de manière définitive.\n\nÊtes-vous ABSOLUMENT SÛR ?')) {
        return;
    }
    
    // Supprimer tout le localStorage
    localStorage.clear();
    
    // Recharger la page
    window.location.reload();
}

// ==========================================
// 🎯 GESTION INFOS PRATIQUES (SUPABASE)
// ==========================================

async function translateInfosGiteTextToEnglish(text) {
    if (!text || text.trim() === '') return '';

    try {
        const attemptTranslation = async () => {
            const response = await Promise.race([
                fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=fr|en`),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Translation timeout')), 6000))
            ]);

            const data = await response.json();
            if (data.responseStatus === 200 && data.responseData?.translatedText) {
                return data.responseData.translatedText;
            }

            throw new Error(data.responseDetails || 'Translation unavailable');
        };

        let translated = await attemptTranslation();
        if (!translated || translated.trim() === '') {
            translated = await attemptTranslation();
        }

        return translated || text;
    } catch (error) {
        console.error('❌ Erreur traduction infos gîte:', error);
        return text;
    }
}

async function enrichInfosGiteFormDataWithAutoEnglish(formData) {
    if (!formData || typeof formData !== 'object') return formData;

    const data = { ...formData };
    const enKeys = Object.keys(data).filter((key) => key.endsWith('_en'));

    for (const enKey of enKeys) {
        const frKey = enKey.slice(0, -3);
        const frValue = data[frKey];
        const enValue = data[enKey];

        if (typeof frValue !== 'string' || frValue.trim() === '') continue;
        if (typeof enValue === 'string' && enValue.trim() !== '') continue;

        const translated = await translateInfosGiteTextToEnglish(frValue);
        data[enKey] = translated;

        const inputId = `infos_${enKey}`;
        const input = document.getElementById(inputId);
        if (input && typeof input.value === 'string' && input.value.trim() === '') {
            input.value = translated;
        }
    }

    return data;
}

async function saveInfosGiteToSupabase(giteName, formData) {
    try {
        const normalizedFormData = await enrichInfosGiteFormDataWithAutoEnglish(formData);

        const dataToSave = {
            gite: giteName.toLowerCase(),
            owner_user_id: (await window.supabaseClient.auth.getUser()).data.user?.id,
            // Section 1: Base
            adresse: normalizedFormData.adresse || null,
            telephone: normalizedFormData.telephone || null,
            gps_lat: normalizedFormData.gpsLat || null,
            gps_lon: normalizedFormData.gpsLon || null,
            email: normalizedFormData.email || null,
            adresse_en: normalizedFormData.adresse_en || null,
            telephone_en: normalizedFormData.telephone_en || null,
            email_en: normalizedFormData.email_en || null,
            // Section 2: WiFi
            wifi_ssid: normalizedFormData.wifiSSID || null,
            wifi_password: normalizedFormData.wifiPassword || null,
            wifi_debit: normalizedFormData.wifiDebit || null,
            wifi_localisation: normalizedFormData.wifiLocalisation || null,
            wifi_zones: normalizedFormData.wifiZones || null,
            wifi_ssid_en: normalizedFormData.wifiSSID_en || null,
            wifi_password_en: normalizedFormData.wifiPassword_en || null,
            wifi_debit_en: normalizedFormData.wifiDebit_en || null,
            wifi_localisation_en: normalizedFormData.wifiLocalisation_en || null,
            wifi_zones_en: normalizedFormData.wifiZones_en || null,
            // Section 3: Arrivée
            heure_arrivee: normalizedFormData.heureArrivee || null,
            arrivee_tardive: normalizedFormData.arriveeTardive || null,
            parking_dispo: normalizedFormData.parkingDispo || null,
            parking_places: normalizedFormData.parkingPlaces || null,
            parking_details: normalizedFormData.parkingDetails || null,
            type_acces: normalizedFormData.typeAcces || null,
            code_acces: normalizedFormData.codeAcces || null,
            instructions_cles: normalizedFormData.instructionsCles || null,
            etage: normalizedFormData.etage || null,
            ascenseur: normalizedFormData.ascenseur || null,
            itineraire_logement: normalizedFormData.itineraireLogement || null,
            premiere_visite: normalizedFormData.premiereVisite || null,
            heure_arrivee_en: normalizedFormData.heureArrivee_en || null,
            arrivee_tardive_en: normalizedFormData.arriveeTardive_en || null,
            parking_dispo_en: normalizedFormData.parkingDispo_en || null,
            parking_places_en: normalizedFormData.parkingPlaces_en || null,
            parking_details_en: normalizedFormData.parkingDetails_en || null,
            type_acces_en: normalizedFormData.typeAcces_en || null,
            code_acces_en: normalizedFormData.codeAcces_en || null,
            instructions_cles_en: normalizedFormData.instructionsCles_en || null,
            etage_en: normalizedFormData.etage_en || null,
            ascenseur_en: normalizedFormData.ascenseur_en || null,
            itineraire_logement_en: normalizedFormData.itineraireLogement_en || null,
            premiere_visite_en: normalizedFormData.premiereVisite_en || null,
            // Section 4: Logement
            type_chauffage: normalizedFormData.typeChauffage || null,
            climatisation: normalizedFormData.climatisation || null,
            instructions_chauffage: normalizedFormData.instructionsChauffage || null,
            equipements_cuisine: normalizedFormData.equipementsCuisine || null,
            instructions_four: normalizedFormData.instructionsFour || null,
            instructions_plaques: normalizedFormData.instructionsPlaques || null,
            instructions_lave_vaisselle: normalizedFormData.instructionsLaveVaisselle || null,
            instructions_lave_linge: normalizedFormData.instructionsLaveLinge || null,
            seche_linge: normalizedFormData.secheLinge || null,
            fer_repasser: normalizedFormData.ferRepasser || null,
            linge_fourni: normalizedFormData.lingeFourni || null,
            configuration_chambres: normalizedFormData.configurationChambres || null,
            type_chauffage_en: normalizedFormData.typeChauffage_en || null,
            climatisation_en: normalizedFormData.climatisation_en || null,
            instructions_chauffage_en: normalizedFormData.instructionsChauffage_en || null,
            equipements_cuisine_en: normalizedFormData.equipementsCuisine_en || null,
            instructions_four_en: normalizedFormData.instructionsFour_en || null,
            instructions_plaques_en: normalizedFormData.instructionsPlaques_en || null,
            instructions_lave_vaisselle_en: normalizedFormData.instructionsLaveVaisselle_en || null,
            instructions_lave_linge_en: normalizedFormData.instructionsLaveLinge_en || null,
            seche_linge_en: normalizedFormData.secheLinge_en || null,
            fer_repasser_en: normalizedFormData.ferRepasser_en || null,
            linge_fourni_en: normalizedFormData.lingeFourni_en || null,
            configuration_chambres_en: normalizedFormData.configurationChambres_en || null,
            // Section 5: Déchets
            instructions_tri: normalizedFormData.instructionsTri || null,
            jours_collecte: normalizedFormData.joursCollecte || null,
            decheterie: normalizedFormData.decheterie || null,
            instructions_tri_en: normalizedFormData.instructionsTri_en || null,
            jours_collecte_en: normalizedFormData.joursCollecte_en || null,
            decheterie_en: normalizedFormData.decheterie_en || null,
            // Section 6: Sécurité
            detecteur_fumee: normalizedFormData.detecteurFumee || null,
            extincteur: normalizedFormData.extincteur || null,
            coupure_eau: normalizedFormData.coupureEau || null,
            disjoncteur: normalizedFormData.disjoncteur || null,
            consignes_urgence: normalizedFormData.consignesUrgence || null,
            detecteur_fumee_en: normalizedFormData.detecteurFumee_en || null,
            extincteur_en: normalizedFormData.extincteur_en || null,
            coupure_eau_en: normalizedFormData.coupureEau_en || null,
            disjoncteur_en: normalizedFormData.disjoncteur_en || null,
            consignes_urgence_en: normalizedFormData.consignesUrgence_en || null,
            // Section 7: Départ
            heure_depart: normalizedFormData.heureDepart || null,
            depart_tardif: normalizedFormData.departTardif || null,
            checklist_depart: normalizedFormData.checklistDepart || null,
            restitution_cles: normalizedFormData.restitutionCles || null,
            heure_depart_en: normalizedFormData.heureDepart_en || null,
            depart_tardif_en: normalizedFormData.departTardif_en || null,
            checklist_depart_en: normalizedFormData.checklistDepart_en || null,
            restitution_cles_en: normalizedFormData.restitutionCles_en || null,
            // Section 8: Règlement
            tabac: normalizedFormData.tabac || null,
            animaux: normalizedFormData.animaux || null,
            nb_max_personnes: normalizedFormData.nbMaxPersonnes || null,
            caution: normalizedFormData.caution || null,
            tabac_en: normalizedFormData.tabac_en || null,
            animaux_en: normalizedFormData.animaux_en || null,
            nb_max_personnes_en: normalizedFormData.nbMaxPersonnes_en || null,
            caution_en: normalizedFormData.caution_en || null,
            date_modification: new Date().toISOString()
        };
        
        const { error } = await supabase
            .from('infos_gites')
            .upsert(dataToSave, { onConflict: 'gite' });
        
        if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('❌ Erreur sauvegarde Supabase infos gîte:', error);
        return false;
    }
}

async function loadInfosGiteFromSupabase(giteName) {
    try {
        const { data, error } = await supabase
            .from('infos_gites')
            .select('*')
            .eq('gite', giteName.toLowerCase())
            .maybeSingle(); // maybeSingle() au lieu de single() pour éviter erreur 406 si pas de données
        
        if (error) {
            console.error('❌ Erreur chargement infos_gites:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint,
                status: error.status
            });
            return null;
        }
        
        // Pas de données trouvées = OK
        if (!data) {
            // console.log(`ℹ️ Aucune donnée pour ${giteName} - Création à la première sauvegarde`);
            return null;
        }
        
        // Convertir de snake_case SQL vers camelCase JavaScript
        const formData = {
            adresse: data.adresse || '',
            telephone: data.telephone || '',
            gpsLat: data.gps_lat || '',
            gpsLon: data.gps_lon || '',
            email: data.email || '',
            adresse_en: data.adresse_en || '',
            telephone_en: data.telephone_en || '',
            email_en: data.email_en || '',
            wifiSSID: data.wifi_ssid || '',
            wifiPassword: data.wifi_password || '',
            wifiDebit: data.wifi_debit || '',
            wifiLocalisation: data.wifi_localisation || '',
            wifiZones: data.wifi_zones || '',
            wifiSSID_en: data.wifi_ssid_en || '',
            wifiPassword_en: data.wifi_password_en || '',
            wifiDebit_en: data.wifi_debit_en || '',
            wifiLocalisation_en: data.wifi_localisation_en || '',
            wifiZones_en: data.wifi_zones_en || '',
            heureArrivee: data.heure_arrivee || '',
            arriveeTardive: data.arrivee_tardive || '',
            parkingDispo: data.parking_dispo || '',
            parkingPlaces: data.parking_places || '',
            parkingDetails: data.parking_details || '',
            typeAcces: data.type_acces || '',
            codeAcces: data.code_acces || '',
            instructionsCles: data.instructions_cles || '',
            etage: data.etage || '',
            ascenseur: data.ascenseur || '',
            itineraireLogement: data.itineraire_logement || '',
            premiereVisite: data.premiere_visite || '',
            heureArrivee_en: data.heure_arrivee_en || '',
            arriveeTardive_en: data.arrivee_tardive_en || '',
            parkingDispo_en: data.parking_dispo_en || '',
            parkingPlaces_en: data.parking_places_en || '',
            parkingDetails_en: data.parking_details_en || '',
            typeAcces_en: data.type_acces_en || '',
            codeAcces_en: data.code_acces_en || '',
            instructionsCles_en: data.instructions_cles_en || '',
            etage_en: data.etage_en || '',
            ascenseur_en: data.ascenseur_en || '',
            itineraireLogement_en: data.itineraire_logement_en || '',
            premiereVisite_en: data.premiere_visite_en || '',
            typeChauffage: data.type_chauffage || '',
            climatisation: data.climatisation || '',
            instructionsChauffage: data.instructions_chauffage || '',
            equipementsCuisine: data.equipements_cuisine || '',
            instructionsFour: data.instructions_four || '',
            instructionsPlaques: data.instructions_plaques || '',
            instructionsLaveVaisselle: data.instructions_lave_vaisselle || '',
            instructionsLaveLinge: data.instructions_lave_linge || '',
            secheLinge: data.seche_linge || '',
            ferRepasser: data.fer_repasser || '',
            lingeFourni: data.linge_fourni || '',
            configurationChambres: data.configuration_chambres || '',
            typeChauffage_en: data.type_chauffage_en || '',
            climatisation_en: data.climatisation_en || '',
            instructionsChauffage_en: data.instructions_chauffage_en || '',
            equipementsCuisine_en: data.equipements_cuisine_en || '',
            instructionsFour_en: data.instructions_four_en || '',
            instructionsPlaques_en: data.instructions_plaques_en || '',
            instructionsLaveVaisselle_en: data.instructions_lave_vaisselle_en || '',
            instructionsLaveLinge_en: data.instructions_lave_linge_en || '',
            secheLinge_en: data.seche_linge_en || '',
            ferRepasser_en: data.fer_repasser_en || '',
            lingeFourni_en: data.linge_fourni_en || '',
            configurationChambres_en: data.configuration_chambres_en || '',
            instructionsTri: data.instructions_tri || '',
            joursCollecte: data.jours_collecte || '',
            decheterie: data.decheterie || '',
            instructionsTri_en: data.instructions_tri_en || '',
            joursCollecte_en: data.jours_collecte_en || '',
            decheterie_en: data.decheterie_en || '',
            detecteurFumee: data.detecteur_fumee || '',
            extincteur: data.extincteur || '',
            coupureEau: data.coupure_eau || '',
            disjoncteur: data.disjoncteur || '',
            consignesUrgence: data.consignes_urgence || '',
            detecteurFumee_en: data.detecteur_fumee_en || '',
            extincteur_en: data.extincteur_en || '',
            coupureEau_en: data.coupure_eau_en || '',
            disjoncteur_en: data.disjoncteur_en || '',
            consignesUrgence_en: data.consignes_urgence_en || '',
            heureDepart: data.heure_depart || '',
            departTardif: data.depart_tardif || '',
            checklistDepart: data.checklist_depart || '',
            restitutionCles: data.restitution_cles || '',
            heureDepart_en: data.heure_depart_en || '',
            departTardif_en: data.depart_tardif_en || '',
            checklistDepart_en: data.checklist_depart_en || '',
            restitutionCles_en: data.restitution_cles_en || '',
            tabac: data.tabac || '',
            animaux: data.animaux || '',
            nbMaxPersonnes: data.nb_max_personnes || '',
            caution: data.caution || '',
            tabac_en: data.tabac_en || '',
            animaux_en: data.animaux_en || '',
            nbMaxPersonnes_en: data.nb_max_personnes_en || '',
            caution_en: data.caution_en || '',
            dateModification: data.date_modification
        };
        
        return formData;
    } catch (error) {
        console.error('Erreur chargement Supabase:', error);
        showNotification('⚠️ Chargement depuis sauvegarde locale', 'info');
        return null;
    }
}

// ==========================================
// 🌐 EXPORTS GLOBAUX
// ==========================================

window.loadInfosGites = loadInfosGites;
window.genererPageClient = genererPageClient;
window.envoyerViaWhatsApp = envoyerViaWhatsApp;
window.envoyerViaSMS = envoyerViaSMS;
window.telechargerSeulementHTML = telechargerSeulementHTML;
window.telechargerPageHTML = telechargerPageHTML;
window.sauvegarderRestaurants = sauvegarderRestaurants;
window.sauvegarderActivites = sauvegarderActivites;
window.sauvegarderLyon = sauvegarderLyon;
window.sauvegarderDombes = sauvegarderDombes;
window.sauvegarderParcsZoo = sauvegarderParcsZoo;
window.chargerActivitesEtSorties = chargerActivitesEtSorties;
window.rechercherEvenements = rechercherEvenements;
window.clearAllData = clearAllData;
window.saveInfosGiteToSupabase = saveInfosGiteToSupabase;
window.loadInfosGiteFromSupabase = loadInfosGiteFromSupabase;

// ==========================================
// 🎯 GESTION INFOS PRATIQUES FORMULAIRE
// ==========================================

// Variable globale pour le gîte actuellement sélectionné
let currentGiteInfos = 'Trévoux';
let initialAddress = ''; // Adresse initiale chargée pour détecter les changements
const DB_KEY_INFOS = 'gites_infos_pratiques_complet';

function getDefaultAccessCodeConfig() {
    return {
        mode: localStorage.getItem('access_code_engine_default') || 'universel_auto',
        length: Math.min(10, Math.max(4, Number(localStorage.getItem('access_code_length_default') || 6))),
        charset: localStorage.getItem('access_code_charset_default') || 'numeric'
    };
}

function getGiteAccessCodeConfigStorageKey(giteName) {
    return `gite_access_code_config_v1_${String(giteName || '').toLowerCase()}`;
}

function getGiteAccessCodeConfig(giteName) {
    const defaults = getDefaultAccessCodeConfig();
    try {
        const raw = localStorage.getItem(getGiteAccessCodeConfigStorageKey(giteName));
        if (!raw) {
            return { mode: 'inherit', length: defaults.length, charset: defaults.charset };
        }

        const parsed = JSON.parse(raw);
        const normalizedMode = parsed.mode === 'igloo_api' ? 'systemes_connectes' : (parsed.mode || 'inherit');
        return {
            mode: normalizedMode,
            length: Math.min(10, Math.max(4, Number(parsed.length || defaults.length))),
            charset: parsed.charset === 'alnum' ? 'alnum' : 'numeric'
        };
    } catch (_error) {
        return { mode: 'inherit', length: defaults.length, charset: defaults.charset };
    }
}

function saveGiteAccessCodeConfig(giteName, config) {
    try {
        localStorage.setItem(
            getGiteAccessCodeConfigStorageKey(giteName),
            JSON.stringify({
                mode: config?.mode || 'inherit',
                length: Math.min(10, Math.max(4, Number(config?.length || 6))),
                charset: config?.charset === 'alnum' ? 'alnum' : 'numeric'
            })
        );
    } catch (_error) {
        // Non bloquant
    }
}

function normalizeAccessCodeMode(mode) {
    if (mode === 'igloo_api') return 'systemes_connectes';
    if (mode === 'systemes_connectes' || mode === 'universel_auto' || mode === 'manuel' || mode === 'inherit') {
        return mode;
    }
    return 'universel_auto';
}

function getEffectiveAccessCodeConfig(giteName) {
    const defaults = getDefaultAccessCodeConfig();
    const perGite = getGiteAccessCodeConfig(giteName);
    return {
        mode: perGite.mode === 'inherit'
            ? normalizeAccessCodeMode(defaults.mode)
            : normalizeAccessCodeMode(perGite.mode),
        length: perGite.length || defaults.length,
        charset: perGite.charset || defaults.charset
    };
}

function buildGeneratedAccessCode({ length = 6, charset = 'numeric' } = {}) {
    const safeLength = Math.min(10, Math.max(4, Number(length) || 6));
    const numericChars = '0123456789';
    const alphaNumChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const chars = charset === 'alnum' ? alphaNumChars : numericChars;

    let result = '';
    for (let i = 0; i < safeLength; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

async function tryGenerateAccessCodeViaConnectedSystems(giteName, config) {
    try {
        const response = await fetch('/api/lock-generate-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: 'auto',
                providers: 'all_connected',
                strategy: 'all_connected_lockboxes',
                gite: giteName,
                length: config.length,
                charset: config.charset
            })
        });

        if (!response.ok) {
            return null;
        }

        const payload = await response.json();
        return payload?.code ? String(payload.code) : null;
    } catch (_error) {
        return null;
    }
}

function applyGiteAccessCodeConfigToUI(giteName) {
    const config = getGiteAccessCodeConfig(giteName);
    const modeEl = document.getElementById('infos_codeGenerationMode');
    const lengthEl = document.getElementById('infos_codeLength');

    if (modeEl) modeEl.value = config.mode || 'inherit';
    if (lengthEl) lengthEl.value = String(config.length || 6);
}

window.syncGiteAccessCodeConfigUI = function() {
    const modeEl = document.getElementById('infos_codeGenerationMode');
    const lengthEl = document.getElementById('infos_codeLength');

    saveGiteAccessCodeConfig(currentGiteInfos, {
        mode: normalizeAccessCodeMode(modeEl?.value || 'inherit'),
        length: Number(lengthEl?.value || 6),
        charset: getDefaultAccessCodeConfig().charset
    });
};

window.generateAccessCodeForCurrentGite = async function() {
    const effectiveConfig = getEffectiveAccessCodeConfig(currentGiteInfos);
    let generatedCode = null;

    if (effectiveConfig.mode === 'systemes_connectes') {
        generatedCode = await tryGenerateAccessCodeViaConnectedSystems(currentGiteInfos, effectiveConfig);
    }

    if (!generatedCode && effectiveConfig.mode !== 'manuel') {
        generatedCode = buildGeneratedAccessCode(effectiveConfig);
    }

    if (!generatedCode) {
        if (typeof showNotification === 'function') {
            showNotification('ℹ️ Mode manuel actif : saisissez le code d\'accès.', 'info');
        }
        return;
    }

    const codeInput = document.getElementById('infos_codeAcces');
    if (codeInput) {
        codeInput.value = generatedCode;
    }

    const typeAccesInput = document.getElementById('infos_typeAcces');
    if (typeAccesInput && !typeAccesInput.value) {
        typeAccesInput.value = 'Boîte à clés';
    }

    const instructionsInput = document.getElementById('infos_instructionsCles');
    if (instructionsInput && !String(instructionsInput.value || '').trim()) {
        instructionsInput.value = `Code d'accès: ${generatedCode}\nMerci de refermer la boîte à clés après utilisation.`;
    }

    await sauvegarderDonneesInfos();

    if (typeof showNotification === 'function') {
        const message = effectiveConfig.mode === 'systemes_connectes'
            ? '✓ Code généré (systèmes connectés ou fallback universel) et sauvegardé'
            : '✓ Code généré et sauvegardé';
        showNotification(message, 'success');
    }
};

// ==========================================
// 🎨 APPLICATION COULEUR GÎTE AUX CARDS
// ==========================================
function applyGiteColorToCards(color) {
    // La couleur est déjà appliquée via les variables CSS --gite-color et --gite-bg
    // Cette fonction est conservée pour compatibilité mais ne fait plus rien
    // Le CSS gère maintenant tout l'affichage via les variables CSS
}

// ==========================================
// 🏠 GÉNÉRATION DYNAMIQUE DES BOUTONS GÎTES
// ==========================================
async function generateGitesButtons() {
    const select = document.getElementById('giteSelector');
    if (!select) {
        // Le select n'existe pas encore, c'est normal si le tab n'est pas encore chargé
        return;
    }

    try {
        // Récupérer les gîtes VISIBLES selon l'abonnement
        let gites = [];
        if (window.gitesManager) {
            gites = await window.gitesManager.getVisibleGites();
        } else {
            // Fallback: charger directement depuis Supabase
            const { data, error } = await supabase
                .from('gites')
                .select('id, name')
                .order('name');
            
            if (error) throw error;
            gites = data || [];
        }

        if (gites.length === 0) {
            return;
        }

        // Vider le select (garder juste l'option par défaut)
        select.innerHTML = '<option value="">🏡 Choisir un gîte...</option>';

        // Générer une option pour chaque gîte
        const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#feca57', '#48dbfb', '#ff6b6b'];
        
        gites.forEach((gite, index) => {
            const option = document.createElement('option');
            const giteColor = gite.color || colors[index % colors.length];
            
            option.value = gite.name;
            option.textContent = `🏡 ${gite.name}`;
            option.dataset.color = giteColor;
            
            // Sélectionner le premier par défaut
            if (index === 0) {
                option.selected = true;
                currentGiteInfos = gite.name;
            }
            
            select.appendChild(option);
        });

        // console.log(`✅ ${gites.length} gîtes ajoutés à la liste déroulante`);
        
        // Appliquer la couleur du premier gîte à la section englobante via CSS variables
        const firstGiteColor = gites[0]?.color || colors[0];
        
        // Extraire RGB de la couleur hex pour créer une version transparente
        const r = parseInt(firstGiteColor.slice(1,3), 16);
        const g = parseInt(firstGiteColor.slice(3,5), 16);
        const b = parseInt(firstGiteColor.slice(5,7), 16);
        
        // Définir les variables CSS sur le document root
        document.documentElement.style.setProperty('--gite-color', firstGiteColor);
        document.documentElement.style.setProperty('--gite-bg', `rgba(${r}, ${g}, ${b}, 0.1)`);
        
        // Mettre à jour le texte de l'indicateur
        const indicateur = document.getElementById('gite-indicator');
        if (indicateur) {
            const indicatorDiv = indicateur.querySelector('div');
            if (indicatorDiv) {
                indicatorDiv.textContent = `🏡 GÎTE SÉLECTIONNÉ : ${gites[0].name.toUpperCase()}`;
            }
        }
        
        // Appliquer le style aux cards du formulaire
        applyGiteColorToCards(firstGiteColor);
        
        // Nettoyer tous les styles inline des cards pour laisser le CSS gérer
        setTimeout(() => {
            const formCards = document.querySelectorAll('#gite-content-wrapper .infos-card');
            // console.log(`🧹 Nettoyage de ${formCards.length} infos-cards`);
            formCards.forEach((card, idx) => {
                const oldStyle = card.getAttribute('style');
                if (oldStyle) {
                    // console.log(`  Card ${idx}: avait style="${oldStyle}"`);
                }
                card.removeAttribute('style');
            });
            const cardHeaders = document.querySelectorAll('#gite-content-wrapper .infos-card-header');
            // console.log(`🧹 Nettoyage de ${cardHeaders.length} headers`);
            cardHeaders.forEach((header, idx) => {
                const oldStyle = header.getAttribute('style');
                if (oldStyle) {
                    // console.log(`  Header ${idx}: avait style="${oldStyle}"`);
                }
                header.removeAttribute('style');
            });
            // console.log('✅ Nettoyage terminé - CSS prend le contrôle');
        }, 100);
        
        // Charger les données du premier gîte
        await chargerDonneesInfos();
        
        // Charger les photos du premier gîte
        if (typeof window.loadExistingPhotos === 'function' && currentGiteInfos) {
            await window.loadExistingPhotos(currentGiteInfos);
        }
        
        // Attacher les listeners après le chargement initial
        setTimeout(() => {
            captureFormState();
            attachChangeListeners();
            attachAutoTranslation(); // Activer la traduction auto
            // console.log('✅ Système de détection de modifications activé');
        }, 300);
        
    } catch (error) {
        console.error('❌ Erreur génération liste gîtes:', error);
        select.innerHTML = '<option value="">❌ Erreur chargement</option>';
    }
}

// Exposer la fonction pour être appelée quand le tab est activé
window.generateGitesButtons = generateGitesButtons;

// Sélection du gîte depuis la liste déroulante
window.selectGiteFromDropdown = async function(giteName) {
    if (!giteName) return; // Option par défaut sélectionnée
    
    const select = document.getElementById('giteSelector');
    const selectedOption = select?.options[select.selectedIndex];
    const giteColor = selectedOption?.dataset.color || '#667eea';
    
    // Vérifier si des modifications non sauvegardées existent
    if (window.isDirty && currentGiteInfos && currentGiteInfos !== giteName) {
        const confirmer = confirm(`⚠️ Vous avez des modifications non sauvegardées pour "${currentGiteInfos}".\n\nVoulez-vous les sauvegarder avant de changer de gîte ?`);
        if (confirmer) {
            await sauvegarderDonneesInfos();
            if (typeof showNotification === 'function') {
                showNotification('✓ Modifications sauvegardées', 'success');
            }
        }
        // Réinitialiser le flag
        window.isDirty = false;
    }
    
    // console.log(`🏠 Changement de gîte : ${currentGiteInfos} → ${giteName} (langue: ${currentLangInfos})`);
    
    // Changer le gîte
    currentGiteInfos = giteName;
    
    // Extraire RGB de la couleur hex pour créer une version transparente
    const r = parseInt(giteColor.slice(1,3), 16);
    const g = parseInt(giteColor.slice(3,5), 16);
    const b = parseInt(giteColor.slice(5,7), 16);
    
    // Définir les variables CSS sur le document root
    document.documentElement.style.setProperty('--gite-color', giteColor);
    document.documentElement.style.setProperty('--gite-bg', `rgba(${r}, ${g}, ${b}, 0.1)`);
    
    // Mettre à jour le texte de l'indicateur
    const indicateur = document.getElementById('gite-indicator');
    if (indicateur) {
        const indicatorDiv = indicateur.querySelector('div');
        if (indicatorDiv) {
            indicatorDiv.textContent = `🏡 GÎTE SÉLECTIONNÉ : ${giteName.toUpperCase()}`;
        }
    }
    
    // Appliquer le style aux cards du formulaire
    applyGiteColorToCards(giteColor);
    
    // Nettoyer tous les styles inline des cards pour laisser le CSS gérer
    setTimeout(() => {
        const formCards = document.querySelectorAll('#gite-content-wrapper .infos-card');
        // console.log(`🧹 Nettoyage de ${formCards.length} infos-cards`);
        formCards.forEach((card, idx) => {
            const oldStyle = card.getAttribute('style');
            if (oldStyle) {
                // console.log(`  Card ${idx}: avait style="${oldStyle}"`);
            }
            card.removeAttribute('style');
        });
        const cardHeaders = document.querySelectorAll('#gite-content-wrapper .infos-card-header');
        // console.log(`🧹 Nettoyage de ${cardHeaders.length} headers`);
        cardHeaders.forEach((header, idx) => {
            const oldStyle = header.getAttribute('style');
            if (oldStyle) {
                // console.log(`  Header ${idx}: avait style="${oldStyle}"`);
            }
            header.removeAttribute('style');
        });
        // console.log('✅ Nettoyage terminé - CSS prend le contrôle');
    }, 100);
    
    // Charger les données du nouveau gîte (préserve la langue active)
    await chargerDonneesInfos();
    applyGiteAccessCodeConfigToUI(giteName);
    
    // Charger les photos du gîte
    if (typeof window.loadExistingPhotos === 'function') {
        await window.loadExistingPhotos(giteName);
    }
    
    // Capturer l'état initial après chargement
    setTimeout(() => {
        initialAddress = document.getElementById('infos_adresse')?.value || '';
        captureFormState();
        attachChangeListeners();
    }, 200);
};

// Sélection du gîte (ancienne fonction avec boutons - conservée pour compatibilité)
window.selectGiteInfos = async function(gite) {
    // Rediriger vers la nouvelle fonction dropdown
    const select = document.getElementById('giteSelector');
    if (select) {
        // Sélectionner la bonne option dans le dropdown
        const options = select.options;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === gite) {
                select.selectedIndex = i;
                break;
            }
        }
        await selectGiteFromDropdown(gite);
    }
};

async function sauvegarderDonneesInfos() {
    // Validation des champs critiques si ValidationUtils disponible
    if (window.ValidationUtils) {
        const emailField = document.getElementById('infos_email');
        const telephoneField = document.getElementById('infos_telephone');
        const gpsLatField = document.getElementById('infos_gpsLat');
        const gpsLonField = document.getElementById('infos_gpsLon');
        
        // Valider email si rempli
        if (emailField?.value && !window.ValidationUtils.validateValue(emailField.value, 'email').valid) {
            console.warn('⚠️ Email invalide, sauvegarde annulée');
            if (typeof showNotification === 'function') {
                showNotification('❌ Email invalide', 'error');
            }
            return;
        }
        
        // Valider téléphone si rempli
        if (telephoneField?.value && !window.ValidationUtils.validateValue(telephoneField.value, 'phone').valid) {
            console.warn('⚠️ Téléphone invalide, sauvegarde annulée');
            if (typeof showNotification === 'function') {
                showNotification('❌ Téléphone invalide (format: 06 12 34 56 78)', 'error');
            }
            return;
        }
        
        // Valider coordonnées GPS si remplies
        if (gpsLatField?.value || gpsLonField?.value) {
            const lat = parseFloat(gpsLatField?.value);
            const lon = parseFloat(gpsLonField?.value);
            if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lon) || lon < -180 || lon > 180) {
                console.warn('⚠️ Coordonnées GPS invalides, sauvegarde annulée');
                if (typeof showNotification === 'function') {
                    showNotification('❌ Coordonnées GPS invalides', 'error');
                }
                return;
            }
        }
    }
    
    const formData = {
        // Section 1: Base (FR)
        adresse: document.getElementById('infos_adresse')?.value || '',
        telephone: document.getElementById('infos_telephone')?.value || '',
        gpsLat: document.getElementById('infos_gpsLat')?.value || '',
        gpsLon: document.getElementById('infos_gpsLon')?.value || '',
        email: document.getElementById('infos_email')?.value || '',
        // Section 1: Base (EN)
        adresse_en: document.getElementById('infos_adresse_en')?.value || '',
        telephone_en: document.getElementById('infos_telephone_en')?.value || '',
        email_en: document.getElementById('infos_email_en')?.value || '',
        
        // Section 2: WiFi (FR)
        wifiSSID: document.getElementById('infos_wifiSSID')?.value || '',
        wifiPassword: document.getElementById('infos_wifiPassword')?.value || '',
        wifiDebit: document.getElementById('infos_wifiDebit')?.value || '',
        wifiLocalisation: document.getElementById('infos_wifiLocalisation')?.value || '',
        wifiZones: document.getElementById('infos_wifiZones')?.value || '',
        // Section 2: WiFi (EN)
        wifiSSID_en: document.getElementById('infos_wifiSSID_en')?.value || '',
        wifiPassword_en: document.getElementById('infos_wifiPassword_en')?.value || '',
        wifiDebit_en: document.getElementById('infos_wifiDebit_en')?.value || '',
        wifiLocalisation_en: document.getElementById('infos_wifiLocalisation_en')?.value || '',
        wifiZones_en: document.getElementById('infos_wifiZones_en')?.value || '',
        
        // Section 3: Arrivée (FR)
        heureArrivee: document.getElementById('infos_heureArrivee')?.value || '',
        arriveeTardive: document.getElementById('infos_arriveeTardive')?.value || '',
        parkingDispo: document.getElementById('infos_parkingDispo')?.value || '',
        parkingPlaces: document.getElementById('infos_parkingPlaces')?.value || '',
        parkingDetails: document.getElementById('infos_parkingDetails')?.value || '',
        typeAcces: document.getElementById('infos_typeAcces')?.value || '',
        codeAcces: document.getElementById('infos_codeAcces')?.value || '',
        instructionsCles: document.getElementById('infos_instructionsCles')?.value || '',
        etage: document.getElementById('infos_etage')?.value || '',
        ascenseur: document.getElementById('infos_ascenseur')?.value || '',
        itineraireLogement: document.getElementById('infos_itineraireLogement')?.value || '',
        premiereVisite: document.getElementById('infos_premiereVisite')?.value || '',
        // Section 3: Arrivée (EN)
        heureArrivee_en: document.getElementById('infos_heureArrivee_en')?.value || '',
        arriveeTardive_en: document.getElementById('infos_arriveeTardive_en')?.value || '',
        parkingDispo_en: document.getElementById('infos_parkingDispo_en')?.value || '',
        parkingPlaces_en: document.getElementById('infos_parkingPlaces_en')?.value || '',
        parkingDetails_en: document.getElementById('infos_parkingDetails_en')?.value || '',
        typeAcces_en: document.getElementById('infos_typeAcces_en')?.value || '',
        codeAcces_en: document.getElementById('infos_codeAcces_en')?.value || '',
        instructionsCles_en: document.getElementById('infos_instructionsCles_en')?.value || '',
        etage_en: document.getElementById('infos_etage_en')?.value || '',
        ascenseur_en: document.getElementById('infos_ascenseur_en')?.value || '',
        itineraireLogement_en: document.getElementById('infos_itineraireLogement_en')?.value || '',
        premiereVisite_en: document.getElementById('infos_premiereVisite_en')?.value || '',
        
        // Section 4: Logement (FR)
        typeChauffage: document.getElementById('infos_typeChauffage')?.value || '',
        climatisation: document.getElementById('infos_climatisation')?.value || '',
        instructionsChauffage: document.getElementById('infos_instructionsChauffage')?.value || '',
        equipementsCuisine: document.getElementById('infos_equipementsCuisine')?.value || '',
        instructionsFour: document.getElementById('infos_instructionsFour')?.value || '',
        instructionsPlaques: document.getElementById('infos_instructionsPlaques')?.value || '',
        instructionsLaveVaisselle: document.getElementById('infos_instructionsLaveVaisselle')?.value || '',
        instructionsLaveLinge: document.getElementById('infos_instructionsLaveLinge')?.value || '',
        secheLinge: document.getElementById('infos_secheLinge')?.value || '',
        ferRepasser: document.getElementById('infos_ferRepasser')?.value || '',
        lingeFourni: document.getElementById('infos_lingeFourni')?.value || '',
        configurationChambres: document.getElementById('infos_configurationChambres')?.value || '',
        // Section 4: Logement (EN)
        typeChauffage_en: document.getElementById('infos_typeChauffage_en')?.value || '',
        climatisation_en: document.getElementById('infos_climatisation_en')?.value || '',
        instructionsChauffage_en: document.getElementById('infos_instructionsChauffage_en')?.value || '',
        equipementsCuisine_en: document.getElementById('infos_equipementsCuisine_en')?.value || '',
        instructionsFour_en: document.getElementById('infos_instructionsFour_en')?.value || '',
        instructionsPlaques_en: document.getElementById('infos_instructionsPlaques_en')?.value || '',
        instructionsLaveVaisselle_en: document.getElementById('infos_instructionsLaveVaisselle_en')?.value || '',
        instructionsLaveLinge_en: document.getElementById('infos_instructionsLaveLinge_en')?.value || '',
        secheLinge_en: document.getElementById('infos_secheLinge_en')?.value || '',
        ferRepasser_en: document.getElementById('infos_ferRepasser_en')?.value || '',
        lingeFourni_en: document.getElementById('infos_lingeFourni_en')?.value || '',
        configurationChambres_en: document.getElementById('infos_configurationChambres_en')?.value || '',
        
        // Section 5: Déchets (FR)
        instructionsTri: document.getElementById('infos_instructionsTri')?.value || '',
        joursCollecte: document.getElementById('infos_joursCollecte')?.value || '',
        decheterie: document.getElementById('infos_decheterie')?.value || '',
        // Section 5: Déchets (EN)
        instructionsTri_en: document.getElementById('infos_instructionsTri_en')?.value || '',
        joursCollecte_en: document.getElementById('infos_joursCollecte_en')?.value || '',
        decheterie_en: document.getElementById('infos_decheterie_en')?.value || '',
        
        // Section 6: Sécurité (FR)
        detecteurFumee: document.getElementById('infos_detecteurFumee')?.value || '',
        extincteur: document.getElementById('infos_extincteur')?.value || '',
        coupureEau: document.getElementById('infos_coupureEau')?.value || '',
        disjoncteur: document.getElementById('infos_disjoncteur')?.value || '',
        consignesUrgence: document.getElementById('infos_consignesUrgence')?.value || '',
        // Section 6: Sécurité (EN)
        detecteurFumee_en: document.getElementById('infos_detecteurFumee_en')?.value || '',
        extincteur_en: document.getElementById('infos_extincteur_en')?.value || '',
        coupureEau_en: document.getElementById('infos_coupureEau_en')?.value || '',
        disjoncteur_en: document.getElementById('infos_disjoncteur_en')?.value || '',
        consignesUrgence_en: document.getElementById('infos_consignesUrgence_en')?.value || '',
        
        // Section 7: Départ (FR)
        heureDepart: document.getElementById('infos_heureDepart')?.value || '',
        departTardif: document.getElementById('infos_departTardif')?.value || '',
        checklistDepart: document.getElementById('infos_checklistDepart')?.value || '',
        restitutionCles: document.getElementById('infos_restitutionCles')?.value || '',
        // Section 7: Départ (EN)
        heureDepart_en: document.getElementById('infos_heureDepart_en')?.value || '',
        departTardif_en: document.getElementById('infos_departTardif_en')?.value || '',
        checklistDepart_en: document.getElementById('infos_checklistDepart_en')?.value || '',
        restitutionCles_en: document.getElementById('infos_restitutionCles_en')?.value || '',
        
        // Section 8: Règlement (FR)
        tabac: document.getElementById('infos_tabac')?.value || '',
        animaux: document.getElementById('infos_animaux')?.value || '',
        nbMaxPersonnes: document.getElementById('infos_nbMaxPersonnes')?.value || '',
        caution: document.getElementById('infos_caution')?.value || '',
        // Section 8: Règlement (EN)
        tabac_en: document.getElementById('infos_tabac_en')?.value || '',
        animaux_en: document.getElementById('infos_animaux_en')?.value || '',
        nbMaxPersonnes_en: document.getElementById('infos_nbMaxPersonnes_en')?.value || '',
        caution_en: document.getElementById('infos_caution_en')?.value || '',
        
        dateModification: new Date().toISOString()
    };
    
    // Compter les champs FR et EN non vides pour diagnostic
    const champsFR = Object.keys(formData).filter(k => !k.includes('_en') && formData[k] && formData[k].trim() !== '');
    const champsEN = Object.keys(formData).filter(k => k.includes('_en') && formData[k] && formData[k].trim() !== '');
    
    // console.log(`💾 Sauvegarde ${currentGiteInfos}:`, {
    //     champsFR: champsFR.length,
    //     champsEN: champsEN.length,
    //     total: Object.keys(formData).length,
    //     exemplesFR: champsFR.slice(0, 3),
    //     exemplesEN: champsEN.slice(0, 3)
    // });
    
    // Détecter si l'adresse a changé
    const addressChanged = formData.adresse && formData.adresse.trim() !== initialAddress.trim();
    
    // Géocoder automatiquement si :
    // 1. L'adresse est renseignée ET pas de GPS
    // 2. OU si l'adresse a changé
    if (formData.adresse && (!formData.gpsLat || !formData.gpsLon || addressChanged)) {
        // console.log('📍 Géocodage automatique de l\'adresse...');
        if (addressChanged) {
            // console.log('🔄 Adresse modifiée détectée');
        }
        const coords = await geocodeAddressAuto(formData.adresse);
        if (coords) {
            formData.gpsLat = coords.lat.toString();
            formData.gpsLon = coords.lon.toString();
            // Mettre à jour les champs visuels
            document.getElementById('infos_gpsLat').value = coords.lat.toFixed(8);
            document.getElementById('infos_gpsLon').value = coords.lon.toFixed(8);
            // Mettre à jour l'adresse initiale
            initialAddress = formData.adresse;
        }
    }
    
    // Si l'adresse est vide, effacer les GPS
    if (!formData.adresse || formData.adresse.trim() === '') {
        formData.gpsLat = '';
        formData.gpsLon = '';
        document.getElementById('infos_gpsLat').value = '';
        document.getElementById('infos_gpsLon').value = '';
        initialAddress = '';
    }
    
    // Sauvegarder en base de données Supabase uniquement
    await saveInfosGiteToSupabase(currentGiteInfos, formData);
    
    // Sauvegarder les photos (après que la ligne infos_gites soit créée)
    if (typeof window.savePhotosToDatabase === 'function') {
        try {
            await window.savePhotosToDatabase(currentGiteInfos);
        } catch (err) {
            console.error('Erreur sauvegarde photos (non bloquant):', err);
            // Ne pas bloquer la sauvegarde des autres données
        }
    }
    
    if (typeof updateProgressInfos === 'function') {
        updateProgressInfos();
    }
}

async function chargerDonneesInfos() {
    // console.log(`📥 Chargement des données pour ${currentGiteInfos} (langue active: ${currentLangInfos})`);
    
    // Charger uniquement depuis Supabase
    const data = await loadInfosGiteFromSupabase(currentGiteInfos);
    
    if (!data) {
        // Aucune donnée : vider tous les champs
        const form = document.getElementById('infosGiteForm');
        if (form) {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (input.type !== 'button' && input.type !== 'submit') {
                    input.value = '';
                }
            });
        }
        // Appliquer l'affichage selon la langue active
        applyLanguageDisplay();
        applyGiteAccessCodeConfigToUI(currentGiteInfos);
        return;
    }
    
    // Remplir TOUS les champs (FR + EN) avec les données de la base
    let champsRemplis = 0;
    let champsNonTrouves = [];
    
    // Champs système à ignorer (pas d'affichage dans le formulaire)
    const champsSystemeIgnores = ['dateModification', 'created_at', 'updated_at', 'id', 'user_id'];
    
    Object.keys(data).forEach(key => {
        // Ignorer les champs système
        if (champsSystemeIgnores.includes(key)) return;
        
        // Essayer avec préfixe "infos_"
        let element = document.getElementById('infos_' + key);
        // Si pas trouvé, essayer sans préfixe pour les champs _en
        if (!element) {
            element = document.getElementById(key);
        }
        
        // Remplir si trouvé
        if (element) {
            element.value = data[key] || '';
            if (data[key]) champsRemplis++;
        } else {
            // Champ non trouvé dans le HTML
            champsNonTrouves.push(key);
        }
    });
    
    // console.log(`✅ ${champsRemplis} champs remplis (avec valeur)`);
    // console.log(`📊 Total clés dans data: ${Object.keys(data).length}`);
    
    if (champsNonTrouves.length > 0) {
        console.warn(`⚠️ ${champsNonTrouves.length} champs NON TROUVÉS dans le HTML:`, champsNonTrouves);
    }
    
    // Debug : afficher quelques exemples de champs EN chargés
    const exemplesEN = Object.keys(data).filter(k => k.includes('_en')).slice(0, 5);
    // console.log(`🔍 Exemples champs EN chargés:`, exemplesEN.map(k => `${k}="${data[k]?.substring(0, 30)}..."`));
    
    // Charger les coordonnées depuis la table gites si non présentes
    if (!data.gpsLat || !data.gpsLon) {
        await loadGiteCoordinatesFromMainTable(currentGiteInfos);
    }
    
    // Mettre à jour les champs conditionnels
    if (typeof toggleParkingInfos === 'function') {
        toggleParkingInfos();
    }
    if (typeof updateProgressInfos === 'function') {
        updateProgressInfos();
    }
    
    // Appliquer l'affichage selon la langue ACTIVE (préservée)
    applyLanguageDisplay();
    applyGiteAccessCodeConfigToUI(currentGiteInfos);
    
    // Générer le QR code WiFi si les données sont présentes
    setTimeout(() => {
        if (typeof updateQRCodeWifi === 'function') {
            updateQRCodeWifi();
        }
    }, 100);
}

window.toggleParkingInfos = function() {
    const parking = document.getElementById('infos_parkingDispo')?.value || '';
    const showFields = parking && parking !== 'Non';
    const placesDiv = document.getElementById('parkingPlacesDiv');
    const detailsDiv = document.getElementById('parkingDetailsDiv');
    if (placesDiv) placesDiv.style.display = showFields ? 'block' : 'none';
    if (detailsDiv) detailsDiv.style.display = showFields ? 'block' : 'none';
};

function updateProgressInfos() {
    const fields = document.querySelectorAll('#infosGiteForm [required]');
    let filled = 0;
    fields.forEach(field => {
        if (field.value && field.value.trim()) filled++;
    });
    const percent = fields.length > 0 ? (filled / fields.length) * 100 : 0;
    const progressBar = document.getElementById('progressBarInfos');
    const progressText = document.getElementById('progressText');
    if (progressBar) progressBar.style.width = percent + '%';
    if (progressText) progressText.textContent = Math.round(percent) + '%';
}

// Tracking des modifications non sauvegardées
window.isDirty = false;
let originalFormData = null;

// Marquer le formulaire comme modifié
function markFormAsDirty() {
    window.isDirty = true;
}

// Capturer l'état initial du formulaire
function captureFormState() {
    const form = document.getElementById('infosGiteForm');
    if (!form) return;
    
    const fields = form.querySelectorAll('input, textarea, select');
    const data = {};
    fields.forEach(field => {
        data[field.name || field.id] = field.value;
    });
    originalFormData = JSON.stringify(data);
    window.isDirty = false;
}

// Vérifier si le formulaire a changé
function checkIfFormChanged() {
    const form = document.getElementById('infosGiteForm');
    if (!form) return false;
    
    const fields = form.querySelectorAll('input, textarea, select');
    const currentData = {};
    fields.forEach(field => {
        currentData[field.name || field.id] = field.value;
    });
    
    return JSON.stringify(currentData) !== originalFormData;
}

// Attacher les listeners de modification
function attachChangeListeners() {
    const form = document.getElementById('infosGiteForm');
    if (!form) return;
    
    const fields = form.querySelectorAll('input, textarea, select');
    let saveTimeout = null;
    
    fields.forEach(field => {
        // Marquer comme modifié
        field.addEventListener('input', markFormAsDirty);
        field.addEventListener('change', markFormAsDirty);
        
        // 🔥 SAUVEGARDE AUTO quand on quitte le champ (blur)
        field.addEventListener('blur', async function() {
            if (window.isDirty) {
                // Débounce pour éviter trop de sauvegardes
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(async () => {
                    // console.log('💾 Sauvegarde automatique...');
                    await sauvegarderDonneesInfos();
                    window.isDirty = false;
                    captureFormState();
                    
                    // Notification discrète
                    if (typeof showNotification === 'function') {
                        showNotification('✓ Sauvegardé', 'success', 1000);
                    }
                }, 500); // 500ms après avoir quitté le champ
            }
        });
    });
    
    // console.log('✅ Sauvegarde automatique activée sur tous les champs');
}

// Sauvegarde manuelle
window.sauvegarderInfosGiteComplet = function(event) {
    if (event) event.preventDefault();
    sauvegarderDonneesInfos();
    window.isDirty = false;
    captureFormState();
    if (typeof showNotification === 'function') {
        showNotification('✓ Informations sauvegardées pour ' + currentGiteInfos, 'success');
    }
};

window.resetGiteInfosQuick = async function() {
    if (!confirm(`⚠️ ATTENTION !\n\nVoulez-vous vraiment effacer TOUTES les informations du gîte ${currentGiteInfos} ?\n\n✓ Ceci supprimera :\n- Adresse et coordonnées\n- Informations WiFi\n- Instructions d'arrivée\n- Équipements\n- Toutes les autres données\n\n❌ Cette action est IRRÉVERSIBLE !\n\nCliquez sur OK pour confirmer la suppression.`)) {
        return;
    }
    
    // Supprimer de Supabase
    try {
        await supabase
            .from('infos_gites')
            .delete()
            .eq('gite', currentGiteInfos.toLowerCase());
        
        if (typeof showNotification === 'function') {
            showNotification(`✓ Toutes les données de ${currentGiteInfos} ont été effacées`, 'success');
        }
        
        // Vider tous les champs du formulaire
        const form = document.getElementById('infosGiteForm');
        if (form) {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.value = '';
            });
        }
        
        // Recharger les champs vides
        await chargerDonneesInfos();
    } catch (error) {
        console.error('Erreur suppression:', error);
        if (typeof showNotification === 'function') {
            showNotification('❌ Erreur lors de la suppression', 'error');
        }
    }
};


// ==========================================
// 📱 GÉNÉRATION QR CODE WIFI
// ==========================================

window.updateQRCodeWifi = function() {
    
    const ssid = document.getElementById('infos_wifiSSID')?.value || '';
    const password = document.getElementById('infos_wifiPassword')?.value || '';
    const section = document.getElementById('qrCodeWifiSection');
    const canvas = document.getElementById('qrCodeWifiCanvas');
    
    
    if (!section || !canvas) {
        console.error('❌ Éléments QR code non trouvés');
        return;
    }
    
    // Afficher la section seulement si SSID et password sont remplis
    if (ssid && password) {
        section.style.display = 'block';
        
        // Format du QR code WiFi selon la spécification
        const wifiString = `WIFI:T:WPA;S:${ssid};P:${password};;`;
        
        // Générer directement avec l'API
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        
        img.onerror = function(e) {
            console.error('❌ Erreur chargement QR code:', e);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ff0000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Erreur de', canvas.width/2, canvas.height/2 - 6);
            ctx.fillText('génération', canvas.width/2, canvas.height/2 + 6);
        };
        
        const encodedText = encodeURIComponent(wifiString);
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedText}`;
        
    } else {
        section.style.display = 'none';
    }
};

window.telechargerQRCodeWifi = function() {
    const canvas = document.getElementById('qrCodeWifiCanvas');
    const ssid = document.getElementById('infos_wifiSSID')?.value || 'wifi';
    
    if (!canvas) {
        if (typeof showNotification === 'function') {
            showNotification('❌ Canvas non trouvé', 'error');
        }
        return;
    }
    
    // Créer un canvas plus grand pour meilleure qualité
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 600;
    tempCanvas.height = 700;
    const ctx = tempCanvas.getContext('2d');
    
    // Fond blanc
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Titre
    ctx.fillStyle = '#2C5F7D';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WiFi Gratuit', tempCanvas.width / 2, 60);
    
    // SSID
    ctx.font = '28px Arial';
    ctx.fillStyle = '#555';
    ctx.fillText(`Réseau: ${ssid}`, tempCanvas.width / 2, 110);
    
    // QR Code (centré et agrandi)
    ctx.drawImage(canvas, 50, 140, 500, 500);
    
    // Instructions
    ctx.font = '20px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('Scannez avec votre smartphone', tempCanvas.width / 2, 670);
    
    // Télécharger
    tempCanvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `QR-WiFi-${ssid}.png`;
        link.click();
        URL.revokeObjectURL(url);
        if (typeof showNotification === 'function') {
            showNotification('✓ QR Code téléchargé !', 'success');
        }
    });
};

window.imprimerQRCodeWifi = function() {
    const canvas = document.getElementById('qrCodeWifiCanvas');
    const ssid = document.getElementById('infos_wifiSSID')?.value || 'wifi';
    const password = document.getElementById('infos_wifiPassword')?.value || '';
    
    if (!canvas) {
        if (typeof showNotification === 'function') {
            showNotification('❌ Canvas non trouvé', 'error');
        }
        return;
    }
    
    // Créer une fenêtre d'impression
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>QR Code WiFi - ${ssid}</title>
            <style>
                @page {
                    size: A4;
                    margin: 2cm;
                }
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 20px;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    border: 3px solid #2C5F7D;
                    padding: 30px;
                    border-radius: 20px;
                }
                h1 {
                    color: #2C5F7D;
                    font-size: 48px;
                    margin-bottom: 10px;
                }
                .ssid {
                    font-size: 32px;
                    color: #555;
                    margin-bottom: 30px;
                    font-weight: bold;
                }
                .qr-code {
                    margin: 30px 0;
                }
                .instructions {
                    font-size: 24px;
                    color: #666;
                    margin-top: 20px;
                }
                .password {
                    font-size: 18px;
                    color: #999;
                    margin-top: 20px;
                    font-style: italic;
                }
                @media print {
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📶 WiFi Gratuit</h1>
                <div class="ssid">Réseau: ${ssid}</div>
                <div class="qr-code">
                    <img src="${canvas.toDataURL()}" style="width: 400px; height: 400px;">
                </div>
                <div class="instructions">
                    📱 Scannez ce QR code avec votre smartphone<br>
                    pour vous connecter automatiquement
                </div>
                <div class="password">
                    Mot de passe (si besoin): ${password}
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
};

// ==========================================
// GÉOCODAGE AUTOMATIQUE (utilise la fonction existante)
// ==========================================

// Synchroniser les coordonnées avec la table gites
async function syncGiteCoordinates(giteName, address, latitude, longitude) {
    try {
        const { data: gites, error: giteError } = await supabase
            .from('gites')
            .select('id')
            .ilike('name', giteName)
            .single();
        
        if (giteError || !gites) {
            console.warn('⚠️ Gîte non trouvé pour synchronisation:', giteName);
            return;
        }
        
        const { error: updateError } = await supabase
            .from('gites')
            .update({
                address: address,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                updated_at: new Date().toISOString()
            })
            .eq('id', gites.id);
        
        if (updateError) {
            console.error('❌ Erreur sync coordonnées gites:', updateError);
        } else {
            // console.log('✅ Coordonnées synchronisées dans la table gites');
        }
    } catch (error) {
        console.error('❌ Erreur syncGiteCoordinates:', error);
    }
}

// Charger les coordonnées depuis la table gites au démarrage
async function loadGiteCoordinatesFromMainTable(giteName) {
    try {
        const { data: gites, error } = await supabase
            .from('gites')
            .select('address, latitude, longitude')
            .ilike('name', giteName)
            .single();
        
        if (error || !gites) return;
        
        if (gites.address) {
            const addressField = document.getElementById('infos_adresse');
            if (addressField && !addressField.value) {
                addressField.value = gites.address;
            }
        }
        
        if (gites.latitude && gites.longitude) {
            const latField = document.getElementById('infos_gpsLat');
            const lonField = document.getElementById('infos_gpsLon');
            
            if (latField && !latField.value) {
                latField.value = gites.latitude;
            }
            if (lonField && !lonField.value) {
                lonField.value = gites.longitude;
            }
        }
    } catch (error) {
        console.error('❌ Erreur loadGiteCoordinatesFromMainTable:', error);
    }
}

window.geocodeAddress = async function() {
    const addressField = document.getElementById('infos_adresse');
    if (!addressField?.value) {
        if (typeof showNotification === 'function') {
            showNotification('⚠️ Veuillez saisir une adresse', 'warning');
        }
        return;
    }
    
    await geocodeAddressAuto(addressField.value);
};

// Fonction interne de géocodage
async function geocodeAddressAuto(address) {
    const latField = document.getElementById('infos_gpsLat');
    const lonField = document.getElementById('infos_gpsLon');
    
    if (!address || !address.trim()) return;
    
    // console.log(`🔍 Recherche GPS pour: "${address}"`);
    
    // Ajouter un délai pour respecter la limite Nominatim (1 req/sec)
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Extraire code postal et ville (plus fiable pour géocodage)
    const postalMatch = address.match(/(\d{5})\s+(.+?)(?:,|$)/);
    const cityMatch = address.match(/\d{5}\s+([^,]+)/);
    
    // Essayer variantes optimisées par ordre de fiabilité décroissante
    const variants = [
        // 1. Adresse complète + pays (LE PLUS PRÉCIS)
        address + ', France',
        // 2. Adresse sans numéro de rue + pays
        address.replace(/^\d+\s+/, '') + ', France',
        // 3. Code postal + ville (centre-ville)
        postalMatch ? `${postalMatch[1]} ${postalMatch[2].trim()}, France` : null,
        // 4. Ville seule + pays
        cityMatch ? `${cityMatch[1].trim()}, France` : null
    ].filter((v, i, arr) => v && arr.indexOf(v) === i); // Retirer null et doublons
    
    for (const variant of variants) {
        try {
            const encodedAddress = encodeURIComponent(variant);
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=3&addressdetails=1`;
            
            // console.log(`📡 Tentative: "${variant}"`);
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'GiteManager/1.0'
                }
            });
            
            if (!response.ok) {
                console.error(`❌ Erreur HTTP ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            
            // console.log(`📊 Résultats: ${data.length}`, data);
            
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat).toFixed(8);
                const lon = parseFloat(data[0].lon).toFixed(8);
                
                // console.log(`✅ Coordonnées: ${lat}, ${lon} (${data[0].display_name})`);
                
                if (latField) latField.value = lat;
                if (lonField) lonField.value = lon;
                
                window.isDirty = true;
                
                // Synchroniser avec la table gites
                await syncGiteCoordinates(currentGiteInfos, address, lat, lon);
                
                if (typeof showNotification === 'function') {
                    showNotification(`✅ GPS trouvé: ${data[0].display_name.substring(0, 60)}...`, 'success');
                }
                
                return { lat: parseFloat(lat), lon: parseFloat(lon) };
            }
            
            // Attendre avant la prochaine tentative
            if (variant !== variants[variants.length - 1]) {
                await new Promise(resolve => setTimeout(resolve, 1100));
            }
            
        } catch (error) {
            console.error(`❌ Erreur tentative "${variant}":`, error);
        }
    }
    
    // Aucune variante n'a fonctionné
    console.warn(`⚠️ Aucun résultat après ${variants.length} tentatives`);
    if (typeof showNotification === 'function') {
        showNotification(`⚠️ Adresse non trouvée. Vérifiez le format (ex: "12 rue principale, 46160 Calvignac")`, 'warning');
    }
    return null;
}

// ==========================================
// 🌍 BASCULER LANGUE FR/EN (AFFICHAGE UNIQUEMENT)
// ==========================================
let currentLangInfos = 'fr';

window.toggleLanguageInfos = async function() {
    // Basculer la langue
    currentLangInfos = currentLangInfos === 'fr' ? 'en' : 'fr';
    
    // 🌍 Si on bascule en EN et que les champs EN sont vides → TRADUIRE AUTO
    if (currentLangInfos === 'en') {
        const needsTranslation = checkIfNeedsTranslation();
        if (needsTranslation) {
            if (typeof showNotification === 'function') {
                showNotification('🌍 Traduction automatique en cours...', 'info', 2000);
            }
            await translateAllFields();
        }
    }
    
    // Appliquer l'affichage
    applyLanguageDisplay();
};

// Vérifier si des champs EN sont vides alors que FR est rempli
function checkIfNeedsTranslation() {
    const champsFR = document.querySelectorAll('#infosGiteForm input:not([id$="_en"]):not([readonly]), #infosGiteForm textarea:not([id$="_en"])');
    
    for (const champFR of champsFR) {
        const idFR = champFR.id;
        if (!idFR || idFR.includes('gps') || idFR.includes('Lat') || idFR.includes('Lon')) continue;
        
        const texteFR = champFR.value.trim();
        if (!texteFR) continue;
        
        const champEN = document.getElementById(idFR + '_en');
        if (champEN && !champEN.value.trim()) {
            return true; // Au moins 1 champ FR rempli avec EN vide
        }
    }
    return false;
}

// Fonction séparée pour appliquer l'affichage selon la langue active
function applyLanguageDisplay() {
    const btn = document.getElementById('btnToggleLangInfos');
    const label = document.getElementById('langLabelInfos');
    
    if (!btn || !label) {
        console.warn('⚠️ Boutons FR/EN introuvables');
        return;
    }
    
    // La card EN globale qui contient TOUS les champs anglais
    const englishCard = document.getElementById('englishFieldsCard');
    
    if (!englishCard) {
        console.error('❌ Card EN (#englishFieldsCard) introuvable !');
        return;
    }
    
    // Sélectionner toutes les cards du formulaire SAUF la englishCard
    const allCards = Array.from(document.querySelectorAll('#infosGiteForm .infos-card'));
    const frenchCards = allCards.filter(c => c !== englishCard);
    
    if (currentLangInfos === 'en') {
        // Mode ANGLAIS : afficher la card EN, cacher les cards FR
        label.src = '../images/flag-en.svg';
        label.alt = 'EN';
        
        // Afficher la card anglaise globale
        if (englishCard) {
            englishCard.style.display = 'block';
        }
        
        // Cacher toutes les cards FR
        frenchCards.forEach(card => {
            card.style.display = 'none';
        });
        
    } else {
        // Mode FRANÇAIS : cacher la card EN, afficher toutes les cards FR
        label.src = '../images/flag-fr.svg';
        label.alt = 'FR';
        
        // Cacher la card anglaise globale
        if (englishCard) {
            englishCard.style.display = 'none';
        }
        
        // Afficher toutes les cards FR
        frenchCards.forEach(card => {
            card.style.display = '';
        });
        
    }
}

window.applyLanguageDisplay = applyLanguageDisplay;

// ==========================================
// 🌍 TRADUCTION AUTOMATIQUE FR → EN
// ==========================================
let translationQueue = [];
let translationTimeout = null;

// API de traduction gratuite
async function translateText(text, fromLang = 'fr', toLang = 'en') {
    if (!text || text.trim() === '') return '';
    
    try {
        // API MyMemory (gratuite, pas de clé nécessaire)
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.responseStatus === 200 && data.responseData) {
            return data.responseData.translatedText;
        }
        return text; // Fallback: retourner le texte original
    } catch (error) {
        console.error('Erreur traduction:', error);
        return text;
    }
}

// Attacher les listeners de traduction automatique
function attachAutoTranslation() {
    // Tous les champs FR (sauf GPS, techniques et uploads photo)
    const champsFR = document.querySelectorAll('#infosGiteForm input:not([id$="_en"]):not([readonly]):not([type="file"]), #infosGiteForm textarea:not([id$="_en"]), #infosGiteForm select:not([id$="_en"])');
    
    let champsAvecTraduction = 0;
    let champsSansCorrespondanceEN = [];
    
    champsFR.forEach(champFR => {
        const idFR = champFR.id;
        // Exclure GPS, coordonnées et champs photo
        if (!idFR || idFR.includes('gps') || idFR.includes('Lat') || idFR.includes('Lon') || idFR.startsWith('upload') || idFR.includes('Photo')) return;
        
        const idEN = idFR + '_en';
        const champEN = document.getElementById(idEN);
        
        if (champEN) {
            champsAvecTraduction++;
            // Traduction à chaque modification (avec debounce)
            champFR.addEventListener('input', function() {
                clearTimeout(translationTimeout);
                translationTimeout = setTimeout(async () => {
                    const texteFR = this.value.trim();
                    if (texteFR) {
                        // Afficher un indicateur de traduction
                        champEN.style.background = '#fff3cd';
                        champEN.value = '⏳ Traduction...';
                        champEN.disabled = true;
                        
                        // Traduire
                        const texteEN = await translateText(texteFR);
                        
                        // Afficher le résultat
                        champEN.value = texteEN;
                        champEN.style.background = '#d4edda';
                        champEN.disabled = false;
                        
                        // Retirer la couleur après 2 secondes
                        setTimeout(() => {
                            champEN.style.background = '';
                        }, 2000);
                    } else {
                        champEN.value = '';
                    }
                }, 1000); // 1 seconde de délai après la dernière frappe
            });
        } else {
            // Champ FR sans correspondance EN
            champsSansCorrespondanceEN.push(idFR);
        }
    });
    
    // console.log(`✅ Traduction automatique FR → EN activée sur ${champsAvecTraduction} champs`);
    if (champsSansCorrespondanceEN.length > 0) {
        console.warn(`⚠️ ${champsSansCorrespondanceEN.length} champs FR sans champ EN:`, champsSansCorrespondanceEN);
    }
}

// Activer la traduction automatique au chargement
window.attachAutoTranslation = attachAutoTranslation;

// Traduire tous les champs FR → EN en une fois
window.translateAllFields = async function() {
    const btn = document.getElementById('btnAutoTranslateAll');
    if (!btn) return;
    
    // Désactiver le bouton pendant la traduction
    btn.disabled = true;
    btn.innerHTML = '⏳ Traduction en cours...';
    btn.style.opacity = '0.6';
    
    try {
        // Tous les champs FR non vides (input, textarea, select)
        const champsFR = document.querySelectorAll('#infosGiteForm input:not([id$="_en"]):not([readonly]), #infosGiteForm textarea:not([id$="_en"]), #infosGiteForm select:not([id$="_en"])');
        let translated = 0;
        let total = 0;
        
        for (const champFR of champsFR) {
            const idFR = champFR.id;
            if (!idFR || idFR.includes('gps') || idFR.includes('Lat') || idFR.includes('Lon')) continue;
            
            const texteFR = champFR.value.trim();
            if (!texteFR) continue; // Ignorer les champs vides
            
            const idEN = idFR + '_en';
            const champEN = document.getElementById(idEN);
            
            if (champEN) {
                total++;
                // Afficher progression
                btn.innerHTML = `⏳ ${translated}/${total}...`;
                
                // Traduire
                champEN.style.background = '#fff3cd';
                champEN.value = '⏳ Traduction...';
                
                const texteEN = await translateText(texteFR);
                
                champEN.value = texteEN;
                champEN.style.background = '#d4edda';
                translated++;
                
                // Petit délai pour éviter le rate limiting de l'API
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        // Succès
        btn.innerHTML = `✅ ${translated} champs traduits`;
        btn.style.background = '#27ae60';
        
        if (typeof showNotification === 'function') {
            showNotification(`✅ ${translated} champs traduits - Sauvegarde automatique...`, 'success');
        }
        
        // 🔥 SAUVEGARDE AUTOMATIQUE après traduction
        // console.log('💾 Sauvegarde automatique après traduction...');
        await sauvegarderDonneesInfos();
        
        if (typeof showNotification === 'function') {
            showNotification(`✅ ${translated} traductions sauvegardées !`, 'success');
        }
        
        // Réinitialiser les styles après 3 secondes
        setTimeout(() => {
            const champsEN = document.querySelectorAll('[id$="_en"]');
            champsEN.forEach(champ => {
                champ.style.background = '';
            });
            btn.innerHTML = '🌐 Traduire tout';
            btn.style.background = '#9b59b6';
            btn.style.opacity = '1';
            btn.disabled = false;
        }, 3000);
        
    } catch (error) {
        console.error('Erreur traduction globale:', error);
        btn.innerHTML = '❌ Erreur';
        btn.style.background = '#e74c3c';
        
        setTimeout(() => {
            btn.innerHTML = '🌐 Traduire tout';
            btn.style.background = '#9b59b6';
            btn.style.opacity = '1';
            btn.disabled = false;
        }, 3000);
    }
};

// ==========================================
// 🎬 INITIALISATION : Pas besoin de fonction séparée
// ==========================================
// La fonction applyLanguageDisplay() gère tout

// Exports supplémentaires
window.sauvegarderDonneesInfos = sauvegarderDonneesInfos;
window.chargerDonneesInfos = chargerDonneesInfos;
window.updateProgressInfos = updateProgressInfos;
window.currentGiteInfos = 'Trévoux';
