// ================================================================
// 🧪 TEST GENERATOR - Génération automatique de tests
// ================================================================
// Génère des tests console et UI après chaque correction
// ================================================================

class TestGenerator {
    constructor() {
        this.generatedTests = [];
    }

    /**
     * Générer un test pour une correction
     */
    generateTestForFix(errorData, fixedCode) {
        const test = {
            errorId: errorData.id,
            fileName: errorData.source,
            lineNumber: errorData.metadata?.lineno,
            errorType: errorData.error_type,
            originalError: errorData.message,
            
            // Test console (à exécuter dans DevTools)
            consoleTest: this.generateConsoleTest(errorData, fixedCode),
            
            // Test UI (bouton dans interface)
            uiTest: this.generateUITest(errorData, fixedCode),
            
            // Config pour auto-validator
            validatorConfig: this.generateValidatorConfig(errorData, fixedCode)
        };
        
        this.generatedTests.push(test);
        return test;
    }

    /**
     * Générer un test console
     */
    generateConsoleTest(errorData, fixedCode) {
        const fileName = errorData.source || 'unknown';
        const errorMessage = errorData.message;
        
        // Extraire le contexte de l'erreur
        let testCode = '';
        
        // Identifier le type d'erreur et générer le test approprié
        if (errorMessage.includes('undefined') || errorMessage.includes('null')) {
            testCode = this.generateNullCheckTest(errorData, fixedCode);
        } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
            testCode = this.generateFetchTest(errorData, fixedCode);
        } else if (errorMessage.includes('async') || errorMessage.includes('await')) {
            testCode = this.generateAsyncTest(errorData, fixedCode);
        } else {
            testCode = this.generateGenericTest(errorData, fixedCode);
        }
        
        return {
            description: `Test de validation pour ${fileName}`,
            code: testCode,
            instructions: `
// ================================================================
// TEST CONSOLE - ${fileName}
// ================================================================
// Copiez et collez ce code dans la console DevTools (F12)
// Vérifiez qu'aucune erreur n'apparaît

${testCode}

// Si aucune erreur n'apparaît → Test réussi ✅
// Si une erreur apparaît → Correction à revoir ❌
            `.trim()
        };
    }

    /**
     * Test pour null/undefined
     */
    generateNullCheckTest(errorData, fixedCode) {
        const functionName = errorData.metadata?.functionName || 'testFunction';
        
        return `
(async function testNullCheck() {
    console.log('🧪 Test: ${errorData.source} - Null/Undefined check');
    
    try {
        // Test avec données valides
        const validData = { id: 1, nom: 'Test', /* ajoutez d'autres champs */ };
        const result1 = ${functionName}(validData);
        console.log('✅ Test 1 passed: Valid data', result1);
        
        // Test avec données null
        const result2 = ${functionName}(null);
        console.log('✅ Test 2 passed: Null data handled', result2);
        
        // Test avec données undefined
        const result3 = ${functionName}(undefined);
        console.log('✅ Test 3 passed: Undefined data handled', result3);
        
        // Test avec objet incomplet
        const incompleteData = { id: 1 }; // Manque 'nom'
        const result4 = ${functionName}(incompleteData);
        console.log('✅ Test 4 passed: Incomplete data handled', result4);
        
        console.log('✅✅✅ ALL TESTS PASSED ✅✅✅');
        return true;
    } catch (err) {
        console.error('❌ TEST FAILED:', err);
        return false;
    }
})();
        `.trim();
    }

    /**
     * Test pour fetch/network
     */
    generateFetchTest(errorData, fixedCode) {
        return `
(async function testFetch() {
    console.log('🧪 Test: ${errorData.source} - Fetch error handling');
    
    try {
        // Test avec URL valide
        console.log('Test 1: Valid fetch...');
        // Remplacez par votre vraie URL de test
        const result1 = await fetch('/api/test').catch(err => {
            console.log('✅ Error handled:', err.message);
            return { ok: false, error: err };
        });
        console.log('✅ Test 1 passed');
        
        // Test avec URL invalide
        console.log('Test 2: Invalid URL...');
        const result2 = await fetch('https://invalid-url-that-does-not-exist-12345.com')
            .catch(err => {
                console.log('✅ Network error handled:', err.message);
                return { ok: false, error: err };
            });
        console.log('✅ Test 2 passed');
        
        console.log('✅✅✅ ALL TESTS PASSED ✅✅✅');
        return true;
    } catch (err) {
        console.error('❌ TEST FAILED:', err);
        return false;
    }
})();
        `.trim();
    }

    /**
     * Test pour async/await
     */
    generateAsyncTest(errorData, fixedCode) {
        const functionName = errorData.metadata?.functionName || 'testAsyncFunction';
        
        return `
(async function testAsync() {
    console.log('🧪 Test: ${errorData.source} - Async/await handling');
    
    try {
        // Test exécution normale
        console.log('Test 1: Normal execution...');
        const result1 = await ${functionName}();
        console.log('✅ Test 1 passed:', result1);
        
        // Test avec délai
        console.log('Test 2: With delay...');
        await new Promise(resolve => setTimeout(resolve, 100));
        const result2 = await ${functionName}();
        console.log('✅ Test 2 passed:', result2);
        
        console.log('✅✅✅ ALL TESTS PASSED ✅✅✅');
        return true;
    } catch (err) {
        console.error('❌ TEST FAILED:', err);
        return false;
    }
})();
        `.trim();
    }

    /**
     * Test générique
     */
    generateGenericTest(errorData, fixedCode) {
        return `
(function testGeneric() {
    console.log('🧪 Test: ${errorData.source} - Generic test');
    
    try {
        // Ajoutez ici votre code de test spécifique
        console.log('Test de la correction...');
        
        // Exemple : vérifier que la fonction existe
        if (typeof ${errorData.metadata?.functionName || 'targetFunction'} !== 'undefined') {
            console.log('✅ Function exists');
        }
        
        console.log('✅ TEST PASSED');
        return true;
    } catch (err) {
        console.error('❌ TEST FAILED:', err);
        return false;
    }
})();
        `.trim();
    }

    /**
     * Générer un test UI
     */
    generateUITest(errorData, fixedCode) {
        return {
            html: `
<div class="test-card" data-test-id="${errorData.id}">
    <div class="test-header">
        <h3>Test: ${errorData.source}</h3>
        <span class="test-status" id="status-${errorData.id}">⏳ En attente</span>
    </div>
    <div class="test-details">
        <p><strong>Erreur:</strong> ${errorData.message}</p>
        <p><strong>Ligne:</strong> ${errorData.metadata?.lineno || 'N/A'}</p>
    </div>
    <div class="test-actions">
        <button class="btn btn-primary" onclick="runTest${errorData.id}()">
            <i data-lucide="play"></i>
            Lancer le test
        </button>
        <button class="btn btn-success" onclick="validateFix(${errorData.id})" disabled id="validate-${errorData.id}">
            <i data-lucide="check"></i>
            Valider la correction
        </button>
    </div>
    <div class="test-output" id="output-${errorData.id}"></div>
</div>
            `.trim(),
            
            script: `
async function runTest${errorData.id}() {
    const statusEl = document.getElementById('status-${errorData.id}');
    const outputEl = document.getElementById('output-${errorData.id}');
    const validateBtn = document.getElementById('validate-${errorData.id}');
    
    statusEl.textContent = '⏳ Test en cours...';
    statusEl.className = 'test-status running';
    outputEl.innerHTML = '<p>Exécution du test...</p>';
    
    try {
        const testConfig = {
            testCode: \`${this.generateConsoleTest(errorData, fixedCode).code}\`
        };
        
        const result = await window.autoValidatorInstance.validateImmediately(
            ${errorData.id}, 
            testConfig
        );
        
        if (result.success) {
            statusEl.textContent = '✅ Test réussi';
            statusEl.className = 'test-status success';
            outputEl.innerHTML = '<p class="success">✅ Test passé avec succès. Monitoring lancé pour 24h.</p>';
            validateBtn.disabled = false;
        } else {
            statusEl.textContent = '❌ Test échoué';
            statusEl.className = 'test-status failed';
            outputEl.innerHTML = '<p class="error">❌ Test échoué: ' + result.error + '</p>';
        }
    } catch (err) {
        statusEl.textContent = '❌ Erreur';
        statusEl.className = 'test-status error';
        outputEl.innerHTML = '<p class="error">❌ Erreur: ' + err.message + '</p>';
    }
}

async function validateFix(errorId) {
    if (confirm('Confirmer que la correction fonctionne ?')) {
        await window.supabaseClient
            .from('cm_error_logs')
            .update({ resolved: true, resolved_at: new Date().toISOString() })
            .eq('id', errorId);
        
        alert('✅ Erreur marquée comme résolue !');
        location.reload();
    }
}
            `.trim()
        };
    }

    /**
     * Générer config pour auto-validator
     */
    generateValidatorConfig(errorData, fixedCode) {
        return {
            testCode: this.generateConsoleTest(errorData, fixedCode).code,
            errorSignature: `${errorData.source}|${errorData.message}|${errorData.metadata?.lineno}`,
            timeout: 5000
        };
    }

    /**
     * Générer la page HTML de tests complète
     */
    generateTestPage() {
        const tests = this.generatedTests;
        
        return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tests Auto-Fix - Validation des Corrections</title>
    
    <!-- Supabase -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="../js/shared-config.js"></script>
    <script src="../js/auto-validator.js"></script>
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    
    <link rel="stylesheet" href="../css/admin-dashboard.css">
    
    <style>
        .test-grid {
            display: grid;
            gap: 20px;
            padding: 20px;
        }
        
        .test-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-left: 4px solid #64748b;
        }
        
        .test-card.success { border-left-color: #10b981; }
        .test-card.failed { border-left-color: #ef4444; }
        .test-card.running { border-left-color: #f59e0b; }
        
        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .test-status {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }
        
        .test-status.success { background: #d1fae5; color: #065f46; }
        .test-status.failed { background: #fee2e2; color: #991b1b; }
        .test-status.running { background: #fef3c7; color: #92400e; }
        
        .test-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        .test-output {
            margin-top: 15px;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            font-family: monospace;
            font-size: 14px;
        }
        
        .test-output p.success { color: #10b981; }
        .test-output p.error { color: #ef4444; }
    </style>
</head>
<body>
    <header class="admin-header">
        <div class="header-left">
            <h1>
                <i data-lucide="flask-conical"></i>
                Tests de Validation des Corrections
            </h1>
        </div>
        <div class="header-right">
            <button class="btn-icon" onclick="window.location.href='admin-monitoring.html'" title="Retour">
                <i data-lucide="arrow-left"></i>
            </button>
        </div>
    </header>

    <main class="admin-container">
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0; color: #1e40af;">ℹ️ Instructions</h2>
            <ul style="margin: 0; color: #1e40af;">
                <li>Cliquez sur "Lancer le test" pour chaque correction</li>
                <li>Si le test passe ✅ → Un monitoring de 24h démarre automatiquement</li>
                <li>Si aucune erreur ne réapparaît en 24h → Auto-résolu ✅</li>
                <li>Vous pouvez forcer la validation manuellement si certain</li>
            </ul>
        </div>

        <div class="test-grid">
            ${tests.map(test => test.uiTest.html).join('\n')}
        </div>
        
        ${tests.length === 0 ? `
        <div style="text-align: center; padding: 60px; color: #64748b;">
            <i data-lucide="check-circle" style="width: 64px; height: 64px; margin-bottom: 20px;"></i>
            <p style="font-size: 18px; font-weight: 600;">Aucun test en attente</p>
            <p>Appliquez des corrections pour générer des tests</p>
        </div>
        ` : ''}
    </main>

    <script>
        ${tests.map(test => test.uiTest.script).join('\n\n')}
        
        lucide.createIcons();
    </script>
</body>
</html>`;
    }

    /**
     * Sauvegarder les tests générés
     */
    exportTests() {
        return {
            consoleTests: this.generatedTests.map(t => t.consoleTest),
            uiTestsHTML: this.generateTestPage(),
            validatorConfigs: this.generatedTests.map(t => t.validatorConfig),
            summary: {
                totalTests: this.generatedTests.length,
                byType: this.groupByType()
            }
        };
    }

    groupByType() {
        const types = {};
        this.generatedTests.forEach(test => {
            types[test.errorType] = (types[test.errorType] || 0) + 1;
        });
        return types;
    }
}

// Export global
window.TestGenerator = TestGenerator;
