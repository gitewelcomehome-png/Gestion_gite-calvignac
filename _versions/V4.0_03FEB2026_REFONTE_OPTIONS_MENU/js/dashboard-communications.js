/**
 * Dashboard Communications - Affichage des messages admin aux clients
 * Charge et affiche les communications depuis admin_communications
 */

// Charger les communications admin pour le dashboard client
async function loadAdminCommunications() {
    try {
        const container = document.getElementById('dashboard-communications-admin');
        const liste = document.getElementById('liste-communications-admin');
        const badge = document.getElementById('badge-communications-count');
        
        if (!container || !liste) return;
        
        // Utiliser le client Supabase global
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            console.warn('Supabase client non disponible');
            return;
        }
        
        // Récupérer les communications actives
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabaseClient
            .from('admin_communications')
            .select('*')
            .or(`date_fin.is.null,date_fin.gte.${today}`)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.warn('Table admin_communications non trouvée:', error.message);
            container.style.display = 'none';
            return;
        }
        
        if (!data || data.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        // Afficher le container
        container.style.display = 'block';
        badge.textContent = data.length;
        
        // Générer le HTML des communications
        liste.innerHTML = data.map(comm => {
            const typeStyles = {
                info: { bg: '#dbeafe', color: '#1e40af', icon: 'info' },
                warning: { bg: '#fef3c7', color: '#92400e', icon: 'alert-triangle' },
                success: { bg: '#dcfce7', color: '#166534', icon: 'check-circle' },
                urgent: { bg: '#fee2e2', color: '#991b1b', icon: 'alert-octagon' }
            };
            const style = typeStyles[comm.type] || typeStyles.info;
            
            return `
                <div style="background: ${style.bg}; border-radius: 8px; padding: 12px 15px; margin-bottom: 10px; border-left: 4px solid ${style.color};">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                        <i data-lucide="${style.icon}" style="width: 18px; height: 18px; color: ${style.color};"></i>
                        <strong style="color: ${style.color}; font-size: 15px;">${comm.titre}</strong>
                    </div>
                    <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.5;">${comm.message}</p>
                    ${comm.date_fin ? `<div style="margin-top: 8px; font-size: 12px; color: #64748b;">Valide jusqu'au ${new Date(comm.date_fin).toLocaleDateString('fr-FR')}</div>` : ''}
                </div>
            `;
        }).join('');
        
        // Réinitialiser les icônes Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (err) {
        console.error('Erreur chargement communications:', err);
    }
}

// Charger au démarrage
document.addEventListener('DOMContentLoaded', function() {
    // Délai pour s'assurer que Supabase est initialisé
    setTimeout(loadAdminCommunications, 1000);
});

// Exposer la fonction globalement
window.loadAdminCommunications = loadAdminCommunications;
