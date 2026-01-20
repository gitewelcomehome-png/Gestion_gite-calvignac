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
        
        // Récupérer l'utilisateur connecté
        const { data: userData } = await window.supabaseClient.auth.getUser();
        if (!userData?.user?.id) {
            throw new Error('Utilisateur non authentifié');
        }

        const data = {
            owner_user_id: userData.user.id,
            gite_id: reservation.gite || reservation.giteId,
            check_in: formatDateForSupabase(reservation.dateDebut),
            check_out: formatDateForSupabase(reservation.dateFin),
            platform: reservation.site || reservation.plateforme || 'other',
            total_price: parseFloat(reservation.montant) || 0,
            client_name: reservation.nom || reservation.nomClient || 'Client',
            client_phone: reservation.telephone || null,
            client_email: reservation.email || null,
            client_address: reservation.provenance || null,
            guest_count: reservation.nbPersonnes || 1,
            paid_amount: parseFloat(reservation.acompte) || 0,
            notes: reservation.notes || null,
            status: reservation.status || 'confirmed',
            source: reservation.syncedFrom ? 'ical' : 'manual',
            synced_from: reservation.syncedFrom || null
        };
        
        if (!data.check_in || !data.check_out) {
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
            .order('check_in', { ascending: true });
        
        if (result.error) throw result.error;
        
        // Convertir snake_case en camelCase pour compatibilité
        const reservations = (result.data || []).map(function(r) {
            return {
                id: r.id,
                gite_id: r.gite_id,
                giteId: r.gite_id,
                check_in: r.check_in,
                check_out: r.check_out,
                dateDebut: r.check_in,
                dateFin: r.check_out,
                platform: r.platform,
                site: r.platform,
                plateforme: r.platform,
                total_price: r.total_price,
                montant: r.total_price,
                client_name: r.client_name,
                nom: r.client_name,
                nomClient: r.client_name,
                client_phone: r.client_phone,
                telephone: r.client_phone,
                client_email: r.client_email,
                email: r.client_email,
                client_address: r.client_address,
                provenance: r.client_address,
                guest_count: r.guest_count,
                nbPersonnes: r.guest_count,
                paid_amount: r.paid_amount,
                acompte: r.paid_amount,
                restant: (r.total_price || 0) - (r.paid_amount || 0),
                paiement: r.paid_amount >= r.total_price ? 'Payé' : 'En attente',
                status: r.status,
                nuits: window.calculateNights(r.check_in, r.check_out),
                timestamp: r.created_at,
                syncedFrom: r.synced_from
            };
        }).filter(function(r) {
            // Garder toutes les réservations réelles (>= 1 nuit)
            return r.nuits >= 1;
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
        if (updates.gite !== undefined) data.gite_id = updates.gite;
        if (updates.giteId !== undefined) data.gite_id = updates.giteId;
        if (updates.dateDebut !== undefined) data.check_in = updates.dateDebut;
        if (updates.dateFin !== undefined) data.check_out = updates.dateFin;
        if (updates.site !== undefined) data.platform = updates.site;
        if (updates.plateforme !== undefined) data.platform = updates.plateforme;
        if (updates.montant !== undefined) data.total_price = parseFloat(updates.montant);
        if (updates.nom !== undefined) data.client_name = updates.nom;
        if (updates.nomClient !== undefined) data.client_name = updates.nomClient;
        if (updates.telephone !== undefined) data.client_phone = updates.telephone;
        if (updates.email !== undefined) data.client_email = updates.email;
        if (updates.provenance !== undefined) data.client_address = updates.provenance;
        if (updates.nbPersonnes !== undefined) data.guest_count = updates.nbPersonnes;
        if (updates.acompte !== undefined) data.paid_amount = parseFloat(updates.acompte);
        if (updates.status !== undefined) data.status = updates.status;
        if (updates.paiement !== undefined) data.paiement = updates.paiement;
        
        // 🛡️ PROTECTION : Si l'utilisateur modifie manuellement une réservation,
        // marquer manual_override = true pour la protéger des syncs iCal
        data.manual_override = true;
        
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
