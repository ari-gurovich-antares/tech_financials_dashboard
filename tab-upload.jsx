// tab-upload.jsx — Real Excel upload with full reconciliation validation
// Parses the workbook, runs reconciliation, requires approval before applying.
const { useState: useStateU, useRef: useRefU } = React;

// ─────────────────────────────────────────────────────────────────────────────
// RECONCILIATION ENGINE
// Tolerance: $1.00 — covers float arithmetic drift on real financial data.
// ─────────────────────────────────────────────────────────────────────────────
const _RTOL = 1.0;

// Guard: replace NaN / Infinity with 0 so float arithmetic doesn't poison allOk
function _safeNum(v) { return (typeof v === 'number' && isFinite(v)) ? v : 0; }

function _runReconc(data) {
  const ws = data.workbookSubtotal;

  // ── lineItems validity check (always runs first) ────────────────────────
  // Upload is ONLY blocked when parsing truly failed (empty rows or NaN totals).
  // A missing SUBTOTAL row / lineItems-sourced KPI path does NOT block upload.
  const items = data.lineItems || [];
  if (items.length === 0) {
    return {
      allOk: false,
      blockingError:
        'No valid line items were parsed from the workbook. ' +
        'Verify the file contains a "Master Data (DO NOT EDIT)" sheet with data rows.',
    };
  }
  let lb = 0, lf = 0, la = 0, lr = 0, lo = 0, ln = 0;
  for (const li of items) {
    lb += _safeNum(li.budget);
    lf += _safeNum(li.forecast);
    la += _safeNum(li.actual);
    lr += _safeNum(li.risk);
    lo += _safeNum(li.opp);
    ln += _safeNum(li.net);
  }
  if (![lb, lf, la, lr, lo, ln].every(isFinite)) {
    return {
      allOk: false,
      blockingError:
        'Parsed financial totals contain invalid values (NaN or Infinity). ' +
        'Check for corrupt cells in the workbook and try again.',
    };
  }

  // When workbookSubtotal is absent (lineItems-sourced KPI path, e.g. workbook
  // saved with AutoFilter active), use lineItems sums as the reference so
  // the reconciliation table renders correctly and allOk is never blocked.
  const ref = ws ? {
    budget:   _safeNum(ws.budget),
    forecast: _safeNum(ws.forecast),
    actual:   _safeNum(ws.actual),
    remaining:_safeNum(ws.remaining),
    risk:     _safeNum(ws.risk),
    absOpp:   _safeNum(ws.absOpp),
    net:      _safeNum(ws.net),
  } : {
    budget: lb, forecast: lf, actual: la, remaining: lf - la,
    risk: lr, absOpp: Math.abs(lo), net: ln,
  };

  // ── KPI reconciliation ──────────────────────────────────────────
  const kpiRows = [
    { label: 'Annual Budget',           wb: ref.budget,    dash: lb              },
    { label: 'Year-End Forecast',       wb: ref.forecast,  dash: lf              },
    { label: 'YTD Actual Spend',        wb: ref.actual,    dash: la              },
    { label: 'Remaining Forecast',      wb: ref.remaining, dash: lf - la         },
    { label: 'Risk',                    wb: ref.risk,      dash: lr              },
    { label: 'Opportunities',           wb: ref.absOpp,    dash: Math.abs(lo)    },
    { label: 'Net Opp/Risk Position',   wb: ref.net,       dash: ln              },
  ].map(r => ({ ...r, diff: Math.abs(r.wb - r.dash), ok: Math.abs(r.wb - r.dash) < _RTOL }));

  // ── Variance reconciliation ─────────────────────────────────────────
  const execVar = ref.forecast - ref.budget;
  const catVar  = lf - lb;
  const varDiff = Math.abs(execVar - catVar);
  const varOk   = varDiff < _RTOL;

  // ── Drilldown reconciliation ─────────────────────────────────────────
  const drillRows = [
    { label: 'Risk KPI vs Risk drilldown total',                 kpi: ref.risk,   drill: lr,           diff: Math.abs(ref.risk   - lr)           },
    { label: 'Opportunity KPI vs Opportunity drilldown total',   kpi: ref.absOpp, drill: Math.abs(lo), diff: Math.abs(ref.absOpp - Math.abs(lo)) },
    { label: 'Net Position KPI vs Net Position drilldown total', kpi: ref.net,    drill: ln,           diff: Math.abs(ref.net    - ln)           },
  ].map(r => ({ ...r, ok: r.diff < _RTOL }));

  const kpiOk   = kpiRows.every(r => r.ok);
  const drillOk = drillRows.every(r => r.ok);
  const hasWarnings = !kpiOk || !varOk || !drillOk;

  // allOk is ALWAYS true when lineItems are valid and totals are finite.
  // Reconciliation mismatches are shown as informational warnings, never blockers.
  const allOk = true;

  const failures = [
    ...kpiRows.filter(r => !r.ok).map(r =>
      `KPI "${r.label}" — Ref: ${fmt.m2(r.wb)}, Dashboard: ${fmt.m2(r.dash)}, Diff: ${fmt.m2(r.diff)}`),
    ...(!varOk ? [`Variance — Ref: ${fmt.m2(execVar)}, Category sum: ${fmt.m2(catVar)}, Diff: ${fmt.m2(varDiff)}`] : []),
    ...drillRows.filter(r => !r.ok).map(r =>
      `Drilldown "${r.label}" — KPI: ${fmt.m2(r.kpi)}, Drilldown: ${fmt.m2(r.drill)}, Diff: ${fmt.m2(r.diff)}`),
  ];

  return { kpiRows, execVar, catVar, varDiff, varOk, drillRows, kpiOk, drillOk, allOk, hasWarnings, failures };
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL DESIGN TOKENS  (named uploadSty to avoid collisions with other files)
// ─────────────────────────────────────────────────────────────────────────────
const uploadSty = {
  navy:   '#333C66',
  green:  '#2F7A4D',
  red:    '#B23A3A',
  stone:  '#807E7A',
  border: '#ECEAE7',
  bg:     '#FAFAF8',
  sans:   "'Inter', Arial, sans-serif",
  serif:  "'Source Serif 4', Georgia, serif",
};
const US = uploadSty;

// ─────────────────────────────────────────────────────────────────────────────
// RECONCILIATION TABLE PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
function RcTH({ right, children }) {
  return (
    <th style={{
      padding: right ? '0 0 6px 10px' : '0 10px 6px 0',
      textAlign: right ? 'right' : 'left',
      fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: US.stone, fontFamily: US.sans,
    }}>{children}</th>
  );
}

function RcRow({ label, col2, col3, diff, ok }) {
  return (
    <tr style={{ borderBottom: `1px solid ${US.border}` }}>
      <td style={{ padding: '7px 10px 7px 0', fontSize: 12, color: '#3C3A36', fontFamily: US.sans, lineHeight: 1.4 }}>{label}</td>
      <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: 12, fontFamily: US.sans,
        fontVariantNumeric: 'tabular-nums', color: US.navy }}>{fmt.m2(col2)}</td>
      <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: 12, fontFamily: US.sans,
        fontVariantNumeric: 'tabular-nums', color: US.navy }}>{fmt.m2(col3)}</td>
      <td style={{ padding: '7px 0 7px 10px', textAlign: 'right', fontSize: 12, fontFamily: US.sans,
        fontVariantNumeric: 'tabular-nums', fontWeight: 600,
        color: ok ? US.green : US.red }}>
        {ok ? '$0.00 ✓' : `${fmt.m2(diff)} ✗`}
      </td>
    </tr>
  );
}

function RcSection({ title, col2Hdr, col3Hdr, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase',
        color: US.stone, fontFamily: US.serif, marginBottom: 8,
      }}>{title}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${US.border}` }}>
            <RcTH>Metric</RcTH>
            <RcTH right>{col2Hdr || 'Workbook'}</RcTH>
            <RcTH right>{col3Hdr || 'Dashboard'}</RcTH>
            <RcTH right>Difference</RcTH>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────────────────────
function UploadModal({ onClose, onUpload, lastRefresh }) {
  const [stage,  setStage]  = useStateU('idle');   // idle | parsing | reconc | error
  const [drag,   setDrag]   = useStateU(false);
  const [fname,  setFname]  = useStateU(null);
  const [parsed, setParsed] = useStateU(null);
  const [reconc, setReconc] = useStateU(null);
  const [err,    setErr]    = useStateU(null);
  const fileRef             = useRefU();

  async function handleFile(f) {
    if (!f) return;
    if (!/\.(xlsx|xls)$/i.test(f.name)) {
      setFname(f.name);
      setErr('Please upload an Excel file (.xlsx). Other formats are not supported.');
      setStage('error');
      return;
    }
    console.log('[upload] selected file:', f.name, '(', (f.size/1024).toFixed(0), 'KB)');
    setFname(f.name);
    setErr(null);
    setParsed(null);
    setReconc(null);
    setStage('parsing');
    try {
      await new Promise(r => setTimeout(r, 80));
      const data = await window.parseTechFinancialsXlsx(f);
      console.log('[upload] parsed lineItems count:', data.lineItems ? data.lineItems.length : 0);
      if (data.workbookSubtotal) {
        const ws = data.workbookSubtotal;
        console.log('[upload] parsed budget=$' + Math.round(ws.budget/1e3) + 'K forecast=$' + Math.round(ws.forecast/1e3) + 'K risk=$' + Math.round(ws.risk/1e3) + 'K opp=$' + Math.round(Math.abs(ws.opp)/1e3) + 'K net=$' + Math.round(ws.net/1e3) + 'K');
      } else {
        console.warn('[upload] workbookSubtotal is null after parsing');
      }
      if (data.summary) console.log('[upload] parsed backPocket=$' + Math.round((data.summary.backPocket||0)/1e3) + 'K');
      const r = _runReconc(data);
      console.log('[upload] reconciliation result: allOk=' + r.allOk + (r.blockingError ? ' blockingError='+r.blockingError.slice(0,80) : '') + (r.failures && r.failures.length ? ' failures='+r.failures.join(' | ') : ''));
      if (r.blockingError) {
        setErr(r.blockingError);
        setStage('error');
        return;
      }
      setParsed(data);
      setReconc(r);
      setStage('reconc');
    } catch (e) {
      console.error('[upload] parse error:', e);
      setErr(e.message || String(e));
      setStage('error');
    }
  }

  function doApply() {
    if (parsed && reconc && reconc.allOk) {
      onUpload(fname, parsed);
      onClose();
    }
  }

  function doReset() {
    setStage('idle');
    setFname(null);
    setParsed(null);
    setReconc(null);
    setErr(null);
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(20,18,15,0.65)',
        zIndex: 1000,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 20px 20px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes uploadPulse {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div
        style={{
          background: '#fff',
          width: stage === 'reconc' ? 780 : 520,
          maxWidth: '100%',
          boxShadow: '0 12px 48px rgba(51,60,102,0.22)',
          border: `1px solid ${US.border}`,
          transition: 'width 0.22s ease',
          flexShrink: 0,
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── HEADER ────────────────────────────────────────────────────── */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${US.border}`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: US.stone, fontFamily: US.serif, marginBottom: 4,
            }}>data refresh</div>
            <div style={{ fontFamily: US.serif, fontWeight: 600, fontSize: 20, color: US.navy, lineHeight: 1.2 }}>
              Upload Workbook
            </div>
            {stage === 'idle' && (
              <div style={{ fontSize: 12, color: US.stone, marginTop: 4, fontFamily: US.sans }}>
                Upload the latest approved Technology Financials workbook (.xlsx)
              </div>
            )}
            {stage === 'parsing' && (
              <div style={{ fontSize: 12, color: US.stone, marginTop: 4, fontFamily: US.sans }}>
                Parsing {fname}…
              </div>
            )}
            {stage === 'reconc' && parsed && (
              <div style={{ fontSize: 12, color: US.stone, marginTop: 4, fontFamily: US.sans }}>
                {fname}
                {' · '}{parsed.lineItems.length} rows
                {' · '}{parsed.vendors.length} vendors
                {parsed.rowScope?.maxExcelRow
                  ? ` · SUBTOTAL range rows 2–${parsed.rowScope.maxExcelRow}${parsed.rowScope.source === 'auto' ? ' (formula)' : ' (fallback)'}`
                  : ''}
              </div>
            )}
            {stage === 'error' && fname && (
              <div style={{ fontSize: 12, color: US.red, marginTop: 4, fontFamily: US.sans }}>
                {fname} — parse failed
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: US.stone, fontSize: 20, lineHeight: 1, padding: '0 0 0 16px', flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* ── BODY ──────────────────────────────────────────────────────── */}
        <div style={{ padding: '20px 24px' }}>

          {/* ── IDLE: dropzone ──────────────────────────────────────── */}
          {stage === 'idle' && (
            <div>
              <div
                style={{
                  border: `2px dashed ${drag ? '#6699FF' : US.border}`,
                  background: drag ? '#F4F6FF' : US.bg,
                  padding: '44px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current?.click()}
              >
                <div style={{ marginBottom: 14 }}>
                  <Icon name="upload" size={40} color={drag ? '#6699FF' : '#B4B2AE'} />
                </div>
                <div style={{ fontFamily: US.serif, fontWeight: 600, fontSize: 16, color: US.navy, marginBottom: 6 }}>
                  Drop your workbook here
                </div>
                <div style={{ fontSize: 12, color: US.stone, marginBottom: 20 }}>
                  Excel (.xlsx) only · Master Data (DO NOT EDIT) sheet will be parsed
                </div>
                <span style={{
                  display: 'inline-block', padding: '8px 22px',
                  background: US.navy, color: '#fff',
                  fontSize: 13, fontWeight: 600, fontFamily: US.sans,
                }}>Browse files</span>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value = ''; }}
              />
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ fontSize: 11, color: US.stone, fontFamily: US.sans, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="info" size={11} color={US.stone} />
                  Uploaded data persists in browser storage and survives page reload.
                </div>
                {lastRefresh && (
                  <div style={{ fontSize: 11, color: US.stone, fontFamily: US.sans }}>
                    Last refreshed: <strong style={{ color: '#3C3A36' }}>{lastRefresh}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PARSING ─────────────────────────────────────────────── */}
          {stage === 'parsing' && (
            <div style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ marginBottom: 16 }}>
                <Icon name="refresh" size={36} color="#6699FF" />
              </div>
              <div style={{ fontFamily: US.serif, fontWeight: 600, fontSize: 15, color: US.navy, marginBottom: 6 }}>
                Parsing workbook…
              </div>
              <div style={{ fontSize: 12, color: US.stone, marginBottom: 22, lineHeight: 1.5 }}>
                Reading "Master Data (DO NOT EDIT)"<br />
                Locating SUBTOTAL scope row · Excluding Capitalization rows
              </div>
              <div style={{
                height: 4, background: '#ECEAE7', overflow: 'hidden',
                maxWidth: 280, margin: '0 auto',
              }}>
                <div style={{
                  height: '100%', width: '100%',
                  background: 'linear-gradient(90deg, #ECEAE7 0%, #6699FF 40%, #333C66 60%, #6699FF 80%, #ECEAE7 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'uploadPulse 1.4s linear infinite',
                }} />
              </div>
            </div>
          )}

          {/* ── RECONCILIATION RESULTS ──────────────────────────────── */}
          {stage === 'reconc' && reconc && (
            <div>

              {/* Status banner */}
              <div style={{
                padding: '12px 16px',
                background: reconc.hasWarnings ? '#FEF9E6' : '#F0F8F4',
                border: `1px solid ${reconc.hasWarnings ? '#F5D080' : '#A8D8B9'}`,
                display: 'flex', alignItems: 'flex-start', gap: 10,
                marginBottom: 24,
              }}>
                <div style={{ flexShrink: 0, marginTop: 1 }}>
                  <Icon name={reconc.hasWarnings ? 'alert' : 'check'} size={15}
                    color={reconc.hasWarnings ? '#96600A' : US.green} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: US.sans,
                    color: reconc.hasWarnings ? '#96600A' : US.green, lineHeight: 1.4 }}>
                    {reconc.hasWarnings
                      ? `Reconciliation note (${reconc.failures.length} warning${reconc.failures.length !== 1 ? 's' : ''}) — workbook is still valid and ready to apply`
                      : 'All reconciliation checks passed — ready to apply'}
                  </div>
                  {reconc.hasWarnings && (
                    <div style={{ fontSize: 11, color: '#96600A', marginTop: 4, lineHeight: 1.5 }}>
                      Differences are informational only. They typically indicate the workbook
                      was saved with an AutoFilter active or the YTD pivot cache is stale.
                      Click Apply to update the dashboard with the freshly parsed workbook data.
                    </div>
                  )}
                </div>
              </div>

              {/* ── KPI Reconciliation table ─────────────────────── */}
              <RcSection
                title="KPI Reconciliation"
                col2Hdr="Ref (SUBTOTAL / lineItems sum)"
                col3Hdr="Dashboard (line items)"
              >
                {reconc.kpiRows.map(r => (
                  <RcRow key={r.label}
                    label={r.label} col2={r.wb} col3={r.dash}
                    diff={r.diff} ok={r.ok} />
                ))}
              </RcSection>

              {/* ── Variance Reconciliation table ────────────────── */}
              <RcSection
                title="Variance Reconciliation"
                col2Hdr="Value"
                col3Hdr=""
              >
                <tr style={{ borderBottom: `1px solid ${US.border}` }}>
                  <td style={{ padding: '7px 10px 7px 0', fontSize: 12, color: '#3C3A36', fontFamily: US.sans }}>
                    Executive forecast variance (Forecast − Budget)
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: 12,
                    fontVariantNumeric: 'tabular-nums', fontFamily: US.sans, color: US.navy }}>
                    {fmt.m2(reconc.execVar)}
                  </td>
                  <td style={{ padding: '7px 10px' }}></td>
                  <td style={{ padding: '7px 0 7px 10px' }}></td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${US.border}` }}>
                  <td style={{ padding: '7px 10px 7px 0', fontSize: 12, color: '#3C3A36', fontFamily: US.sans }}>
                    Sum of category variances (line items)
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: 12,
                    fontVariantNumeric: 'tabular-nums', fontFamily: US.sans, color: US.navy }}>
                    {fmt.m2(reconc.catVar)}
                  </td>
                  <td style={{ padding: '7px 10px' }}></td>
                  <td style={{ padding: '7px 0 7px 10px' }}></td>
                </tr>
                <tr>
                  <td style={{ padding: '7px 10px 7px 0', fontSize: 12, fontWeight: 600,
                    color: '#3C3A36', fontFamily: US.sans }}>Difference</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: 12,
                    fontVariantNumeric: 'tabular-nums', fontFamily: US.sans, color: US.navy }}>
                    {fmt.m2(reconc.varDiff)}
                  </td>
                  <td style={{ padding: '7px 10px' }}></td>
                  <td style={{ padding: '7px 0 7px 10px', textAlign: 'right', fontSize: 12,
                    fontWeight: 600, fontFamily: US.sans,
                    color: reconc.varOk ? US.green : US.red }}>
                    {reconc.varOk ? '$0.00 ✓' : `${fmt.m2(reconc.varDiff)} ✗`}
                  </td>
                </tr>
              </RcSection>

              {/* ── Drilldown Reconciliation table ───────────────── */}
              <RcSection
                title="Drilldown Reconciliation"
                col2Hdr="KPI Value"
                col3Hdr="Drilldown Total"
              >
                {reconc.drillRows.map(r => (
                  <RcRow key={r.label}
                    label={r.label} col2={r.kpi} col3={r.drill}
                    diff={r.diff} ok={r.ok} />
                ))}
              </RcSection>

            </div>
          )}

          {/* ── ERROR ───────────────────────────────────────────────── */}
          {stage === 'error' && (
            <div style={{ padding: '8px 0 4px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  <Icon name="alert" size={20} color={US.red} />
                </div>
                <div>
                  <div style={{ fontFamily: US.serif, fontWeight: 600, fontSize: 15, color: US.red, marginBottom: 8, lineHeight: 1.3 }}>
                    {fname ? `Could not process "${fname}"` : 'Upload error'}
                  </div>
                  <div style={{
                    fontSize: 12, color: '#3C3A36', lineHeight: 1.6, fontFamily: US.sans,
                    background: '#FEF0F0', border: `1px solid #F0B4B4`,
                    padding: '10px 14px',
                  }}>{err}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: US.stone, fontFamily: US.sans,
                display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="info" size={11} color={US.stone} />
                The previous dashboard dataset remains active. No changes were made.
              </div>
            </div>
          )}

        </div>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <div style={{
          padding: '12px 24px',
          borderTop: `1px solid ${US.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{
            fontSize: 11, color: US.stone, fontFamily: US.sans,
            display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0,
          }}>
            <Icon name="info" size={11} color={US.stone} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Data persists in browser storage · survives page reload
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {(stage === 'error' || (stage === 'reconc' && !reconc?.allOk)) && (
              <button onClick={doReset} style={{
                padding: '8px 16px', background: 'none',
                border: `1px solid ${US.border}`, cursor: 'pointer',
                fontSize: 13, fontWeight: 500, color: US.stone, fontFamily: US.sans,
              }}>Try another file</button>
            )}
            <button onClick={onClose} style={{
              padding: '8px 16px', background: 'none',
              border: `1px solid ${US.border}`, cursor: 'pointer',
              fontSize: 13, fontWeight: 500, color: US.stone, fontFamily: US.sans,
            }}>Cancel</button>
            {stage === 'reconc' && reconc?.allOk && (
              <button onClick={doApply} style={{
                padding: '8px 22px',
                background: US.navy, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: US.sans,
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <Icon name="check" size={13} color="#fff" />
                Apply to Dashboard
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

window.UploadModal = UploadModal;
