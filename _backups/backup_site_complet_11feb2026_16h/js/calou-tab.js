// CALOU Tab - Toggle CALOU + Jour/Nuit
(function(){
  'use strict';

  // console.log('🐺 CALOU Tab chargé');

  // Toggle CALOU On/Off
  window.toggleCalouTheme = function toggleCalouTheme(){
    // console.log('🔄 toggleCalouTheme appelé');
    const html = document.documentElement;
    const body = document.body;
    const isActive = html.classList.contains('calou-theme');
    const buttonLabel = document.getElementById('calouToggleLabel');

    // console.log('État actuel - CALOU actif:', isActive);

    if (isActive) {
      html.classList.remove('calou-theme');
      body.classList.remove('calou-body');
      if (buttonLabel) buttonLabel.textContent = 'Activer CALOU';
      document.querySelectorAll('link[href*="css/calou/"]').forEach(link => link.disabled = true);
      // console.log('❌ CALOU désactivé');
    } else {
      html.classList.add('calou-theme');
      body.classList.add('calou-body');
      if (buttonLabel) buttonLabel.textContent = 'Désactiver CALOU';

      // Charger le CSS CALOU unifié
      const needCss = !document.querySelector('link[href*="calou.css"]');
      // console.log('CSS à charger:', needCss);
      
      if (needCss) {
        // console.log('📄 Chargement CSS CALOU unifié');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/calou.css';
        document.head.appendChild(link);
      } else {
        document.querySelectorAll('link[href*="calou"]').forEach(link => link.disabled = false);
      }
      // console.log('✅ CALOU activé');
    }

    localStorage.setItem('calou-theme-enabled', (!isActive).toString());
    
    // Recharger la page pour basculer entre versions
    const dropdown = document.getElementById('userMenuDropdown');
    if (dropdown) dropdown.style.display = 'none';
    // console.log('🔄 Rechargement dans 300ms...');
    setTimeout(() => location.reload(), 300);
  };

  // Toggle Jour/Nuit (uniquement si CALOU actif)
  window.toggleDarkMode = function toggleDarkMode(){
    // console.log('🌙 toggleDarkMode appelé');
    const html = document.documentElement;
    const isCalouActive = html.classList.contains('calou-theme');
    
    // console.log('CALOU actif:', isCalouActive);
    // console.log('Classes actuelles:', html.className);

    if (!isCalouActive) {
      alert('⚠️ Activez d\'abord le mode CALOU pour utiliser le mode nuit');
      return;
    }

    const isDark = html.classList.contains('dark-mode');
    const buttonLabel = document.getElementById('darkModeToggleLabel');
    const buttonIcon = document.querySelector('#darkModeToggle span:first-child');

    // console.log('Mode nuit actif:', isDark);

    if (isDark) {
      html.classList.remove('dark-mode');
      if (buttonLabel) buttonLabel.textContent = 'Mode Nuit 🌙';
      if (buttonIcon) buttonIcon.textContent = '☀️';
      localStorage.setItem('dark-mode-enabled', 'false');
      // console.log('☀️ Mode JOUR activé');
    } else {
      html.classList.add('dark-mode');
      if (buttonLabel) buttonLabel.textContent = 'Mode Jour ☀️';
      if (buttonIcon) buttonIcon.textContent = '🌙';
      localStorage.setItem('dark-mode-enabled', 'true');
      // console.log('🌙 Mode NUIT activé');
    }
    
    // console.log('Nouvelles classes:', html.className);
  };

  // Init au chargement de la page
  window.initCalouTab = function initCalouTab(){
    // console.log('🚀 initCalouTab appelé');
    
    // Si aucune préférence définie, activer CALOU par défaut
    const savedPref = localStorage.getItem('calou-theme-enabled');
    if (savedPref === null) {
      localStorage.setItem('calou-theme-enabled', 'true');
    }
    
    const isEnabled = localStorage.getItem('calou-theme-enabled') === 'true';
    const label = document.getElementById('calouToggleLabel');
    
    // console.log('🐺 CALOU sauvegardé:', isEnabled);
    
    if (label) {
      label.textContent = isEnabled ? 'Désactiver CALOU' : 'Activer CALOU';
    }

    if (isEnabled) {
      document.documentElement.classList.add('calou-theme');
      document.body.classList.add('calou-body');
      
      // Charger le CSS CALOU unifié
      if (!document.querySelector('link[href*="calou.css"]')) {
        // console.log('📄 Chargement CSS au démarrage: css/calou.css');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/calou.css?v=5.0';
        document.head.appendChild(link);
      }
      // console.log('✅ CALOU activé');
    } else {
      document.documentElement.classList.remove('calou-theme');
      document.body.classList.remove('calou-body');
      // console.log('❌ CALOU désactivé');
    }
    
    // console.log('Classes finales:', document.documentElement.className);
  };

  // Initialiser automatiquement au chargement de la page
  document.addEventListener('DOMContentLoaded', initCalouTab);
})();
