#!/usr/bin/env node
/**
 * Script Complet de Géocodage et Recherche POIs
 * 
 * Étapes:
 * 1. Récupère les coordonnées réelles des gîtes depuis Supabase
 * 2. Lance search_pois.js pour chercher les POIs
 * 3. Génère un SQL complet prêt à injecter
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const LOG_FILE = path.join(__dirname, 'geocode_complete_log.txt');

function log(message) {
    const timestamp = new Date().toLocaleString('fr-FR');
    const logLine = `[${timestamp}] ${message}`;
    console.log(logLine);
    fs.appendFileSync(LOG_FILE, logLine + '\n');
}

async function runGeocodeScript() {
    log('🌍 DÉBUT PROCESSUS COMPLET GÉOCODAGE + POIs');
    log('='.repeat(70) + '\n');
    
    // Étape 1: Géocodage des activités
    log('📍 ÉTAPE 1: Géocodage des activités existantes');
    log('-'.repeat(70));
    
    try {
        await new Promise((resolve, reject) => {
            const geocode = spawn('node', ['geocode_missing.js']);
            
            geocode.stdout.on('data', (data) => {
                const line = data.toString().trim();
                if (line) log(line);
            });
            
            geocode.stderr.on('data', (data) => {
                const line = data.toString().trim();
                if (line) log(`⚠️ ${line}`);
            });
            
            geocode.on('close', (code) => {
                if (code === 0) {
                    log('✅ Géocodage des activités terminé\n');
                    resolve();
                } else {
                    log(`⚠️ Géocodage retour code: ${code}\n`);
                    resolve(); // Continuer même en cas d'erreur
                }
            });
        });
    } catch (error) {
        log(`⚠️ Erreur géocodage: ${error.message}\n`);
    }
    
    // Étape 2: Recherche POIs
    log('\n📍 ÉTAPE 2: Recherche des Points d\'Intérêt');
    log('-'.repeat(70));
    
    try {
        await new Promise((resolve, reject) => {
            const searchPois = spawn('node', ['search_pois.js']);
            
            searchPois.stdout.on('data', (data) => {
                const line = data.toString().trim();
                if (line) log(line);
            });
            
            searchPois.stderr.on('data', (data) => {
                const line = data.toString().trim();
                if (line) log(`⚠️ ${line}`);
            });
            
            searchPois.on('close', (code) => {
                if (code === 0) {
                    log('✅ Recherche POIs terminée\n');
                    resolve();
                } else {
                    log(`⚠️ Recherche POIs retour code: ${code}\n`);
                    resolve();
                }
            });
        });
    } catch (error) {
        log(`⚠️ Erreur POIs: ${error.message}\n`);
    }
    
    // Étape 3: Résumé final
    log('\n📍 ÉTAPE 3: Préparation finale');
    log('-'.repeat(70));
    
    log('\n✅ PROCESSUS COMPLET TERMINÉ!');
    log('\n📊 Fichiers générés:');
    log('   • geocode_log.txt - Log du géocodage');
    log('   • poi_search_log.txt - Log de la recherche POIs');
    log('   • sql/insert_activites.sql - Requête SQL à exécuter');
    
    log('\n📋 PROCHAINES ÉTAPES:');
    log('   1. Vérifiez les logs: cat geocode_log.txt et cat poi_search_log.txt');
    log('   2. Inspectez le SQL: cat sql/insert_activites.sql');
    log('   3. Exécutez dans Supabase SQL Editor: ');
    log('      • Copier le contenu de sql/insert_activites.sql');
    log('      • Aller sur app.supabase.com');
    log('      • Coller dans SQL Editor');
    log('      • Cliquer "Run"');
    
    log('\n🎉 Fichiers prêts pour injection!');
}

// Démarrer
runGeocodeScript().catch(error => {
    log(`❌ Erreur critique: ${error.message}`);
    console.error(error);
    process.exit(1);
});
