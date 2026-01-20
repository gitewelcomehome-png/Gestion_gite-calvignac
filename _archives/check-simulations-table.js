// Script pour vérifier la structure réelle de la table simulations_fiscales
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fgqimtpjjhdqeyyaptoj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncWltdHBqamhkcWV5eWFwdG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3NTMxMDIsImV4cCI6MjA1MTMyOTEwMn0.qgI3iITSXkYZqEU5U4SJAoKmC0dvF_JCa39MzF_uS0c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    try {
        // Essayer de faire un SELECT pour voir les colonnes disponibles
        const { data, error } = await supabase
            .from('simulations_fiscales')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error('❌ Erreur:', error);
        } else {
            console.log('✅ Table existe. Exemple de ligne:', data);
            if (data && data.length > 0) {
                console.log('📋 Colonnes disponibles:', Object.keys(data[0]));
            }
        }
        
        // Essayer aussi un INSERT vide pour voir les colonnes requises
        const { data: insertData, error: insertError } = await supabase
            .from('simulations_fiscales')
            .insert({})
            .select();
        
        if (insertError) {
            console.log('📊 Erreur INSERT (attendu):', insertError.message);
        }
        
    } catch (e) {
        console.error('💥 Exception:', e);
    }
}

checkTable();
