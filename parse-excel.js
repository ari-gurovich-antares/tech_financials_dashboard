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
    'Non-Comitted': 'nonCommitted',
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

  // Returns true when a worksheet cell contains an Excel error (#REF!, #VALUE!,
  // #N/A, #DIV/0!, etc.).  We must never use error values as financial numbers.
  function _isErrCell(cell) {
    if (!cell) return false;
    if (cell.t === 'e') return true;                         // SheetJS error type
    const s = String(cell.v == null ? '' : cell.v);
    return /^#(REF!|VALUE!|NAME\?|NUM!|DIV\/0!|N\/A|NULL!)/.test(s);
  }

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

    // ── Robust Non-Committed column detection ─────────────────────────────
    // Normalize: lowercase + strip ALL whitespace, hyphens, underscores, punctuation.
    // Handles: Non-Comitted, Non-Committed, Non Comitted, noncommitted, etc.
    const _normHdr = h => String(h || '').toLowerCase().replace(/[\s\-_.,;:'"()\\/]+/g, '');
    const _NC_NORMS = new Set(['noncomitted', 'noncommitted', 'noncomited', 'noncommited']);
    // First try exact HEADERS-map key, then fuzzy scan.
    let _ncColIdx = (colIdx['Non-Comitted'] != null) ? colIdx['Non-Comitted'] : null;
    let _ncRawHdr = _ncColIdx != null ? 'Non-Comitted' : null;
    if (_ncColIdx == null) {
      for (const [hdr, ci] of Object.entries(colIdx)) {
        if (_NC_NORMS.has(_normHdr(hdr))) { _ncColIdx = ci; _ncRawHdr = hdr; break; }
      }
    }
    console.log('[parse] Non-Committed column detected: "' + (_ncRawHdr || 'NOT FOUND') + '" → col index ' + _ncColIdx);

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
          // Detect SUBTOTAL(9,...) — function_num 9 excludes rows hidden by filter.
          // If the workbook was saved with an AutoFilter active the cached value
          // reflects only the VISIBLE rows, NOT the grand total.  We detect this
          // by checking for the SUBTOTAL keyword; when found we skip the cached
          // value as the authoritative KPI source and rely on the lineItems sum.
          const isFilteredSubtotal = /^\s*SUBTOTAL\s*\(\s*(9|109)\s*,/i.test(budCell.f);
          if (isFilteredSubtotal) {
            console.warn('[parse] SUBTOTAL(9/109,...) detected at R' + (ps+1) +
              ' — workbook likely saved with AutoFilter active.' +
              ' Cached value ($' + Math.round(workbookSubtotal.budget/1000) + 'K) reflects filtered rows only.' +
              ' Falling back to lineItems aggregation for all KPI cards.' +
              ' To fix: open workbook → Data → Refresh All → save → re-upload.');
            workbookSubtotal = null; // will be replaced by lineItems sum below
          } else {
            // Match the end of a range reference like ":V140)" or ":AB140,"
            const rangeMatch = budCell.f.match(/:[A-Z]+(\d+)\s*[),]/);
            if (rangeMatch) {
              subtotalRangeEnd = parseInt(rangeMatch[1], 10);
            }
          }
        }

        break; // Only the first SUBTOTAL row is used
      }
    }

    // ── STEP 2: Fallback — derive range end via budget-sum matching ──────
    // Used when the XLSX file stores only computed values, not formula strings.
    // Skip if a filtered SUBTOTAL was already detected (workbookSubtotal = null).
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

    // ── Formula-derived field detection (pre-STEP 3) ────────────────────────
    // Sample up to 8 data rows to determine whether Risk, Opp, Net are formula-
    // derived from Budget and Forecast.  When a cell carries a formula, the
    // parser re-derives its value in JS instead of trusting the cached result.
    // This avoids stale values when the workbook was saved with manual calc mode.
    //
    // Standard derivation (confirmed from workbook IF formulas):
    //   net         = forecast − budget
    //   risk        = net > 0 ? net : 0    (unfavorable overspend)
    //   opportunity = net < 0 ? net : 0    (favorable underspend)
    const _riskCI = colIdx['2026 Risk'];
    const _oppCI  = colIdx['2026 Opportunity'];
    const _netCI  = colIdx['2026 Net Position'];
    let _riskFml = false, _oppFml = false, _netFml = false, _fmlSampled = 0;
    for (let _sr = headerRowIdx + 1; _sr < rows.length && _fmlSampled < 8; _sr++) {
      const _srow = rows[_sr];
      if (!_srow || _srow.every(v => v === null || v === '' || v === undefined)) continue;
      if (Math.abs(num(_srow[colIdx['2026 Final Budget']])) < 100) continue;
      if (_riskCI != null && !_riskFml) { const _c = ws[XLSX.utils.encode_cell({ r: _sr, c: _riskCI })]; if (_c && _c.f) _riskFml = true; }
      if (_oppCI  != null && !_oppFml)  { const _c = ws[XLSX.utils.encode_cell({ r: _sr, c: _oppCI  })]; if (_c && _c.f) _oppFml  = true; }
      if (_netCI  != null && !_netFml)  { const _c = ws[XLSX.utils.encode_cell({ r: _sr, c: _netCI  })]; if (_c && _c.f) _netFml  = true; }
      _fmlSampled++;
    }
    console.log('[parse] Risk/Opp/Net formula detection (' + _fmlSampled + ' rows sampled):',
      { riskFormula: _riskFml, oppFormula: _oppFml, netFormula: _netFml });

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
    // ── Error / recompute tracking ───────────────────────────────────────
    let _errCellCount = 0;          // cells that contained an Excel error value
    let _netRecompCount = 0;        // rows where Net was recomputed from FC−Bud
    const _netRecompSample = [];    // up to 5 sample rows for console logging
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

      // ── Error-safe risk/opp/net ───────────────────────────────────────────
      // Recompute when a cell: (a) is an Excel error, OR
      //                        (b) is formula-driven (per column-level detection)
      //                            AND carries a formula on this specific cell.
      // Hardcoded plain-number overrides are always preserved.
      const _liBud = num(rec.budget);
      const _liFc  = num(rec.forecast);
      const _liN   = _liFc - _liBud;

      const _rCell = _riskCI != null ? ws[XLSX.utils.encode_cell({ r, c: _riskCI })] : null;
      const _oCell = _oppCI  != null ? ws[XLSX.utils.encode_cell({ r, c: _oppCI  })] : null;
      const _nCell = _netCI  != null ? ws[XLSX.utils.encode_cell({ r, c: _netCI  })] : null;

      if (_isErrCell(_rCell)) _errCellCount++;
      if (_isErrCell(_oCell)) _errCellCount++;
      if (_isErrCell(_nCell)) _errCellCount++;

      const _recompRisk = _isErrCell(_rCell) || (_riskFml && _rCell && _rCell.f);
      const _recompOpp  = _isErrCell(_oCell) || (_oppFml  && _oCell && _oCell.f);
      const _recompNet  = _isErrCell(_nCell) || (_netFml  && _nCell && _nCell.f);

      let _liRisk = _recompRisk ? (_liN > 0 ? _liN : 0) : num(rec.risk);
      let _liOpp  = _recompOpp  ? (_liN < 0 ? _liN : 0) : num(rec.opp);
      let _liNet  = _recompNet  ? _liN                  : num(rec.net);

      if (_recompNet) {
        _netRecompCount++;
        if (_netRecompSample.length < 5) {
          _netRecompSample.push({
            row: r + 1,
            vendor: str(rec.vendor) || '(unknown)',
            budget: _liBud, forecast: _liFc,
            storedNet: _nCell ? _nCell.v : null,
            netErr: _isErrCell(_nCell),
            computedNet: _liN,
          });
        }
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
        budget: _liBud,
        actual: num(rec.actual),
        forecast: _liFc,
        risk: _liRisk,
        opp: _liOpp,
        net: _liNet,
        notes: str(rec.notes) || '',
        notesRO: '',
        monthlyAC: readArr(row, colIdx, MONTHS_AC),
        monthlyFC: readArr(row, colIdx, MONTHS_FC),
        monthlyOR: readArr(row, colIdx, resolvedOR),
        onestreamCategory: str(rec.onestreamCategory) || '',
        // Use robust-detected column index directly (bypasses exact HEADERS spelling)
        nonCommitted: _ncColIdx != null ? str(row[_ncColIdx]) : '',
      };
      lineItems.push(lineItem);
      rowCount++;
    }

    // ── Notes - R&O sheet: build lookup and attach to line items ──────────
    const roSheetName = wb.SheetNames.find(n => /notes.*r.?o/i.test(n) || /r.?o.*notes/i.test(n));
    // vendorCatNotes: vendor → [{category, note}] ordered as in the Notes sheet
    const vendorCatNotes = new Map();

    if (roSheetName) {
      try {
        const roWs   = wb.Sheets[roSheetName];
        const roRows = XLSX.utils.sheet_to_json(roWs, { header: 1, defval: null, raw: false });

        // Detect header row to find optional category column
        const hdr = (roRows[0] || []).map(h => str(h).toLowerCase());
        const catColIdx = hdr.findIndex(h => h.includes('category') || h === 'cat');
        console.log('[parse] Notes - R&O header cols:', hdr.slice(0, 12), '→ category col idx:', catColIdx);

        const roMapVC = new Map(); // vendor|category → note  (preferred)
        const roMapV  = new Map(); // vendor → note           (fallback)

        for (let ri = 1; ri < roRows.length; ri++) {
          const r      = roRows[ri] || [];
          const owner  = str(r[1]);
          const vendor = str(r[2]);
          const cat    = catColIdx >= 0 ? str(r[catColIdx]) : '';
          const notes  = str(r[8]);
          if (!vendor || !notes) continue;
          if (/total$/i.test(owner) || /^values$/i.test(owner)) continue;
          if (/^(dark|light)\s+(green|red)/i.test(notes)) continue;
          const k1 = vendor.toLowerCase();
          if (!roMapV.has(k1)) roMapV.set(k1, notes);
          if (cat) {
            roMapVC.set(`${k1}|${cat.toLowerCase()}`, notes);
            // Build per-vendor category list (preserves Notes sheet order)
            if (!vendorCatNotes.has(k1)) vendorCatNotes.set(k1, []);
            const vcList = vendorCatNotes.get(k1);
            if (!vcList.find(x => x.category.toLowerCase() === cat.toLowerCase())) {
              vcList.push({ category: cat, note: notes });
            }
          }
        }
        for (const li of lineItems) {
          const k1  = li.vendor.toLowerCase();
          const vcList = vendorCatNotes.get(k1);
          // Try to find the Notes spend category that best matches this line item
          let matchedCat = null;
          if (vcList && vcList.length) {
            const sub   = (li.subCategory   || '').toLowerCase().replace(/[^\w]/g, '');
            const cont  = (li.contractType  || '').toLowerCase().replace(/[^\w]/g, '');
            const isLabor = (li.category || '').toLowerCase() === 'labor';
            for (const { category: nc } of vcList) {
              const ncN = nc.toLowerCase().replace(/[^\w]/g, '');
              if (sub  && (ncN === sub  || ncN.includes(sub)  || sub.includes(ncN)))  { matchedCat = nc; break; }
              if (cont && (ncN === cont || ncN.includes(cont) || cont.includes(ncN))) { matchedCat = nc; break; }
              if (isLabor && (ncN.includes('labor') || ncN.includes('tm') || ncN.includes('t&m'))) { matchedCat = nc; break; }
            }
          }
          li.spendCategory = matchedCat || li.subCategory || li.category;
          li.notesRO = (matchedCat && roMapVC.get(`${k1}|${matchedCat.toLowerCase()}`)) || roMapV.get(k1) || '';
        }
        console.log('[parse] Notes - R&O:', roMapVC.size, 'category-level +', roMapV.size, 'vendor-level entries');
      } catch(e) {
        console.warn('[parse] Notes - R&O parse failed:', e.message);
      }
    }

    // ── Error / recompute summary ─────────────────────────────────────────
    console.log('[parse] Excel error cells found in Risk/Opp/Net columns: ' + _errCellCount);
    console.log('[parse] Rows where Net was recomputed from Forecast−Budget: ' + _netRecompCount);
    if (_netRecompSample.length) {
      console.log('[parse] Net recompute sample rows:', _netRecompSample.map(s =>
        'R' + s.row + ' ' + s.vendor.slice(0,24) +
        ' | bud=$' + Math.round(s.budget/1000) + 'K fc=$' + Math.round(s.forecast/1000) + 'K' +
        ' | stored=' + (s.netErr ? '#ERR' : '$'+Math.round((s.storedNet||0)/1000)+'K') +
        ' → computed=$' + Math.round(s.computedNet/1000) + 'K'
      ));
    }

    // ── When filtered SUBTOTAL was detected (workbookSubtotal=null), build from lineItems ──
    // Mark as lineItems-sourced so the cap-exclusion block below can skip it
    // (lineItems already exclude Capitalization rows — no double-subtraction).
    let _wbsFromLineItems = false;
    if (!workbookSubtotal && lineItems.length) {
      let _lb=0,_lf=0,_la=0,_lr=0,_lo=0,_ln=0;
      for (const li of lineItems) { _lb+=li.budget||0; _lf+=li.forecast||0; _la+=li.actual||0; _lr+=li.risk||0; _lo+=li.opp||0; _ln+=li.net||0; }
      workbookSubtotal = { budget:_lb, forecast:_lf, actual:_la, remaining:_lf-_la, risk:_lr, opp:_lo, net:_ln, absOpp:Math.abs(_lo) };
      _wbsFromLineItems = true;
      console.log('[parse] KPI from lineItems (filtered-SUBTOTAL path): budget=$'+Math.round(_lb/1e3)+'K forecast=$'+Math.round(_lf/1e3)+'K risk=$'+Math.round(_lr/1e3)+'K');
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

      // ── POST-ADJUSTMENT VALIDATION ───────────────────────────────────
      // If the adjusted workbookSubtotal still diverges from lineItems by
      // more than $1 000 (e.g. cap rows have negative budgets that over-
      // correct when subtracted, or the SUBTOTAL range was mis-detected),
      // fall back to the lineItems aggregation as the authoritative KPI
      // source so that KPI cards always match the detail/category views.
      let _lr = 0, _lo = 0, _ln = 0;
      for (const li of lineItems) { _lr += li.risk||0; _lo += li.opp||0; _ln += li.net||0; }
      const _postBudDiff  = Math.abs(workbookSubtotal.budget   - _lb);
      const _postFcDiff   = Math.abs(workbookSubtotal.forecast - _lf);
      if (_postBudDiff > 1000 || _postFcDiff > 1000) {
        console.warn('[parse] Subtotal still diverges after Cap adj (budgetΔ=' +
          Math.round(_postBudDiff/1000) + 'K, forecastΔ=' +
          Math.round(_postFcDiff/1000) + 'K); falling back to lineItems aggregation for KPI cards');
        workbookSubtotal = {
          budget:    _lb,
          forecast:  _lf,
          actual:    _la,
          remaining: _lf - _la,
          risk:      _lr,
          opp:       _lo,
          net:       _ln,
          absOpp:    Math.abs(_lo),
        };
      }
    }

    if (!lineItems.length) {
      throw new Error('No data rows parsed. Check that the Master Data sheet has rows below the header.');
    }

    const _result = buildBundle(lineItems, rowCount, excludedCount, workbookSubtotal, subtotalRangeEnd, vendorCatNotes);
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
    // ── Attach YTD Financials Run Rate data (authoritative KPI / chart source) ──
    //
    // SOURCE-OF-TRUTH SPLIT:
    //   • YTD Financials Run Rate sheet → top KPI cards + Risk×Opp by Category chart.
    //     This matches the control view users reconcile against in the workbook.
    //   • Master Data lineItems → Back Pocket, vendor detail, project detail,
    //     drilldowns, filter views.  All row-level data comes from here.
    const _ytd = (() => {
      try { return parseYTDSheet(wb); }
      catch(e) { console.warn('[parse] YTD sheet parse failed:', e.message); return null; }
    })();
    if (_ytd) {
      _result.ytdSummary    = _ytd.ytdSummary;
      _result.ytdCategories = _ytd.ytdCategories;

      // ── Console reconciliation check (non-visible) ───────────────────────
      // Compares YTD Financials Run Rate Grand Total against Master Data
      // lineItems aggregation.  Any diff > $1 K is flagged so analysts can
      // detect stale pivots or parser row-scope mismatches immediately.
      const _ys  = _ytd.ytdSummary;
      const _md  = _result.summary;          // lineItems sum
      const _diffs = {
        budget:    Math.round(_md.budget   - _ys.budget),
        forecast:  Math.round(_md.forecast - _ys.forecast),
        risk:      Math.round(_md.risk     - _ys.risk),
        opp:       Math.round(_md.opp      - _ys.opp),    // both signed
        net:       Math.round(_md.net      - _ys.net),
      };
      const _anyDiff = Object.values(_diffs).some(d => Math.abs(d) > 1000);
      if (_anyDiff) {
        const _budMatch = Math.abs(_diffs.budget) <= 1000;
        const _cause = _budMatch
          ? 'Budget totals match but financial fields differ — rows were updated in Master Data after the YTD pivot was last refreshed (stale pivot cache).  Fix: open workbook, Data → Refresh All, save, re-upload.'
          : 'Budget totals also differ — parser row scope may differ from the YTD pivot (different rows included/excluded).  Check subtotal range or filter state.';
        console.warn('[reconcile] ⚠️  YTD Financials Run Rate and Master Data aggregation do not reconcile.\n' + _cause);
        console.warn('[reconcile] Differences (Master Data − YTD), positive = MD higher:',
          Object.fromEntries(
            Object.entries(_diffs).map(([k, v]) => [k, '$' + (v/1000).toFixed(1) + 'K'])
          )
        );
      } else {
        console.log('[reconcile] ✅ YTD Financials Run Rate and Master Data reconcile within $1K.');
      }
    }
    return _result;
  }

  // ── Parse YTD Financials Run Rate sheet ────────────────────────────────────
  // Returns { ytdSummary, ytdCategories } or null on failure.
  // ytdSummary  → headline KPI cards when no filter is active
  // ytdCategories → Risk × Opp by Category chart, so bars match the KPIs
  function parseYTDSheet(wb_) {
    const ytdSheet = wb_.SheetNames.find(n => /ytd|run.?rate/i.test(n));
    if (!ytdSheet) {
      console.warn('[parse] YTD Financials Run Rate sheet not found — KPIs from Master Data');
      return null;
    }
    const ws2  = wb_.Sheets[ytdSheet];
    const rows = XLSX.utils.sheet_to_json(ws2, { header:1, defval:null, raw:true });

    // Find column header row — row that has BOTH "Budget" and "Risk" in cells
    let hdrIdx=-1, cBud=-1, cFc=-1, cRisk=-1, cOpp=-1, cNet=-1;
    for (let r = 0; r < Math.min(rows.length, 8); r++) {
      const row = rows[r] || [];
      const hasBud  = row.some(v => /budget/i.test(str(v)));
      const hasRisk = row.some(v => /risk/i.test(str(v)) && !/net/i.test(str(v)));
      if (!hasBud || !hasRisk) continue;
      hdrIdx = r;
      row.forEach((v, i) => {
        const s = str(v).toLowerCase();
        if (s.includes('budget'))                                              cBud  = i;
        if ((s.includes('actuals') || s.includes('forecast')) &&
            !s.includes('budget'))                                             cFc   = i;
        if (s.includes('risk') && !s.includes('net'))                         cRisk = i;
        if (s.includes('opportun'))                                            cOpp  = i;
        if (s.includes('net') && (s.includes('pos') || s.includes('ition')))  cNet  = i;
      });
      break;
    }
    if (hdrIdx < 0 || cBud < 0) {
      console.warn('[parse] YTD sheet: column header not found');
      return null;
    }
    if (cFc < 0) cFc = cBud + 1; // fallback: forecast column follows budget
    console.log('[parse] YTD "' + ytdSheet + '" hdr=' + hdrIdx +
      ' bud=' + cBud + ' fc=' + cFc + ' risk=' + cRisk + ' opp=' + cOpp + ' net=' + cNet);

    const SKIP_RE = /transaction.?type|sub.?categ|row.?label|\(multiple|\(blank\)|domain.?owner|sum.?of/i;
    const categories = [];
    let   grandTotal = null;

    for (let r = hdrIdx + 1; r < Math.min(rows.length, hdrIdx + 30); r++) {
      const row = rows[r] || [];
      if (row.every(v => v === null || v === '')) continue;

      // Label = first non-numeric string in columns 0 → cBud-1
      let label = '';
      for (let c = 0; c < Math.max(1, cBud); c++) {
        const v = str(row[c]);
        if (v && !/^\d/.test(v)) { label = v; break; }
      }
      if (!label || SKIP_RE.test(label)) continue;

      const budget   = num(row[cBud]);
      const forecast = cFc   >= 0 ? num(row[cFc])   : 0;
      const risk     = cRisk >= 0 ? num(row[cRisk])  : 0;
      const opp      = cOpp  >= 0 ? num(row[cOpp])   : 0;
      const net      = cNet  >= 0 ? num(row[cNet])   : (risk + opp);

      if (/grand\s*total/i.test(label)) {
        grandTotal = { budget, forecast, risk, opp, net };
        break;
      }
      if (budget !== 0 || forecast !== 0) {
        categories.push({ category: label, budget, forecast, risk, opp, net });
      }
    }

    if (!grandTotal) {
      console.warn('[parse] YTD sheet: Grand Total row not found — KPIs from Master Data');
      return null;
    }
    console.log('[parse] YTD Grand Total: budget=$' + Math.round(grandTotal.budget/1000) + 'K' +
      ' fc=$' + Math.round(grandTotal.forecast/1000) + 'K' +
      ' risk=$' + Math.round(grandTotal.risk/1000) + 'K' +
      ' opp=$' + Math.round(grandTotal.opp/1000) + 'K' +
      ' net=$' + Math.round(grandTotal.net/1000) + 'K');
    console.log('[parse] YTD categories:', categories.map(c => c.category).join(', '));

    return {
      ytdSummary: {
        budget:   grandTotal.budget,
        forecast: grandTotal.forecast,
        risk:     grandTotal.risk,
        opp:      grandTotal.opp,     // negative = favorable in workbook
        absOpp:   Math.abs(grandTotal.opp),
        net:      grandTotal.net,
      },
      ytdCategories: categories,
    };
  }

  function uniq(arr) { return [...new Set(arr.filter(x => x !== '' && x != null))].sort(); }

  function buildBundle(lineItems, rowCount, excludedCount, workbookSubtotal, subtotalRangeEnd, vendorCatNotes = new Map()) {
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
    // Back Pocket: sum of 2026 Net Position where Non-Committed flag = Y/Yes/True/1
    // Capitalization rows are already excluded from lineItems — no extra filter needed.
    const _isNcFlag = v => { const s = String(v || '').trim().toLowerCase(); return s==='y'||s==='yes'||s==='true'||s==='1'; };
    const _bpRows   = lineItems.filter(li => _isNcFlag(li.nonCommitted));
    const _bpRaw    = _bpRows.reduce((s, li) => s + (li.net || 0), 0);
    console.log('[parse] Back Pocket → flaggedRows=' + _bpRows.length + ', rawNetSum=$' + Math.round(_bpRaw/1000) + 'K, displayedAbsValue=$' + Math.round(Math.abs(_bpRaw)/1000) + 'K');
    summary.backPocket = Math.abs(_bpRaw);

    // ── Auto-detect last closed month & override actual/forecast from monthly columns ──
    // "Actual Spend" = sum of Jan AC … last month with any non-zero AC across all rows.
    // "Remaining Forecast" = sum of FC columns for the months after that.
    // This mirrors what the Finance team sees: closed months → AC, open months → FC.
    {
      // Hardcoded split: Actuals = Jan–May (indices 0–4), Forecast = Jun–Dec (indices 5–11).
      const lastActMonth = 4; // May
      {
        const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        console.log('[parse] Fixed closed-month split: Actuals Jan–' + MONTH_NAMES[lastActMonth] + ', Forecast Jun–Dec');
        for (const li of lineItems) {
          const acSum = li.monthlyAC.slice(0, lastActMonth + 1).reduce((s, v) => s + (v || 0), 0);
          const fcSum = li.monthlyFC.slice(lastActMonth + 1).reduce((s, v) => s + (v || 0), 0);
          li.actual   = acSum;
          li.forecast = acSum + fcSum;
        }
        // Recompute workbookSubtotal.actual/remaining to match
        if (workbookSubtotal) {
          let wsAct = 0, wsFc = 0;
          for (const li of lineItems) { wsAct += li.actual || 0; wsFc += li.forecast || 0; }
          workbookSubtotal.actual    = wsAct;
          workbookSubtotal.forecast  = wsFc;
          workbookSubtotal.remaining = wsFc - wsAct;
        }
      }
    }

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
      .map(v => {
        const catNotes = vendorCatNotes.get(v.vendor.toLowerCase());
        return {
          ...v,
          domains: [...v.domains],
          domainOwners: [...v.domainOwners],
          ...(catNotes && catNotes.length ? { categoryNotes: catNotes } : {}),
        };
      })
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
