/**
 * GESTION DU PARRAINAGE LORS DE L'INSCRIPTION
 * À intégrer dans le processus de création de compte
 */

/**
 * ÉTAPE 1 : Capturer le code de parrainage depuis l'URL
 * À appeler au chargement de la page d'inscription/login
 */
function captureReferralCode() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('ref');
        
        if (referralCode) {
            // console.log('🎯 Code de parrainage détecté:', referralCode);
            
            // Stocker en sessionStorage pour utiliser après l'inscription
            sessionStorage.setItem('referral_code', referralCode);
            
            // Optionnel : Afficher un message de bienvenue
            showReferralWelcome(referralCode);
            
            return referralCode;
        }
        
        return null;
    } catch (error) {
        console.error('❌ Erreur capture code parrainage:', error);
        return null;
    }
}

/**
 * Afficher un message de bienvenue pour le filleul
 */
function showReferralWelcome(code) {
    // Créer un bandeau de bienvenue
    const banner = document.createElement('div');
    banner.id = 'referral-banner';
    banner.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 30px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        z-index: 10000;
        animation: slideDown 0.5s ease-out;
        font-size: 14px;
        font-weight: 600;
    `;
    banner.innerHTML = `
        <span style="margin-right: 8px;">🎉</span>
        Vous avez été parrainé ! Inscrivez-vous pour bénéficier d'avantages exclusifs.
    `;
    
    document.body.appendChild(banner);
    
    // Masquer après 5 secondes
    setTimeout(() => {
        banner.style.animation = 'slideUp 0.5s ease-out';
        setTimeout(() => banner.remove(), 500);
    }, 5000);
}

/**
 * ÉTAPE 2 : Enregistrer le parrainage après création du compte
 * À appeler juste après que l'utilisateur ait créé son compte
 * 
 * @param {string} newUserEmail - Email du nouveau compte
 * @param {string} newUserId - ID utilisateur créé par Supabase
 */
async function registerReferral(newUserEmail, newUserId) {
    try {
        // Récupérer le code de parrainage stocké
        const referralCode = sessionStorage.getItem('referral_code');
        
        if (!referralCode) {
            // console.log('ℹ️ Pas de code de parrainage pour cette inscription');
            return { success: true, referral: false };
        }
        
        // console.log('📝 Enregistrement du parrainage:', { referralCode, newUserEmail, newUserId });
        
        // Appeler la fonction SQL pour enregistrer le parrainage
        const { data, error } = await supabase.rpc('process_referral_signup', {
            p_referral_code: referralCode,
            p_referred_email: newUserEmail,
            p_referred_user_id: newUserId
        });
        
        if (error) {
            console.error('❌ Erreur enregistrement parrainage:', error);
            // Ne pas bloquer l'inscription si erreur parrainage
            return { success: true, referral: false, error: error.message };
        }
        
        // console.log('✅ Parrainage enregistré avec succès:', data);
        
        // Nettoyer le sessionStorage
        sessionStorage.removeItem('referral_code');
        
        // Afficher un message de confirmation
        showReferralSuccess();
        
        return { 
            success: true, 
            referral: true, 
            referrer_id: data.referrer_id 
        };
        
    } catch (error) {
        console.error('❌ Erreur inattendue lors de l\'enregistrement du parrainage:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Afficher un message de confirmation du parrainage
 */
function showReferralSuccess() {
    // console.log('🎉 Parrainage confirmé !');
    
    // Optionnel : Afficher une notification
    if (typeof showToast === 'function') {
        showToast('Votre parrainage a été enregistré avec succès !', 'success');
    }
}

/**
 * ÉTAPE 3 : Activer le parrainage après le premier paiement
 * À appeler après qu'un utilisateur ait effectué son premier paiement
 * 
 * @param {string} userId - ID de l'utilisateur qui vient de payer
 */
async function activateReferralAfterPayment(userId) {
    try {
        // console.log('💳 Activation du parrainage après paiement pour:', userId);
        
        // Appeler la fonction SQL pour activer le parrainage
        const { error } = await supabase.rpc('activate_referral', {
            p_referred_user_id: userId
        });
        
        if (error) {
            console.error('❌ Erreur activation parrainage:', error);
            return { success: false, error: error.message };
        }
        
        // console.log('✅ Parrainage activé avec succès');
        
        // Optionnel : Envoyer une notification au parrain
        await notifyReferrerOfActivation(userId);
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Erreur inattendue lors de l\'activation du parrainage:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Notifier le parrain que son filleul est devenu actif
 */
async function notifyReferrerOfActivation(referredUserId) {
    try {
        // Récupérer le parrain
        const { data: referral } = await supabase
            .from('referrals')
            .select('referrer_id, referral_code')
            .eq('referred_user_id', referredUserId)
            .single();
        
        if (!referral) return;
        
        // console.log('📧 Notification parrain:', referral.referrer_id);
        
        // TODO: Envoyer email ou notification au parrain
        // if (typeof sendNotification === 'function') {
        //     await sendNotification(referral.referrer_id, {
        //         type: 'referral_activated',
        //         message: 'Un de vos filleuls vient de devenir actif ! 🎉'
        //     });
        // }
        
    } catch (error) {
        console.error('❌ Erreur notification parrain:', error);
    }
}

/**
 * EXEMPLE D'INTÉGRATION DANS LE PROCESSUS D'INSCRIPTION
 */
async function exampleSignupProcess() {
    // 1. Au chargement de la page
    captureReferralCode();
    
    // 2. Lors de la soumission du formulaire d'inscription
    const signupButton = document.getElementById('btnSignup');
    signupButton?.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Créer le compte (votre code existant)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userEmail,
            password: userPassword,
            options: {
                data: {
                    nom: userName,
                    // ... autres infos
                }
            }
        });
        
        if (authError) {
            console.error('Erreur création compte:', authError);
            return;
        }
        
        // NOUVEAU : Enregistrer le parrainage
        const referralResult = await registerReferral(
            authData.user.email,
            authData.user.id
        );
        
        // console.log('Résultat parrainage:', referralResult);
        
        // Continuer le processus normal d'inscription
        // ...
    });
}

/**
 * EXEMPLE D'INTÉGRATION APRÈS PAIEMENT
 */
async function exampleAfterPaymentProcess(userId) {
    try {
        // Votre code de traitement du paiement
        // ...
        
        // NOUVEAU : Activer le parrainage
        const activationResult = await activateReferralAfterPayment(userId);
        
        if (activationResult.success) {
            // console.log('✅ Parrainage activé après paiement');
        }
        
    } catch (error) {
        console.error('Erreur processus paiement:', error);
    }
}

// ============================================
// AUTO-INITIALISATION
// ============================================

// Capturer automatiquement le code au chargement
if (typeof window !== 'undefined') {
    // Si on est sur la page de login/signup
    if (window.location.pathname.includes('login') || 
        window.location.pathname.includes('signup') ||
        window.location.pathname.includes('register')) {
        
        document.addEventListener('DOMContentLoaded', () => {
            captureReferralCode();
        });
    }
}

// Export des fonctions pour utilisation externe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        captureReferralCode,
        registerReferral,
        activateReferralAfterPayment
    };
}
