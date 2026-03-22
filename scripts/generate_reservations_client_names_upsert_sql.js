#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const SNAPSHOT_PATH = path.join(process.cwd(), 'tmp', 'export_snapshot.json');
const OUTPUT_PATH = path.join(process.cwd(), 'tmp', 'update_reservations_client_names.sql');

function sqlString(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function isUsableName(value) {
  if (value === null || value === undefined) return false;
  const trimmed = String(value).trim();
  if (trimmed === '') return false;
  if (trimmed.toUpperCase() === 'REDACTED') return false;
  if (/^\*+$/.test(trimmed)) return false;
  return true;
}

function getReservations(snapshot) {
  const tableResults = snapshot.tableResults || snapshot.tables || {};
  const reservations = tableResults.reservations;
  if (!reservations) return [];
  if (Array.isArray(reservations)) return reservations;
  if (Array.isArray(reservations.rows)) return reservations.rows;
  return [];
}

function main() {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    throw new Error(`Snapshot introuvable: ${SNAPSHOT_PATH}`);
  }

  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const reservations = getReservations(snapshot);

  const lines = [];
  lines.push('-- Generated file: update client_name on existing rows in public.reservations');
  lines.push('BEGIN;');

  let count = 0;
  for (const row of reservations) {
    if (!row || !row.id) continue;
    if (!isUsableName(row.client_name)) continue;

    lines.push(
      `UPDATE public."reservations" SET "client_name" = ${sqlString(row.client_name)} WHERE "id" = ${sqlString(row.id)}::uuid;`
    );
    count += 1;
  }

  lines.push('COMMIT;');
  lines.push('');

  fs.writeFileSync(OUTPUT_PATH, lines.join('\n'), 'utf8');

  console.log(`reservations_total=${reservations.length}`);
  console.log(`client_names_updates=${count}`);
  console.log(`output_sql=${OUTPUT_PATH}`);
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
