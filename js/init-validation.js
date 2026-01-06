/**
 * 🛡️ INITIALISATION VALIDATION FORMULAIRES
 * Phase 4 - Application des règles de validation
 */

// Fonction pour initialiser la validation des infos pratiques
window.initValidationInfosPratiques = function() {
    if (!window.ValidationUtils) {
        console.error('❌ ValidationUtils non chargé');
        return;
    }
    
    console.log('🛡️ Initialisation filtrage temps réel infos pratiques (SANS blocage soumission)...');
    
    // FILTRAGE SIMPLE TÉLÉPHONE (sans validation stricte pour ne pas bloquer la sauvegarde)
    const infos_telephone = document.getElementById('infos_telephone');
    if (infos_telephone) {
        console.log('✅ Filtrage téléphone FR');
        infos_telephone.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9+\- ]/g, '');
            if (this.value.length > 14) this.value = this.value.substring(0, 14);
        });
    }
    
    const infos_telephone_en = document.getElementById('infos_telephone_en');
    if (infos_telephone_en) {
        console.log('✅ Filtrage téléphone EN');
        infos_telephone_en.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9+\- ]/g, '');
            if (this.value.length > 14) this.value = this.value.substring(0, 14);
        });
    }
    
    console.log('✅ Filtrage infos pratiques activé (sauvegarde non bloquée)');
};

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
    
    console.log('✅ Validation formulaires initialisée');
});
