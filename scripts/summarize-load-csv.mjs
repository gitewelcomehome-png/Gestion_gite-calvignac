#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

function percentile(sortedValues, p) {
  if (!sortedValues.length) return 0;
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}

function summarizeRows(rows) {
  const total = rows.length;
  const okRows = rows.filter((row) => row.httpCode >= 200 && row.httpCode < 400);
  const errorRows = rows.filter((row) => !(row.httpCode >= 200 && row.httpCode < 400));

  const latenciesMs = okRows.map((row) => row.timeSec * 1000).sort((a, b) => a - b);
  const statusBuckets = {};

  for (const row of rows) {
    statusBuckets[row.httpCode] = (statusBuckets[row.httpCode] || 0) + 1;
  }

  const errorBuckets = {};
  for (const row of errorRows) {
    const code = String(row.httpCode);
    errorBuckets[code] = (errorBuckets[code] || 0) + 1;
  }

  const sumLatency = latenciesMs.reduce((acc, value) => acc + value, 0);

  return {
    requests: total,
    successCount: okRows.length,
    errorCount: errorRows.length,
    errorRatePct: total > 0 ? Number(((errorRows.length / total) * 100).toFixed(2)) : 0,
    latencyMs: {
      min: latenciesMs.length ? Math.round(latenciesMs[0]) : 0,
      p50: latenciesMs.length ? Math.round(percentile(latenciesMs, 50)) : 0,
      p95: latenciesMs.length ? Math.round(percentile(latenciesMs, 95)) : 0,
      p99: latenciesMs.length ? Math.round(percentile(latenciesMs, 99)) : 0,
      max: latenciesMs.length ? Math.round(latenciesMs[latenciesMs.length - 1]) : 0,
      avg: latenciesMs.length ? Math.round(sumLatency / latenciesMs.length) : 0
    },
    statusBuckets,
    errorBuckets
  };
}

async function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];

  if (!inputPath || !outputPath) {
    console.error('Usage: node scripts/summarize-load-csv.mjs <input.csv> <output.json>');
    process.exit(1);
  }

  const csvContent = await readFile(inputPath, 'utf8');
  const lines = csvContent.split('\n').map((line) => line.trim()).filter(Boolean);

  const parsed = [];

  for (const line of lines) {
    if (line.startsWith('scenario,phase,request_id,http_code,time_total_sec')) {
      continue;
    }

    if (!/^(api_test|api_ai_health|admin_security_page),/.test(line)) {
      continue;
    }

    const parts = line.split(',');

    if (parts.length < 4) {
      continue;
    }

    const scenario = parts[0];
    const phase = parts[1];
    const requestId = Number(parts[2]);

    let httpCode = NaN;
    let timeSec = NaN;

    if (parts.length >= 5) {
      httpCode = Number(parts[3]);
      timeSec = Number(parts[4]);
    } else {
      const merged = parts[3].trim();
      const mergedMatch = merged.match(/^(\d{3})\s+([0-9]*\.?[0-9]+)$/);
      if (mergedMatch) {
        httpCode = Number(mergedMatch[1]);
        timeSec = Number(mergedMatch[2]);
      }
    }

    if (!Number.isFinite(requestId) || !Number.isFinite(httpCode) || !Number.isFinite(timeSec)) {
      continue;
    }

    parsed.push({
      scenario,
      phase,
      requestId,
      httpCode,
      timeSec
    });
  }

  const byScenario = {};
  for (const row of parsed) {
    if (!byScenario[row.scenario]) {
      byScenario[row.scenario] = [];
    }
    byScenario[row.scenario].push(row);
  }

  const scenarios = [];
  for (const [scenarioName, scenarioRows] of Object.entries(byScenario)) {
    const phasesMap = {};
    for (const row of scenarioRows) {
      if (!phasesMap[row.phase]) {
        phasesMap[row.phase] = [];
      }
      phasesMap[row.phase].push(row);
    }

    const phases = Object.entries(phasesMap).map(([phaseName, phaseRows]) => ({
      phase: phaseName,
      summary: summarizeRows(phaseRows)
    }));

    scenarios.push({
      name: scenarioName,
      aggregate: summarizeRows(scenarioRows),
      phases
    });
  }

  const worstP95 = scenarios.length ? Math.max(...scenarios.map((s) => s.aggregate.latencyMs.p95)) : 0;
  const worstErrorRate = scenarios.length ? Math.max(...scenarios.map((s) => s.aggregate.errorRatePct)) : 0;
  const totalRequests = scenarios.reduce((acc, scenario) => acc + scenario.aggregate.requests, 0);

  const conclusion = {
    slo: {
      p95MsTarget: 500,
      errorRatePctTarget: 1
    },
    measured: {
      totalRequests,
      worstP95,
      worstErrorRate
    },
    passed: worstP95 <= 500 && worstErrorRate <= 1
  };

  const payload = {
    generatedAt: new Date().toISOString(),
    inputPath,
    scenarios,
    conclusion
  };

  await writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`Summary written to ${outputPath}`);
  console.log(`Conclusion: ${conclusion.passed ? 'PASS' : 'FAIL'} | worst p95=${worstP95}ms | worst errorRate=${worstErrorRate}%`);
}

main().catch((error) => {
  console.error('Fatal summary error:', error);
  process.exit(1);
});
