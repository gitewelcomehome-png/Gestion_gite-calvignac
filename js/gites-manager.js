/**
 * GITES MANAGER - Gestion dynamique des gîtes
 * Charge la liste des gîtes depuis Supabase pour éviter les noms en dur
 */

class GitesManager {
    constructor() {
        this.gites = [];
        this.gitesById = new Map();
        this.gitesBySlug = new Map();
        this.loaded = false;
        this.organizationId = null;
    }

    /**
     * Charger tous les gîtes de l'organisation courante
     */
    async loadGites(organizationId = null) {
        try {
            this.organizationId = organizationId;

            let query = window.supabaseClient
                .from('gites')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (organizationId) {
                query = query.eq('organization_id', organizationId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('❌ Erreur chargement gîtes:', error);
                throw error;
            }

            this.gites = data || [];
            
            // Indexer par ID et slug pour accès rapide
            this.gitesById = new Map(this.gites.map(g => [g.id, g]));
            this.gitesBySlug = new Map(this.gites.map(g => [g.slug, g]));
            
            this.loaded = true;
            
            console.log(`✅ ${this.gites.length} gîtes chargés`, this.gites.map(g => g.name));
            
            return this.gites;

        } catch (error) {
            console.error('❌ Erreur loadGites:', error);
            throw error;
        }
    }

    /**
     * Obtenir un gîte par ID
     */
    getById(giteId) {
        return this.gitesById.get(giteId);
    }

    /**
     * Obtenir un gîte par slug
     */
    getBySlug(slug) {
        return this.gitesBySlug.get(slug);
    }

    /**
     * Obtenir le nom d'un gîte par ID
     */
    getNameById(giteId) {
        const gite = this.getById(giteId);
        return gite ? gite.name : 'Gîte inconnu';
    }

    /**
     * Obtenir tous les gîtes
     */
    getAll() {
        return this.gites;
    }

    /**
     * Obtenir l'icône d'un gîte (basé sur l'ordre ou propriété custom)
     */
    getIcon(giteId) {
        const gite = this.getById(giteId);
        if (!gite) return '🏠';
        
        // Utiliser une propriété custom si définie, sinon basé sur l'index
        if (gite.icon) return gite.icon;
        
        const index = this.gites.findIndex(g => g.id === giteId);
        const icons = ['🏡', '⛰️', '🏰', '🌲', '🌊', '🏔️', '🌄', '🌅'];
        return icons[index % icons.length];
    }

    /**
     * Obtenir les coordonnées GPS d'un gîte
     */
    getCoordinates(giteId) {
        const gite = this.getById(giteId);
        if (!gite || !gite.latitude || !gite.longitude) return null;
        return {
            lat: parseFloat(gite.latitude),
            lng: parseFloat(gite.longitude)
        };
    }

    /**
     * Obtenir les coordonnées par slug
     */
    getCoordinatesBySlug(slug) {
        const gite = this.getBySlug(slug);
        if (!gite || !gite.latitude || !gite.longitude) return null;
        return {
            lat: parseFloat(gite.latitude),
            lng: parseFloat(gite.longitude)
        };
    }

    /**
     * Obtenir les coordonnées par nom (pour compatibilité ancien code)
     */
    getCoordinatesByName(name) {
        const gite = this.gites.find(g => 
            g.name.toLowerCase() === name.toLowerCase() ||
            g.slug.toLowerCase() === name.toLowerCase().replace(/\s+/g, '-')
        );
        if (!gite || !gite.latitude || !gite.longitude) return null;
        return {
            lat: parseFloat(gite.latitude),
            lng: parseFloat(gite.longitude)
        };
    }

    /**
     * Obtenir settings JSONB d'un gîte
     */
    getSettings(giteId) {
        const gite = this.getById(giteId);
        return gite?.settings || {};
    }

    /**
     * Obtenir besoins draps depuis settings
     */
    getLinenNeeds(giteId) {
        const settings = this.getSettings(giteId);
        return settings.linen_needs || {};
    }

    /**
     * Obtenir sources iCal d'un gîte
     */
    getIcalSources(giteId) {
        const gite = this.getById(giteId);
        return gite?.ical_sources || {};
    }

    /**
     * Obtenir TOUTES les sources iCal (tous gîtes)
     */
    getAllIcalSources() {
        const sources = {};
        this.gites.forEach(g => {
            if (g.ical_sources && Object.keys(g.ical_sources).length > 0) {
                sources[g.id] = g.ical_sources;
            }
        });
        return sources;
    }

    /**
     * Créer un <select> HTML dynamique avec les gîtes
     */
    createSelect(selectedGiteId = null, options = {}) {
        const select = document.createElement('select');
        select.className = options.className || 'gite-select';
        if (options.id) select.id = options.id;
        if (options.name) select.name = options.name;
        
        // Option vide optionnelle
        if (options.includeEmpty) {
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = options.emptyText || '-- Sélectionner un gîte --';
            select.appendChild(emptyOption);
        }
        
        // Options des gîtes
        this.gites.forEach(g => {
            const option = document.createElement('option');
            option.value = g.id;
            option.textContent = `${this.getIcon(g.id)} ${g.name}`;
            if (g.id === selectedGiteId) option.selected = true;
            select.appendChild(option);
        });
        
        return select;
    }

    /**
     * Obtenir la couleur d'un gîte (pour graphiques, badges, etc.)
     */
    getColor(giteId) {
        const gite = this.getById(giteId);
        if (!gite) return '#999999';
        
        // Utiliser une propriété custom si définie
        if (gite.brand_color) return gite.brand_color;
        
        // Palette par défaut basée sur l'index
        const index = this.gites.findIndex(g => g.id === giteId);
        const colors = [
            '#667eea', // Violet
            '#f093fb', // Rose
            '#4facfe', // Bleu
            '#43e97b', // Vert
            '#fa709a', // Rouge
            '#feca57', // Jaune
            '#48dbfb', // Cyan
            '#ff6b6b'  // Corail
        ];
        return colors[index % colors.length];
    }

    /**
     * Attendre que les gîtes soient chargés
     */
    async waitForLoad() {
        if (this.loaded) return;
        
        // Attendre max 5 secondes
        const maxWait = 5000;
        const start = Date.now();
        
        while (!this.loaded && (Date.now() - start) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (!this.loaded) {
            throw new Error('Timeout: gîtes non chargés après 5s');
        }
    }

    /**
     * Mapper l'ancien nom de gîte vers le nouveau gite_id
     * TEMPORAIRE - pour migration des données
     */
    mapOldNameToId(oldName) {
        // Normaliser
        const normalized = oldName?.toLowerCase().trim();
        
        // Mapping manuel temporaire
        const mapping = {
            'couzon': 'le-rive-droite',
            'le rive droite': 'le-rive-droite',
            'rive droite': 'le-rive-droite',
            'trevoux': 'trevoux',
            'trevoux': 'trevoux',
            'treoux': 'trevoux'
        };
        
        const slug = mapping[normalized];
        if (slug) {
            const gite = this.getBySlug(slug);
            return gite?.id;
        }
        
        return null;
    }

    /**
     * Créer un sélecteur HTML de gîtes
     */
    createSelect(selectedId = null, options = {}) {
        const {
            id = 'giteSelect',
            name = 'gite_id',
            includeEmpty = true,
            emptyText = 'Tous les gîtes',
            className = ''
        } = options;

        const select = document.createElement('select');
        select.id = id;
        select.name = name;
        if (className) select.className = className;

        if (includeEmpty) {
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = emptyText;
            select.appendChild(emptyOption);
        }

        this.gites.forEach(gite => {
            const option = document.createElement('option');
            option.value = gite.id;
            option.textContent = `${this.getIcon(gite.id)} ${gite.name}`;
            if (selectedId === gite.id) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        return select;
    }
}

// Instance globale
window.gitesManager = new GitesManager();

console.log('✅ GitesManager initialisé');
