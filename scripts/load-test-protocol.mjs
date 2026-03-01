#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import process from 'node:process';

const DEFAULT_BASE_URL = 'https://liveownerunit.fr';
const DEFAULT_TIMEOUT_MS = 15000;

const scenarios = [
  {
    name: 'api_test_stable',
    path: '/api/test',
    method: 'GET',
    phases: [
      { label: 'warmup', durationSec: 20, concurrency: 5, delayMs: 120 },
      { label: 'ramp_1', durationSec: 30, concurrency: 10, delayMs: 90 },
      { label: 'ramp_2', durationSec: 30, concurrency: 20, delayMs: 70 },
      { label: 'peak', durationSec: 30, concurrency: 30, delayMs: 60 }
    ]
  },
  {
    name: 'api_ai_health_monitoring',
    path: '/api/ai-health',
    method: 'GET',
    phases: [
      { label: 'warmup', durationSec: 20, concurrency: 3, delayMs: 140 },
      { label: 'ramp_1', durationSec: 30, concurrency: 8, delayMs: 100 },
      { label: 'ramp_2', durationSec: 30, concurrency: 15, delayMs: 80 },
      { label: 'peak', durationSec: 30, concurrency: 25, delayMs: 70 }
    ]
  },
  {
    name: 'admin_security_report_page',
    path: '/pages/admin-security-audit.html',
    method: 'GET',
    phases: [
      { label: 'warmup', durationSec: 20, concurrency: 5, delayMs: 140 },
      { label: 'ramp_1', durationSec: 30, concurrency: 12, delayMs: 110 },
      { label: 'ramp_2', durationSec: 30, concurrency: 20, delayMs: 90 },
      { label: 'peak', durationSec: 30, concurrency: 30, delayMs: 80 }
    ]
  }
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    baseUrl: DEFAULT_BASE_URL,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    outputDir: 'docs/rapports/performance',
    runId: new Date().toISOString().replace(/[:.]/g, '-')
  };

  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];
    const next = args[i + 1];

    if (current === '--base-url' && next) {
      parsed.baseUrl = next;
      i += 1;
      continue;
    }

    if (current === '--timeout-ms' && next) {
      const timeout = Number(next);
      if (Number.isFinite(timeout) && timeout > 0) {
        parsed.timeoutMs = timeout;
      }
      i += 1;
      continue;
    }

    if (current === '--output-dir' && next) {
      parsed.outputDir = next;
      i += 1;
      continue;
    }
  }

  return parsed;
}

function percentile(values, pct) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((pct / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function summarize(samples, durationSec) {
  const latencies = samples.filter((item) => item.ok).map((item) => item.latencyMs);
  const successCount = samples.filter((item) => item.ok).length;
  const errorCount = samples.length - successCount;
  const statusBuckets = {};
  const errorBuckets = {};

  for (const sample of samples) {
    const status = sample.statusCode ?? 0;
    statusBuckets[status] = (statusBuckets[status] || 0) + 1;
    if (!sample.ok) {
      const code = sample.errorCode || `HTTP_${status}`;
      errorBuckets[code] = (errorBuckets[code] || 0) + 1;
    }
  }

  return {
    requests: samples.length,
    successCount,
    errorCount,
    errorRatePct: samples.length > 0 ? Number(((errorCount / samples.length) * 100).toFixed(2)) : 0,
    throughputRps: durationSec > 0 ? Number((samples.length / durationSec).toFixed(2)) : 0,
    latencyMs: {
      min: latencies.length ? Math.min(...latencies) : 0,
      p50: latencies.length ? percentile(latencies, 50) : 0,
      p95: latencies.length ? percentile(latencies, 95) : 0,
      p99: latencies.length ? percentile(latencies, 99) : 0,
      max: latencies.length ? Math.max(...latencies) : 0,
      avg: latencies.length ? Math.round(latencies.reduce((acc, value) => acc + value, 0) / latencies.length) : 0
    },
    statusBuckets,
    errorBuckets
  };
}

async function oneRequest(url, method, timeoutMs) {
  const start = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        'user-agent': 'LiveOwnerUnit-LoadTest/1.0 (+https://liveownerunit.fr)',
        accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
        'cache-control': 'no-cache',
        pragma: 'no-cache'
      }
    });
    await response.arrayBuffer();

    const latencyMs = Math.round(performance.now() - start);
    const ok = response.status >= 200 && response.status < 400;

    return {
      ok,
      statusCode: response.status,
      latencyMs,
      errorCode: ok ? null : `HTTP_${response.status}`
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - start);
    const aborted = error?.name === 'AbortError';

    return {
      ok: false,
      statusCode: 0,
      latencyMs,
      errorCode: aborted ? 'TIMEOUT' : 'NETWORK_ERROR'
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function runPhase(baseUrl, scenario, phase, timeoutMs) {
  const endAt = Date.now() + (phase.durationSec * 1000);
  const samples = [];
  const url = `${baseUrl}${scenario.path}`;

  const workers = Array.from({ length: phase.concurrency }, async () => {
    while (Date.now() < endAt) {
      const result = await oneRequest(url, scenario.method, timeoutMs);
      samples.push(result);
      const baseDelay = Number.isFinite(phase.delayMs) ? phase.delayMs : 0;
      if (baseDelay > 0) {
        const jitter = Math.floor(Math.random() * Math.max(1, Math.round(baseDelay * 0.2)));
        await sleep(baseDelay + jitter);
      }
    }
  });

  await Promise.all(workers);
  const summary = summarize(samples, phase.durationSec);

  return {
    ...phase,
    summary
  };
}

async function runScenario(baseUrl, scenario, timeoutMs) {
  const startedAt = new Date().toISOString();
  const phases = [];

  for (const phase of scenario.phases) {
    process.stdout.write(`\n[${scenario.name}] phase=${phase.label} concurrency=${phase.concurrency} duration=${phase.durationSec}s\n`);
    const result = await runPhase(baseUrl, scenario, phase, timeoutMs);
    phases.push(result);

    process.stdout.write(
      `[${scenario.name}] ${phase.label} -> requests=${result.summary.requests} errors=${result.summary.errorRatePct}% p95=${result.summary.latencyMs.p95}ms p99=${result.summary.latencyMs.p99}ms rps=${result.summary.throughputRps}\n`
    );
  }

  const durationTotal = phases.reduce((acc, item) => acc + item.durationSec, 0);
  const totalRequests = phases.reduce((acc, item) => acc + item.summary.requests, 0);
  const totalSuccess = phases.reduce((acc, item) => acc + item.summary.successCount, 0);
  const totalErrors = totalRequests - totalSuccess;

  const weightedAvgLatency = totalSuccess > 0
    ? Math.round(
        phases.reduce((acc, item) => acc + (item.summary.latencyMs.avg * item.summary.successCount), 0) / totalSuccess
      )
    : 0;

  const aggregateStatusBuckets = {};
  const aggregateErrorBuckets = {};

  for (const phase of phases) {
    for (const [status, count] of Object.entries(phase.summary.statusBuckets)) {
      aggregateStatusBuckets[status] = (aggregateStatusBuckets[status] || 0) + count;
    }
    for (const [code, count] of Object.entries(phase.summary.errorBuckets)) {
      aggregateErrorBuckets[code] = (aggregateErrorBuckets[code] || 0) + count;
    }
  }

  const aggregate = {
    requests: totalRequests,
    successCount: totalSuccess,
    errorCount: totalErrors,
    errorRatePct: totalRequests > 0 ? Number(((totalErrors / totalRequests) * 100).toFixed(2)) : 0,
    throughputRps: durationTotal > 0 ? Number((totalRequests / durationTotal).toFixed(2)) : 0,
    latencyMs: {
      min: (() => {
        const mins = phases.map((item) => item.summary.latencyMs.min).filter((value) => value > 0);
        return mins.length ? Math.min(...mins) : 0;
      })(),
      p50: Math.max(...phases.map((item) => item.summary.latencyMs.p50)),
      p95: Math.max(...phases.map((item) => item.summary.latencyMs.p95)),
      p99: Math.max(...phases.map((item) => item.summary.latencyMs.p99)),
      max: Math.max(...phases.map((item) => item.summary.latencyMs.max)),
      avg: weightedAvgLatency
    },
    statusBuckets: aggregateStatusBuckets,
    errorBuckets: aggregateErrorBuckets
  };

  return {
    name: scenario.name,
    method: scenario.method,
    path: scenario.path,
    startedAt,
    completedAt: new Date().toISOString(),
    phases,
    aggregate
  };
}

function globalConclusion(results) {
  const worstP95 = Math.max(...results.map((item) => item.aggregate.latencyMs.p95));
  const worstErrorRate = Math.max(...results.map((item) => item.aggregate.errorRatePct));
  const totalRequests = results.reduce((acc, item) => acc + item.aggregate.requests, 0);

  const slo = {
    p95MsTarget: 500,
    errorRatePctTarget: 1
  };

  const passed = worstP95 <= slo.p95MsTarget && worstErrorRate <= slo.errorRatePctTarget;

  const totalBlocked403 = results.reduce(
    (acc, item) => acc + (item.aggregate.errorBuckets?.HTTP_403 || 0),
    0
  );
  const blockedRatePct = totalRequests > 0 ? Number(((totalBlocked403 / totalRequests) * 100).toFixed(2)) : 0;

  return {
    passed,
    slo,
    measured: {
      totalRequests,
      worstP95,
      worstErrorRate,
      blocked403Count: totalBlocked403,
      blocked403RatePct: blockedRatePct
    },
    interpretation: blockedRatePct >= 20
      ? 'Edge/WAF likely throttling or blocking automated traffic (many HTTP 403); classify separately from pure application failure.'
      : 'No dominant WAF-style blocking detected.'
  };
}

async function main() {
  const options = parseArgs();
  const results = [];

  process.stdout.write(`Running load protocol against ${options.baseUrl}\n`);

  for (const scenario of scenarios) {
    const result = await runScenario(options.baseUrl, scenario, options.timeoutMs);
    results.push(result);
  }

  const conclusion = globalConclusion(results);

  const payload = {
    runId: options.runId,
    executedAt: new Date().toISOString(),
    baseUrl: options.baseUrl,
    timeoutMs: options.timeoutMs,
    scenarios: results,
    conclusion
  };

  await mkdir(options.outputDir, { recursive: true });
  const outputPath = `${options.outputDir}/LOAD_TEST_RESULTS_${options.runId}.json`;
  await writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf8');

  process.stdout.write(`\nResult file: ${outputPath}\n`);
  process.stdout.write(`Conclusion: ${conclusion.passed ? 'PASS' : 'FAIL'} | worst p95=${conclusion.measured.worstP95}ms | worst errorRate=${conclusion.measured.worstErrorRate}%\n`);
}

main().catch((error) => {
  console.error('Fatal load test error:', error);
  process.exitCode = 1;
});
