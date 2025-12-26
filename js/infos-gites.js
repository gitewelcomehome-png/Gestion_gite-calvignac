// ==========================================
// 📄 MODULE GESTION INFOS GÎTES & COMMUNICATION CLIENTS
// ==========================================
// Génération pages clients, envoi WhatsApp/SMS, gestion activités

// ==========================================
// 📱 GÉNÉRATION & ENVOI PAGE CLIENT
// ==========================================

function loadInfosGites(gite) {
    const allData = JSON.parse(localStorage.getItem('gites_infos_pratiques_complet') || '{}');
    const data = allData[gite] || {};
    
    // Transformer au format attendu par l'ancien système (compatibilité)
    return {
        wifi: data.wifiPassword || '',
        codeCle: data.codeAcces || '',
        adresse: data.adresse || '',
        instructionsArrivee: data.instructionsCles || '',
        instructionsDepart: data.checklistDepart || '',
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
    choixModal.innerHTML = `
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
                    <span style="font-size: 1.5rem;">📋</span> <span>Aperçu Fiche Client</span>
                </button>
                
                <button onclick="envoyerViaWhatsApp(${reservationId})" style="padding: 15px; border: none; border-radius: 12px; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 15px rgba(37,211,102,0.3);">
                    <span style="font-size: 1.5rem;">💼</span> <span>WhatsApp Business</span>
                </button>
                
                <button onclick="envoyerViaSMS(${reservationId})" style="padding: 15px; border: none; border-radius: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 15px rgba(102,126,234,0.3);">
                    <span style="font-size: 1.5rem;">💬</span> <span>SMS</span>
                </button>
                
                <button onclick="telechargerSeulementHTML(${reservationId})" style="padding: 12px; border: none; border-radius: 10px; background: #f0f0f0; color: #666; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <span style="font-size: 1.3rem;">📄</span> <span>Télécharger HTML seulement</span>
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
                3. Créez un profil avec nom "Gîtes Calvignac" + adresse<br>
                4. Cliquez sur "WhatsApp Business" ci-dessus
                </span>
            </div>
        </div>
    `;
    document.body.appendChild(choixModal);
}

async function envoyerViaWhatsApp(reservationId) {
    // Fermer le modal
    document.querySelectorAll('div[style*="z-index: 10000"]').forEach(el => el.remove());
    
    const reservations = await getAllReservations();
    const reservation = reservations.find(r => r.id === reservationId);
    const infosGite = loadInfosGites(reservation.gite);
    
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
    const infosGite = loadInfosGites(reservation.gite);
    
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

function telechargerPageHTML(reservation) {
    const infosGite = loadInfosGites(reservation.gite);
    
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
    
    resultatDiv.innerHTML = `
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
    `;
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

async function saveInfosGiteToSupabase(gite, formData) {
    try {
        const dataToSave = {
            gite: gite.toLowerCase(),
            // Section 1: Base
            adresse: formData.adresse || null,
            telephone: formData.telephone || null,
            gps_lat: formData.gpsLat || null,
            gps_lon: formData.gpsLon || null,
            email: formData.email || null,
            adresse_en: formData.adresse_en || null,
            telephone_en: formData.telephone_en || null,
            email_en: formData.email_en || null,
            // Section 2: WiFi
            wifi_ssid: formData.wifiSSID || null,
            wifi_password: formData.wifiPassword || null,
            wifi_debit: formData.wifiDebit || null,
            wifi_localisation: formData.wifiLocalisation || null,
            wifi_zones: formData.wifiZones || null,
            wifi_ssid_en: formData.wifiSSID_en || null,
            wifi_password_en: formData.wifiPassword_en || null,
            wifi_debit_en: formData.wifiDebit_en || null,
            wifi_localisation_en: formData.wifiLocalisation_en || null,
            wifi_zones_en: formData.wifiZones_en || null,
            // Section 3: Arrivée
            heure_arrivee: formData.heureArrivee || null,
            arrivee_tardive: formData.arriveeTardive || null,
            parking_dispo: formData.parkingDispo || null,
            parking_places: formData.parkingPlaces || null,
            parking_details: formData.parkingDetails || null,
            type_acces: formData.typeAcces || null,
            code_acces: formData.codeAcces || null,
            instructions_cles: formData.instructionsCles || null,
            etage: formData.etage || null,
            ascenseur: formData.ascenseur || null,
            itineraire_logement: formData.itineraireLogement || null,
            premiere_visite: formData.premiereVisite || null,
            heure_arrivee_en: formData.heureArrivee_en || null,
            arrivee_tardive_en: formData.arriveeTardive_en || null,
            parking_dispo_en: formData.parkingDispo_en || null,
            parking_places_en: formData.parkingPlaces_en || null,
            parking_details_en: formData.parkingDetails_en || null,
            type_acces_en: formData.typeAcces_en || null,
            code_acces_en: formData.codeAcces_en || null,
            instructions_cles_en: formData.instructionsCles_en || null,
            etage_en: formData.etage_en || null,
            ascenseur_en: formData.ascenseur_en || null,
            itineraire_logement_en: formData.itineraireLogement_en || null,
            premiere_visite_en: formData.premiereVisite_en || null,
            // Section 4: Logement
            type_chauffage: formData.typeChauffage || null,
            climatisation: formData.climatisation || null,
            instructions_chauffage: formData.instructionsChauffage || null,
            equipements_cuisine: formData.equipementsCuisine || null,
            instructions_four: formData.instructionsFour || null,
            instructions_plaques: formData.instructionsPlaques || null,
            instructions_lave_vaisselle: formData.instructionsLaveVaisselle || null,
            instructions_lave_linge: formData.instructionsLaveLinge || null,
            seche_linge: formData.secheLinge || null,
            fer_repasser: formData.ferRepasser || null,
            linge_fourni: formData.lingeFourni || null,
            configuration_chambres: formData.configurationChambres || null,
            type_chauffage_en: formData.typeChauffage_en || null,
            climatisation_en: formData.climatisation_en || null,
            instructions_chauffage_en: formData.instructionsChauffage_en || null,
            equipements_cuisine_en: formData.equipementsCuisine_en || null,
            instructions_four_en: formData.instructionsFour_en || null,
            instructions_plaques_en: formData.instructionsPlaques_en || null,
            instructions_lave_vaisselle_en: formData.instructionsLaveVaisselle_en || null,
            instructions_lave_linge_en: formData.instructionsLaveLinge_en || null,
            seche_linge_en: formData.secheLinge_en || null,
            fer_repasser_en: formData.ferRepasser_en || null,
            linge_fourni_en: formData.lingeFourni_en || null,
            configuration_chambres_en: formData.configurationChambres_en || null,
            // Section 5: Déchets
            instructions_tri: formData.instructionsTri || null,
            jours_collecte: formData.joursCollecte || null,
            decheterie: formData.decheterie || null,
            instructions_tri_en: formData.instructionsTri_en || null,
            jours_collecte_en: formData.joursCollecte_en || null,
            decheterie_en: formData.decheterie_en || null,
            // Section 6: Sécurité
            detecteur_fumee: formData.detecteurFumee || null,
            extincteur: formData.extincteur || null,
            coupure_eau: formData.coupureEau || null,
            disjoncteur: formData.disjoncteur || null,
            consignes_urgence: formData.consignesUrgence || null,
            detecteur_fumee_en: formData.detecteurFumee_en || null,
            extincteur_en: formData.extincteur_en || null,
            coupure_eau_en: formData.coupureEau_en || null,
            disjoncteur_en: formData.disjoncteur_en || null,
            consignes_urgence_en: formData.consignesUrgence_en || null,
            // Section 7: Départ
            heure_depart: formData.heureDepart || null,
            depart_tardif: formData.departTardif || null,
            checklist_depart: formData.checklistDepart || null,
            restitution_cles: formData.restitutionCles || null,
            heure_depart_en: formData.heureDepart_en || null,
            depart_tardif_en: formData.departTardif_en || null,
            checklist_depart_en: formData.checklistDepart_en || null,
            restitution_cles_en: formData.restitutionCles_en || null,
            // Section 8: Règlement
            tabac: formData.tabac || null,
            animaux: formData.animaux || null,
            nb_max_personnes: formData.nbMaxPersonnes || null,
            caution: formData.caution || null,
            tabac_en: formData.tabac_en || null,
            animaux_en: formData.animaux_en || null,
            nb_max_personnes_en: formData.nbMaxPersonnes_en || null,
            caution_en: formData.caution_en || null,
            date_modification: new Date().toISOString()
        };
        
        const { error } = await supabase
            .from('infos_gites')
            .upsert(dataToSave, { onConflict: 'gite' });
        
        if (error) throw error;
        
        console.log(`✅ Infos ${gite} sauvegardées en base de données`);
        return true;
    } catch (error) {
        console.error('Erreur sauvegarde Supabase:', error);
        showNotification('⚠️ Sauvegarde locale OK, mais erreur sync cloud', 'warning');
        return false;
    }
}

async function loadInfosGiteFromSupabase(gite) {
    try {
        const { data, error } = await supabase
            .from('infos_gites')
            .select('*')
            .eq('gite', gite.toLowerCase())
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                console.log(`ℹ️ Pas encore de données pour ${gite} en base`);
                return null;
            }
            throw error;
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
        
        console.log(`✅ Infos ${gite} chargées depuis la base de données`);
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
