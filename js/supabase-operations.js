// ==========================================
// FONCTIONS SUPABASE - RÉSERVATIONS ET CHARGES
// ==========================================

// Note: Dépend de shared-utils.js et shared-config.js

// ==========================================
// RÉSERVATIONS
// ==========================================

function parseYmdLocal(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
}

function formatYmdLocal(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateFrFromYmd(dateStr) {
    const date = parseYmdLocal(dateStr);
    if (!date) return dateStr || '-';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const reservationsUpdateSchemaSupport = {
    paiement: true,
    manual_override: true,
    client_name: true,
    nom: true,
    client_phone: true,
    telephone: true
};

function isMissingOrForbiddenColumn(errorMessage, columnName) {
    const msg = (errorMessage || '').toLowerCase();
    const col = (columnName || '').toLowerCase();
    if (!msg || !col) return false;
    const mentionsColumn = msg.includes(col);
    if (!mentionsColumn) return false;
    return msg.includes('does not exist')
        || msg.includes('could not find')
        || msg.includes('schema cache')
        || msg.includes('unknown column')
        || msg.includes('permission denied');
}

function isAutoCleaningConflictEnabled() {
    try {
        return localStorage.getItem('auto_cleaning_conflict_enabled') !== '0';
    } catch (_) {
        return true;
    }
}

function buildAutoConflictNote({ newReservationId, oldReservationId, oldDate, beforeDate, afterDate }) {
    const meta = `meta:new=${newReservationId};old=${oldReservationId};oldDate=${oldDate};before=${beforeDate};after=${afterDate}`;
    const human = [
        `Ancienne date supprimée: ${formatDateFrFromYmd(oldDate)}`,
        `Nouvelles dates proposées: avant réservation ${formatDateFrFromYmd(beforeDate)} (matin) | après réservation ${formatDateFrFromYmd(afterDate)} (matin)`
    ].join(' | ');
    return `[AUTO_CLEANING_CONFLICT] ${meta} | ${human}`;
}

function parseAutoConflictMeta(notes) {
    if (!notes || typeof notes !== 'string' || !notes.includes('[AUTO_CLEANING_CONFLICT]')) return null;
    const marker = 'meta:';
    const metaStart = notes.indexOf(marker);
    if (metaStart === -1) return null;
    const metaPart = notes.slice(metaStart + marker.length).split('|')[0].trim();
    const values = {};
    metaPart.split(';').forEach(part => {
        const [key, value] = part.split('=');
        if (key && value) values[key.trim()] = value.trim();
    });
    return {
        newReservationId: values.new || null,
        oldReservationId: values.old || null,
        oldDate: values.oldDate || null,
        beforeDate: values.before || null,
        afterDate: values.after || null
    };
}

function notifyAutoCleaningConflict(message, type = 'warning') {
    let displayed = false;
    try {
        const hasNativeToast = typeof document !== 'undefined' && !!document.getElementById('toast') && typeof window.showToast === 'function';
        if (hasNativeToast) {
            window.showToast(message, type);
            displayed = true;
        }

        if (!displayed && typeof document !== 'undefined' && document.body) {
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.position = 'fixed';
            toast.style.right = '20px';
            toast.style.bottom = '20px';
            toast.style.zIndex = '100000';
            toast.style.padding = '12px 14px';
            toast.style.borderRadius = '10px';
            toast.style.color = '#fff';
            toast.style.fontSize = '0.9rem';
            toast.style.fontWeight = '600';
            toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
            toast.style.background = type === 'error' ? '#e74c3c' : (type === 'warning' ? '#f39c12' : '#27ae60');
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(8px)';
            toast.style.transition = 'opacity 160ms ease, transform 160ms ease';

            document.body.appendChild(toast);
            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            });

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(8px)';
                setTimeout(() => toast.remove(), 180);
            }, 3600);

            displayed = true;
        }

        if (!displayed && typeof window !== 'undefined' && typeof window.alert === 'function') {
            window.alert(message);
            displayed = true;
        }

        if (!displayed) {
            console.info('[AUTO_CLEANING_CONFLICT]', message);
        }
    } catch (_) {
        try {
            if (typeof window !== 'undefined' && typeof window.alert === 'function') {
                window.alert(message);
            } else {
                console.info('[AUTO_CLEANING_CONFLICT]', message);
            }
        } catch (__){
            // no-op
        }
    }
}

function pushPersistentOwnerNotification({ title, message, data }) {
    try {
        if (window.notificationSystem && typeof window.notificationSystem.addNotification === 'function') {
            window.notificationSystem.addNotification({
                type: 'menage_conflict',
                title,
                message,
                data: data || {},
                timestamp: new Date()
            });
            return;
        }

        const stored = localStorage.getItem('notifications');
        const notifications = stored ? JSON.parse(stored) : [];
        const notifId = `menage_conflict_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        notifications.unshift({
            id: notifId,
            type: 'menage_conflict',
            title,
            message,
            data: data || {},
            timestamp: new Date().toISOString(),
            read: false
        });

        localStorage.setItem('notifications', JSON.stringify(notifications.slice(0, 50)));

        if (window.notificationSystem && typeof window.notificationSystem.loadNotifications === 'function') {
            window.notificationSystem.loadNotifications();
            window.notificationSystem.updateBadge();
        }
    } catch (_) {
        // no-op
    }
}

async function autoResolveCleaningConflictForReservation(reservationId) {
    try {
        if (!isAutoCleaningConflictEnabled()) {
            return { resolved: 0, skipped: 'disabled' };
        }

        if (!reservationId) return { resolved: 0 };

        const { data: newReservation, error: reservationError } = await window.supabaseClient
            .from('reservations')
            .select('id, owner_user_id, gite_id, check_in, check_out')
            .eq('id', reservationId)
            .single();

        if (reservationError || !newReservation?.gite_id || !newReservation?.check_in || !newReservation?.check_out) {
            return { resolved: 0 };
        }

        const { data: conflictingCleanings, error: conflictError } = await window.supabaseClient
            .from('cleaning_schedule')
            .select('id, owner_user_id, reservation_id, gite_id, scheduled_date, status, reservation_end, reservation_start_after')
            .eq('gite_id', newReservation.gite_id)
            .neq('reservation_id', newReservation.id)
            .gt('scheduled_date', newReservation.check_in)
            .lt('scheduled_date', newReservation.check_out)
            .neq('status', 'refused');

        if (conflictError || !conflictingCleanings || conflictingCleanings.length === 0) {
            return { resolved: 0 };
        }

        const beforeDate = newReservation.check_in;
        const afterDate = newReservation.check_out;

        let resolved = 0;

        for (const conflict of conflictingCleanings) {
            if (!conflict?.reservation_id) continue;

            const warningNote = buildAutoConflictNote({
                newReservationId: newReservation.id,
                oldReservationId: conflict.reservation_id,
                oldDate: conflict.scheduled_date,
                beforeDate,
                afterDate
            });

            await window.supabaseClient
                .from('cleaning_schedule')
                .delete()
                .eq('id', conflict.id);

            await window.supabaseClient
                .from('cleaning_schedule')
                .upsert({
                    owner_user_id: conflict.owner_user_id || newReservation.owner_user_id,
                    reservation_id: conflict.reservation_id,
                    gite_id: conflict.gite_id || newReservation.gite_id,
                    scheduled_date: beforeDate,
                    time_of_day: 'morning',
                    status: 'pending_validation',
                    proposed_by: 'owner',
                    validated_by_company: false,
                    reservation_end: conflict.reservation_end,
                    reservation_start_after: conflict.reservation_start_after,
                    notes: warningNote
                }, { onConflict: 'reservation_id' });

            await window.supabaseClient
                .from('cleaning_schedule')
                .upsert({
                    owner_user_id: newReservation.owner_user_id,
                    reservation_id: newReservation.id,
                    gite_id: newReservation.gite_id,
                    scheduled_date: afterDate,
                    time_of_day: 'morning',
                    status: 'pending_validation',
                    proposed_by: 'owner',
                    validated_by_company: false,
                    reservation_end: newReservation.check_out,
                    reservation_start_after: null,
                    notes: warningNote
                }, { onConflict: 'reservation_id' });

            resolved++;
        }

        if (resolved > 0) {
            notifyAutoCleaningConflict(`⚠️ ${resolved} ménage(s) replanifié(s) automatiquement (conflit nouvelle réservation)`, 'warning');
            pushPersistentOwnerNotification({
                title: '⚠️ Replanification ménage automatique',
                message: `${resolved} ménage(s) replanifié(s) suite à une nouvelle réservation`,
                data: {
                    reservationId: newReservation.id,
                    beforeDate,
                    afterDate,
                    resolved
                }
            });
        }

        return {
            resolved,
            beforeDate,
            afterDate
        };
    } catch (error) {
        console.error('❌ Erreur autoResolveCleaningConflictForReservation:', error);
        return { resolved: 0, error };
    }
}

window.autoResolveCleaningConflictForReservation = autoResolveCleaningConflictForReservation;

window.setAutoCleaningConflictEnabled = function(enabled) {
    try {
        localStorage.setItem('auto_cleaning_conflict_enabled', enabled ? '1' : '0');
        return true;
    } catch (error) {
        console.error('❌ Erreur setAutoCleaningConflictEnabled:', error);
        return false;
    }
};

window.rollbackAutoCleaningConflict = async function(newReservationId) {
    try {
        if (!newReservationId) {
            throw new Error('newReservationId requis');
        }

        const { data: newCleaning, error: newCleaningError } = await window.supabaseClient
            .from('cleaning_schedule')
            .select('id, reservation_id, notes')
            .eq('reservation_id', newReservationId)
            .ilike('notes', '%[AUTO_CLEANING_CONFLICT]%')
            .maybeSingle();

        if (newCleaningError || !newCleaning) {
            throw new Error('Aucune replanification auto trouvée pour cette réservation');
        }

        const meta = parseAutoConflictMeta(newCleaning.notes);
        if (!meta?.oldReservationId || !meta?.oldDate) {
            throw new Error('Métadonnées incomplètes pour rollback');
        }

        await window.supabaseClient
            .from('cleaning_schedule')
            .update({
                scheduled_date: meta.oldDate,
                time_of_day: 'afternoon',
                status: 'pending',
                proposed_by: null,
                validated_by_company: false,
                notes: 'Rollback auto conflit ménage appliqué'
            })
            .eq('reservation_id', meta.oldReservationId);

        await window.supabaseClient
            .from('cleaning_schedule')
            .delete()
            .eq('reservation_id', newReservationId)
            .ilike('notes', '%[AUTO_CLEANING_CONFLICT]%');

        window.invalidateCache('reservations');

        notifyAutoCleaningConflict('✅ Rollback conflit ménage appliqué', 'success');
        pushPersistentOwnerNotification({
            title: '✅ Rollback ménage appliqué',
            message: `Ancien ménage restauré au ${formatDateFrFromYmd(meta.oldDate)}`,
            data: {
                reservationId: newReservationId,
                restoredOldReservationId: meta.oldReservationId,
                restoredDate: meta.oldDate
            }
        });

        return {
            success: true,
            restoredOldReservationId: meta.oldReservationId,
            restoredDate: meta.oldDate,
            deletedNewReservationCleaning: newReservationId
        };
    } catch (error) {
        console.error('❌ Erreur rollbackAutoCleaningConflict:', error);
        return { success: false, error: error.message };
    }
};

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

        await autoResolveCleaningConflictForReservation(result.data.id);
        
        // 🚗 Automatisation des trajets kilométriques
        if (result.data && typeof window.KmManager?.creerTrajetsAutoReservation === 'function') {
            try {
                await window.KmManager.creerTrajetsAutoReservation(result.data);
            } catch (kmError) {
                console.error('⚠️ Erreur création trajets auto:', kmError);
                // Ne pas bloquer la création de réservation si les trajets échouent
            }
        }
        
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
            .neq('status', 'cancelled')
            .order('check_in', { ascending: true });
        
        if (result.error) throw result.error;
        
        // Convertir snake_case en camelCase pour compatibilité
        const reservations = (result.data || []).map(function(r) {
            return {
                id: r.id,
                gite: r.gite || r.gite_name || '',
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
                client_name: r.nom || r.client_name || r.nom_client || '',
                nom: r.nom || r.client_name || r.nom_client || '',
                nomClient: r.nom || r.client_name || r.nom_client || '',
                client_phone: r.telephone || r.client_phone || '',
                telephone: r.telephone || r.client_phone || '',
                client_email: r.client_email || r.email || '',
                email: r.client_email || r.email || '',
                client_address: r.client_address || r.provenance || '',
                provenance: r.client_address || r.provenance || '',
                guest_count: r.guest_count,
                nbPersonnes: r.guest_count,
                paid_amount: r.paid_amount,
                acompte: r.paid_amount,
                restant: (r.total_price || 0) - (r.paid_amount || 0),
                paiement: r.paid_amount >= r.total_price ? 'Payé' : 'En attente',
                status: r.status,
                nuits: window.calculateNights(r.check_in, r.check_out),
                timestamp: r.created_at,
                syncedFrom: r.synced_from,
                check_in_time: r.check_in_time,
                check_out_time: r.check_out_time
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
        // Récupérer la réservation avant mise à jour pour détecter les changements de dates
        const { data: oldResa } = await window.supabaseClient
            .from('reservations')
            .select('check_in, check_out')
            .eq('id', id)
            .single();
        
        function buildUpdatePayload() {
            const payload = {};

            if (updates.gite !== undefined) payload.gite_id = updates.gite;
            if (updates.giteId !== undefined) payload.gite_id = updates.giteId;
            if (updates.dateDebut !== undefined) payload.check_in = updates.dateDebut;
            if (updates.dateFin !== undefined) payload.check_out = updates.dateFin;
            if (updates.site !== undefined) payload.platform = updates.site;
            if (updates.plateforme !== undefined) payload.platform = updates.plateforme;
            if (updates.montant !== undefined) payload.total_price = parseFloat(updates.montant);

            if (updates.nom !== undefined) {
                if (reservationsUpdateSchemaSupport.client_name) {
                    payload.client_name = updates.nom;
                } else if (reservationsUpdateSchemaSupport.nom) {
                    payload.nom = updates.nom;
                }
            }

            if (updates.nomClient !== undefined) {
                if (reservationsUpdateSchemaSupport.client_name) {
                    payload.client_name = updates.nomClient;
                } else if (reservationsUpdateSchemaSupport.nom) {
                    payload.nom = updates.nomClient;
                }
            }

            if (updates.telephone !== undefined) {
                if (reservationsUpdateSchemaSupport.client_phone) {
                    payload.client_phone = updates.telephone;
                } else if (reservationsUpdateSchemaSupport.telephone) {
                    payload.telephone = updates.telephone;
                }
            }
            if (updates.email !== undefined) payload.client_email = updates.email;
            if (updates.provenance !== undefined) payload.client_address = updates.provenance;
            if (updates.nbPersonnes !== undefined) payload.guest_count = updates.nbPersonnes;
            if (updates.acompte !== undefined) payload.paid_amount = parseFloat(updates.acompte);
            if (updates.status !== undefined) payload.status = updates.status;
            if (updates.paiement !== undefined && reservationsUpdateSchemaSupport.paiement) payload.paiement = updates.paiement;

            if (reservationsUpdateSchemaSupport.manual_override) {
                payload.manual_override = true;
            }

            return payload;
        }

        const data = buildUpdatePayload();
        
        async function runUpdate(payload) {
            return window.supabaseClient
                .from('reservations')
                .update(payload)
                .eq('id', id)
                .select('id');
        }

        let result = await runUpdate(data);

        // Fallback schéma: certaines bases n'ont pas toutes les colonnes legacy
        if (result.error && isMissingOrForbiddenColumn(result.error.message, 'paiement')) {
            reservationsUpdateSchemaSupport.paiement = false;
            const retryPayload = buildUpdatePayload();
            delete retryPayload.paiement;
            result = await runUpdate(retryPayload);
        }

        if (result.error && isMissingOrForbiddenColumn(result.error.message, 'manual_override')) {
            reservationsUpdateSchemaSupport.manual_override = false;
            const retryPayload = buildUpdatePayload();
            delete retryPayload.manual_override;
            result = await runUpdate(retryPayload);
        }

        if (result.error && isMissingOrForbiddenColumn(result.error.message, 'nom')) {
            reservationsUpdateSchemaSupport.nom = false;
            reservationsUpdateSchemaSupport.client_name = true;
            const retryPayload = buildUpdatePayload();
            delete retryPayload.nom;
            result = await runUpdate(retryPayload);
        }

        if (result.error && isMissingOrForbiddenColumn(result.error.message, 'client_phone')) {
            reservationsUpdateSchemaSupport.client_phone = false;
            reservationsUpdateSchemaSupport.telephone = true;
            const retryPayload = buildUpdatePayload();
            delete retryPayload.client_phone;
            result = await runUpdate(retryPayload);
        }

        if (result.error && isMissingOrForbiddenColumn(result.error.message, 'telephone')) {
            reservationsUpdateSchemaSupport.telephone = false;
            reservationsUpdateSchemaSupport.client_phone = true;
            const retryPayload = buildUpdatePayload();
            delete retryPayload.telephone;
            result = await runUpdate(retryPayload);
        }

        // Fallback schéma: certaines bases utilisent "nom" au lieu de client_name
        if (result.error && isMissingOrForbiddenColumn(result.error.message, 'client_name')) {
            reservationsUpdateSchemaSupport.client_name = false;
            reservationsUpdateSchemaSupport.nom = true;
            const fallbackPayload = buildUpdatePayload();
            delete fallbackPayload.client_name;
            result = await runUpdate(fallbackPayload);
        }

        if (result.error) throw result.error;
        if (!result.data || result.data.length === 0) {
            throw new Error('Mise à jour non appliquée (ligne introuvable ou non autorisée).');
        }
        
        // 🚗 Si les dates ont changé, recréer les trajets auto
        const datesChanged = (data.check_in && data.check_in !== oldResa?.check_in) || 
                            (data.check_out && data.check_out !== oldResa?.check_out);

        if (datesChanged) {
            await autoResolveCleaningConflictForReservation(id);
        }
        
        if (datesChanged && typeof window.KmManager?.supprimerTrajetsAutoReservation === 'function' &&
            typeof window.KmManager?.creerTrajetsAutoReservation === 'function') {
            try {
                // Supprimer les anciens trajets auto
                await window.KmManager.supprimerTrajetsAutoReservation(id);
                
                // Récupérer la réservation mise à jour
                const { data: updatedResa } = await window.supabaseClient
                    .from('reservations')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (updatedResa) {
                    // Recréer les trajets avec les nouvelles dates
                    await window.KmManager.creerTrajetsAutoReservation(updatedResa);
                }
            } catch (kmError) {
                console.error('⚠️ Erreur mise à jour trajets auto:', kmError);
                // Ne pas bloquer la mise à jour de la réservation
            }
        }
        
        // Invalider le cache
        window.invalidateCache('reservations');
    } catch (error) {
        console.error('Erreur updateReservation:', error);
        throw error;
    }
}

async function deleteReservation(id) {
    try {
        // 🚗 Supprimer d'abord les trajets auto liés à cette réservation
        if (typeof window.KmManager?.supprimerTrajetsAutoReservation === 'function') {
            try {
                await window.KmManager.supprimerTrajetsAutoReservation(id);
            } catch (kmError) {
                console.error('⚠️ Erreur suppression trajets auto:', kmError);
                // Ne pas bloquer la suppression de la réservation
            }
        }
        
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
            .select('*');
        
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
