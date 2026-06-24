// Parse a 2026 Tech Financials Excel workbook into the same shape as data/financials.json.
// Uses SheetJS (loaded via <script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.full.min.js">)
//
// Returns: { summary, vendors, domainOwners, riskOppLog, lineItems, lookups, _rowCount, _excludedCount }
// or throws an Error with a friendly message.

(function () {
  // Column header → field. Headers appear in row 0 of "Master Data (DO NOT EDIT)".
  const HEADERS = {
    'Transaction Type': 'transactionType',
    'D365 Legal Vendor name': 'vendor',
    'DBA / AKA / Passthrough': 'vendorDba',
    'Project ID': 'projectId',
    'Project Name': 'project',
    'Domain': 'domain',
    'Domain Owner': 'owner',
    'Application': 'application',
    'Project Details': 'projectDetails',
    'Category': 'category',
    'Sub-Category1': 'subCategory',
    'Contract Type': 'contractType',
    'MGMT View Category (OneStream)': 'onestreamCategory',
    'Accounting Treatment': 'treatment',
    '2026 Final Budget': 'budget',
    '2026 (Actuals + Forecast)': 'forecast',
    '2026 Opportunity': 'opp',
    '2026 Risk': 'risk',
    '2026 Net Position': 'net',
    'Notes': 'notes',
    'Total Actuals': 'actual',
  };

  const MONTHS_AC = ['Jan AC','Feb AC','Mar AC','Apr AC','May AC','Jun AC','Jul AC','Aug AC','Sep AC','Oct AC','Nov AC','Dec AC'];
  const MONTHS_FC = ['Jan FC','Feb FC','Mar FC','Apr FC','May FC','Jun FC','Jul FC','Aug FC','Sep FC','Oct FC','Nov FC','Dec FC'];
  const MONTHS_OR = ['Jan Opp/Risk','Feb Opp./Risk','Mar Opp./Risk','Apr Opp./Risk','May Opp./Risk','Jun Opp./Risk','Jul Opp./Risk','Aug Opp./Risk','Sep Opp./Risk','Oct Opp./Risk','Nov Opp./Risk','Dec Opp./Risk'];
  // Some files may have different punctuation; try a tolerant fallback for OR.
  const MONTHS_OR_ALT = ['Jan Opp./Risk','Feb Opp/Risk','Mar Opp/Risk','Apr Opp/Risk','May Opp/Risk','Jun Opp/Risk','Jul Opp/Risk','Aug Opp/Risk','Sep Opp/Risk','Oct Opp/Risk','Nov Opp/Risk','Dec Opp/Risk'];

  const num = (v) => {
    if (v === null || v === undefined || v === '') return 0;
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[, ]/g, ''));
    return isNaN(n) ? 0 : n;
  };
  const str = (v) => v === null || v === undefined ? '' : String(v).trim();

  function findHeaderRow(rows) {
    for (let r = 0; r < Math.min(rows.length, 5); r++) {
      const row = rows[r] || [];
      if (row.includes('Transaction Type') && row.includes('D365 Legal Vendor name')) return r;
    }
    throw new Error('Could not find header row. Expected a row with "Transaction Type" and "D365 Legal Vendor name".');
  }

  function buildColIndex(headerRow) {
    const idx = {};
    headerRow.forEach((h, i) => {
      const key = str(h);
      if (key) idx[key] = i;
    });
    return idx;
  }

  function readArr(row, colIdx, names) {
    const out = new Array(12).fill(0);
    for (let i = 0; i < 12; i++) {
      const ci = colIdx[names[i]];
      if (ci != null) out[i] = num(row[ci]);
    }
    return out;
  }

  function parseExcelArrayBuffer(arrayBuffer) {
    if (typeof XLSX === 'undefined') {
      throw new Error('SheetJS (XLSX) library not loaded. Check <script> tag.');
    }
    const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellFormula: true });
    let sheetName = wb.SheetNames.find(n => n.toLowerCase().includes('master data'));
    if (!sheetName) {
      throw new Error(
        `Sheet "Master Data (DO NOT EDIT)" not found. Found sheets: ${wb.SheetNames.join(', ')}`
      );
    }
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
    if (!rows.length) throw new Error('Master Data sheet is empty.');

    const headerRowIdx = findHeaderRow(rows);
    const colIdx = buildColIndex(rows[headerRowIdx]);

    // Sanity: required columns
    const required = ['Transaction Type', 'D365 Legal Vendor name', '2026 Final Budget', 'Total Actuals'];
    const missing = required.filter(h => !(h in colIdx));
    if (missing.length) throw new Error(`Missing columns in Master Data: ${missing.join(', ')}`);

    // Resolve OR header set — some files use one variant, some the other. Build a tolerant resolver.
    const resolvedOR = MONTHS_OR.map((m, i) => {
      if (m in colIdx) return m;
      if (MONTHS_OR_ALT[i] in colIdx) return MONTHS_OR_ALT[i];
      // Last-ditch: find any header starting with month abbrev + "Opp"
      const abbrev = m.slice(0, 3);
      const found = Object.keys(colIdx).find(k => k.startsWith(abbrev) && /Opp/.test(k));
      return found || m; // may end up missing → array will have 0
    });

    // ════════════════════════════════════════════════════════════════════════
    // ROW INCLUSION RULE
    // ════════════════════════════════════════════════════════════════════════
    //
    // The dashboard dataset is scoped to exactly the same rows as the
    // workbook SUBTOTAL formula found in the Master Data sheet.
    //
    // How it works (automatic, no hardcoded row numbers):
    //
    //   1. Pre-scan: locate the SUBTOTAL summary row (identified by having no
    //      Transaction Type, no Category, and no Sub-Category).
    //
    //   2. Read the formula stored in its Budget cell, e.g.:
    //        =SUBTOTAL(9, V2:V140)
    //      Extract the upper bound of the range (140 in this example).
    //
    //   3. Restrict all data processing to Excel rows within that range.
    //      Any row whose Excel row number exceeds the upper bound is excluded.
    //
    //   4. Read the SUBTOTAL cell values as the authoritative KPI totals
    //      (stored as workbookSubtotal). These are used directly for all
    //      headline KPI cards when no filters are active, guaranteeing that
    //      Dashboard values = Workbook SUBTOTAL values.
    //
    // Why this matters:
    //   The workbook may contain rows AFTER the SUBTOTAL formula range
    //   (e.g. adjustment rows, draft entries, reconciling items) that the
    //   Finance team intentionally excluded from reporting. By scoping to
    //   the formula range, the dashboard automatically mirrors the same
    //   boundary the analyst set in the workbook.
    //
    // If the workbook changes:
    //   • Rows added WITHIN the formula range (e.g. V2:V141) → included.
    //   • SUBTOTAL formula range extended (e.g. V2:V155) → dashboard extends.
    //   • SUBTOTAL formula range shrunk → dashboard shrinks.
    //   No code change required.
    //
    // Fallback (if formula string is unavailable):
    //   Accumulate the budget column row-by-row until the running total
    //   matches workbookSubtotal.budget (within $1). The row where the match
    //   occurs is used as the upper bound. This handles cases where the
    //   Excel file stores only the computed value, not the formula string.
    // ════════════════════════════════════════════════════════════════════════

    // subtotalRangeEnd: the last Excel row number covered by the SUBTOTAL formula.
    // null means no SUBTOTAL row was found; all rows will be processed.
    let subtotalRangeEnd = null;
    let workbookSubtotal = null;  // Authoritative KPI values from the SUBTOTAL row

    // subtotalRowIdx: SheetJS row index of the SUBTOTAL row.
    // Used in Step 3 to avoid double-counting the SUBTOTAL row's formula value.
    let subtotalRowIdx = -1;

    // ── STEP 1: Pre-scan — locate SUBTOTAL row and read its formula ──────
    for (let ps = headerRowIdx + 1; ps < rows.length; ps++) {
      const psRow = rows[ps];
      if (!psRow || psRow.every(v => v === null || v === '' || v === undefined)) continue;

      const psTx  = str(psRow[colIdx['Transaction Type']]);
      const psCat = str(psRow[colIdx['Category']]);
      const psSub = str(psRow[colIdx['Sub-Category1']]);

      // SUBTOTAL row has no Transaction Type, no Category, and no Sub-Category
      if (!psTx && !psCat && !psSub) {

        subtotalRowIdx = ps; // Save for main loop exclusion guard

        // ── Capture authoritative KPI totals from the SUBTOTAL row ──────
        workbookSubtotal = {
          budget:   num(psRow[colIdx['2026 Final Budget']]),
          forecast: num(psRow[colIdx['2026 (Actuals + Forecast)']]),
          actual:   num(psRow[colIdx['Total Actuals']]),
          risk:     num(psRow[colIdx['2026 Risk']]),
          opp:      num(psRow[colIdx['2026 Opportunity']]),
          net:      num(psRow[colIdx['2026 Net Position']]),
        };
        workbookSubtotal.absOpp    = Math.abs(workbookSubtotal.opp);
        workbookSubtotal.remaining = workbookSubtotal.forecast - workbookSubtotal.actual;

        // ── Extract formula range end from the SUBTOTAL cell ────────────
        // The Budget column cell should contain e.g. =SUBTOTAL(9,V2:V140).
        // We parse the upper-bound row number from that formula string.
        const budCellAddr = XLSX.utils.encode_cell({ r: ps, c: colIdx['2026 Final Budget'] });
        const budCell     = ws[budCellAddr];
        if (budCell && budCell.f) {
          // Match the end of a range reference like ":V140)" or ":AB140,"
          const rangeMatch = budCell.f.match(/:[A-Z]+(\d+)\s*[),]/);
          if (rangeMatch) {
            subtotalRangeEnd = parseInt(rangeMatch[1], 10);
          }
        }

        break; // Only the first SUBTOTAL row is used
      }
    }

    // ── STEP 2: Fallback — derive range end via budget-sum matching ──────
    // Used when the XLSX file stores only computed values, not formula strings.
    if (!subtotalRangeEnd && workbookSubtotal) {
      const targetBudget = workbookSubtotal.budget; // = SUM of all rows in SUBTOTAL range
      let cumBudget = 0;
      for (let ri = headerRowIdx + 1; ri < rows.length; ri++) {
        const rrow = rows[ri];
        if (!rrow || rrow.every(v => v === null || v === '')) continue;
        const rtx  = str(rrow[colIdx['Transaction Type']]);
        const rcat = str(rrow[colIdx['Category']]);
        const rsub = str(rrow[colIdx['Sub-Category1']]);
        if (!rtx && !rcat && !rsub) break; // Reached SUBTOTAL row — stop
        cumBudget += num(rrow[colIdx['2026 Final Budget']]);
        // When the running total matches the SUBTOTAL budget (within $1 for float rounding),
        // the current row is the last row in the SUBTOTAL range.
        if (Math.abs(cumBudget - targetBudget) < 1) {
          subtotalRangeEnd = ri + 1; // Convert 0-based SheetJS index to 1-based Excel row
          break;
        }
      }
    }

    // ── STEP 3: Main data loop — process only rows within the SUBTOTAL range ─
    const lineItems = [];
    let rowCount = 0;
    let excludedCount = 0;
    // Track totals for ALL rows excluded within the SUBTOTAL range (any exclusion
    // reason: Capitalization type, no vendor/project, summary rows).
    // This covers every path that removes a row from lineItems but leaves it in the
    // SUBTOTAL formula — regardless of which field or rule triggered the exclusion.
    // NOTE: the SUBTOTAL row itself (subtotalRowIdx) is always skipped.
    let exclBudget = 0, exclForecast = 0, exclActual = 0, exclRisk = 0, exclOpp = 0, exclNet = 0;
    const capRowLog = []; // diagnostic: rows excluded as Capitalization
    for (let r = headerRowIdx + 1; r < rows.length; r++) {

      // Convert SheetJS 0-based row index to 1-based Excel row number
      const excelRowNum = r + 1;

      // ── ROW INCLUSION GATE ──────────────────────────────────────────────
      // If a SUBTOTAL range was found, skip any row beyond its upper bound.
      // This ensures the dataset matches the SUBTOTAL formula range exactly.
      // Example: if subtotalRangeEnd = 140, rows 141+ are excluded.
      if (subtotalRangeEnd && excelRowNum > subtotalRangeEnd) {
        excludedCount++;
        continue;
      }
      const row = rows[r];
      if (!row || row.every(v => v === null || v === '' || v === undefined)) continue;

      // Build base record
      const rec = {};
      for (const [hdr, fld] of Object.entries(HEADERS)) {
        const ci = colIdx[hdr];
        rec[fld] = ci != null ? row[ci] : null;
      }

      const tx = str(rec.transactionType);
      // Pre-read financial values — used for exclusion tracking and lineItem building.
      // Inlined at each exclusion path (no helper function — avoids Babel hoisting issues
      // with function declarations inside for-loop blocks).
      const _rB = num(rec.budget), _rF = num(rec.forecast), _rA = num(rec.actual),
            _rR = num(rec.risk),   _rO = num(rec.opp),      _rN = num(rec.net);
      // ── Exclusion path A: Capitalization transaction type ─────────────
      if (tx.toLowerCase() === 'capitalization') {
        if (r !== subtotalRowIdx) {
          exclBudget += _rB; exclForecast += _rF; exclActual += _rA;
          exclRisk   += _rR; exclOpp      += _rO; exclNet    += _rN;
        }
        capRowLog.push({ excelRow: excelRowNum, budget:_rB, forecast:_rF, actual:_rA, risk:_rR, opp:_rO, net:_rN, reason:'cap-tx' });
        excludedCount++;
        continue;
      }
      // ── Exclusion path B: no vendor AND no project ────────────────────
      if (!str(rec.vendor) && !str(rec.project)) {
        if (r !== subtotalRowIdx) {
          exclBudget += _rB; exclForecast += _rF; exclActual += _rA;
          exclRisk   += _rR; exclOpp      += _rO; exclNet    += _rN;
        }
        capRowLog.push({ excelRow: excelRowNum, budget:_rB, forecast:_rF, actual:_rA, risk:_rR, opp:_rO, net:_rN, reason:'no-vendor-project', tx });
        continue;
      }
      // ── Exclusion path C: summary/subtotal rows (no tx, no cat, no subcat) ──
      const recCat    = str(rec.category);
      const recSubCat = str(rec.subCategory);
      if (!tx && !recCat && !recSubCat) {
        if (r !== subtotalRowIdx) {
          exclBudget += _rB; exclForecast += _rF; exclActual += _rA;
          exclRisk   += _rR; exclOpp      += _rO; exclNet    += _rN;
        }
        excludedCount++;
        continue;
      }

      const lineItem = {
        vendor: str(rec.vendor) || '',
        domain: str(rec.domain) || '',
        owner: str(rec.owner) || 'N/A',
        category: str(rec.category) || '',
        project: str(rec.project) || '',
        application: str(rec.application) || '',
        subCategory: str(rec.subCategory) || '',
        treatment: str(rec.treatment) || '',
        budget: num(rec.budget),
        actual: num(rec.actual),
        forecast: num(rec.forecast),
        risk: num(rec.risk),
        opp: num(rec.opp),
        net: num(rec.net),
        notes: str(rec.notes) || '',
        monthlyAC: readArr(row, colIdx, MONTHS_AC),
        monthlyFC: readArr(row, colIdx, MONTHS_FC),
        monthlyOR: readArr(row, colIdx, resolvedOR),
        onestreamCategory: str(rec.onestreamCategory) || '',
      };
      lineItems.push(lineItem);
      rowCount++;
    }

    // ── Adjust workbookSubtotal to exclude Capitalization rows ─────────────
    // Cap exclusion accounting complete — adjustment applied conditionally below
    // Adjust workbookSubtotal only when it differs from lineItems sums.
    //
    // Two cases handled:
    //  a) Workbook saved WITH filter ON:  SUBTOTAL cached value already excludes Cap →
    //     raw SUBTOTAL == lineItems sum → no adjustment needed, reconciliation passes.
    //  b) Workbook saved WITHOUT filter:  SUBTOTAL includes Cap row amounts →
    //     raw SUBTOTAL != lineItems sum → subtract excluded amounts to align them.
    //
    // Without this guard, subtracting a negative Cap budget (credit entry) would
    // ADD to the SUBTOTAL instead of reducing it, breaking reconciliation.
    if (workbookSubtotal) {
      let _lb = 0, _lf = 0, _la = 0;
      for (const li of lineItems) { _lb += li.budget||0; _lf += li.forecast||0; _la += li.actual||0; }
      const _rawBudget = workbookSubtotal.budget;
      const needsAdj = Math.abs(workbookSubtotal.budget   - _lb) > 1 ||
                       Math.abs(workbookSubtotal.forecast - _lf) > 1 ||
                       Math.abs(workbookSubtotal.actual   - _la) > 1;
      if (needsAdj) {
        const adjForecast = workbookSubtotal.forecast - exclForecast;
        const adjActual   = workbookSubtotal.actual   - exclActual;
        workbookSubtotal = {
          budget:    workbookSubtotal.budget   - exclBudget,
          forecast:  adjForecast,
          actual:    adjActual,
          remaining: adjForecast - adjActual,
          risk:      workbookSubtotal.risk     - exclRisk,
          opp:       workbookSubtotal.opp      - exclOpp,
          net:       workbookSubtotal.net      - exclNet,
          absOpp:    Math.abs(workbookSubtotal.opp - exclOpp),
        };

      } else {
      console.log('[parse] Cap exclusion:', capRowLog.length, 'row(s) excluded, exclBudget=', Math.round(exclBudget/1000) + 'K, adjustment needed=', needsAdj);
      }
    }

    if (!lineItems.length) {
      throw new Error('No data rows parsed. Check that the Master Data sheet has rows below the header.');
    }

    const _result = buildBundle(lineItems, rowCount, excludedCount, workbookSubtotal, subtotalRangeEnd);

    // Read-only SharePoint/backup copies can contain stale cached formula results.
    // SheetJS reads cached formula values but does not recalculate formulas, so do
    // not use the SUBTOTAL row's cached values for KPI cards. Keep the SUBTOTAL
    // formula range for row scoping, but derive headline totals from parsed rows.
    _result.workbookSubtotal = {
      budget: _result.summary.budget,
      actual: _result.summary.actual,
      forecast: _result.summary.forecast,
      remaining: _result.summary.remaining,
      risk: _result.summary.risk,
      opp: _result.summary.opp,
      net: _result.summary.net,
      absOpp: Math.abs(_result.summary.opp),
    };

    const _s = _result.summary;
    const _ws = _result.workbookSubtotal;
    if (_ws) {
      console.log('Adjusted subtotal === line items?', {
        budget:   Math.abs(_ws.budget   - _s.budget)   < 1 ? '✓ OK' : '✗ DIFF ' + (_ws.budget   - _s.budget).toFixed(2),
        forecast: Math.abs(_ws.forecast - _s.forecast) < 1 ? '✓ OK' : '✗ DIFF ' + (_ws.forecast - _s.forecast).toFixed(2),
        risk:     Math.abs(_ws.risk     - _s.risk)     < 1 ? '✓ OK' : '✗ DIFF ' + (_ws.risk     - _s.risk).toFixed(2),
        opp:      Math.abs(_ws.absOpp   - Math.abs(_s.opp)) < 1 ? '✓ OK' : '✗ DIFF ' + (_ws.absOpp - Math.abs(_s.opp)).toFixed(2),
        net:      Math.abs(_ws.net      - _s.net)      < 1 ? '✓ OK' : '✗ DIFF ' + (_ws.net      - _s.net).toFixed(2),
      });
    }
    return _result;
  }

  function uniq(arr) { return [...new Set(arr.filter(x => x !== '' && x != null))].sort(); }

  function buildBundle(lineItems, rowCount, excludedCount, workbookSubtotal, subtotalRangeEnd) {
    // Summary
    const summary = lineItems.reduce((s, x) => ({
      budget: s.budget + x.budget,
      actual: s.actual + x.actual,
      forecast: s.forecast + x.forecast,
      risk: s.risk + x.risk,
      opp: s.opp + x.opp,
      net: s.net + x.net,
    }), {budget:0, actual:0, forecast:0, risk:0, opp:0, net:0});
    summary.remaining = summary.forecast - summary.actual;
    summary.rowCount = rowCount;
    summary.excludedCount = excludedCount;

    // Aggregate by vendor
    const byV = {};
    for (const li of lineItems) {
      const k = li.vendor || '(unspecified)';
      if (!byV[k]) byV[k] = {
        vendor: k, budget:0, actual:0, forecast:0, risk:0, opp:0, net:0,
        domains: new Set(), domainOwners: new Set(),
        monthlyAC: new Array(12).fill(0), monthlyFC: new Array(12).fill(0),
        lineItems: []
      };
      const b = byV[k];
      b.budget += li.budget; b.actual += li.actual; b.forecast += li.forecast;
      b.risk += li.risk; b.opp += li.opp; b.net += li.net;
      if (li.domain) b.domains.add(li.domain);
      if (li.owner) b.domainOwners.add(li.owner);
      li.monthlyAC.forEach((v,i)=>{ b.monthlyAC[i]+=v; });
      li.monthlyFC.forEach((v,i)=>{ b.monthlyFC[i]+=v; });
      b.lineItems.push(li);
    }
    const vendors = Object.values(byV)
      .map(v => ({ ...v, domains: [...v.domains], domainOwners: [...v.domainOwners] }))
      .sort((a, b) => b.actual - a.actual);

    // Aggregate by domain owner
    const byO = {};
    for (const li of lineItems) {
      const k = li.owner || 'N/A';
      if (!byO[k]) byO[k] = {
        owner: k, budget:0, actual:0, forecast:0, risk:0, opp:0, net:0,
        vendors: new Set(), domains: new Set()
      };
      const o = byO[k];
      o.budget += li.budget; o.actual += li.actual; o.forecast += li.forecast;
      o.risk += li.risk; o.opp += li.opp; o.net += li.net;
      if (li.vendor) o.vendors.add(li.vendor);
      if (li.domain) o.domains.add(li.domain);
    }
    const domainOwners = Object.values(byO).map(o => ({
      ...o, vendors: [...o.vendors], domains: [...o.domains]
    }));

    // R&O log = items with material risk/opp
    const riskOppLog = lineItems
      .filter(x => Math.abs(x.net) > 100 || Math.abs(x.risk) > 100 || Math.abs(x.opp) > 100)
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

    // Lookups for filter bar
    const lookups = {
      domains: uniq(lineItems.map(x => x.domain)),
      categories: uniq(lineItems.map(x => x.category)),
      subCategories: uniq(lineItems.map(x => x.subCategory)),
      onestreamCategories: uniq(lineItems.map(x => x.onestreamCategory)),
      vendors: uniq(lineItems.map(x => x.vendor)),
      owners: uniq(lineItems.map(x => x.owner)),
    };

    return {
      summary, vendors, domainOwners, riskOppLog, lineItems, lookups, workbookSubtotal,
      // rowScope: documents the row range used for all calculations.
      // "auto" = formula was read from the SUBTOTAL cell; "fallback" = budget-sum matching.
      // "none" = no SUBTOTAL row found; all rows processed.
      rowScope: {
        source: subtotalRangeEnd ? (workbookSubtotal ? 'auto' : 'fallback') : 'none',
        maxExcelRow: subtotalRangeEnd || null,
        rowsIncluded: rowCount,
        rowsExcluded: (workbookSubtotal ? 1 : 0) + (subtotalRangeEnd ? 0 : 0), // SUBTOTAL + cap + out-of-range
      },
    };
  }

  // Public API
  window.parseTechFinancialsXlsx = async function (file) {
    const buf = await file.arrayBuffer();
    return parseExcelArrayBuffer(buf);
  };
  window.parseTechFinancialsXlsxFromArrayBuffer = parseExcelArrayBuffer;
})();
