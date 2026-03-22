/*
 * Export Supabase snapshot directly from a logged-in production page.
 * Usage (browser console):
 *   1) Open a production admin page while logged in
 *   2) Paste this file content in DevTools console
 *   3) Run: await window.exportSupabaseSnapshotFromBrowser()
 */

(function attachExporter(global) {
  const DEFAULT_GROUPS = {
    principales: [
      'gites',
      'infos_gites',
      'reservations',
      'cleaning_schedule',
      'cleaning_rules',
      'demandes_horaires',
      'todos',
      'faq',
      'activites_gites',
      'prestations_catalogue',
      'commandes_prestations',
      'lignes_commande_prestations',
      'fiscal_history',
      'fiscalite_amortissements',
      'simulations_fiscales',
      'checklist_templates',
      'checklist_progress',
      'client_access_tokens',
      'fiche_generation_logs',
      'retours_clients',
      'linen_needs',
      'linen_stock_items',
      'linen_stock_transactions',
      'user_settings',
      'user_notification_preferences',
      'community_artisans',
      'community_artisan_notes',
      'referrals'
    ],
    secondaires: ['historical_data', 'km_config_auto', 'km_trajets', 'km_lieux_favoris'],
    admin_support: [
      'user_roles',
      'cm_clients',
      'cm_invoices',
      'cm_support_tickets',
      'cm_support_ticket_history',
      'cm_error_logs',
      'cm_error_corrections',
      'cm_content_generated',
      'cm_promotions',
      'cm_promo_usage',
      'system_config'
    ],
    legacy_aliases: ['checklists', 'checklist_items', 'prestations_supplementaires', 'taches_menage']
  };

  const LEGACY_ALIAS_TO_TARGET = {
    checklists: 'checklist_templates',
    checklist_items: 'checklist_progress',
    prestations_supplementaires: 'prestations_catalogue',
    taches_menage: 'cleaning_rules'
  };

  const SENSITIVE_COLUMNS = [
    'token',
    'password',
    'refresh_token',
    'access_token',
    'api_key',
    'secret',
    'smtp_pass',
    'authorization'
  ];

  function maskValue(value) {
    if (value === null || value === undefined) return value;
    return '***';
  }

  function shouldMaskColumn(columnName) {
    const lower = String(columnName || '').toLowerCase();
    return SENSITIVE_COLUMNS.some((key) => lower.includes(key));
  }

  function buildRequestedTables(groups) {
    return Object.values(groups).flat();
  }

  function getGroupByTable(groups, tableName) {
    const entries = Object.entries(groups);
    for (const [group, tables] of entries) {
      if (tables.includes(tableName)) return group;
    }
    return 'autres';
  }

  async function getAuthHeaders(client, apiKey) {
    let accessToken = null;
    try {
      const sessionResult = await client.auth.getSession();
      accessToken = sessionResult?.data?.session?.access_token || null;
    } catch (_) {
      accessToken = null;
    }

    return {
      apikey: apiKey,
      Authorization: `Bearer ${accessToken || apiKey}`,
      Accept: 'application/json'
    };
  }

  async function discoverOpenApiTables(baseUrl, headers) {
    const openApiUrl = `${baseUrl}/rest/v1/?apikey=${encodeURIComponent(headers.apikey)}`;
    const response = await fetch(openApiUrl, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    if (!response.ok) {
      return { ok: false, reason: `${response.status} ${response.statusText}`, tables: [] };
    }

    const payload = await response.json();
    const paths = payload?.paths || {};
    const tables = Object.keys(paths)
      .map((path) => path.replace(/^\//, ''))
      .filter((name) => name && !name.includes('{'));

    return { ok: true, reason: null, tables: Array.from(new Set(tables)).sort() };
  }

  async function fetchTableRows(baseUrl, tableName, headers, pageSize) {
    const rows = [];
    let offset = 0;

    for (;;) {
      const url = `${baseUrl}/rest/v1/${encodeURIComponent(tableName)}?select=*&limit=${pageSize}&offset=${offset}`;
      const response = await fetch(url, { headers, cache: 'no-store' });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          ok: false,
          rows: [],
          error: errorText.slice(0, 800),
          status: response.status
        };
      }

      const page = await response.json();
      if (!Array.isArray(page)) {
        return {
          ok: false,
          rows: [],
          error: 'Response is not an array',
          status: response.status
        };
      }

      rows.push(...page);
      if (page.length < pageSize) break;
      offset += pageSize;
    }

    return { ok: true, rows, error: null, status: 200 };
  }

  function maskRows(rows, masked) {
    if (!masked) return rows;

    return rows.map((row) => {
      const output = {};
      for (const [key, value] of Object.entries(row)) {
        output[key] = shouldMaskColumn(key) ? maskValue(value) : value;
      }
      return output;
    });
  }

  function classifyError(errorText) {
    const msg = String(errorText || '').toLowerCase();
    if (msg.includes('permission denied') || msg.includes('rls')) return 'rls';
    if (msg.includes('jwt') || msg.includes('auth')) return 'auth';
    if (msg.includes('does not exist')) return 'table_absente';
    return 'autre';
  }

  function buildSummary(tableResults) {
    const values = Object.values(tableResults);

    let totalOk = 0;
    let totalTableAbsente = 0;
    let totalRls = 0;
    let totalAuth = 0;
    let totalAutre = 0;
    let totalRows = 0;

    for (const result of values) {
      if (result.ok) {
        totalOk += 1;
        totalRows += Number(result.count || 0);
        continue;
      }

      if (result.errorType === 'table_absente') totalTableAbsente += 1;
      else if (result.errorType === 'rls') totalRls += 1;
      else if (result.errorType === 'auth') totalAuth += 1;
      else totalAutre += 1;
    }

    return {
      totalRequested: values.length,
      totalOk,
      totalTableAbsente,
      totalRls,
      totalAuth,
      totalAutre,
      totalRows
    };
  }

  function downloadJson(data, fileName) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
  }

  async function exportSupabaseSnapshotFromBrowser(options = {}) {
    const startedAt = new Date().toISOString();

    const supabaseClient = options.supabaseClient || global.supabaseClient;
    const supabaseUrl = options.supabaseUrl || global.SUPABASE_URL || global.APP_CONFIG?.SUPABASE_URL;
    const supabaseKey = options.supabaseKey || global.SUPABASE_KEY || global.APP_CONFIG?.SUPABASE_KEY;

    if (!supabaseClient) {
      throw new Error('supabaseClient introuvable sur window. Ouvrir une page admin connectee.');
    }
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL/SUPABASE_KEY introuvables sur window.');
    }

    const masked = options.masked !== false;
    const pageSize = Number(options.pageSize || 1000);
    const groups = options.groups || DEFAULT_GROUPS;
    const requestedTables = options.tables || buildRequestedTables(groups);
    const headers = await getAuthHeaders(supabaseClient, supabaseKey);

    const discovery = await discoverOpenApiTables(supabaseUrl, headers);

    const tableResults = {};
    const errors = [];

    for (const tableName of requestedTables) {
      const aliasTarget = LEGACY_ALIAS_TO_TARGET[tableName] || null;
      const requestedTable = aliasTarget || tableName;
      const group = getGroupByTable(groups, tableName);

      const result = await fetchTableRows(supabaseUrl, requestedTable, headers, pageSize);

      if (!result.ok) {
        const errorType = classifyError(result.error);
        tableResults[tableName] = {
          group,
          ok: false,
          aliasApplied: Boolean(aliasTarget),
          aliasTarget,
          requestedTable,
          count: 0,
          errorType,
          error: result.error,
          rows: []
        };

        errors.push({ table: tableName, type: errorType, error: result.error });
        continue;
      }

      tableResults[tableName] = {
        group,
        ok: true,
        aliasApplied: Boolean(aliasTarget),
        aliasTarget,
        requestedTable,
        count: result.rows.length,
        errorType: null,
        error: null,
        rows: maskRows(result.rows, masked)
      };
    }

    const summary = buildSummary(tableResults);
    const discovered = new Set(discovery.tables || []);
    const candidates = requestedTables.filter((name) => !LEGACY_ALIAS_TO_TARGET[name]);
    const candidateMissing = candidates.filter((name) => !discovered.has(name));
    const discoveredNotExported = Array.from(discovered).filter((name) => !requestedTables.includes(name));

    const output = {
      generatedAt: new Date().toISOString(),
      startedAt,
      masked,
      pageSize,
      groups,
      requestedTables,
      summary,
      verification: {
        discovery: {
          openapiOk: discovery.ok,
          reason: discovery.reason,
          discoveredCount: discovered.size
        },
        completeness: {
          candidateCount: candidates.length,
          candidateExportedCount: candidates.length - candidateMissing.length,
          candidateMissingCount: candidateMissing.length,
          discoveredNotExportedCount: discoveredNotExported.length
        },
        candidateMissing,
        discoveredNotExported,
        errors
      },
      tableResults
    };

    const fileName = `export_snapshot_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    downloadJson(output, fileName);

    global.__LAST_SUPABASE_EXPORT__ = output;
    console.log('[export] done', {
      fileName,
      totalRequested: output.summary.totalRequested,
      totalOk: output.summary.totalOk,
      totalRows: output.summary.totalRows,
      totalRls: output.summary.totalRls
    });

    return output;
  }

  global.exportSupabaseSnapshotFromBrowser = exportSupabaseSnapshotFromBrowser;
})(window);
