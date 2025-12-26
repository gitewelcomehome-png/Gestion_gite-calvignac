// Script Node.js pour insérer un commit en base PostgreSQL
// Nécessite le package 'pg' (npm install pg)

const { Client } = require('pg');


async function insertCommitLog(commit_ref, commit_date, resume) {
    const client = new Client({
        user: process.env.PGUSER || 'postgres',
        host: process.env.PGHOST || 'localhost',
        database: process.env.PGDATABASE || 'gites',
        password: process.env.PGPASSWORD || 'postgres',
        port: process.env.PGPORT || 5432,
    });
    await client.connect();
    await client.query(
        'INSERT INTO commits_log (commit_ref, commit_date, resume) VALUES ($1, $2, $3)',
        [commit_ref, commit_date, resume]
    );
    await client.end();
    console.log('Commit log inséré:', commit_ref, commit_date, resume);
}

// Utilisation : node insert_commit_log.js <ref> <date> <resume>
if (require.main === module) {
    const [,, ref, date, ...resumeArr] = process.argv;
    if (!ref || !date || resumeArr.length === 0) {
        console.error('Usage: node insert_commit_log.js <ref> <date> <resume>');
        process.exit(1);
    }
    insertCommitLog(ref, date, resumeArr.join(' ')).catch(console.error);
}
