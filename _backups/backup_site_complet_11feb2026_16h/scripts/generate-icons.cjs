const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'ios_apple_app', 'assets', 'logo-icon.svg');
const iconPath = path.join(__dirname, '..', 'ios_apple_app', 'assets', 'icon.png');
const adaptiveIconPath = path.join(__dirname, '..', 'ios_apple_app', 'assets', 'adaptive-icon.png');

async function generateIcons() {
    try {
        console.log('📱 Génération des icônes iOS...');
        
        // Lire le SVG
        const svgBuffer = fs.readFileSync(svgPath);
        
        // Générer icon.png (1024x1024)
        await sharp(svgBuffer)
            .resize(1024, 1024)
            .png()
            .toFile(iconPath);
        console.log('✅ icon.png créé (1024x1024)');
        
        // Générer adaptive-icon.png (1024x1024, même chose pour iOS)
        await sharp(svgBuffer)
            .resize(1024, 1024)
            .png()
            .toFile(adaptiveIconPath);
        console.log('✅ adaptive-icon.png créé (1024x1024)');
        
        console.log('✨ Icônes générées avec succès !');
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

generateIcons();
