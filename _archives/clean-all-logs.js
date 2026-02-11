#!/usr/bin/env node

/**
 * Script de nettoyage des console.log dans les fichiers principaux
 * - dashboard.js
 * - draps.js
 * - ical-config-modern.js
 * - index.html (sauf les console.warn et console.error)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
    '../js/dashboard.js',
    '../js/draps.js',
    '../js/ical-config-modern.js',
    '../index.html'
];

console.log('🧹 Nettoyage des console.log...\n');

let totalRemoved = 0;

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${path.basename(file)} - fichier introuvable`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let removedCount = 0;
    
    const cleanedLines = lines.map(line => {
        // Ignorer console.error et console.warn
        if (line.includes('console.error') || line.includes('console.warn')) {
            return line;
        }
        
        // Ignorer les assignations
        if (line.includes('const logFn') || line.includes('= console.log')) {
            return line;
        }
        
        // Commenter les console.log
        if (line.includes('console.log')) {
            // Si déjà commenté, on garde tel quel
            if (line.trim().startsWith('//')) {
                return line;
            }
            
            removedCount++;
            const indent = line.match(/^\s*/)[0];
            return `${indent}// ${line.trim()}`;
        }
        
        return line;
    });
    
    if (removedCount > 0) {
        fs.writeFileSync(filePath, cleanedLines.join('\n'), 'utf8');
        console.log(`✅ ${path.basename(file).padEnd(25)} - ${removedCount} log(s) nettoyé(s)`);
        totalRemoved += removedCount;
    } else {
        console.log(`✓  ${path.basename(file).padEnd(25)} - déjà propre`);
    }
});

console.log(`\n🎯 Total: ${totalRemoved} console.log nettoyés`);
