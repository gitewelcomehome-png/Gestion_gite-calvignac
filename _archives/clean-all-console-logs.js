#!/usr/bin/env node

/**
 // * Nettoyage complet des console.log dans tout le projet
 * Exclut : _backups, _versions, _archives, node_modules
 * Conserve : console.error, console.warn, scripts CLI
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Fichiers à exclure (scripts CLI qui ont besoin de console.log)
const excludeFiles = [
    'scripts/generate-test-token.js',
    'scripts/add-modal-switches.js' // Script debug, on garde les logs
];

// Dossiers à exclure
const excludeDirs = [
    'node_modules',
    '_backups',
    '_versions',
    '_archives',
    '.git',
    'dist',
    'build'
];

// console.log('🧹 Recherche des fichiers à nettoyer...\n');

// Fonction récursive pour trouver les fichiers
function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Ignorer les dossiers exclus
            if (!excludeDirs.includes(file)) {
                findFiles(filePath, fileList);
            }
        } else if (stat.isFile()) {
            // Ajouter les fichiers .js et .html
            if (file.endsWith('.js') || file.endsWith('.html')) {
                fileList.push(filePath);
            }
        }
    }
    
    return fileList;
}

// Trouver tous les fichiers JS et HTML
const files = findFiles(rootDir);

let totalFiles = 0;
let totalRemoved = 0;
let filesProcessed = [];

for (const filePath of files) {
    const relativePath = path.relative(rootDir, filePath);
    
    // Vérifier si le fichier est dans la liste d'exclusion
    if (excludeFiles.some(ex => relativePath.includes(ex))) {
        continue;
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
        // if (line.includes('console.log') && !line.trim().startsWith('//')) {
            removedCount++;
            const indent = line.match(/^\s*/)[0];
            return `${indent}// ${line.trim()}`;
        }
        
        return line;
    });
    
    if (removedCount > 0) {
        fs.writeFileSync(filePath, cleanedLines.join('\n'), 'utf8');
        totalFiles++;
        totalRemoved += removedCount;
        filesProcessed.push({
            file: relativePath,
            count: removedCount
        });
    }
}

// Afficher les résultats
// console.log('📊 Résultats du nettoyage:\n');
// console.log('═'.repeat(70));

if (filesProcessed.length === 0) {
    // console.log('✓  Aucun console.log trouvé - Projet déjà propre!');
} else {
    filesProcessed
        .sort((a, b) => b.count - a.count)
        .forEach(({ file, count }) => {
            const fileName = file.length > 50 ? '...' + file.slice(-47) : file;
            // console.log(`✅ ${fileName.padEnd(50)} ${count.toString().padStart(3)} log(s)`);
        });
    
    // console.log('═'.repeat(70));
    // console.log(`\n🎯 ${totalFiles} fichier(s) modifié(s)`);
    // console.log(`🧹 ${totalRemoved} console.log nettoyé(s)`);
}

// console.log('\n✅ Nettoyage terminé!\n');
