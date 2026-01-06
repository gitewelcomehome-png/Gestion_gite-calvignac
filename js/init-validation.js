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
                console.warn('❌ Formulaire invalide:', validation.errors);
                alert('Veuillez corriger les erreurs dans le formulaire');
                return false;
            }
            
            console.log('✅ Formulaire valide, valeurs sanitized:', validation.values);
            // Le formulaire continue sa soumission normale
        });
    }
    
    console.log('✅ Validation formulaires initialisée');
});
