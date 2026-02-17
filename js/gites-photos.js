// ==========================================
// GESTION DES PHOTOS DES GÎTES
// Upload vers Supabase Storage + Sauvegarde des URLs dans la table infos_gites
// ==========================================

// Configuration Supabase Storage
const STORAGE_BUCKET = 'gite-photos';
let currentGitePhotos = {}; // Structure photos du gîte en cours d'édition
let currentGiteName = '';    // Nom du gîte (ex: 'Trevoux')

// ==========================================
// INITIALISATION - Charger les photos existantes
// ==========================================
async function loadGitePhotos(giteName) {
    try {
        currentGiteName = giteName;
        
        const { data, error } = await window.supabaseClient
            .from('infos_gites')
            .select('photos')
            .eq('gite', giteName)
            .single();
        
        if (error) throw error;
        
        currentGitePhotos = data.photos || {
            couverture: null,
            galerie: [],
            boite_cles: [],
            parking: [],
            entree: [],
            autres: []
        };
        
        // Afficher les photos existantes
        displayExistingPhotos();
        
    } catch (error) {
        console.error('Erreur chargement photos:', error);
    }
}

// ==========================================
// AFFICHAGE DES PHOTOS EXISTANTES
// ==========================================
function displayExistingPhotos() {
    // Photo de couverture
    if (currentGitePhotos.couverture) {
        document.getElementById('previewCouverture').style.display = 'block';
        document.getElementById('imgCouverture').src = currentGitePhotos.couverture;
    } else {
        document.getElementById('previewCouverture').style.display = 'none';
    }
    
    // Galerie
    displayPhotoGrid('galerie', currentGitePhotos.galerie);
    
    // Boîte à clés
    displayPhotoGrid('boite_cles', currentGitePhotos.boite_cles);
    
    // Parking
    displayPhotoGrid('parking', currentGitePhotos.parking);
    
    // Entrée
    displayPhotoGrid('entree', currentGitePhotos.entree);
}

// ==========================================
// AFFICHER UNE GRILLE DE PHOTOS
// ==========================================
function displayPhotoGrid(category, photos) {
    const previewId = `preview${category.charAt(0).toUpperCase() + category.slice(1).replace('_', '')}`;
    const container = document.getElementById(previewId);
    
    if (!container) return;
    
    if (!photos || photos.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = photos.map((photo, index) => `
        <div style="position: relative; border: 2px solid #e5e7eb; border-radius: 8px; padding: 5px; background: white;">
            <img src="${typeof photo === 'string' ? photo : photo.url}" 
                 style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px;">
            <button type="button" 
                    onclick="removePhotoFromGrid('${category}', ${index})" 
                    style="position: absolute; top: 8px; right: 8px; background: rgba(239, 68, 68, 0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">
                ✕
            </button>
            ${typeof photo === 'object' && photo.description ? `
                <p style="font-size: 0.75rem; color: #6b7280; margin-top: 4px; line-height: 1.2;">${photo.description}</p>
            ` : ''}
        </div>
    `).join('');
}

// ==========================================
// UPLOAD DE PHOTO(S)
// ==========================================
async function handlePhotoUpload(event, category) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    if (!currentGiteName) {
        alert('Erreur: Nom du gîte non trouvé');
        return;
    }
    
    // Afficher un loader
    showUploadProgress(true);
    
    try {
        // Upload des fichiers vers Supabase Storage
        const uploadedUrls = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentGiteName}/${category}/${Date.now()}_${i}.${fileExt}`;
            
            // Upload vers Supabase Storage
            const { data, error } = await window.supabaseClient.storage
                .from(STORAGE_BUCKET)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) throw error;
            
            // Obtenir l'URL publique
            const { data: urlData } = window.supabaseClient.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(fileName);
            
            uploadedUrls.push(urlData.publicUrl);
        }
        
        // Mettre à jour la structure currentGitePhotos
        if (category === 'couverture') {
            currentGitePhotos.couverture = uploadedUrls[0];
        } else {
            const normalizedCategory = category;
            if (!currentGitePhotos[normalizedCategory]) {
                currentGitePhotos[normalizedCategory] = [];
            }
            currentGitePhotos[normalizedCategory].push(...uploadedUrls);
        }
        
        // Sauvegarder dans la base de données
        await savePhotosToDatabase();
        
        // Réafficher
        displayExistingPhotos();
        
        // Réinitialiser l'input
        event.target.value = '';
        
        showUploadProgress(false);
        showNotification('Photo(s) ajoutée(s) avec succès !', 'success');
        
    } catch (error) {
        console.error('Erreur upload photo:', error);
        showUploadProgress(false);
        showNotification('Erreur lors de l\'upload de la photo', 'error');
    }
}

// ==========================================
// SUPPRIMER UNE PHOTO
// ==========================================
async function removePhoto(category) {
    if (!confirm('Supprimer cette photo ?')) return;
    
    // Supprimer de la structure
    if (category === 'couverture') {
        currentGitePhotos.couverture = null;
    }
    
    // Sauvegarder
    await savePhotosToDatabase();
    displayExistingPhotos();
    showNotification('Photo supprimée', 'success');
}

async function removePhotoFromGrid(category, index) {
    if (!confirm('Supprimer cette photo ?')) return;
    const normalizedCategory = category;
    
    // Supprimer de l'array
    if (currentGitePhotos[normalizedCategory]) {
        currentGitePhotos[normalizedCategory].splice(index, 1);
    }
    
    // Sauvegarder
    await savePhotosToDatabase();
    displayExistingPhotos();
    showNotification('Photo supprimée', 'success');
}

// ==========================================
// SAUVEGARDER LA STRUCTURE PHOTOS EN BDD
// ==========================================
async function savePhotosToDatabase() {
    try {
        const { error } = await window.supabaseClient
            .from('infos_gites')
            .update({ photos: currentGitePhotos })
            .eq('gite', currentGiteName);
        
        if (error) throw error;
        
    } catch (error) {
        console.error('Erreur sauvegarde photos:', error);
        throw error;
    }
}

// ==========================================
// UTILITAIRES UI
// ==========================================
function showUploadProgress(show) {
    // TODO: Ajouter un vrai loader/spinner si besoin
    const btns = document.querySelectorAll('[onclick*="handlePhotoUpload"]');
    btns.forEach(btn => {
        btn.disabled = show;
        btn.innerHTML = show ? '<i data-lucide="loader" class="spin"></i> Upload...' : '<i data-lucide="upload"></i> Choisir une photo';
    });
}

function showNotification(message, type) {
    // Utiliser le système de notification existant si disponible
    if (typeof showAlert === 'function') {
        showAlert(message, type);
    } else {
        alert(message);
    }
}

// ==========================================
// HOOK: Charger les photos à l'ouverture du modal
// ==========================================
// Modifier la fonction editGiteInfo existante pour charger les photos
const originalEditGiteInfo = window.editGiteInfo;
if (originalEditGiteInfo) {
    window.editGiteInfo = async function(gite) {
        await originalEditGiteInfo(gite);
        
        // Charger les photos après ouverture du modal
        if (gite) {
            await loadGitePhotos(gite);
        }
    };
}

// Exposer les fonctions globalement
window.handlePhotoUpload = handlePhotoUpload;
window.removePhoto = removePhoto;
window.removePhotoFromGrid = removePhotoFromGrid;
window.loadGitePhotos = loadGitePhotos;

console.log('✅ Module gites-photos.js chargé');
