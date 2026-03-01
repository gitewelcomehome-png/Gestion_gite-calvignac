#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://liveownerunit.fr}"
RUN_ID="${RUN_ID_OVERRIDE:-$(date -u +%Y-%m-%dT%H-%M-%SZ)}"
OUT_DIR="docs/rapports/performance"
RAW_FILE="${OUT_DIR}/LOAD_TEST_RAW_${RUN_ID}.csv"
SUMMARY_FILE="${OUT_DIR}/LOAD_TEST_SUMMARY_${RUN_ID}.json"
MANIFEST_FILE="${OUT_DIR}/LOAD_TEST_MANIFEST_${RUN_ID}.json"
UA="Mozilla/5.0 (compatible; LOU-LoadTest/1.0; +https://liveownerunit.fr)"
BASE_PHASES=8
ADMIN_PHASES=4
INCLUDE_ADMIN_SCENARIO="${INCLUDE_ADMIN_SCENARIO:-0}"

if [[ "${INCLUDE_ADMIN_SCENARIO}" == "1" || "${INCLUDE_ADMIN_SCENARIO}" == "true" ]]; then
  INCLUDE_ADMIN_SCENARIO=1
else
  INCLUDE_ADMIN_SCENARIO=0
fi

TOTAL_PHASES=$((BASE_PHASES + (INCLUDE_ADMIN_SCENARIO * ADMIN_PHASES)))

mkdir -p "${OUT_DIR}"

if [[ -f "${MANIFEST_FILE}" ]]; then
  echo "[resume] manifest détecté: ${MANIFEST_FILE}"
else
  echo "{\"run_id\":\"${RUN_ID}\",\"base_url\":\"${BASE_URL}\",\"status\":\"running\",\"updated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"raw_file\":\"${RAW_FILE}\",\"include_admin_scenario\":${INCLUDE_ADMIN_SCENARIO},\"total_phases\":${TOTAL_PHASES},\"phases_completed\":[]}" > "${MANIFEST_FILE}"
fi

if [[ -f "${RAW_FILE}" ]]; then
  echo "[resume] raw détecté: ${RAW_FILE}"
else
  echo "scenario,phase,request_id,http_code,time_total_sec" > "${RAW_FILE}"
fi

node - <<'EOF' "$MANIFEST_FILE"
const fs = require('fs');

const manifestFile = process.argv[2];
let manifest = {};

try {
  manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
} catch {
  manifest = { phases_completed: [] };
}

const phases = Array.isArray(manifest.phases_completed) ? manifest.phases_completed : [];
const dedupMap = new Map();

for (const item of phases) {
  if (!item || !item.scenario || !item.phase) continue;
  const key = `${item.scenario}|${item.phase}`;
  dedupMap.set(key, item);
}

manifest.phases_completed = Array.from(dedupMap.values());

if (typeof manifest.include_admin_scenario !== 'number') {
  manifest.include_admin_scenario = 0;
}

if (typeof manifest.total_phases !== 'number') {
  manifest.total_phases = manifest.include_admin_scenario ? 12 : 8;
}

manifest.updated_at = new Date().toISOString();

fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
EOF

MANIFEST_CONFIG=$(node - <<'EOF' "$MANIFEST_FILE" "$INCLUDE_ADMIN_SCENARIO" "$TOTAL_PHASES"
const fs = require('fs');

const manifestFile = process.argv[2];
const includeAdminRequested = Number(process.argv[3]) === 1 ? 1 : 0;
const requestedTotal = Number(process.argv[4]) || (includeAdminRequested ? 12 : 8);

let manifest = {};
try {
  manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
} catch {
  manifest = {};
}

const includeAdmin = typeof manifest.include_admin_scenario === 'number'
  ? (manifest.include_admin_scenario ? 1 : 0)
  : includeAdminRequested;

const totalPhases = typeof manifest.total_phases === 'number'
  ? manifest.total_phases
  : requestedTotal;

manifest.include_admin_scenario = includeAdmin;
manifest.total_phases = totalPhases;
manifest.updated_at = new Date().toISOString();
fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));

console.log(`${includeAdmin}|${totalPhases}`);
EOF
)

INCLUDE_ADMIN_SCENARIO="${MANIFEST_CONFIG%%|*}"
TOTAL_PHASES="${MANIFEST_CONFIG##*|}"

print_progress() {
  node - <<'EOF' "$MANIFEST_FILE" "$TOTAL_PHASES"
const fs = require('fs');

const manifestFile = process.argv[2];
const totalPhases = Number(process.argv[3]) || 12;

let manifest = {};
try {
  manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
} catch {
  manifest = { phases_completed: [] };
}

const done = Array.isArray(manifest.phases_completed) ? manifest.phases_completed.length : 0;
const uniqueDone = Array.isArray(manifest.phases_completed)
  ? new Set(manifest.phases_completed.map((item) => `${item.scenario}|${item.phase}`)).size
  : 0;
const pct = totalPhases > 0 ? Number(((uniqueDone / totalPhases) * 100).toFixed(1)) : 0;

manifest.progress = {
  done: uniqueDone,
  total: totalPhases,
  percent: pct
};
manifest.updated_at = new Date().toISOString();

fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
console.log(`[progress] ${uniqueDone}/${totalPhases} phases (${pct}%)`);
EOF
}

print_progress

is_phase_completed() {
  local scenario="$1"
  local phase="$2"

  node - <<'EOF' "$MANIFEST_FILE" "$scenario" "$phase"
const fs = require('fs');

const manifestFile = process.argv[2];
const scenario = process.argv[3];
const phase = process.argv[4];

try {
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const done = Array.isArray(manifest.phases_completed)
    && manifest.phases_completed.some((item) => item.scenario === scenario && item.phase === phase);
  process.exit(done ? 0 : 1);
} catch {
  process.exit(1);
}
EOF
}

run_one_request() {
  local request_id="$1"
  local endpoint="$2"
  local ua="$3"
  local base_url="$4"
  local phase="$5"
  local run_id="$6"

  local result
  result=$(curl -sS -A "$ua" \
    -H "Cache-Control: no-cache" \
    -H "Pragma: no-cache" \
    -o /dev/null \
    -w "%{http_code} %{time_total}" \
    "${base_url}${endpoint}?lt_run=${run_id}&phase=${phase}&r=${request_id}" || echo "000 30.000")

  echo "$result"
}

run_phase() {
  local scenario="$1"
  local phase="$2"
  local endpoint="$3"
  local total="$4"
  local concurrency="$5"

  if is_phase_completed "$scenario" "$phase"; then
    printf "[%s] %s -> déjà complété, phase ignorée\n" "$scenario" "$phase"
    print_progress
    return 0
  fi

  local tmp_file
  tmp_file="$(mktemp)"

  printf "\n[%s] phase=%s endpoint=%s total=%s concurrency=%s\n" "$scenario" "$phase" "$endpoint" "$total" "$concurrency"

  seq 1 "$total" | xargs -I{} -n1 -P "$concurrency" sh -c '
    request_id="$1"
    endpoint="$2"
    ua="$3"
    base_url="$4"
    phase="$5"
    run_id="$6"
    scenario="$7"

    out=$(curl -sS -A "$ua" \
      -H "Cache-Control: no-cache" \
      -H "Pragma: no-cache" \
      -o /dev/null \
      -w "%{http_code} %{time_total}" \
      "${base_url}${endpoint}?lt_run=${run_id}&phase=${phase}&r=${request_id}" || echo "000 30.000")

    code="000"
    ttotal="30.000"
    set -- $out
    [ -n "${1:-}" ] && code="$1"
    [ -n "${2:-}" ] && ttotal="$2"

    echo "${scenario},${phase},${request_id},${code},${ttotal}"
  ' _ {} "$endpoint" "$UA" "$BASE_URL" "$phase" "$RUN_ID" "$scenario" > "$tmp_file"

  cat "$tmp_file" >> "$RAW_FILE"

  local success_count total_count
  total_count=$(wc -l < "$tmp_file")
  success_count=$(awk -F',' '$4 ~ /^(2|3)[0-9][0-9]$/ {ok++} END {print ok+0}' "$tmp_file")
  printf "[%s] %s -> success=%s/%s\n" "$scenario" "$phase" "$success_count" "$total_count"

  local phase_summary_file
  phase_summary_file="${OUT_DIR}/LOAD_TEST_PHASE_${RUN_ID}_${scenario}_${phase}.json"
  node - <<'EOF' "$tmp_file" "$phase_summary_file" "$scenario" "$phase" "$RUN_ID"
const fs = require('fs');

const tmpFile = process.argv[2];
const outFile = process.argv[3];
const scenario = process.argv[4];
const phase = process.argv[5];
const runId = process.argv[6];

const content = fs.readFileSync(tmpFile, 'utf8').trim();
const lines = content ? content.split('\n') : [];
let total = 0;
let success = 0;
let error = 0;
const statusBuckets = {};
const times = [];

for (const line of lines) {
  const parts = line.split(',');
  if (parts.length < 5) continue;
  const code = Number(parts[3]);
  const t = Number(parts[4]) * 1000;
  if (!Number.isFinite(code)) continue;
  total += 1;
  statusBuckets[code] = (statusBuckets[code] || 0) + 1;
  if (code >= 200 && code < 400) {
    success += 1;
    if (Number.isFinite(t)) times.push(t);
  } else {
    error += 1;
  }
}

times.sort((a, b) => a - b);
const p = (pct) => {
  if (!times.length) return 0;
  const idx = Math.ceil((pct / 100) * times.length) - 1;
  return Math.round(times[Math.max(0, Math.min(idx, times.length - 1))]);
};
const avg = times.length ? Math.round(times.reduce((acc, v) => acc + v, 0) / times.length) : 0;

const payload = {
  run_id: runId,
  scenario,
  phase,
  generated_at: new Date().toISOString(),
  summary: {
    requests: total,
    success_count: success,
    error_count: error,
    error_rate_pct: total > 0 ? Number(((error / total) * 100).toFixed(2)) : 0,
    latency_ms: {
      min: times.length ? Math.round(times[0]) : 0,
      p50: p(50),
      p95: p(95),
      p99: p(99),
      max: times.length ? Math.round(times[times.length - 1]) : 0,
      avg
    },
    status_buckets: statusBuckets
  }
};

fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
EOF

  node - <<'EOF' "$MANIFEST_FILE" "$scenario" "$phase" "$phase_summary_file"
const fs = require('fs');

const manifestFile = process.argv[2];
const scenario = process.argv[3];
const phase = process.argv[4];
const phaseFile = process.argv[5];

let manifest = {};
try {
  manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
} catch {
  manifest = { phases_completed: [] };
}

if (!Array.isArray(manifest.phases_completed)) {
  manifest.phases_completed = [];
}

const existingIndex = manifest.phases_completed.findIndex((item) => item.scenario === scenario && item.phase === phase);
const payload = {
  scenario,
  phase,
  phase_summary_file: phaseFile,
  completed_at: new Date().toISOString()
};

if (existingIndex >= 0) {
  manifest.phases_completed[existingIndex] = payload;
} else {
  manifest.phases_completed.push(payload);
}
manifest.updated_at = new Date().toISOString();
  manifest.status = 'running';

fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
EOF

  print_progress

  rm -f "$tmp_file"
}

# Scénario 1 : endpoint API simple
run_phase "api_test" "warmup" "/api/test" 200 10
run_phase "api_test" "ramp_1" "/api/test" 600 30
run_phase "api_test" "ramp_2" "/api/test" 1200 60
run_phase "api_test" "peak" "/api/test" 2000 100

# Scénario 2 : endpoint API monitoring
run_phase "api_ai_health" "warmup" "/api/ai-health" 100 5
run_phase "api_ai_health" "ramp_1" "/api/ai-health" 300 15
run_phase "api_ai_health" "ramp_2" "/api/ai-health" 600 30
run_phase "api_ai_health" "peak" "/api/ai-health" 1000 50

# Scénario 3 : page admin de référence
if [[ "${INCLUDE_ADMIN_SCENARIO}" == "1" ]]; then
  run_phase "admin_security_page" "warmup" "/pages/admin-security-audit.html" 300 10
  run_phase "admin_security_page" "ramp_1" "/pages/admin-security-audit.html" 800 40
  run_phase "admin_security_page" "ramp_2" "/pages/admin-security-audit.html" 1200 80
  run_phase "admin_security_page" "peak" "/pages/admin-security-audit.html" 1500 120
else
  echo "[info] scénario admin désactivé (INCLUDE_ADMIN_SCENARIO=0)"
fi

node scripts/summarize-load-csv.mjs "$RAW_FILE" "$SUMMARY_FILE"

node - <<'EOF' "$MANIFEST_FILE" "$SUMMARY_FILE"
const fs = require('fs');
const manifestFile = process.argv[2];
const summaryFile = process.argv[3];

let manifest = {};
try {
  manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
} catch {
  manifest = {};
}

manifest.status = 'completed';
manifest.summary_file = summaryFile;
manifest.updated_at = new Date().toISOString();

fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
EOF

echo
echo "RAW: ${RAW_FILE}"
echo "SUMMARY: ${SUMMARY_FILE}"
echo "MANIFEST: ${MANIFEST_FILE}"