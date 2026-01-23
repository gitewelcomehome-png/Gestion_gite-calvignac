// 🧪 SCRIPT DE TEST - Vérification des champs HTML
// Copier-coller dans la console F12 pour tester

console.log('🧪 DÉBUT TEST - Vérification des champs infos-gites');
console.log('='.repeat(60));

// Liste complète des champs FR
const champsFR = [
    'adresse', 'telephone', 'gpsLat', 'gpsLon', 'email',
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

// Liste complète des champs EN
const champsEN = [
    'adresse_en', 'telephone_en', 'email_en',
    'wifiSSID_en', 'wifiPassword_en', 'wifiDebit_en', 'wifiLocalisation_en', 'wifiZones_en',
    'heureArrivee_en', 'arriveeTardive_en', 'parkingDispo_en', 'parkingPlaces_en', 'parkingDetails_en',
    'typeAcces_en', 'codeAcces_en', 'instructionsCles_en', 'etage_en', 'ascenseur_en',
    'itineraireLogement_en', 'premiereVisite_en',
    'typeChauffage_en', 'climatisation_en', 'instructionsChauffage_en', 'equipementsCuisine_en',
    'instructionsFour_en', 'instructionsPlaques_en', 'instructionsLaveVaisselle_en',
    'instructionsLaveLinge_en', 'secheLinge_en', 'ferRepasser_en', 'lingeFourni_en', 'configurationChambres_en',
    'instructionsTri_en', 'joursCollecte_en', 'decheterie_en',
    'detecteurFumee_en', 'extincteur_en', 'coupureEau_en', 'disjoncteur_en', 'consignesUrgence_en',
    'heureDepart_en', 'departTardif_en', 'checklistDepart_en', 'restitutionCles_en',
    'tabac_en', 'animaux_en', 'nbMaxPersonnes_en', 'caution_en'
];

// Test 1 : Vérifier les champs FR
console.log('\n📋 TEST 1 : Vérification champs FRANÇAIS');
console.log('-'.repeat(60));
let frManquants = [];
champsFR.forEach(champ => {
    const element = document.getElementById('infos_' + champ);
    if (!element) {
        frManquants.push(champ);
        console.error(`❌ MANQUANT: infos_${champ}`);
    }
});
if (frManquants.length === 0) {
    console.log(`✅ Tous les ${champsFR.length} champs FR sont présents dans le DOM`);
} else {
    console.error(`❌ ${frManquants.length} champs FR manquants:`, frManquants);
}

// Test 2 : Vérifier les champs EN
console.log('\n📋 TEST 2 : Vérification champs ANGLAIS');
console.log('-'.repeat(60));
let enManquants = [];
champsEN.forEach(champ => {
    const element = document.getElementById('infos_' + champ);
    if (!element) {
        enManquants.push(champ);
        console.error(`❌ MANQUANT: infos_${champ}`);
    }
});
if (enManquants.length === 0) {
    console.log(`✅ Tous les ${champsEN.length} champs EN sont présents dans le DOM`);
} else {
    console.error(`❌ ${enManquants.length} champs EN manquants:`, enManquants);
}

// Test 3 : Vérifier la card anglaise
console.log('\n📋 TEST 3 : Vérification englishFieldsCard');
console.log('-'.repeat(60));
const englishCard = document.getElementById('englishFieldsCard');
if (englishCard) {
    const computedStyle = window.getComputedStyle(englishCard);
    console.log(`✅ englishFieldsCard trouvée`);
    console.log(`   - display: ${computedStyle.display}`);
    console.log(`   - visibility: ${computedStyle.visibility}`);
    console.log(`   - opacity: ${computedStyle.opacity}`);
    console.log(`   - Nombre d'enfants: ${englishCard.children.length}`);
    
    // Compter les inputs EN dans la card
    const inputsEN = englishCard.querySelectorAll('input, textarea, select');
    console.log(`   - Inputs/textareas/selects dans la card: ${inputsEN.length}`);
    
    if (inputsEN.length === 0) {
        console.error(`❌ PROBLÈME: La card EN ne contient aucun input !`);
    }
} else {
    console.error(`❌ englishFieldsCard NON TROUVÉE dans le DOM`);
}

// Test 4 : Vérifier les cards FR
console.log('\n📋 TEST 4 : Vérification cards FRANÇAISES');
console.log('-'.repeat(60));
const allCards = Array.from(document.querySelectorAll('.card'));
const frenchCards = allCards.filter(card => card.id !== 'englishFieldsCard');
console.log(`✅ ${allCards.length} cards totales`);
console.log(`✅ ${frenchCards.length} cards FR (sans englishFieldsCard)`);

// Test 5 : Simuler le chargement de données
console.log('\n📋 TEST 5 : Simulation chargement données');
console.log('-'.repeat(60));
const testData = {
    typeChauffage: 'Électrique',
    typeChauffage_en: 'Electric',
    heureArrivee: '16h00',
    heureArrivee_en: '4:00 PM'
};

let testReussi = 0;
let testEchoue = 0;

Object.keys(testData).forEach(key => {
    const element = document.getElementById('infos_' + key);
    if (element) {
        element.value = testData[key];
        if (element.value === testData[key]) {
            console.log(`✅ infos_${key} = "${testData[key]}"`);
            testReussi++;
        } else {
            console.error(`❌ infos_${key} - Valeur non assignée`);
            testEchoue++;
        }
    } else {
        console.error(`❌ infos_${key} - Élément non trouvé`);
        testEchoue++;
    }
});

console.log(`\n📊 Résultat test assignation: ${testReussi} ✅ / ${testEchoue} ❌`);

// Test 6 : Vérifier la langue active
console.log('\n📋 TEST 6 : Vérification langue active');
console.log('-'.repeat(60));
if (typeof currentLangInfos !== 'undefined') {
    console.log(`✅ currentLangInfos = "${currentLangInfos}"`);
} else {
    console.error(`❌ Variable currentLangInfos non définie`);
}

if (typeof applyLanguageDisplay === 'function') {
    console.log(`✅ Fonction applyLanguageDisplay() existe`);
} else {
    console.error(`❌ Fonction applyLanguageDisplay() non trouvée`);
}

if (typeof toggleLanguageInfos === 'function') {
    console.log(`✅ Fonction toggleLanguageInfos() existe`);
} else {
    console.error(`❌ Fonction toggleLanguageInfos() non trouvée`);
}

// Résumé final
console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ DU TEST');
console.log('='.repeat(60));
console.log(`Champs FR manquants: ${frManquants.length} / ${champsFR.length}`);
console.log(`Champs EN manquants: ${enManquants.length} / ${champsEN.length}`);
console.log(`englishFieldsCard: ${englishCard ? '✅' : '❌'}`);
console.log(`Cards FR trouvées: ${frenchCards.length}`);
console.log(`Test assignation: ${testReussi} ✅ / ${testEchoue} ❌`);

if (frManquants.length === 0 && enManquants.length === 0 && englishCard && testEchoue === 0) {
    console.log('\n✅✅✅ TOUS LES TESTS PASSÉS ✅✅✅');
    console.log('Le problème ne vient PAS de la structure HTML');
    console.log('\n🔍 Prochaine étape: Vérifier le chargement depuis la BDD');
    console.log('Exécuter: await supabase.from("infos_gites").select("*").eq("gite", "trevoux").single()');
} else {
    console.error('\n❌ DES PROBLÈMES ONT ÉTÉ DÉTECTÉS');
    console.error('Voir les détails ci-dessus');
}

console.log('='.repeat(60));
console.log('🧪 FIN TEST');
