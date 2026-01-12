/**
 * Custom Select avec icônes visuelles pour les plateformes iCal
 * Alternative au <select> HTML standard qui ne supporte pas les icônes
 */

window.CustomPlatformSelect = {
    platforms: [
        { value: '', name: 'Autre plateforme', icon: 'default' },
        { value: 'airbnb', name: 'Airbnb', icon: 'airbnb' },
        { value: 'booking', name: 'Booking.com', icon: 'booking' },
        { value: 'vrbo', name: 'Vrbo', icon: 'vrbo' },
        { value: 'abritel', name: 'Abritel', icon: 'abritel' },
        { value: 'homeaway', name: 'HomeAway', icon: 'homeaway' },
        { value: 'tripadvisor', name: 'TripAdvisor', icon: 'tripadvisor' },
        { value: 'gites-de-france', name: 'Gîtes de France', icon: 'gites-de-france' }
    ],

    /**
     * Créer un custom select avec icônes
     */
    create(container, onChangeFn) {
        const customSelect = document.createElement('div');
        customSelect.className = 'custom-platform-select';
        
        // Bouton qui affiche la sélection actuelle
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'custom-select-button';
        button.innerHTML = this.renderSelected(this.platforms[0]);
        
        // Menu déroulant avec toutes les options
        const dropdown = document.createElement('div');
        dropdown.className = 'custom-select-dropdown';
        dropdown.innerHTML = this.platforms.map(platform => `
            <div class="custom-select-option" data-value="${platform.value}">
                <div class="option-icon">
                    ${window.PlatformIcons ? window.PlatformIcons.get(platform.icon) : ''}
                </div>
                <span class="option-name">${platform.name}</span>
            </div>
        `).join('');
        
        customSelect.appendChild(button);
        customSelect.appendChild(dropdown);
        
        // Toggle dropdown
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });
        
        // Sélection d'une option
        dropdown.querySelectorAll('.custom-select-option').forEach(option => {
            option.addEventListener('click', () => {
                const value = option.dataset.value;
                const platform = this.platforms.find(p => p.value === value);
                
                // Mettre à jour le bouton
                button.innerHTML = this.renderSelected(platform);
                
                // Mettre à jour la valeur
                customSelect.dataset.value = value;
                
                // Fermer le dropdown
                dropdown.classList.remove('open');
                
                // Callback
                if (onChangeFn) onChangeFn(value, platform);
            });
        });
        
        // Fermer en cliquant ailleurs
        document.addEventListener('click', () => {
            dropdown.classList.remove('open');
        });
        
        return customSelect;
    },
    
    /**
     * Rendu de l'option sélectionnée
     */
    renderSelected(platform) {
        return `
            <div class="selected-platform">
                <div class="selected-icon">
                    ${window.PlatformIcons ? window.PlatformIcons.get(platform.icon) : ''}
                </div>
                <span class="selected-name">${platform.name}</span>
                <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9L12 15L18 9"/>
                </svg>
            </div>
        `;
    },
    
    /**
     * Récupérer la valeur d'un custom select
     */
    getValue(customSelectElement) {
        return customSelectElement.dataset.value || '';
    },
    
    /**
     * CSS pour le custom select
     */
    getCSS() {
        return `
            .custom-platform-select {
                position: relative;
                width: 100%;
            }
            
            .custom-select-button {
                width: 100%;
                padding: 10px 12px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                transition: border-color 0.2s ease;
                text-align: left;
            }
            
            .custom-select-button:hover,
            .custom-select-button:focus {
                border-color: #667eea;
                outline: none;
            }
            
            .selected-platform {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .selected-icon {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .selected-icon svg {
                width: 100%;
                height: 100%;
            }
            
            .selected-name {
                flex: 1;
                font-size: 0.95rem;
                color: #2D3436;
            }
            
            .chevron {
                transition: transform 0.2s ease;
            }
            
            .custom-select-dropdown.open + .custom-select-button .chevron {
                transform: rotate(180deg);
            }
            
            .custom-select-dropdown {
                position: absolute;
                top: calc(100% + 5px);
                left: 0;
                right: 0;
                background: white;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                max-height: 300px;
                overflow-y: auto;
                z-index: 1000;
                opacity: 0;
                transform: translateY(-10px);
                pointer-events: none;
                transition: all 0.2s ease;
            }
            
            .custom-select-dropdown.open {
                opacity: 1;
                transform: translateY(0);
                pointer-events: all;
            }
            
            .custom-select-option {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                cursor: pointer;
                transition: background 0.2s ease;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .custom-select-option:last-child {
                border-bottom: none;
            }
            
            .custom-select-option:hover {
                background: #f8f9fa;
            }
            
            .option-icon {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .option-icon svg {
                width: 100%;
                height: 100%;
            }
            
            .option-name {
                font-size: 0.95rem;
                color: #2D3436;
            }
        `;
    }
};
