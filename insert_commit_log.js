// Script Node.js pour insérer un commit dans Supabase
// Usage: node insert_commit_log.js <ref> <resume>
// Exemple: node insert_commit_log.js abc1234 "Ajout de nouvelles fonctionnalités"

const https = require('https');

const SUPABASE_URL = 'https://ivqiisnudabxemcxxyru.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cWlpc251ZGFieGVtY3h4eXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTk0NjMsImV4cCI6MjA4MDk3NTQ2M30.9FwJPgR8bbaP7bAemuaVbAN019EO5ql7uciQO9FeHK4';

async function insertCommitLog(commit_ref, resume) {
    const data = JSON.stringify({
        commit_ref: commit_ref,
        commit_date: new Date().toISOString(),
        resume: resume
    });

    const url = new URL('/rest/v1/commits_log', SUPABASE_URL);
    
    const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=representation'
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('✅ Commit enregistré dans Supabase');
                    console.log('   Ref:', commit_ref);
                    console.log('   Résumé:', resume);
                    resolve(body);
                } else {
                    console.error('❌ Erreur Supabase:', res.statusCode, body);
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });

        req.on('error', (err) => {
            console.error('❌ Erreur réseau:', err.message);
            reject(err);
        });

        req.write(data);
        req.end();
    });
}

// Utilisation : node insert_commit_log.js <ref> <resume>
if (require.main === module) {
    const [,, ref, ...resumeArr] = process.argv;
    if (!ref || resumeArr.length === 0) {
        console.error('Usage: node insert_commit_log.js <ref> <resume>');
        console.error('Exemple: node insert_commit_log.js abc1234 "Correction de bugs"');
        process.exit(1);
    }
    const resume = resumeArr.join(' ');
    insertCommitLog(ref, resume).catch((err) => {
        console.error('Échec:', err.message);
        process.exit(1);
    });
}

module.exports = { insertCommitLog };

