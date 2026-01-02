// ================================================================
// SCRIPTS INTERACTIFS - PARTIE 4 (FINAL)
// ================================================================

function genererScripts(reservation, infosGite) {
    // Clé Supabase réelle depuis shared-config.js
    const supabaseUrl = 'https://ivqiisnudabxemcxxyru.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cWlpc251ZGFieGVtY3h4eXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTk0NjMsImV4cCI6MjA4MDk3NTQ2M30.9FwJPgR8bbaP7bAemuaVbAN019EO5ql7uciQO9FeHK4';
    
    return `
    <script>
        // Configuration Supabase
        const SUPABASE_URL = '${supabaseUrl}';
        const SUPABASE_ANON_KEY = '${supabaseKey}';
        
        // ========================================
        // NAVIGATION ONGLETS
        // ========================================
        
        function switchTab(tabName) {
            // Cacher tous les onglets
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            
            // Retirer active de tous les boutons
            document.querySelectorAll('.nav-tab').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Afficher l'onglet sélectionné
            const selectedPane = document.getElementById('tab-' + tabName);
            if (selectedPane) {
                selectedPane.classList.add('active');
            }
            
            // Activer le bouton correspondant
            event.target.classList.add('active');
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // ========================================
        // FAQ - RECHERCHE & TOGGLE
        // ========================================
        
        function rechercherFAQ(terme) {
            const resultsContainer = document.getElementById('faq-results');
            const allContainer = document.getElementById('faq-all-container');
            
            if (!terme || terme.trim() === '') {
                resultsContainer.classList.add('hidden');
                allContainer.classList.remove('open');
                return;
            }
            
            // Simuler recherche (adapter selon vos données)
            resultsContainer.classList.remove('hidden');
            resultsContainer.innerHTML = '<div class="alert alert-info">Recherche: "' + terme + '"...</div>';
        }
        
        function toggleAllFAQ() {
            const container = document.getElementById('faq-all-container');
            const btnText = document.getElementById('faq-toggle-text');
            
            if (container.classList.contains('open')) {
                container.classList.remove('open');
                btnText.textContent = 'Voir toutes les FAQ / See all FAQs';
            } else {
                container.classList.add('open');
                btnText.textContent = 'Masquer les FAQ / Hide FAQs';
            }
        }
        
        // ========================================
        // ACTIVITÉS - FILTRAGE
        // ========================================
        
        function filtrerActivites(type) {
            // Retirer active de tous les boutons
            document.querySelectorAll('[id^="filter-"]').forEach(btn => {
                btn.style.background = '#e0e0e0';
                btn.style.color = '#333';
            });
            
            // Activer le bouton cliqué
            const btn = document.getElementById('filter-' + (type === 'all' ? 'all' : type.replace(/\\s+/g, '-')));
            if (btn) {
                btn.style.background = 'var(--color-primary)';
                btn.style.color = 'white';
            }
            
            // Filtrer les cards
            const cards = document.querySelectorAll('.activite-card');
            cards.forEach(card => {
                if (type === 'all' || card.dataset.type === type) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }
        
        // ========================================
        // SLIDERS - HORAIRES
        // ========================================
        
        function updateSliderDisplay(type, value) {
            const displayEl = document.getElementById(type + '-display');
            const hours = Math.floor(value);
            const minutes = (value % 1) * 60;
            const timeStr = hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0');
            displayEl.textContent = timeStr;
        }
        
        async function soumettreHoraires(event) {
            event.preventDefault();
            
            const btn = document.getElementById('btn-submit-horaires');
            const form = document.getElementById('form-horaires');
            const messageDiv = document.getElementById('message-confirmation-horaires');
            
            btn.disabled = true;
            btn.textContent = '⏳ Envoi en cours... / Sending...';
            
            // Récupérer les valeurs
            const heureArrivee = document.getElementById('heure_arrivee').value;
            const heureDepart = document.getElementById('heure_depart').value;
            
            // Convertir en HH:MM
            const arriveeHours = Math.floor(heureArrivee);
            const arriveeMinutes = (heureArrivee % 1) * 60;
            const departHours = Math.floor(heureDepart);
            const departMinutes = (heureDepart % 1) * 60;
            
            const data = {
                reservation_id: parseInt(document.getElementById('reservation_id').value),
                heure_arrivee: arriveeHours.toString().padStart(2, '0') + ':' + arriveeMinutes.toString().padStart(2, '0') + ':00',
                heure_depart: departHours.toString().padStart(2, '0') + ':' + departMinutes.toString().padStart(2, '0') + ':00',
                commentaires: document.getElementById('commentaires').value || null
            };
            
            try {
                const response = await fetch(\`\${SUPABASE_URL}/rest/v1/clients_preferences\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': \`Bearer \${SUPABASE_ANON_KEY}\`,
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    form.style.display = 'none';
                    messageDiv.classList.remove('hidden');
                    
                    // Enregistrer consultation
                    await fetch(\`\${SUPABASE_URL}/rest/v1/fiches_consultations\`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': \`Bearer \${SUPABASE_ANON_KEY}\`
                        },
                        body: JSON.stringify({
                            reservation_id: data.reservation_id,
                            user_agent: navigator.userAgent
                        })
                    });
                } else {
                    throw new Error('Erreur serveur');
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert('Une erreur est survenue. Veuillez réessayer.\\nAn error occurred. Please try again.');
                btn.disabled = false;
                btn.textContent = '✅ Valider mes horaires / Confirm My Schedule';
            }
            
            return false;
        }
        
        // ========================================
        // FEEDBACK - NOTES & SOUMISSION
        // ========================================
        
        function selectEmoji(value) {
            document.querySelectorAll('#emoji-rating .emoji').forEach(emoji => {
                emoji.classList.remove('selected');
            });
            event.target.classList.add('selected');
            document.getElementById('note_globale').value = value;
        }
        
        function selectStar(critere, value) {
            const stars = document.querySelectorAll(\`#stars-\${critere} .star\`);
            stars.forEach((star, index) => {
                if (index < value) {
                    star.classList.add('active');
                } else {
                    star.classList.remove('active');
                }
            });
            document.getElementById(\`note_\${critere}\`).value = value;
        }
        
        function selectRecommandation(value) {
            // Reset tous
            ['oui', 'peut-etre', 'non'].forEach(v => {
                const label = document.getElementById(\`label-reco-\${v}\`).parentElement;
                label.style.background = '#e0e0e0';
                label.style.color = '#333';
            });
            
            // Activer sélectionné
            const label = document.getElementById(\`label-reco-\${value}\`).parentElement;
            label.style.background = 'var(--color-primary)';
            label.style.color = 'white';
            
            document.getElementById(\`reco-\${value}\`).checked = true;
        }
        
        async function soumettreFeedback(event) {
            event.preventDefault();
            
            const btn = document.getElementById('btn-submit-feedback');
            const form = document.getElementById('form-feedback');
            const messageDiv = document.getElementById('message-confirmation-feedback');
            
            // Vérifier note globale
            const noteGlobale = document.getElementById('note_globale').value;
            if (!noteGlobale) {
                alert('Merci de sélectionner une note globale.\\nPlease select an overall rating.');
                return false;
            }
            
            btn.disabled = true;
            btn.textContent = '⏳ Envoi en cours... / Sending...';
            
            // Récupérer catégories problèmes
            const categoriesProblemes = Array.from(document.querySelectorAll('input[name="cat_probleme"]:checked'))
                .map(cb => cb.value);
            
            const data = {
                reservation_id: parseInt(document.getElementById('feedback_reservation_id').value),
                note_globale: parseInt(noteGlobale),
                note_proprete: parseInt(document.getElementById('note_proprete').value) || null,
                note_confort: parseInt(document.getElementById('note_confort').value) || null,
                note_equipements: parseInt(document.getElementById('note_equipements').value) || null,
                note_localisation: parseInt(document.getElementById('note_localisation').value) || null,
                note_communication: parseInt(document.getElementById('note_communication').value) || null,
                points_positifs: document.getElementById('points_positifs').value || null,
                problemes_rencontres: document.getElementById('problemes_rencontres').value || null,
                suggestions: document.getElementById('suggestions').value || null,
                categories_problemes: categoriesProblemes.length > 0 ? categoriesProblemes : null,
                recommandation: document.querySelector('input[name="recommandation"]:checked')?.value || null,
                user_agent: navigator.userAgent
            };
            
            try {
                const response = await fetch(\`\${SUPABASE_URL}/rest/v1/client_feedback\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': \`Bearer \${SUPABASE_ANON_KEY}\`,
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    form.style.display = 'none';
                    messageDiv.classList.remove('hidden');
                } else {
                    throw new Error('Erreur serveur');
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert('Une erreur est survenue. Veuillez réessayer.\\nAn error occurred. Please try again.');
                btn.disabled = false;
                btn.textContent = '📤 Envoyer mon feedback / Send My Feedback';
            }
            
            return false;
        }
        
        // ========================================
        // INITIALISATION
        // ========================================
        
        document.addEventListener('DOMContentLoaded', function() {
            // Initialiser les sliders
            updateSliderDisplay('arrivee', document.getElementById('heure_arrivee').value);
            updateSliderDisplay('depart', document.getElementById('heure_depart').value);
            
            // Auto-focus sur recherche FAQ
            const searchInput = document.getElementById('faq-search-input');
            if (searchInput) {
                searchInput.addEventListener('focus', function() {
                    this.parentElement.style.transform = 'scale(1.02)';
                    this.parentElement.style.transition = 'all 0.3s ease';
                });
                searchInput.addEventListener('blur', function() {
                    this.parentElement.style.transform = 'scale(1)';
                });
            }
            
            console.log('✅ Fiche client initialisée');
        });
    </script>
    `;
}

// ========================================
// HELPERS ADDITIONNELS
// ========================================

async function getActivitesGite(gite) {
    try {
        const { data, error } = await window.supabase
            .from('activites_gites')
            .select('*')
            .eq('gite', gite.toLowerCase())
            .order('distance', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erreur chargement activités:', error);
        return [];
    }
}

async function getProchainMenage(gite, dateApres) {
    try {
        const { data, error } = await window.supabase
            .from('cleaning_schedule')
            .select('*')
            .eq('gite', gite)
            .gte('scheduled_date', dateApres)
            .order('scheduled_date', { ascending: true })
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (error) {
        console.error('Erreur chargement ménage:', error);
        return null;
    }
}

function loadInfosGites(gite) {
    const allInfos = JSON.parse(localStorage.getItem('infosGites') || '{}');
    return allInfos[gite] || {};
}

// Exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        genererOngletAccueil,
        genererOngletArrivee,
        genererOngletSejour,
        genererOngletDepart,
        genererOngletDecouvrir,
        genererOngletHoraires,
        genererOngletFeedback,
        genererScripts,
        getActivitesGite,
        getProchainMenage,
        loadInfosGites
    };
}
