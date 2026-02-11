#!/usr/bin/env node

/**
 * Script de nettoyage des console.log dans fiscalite-v2.js
 * - Conserve les console.error
 * - Conserve les lignes d'assignation (const logFn = ...)
 * - Commente les console.log de debug
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../js/fiscalite-v2.js');

console.log('🧹 Nettoyage des console.log dans fiscalite-v2.js...\n');

// Lecture du fichier
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let removedCount = 0;
let keptCount = 0;

// Traitement ligne par ligne
const cleanedLines = lines.map((line, index) => {
    // Ignorer les lignes avec console.error
    if (line.includes('console.error')) {
        keptCount++;
        return line;
    }
    
    // Ignorer les assignations (const logFn = ...)
    if (line.includes('const logFn') || line.includes('= console.log')) {
        keptCount++;
        return line;
    }
    
    // Commenter les console.log de debug
    if (line.includes('console.log')) {
        removedCount++;
        // Si la ligne est déjà commentée, on la garde telle quelle
        if (line.trim().startsWith('//')) {
            return line;
        }
        // Sinon on la commente
        const indent = line.match(/^\s*/)[0];
        return `${indent}// ${line.trim()}`;
    }
    
    return line;
});

// Écriture du fichier nettoyé
fs.writeFileSync(filePath, cleanedLines.join('\n'), 'utf8');

console.log(`✅ Nettoyage terminé :`);
console.log(`   - ${removedCount} console.log commentés`);
console.log(`   - ${keptCount} lignes conservées (console.error, assignations)`);
console.log(`\n📁 Fichier : ${filePath}`);
