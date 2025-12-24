/**
 * Gestion Gîtes - Main Application Script
 * 
 * This file serves as the entry point and module coordinator for the application.
 * Currently, the main application logic remains in index.html for stability.
 * This file provides hooks for future modularization.
 */

// Application State
window.GestionGites = window.GestionGites || {
    // Version info
    version: '2.0.0-refactored',
    
    // Module registry
    modules: {},
    
    // Configuration
    config: {
        timezone: 'Europe/Paris',
        language: 'fr-FR'
    },
    
    // Current state
    state: {
        currentTab: 'reservations',
        user: null,
        dataLoaded: false
    },
    
    // Module registration
    registerModule: function(name, module) {
        this.modules[name] = module;
        console.log(`✓ Module registered: ${name}`);
    },
    
    // Module initialization
    initModule: function(name) {
        const module = this.modules[name];
        if (module && typeof module.init === 'function') {
            module.init();
            console.log(`✓ Module initialized: ${name}`);
        }
    },
    
    // Initialize all modules
    initAllModules: function() {
        Object.keys(this.modules).forEach(name => {
            this.initModule(name);
        });
    },
    
    // Utility: Load external content
    loadContent: async function(url, targetId) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to load: ${url}`);
            const content = await response.text();
            const target = document.getElementById(targetId);
            if (target) {
                target.innerHTML = content;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error loading content:', error);
            return false;
        }
    },
    
    // Event bus for module communication
    eventBus: {
        events: {},
        
        on: function(event, callback) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(callback);
        },
        
        emit: function(event, data) {
            if (this.events[event]) {
                this.events[event].forEach(callback => callback(data));
            }
        },
        
        off: function(event, callback) {
            if (this.events[event]) {
                this.events[event] = this.events[event].filter(cb => cb !== callback);
            }
        }
    }
};

// Log initialization
console.log('🏘️ Gestion Gîtes Application Initialized');
console.log(`Version: ${window.GestionGites.version}`);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.GestionGites;
}
