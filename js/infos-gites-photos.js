/**
 * Gestion des photos pour l'onglet Infos Gîtes
 * Permet aux propriétaires de gîtes d'uploader et gérer les photos de leur fiche client
 */

/**
 * Ouvre la modale de gestion des photos et initialise les icônes Lucide
 */
window.openModalPhotosGite = function() {
    const modal = document.getElementById('modalPhotosGite');
    if (modal) {
        modal.style.display = 'flex';
        // Réinitialiser les icônes Lucide dans la modale
        setTimeout(() => {
            if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
                lucide.createIcons();
            }
        }, 50);
    }
};

// Structure pour stocker les photos en mémoire avant sauvegarde
let tempPhotosData = {
    couverture: null,
    galerie: [],
    boite_cles: [],
    parking: [],
    entree: []
};

/**
 * Sanitize un nom de fichier ou dossier pour Supabase Storage
 * @param {string} name - Nom à nettoyer
 * @returns {string} Nom nettoyé
 */
function sanitizeStorageName(name) {
    return name
        .normalize('NFD')                          // Décompose les caractères accentués
        .replace(/[\u0300-\u036f]/g, '')          // Supprime les accents
        .replace(/[^a-zA-Z0-9._-]/g, '_')         // Remplace les caractères spéciaux par _
        .replace(/_+/g, '_')                       // Évite les _ multiples
        .replace(/^_|_$/g, '');                    // Supprime _ au début/fin
}

/**
 * Gère l'upload d'une photo pour une catégorie donnée
 * @param {Event} event - Événement de changement du input file
 * @param {string} category - Catégorie de photo (couverture, galerie, boite_cles, parking, entree)
 */
async function handlePhotoUploadInfosGites(event, category) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const selectedGite = document.getElementById('giteSelector')?.value;
    if (!selectedGite) {
        showToast('Veuillez d\'abord sélectionner un gîte', 'error');
        return;
    }

    // Vérifier les limites par catégorie
    if (category === 'couverture' && tempPhotosData.couverture) {
        // Supprimer l'ancienne pour permettre le remplacement
        showToast('Remplacement de la photo de couverture...', 'info');
        await deletePhotoFromStorage(tempPhotosData.couverture.path);
        tempPhotosData.couverture = null;
    }
    
    if (category === 'galerie' && tempPhotosData.galerie.length >= 4) {
        showToast('Maximum 4 photos pour la galerie', 'error');
        return;
    }
    
    if ((category === 'boite_cles' || category === 'parking' || category === 'entree') && tempPhotosData[category].length >= 1) {
        // Supprimer l'ancienne pour permettre le remplacement
        const categoryName = category.replace('_', ' ');
        showToast(`Remplacement de la photo ${categoryName}...`, 'info');
        await deletePhotoFromStorage(tempPhotosData[category][0].path);
        tempPhotosData[category] = [];
    }

    try {
        showToast(`Upload en cours...`, 'info');

        for (let file of files) {
            // Validation taille (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast(`${file.name} est trop volumineux (max 5MB)`, 'error');
                continue;
            }

            // Validation type
            if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
                showToast(`${file.name} n'est pas un format valide`, 'error');
                continue;
            }

            // Sanitize gite name et filename pour éviter les erreurs Storage
            const sanitizedGiteName = sanitizeStorageName(selectedGite);
            const sanitizedFileName = sanitizeStorageName(file.name);
            
            // Upload vers Supabase Storage
            const fileName = `${sanitizedGiteName}/${category}/${Date.now()}_${sanitizedFileName}`;
            const { data, error } = await supabaseClient.storage
                .from('gite-photos')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Erreur upload Supabase:', error);
                showToast(`Erreur upload ${file.name}`, 'error');
                continue;
            }

            // Récupérer l'URL publique
            const { data: publicURL } = supabaseClient.storage
                .from('gite-photos')
                .getPublicUrl(fileName);

            const photoInfo = {
                url: publicURL.publicUrl,
                path: fileName,
                uploadedAt: new Date().toISOString()
            };

            // Ajouter à la structure temporaire
            if (category === 'couverture') {
                // Supprimer l'ancienne couverture si elle existe
                if (tempPhotosData.couverture) {
                    await deletePhotoFromStorage(tempPhotosData.couverture.path);
                }
                tempPhotosData.couverture = photoInfo;
            } else {
                tempPhotosData[category].push(photoInfo);
            }
        }

        // Mettre à jour la prévisualisation
        displayPhotoPreviews(category);
        showToast('Photo(s) ajoutée(s) avec succès !', 'success');

        // Sauvegarder automatiquement en BDD
        try {
            await savePhotosToDatabase(selectedGite);
            console.log('💾 Photos sauvegardées automatiquement en BDD');
        } catch (saveErr) {
            console.error('Erreur sauvegarde auto:', saveErr);
            showToast('Photo uploadée mais erreur sauvegarde BDD', 'warning');
        }

    } catch (err) {
        console.error('Erreur handlePhotoUploadInfosGites:', err);
        showToast('Erreur lors de l\'upload', 'error');
    } finally {
        // Réinitialiser l'input
        event.target.value = '';
    }
}

/**
 * Affiche les prévisualisations des photos pour une catégorie
 * @param {string} category - Catégorie de photo
 */
function displayPhotoPreviews(category) {
    const capitalizedCategory = capitalize(category);
    const previewContainer = document.getElementById(`preview${capitalizedCategory}`);
    const gridContainer = document.getElementById(`grid${capitalizedCategory}`);

    console.log(`📸 displayPhotoPreviews(${category}):`, {
        capitalizedCategory,
        previewId: `preview${capitalizedCategory}`,
        gridId: `grid${capitalizedCategory}`,
        previewExists: !!previewContainer,
        gridExists: !!gridContainer,
        data: tempPhotosData[category]
    });

    if (!previewContainer) {
        console.warn(`⚠️ Preview container not found for ${category}`);
        return;
    }

    if (category === 'couverture') {
        if (tempPhotosData.couverture) {
            const img = document.getElementById('imgCouverture');
            if (img) {
                img.src = tempPhotosData.couverture.url;
                previewContainer.style.display = 'block';
                console.log(`✅ Couverture affichée:`, tempPhotosData.couverture.url);
            } else {
                console.error('❌ Element imgCouverture not found');
            }
        } else {
            previewContainer.style.display = 'none';
        }
    } else {
        if (!gridContainer) {
            console.error(`❌ Grid container not found: grid${capitalizedCategory}`);
            return;
        }
        
        if (tempPhotosData[category].length > 0) {
            previewContainer.style.display = 'block';
            gridContainer.innerHTML = tempPhotosData[category].map((photo, index) => `
                <div style="position: relative;">
                    <img src="${photo.url}" 
                         alt="${category} ${index + 1}" 
                         style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <button type="button" 
                            onclick="removePhotoFromGridInfosGites('${category}', ${index})" 
                            style="position: absolute; top: 8px; right: 8px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                        <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                    </button>
                </div>
            `).join('');
            // Réinitialiser les icônes Lucide
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            previewContainer.style.display = 'none';
        }
    }
}

/**
 * Supprime une photo (couverture uniquement)
 * @param {string} category - Catégorie de photo
 */
async function removePhotoInfosGites(category) {
    if (category !== 'couverture') return;

    if (!tempPhotosData.couverture) return;

    const selectedGite = document.getElementById('giteSelector')?.value;
    if (!selectedGite) {
        showToast('Gîte non sélectionné', 'error');
        return;
    }

    try {
        // Supprimer du storage
        await deletePhotoFromStorage(tempPhotosData.couverture.path);
        
        // Supprimer de la structure temporaire
        tempPhotosData.couverture = null;
        
        // Mettre à jour l'affichage
        displayPhotoPreviews(category);
        
        showToast('Photo supprimée', 'success');

        // Sauvegarder automatiquement en BDD
        try {
            await savePhotosToDatabase(selectedGite);
            console.log('💾 Suppression sauvegardée automatiquement en BDD');
        } catch (saveErr) {
            console.error('Erreur sauvegarde auto:', saveErr);
            showToast('Photo supprimée mais erreur sauvegarde BDD', 'warning');
        }
    } catch (err) {
        console.error('Erreur removePhotoInfosGites:', err);
        showToast('Erreur lors de la suppression', 'error');
    }
}

/**
 * Supprime une photo d'une galerie/liste
 * @param {string} category - Catégorie de photo
 * @param {number} index - Index de la photo dans le tableau
 */
async function removePhotoFromGridInfosGites(category, index) {
    if (!tempPhotosData[category] || !tempPhotosData[category][index]) return;

    const selectedGite = document.getElementById('giteSelector')?.value;
    if (!selectedGite) {
        showToast('Gîte non sélectionné', 'error');
        return;
    }

    try {
        // Supprimer du storage
        await deletePhotoFromStorage(tempPhotosData[category][index].path);
        
        // Retirer du tableau
        tempPhotosData[category].splice(index, 1);
        
        // Mettre à jour l'affichage
        displayPhotoPreviews(category);
        
        showToast('Photo supprimée', 'success');

        // Sauvegarder automatiquement en BDD
        try {
            await savePhotosToDatabase(selectedGite);
            console.log('💾 Suppression sauvegardée automatiquement en BDD');
        } catch (saveErr) {
            console.error('Erreur sauvegarde auto:', saveErr);
            showToast('Photo supprimée mais erreur sauvegarde BDD', 'warning');
        }
    } catch (err) {
        console.error('Erreur removePhotoFromGridInfosGites:', err);
        showToast('Erreur lors de la suppression', 'error');
    }
}

/**
 * Supprime un fichier du Supabase Storage
 * @param {string} path - Chemin du fichier dans le storage
 */
async function deletePhotoFromStorage(path) {
    try {
        const { error } = await supabaseClient.storage
            .from('gite-photos')
            .remove([path]);

        if (error) {
            console.error('Erreur suppression Supabase:', error);
            throw error;
        }
    } catch (err) {
        console.error('Erreur deletePhotoFromStorage:', err);
        throw err;
    }
}

/**
 * Charge les photos existantes depuis la base de données
 * @param {string} giteName - Nom du gîte
 */
async function loadExistingPhotos(giteName) {
    console.log(`🔄 loadExistingPhotos(${giteName})`);
    
    try {
        const { data, error } = await supabaseClient
            .from('infos_gites')
            .select('photos')
            .eq('gite', giteName.toLowerCase())
            .maybeSingle();

        console.log(`📥 Résultat chargement photos:`, { data, error });

        if (error) {
            console.error('Erreur chargement photos:', error);
            return;
        }

        if (data && data.photos) {
            console.log(`✅ Photos trouvées:`, data.photos);
            
            // Charger dans la structure temporaire
            tempPhotosData = {
                couverture: data.photos.couverture || null,
                galerie: data.photos.galerie || [],
                boite_cles: data.photos.boite_cles || [],
                parking: data.photos.parking || [],
                entree: data.photos.entree || []
            };

            console.log(`📦 tempPhotosData après chargement:`, tempPhotosData);

            // Afficher les prévisualisations
            displayPhotoPreviews('couverture');
            displayPhotoPreviews('galerie');
            displayPhotoPreviews('boite_cles');
            displayPhotoPreviews('parking');
            displayPhotoPreviews('entree');
        } else {
            console.log(`ℹ️ Pas de photos pour ${giteName}, réinitialisation`);
            // Réinitialiser si pas de photos
            resetTempPhotos();
        }
    } catch (err) {
        console.error('Erreur loadExistingPhotos:', err);
    }
}

/**
 * Sauvegarde les photos dans la base de données
 * @param {string} giteName - Nom du gîte
 * @returns {Object} Structure photos JSONB pour la BDD
 */
async function savePhotosToDatabase(giteName) {
    try {
        const photosJSON = {
            couverture: tempPhotosData.couverture,
            galerie: tempPhotosData.galerie,
            boite_cles: tempPhotosData.boite_cles,
            parking: tempPhotosData.parking,
            entree: tempPhotosData.entree
        };

        console.log(`💾 Sauvegarde photos pour ${giteName}:`, photosJSON);

        // Utiliser UPDATE au lieu de UPSERT pour éviter les problèmes RLS
        const { data, error } = await supabaseClient
            .from('infos_gites')
            .update({
                photos: photosJSON,
                date_modification: new Date().toISOString()
            })
            .eq('gite', giteName.toLowerCase())
            .select();

        if (error) {
            console.error('Erreur sauvegarde photos BDD:', error);
            throw error;
        }

        // Si aucune ligne n'a été mise à jour, la ligne n'existe pas encore
        if (!data || data.length === 0) {
            console.warn(`⚠️ Ligne infos_gites non trouvée pour ${giteName}, photos non sauvegardées`);
            // Ne pas throw, juste logger - les photos seront sauvegardées lors du prochain save des infos
            return photosJSON;
        }

        console.log(`✅ Photos sauvegardées avec succès pour ${giteName}`);
        return photosJSON;
    } catch (err) {
        console.error('Erreur savePhotosToDatabase:', err);
        throw err;
    }
}

/**
 * Réinitialise la structure temporaire des photos
 */
function resetTempPhotos() {
    tempPhotosData = {
        couverture: null,
        galerie: [],
        boite_cles: [],
        parking: [],
        entree: []
    };

    // Cacher toutes les prévisualisations
    ['couverture', 'galerie', 'boite_cles', 'parking', 'entree'].forEach(cat => {
        const preview = document.getElementById(`preview${capitalize(cat)}`);
        if (preview) preview.style.display = 'none';
    });
}

/**
 * Capitalise la première lettre et transforme les underscores
 * @param {string} str - String à capitaliser
 * @returns {string} String capitalisée
 */
function capitalize(str) {
    return str.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
}

/**
 * Affiche un toast de notification
 * @param {string} message - Message à afficher
 * @param {string} type - Type (success, error, info)
 */
function showToast(message, type = 'info') {
    // Vérifier si la fonction globale existe
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
    }

    // Fallback simple si pas de fonction toast globale
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Exposer les fonctions au scope global
window.handlePhotoUploadInfosGites = handlePhotoUploadInfosGites;
window.removePhotoInfosGites = removePhotoInfosGites;
window.removePhotoFromGridInfosGites = removePhotoFromGridInfosGites;
window.loadExistingPhotos = loadExistingPhotos;
window.savePhotosToDatabase = savePhotosToDatabase;
window.resetTempPhotos = resetTempPhotos;

// Fonction de debug
window.debugPhotos = function() {
    console.log('====== DEBUG PHOTOS ======');
    console.log('tempPhotosData:', tempPhotosData);
    console.log('Preview elements:');
    ['Couverture', 'Galerie', 'BoiteCles', 'Parking', 'Entree'].forEach(cat => {
        const preview = document.getElementById(`preview${cat}`);
        const grid = document.getElementById(`grid${cat}`);
        console.log(`  ${cat}:`, { 
            previewExists: !!preview, 
            previewVisible: preview?.style.display !== 'none',
            gridExists: !!grid 
        });
    });
    console.log('==========================');
};

console.log('✅ Module infos-gites-photos.js chargé (v1.7)');
