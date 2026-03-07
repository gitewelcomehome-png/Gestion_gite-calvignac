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
        this._loadPromise = null; // Promise cache
        this.organizationId = null;
    }

    /**
     * Charger tous les gîtes de l'utilisateur connecté (RGPD)
     */
    async loadGites() {
        // Promise cache: si chargement en cours, retourner la même promesse
        if (this._loadPromise) {
            return this._loadPromise;
        }
        
        this._loadPromise = (async () => {
            try {
            // Charger uniquement les gîtes de l'utilisateur connecté
            // Le filtre owner_user_id est géré automatiquement par RLS
            // Trier par ordre_affichage (ordre personnalisé) puis par nom si NULL
            let query = window.supabaseClient
                .from('gites')
                .select('*')
                .eq('is_active', true)
                .order('ordre_affichage', { ascending: true, nullsFirst: false })
                .order('name', { ascending: true });

            let { data, error } = await query;

            // Fallback si la colonne ordre_affichage n'existe pas encore
            if (error && error.code === '42703' && error.message?.includes('ordre_affichage')) {
                const fallback = await window.supabaseClient
                    .from('gites')
                    .select('*')
                    .eq('is_active', true)
                    .order('name', { ascending: true });
                data = fallback.data;
                error = fallback.error;
            }

            if (error) {
                console.error('❌ Erreur chargement gîtes:', error);
                throw error;
            }

            this.gites = data || [];
            
            // Si certains gîtes n'ont pas d'ordre_affichage, les initialiser
            await this.initializeOrderIfNeeded();
            
            // Indexer par ID et slug pour accès rapide
            this.gitesById = new Map(this.gites.map(g => [g.id, g]));
            this.gitesBySlug = new Map(this.gites.map(g => [g.slug, g]));
            
            this.loaded = true;
            return this.gites;

        } catch (error) {
            console.error('❌ Erreur loadGites:', error);
            this._loadPromise = null; // Reset cache en cas d'erreur
            throw error;
        }
        })();
        
        try {
            const result = await this._loadPromise;
            this._loadPromise = null; // Reset cache après succès
            return result;
        } catch (error) {
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
     * Obtenir tous les gîtes (SANS FILTRE - pour grilles/colonnes)
     */
    async getAll(forceReload = false) {
        // Si pas encore chargé ou rechargement forcé, charger depuis Supabase
        if (!this.loaded || forceReload) {
            // Architecture simplifiée : RLS filtre automatiquement par owner_user_id
            await this.loadGites();
        }
        return this.gites;
    }
    
    /**
     * Obtenir les gîtes visibles selon le plan d'abonnement (pour selects/listes)
     */
    async getVisibleGites(forceReload = false) {
        if (!this.loaded || forceReload) {
            await this.loadGites();
        }
        
        // Attendre que le subscription manager soit prêt (avec timeout 3s)
        if (window.subscriptionManager?._readyPromise) {
            const timeout = new Promise(resolve => setTimeout(resolve, 3000));
            await Promise.race([window.subscriptionManager._readyPromise, timeout]);
        }
        
        // Filtrer selon la limite du plan d'abonnement
        if (window.subscriptionManager && window.subscriptionManager.currentSubscription) {
            const maxGites = window.subscriptionManager.currentSubscription.plan?.max_gites || 1;
            // Retourner uniquement les N premiers gîtes selon ordre_affichage
            return this.gites.slice(0, maxGites);
        }
        
        // Si timeout, retourner tous les gîtes pour ne pas bloquer l'utilisateur
        console.warn('⚠️ Timeout chargement abonnement, affichage de tous les gîtes');
        return this.gites;
    }
    
    /**
     * Obtenir TOUS les gîtes sans filtre (alias pour compatibilité admin)
     */
    async getAllUnfiltered(forceReload = false) {
        return this.getAll(forceReload);
    }

    /**
     * Obtenir un gîte par son nom
     */
    getByName(name) {
        if (!name) return null;
        const normalized = name.toLowerCase().trim();
        return this.gites.find(g => 
            g.name.toLowerCase().trim() === normalized || 
            g.slug === normalized
        );
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
     * Créer un nouveau gîte
     */
    async create(giteData) {
        try {
            // Générer un slug unique à partir du nom
            const baseSlug = giteData.name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
                .replace(/[^a-z0-9]+/g, '-')     // Remplacer les caractères spéciaux par -
                .replace(/^-+|-+$/g, '');         // Supprimer les - au début/fin
            
            const slug = baseSlug || 'gite-' + Date.now();
            
            // Récupérer l'ID utilisateur pour la RLS policy
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) throw new Error('Utilisateur non authentifié');
            
            const insertData = {
                owner_user_id: user.id,
                name: giteData.name,
                slug: slug,
                icon: giteData.icon || giteData.emoji || 'house-simple',
                color: giteData.color || '#667eea',
                capacity: giteData.capacity || null,
                address: giteData.address || giteData.location || null,
                city: giteData.city || null,
                postal_code: giteData.postal_code || null,
                country: giteData.country || 'France',
                bedrooms: giteData.bedrooms || null,
                beds: giteData.beds || null,
                bathrooms: giteData.bathrooms || null,
                surface_m2: giteData.surface_m2 || null,
                type_hebergement: giteData.type_hebergement || null,
                label_classement: giteData.label_classement || null,
                department: giteData.department || null,
                region: giteData.region || null,
                environment: giteData.environment || null,
                situation: giteData.situation || null,
                cuisine_niveau: giteData.cuisine_niveau || null,
                animaux_acceptes: Boolean(giteData.animaux_acceptes),
                access_pmr: Boolean(giteData.access_pmr),
                parking: Boolean(giteData.parking),
                platform_airbnb: Boolean(giteData.platform_airbnb),
                platform_booking: Boolean(giteData.platform_booking),
                platform_abritel: Boolean(giteData.platform_abritel),
                platform_gdf: Boolean(giteData.platform_gdf),
                platform_direct: Boolean(giteData.platform_direct),
                price_per_night: giteData.price_per_night || null,
                description: giteData.description || null,
                amenities: Array.isArray(giteData.amenities) ? giteData.amenities : [],
                settings: (giteData.settings && typeof giteData.settings === 'object') ? giteData.settings : {},
                ical_sources: giteData.ical_sources && giteData.ical_sources.length > 0
                    ? giteData.ical_sources
                    : (giteData.ical_urls && giteData.ical_urls.length > 0 ? giteData.ical_urls : []),
                ical_urls: giteData.ical_urls && giteData.ical_urls.length > 0
                    ? giteData.ical_urls
                    : (giteData.ical_sources && giteData.ical_sources.length > 0 ? giteData.ical_sources : [])
            };
            
            // console.log('📤 Données INSERT gites:', insertData);
            
            // Créer avec owner_user_id explicite pour passer la RLS policy
            const { data, error } = await window.supabaseClient
                .from('gites')
                .insert(insertData)
                .select()
                .single();

            if (error) {
                console.error('❌ Erreur Supabase détaillée:', error);
                throw error;
            }

            // Recharger la liste
            await this.loadGites();
            
            return data;
        } catch (error) {
            console.error('❌ Erreur création gîte:', error);
            throw error;
        }
    }

    /**
     * Mettre à jour un gîte
     */
    async update(giteId, giteData) {
        try {
            const { data, error } = await window.supabaseClient
                .from('gites')
                .update(giteData)
                .eq('id', giteId)
                .select()
                .single();

            if (error) throw error;

            // Recharger la liste
            await this.loadGites(this.organizationId);
            
            return data;
        } catch (error) {
            console.error('❌ Erreur mise à jour gîte:', error);
            throw error;
        }
    }

    /**
     * Supprimer un gîte (soft delete)
     */
    async delete(giteId) {
        try {
            const { error } = await window.supabaseClient
                .from('gites')
                .update({ is_active: false })
                .eq('id', giteId);

            if (error) throw error;

            // Recharger la liste
            await this.loadGites(this.organizationId);
            
            return true;
        } catch (error) {
            console.error('❌ Erreur suppression gîte:', error);
            throw error;
        }
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
        
        // Utiliser la couleur définie dans la BDD
        if (gite.color) return gite.color;
        
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
     * @deprecated Utiliser directement gite.id ou gite.slug
     */
    mapOldNameToId(oldName) {
        console.warn('⚠️ mapOldNameToId() est obsolète - Utiliser gite.id ou gite.slug');
        
        // Normaliser
        const normalized = oldName?.toLowerCase().trim();
        
        // Chercher dans les gîtes chargés
        const gite = this.gites.find(g => 
            g.name.toLowerCase().trim() === normalized ||
            g.slug === normalized
        );
        
        return gite?.id || null;
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

    /**
     * Initialiser ordre_affichage pour les gîtes qui n'en ont pas
     */
    async initializeOrderIfNeeded() {
        try {
            const gitesWithoutOrder = this.gites.filter(g => g.ordre_affichage === null || g.ordre_affichage === undefined);
            
            if (gitesWithoutOrder.length === 0) {
                return; // Tous les gîtes ont déjà un ordre
            }

            // Trouver le prochain index disponible
            const maxOrder = Math.max(...this.gites.map(g => g.ordre_affichage || 0), 0);
            
            // Assigner un ordre à chaque gîte sans ordre
            const updates = gitesWithoutOrder.map((gite, index) => ({
                id: gite.id,
                ordre_affichage: maxOrder + index + 1
            }));

            // Mettre à jour dans Supabase
            for (const update of updates) {
                const { error } = await window.supabaseClient
                    .from('gites')
                    .update({ ordre_affichage: update.ordre_affichage })
                    .eq('id', update.id);
                
                if (error) {
                    console.error('❌ Erreur initialisation ordre:', error);
                } else {
                    // Mettre à jour localement
                    const gite = this.gitesById.get(update.id);
                    if (gite) {
                        gite.ordre_affichage = update.ordre_affichage;
                    }
                }
            }
        } catch (error) {
            console.error('❌ Erreur initializeOrderIfNeeded:', error);
        }
    }

    /**
     * Sauvegarder l'ordre actuel dans Supabase
     */
    async saveCurrentOrder() {
        try {
            // Mettre à jour l'ordre_affichage de chaque gîte dans Supabase
            const updates = this.gites.map((gite, index) => ({
                id: gite.id,
                ordre_affichage: index + 1 // Commencer à 1 au lieu de 0
            }));

            // Mettre à jour en batch
            for (const update of updates) {
                const { error } = await window.supabaseClient
                    .from('gites')
                    .update({ ordre_affichage: update.ordre_affichage })
                    .eq('id', update.id);
                
                if (error) {
                    console.error('❌ Erreur sauvegarde ordre gîte:', error);
                } else {
                    // Mettre à jour localement
                    const gite = this.gitesById.get(update.id);
                    if (gite) {
                        gite.ordre_affichage = update.ordre_affichage;
                    }
                }
            }
            
            // console.log('✅ Ordre des gîtes sauvegardé dans Supabase');
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde de l\'ordre:', error);
        }
    }

    /**
     * Déplacer un gîte dans l'ordre
     */
    async moveGite(giteId, direction) {
        const currentIndex = this.gites.findIndex(g => g.id === giteId);
        if (currentIndex === -1) return false;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= this.gites.length) return false;

        // Échanger les positions
        [this.gites[currentIndex], this.gites[newIndex]] = [this.gites[newIndex], this.gites[currentIndex]];

        // Sauvegarder le nouvel ordre dans Supabase
        await this.saveCurrentOrder();

        return true;
    }
}

// Instance globale
window.gitesManager = new GitesManager();

// GitesManager initialisé
