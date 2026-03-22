#!/usr/bin/env node

/*
 * Import rows from docs/EXPORT_SUPABASE_VALIDATION.md extracted JSON snapshot.
 * - Skips masked values (*** -> NULL)
 * - Inserts only existing columns/tables in current public schema
 * - Uses ON CONFLICT DO NOTHING when primary key exists
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const TMP_DIR = path.join(ROOT, 'tmp');
const SNAPSHOT_FILE = path.join(TMP_DIR, 'export_snapshot.json');
const METADATA_FILE = path.join(TMP_DIR, 'db_columns.txt');
const PK_FILE = path.join(TMP_DIR, 'db_primary_keys.txt');
const OUT_SQL = path.join(TMP_DIR, 'import_from_export_snapshot.sql');

function run(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
}

function escapeSqlString(str) {
  return String(str).replace(/'/g, "''");
}

function isUuid(v) {
  return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function isMasked(v) {
  return typeof v === 'string' && v.includes('***');
}

function toSqlLiteral(value, dataType, udtName) {
  if (value === null || value === undefined) return 'NULL';
  if (isMasked(value)) return 'NULL';

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
    try {
      return `'${escapeSqlString(JSON.stringify(value))}'::${t}`;
    } catch (_e) {
      return 'NULL';
    }
  }

  // For date/time/text-like types, keep string serialization.
  if (typeof value === 'string') {
    return `'${escapeSqlString(value)}'`;
  }

  return `'${escapeSqlString(String(value))}'`;
}

function loadDelimited(file, delimiter = '|') {
  const txt = fs.readFileSync(file, 'utf8').trim();
  if (!txt) return [];
  return txt.split('\n').map((line) => line.split(delimiter));
}

function main() {
  if (!fs.existsSync(SNAPSHOT_FILE)) {
    throw new Error(`Snapshot not found: ${SNAPSHOT_FILE}`);
  }

  fs.mkdirSync(TMP_DIR, { recursive: true });

  if (process.env.DATABASE_URL) {
    run(
      `psql "${process.env.DATABASE_URL}" -At -F '|' -c "` +
        `select table_name, column_name, data_type, udt_name, is_nullable, coalesce(column_default, '') ` +
        `from information_schema.columns ` +
        `where table_schema='public' ` +
        `order by table_name, ordinal_position;" > "${METADATA_FILE}"`
    );

    run(
      `psql "${process.env.DATABASE_URL}" -At -F '|' -c "` +
        `select kcu.table_name, kcu.column_name ` +
        `from information_schema.table_constraints tc ` +
        `join information_schema.key_column_usage kcu ` +
        `on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema ` +
        `where tc.table_schema='public' and tc.constraint_type='PRIMARY KEY' ` +
        `order by kcu.table_name, kcu.ordinal_position;" > "${PK_FILE}"`
    );
  } else {
    if (!fs.existsSync(METADATA_FILE) || !fs.existsSync(PK_FILE)) {
      throw new Error('DATABASE_URL is required (or provide tmp/db_columns.txt and tmp/db_primary_keys.txt)');
    }
  }

  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'));
  const tableDefs = new Map();
  for (const [table, col, type, udt, isNullable, columnDefault] of loadDelimited(METADATA_FILE, '|')) {
    if (!tableDefs.has(table)) tableDefs.set(table, []);
    tableDefs.get(table).push({
      col,
      type,
      udt,
      isNullable: (isNullable || '').toUpperCase() === 'YES',
      hasDefault: Boolean((columnDefault || '').trim())
    });
  }

  const pkDefs = new Map();
  for (const [table, col] of loadDelimited(PK_FILE, '|')) {
    if (!pkDefs.has(table)) pkDefs.set(table, []);
    pkDefs.get(table).push(col);
  }

  const sql = [];
  sql.push('-- Auto-generated import from tmp/export_snapshot.json');
  sql.push('BEGIN;');
  sql.push("SET LOCAL session_replication_role = 'replica';");

  let totalRows = 0;
  let insertedRows = 0;
  let skippedRows = 0;
  let usedTables = 0;

  const snapshotTables = snapshot.tables || snapshot.tableResults || {};

  for (const [tableName, tableObj] of Object.entries(snapshotTables)) {
    const rows = Array.isArray(tableObj?.rows) ? tableObj.rows : [];
    if (!rows.length) continue;
    totalRows += rows.length;

    const defs = tableDefs.get(tableName);
    if (!defs || !defs.length) {
      skippedRows += rows.length;
      continue;
    }

    const byCol = new Map(defs.map((d) => [d.col, d]));
    const pkCols = pkDefs.get(tableName) || [];
    let tableInserted = 0;

    for (const row of rows) {
      let invalidPk = false;
      const cols = [];
      const vals = [];

      for (const [k, v] of Object.entries(row)) {
        const def = byCol.get(k);
        if (!def) continue;

        let literal = toSqlLiteral(v, def.type, def.udt);
        if (literal === 'NULL' && def.isNullable === false) {
          const type = (def.type || '').toLowerCase();
          const udt = (def.udt || '').toLowerCase();

          if (def.hasDefault) {
            continue;
          }

          if (udt === 'uuid' || type === 'uuid') {
            invalidPk = true;
            break;
          }

          if (['text', 'character varying', 'character'].includes(type)) {
            literal = "'REDACTED'";
          } else if (type === 'boolean') {
            literal = 'FALSE';
          } else if (['smallint', 'integer', 'bigint', 'real', 'double precision', 'numeric', 'decimal'].includes(type)) {
            literal = '0';
          } else {
            invalidPk = true;
            break;
          }
        }

        cols.push(`"${k}"`);
        vals.push(literal);
      }

      // Fill required columns missing from the snapshot payload.
      for (const def of defs) {
        const colRef = `"${def.col}"`;
        if (cols.includes(colRef)) continue;
        if (def.isNullable) continue;
        if (def.hasDefault) continue;

        const type = (def.type || '').toLowerCase();
        const udt = (def.udt || '').toLowerCase();

        if (udt === 'uuid' || type === 'uuid') {
          invalidPk = true;
          break;
        }

        let fallback = null;
        if (['text', 'character varying', 'character'].includes(type)) {
          fallback = "'REDACTED'";
        } else if (type === 'boolean') {
          fallback = 'FALSE';
        } else if (['smallint', 'integer', 'bigint', 'real', 'double precision', 'numeric', 'decimal'].includes(type)) {
          fallback = '0';
        }

        if (!fallback) {
          invalidPk = true;
          break;
        }

        cols.push(colRef);
        vals.push(fallback);
      }

      if (invalidPk || !cols.length) {
        skippedRows++;
        continue;
      }

      // Skip row when any PK column is present in schema but NULL in insert payload.
      for (const pk of pkCols) {
        const idx = cols.indexOf(`"${pk}"`);
        if (idx === -1 || vals[idx] === 'NULL') {
          invalidPk = true;
          break;
        }
      }
      if (invalidPk) {
        skippedRows++;
        continue;
      }

      const conflict = ' ON CONFLICT DO NOTHING';
      sql.push(`INSERT INTO public."${tableName}" (${cols.join(', ')}) VALUES (${vals.join(', ')})${conflict};`);
      insertedRows++;
      tableInserted++;
    }

    if (tableInserted > 0) usedTables++;
  }

  sql.push('COMMIT;');
  fs.writeFileSync(OUT_SQL, sql.join('\n') + '\n');

  console.log(`snapshot_tables=${Object.keys(snapshotTables).length}`);
  console.log(`snapshot_rows=${totalRows}`);
  console.log(`generated_inserts=${insertedRows}`);
  console.log(`skipped_rows=${skippedRows}`);
  console.log(`target_tables_with_rows=${usedTables}`);
  console.log(`sql_file=${OUT_SQL}`);
}

main();
