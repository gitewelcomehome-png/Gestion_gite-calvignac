let communauteState = {
    initialized: false,
    userId: null,
    gestionnaire: '',
    artisans: [],
    notes: [],
    selectedArtisanId: null,
    editingArtisanId: null,
    selectedMetiers: new Set(),
    map: null,
    markers: []
};

const COMMUNAUTE_BASE_METIERS = [
    'Architecte',
    'Carreleur',
    'Charpentier',
    'Chauffagiste',
    'Couvreur',
    'Diagnostiqueur immobilier',
    'Domoticien',
    'Ébéniste',
    'Électricien',
    'Élagueur',
    'Entreprise de nettoyage',
    'Expert assurance habitation',
    'Expert comptable location saisonnière',
    'Expert DPE',
    'Expert énergie',
    'Expert juridique immobilier',
    'Façadier',
    'Ferronnier',
    'Frigoriste',
    'Géomètre',
    'Installateur alarme',
    'Installateur piscine',
    'Jardinier paysagiste',
    'Maçon',
    'Menuisier',
    'Peintre',
    'Pisciniste',
    'Plâtrier',
    'Plombier',
    'Ramoneur',
    'Serrurier',
    'Spécialiste traitement anti-nuisibles',
    'Storiste',
    'Technicien électroménager',
    'Terrassier',
    'Vitrier'
].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

function communauteNotify(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
    }
    alert(message);
}

function communauteSafe(value) {
    const txt = value == null ? '' : String(value);
    if (window.SecurityUtils && typeof window.SecurityUtils.sanitizeText === 'function') {
        return window.SecurityUtils.sanitizeText(txt);
    }
    const div = document.createElement('div');
    div.textContent = txt;
    return div.innerHTML;
}

function communauteStars(avg) {
    if (!avg || Number.isNaN(avg)) {
        return '☆☆☆☆☆';
    }
    const rounded = Math.round(avg);
    return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
}

function communauteRenderMetiersSelect() {
    const select = document.getElementById('communauteMetier');
    if (!select) return;

    const options = COMMUNAUTE_BASE_METIERS
        .map((metier) => `<option value="${communauteSafe(metier)}">${communauteSafe(metier)}</option>`)
        .join('');

    select.innerHTML = `<option value="">Choisir un métier / expert</option>${options}`;
}

function communauteGetFilteredArtisans() {
    const artisans = communauteBuildStats();
    if (!communauteState.selectedMetiers.size) {
        return artisans;
    }

    return artisans.filter((artisan) => communauteState.selectedMetiers.has(artisan.metier));
}

function communauteRenderMetierFilters() {
    const container = document.getElementById('communauteMetierFilters');
    if (!container) return;

    const counts = new Map();
    communauteState.artisans.forEach((artisan) => {
        if (!artisan.metier) return;
        counts.set(artisan.metier, (counts.get(artisan.metier) || 0) + 1);
    });

    const html = `
        <div class="communaute-filter-header">
            <span>Filtrer par métier / expert</span>
            <button type="button" class="communaute-filter-reset" id="communauteResetFilters">Réinitialiser</button>
        </div>
        <div class="communaute-filter-grid">
            ${COMMUNAUTE_BASE_METIERS.map((metier) => {
                const checked = communauteState.selectedMetiers.has(metier) ? 'checked' : '';
                const count = counts.get(metier) || 0;
                return `
                    <label class="communaute-filter-item">
                        <input type="checkbox" data-metier="${communauteSafe(metier)}" ${checked}>
                        <span>${communauteSafe(metier)} (${count})</span>
                    </label>
                `;
            }).join('')}
        </div>
    `;

    container.innerHTML = html;

    const resetBtn = document.getElementById('communauteResetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            communauteState.selectedMetiers.clear();
            communauteRenderMetierFilters();
            communauteRenderListAndMap();
        });
    }

    container.querySelectorAll('input[type="checkbox"][data-metier]').forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
            const metier = checkbox.dataset.metier;
            if (!metier) return;

            if (checkbox.checked) {
                communauteState.selectedMetiers.add(metier);
            } else {
                communauteState.selectedMetiers.delete(metier);
            }

            communauteRenderListAndMap();
        });
    });
}

function communauteBuildStats() {
    const notesByArtisan = new Map();
    communauteState.notes.forEach((note) => {
        if (!notesByArtisan.has(note.artisan_id)) {
            notesByArtisan.set(note.artisan_id, []);
        }
        notesByArtisan.get(note.artisan_id).push(note);
    });

    return communauteState.artisans.map((artisan) => {
        const artisanNotes = notesByArtisan.get(artisan.id) || [];
        const total = artisanNotes.reduce((sum, n) => sum + (Number(n.note) || 0), 0);
        const average = artisanNotes.length ? (total / artisanNotes.length) : 0;
        const myNote = artisanNotes.find((n) => n.owner_user_id === communauteState.userId) || null;
        return {
            ...artisan,
            notes: artisanNotes,
            noteMoyenne: average,
            nbNotes: artisanNotes.length,
            myNote
        };
    });
}

function communauteRenderGestionnaire() {
    const input = document.getElementById('communauteGestionnaire');
    if (!input) return;
    input.value = communauteState.gestionnaire || 'Gérant';
}

async function communauteGeocodeAdresse(adresse) {
    const adresseTrim = (adresse || '').trim();
    if (!adresseTrim) {
        communauteNotify('Veuillez saisir une adresse artisan.', 'warning');
        return null;
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 1100));
        const query = encodeURIComponent(`${adresseTrim}, France`);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&addressdetails=1`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'GestionGiteCalvignac/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur géocodage HTTP ${response.status}`);
        }

        const results = await response.json();
        if (!Array.isArray(results) || !results.length) {
            communauteNotify('Adresse non trouvée. Vérifiez le format.', 'warning');
            return null;
        }

        const lat = Number(results[0].lat);
        const lng = Number(results[0].lon);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            communauteNotify('Coordonnées GPS invalides pour cette adresse.', 'warning');
            return null;
        }

        const latField = document.getElementById('communauteLat');
        const lngField = document.getElementById('communauteLng');
        if (latField) latField.value = lat.toFixed(6);
        if (lngField) lngField.value = lng.toFixed(6);

        return { lat, lng };
    } catch (error) {
        console.error('Erreur géocodage adresse artisan:', error);
        communauteNotify('Impossible de calculer les coordonnées GPS.', 'error');
        return null;
    }
}

async function communauteLoadData() {
    const [{ data: artisans, error: artisansError }, { data: notes, error: notesError }] = await Promise.all([
        window.supabaseClient
            .from('community_artisans')
            .select('*')
            .order('created_at', { ascending: false }),
        window.supabaseClient
            .from('community_artisan_notes')
            .select('*')
            .order('updated_at', { ascending: false })
    ]);

    if (artisansError) throw artisansError;
    if (notesError) throw notesError;

    communauteState.artisans = artisans || [];
    communauteState.notes = notes || [];
}

function communauteEnsureMap() {
    const mapEl = document.getElementById('communauteMap');
    if (!mapEl || !window.L) return;

    if (!communauteState.map) {
        communauteState.map = L.map('communauteMap').setView([44.4753, 1.8322], 9);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(communauteState.map);
    }

    setTimeout(() => communauteState.map.invalidateSize(), 120);
}

function communauteRenderListAndMap() {
    const listEl = document.getElementById('communauteArtisansList');
    const totalEl = document.getElementById('communauteTotalArtisans');
    if (!listEl) return;

    const artisans = communauteGetFilteredArtisans();
    if (totalEl) totalEl.textContent = String(artisans.length);

    communauteRenderMetierFilters();

    if (!artisans.length) {
        listEl.innerHTML = '<div class="communaute-detail-empty">Aucun artisan pour le moment.</div>';
    } else {
        listEl.innerHTML = artisans.map((a) => {
            const activeClass = a.id === communauteState.selectedArtisanId ? 'active' : '';
            const ratingText = a.nbNotes ? `${a.noteMoyenne.toFixed(1)}/5 (${a.nbNotes})` : 'Pas encore de note';
            return `
                <div class="communaute-artisan-item ${activeClass}" data-artisan-id="${a.id}">
                    <div class="communaute-artisan-title">${communauteSafe(a.nom)}</div>
                    <div class="communaute-artisan-meta">${communauteSafe(a.metier)} • ${communauteSafe(a.ville || 'Ville non renseignée')}</div>
                    <div class="communaute-rating">${communauteStars(a.noteMoyenne)} ${communauteSafe(ratingText)}</div>
                </div>
            `;
        }).join('');
    }

    if (communauteState.map) {
        communauteState.markers.forEach((m) => m.remove());
        communauteState.markers = [];

        artisans.forEach((artisan) => {
            if (!Number.isFinite(Number(artisan.latitude)) || !Number.isFinite(Number(artisan.longitude))) {
                return;
            }

            const marker = L.marker([Number(artisan.latitude), Number(artisan.longitude)]).addTo(communauteState.map);
            const popup = `
                <strong>${communauteSafe(artisan.nom)}</strong><br>
                ${communauteSafe(artisan.metier)}<br>
                ${artisan.nbNotes ? `${communauteSafe(artisan.noteMoyenne.toFixed(1))}/5` : 'Pas de note'}
            `;
            marker.bindPopup(popup);
            marker.on('click', () => {
                communauteState.selectedArtisanId = artisan.id;
                communauteRenderDetail();
                communauteRenderListAndMap();
            });
            communauteState.markers.push(marker);
        });

        if (communauteState.markers.length) {
            const group = L.featureGroup(communauteState.markers);
            communauteState.map.fitBounds(group.getBounds().pad(0.15));
        }
    }

    listEl.querySelectorAll('.communaute-artisan-item').forEach((item) => {
        item.addEventListener('click', () => {
            communauteState.selectedArtisanId = item.dataset.artisanId;
            communauteRenderDetail();
            communauteRenderListAndMap();
        });
    });

    if (communauteState.selectedArtisanId && !artisans.some((a) => a.id === communauteState.selectedArtisanId)) {
        communauteState.selectedArtisanId = null;
    }

    if (!communauteState.selectedArtisanId && artisans.length) {
        communauteState.selectedArtisanId = artisans[0].id;
        communauteRenderDetail();
        communauteRenderListAndMap();
    }
}

function communauteRenderDetail() {
    const detailEl = document.getElementById('communauteArtisanDetail');
    if (!detailEl) return;

    const artisans = communauteBuildStats();
    const artisan = artisans.find((a) => a.id === communauteState.selectedArtisanId);

    if (!artisan) {
        detailEl.innerHTML = 'Sélectionnez un artisan sur la carte ou la liste.';
        return;
    }

    const comments = artisan.notes
        .filter((n) => (n.commentaire || '').trim().length > 0)
        .map((n) => `<div class="communaute-comment-item"><strong>${n.note}/5</strong> — ${communauteSafe(n.commentaire)}</div>`)
        .join('');

    const canManage = artisan.owner_user_id === communauteState.userId;

    detailEl.innerHTML = `
        <div>
            <h4 style="margin: 0 0 6px 0;">${communauteSafe(artisan.nom)}</h4>
            <div class="communaute-artisan-meta">${communauteSafe(artisan.metier)} • ${communauteSafe(artisan.ville || 'Ville non renseignée')}</div>
            <div class="communaute-rating" style="margin-top:8px;">${communauteStars(artisan.noteMoyenne)} ${artisan.nbNotes ? `${communauteSafe(artisan.noteMoyenne.toFixed(1))}/5 (${artisan.nbNotes} avis)` : 'Pas encore de note'}</div>
            ${artisan.telephone ? `<div style="margin-top:8px;"><a href="tel:${communauteSafe(artisan.telephone)}">${communauteSafe(artisan.telephone)}</a></div>` : ''}
            ${artisan.adresse ? `<div style="margin-top:8px;">📍 ${communauteSafe(artisan.adresse)}</div>` : ''}
            ${artisan.description ? `<p style="margin-top:10px;">${communauteSafe(artisan.description)}</p>` : ''}
        </div>

        ${canManage ? `
            <div style="display:flex; gap:8px; margin-top:12px;">
                <button type="button" class="btn" id="communauteEditArtisanBtn">Modifier cet artisan</button>
                <button type="button" class="btn" id="communauteDeleteArtisanBtn">Supprimer cet artisan</button>
            </div>
        ` : ''}

        <form id="communauteRatingForm" data-artisan-id="${artisan.id}">
            <label for="communauteMyRating">Votre note</label>
            <select id="communauteMyRating" required>
                <option value="">Choisir</option>
                <option value="1" ${artisan.myNote?.note === 1 ? 'selected' : ''}>1 étoile</option>
                <option value="2" ${artisan.myNote?.note === 2 ? 'selected' : ''}>2 étoiles</option>
                <option value="3" ${artisan.myNote?.note === 3 ? 'selected' : ''}>3 étoiles</option>
                <option value="4" ${artisan.myNote?.note === 4 ? 'selected' : ''}>4 étoiles</option>
                <option value="5" ${artisan.myNote?.note === 5 ? 'selected' : ''}>5 étoiles</option>
            </select>
            <label for="communauteMyComment">Votre commentaire</label>
            <textarea id="communauteMyComment" rows="3" maxlength="2000" placeholder="Votre retour d'expérience...">${communauteSafe(artisan.myNote?.commentaire || '')}</textarea>
            <button type="submit" class="btn btn--primary">${artisan.myNote ? 'Mettre à jour ma note' : 'Enregistrer ma note'}</button>
        </form>

        <div class="communaute-comments">
            <strong>Commentaires</strong>
            ${comments || '<div class="communaute-detail-empty">Aucun commentaire pour le moment.</div>'}
        </div>
    `;

    const ratingForm = document.getElementById('communauteRatingForm');
    if (ratingForm) {
        ratingForm.addEventListener('submit', communauteHandleRatingSubmit);
    }

    if (canManage) {
        const editBtn = document.getElementById('communauteEditArtisanBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => communauteStartEditArtisan(artisan.id));
        }

        const deleteBtn = document.getElementById('communauteDeleteArtisanBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => communauteDeleteArtisan(artisan.id));
        }
    }
}

function communauteStartEditArtisan(artisanId) {
    const artisan = communauteState.artisans.find((item) => item.id === artisanId);
    if (!artisan) return;
    if (artisan.owner_user_id !== communauteState.userId) {
        communauteNotify('Vous ne pouvez modifier que vos propres artisans.', 'warning');
        return;
    }

    communauteState.editingArtisanId = artisan.id;

    const nomField = document.getElementById('communauteNom');
    const metierField = document.getElementById('communauteMetier');
    const telField = document.getElementById('communauteTelephone');
    const villeField = document.getElementById('communauteVille');
    const adresseField = document.getElementById('communauteAdresse');
    const latField = document.getElementById('communauteLat');
    const lngField = document.getElementById('communauteLng');
    const descriptionField = document.getElementById('communauteDescription');

    if (nomField) nomField.value = artisan.nom || '';
    if (metierField) metierField.value = artisan.metier || '';
    if (telField) telField.value = artisan.telephone || '';
    if (villeField) villeField.value = artisan.ville || '';
    if (adresseField) adresseField.value = artisan.adresse || '';
    if (latField) latField.value = artisan.latitude || '';
    if (lngField) lngField.value = artisan.longitude || '';
    if (descriptionField) descriptionField.value = artisan.description || '';

    const submitBtn = document.querySelector('#communauteArtisanForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i data-lucide="save"></i> Enregistrer les modifications';
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    communauteNotify('Mode édition activé.', 'info');
}

function communauteResetArtisanForm() {
    communauteState.editingArtisanId = null;
    const form = document.getElementById('communauteArtisanForm');
    if (form) form.reset();
    communauteRenderGestionnaire();
    communauteRenderMetiersSelect();

    const submitBtn = document.querySelector('#communauteArtisanForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i data-lucide="plus"></i> Créer l\'artisan';
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

async function communauteDeleteArtisan(artisanId) {
    const artisan = communauteState.artisans.find((item) => item.id === artisanId);
    if (!artisan) return;
    if (artisan.owner_user_id !== communauteState.userId) {
        communauteNotify('Vous ne pouvez supprimer que vos propres artisans.', 'warning');
        return;
    }

    const confirmation = confirm(`Supprimer définitivement l'artisan "${artisan.nom}" ?`);
    if (!confirmation) return;

    try {
        const { error } = await window.supabaseClient
            .from('community_artisans')
            .delete()
            .eq('id', artisan.id)
            .eq('owner_user_id', communauteState.userId);

        if (error) throw error;

        if (communauteState.selectedArtisanId === artisan.id) {
            communauteState.selectedArtisanId = null;
        }
        if (communauteState.editingArtisanId === artisan.id) {
            communauteResetArtisanForm();
        }

        await communauteReload();
        communauteRenderDetail();
        communauteNotify('Artisan supprimé.', 'success');
    } catch (error) {
        console.error('Erreur suppression artisan:', error);
        communauteNotify('Impossible de supprimer cet artisan.', 'error');
    }
}

async function communauteHandleAddArtisan(event) {
    event.preventDefault();

    try {
        const wasEditing = Boolean(communauteState.editingArtisanId);
        const adresse = document.getElementById('communauteAdresse').value.trim();
        let latitude = Number(document.getElementById('communauteLat').value);
        let longitude = Number(document.getElementById('communauteLng').value);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            const coords = await communauteGeocodeAdresse(adresse);
            if (!coords) {
                return;
            }
            latitude = coords.lat;
            longitude = coords.lng;
        }

        const payload = {
            owner_user_id: communauteState.userId,
            creator_gite_id: null,
            nom: document.getElementById('communauteNom').value.trim(),
            metier: document.getElementById('communauteMetier').value.trim(),
            telephone: document.getElementById('communauteTelephone').value.trim() || null,
            ville: document.getElementById('communauteVille').value.trim() || null,
            adresse: adresse || null,
            latitude,
            longitude,
            description: document.getElementById('communauteDescription').value.trim() || null
        };

        if (!payload.nom || !payload.metier || !payload.adresse || !Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
            communauteNotify('Veuillez compléter les champs obligatoires.', 'warning');
            return;
        }

        let insertedArtisan = null;

        if (wasEditing) {
            const { data: updatedArtisan, error: artisanError } = await window.supabaseClient
                .from('community_artisans')
                .update(payload)
                .eq('id', communauteState.editingArtisanId)
                .eq('owner_user_id', communauteState.userId)
                .select('*')
                .single();

            if (artisanError) throw artisanError;
            insertedArtisan = updatedArtisan;
        } else {
            const { data: createdArtisan, error: artisanError } = await window.supabaseClient
                .from('community_artisans')
                .insert(payload)
                .select('*')
                .single();

            if (artisanError) throw artisanError;
            insertedArtisan = createdArtisan;
        }

        const initialNoteValue = document.getElementById('communauteNoteInitiale').value;
        const initialComment = document.getElementById('communauteCommentaireInitial').value.trim();
        const initialNote = Number(initialNoteValue);

        if (!wasEditing && Number.isInteger(initialNote) && initialNote >= 1 && initialNote <= 5) {
            const { error: noteError } = await window.supabaseClient
                .from('community_artisan_notes')
                .insert({
                    artisan_id: insertedArtisan.id,
                    owner_user_id: communauteState.userId,
                    note: initialNote,
                    commentaire: initialComment || null
                });

            if (noteError) throw noteError;
        }

        communauteResetArtisanForm();

        await communauteReload();
        communauteState.selectedArtisanId = insertedArtisan.id;
        communauteRenderDetail();
        communauteNotify(wasEditing ? 'Artisan modifié.' : 'Artisan ajouté à la communauté.', 'success');
    } catch (error) {
        console.error('Erreur ajout artisan:', error);
        communauteNotify('Erreur lors de la création de l\'artisan.', 'error');
    }
}

async function communauteHandleRatingSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const artisanId = form.dataset.artisanId;
    const ratingValue = Number(document.getElementById('communauteMyRating').value);
    const comment = document.getElementById('communauteMyComment').value.trim();

    if (!artisanId || !Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        communauteNotify('Veuillez choisir une note entre 1 et 5.', 'warning');
        return;
    }

    try {
        const { error } = await window.supabaseClient
            .from('community_artisan_notes')
            .upsert({
                artisan_id: artisanId,
                owner_user_id: communauteState.userId,
                note: ratingValue,
                commentaire: comment || null,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'artisan_id,owner_user_id'
            });

        if (error) throw error;

        await communauteReload();
        communauteState.selectedArtisanId = artisanId;
        communauteRenderDetail();
        communauteNotify('Votre note a été enregistrée.', 'success');
    } catch (error) {
        console.error('Erreur enregistrement note:', error);
        communauteNotify('Impossible d\'enregistrer la note.', 'error');
    }
}

async function communauteReload() {
    await communauteLoadData();
    communauteRenderListAndMap();
}

async function initCommunauteTab() {
    try {
        const { data: authData, error: authError } = await window.supabaseClient.auth.getUser();
        if (authError) throw authError;

        const user = authData?.user;
        if (!user) {
            communauteNotify('Utilisateur non connecté.', 'error');
            return;
        }

        communauteState.userId = user.id;
        communauteState.gestionnaire = user.user_metadata?.full_name
            || user.user_metadata?.name
            || user.email?.split('@')[0]
            || 'Gérant';

        communauteEnsureMap();
        communauteRenderGestionnaire();
        communauteRenderMetiersSelect();
        await communauteReload();

        const form = document.getElementById('communauteArtisanForm');
        if (form && !form.dataset.bound) {
            form.addEventListener('submit', communauteHandleAddArtisan);
            form.dataset.bound = 'true';
        }

        const geocodeBtn = document.getElementById('communauteGeocodeBtn');
        if (geocodeBtn && !geocodeBtn.dataset.bound) {
            geocodeBtn.addEventListener('click', async () => {
                const adresse = document.getElementById('communauteAdresse')?.value || '';
                await communauteGeocodeAdresse(adresse);
            });
            geocodeBtn.dataset.bound = 'true';
        }

        communauteState.initialized = true;
    } catch (error) {
        console.error('Erreur init communauté:', error);
        communauteNotify('Impossible de charger l\'onglet communauté.', 'error');
    }
}

window.initCommunauteTab = initCommunauteTab;
