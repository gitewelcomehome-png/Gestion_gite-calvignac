// 🧪 TEST - Vérification Traduction Automatique
// Copier-coller dans la console F12 après chargement de la page

console.log('🧪 TEST TRADUCTION AUTOMATIQUE');
console.log('='.repeat(60));

// Liste complète des champs qui DOIVENT avoir la traduction auto
const champsATraduire = [
    'adresse', 'telephone', 'email',
    'wifiSSID', 'wifiPassword', 'wifiDebit', 'wifiLocalisation', 'wifiZones',
    'heureArrivee', 'arriveeTardive', 'parkingDispo', 'parkingPlaces', 'parkingDetails',
    'typeAcces', 'codeAcces', 'instructionsCles', 'etage', 'ascenseur',
    'itineraireLogement', 'premiereVisite',
    'typeChauffage', 'climatisation', 'instructionsChauffage', 'equipementsCuisine',
    'instructionsFour', 'instructionsPlaques', 'instructionsLaveVaisselle',
    'instructionsLaveLinge', 'secheLinge', 'ferRepasser', 'lingeFourni', 'configurationChambres',
    'instructionsTri', 'joursCollecte', 'decheterie',
    'detecteurFumee', 'extincteur', 'coupureEau', 'disjoncteur', 'consignesUrgence',
    'heureDepart', 'departTardif', 'checklistDepart', 'restitutionCles',
    'tabac', 'animaux', 'nbMaxPersonnes', 'caution'
];

// Vérifier chaque champ
let champsOK = [];
let champsFrManquants = [];
let champsEnManquants = [];
let champsAvecListeners = 0;

champsATraduire.forEach(champ => {
    const champFR = document.getElementById('infos_' + champ);
    const champEN = document.getElementById('infos_' + champ + '_en');
    
    if (!champFR) {
        champsFrManquants.push(champ);
        console.error(`❌ Champ FR manquant: infos_${champ}`);
        return;
    }
    
    if (!champEN) {
        champsEnManquants.push(champ);
        console.error(`❌ Champ EN manquant: infos_${champ}_en`);
        return;
    }
    
    // Vérifier si le champ FR a des listeners
    const hasListeners = champFR._hasInputListener || false;
    
    champsOK.push(champ);
    if (hasListeners) champsAvecListeners++;
});

console.log('\n📊 RÉSULTAT:');
console.log('-'.repeat(60));
console.log(`✅ Champs avec FR + EN: ${champsOK.length} / ${champsATraduire.length}`);
console.log(`❌ Champs FR manquants: ${champsFrManquants.length}`);
console.log(`❌ Champs EN manquants: ${champsEnManquants.length}`);

if (champsFrManquants.length > 0) {
    console.error('\n❌ Champs FR manquants:', champsFrManquants);
}

if (champsEnManquants.length > 0) {
    console.error('\n❌ Champs EN manquants:', champsEnManquants);
}

// Test manuel de traduction sur un champ
console.log('\n🧪 TEST MANUEL - parkingDetails');
console.log('-'.repeat(60));

const testFR = document.getElementById('infos_parkingDetails');
const testEN = document.getElementById('infos_parkingDetails_en');

if (testFR && testEN) {
    console.log(`✅ Champ FR trouvé: ${testFR.tagName} (${testFR.type || 'textarea'})`);
    console.log(`✅ Champ EN trouvé: ${testEN.tagName} (${testEN.type || 'textarea'})`);
    console.log(`   Valeur FR actuelle: "${testFR.value.substring(0, 50)}..."`);
    console.log(`   Valeur EN actuelle: "${testEN.value.substring(0, 50)}..."`);
    
    // Tester si on peut assigner une valeur
    const oldValueFR = testFR.value;
    testFR.value = 'TEST DE TRADUCTION';
    testFR.dispatchEvent(new Event('input', { bubbles: true }));
    
    console.log('✅ Événement "input" déclenché sur parkingDetails');
    console.log('⏳ Attendre 1 seconde pour voir si la traduction démarre...');
    
    setTimeout(() => {
        console.log(`📥 Résultat après 1s: "${testEN.value}"`);
        if (testEN.value.includes('⏳')) {
            console.log('✅ Traduction en cours !');
        } else if (testEN.value === '') {
            console.error('❌ Aucune traduction déclenchée');
        }
        // Restaurer la valeur
        testFR.value = oldValueFR;
    }, 1500);
} else {
    console.error('❌ Champs parkingDetails non trouvés');
}

// Vérifier que attachAutoTranslation a été appelé
console.log('\n🔍 VÉRIFICATION FONCTION attachAutoTranslation');
console.log('-'.repeat(60));
if (typeof attachAutoTranslation === 'function') {
    console.log('✅ Fonction attachAutoTranslation existe');
    
    // Compter les champs avec le sélecteur utilisé
    const champsFR = document.querySelectorAll('#infosGiteForm input:not([id$="_en"]):not([readonly]), #infosGiteForm textarea:not([id$="_en"]), #infosGiteForm select:not([id$="_en"])');
    console.log(`📊 Champs FR trouvés par le sélecteur: ${champsFR.length}`);
    
    // Compter combien ont un champ EN correspondant
    let avecEN = 0;
    champsFR.forEach(fr => {
        if (fr.id && !fr.id.includes('gps') && !fr.id.includes('Lat') && !fr.id.includes('Lon')) {
            const idEN = fr.id + '_en';
            if (document.getElementById(idEN)) avecEN++;
        }
    });
    console.log(`📊 Champs avec correspondance EN: ${avecEN}`);
    
} else {
    console.error('❌ Fonction attachAutoTranslation non trouvée');
}

console.log('\n' + '='.repeat(60));
console.log('🧪 FIN TEST');
console.log('\n💡 CONSEIL: Si un champ ne traduit pas, vérifier:');
console.log('   1. Le champ FR existe et est visible');
console.log('   2. Le champ EN existe avec suffixe "_en"');
console.log('   3. attachAutoTranslation() a été appelé après le DOM ready');
console.log('   4. Le champ n\'est pas readonly ou disabled');
