/**
 * 🛡️ INITIALISATION VALIDATION FORMULAIRES
 * Phase 4 - Application des règles de validation
 */

// Attendre que ValidationUtils soit chargé
document.addEventListener('DOMContentLoaded', function() {
    if (!window.ValidationUtils) {
        console.error('❌ ValidationUtils non chargé');
        return;
    }
    
    console.log('🛡️ Initialisation validation des formulaires...');
    
    // ==========================================
    // FORMULAIRE ÉDITION RÉSERVATION
    // ==========================================
    const editForm = document.getElementById('editForm');
    if (editForm) {
        // Validation temps réel
        window.ValidationUtils.attachRealtimeValidation('editNom', 'name', { required: true });
        window.ValidationUtils.attachRealtimeValidation('editTelephone', 'phone', { required: false });
        window.ValidationUtils.attachRealtimeValidation('editMontant', 'amount', { required: true });
        window.ValidationUtils.attachRealtimeValidation('editAcompte', 'amount', { required: false });
        window.ValidationUtils.attachRealtimeValidation('editNbPersonnes', 'integer', { required: false });
        
        // Validation à la soumission
        // IMPORTANT: Ce listener doit s'exécuter AVANT celui de reservations.js
        // On utilise capture phase (3ème paramètre = true) pour garantir l'ordre
        editForm.addEventListener('submit', function(e) {
            const rules = {
                editNom: { type: 'name', required: true },
                editTelephone: { type: 'phone', required: false },
                editMontant: { type: 'amount', required: true },
                editAcompte: { type: 'amount', required: false },
                editNbPersonnes: { type: 'integer', required: false }
            };
            
            const validation = window.ValidationUtils.validateForm(this, rules);
            
            if (!validation.valid) {
                e.preventDefault();
                e.stopImmediatePropagation(); // STOP les autres listeners
                console.warn('❌ Formulaire invalide:', validation.errors);
                // Les erreurs sont déjà affichées sous chaque champ par validateForm()
                return false;
            }
            
            console.log('✅ Formulaire valide, valeurs sanitized:', validation.values);
            // Le formulaire continue sa soumission normale
        }, true); // capture = true pour s'exécuter en premier
    }
    
    // ==========================================
    // FORMULAIRE INFOS PRATIQUES
    // ==========================================
    
    // Téléphone (obligatoire - champ d'urgence)
    const infos_telephone = document.getElementById('infos_telephone');
    if (infos_telephone) {
        window.ValidationUtils.attachRealtimeValidation('infos_telephone', 'phone', { required: true });
    }
    
    const infos_telephone_en = document.getElementById('infos_telephone_en');
    if (infos_telephone_en) {
        window.ValidationUtils.attachRealtimeValidation('infos_telephone_en', 'phone', { required: true });
    }
    
    // Email (obligatoire)
    const infos_email = document.getElementById('infos_email');
    if (infos_email) {
        window.ValidationUtils.attachRealtimeValidation('infos_email', 'email', { required: true });
    }
    
    const infos_email_en = document.getElementById('infos_email_en');
    if (infos_email_en) {
        window.ValidationUtils.attachRealtimeValidation('infos_email_en', 'email', { required: true });
    }
    
    // Heures (texte avec format heure attendu)
    const infos_heureArrivee = document.getElementById('infos_heureArrivee');
    if (infos_heureArrivee) {
        window.ValidationUtils.attachRealtimeValidation('infos_heureArrivee', 'text', { required: false });
    }
    
    const infos_heureDepart = document.getElementById('infos_heureDepart');
    if (infos_heureDepart) {
        window.ValidationUtils.attachRealtimeValidation('infos_heureDepart', 'text', { required: false });
    }
    
    // ==========================================
    // FORMULAIRE FISCALITÉ
    // ==========================================
    
    // CA - readonly mais validation pour sécurité
    const ca = document.getElementById('ca');
    if (ca) {
        window.ValidationUtils.attachRealtimeValidation('ca', 'amount', { required: true });
    }
    
    // Salaires IR
    const salaire_madame = document.getElementById('salaire_madame');
    if (salaire_madame) {
        window.ValidationUtils.attachRealtimeValidation('salaire_madame', 'amount', { required: false });
    }
    
    const salaire_monsieur = document.getElementById('salaire_monsieur');
    if (salaire_monsieur) {
        window.ValidationUtils.attachRealtimeValidation('salaire_monsieur', 'amount', { required: false });
    }
    
    // Tous les champs de charges (pattern générique pour les IDs qui contiennent ces mots)
    const chargeFields = [
        'internet_couzon', 'eau_couzon', 'electricite_couzon', 'assurance_hab_couzon',
        'assurance_emprunt_couzon', 'interets_emprunt_couzon', 'menage_couzon', 'linge_couzon',
        'logiciel_couzon', 'copropriete_couzon', 'taxe_fonciere_couzon', 'cfe_couzon',
        'commissions_couzon', 'amortissement_couzon',
        'internet_trevoux', 'eau_trevoux', 'electricite_trevoux', 'assurance_hab_trevoux',
        'assurance_emprunt_trevoux', 'interets_emprunt_trevoux', 'menage_trevoux', 'linge_trevoux',
        'logiciel_trevoux', 'copropriete_trevoux', 'taxe_fonciere_trevoux', 'cfe_trevoux',
        'commissions_trevoux', 'amortissement_trevoux'
    ];
    
    chargeFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            window.ValidationUtils.attachRealtimeValidation(fieldId, 'amount', { required: false });
        }
    });
    
    console.log('✅ Validation formulaires initialisée');
});
