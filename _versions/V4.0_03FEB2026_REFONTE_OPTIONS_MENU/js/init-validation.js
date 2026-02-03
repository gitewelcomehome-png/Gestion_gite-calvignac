/**
 * 🛡️ INITIALISATION VALIDATION FORMULAIRES
 * Phase 4 - Application des règles de validation
 */

// Fonction pour standardiser un numéro de téléphone français
function standardizeFrenchPhone(phone) {
    if (!phone) return '';
    
    // Nettoyer le numéro : garder uniquement chiffres, + et espaces
    let cleaned = phone.replace(/[^0-9+\s]/g, '').trim();
    
    // Si vide, retourner vide
    if (!cleaned) return '';
    
    // Retirer tous les espaces pour traiter
    let digitsOnly = cleaned.replace(/\s/g, '');
    
    // Si commence par +33, reformater
    if (digitsOnly.startsWith('+33')) {
        digitsOnly = '0' + digitsOnly.substring(3);
    } else if (digitsOnly.startsWith('33')) {
        digitsOnly = '0' + digitsOnly.substring(2);
    }
    
    // Vérifier que c'est un numéro français valide (10 chiffres commençant par 0)
    if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
        // Formater : 06 12 34 56 78
        return digitsOnly.substring(0, 2) + ' ' + 
               digitsOnly.substring(2, 4) + ' ' + 
               digitsOnly.substring(4, 6) + ' ' + 
               digitsOnly.substring(6, 8) + ' ' + 
               digitsOnly.substring(8, 10);
    }
    
    // Si format international déjà, garder tel quel
    if (cleaned.startsWith('+')) return cleaned;
    
    // Sinon retourner le nettoyé
    return cleaned;
}

// Fonction pour initialiser la validation des infos pratiques
window.initValidationInfosPratiques = function() {
    if (!window.ValidationUtils) {
        console.error('❌ ValidationUtils non chargé');
        return;
    }
    
    console.log('🛡️ Initialisation filtrage + standardisation téléphone infos pratiques...');
    
    // STANDARDISATION TÉLÉPHONE FRANÇAIS
    const infos_telephone = document.getElementById('infos_telephone');
    if (infos_telephone) {
        console.log('✅ Standardisation téléphone FR activée');
        
        // Filtrage temps réel pendant la saisie
        infos_telephone.addEventListener('input', function(e) {
            // Autoriser uniquement chiffres, +, espaces, tirets
            this.value = this.value.replace(/[^0-9+\- ]/g, '');
            // Limiter à 20 caractères max
            if (this.value.length > 20) this.value = this.value.substring(0, 20);
        });
        
        // Standardisation au format français quand on quitte le champ
        infos_telephone.addEventListener('blur', function(e) {
            if (this.value.trim()) {
                const standardized = standardizeFrenchPhone(this.value);
                this.value = standardized;
                // console.log('📞 Téléphone standardisé:', standardized);
            }
        });
    }
    
    const infos_telephone_en = document.getElementById('infos_telephone_en');
    if (infos_telephone_en) {
        // console.log('✅ Standardisation téléphone EN activée');
        
        // Filtrage temps réel
        infos_telephone_en.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9+\- ]/g, '');
            if (this.value.length > 20) this.value = this.value.substring(0, 20);
        });
        
        // Standardisation format international
        infos_telephone_en.addEventListener('blur', function(e) {
            if (this.value.trim()) {
                let cleaned = this.value.replace(/[^0-9+]/g, '');
                // Forcer format international si numéro français
                if (cleaned.startsWith('0') && cleaned.length === 10) {
                    this.value = '+33 ' + cleaned.substring(1);
                } else if (cleaned.startsWith('33') && !cleaned.startsWith('+')) {
                    this.value = '+' + cleaned;
                } else {
                    this.value = cleaned.startsWith('+') ? cleaned : '+' + cleaned;
                }
                console.log('📞 Téléphone EN standardisé:', this.value);
            }
        });
    }
    
    // console.log('✅ Filtrage + standardisation téléphone activés');
};

// Attendre que ValidationUtils soit chargé
document.addEventListener('DOMContentLoaded', function() {
    if (!window.ValidationUtils) {
        console.error('❌ ValidationUtils non chargé');
        return;
    }
    
    // console.log('🛡️ Initialisation validation des formulaires...');
    
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
            
            // console.log('✅ Formulaire valide, valeurs sanitized:', validation.values);
            // Le formulaire continue sa soumission normale
        }, true); // capture = true pour s'exécuter en premier
    }
    
    // console.log('✅ Validation formulaires initialisée');
});
