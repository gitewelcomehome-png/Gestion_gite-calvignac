#!/usr/bin/env node

/**
 * Script d'insertion du dernier commit Git dans Supabase
 * Appelé automatiquement par log_commit.sh après chaque commit
 */

const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');

// Configuration Supabase
const SUPABASE_URL = 'https://eaclmrwczfqqxmgpbqmo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhY2xtcndjemZxcXhtZ3BicW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NjM4NDUsImV4cCI6MjA1MDUzOTg0NX0.oWnZf_T9VFUP13VGDzW4RaEdXHyYn1-vVPOVOlZeHbU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function insertLastCommit() {
    try {
        // Récupérer les infos du dernier commit
        const commitRef = execSync('git log -1 --format=%h').toString().trim();
        const commitDate = execSync('git log -1 --format=%ai').toString().trim();
        const resume = execSync('git log -1 --format=%s').toString().trim();
        const author = execSync('git log -1 --format=%an').toString().trim();
        
        console.log('📝 Commit à enregistrer:');
        console.log(`  Ref: ${commitRef}`);
        console.log(`  Date: ${commitDate}`);
        console.log(`  Auteur: ${author}`);
        console.log(`  Résumé: ${resume}`);
        
        // Insérer dans Supabase
        const { data, error } = await supabase
            .from('commits_log')
            .insert([
                {
                    commit_ref: commitRef,
                    commit_date: commitDate,
                    resume: resume,
                    author: author
                }
            ]);
        
        if (error) {
            console.error('❌ Erreur insertion Supabase:', error.message);
            process.exit(1);
        }
        
        console.log('✅ Commit enregistré dans Supabase');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

insertLastCommit();
