// ==========================================
// TAB ANALYSE IA - JAVASCRIPT
// ==========================================

(function() {
    'use strict';

    // Attendre que le DOM soit chargé
    document.addEventListener('DOMContentLoaded', initAnalyseIA);

    // Initialiser aussi lors du chargement de l'onglet
    if (window.currentTab === 'analyse-ia') {
        setTimeout(initAnalyseIA, 500);
    }

    function initAnalyseIA() {
        const form = document.getElementById('analyseForm');
        if (!form) {
            // L'onglet n'est pas encore chargé, réessayer plus tard
            return;
        }

        const analyseBtn = document.getElementById('analyseBtn');
        const saveUrlBtn = document.getElementById('saveUrlBtn');
        const loader = document.getElementById('analyseLoader');
        const results = document.getElementById('analyseResults');
        const resultsContent = document.getElementById('analyseResultsContent');
        const errorAlert = document.getElementById('analyseErrorAlert');
        const successAlert = document.getElementById('analyseSuccessAlert');
        const annonceUrl = document.getElementById('annonceUrl');
        const savedUrlsSection = document.getElementById('savedUrlsSection');
        const savedUrlsList = document.getElementById('savedUrlsList');

        // Éviter de réattacher les listeners plusieurs fois
        if (form.dataset.initialized) {
            return;
        }
        form.dataset.initialized = 'true';

        // Charger et afficher les URLs sauvegardées
        loadSavedUrls();

        // Sauvegarder une URL
        saveUrlBtn.addEventListener('click', () => {
            const url = annonceUrl.value.trim();
            if (!url) {
                showError('Veuillez entrer une URL avant de sauvegarder');
                return;
            }

            const name = prompt('Donnez un nom à cette annonce (ex: "Trévoux Airbnb")');
            if (!name) return;

            saveUrl(url, name);
            showSuccess(`Annonce "${name}" sauvegardée !`);
            loadSavedUrls();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Réinitialiser
            errorAlert.classList.remove('active');
            successAlert.classList.remove('active');
            results.classList.remove('active');
            
            const url = annonceUrl.value.trim();
            
            if (!url) {
                showError('Veuillez fournir l\'URL de votre annonce');
                return;
            }

            // Afficher loader
            analyseBtn.disabled = true;
            loader.classList.add('active');

            try {
                const prompt = `Tu es un expert en optimisation d'annonces de location saisonnière. Analyse l'annonce à cette URL : ${url}

Fournis une analyse COMPLÈTE et DÉTAILLÉE avec :

**1. TITRE (Impact et optimisation)**
- Qualité actuelle du titre
- Mots-clés manquants
- Suggestions de reformulation

**2. DESCRIPTION (Structure et contenu)**
- Points forts actuels
- Éléments manquants importants
- Amélioration de la structure narrative
- Mots-clés SEO à ajouter

**3. PHOTOS (Si visibles)**
- Qualité et quantité
- Angles manquants
- Suggestions de mise en valeur

**4. ÉQUIPEMENTS**
- Liste des équipements mentionnés
- Équipements manquants à ajouter
- Mise en valeur des points premium

**5. EMPLACEMENT**
- Qualité de la présentation géographique
- Points d'intérêt à mentionner
- Accessibilité

**6. TARIFICATION (Si visible)**
- Positionnement prix
- Suggestions ajustement saisonnier
- Extras à valoriser

**7. RÈGLES ET POLITIQUES**
- Clarté des conditions
- Points à améliorer

**8. RECOMMANDATIONS PRIORITAIRES**
- Top 3 actions immédiates
- Impact estimé sur les réservations

Sois PRÉCIS, CONSTRUCTIF et donne des exemples concrets.`;

                const response = await fetch('/api/openai', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: prompt,
                        maxTokens: 3000,
                        model: 'gpt-4o-mini'
                    })
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de l\'analyse');
                }

                const data = await response.json();
                const content = data.content;

                // Afficher les résultats
                displayResults(content);
                showSuccess('Analyse complète terminée !');
                
            } catch (error) {
                console.error('Erreur:', error);
                showError('Une erreur est survenue lors de l\'analyse. Veuillez réessayer.');
            } finally {
                analyseBtn.disabled = false;
                loader.classList.remove('active');
            }
        });

        function displayResults(content) {
            // Convertir le markdown en HTML avec structure
            const sections = content.split(/\*\*\d+\./);
            let html = '';
            
            sections.forEach((section, index) => {
                if (section.trim()) {
                    // Extraire le titre de section
                    const titleMatch = section.match(/^([^*]+)\*\*/);
                    const title = titleMatch ? titleMatch[1].trim() : '';
                    const body = section.replace(/^([^*]+)\*\*/, '').trim();
                    
                    if (title && body) {
                        html += `<div class="analyse-section">
                            <h4>${index}. ${title}</h4>
                            <div class="section-content">${body.replace(/\n/g, '<br>')}</div>
                        </div>`;
                    } else if (section.trim()) {
                        html += `<div class="section-content">${section.trim().replace(/\n/g, '<br>')}</div>`;
                    }
                }
            });
            
            resultsContent.innerHTML = html || content.replace(/\n/g, '<br>');
            results.classList.add('active');
        }

        function showError(message) {
            errorAlert.textContent = message;
            errorAlert.classList.add('active');
            setTimeout(() => {
                errorAlert.classList.remove('active');
            }, 5000);
        }

        function showSuccess(message) {
            successAlert.textContent = message;
            successAlert.classList.add('active');
            setTimeout(() => {
                successAlert.classList.remove('active');
            }, 3000);
        }

        // Gestion des URLs sauvegardées
        function saveUrl(url, name) {
            const saved = getSavedUrls();
            saved.push({
                id: Date.now(),
                url: url,
                name: name,
                date: new Date().toISOString()
            });
            localStorage.setItem('analysedUrls', JSON.stringify(saved));
        }

        function getSavedUrls() {
            const saved = localStorage.getItem('analysedUrls');
            return saved ? JSON.parse(saved) : [];
        }

        function deleteUrl(id) {
            const saved = getSavedUrls();
            const filtered = saved.filter(item => item.id !== id);
            localStorage.setItem('analysedUrls', JSON.stringify(filtered));
            loadSavedUrls();
            showSuccess('Annonce supprimée');
        }

        function loadSavedUrls() {
            const saved = getSavedUrls();
            
            if (saved.length === 0) {
                savedUrlsSection.style.display = 'none';
                return;
            }

            savedUrlsSection.style.display = 'block';
            savedUrlsList.innerHTML = '';

            saved.reverse().forEach(item => {
                const div = document.createElement('div');
                div.className = 'saved-url-item';
                div.innerHTML = `
                    <div class="saved-url-info">
                        <div class="saved-url-name">${item.name}</div>
                        <div class="saved-url-link">${item.url}</div>
                        <div class="saved-url-date">Ajouté le ${new Date(item.date).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div class="saved-url-actions">
                        <button class="btn-url-action btn-analyse-url" data-url="${item.url}">
                            ✨ Analyser
                        </button>
                        <button class="btn-url-action btn-delete-url" data-id="${item.id}">
                            🗑️ Supprimer
                        </button>
                    </div>
                `;

                // Bouton analyser
                div.querySelector('.btn-analyse-url').addEventListener('click', () => {
                    annonceUrl.value = item.url;
                    form.dispatchEvent(new Event('submit'));
                });

                // Bouton supprimer
                div.querySelector('.btn-delete-url').addEventListener('click', () => {
                    if (confirm(`Supprimer "${item.name}" ?`)) {
                        deleteUrl(item.id);
                    }
                });

                savedUrlsList.appendChild(div);
            });
        }
    }

    // Réinitialiser quand on arrive sur l'onglet
    window.addEventListener('tabChanged', (e) => {
        if (e.detail && e.detail.tab === 'analyse-ia') {
            setTimeout(initAnalyseIA, 100);
        }
    });

})();
