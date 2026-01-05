// ==========================================
// FONCTIONS SUPABASE - RÉSERVATIONS ET CHARGES
// ==========================================

// Note: Dépend de shared-utils.js et shared-config.js

// ==========================================
// RÉSERVATIONS
// ==========================================

async function addReservation(reservation) {
    try {
        // Helper pour formater les dates en YYYY-MM-DD (heure locale française)
        function formatDateForSupabase(dateStr) {
            if (!dateStr) return null;
            
            // Si c'est déjà au bon format YYYY-MM-DD
            if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return dateStr;
            }
            
            // Si c'est un objet Date
            if (dateStr instanceof Date) {
                return window.dateToLocalString(dateStr);
            }
            
            // Sinon essayer de parser en utilisant parseLocalDate (pas new Date!)
            if (typeof dateStr === 'string') {
                // Si format ISO complet (avec heure), extraire juste la date
                if (dateStr.includes('T')) {
                    return dateStr.split('T')[0];
                }
                // Sinon parser correctement
                try {
                    const parsed = window.parseLocalDate(dateStr);
                    if (!isNaN(parsed.getTime())) {
                        return window.dateToLocalString(parsed);
                    }
                } catch (e) {
                    console.error('Erreur parsing date:', dateStr, e);
                }
            }
            
            return null;
        }
        
        const data = {
            gite: reservation.gite,
            date_debut: formatDateForSupabase(reservation.dateDebut),
            date_fin: formatDateForSupabase(reservation.dateFin),
            plateforme: reservation.site || reservation.plateforme || 'Autre',
            montant: parseFloat(reservation.montant) || 0,
            nom_client: reservation.nom || reservation.nomClient || null,
            telephone: reservation.telephone || null,
            provenance: reservation.provenance || null,
            nb_personnes: reservation.nbPersonnes || 0,
            acompte: parseFloat(reservation.acompte) || 0,
            restant: parseFloat(reservation.restant) || 0,
            paiement: reservation.paiement || 'En attente',
            timestamp: reservation.timestamp || new Date().toISOString(),
            synced_from: reservation.syncedFrom || null
        };
        
        if (!data.date_debut || !data.date_fin) {
            throw new Error('Dates invalides');
        }
        
        const result = await window.supabaseClient
            .from('reservations')
            .insert(data)
            .select()
            .single();
        
        if (result.error) throw result.error;
        
        // Invalider le cache
        window.invalidateCache('reservations');
        
        return result.data.id;
    } catch (error) {
        console.error('Erreur addReservation:', error);
        throw error;
    }
}

async function getAllReservations(forceRefresh) {
    // Utiliser le cache si valide
    if (!forceRefresh && window.CACHE.reservations && (Date.now() - window.CACHE.reservationsTimestamp < window.CACHE.TTL)) {
        return window.CACHE.reservations;
    }
    
    try {
        const result = await window.supabaseClient
            .from('reservations')
            .select('*')
            .order('date_debut', { ascending: true });
        
        if (result.error) throw result.error;
        
        // Convertir snake_case en camelCase pour compatibilité
        const reservations = (result.data || []).map(function(r) {
            return {
                id: r.id,
                gite: r.gite,
                dateDebut: r.date_debut,
                dateFin: r.date_fin,
                site: r.plateforme,
                montant: r.montant,
                nom: r.nom_client,
                telephone: r.telephone,
                provenance: r.provenance,
                nbPersonnes: r.nb_personnes,
                acompte: r.acompte,
                restant: r.restant,
                paiement: r.paiement,
                nuits: window.calculateNights(r.date_debut, r.date_fin),
                timestamp: r.timestamp,
                syncedFrom: r.synced_from
            };
        }).filter(function(r) {
            // Filtrer les réservations phantoms (1 nuit ou moins)
            return r.nuits > 1;
        });
        
        // Mettre en cache
        window.CACHE.reservations = reservations;
        window.CACHE.reservationsTimestamp = Date.now();
        
        return reservations;
    } catch (error) {
        console.error('Erreur getAllReservations:', error);
        window.showToast('❌ Erreur chargement réservations', 'error');
        return [];
    }
}

async function updateReservation(id, updates) {
    try {
        const data = {};
        if (updates.gite !== undefined) data.gite = updates.gite;
        if (updates.dateDebut !== undefined) data.date_debut = updates.dateDebut;
        if (updates.dateFin !== undefined) data.date_fin = updates.dateFin;
        if (updates.site !== undefined) data.plateforme = updates.site;
        if (updates.montant !== undefined) data.montant = parseFloat(updates.montant);
        if (updates.nom !== undefined) data.nom_client = updates.nom;
        if (updates.telephone !== undefined) data.telephone = updates.telephone;
        if (updates.provenance !== undefined) data.provenance = updates.provenance;
        if (updates.nbPersonnes !== undefined) data.nb_personnes = updates.nbPersonnes;
        if (updates.acompte !== undefined) data.acompte = parseFloat(updates.acompte);
        if (updates.restant !== undefined) data.restant = parseFloat(updates.restant);
        if (updates.paiement !== undefined) data.paiement = updates.paiement;
        
        const result = await window.supabaseClient
            .from('reservations')
            .update(data)
            .eq('id', id);
        
        if (result.error) throw result.error;
        
        // Invalider le cache
        window.invalidateCache('reservations');
    } catch (error) {
        console.error('Erreur updateReservation:', error);
        throw error;
    }
}

async function deleteReservation(id) {
    try {
        const result = await window.supabaseClient
            .from('reservations')
            .delete()
            .eq('id', id);
        
        if (result.error) throw result.error;
        
        // Invalider le cache
        window.invalidateCache('reservations');
    } catch (error) {
        console.error('Erreur deleteReservation:', error);
        throw error;
    }
}

// ==========================================
// CHARGES
// ==========================================

async function addCharge(charge) {
    try {
        const data = {
            nom: charge.nom,
            montant: parseFloat(charge.montant),
            type: charge.type,
            date: charge.date || null,
            gite: charge.gite || null
        };
        
        const result = await window.supabaseClient
            .from('charges')
            .insert(data)
            .select()
            .single();
        
        if (result.error) throw result.error;
        
        // Invalider le cache
        window.invalidateCache('charges');
        
        return result.data.id;
    } catch (error) {
        console.error('Erreur addCharge:', error);
        throw error;
    }
}

async function getAllCharges(forceRefresh) {
    // Utiliser le cache si valide
    if (!forceRefresh && window.CACHE.charges && (Date.now() - window.CACHE.chargesTimestamp < window.CACHE.TTL)) {
        return window.CACHE.charges;
    }
    
    try {
        const result = await window.supabaseClient
            .from('charges')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (result.error) throw result.error;
        
        // Mettre en cache
        window.CACHE.charges = result.data || [];
        window.CACHE.chargesTimestamp = Date.now();
        
        return window.CACHE.charges;
    } catch (error) {
        console.error('Erreur getAllCharges:', error);
        window.showToast('❌ Erreur chargement charges', 'error');
        return [];
    }
}

async function deleteCharge(id) {
    try {
        const result = await window.supabaseClient
            .from('charges')
            .delete()
            .eq('id', id);
        
        if (result.error) throw result.error;
        
        // Invalider le cache
        window.invalidateCache('charges');
    } catch (error) {
        console.error('Erreur deleteCharge:', error);
        throw error;
    }
}

// ==========================================
// DONNÉES HISTORIQUES
// ==========================================

async function getHistoricalData(year, gite) {
    try {
        const { data, error } = await window.supabaseClient
            .from('historical_data')
            .select('*')
            .eq('year', year)
            .eq('gite', gite)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (error) {
        console.error('Erreur getHistoricalData:', error);
        return null;
    }
}

async function getAllHistoricalData() {
    try {
        const { data, error } = await window.supabaseClient
            .from('historical_data')
            .select('*')
            .order('year', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erreur getAllHistoricalData:', error);
        return [];
    }
}

async function deleteHistoricalDataById(id) {
    try {
        const { error } = await window.supabaseClient
            .from('historical_data')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    } catch (error) {
        console.error('Erreur deleteHistoricalDataById:', error);
        throw error;
    }
}

// Export vers window pour accessibilité globale
window.addReservation = addReservation;
window.getAllReservations = getAllReservations;
window.updateReservation = updateReservation;
window.deleteReservation = deleteReservation;
window.addCharge = addCharge;
window.getAllCharges = getAllCharges;
window.deleteCharge = deleteCharge;
window.getHistoricalData = getHistoricalData;
window.getAllHistoricalData = getAllHistoricalData;
window.deleteHistoricalDataById = deleteHistoricalDataById;
