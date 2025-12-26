// Script Node.js pour insérer un commit en base PostgreSQL
// Nécessite le package 'pg' (npm install pg)

const { Client } = require('pg');

async function insertCommitLog(commit_ref, resume) {
    const client = new Client({
        user: process.env.PGUSER || 'postgres',
        host: process.env.PGHOST || 'localhost',
        database: process.env.PGDATABASE || 'gites',
        password: process.env.PGPASSWORD || 'postgres',
        port: process.env.PGPORT || 5432,
    });
    await client.connect();
    await client.query(
        'INSERT INTO commits_log (commit_ref, resume) VALUES ($1, $2)',
        [commit_ref, resume]
    );
    await client.end();
    console.log('Commit log inséré:', commit_ref, resume);
}

// Utilisation : node insert_commit_log.js <ref> <resume>
if (require.main === module) {
    const [,, ref, ...resumeArr] = process.argv;
    if (!ref || resumeArr.length === 0) {
        console.error('Usage: node insert_commit_log.js <ref> <resume>');
        process.exit(1);
    }
    insertCommitLog(ref, resumeArr.join(' ')).catch(console.error);
}
