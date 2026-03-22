#!/usr/bin/env node

/*
 * Recover rows for empty public tables from a production Supabase REST API.
 * - Non-destructive: generates SQL with ON CONFLICT DO NOTHING
 * - Safe by default: does not apply SQL unless APPLY=1
 * - Requires TARGET_DATABASE_URL to introspect schema and optionally apply
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const TMP_DIR = path.join(ROOT, 'tmp');
const OUT_SQL = path.join(TMP_DIR, 'recover_missing_from_prod_rest.sql');
const COLS_FILE = path.join(TMP_DIR, 'recover_cols.txt');
const PK_FILE = path.join(TMP_DIR, 'recover_pk.txt');
const EMPTY_FILE = path.join(TMP_DIR, 'recover_empty_tables.txt');

const TARGET_DATABASE_URL = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL || '';
const PROD_SUPABASE_URL = process.env.PROD_SUPABASE_URL || 'https://fgqimtpjjhdqeyyaptoj.supabase.co';
const PROD_API_KEY = process.env.PROD_API_KEY || process.env.PROD_ANON_KEY || '';
const PROD_ACCESS_TOKEN = process.env.PROD_ACCESS_TOKEN || '';
const APPLY = process.env.APPLY === '1';
const PAGE_SIZE = Number(process.env.PAGE_SIZE || 1000);
const ONLY_TABLES = new Set(
  String(process.env.ONLY_TABLES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

function run(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
}

function escapeSqlString(str) {
  return String(str).replace(/'/g, "''");
}

function isUuid(v) {
  return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function toSqlLiteral(value, dataType, udtName) {
  if (value === null || value === undefined) return 'NULL';

  const t = (dataType || '').toLowerCase();
  const u = (udtName || '').toLowerCase();

  if (u === 'uuid' || t === 'uuid') {
    return isUuid(value) ? `'${escapeSqlString(value)}'::uuid` : 'NULL';
  }

  if (t === 'boolean') {
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'string') {
      const v = value.toLowerCase();
      if (v === 'true') return 'TRUE';
      if (v === 'false') return 'FALSE';
    }
    return 'NULL';
  }

  if (['smallint', 'integer', 'bigint', 'real', 'double precision', 'numeric', 'decimal'].includes(t)) {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? String(n) : 'NULL';
  }

  if (t === 'json' || t === 'jsonb') {
    return `'${escapeSqlString(JSON.stringify(value))}'::${t}`;
  }

  if (['date'].includes(t)) {
    return `'${escapeSqlString(String(value))}'::date`;
  }

  if (t.includes('timestamp')) {
    return `'${escapeSqlString(String(value))}'::timestamptz`;
  }

  if (typeof value === 'string') {
    return `'${escapeSqlString(value)}'`;
  }

  return `'${escapeSqlString(String(value))}'`;
}

function parsePipeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').trim();
  if (!content) return [];
  return content.split('\n').map((line) => line.split('|'));
}

async function fetchAllRows(table) {
  const rows = [];
  let offset = 0;

  for (;;) {
    const url = `${PROD_SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}?select=*&limit=${PAGE_SIZE}&offset=${offset}`;
    const res = await fetch(url, {
      headers: {
        apikey: PROD_API_KEY,
        Authorization: `Bearer ${PROD_ACCESS_TOKEN || PROD_API_KEY}`,
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, status: res.status, error: body.slice(0, 500), rows: [] };
    }

    const page = await res.json();
    if (!Array.isArray(page)) {
      return { ok: false, status: res.status, error: 'Response is not an array', rows: [] };
    }

    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return { ok: true, status: 200, error: null, rows };
}

async function main() {
  if (!TARGET_DATABASE_URL) {
    throw new Error('TARGET_DATABASE_URL (or DATABASE_URL) is required');
  }
  if (!PROD_API_KEY) {
    throw new Error('PROD_API_KEY (or PROD_ANON_KEY) is required');
  }

  fs.mkdirSync(TMP_DIR, { recursive: true });

  run(
    `psql "${TARGET_DATABASE_URL}" -At -F '|' -c "` +
      `select table_name, column_name, data_type, udt_name, is_nullable, coalesce(column_default, '') ` +
      `from information_schema.columns ` +
      `where table_schema='public' ` +
      `order by table_name, ordinal_position;" > "${COLS_FILE}"`
  );

  run(
    `psql "${TARGET_DATABASE_URL}" -At -F '|' -c "` +
      `select kcu.table_name, kcu.column_name ` +
      `from information_schema.table_constraints tc ` +
      `join information_schema.key_column_usage kcu ` +
      `on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema ` +
      `where tc.table_schema='public' and tc.constraint_type='PRIMARY KEY' ` +
      `order by kcu.table_name, kcu.ordinal_position;" > "${PK_FILE}"`
  );

  run(
    `psql "${TARGET_DATABASE_URL}" -At -c "` +
      `select t.tablename ` +
      `from pg_tables t ` +
      `join pg_stat_user_tables s on s.schemaname='public' and s.relname=t.tablename ` +
      `where t.schemaname='public' ` +
      `and t.tablename not in ('schema_migrations') ` +
      `and not exists (` +
      `  select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace ` +
      `  where n.nspname='public' and c.relname=t.tablename and c.relkind='v'` +
      `) ` +
      `and s.n_live_tup=0 ` +
      `order by t.tablename;" > "${EMPTY_FILE}"`
  );

  const colsData = parsePipeFile(COLS_FILE);
  const pkData = parsePipeFile(PK_FILE);
  const emptyTables = fs
    .readFileSync(EMPTY_FILE, 'utf8')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((table) => ONLY_TABLES.size === 0 || ONLY_TABLES.has(table));

  const tableDefs = new Map();
  for (const [table, col, type, udt, isNullable, colDefault] of colsData) {
    if (!tableDefs.has(table)) tableDefs.set(table, []);
    tableDefs.get(table).push({
      col,
      type,
      udt,
      isNullable: (isNullable || '').toUpperCase() === 'YES',
      hasDefault: Boolean((colDefault || '').trim())
    });
  }

  const pkDefs = new Map();
  for (const [table, col] of pkData) {
    if (!pkDefs.has(table)) pkDefs.set(table, []);
    pkDefs.get(table).push(col);
  }

  const sql = [];
  sql.push('-- Auto-generated by scripts/recover_missing_tables_from_prod_rest.js');
  sql.push('BEGIN;');

  let fetchedTables = 0;
  let insertedRows = 0;

  for (const table of emptyTables) {
    const defs = tableDefs.get(table) || [];
    if (!defs.length) continue;

    const byCol = new Map(defs.map((d) => [d.col, d]));
    const pkCols = pkDefs.get(table) || [];

    const result = await fetchAllRows(table);
    if (!result.ok) {
      console.log(`skip ${table}: status=${result.status} ${result.error}`);
      continue;
    }

    if (!result.rows.length) {
      console.log(`empty ${table}: 0 row via REST`);
      continue;
    }

    let tableRows = 0;
    for (const row of result.rows) {
      const cols = [];
      const vals = [];
      let invalid = false;

      for (const [k, v] of Object.entries(row)) {
        const def = byCol.get(k);
        if (!def) continue;

        const lit = toSqlLiteral(v, def.type, def.udt);
        if (lit === 'NULL' && !def.isNullable && !def.hasDefault) {
          invalid = true;
          break;
        }

        cols.push(`"${k}"`);
        vals.push(lit);
      }

      if (!cols.length || invalid) continue;

      for (const pk of pkCols) {
        const idx = cols.indexOf(`"${pk}"`);
        if (idx === -1 || vals[idx] === 'NULL') {
          invalid = true;
          break;
        }
      }
      if (invalid) continue;

      sql.push(`INSERT INTO public."${table}" (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;`);
      tableRows += 1;
      insertedRows += 1;
    }

    if (tableRows > 0) {
      fetchedTables += 1;
      console.log(`table ${table}: ${tableRows} row(s) prepared`);
    } else {
      console.log(`table ${table}: no insertable rows`);
    }
  }

  sql.push('COMMIT;');
  fs.writeFileSync(OUT_SQL, `${sql.join('\n')}\n`);

  console.log(`empty_tables=${emptyTables.length}`);
  console.log(`tables_with_rows_prepared=${fetchedTables}`);
  console.log(`rows_prepared=${insertedRows}`);
  console.log(`sql_file=${OUT_SQL}`);

  if (APPLY && insertedRows > 0) {
    run(`psql "${TARGET_DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${OUT_SQL}"`);
    console.log('sql_applied=1');
  } else {
    console.log('sql_applied=0');
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
