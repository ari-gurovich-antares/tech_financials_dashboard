// tab-overview.jsx — Executive Overview v4
// Row 0: Filter bar  |  Row 1: 4 Primary KPIs  |  Row 2: 3 Risk/Opp/Net
// Row 3: Executive Bridge (full-width)  |  Row 4: Category Variance + Drill

const { useState: useStateOV, useMemo: useMemoOV, useRef: useRefOV, useEffect: useEffectOV } = React;

// ── Design tokens ─────────────────────────────────────────────────────────
const OV = {
  navy:   '#333C66',
  red:    '#B23A3A',
  green:  '#2F7A4D',
  stone:  '#807E7A',
  border: '#ECEAE7',
  bg:     '#FAFAF8',
  serif:  "'Source Serif 4', Georgia, serif",
  sans:   "'Inter', Arial, sans-serif",
};

const OV_CATS = ['Labor/ T&M', 'Software', 'MS', 'Infrastructure', 'Hardware', 'OOE', 'FPC'];

// Group by Sub-Category1 — this matches the YTD Financials Run Rate pivot grouping.
// All rows (including Amortization TX type) are grouped by their Sub-Category1 value.
function ovCat(li) {
  return li.subCategory || li.category || '(Other)';
}

// ── OvEyebrow ─────────────────────────────────────────────────────────────
function OvEyebrow({ text, light }) {
  return (
    <div style={{
      fontFamily: OV.serif, fontWeight: 800, fontSize: 10,
      letterSpacing: '0.22em', textTransform: 'lowercase',
      color: light ? 'rgba(255,255,255,0.52)' : OV.stone,
      marginBottom: 10,
    }}>{text}</div>
  );
}

// ── OvFilterDrop — compact multi-select dropdown ──────────────────────────
function OvFilterDrop({ label, options, value, onChange }) {
  const [open, setOpen] = useStateOV(false);
  const ref = useRefOV(null);

  useEffectOV(() => {
    if (!open) return;
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const active = value.length > 0;
  const toggle = v => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px',
          background: active ? OV.navy : '#fff',
          border: `1px solid ${active ? OV.navy : OV.border}`,
          color: active ? '#fff' : OV.stone,
          cursor: 'pointer', fontFamily: OV.sans, fontSize: 12,
          fontWeight: active ? 600 : 500,
          transition: 'all 0.12s',
        }}
      >
        {active ? `${label} · ${value.length}` : label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d={open ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6'} />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
          background: '#fff', border: `1px solid ${OV.border}`,
          boxShadow: '0 4px 20px rgba(51,60,102,0.14)',
          minWidth: 220, maxHeight: 300, overflowY: 'auto',
        }}>
          {options.length === 0 && (
            <div style={{ padding: '10px 14px', fontSize: 12, color: OV.stone, fontFamily: OV.sans }}>
              No options available
            </div>
          )}
          {options.map(opt => (
            <label key={opt} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 14px', cursor: 'pointer',
              background: value.includes(opt) ? '#F4F6FF' : 'transparent',
              transition: 'background 0.1s',
            }}>
              <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)}
                style={{ accentColor: OV.navy, width: 13, height: 13, flexShrink: 0 }} />
              <span style={{
                fontSize: 12, fontFamily: OV.sans,
                color: value.includes(opt) ? OV.navy : '#3C3A36',
                fontWeight: value.includes(opt) ? 600 : 400,
              }}>{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ovBuildDrillHierarchy ────────────────────────────────────────────────
// Builds a category → vendor → contract hierarchy from lineItems for a
// given numeric field (risk, opp-abs, or net).  The resulting structure
// is identical to the format consumed by KPIDrillPanel and NetDrillPanel:
//   { total, categories: [{ cat, amount, vendors: [{ name, amount, contracts }] }] }
//
// DATA SOURCE: always the workbook-scoped lineItems passed into OverviewTab.
// This guarantees the drill hierarchy reconciles exactly to the KPI cards.
function ovBuildDrillHierarchy(lineItems, getAmount) {
  const byCat = {};
  for (const li of lineItems) {
    const amt = getAmount(li);
    if (Math.abs(amt) < 0.005) continue; // skip zero-value rows
    const cat    = ovCat(li);
    const vendor = li.vendor || '(unspecified)';
    const appPfx = li.application && li.application !== 'N/A' && li.application.trim()
      ? li.application + ' — ' : '';
    const cName  = (appPfx + (li.project || '')).slice(0, 80) || vendor;
    if (!byCat[cat]) byCat[cat] = {};
    if (!byCat[cat][vendor]) byCat[cat][vendor] = { total: 0, contracts: [] };
    // Accumulate raw (unrounded) amounts so the final total exactly matches
    // the workbookSubtotal field (no floating-point drift from cent-rounding).
    byCat[cat][vendor].total += amt;
    byCat[cat][vendor].contracts.push({ name: cName, amount: amt, notes: li.notes || '' });
  }
  const r2 = n => Math.round(n * 100) / 100; // round only at display boundary
  const categories = Object.entries(byCat).map(([cat, vendorMap]) => {
    const vendors = Object.entries(vendorMap)
      .map(([name, data]) => {
        const vendorTotal = data.total;
        const mat = data.contracts
          .filter(c => Math.abs(c.amount) >= 100)
          .map(c => ({ ...c, amount: r2(c.amount) }));
        const resid = vendorTotal - mat.reduce((s,c)=>s+c.amount,0);
        if (Math.abs(resid) >= 0.01) mat.push({ name:'Other / minor', amount: r2(resid), notes:'' });
        return { name, amount: r2(vendorTotal), contracts: mat };
      })
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    const catRaw = vendors.reduce((s,v)=>s+v.amount,0);
    return { cat, amount: r2(catRaw), vendors };
  }).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  return {
    total: r2(categories.reduce((s,c)=>s+c.amount,0)),
    categories,
  };
}

// ── Inline category waterfall (light theme, for in-page drilldown) ──────────
function OvCatWaterfall({ catBudget, catForecast, wfSteps }) {
  const [hov, setHov] = useStateOV(null);
  if (!wfSteps || wfSteps.length === 0) return null;
  const N = wfSteps.length;

  const allVals = [catBudget, catForecast, ...wfSteps.map(s => s.from), ...wfSteps.map(s => s.to)];
  const rawMin  = Math.min(...allVals);
  const rawMax  = Math.max(...allVals);
  const spread  = Math.max(rawMax - rawMin, Math.abs(catBudget) * 0.005, 1);
  const floorV  = rawMin - spread * 1.3;
  const ceilV   = rawMax + spread * 0.65;
  const vRange  = Math.max(ceilV - floorV, 1);

  const VW = 1060, VH = 360;
  const CT = 86, CB = 120;
  const CH = VH - CT - CB;
  const AXIS_Y = CT + CH;
  const CL = 16, CR = 1044;

  const BW   = 90;
  const AVAIL = CR - CL - 2 * BW;
  const CW    = Math.max(28, Math.min(80, Math.floor(AVAIL / (N * 1.5))));
  const GAP   = Math.max(6, (AVAIL - N * CW) / (N + 1));
  const stepX = i => CL + BW + (i + 1) * GAP + i * CW;
  const fcX   = CL + BW + (N + 1) * GAP + N * CW;
  const scY   = v => CT + CH * (1 - (v - floorV) / vRange);

  const maxUnfav = wfSteps.filter(s => s.variance > 0).reduce((m, s) => Math.max(m, s.variance), -Infinity);
  const minFav   = wfSteps.filter(s => s.variance < 0).reduce((m, s) => Math.min(m, s.variance), Infinity);

  const totalVar = catForecast - catBudget;
  const totFav   = totalVar <= 0;
  const FCC      = totFav ? OV.green : OV.red;
  const varPct   = Math.abs(catBudget) > 0 ? Math.abs(totalVar / catBudget * 100).toFixed(1) : '0.0';
  return (
    <svg width="100%" viewBox={`0 0 ${VW} ${VH}`} style={{ display: 'block' }}>
      {[0.33, 0.67].map(t => (
        <line key={t} x1={CL} y1={CT + CH * t} x2={CR} y2={CT + CH * t}
          stroke={OV.border} strokeWidth="1" strokeDasharray="2 4" />
      ))}
      <line x1={CL - 4} y1={AXIS_Y} x2={CR + 4} y2={AXIS_Y} stroke="#D4D2CE" strokeWidth="1.5" />

      {/* Budget bar */}
      {(() => {
        const bY = scY(catBudget); const bH = AXIS_Y - bY; const cx = CL + BW / 2;
        return (
          <g>
            <rect x={CL} y={bY} width={BW} height={bH} fill={OV.navy} rx="1" />
            <text x={cx} y={bY - 26} textAnchor="middle"
              fill={OV.stone} fontFamily={OV.sans} fontWeight="700" fontSize="8" letterSpacing="0.12em">BUDGET</text>
            <text x={cx} y={bY - 11} textAnchor="middle"
              fill={OV.navy} fontFamily={OV.serif} fontWeight="700" fontSize="14"
              style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt.m(catBudget)}</text>
            <text x={cx} y={AXIS_Y + 18} textAnchor="middle"
              fill={OV.navy} fontFamily={OV.sans} fontWeight="700" fontSize="12">Budget</text>
            <line x1={CL + BW} y1={bY} x2={stepX(0)} y2={bY}
              stroke="#D4D2CE" strokeWidth="1" strokeDasharray="4 3" />
          </g>
        );
      })()}

      {/* Step bars */}
      {wfSteps.map((step, i) => {
        const isNeut     = Math.abs(step.variance) < 500;
        const isFav      = step.variance < 0;
        const color      = isNeut ? '#C4C2BE' : isFav ? OV.green : OV.red;
        const isHov      = hov === step.label;
        const isLargestUF  = step.variance > 0 && step.variance === maxUnfav;
        const isLargestFav = step.variance < 0 && step.variance === minFav;
        const hasBadge   = (isLargestUF || isLargestFav) && !isNeut;
        const cx = stepX(i) + CW / 2;
        const hiVal = Math.max(step.from, step.to); const loVal = Math.min(step.from, step.to);
        const topY = scY(hiVal); const botY = scY(loVal);
        const stepH = Math.max(botY - topY, 2);
        const connY = scY(step.to);
        const nextX = i < N - 1 ? stepX(i + 1) : fcX;
        const lblX = stepX(i) + CW / 2;
        const lblY = AXIS_Y + 14;
        return (
          <g key={`${step.label}-${i}`}
            onMouseEnter={() => setHov(step.label)}
            onMouseLeave={() => setHov(null)}>
            <rect x={stepX(i)} y={topY} width={CW} height={stepH} rx="1"
              fill={color} opacity={isNeut ? 0.35 : isHov ? 1 : 0.82}
              style={{ transition: 'opacity 0.12s' }} />
            {hasBadge && (
              <g>
                <rect x={stepX(i) + 2} y={topY - 22} width={CW - 4} height={13} rx="2" fill={color} opacity="0.14" />
                <text x={cx} y={topY - 12} textAnchor="middle"
                  fill={color} fontFamily={OV.sans} fontWeight="800" fontSize="7.5" letterSpacing="0.1em">
                  {isFav ? '\u2193 LARGEST OFFSET' : '\u2191 LARGEST DRIVER'}
                </text>
              </g>
            )}
            {!isNeut && (
              <text x={cx} y={topY - (hasBadge ? 30 : 9)} textAnchor="middle"
                fill={color} fontFamily={OV.serif} fontWeight="700" fontSize="13"
                style={{ fontVariantNumeric: 'tabular-nums' }}>
                {isFav ? '\u2212' : '+'}{fmt.k(Math.abs(step.variance))}
              </text>
            )}
            <text
              transform={`rotate(-38, ${lblX}, ${lblY})`}
              x={lblX} y={lblY}
              textAnchor="end"
              fill={isHov ? OV.navy : OV.stone}
              fontFamily={OV.sans}
              fontWeight={isHov ? 600 : 400}
              fontSize="11">
              {step.label}
            </text>
            <line x1={stepX(i) + CW} y1={connY} x2={nextX} y2={connY}
              stroke="#D4D2CE" strokeWidth="1" strokeDasharray="4 3" />
          </g>
        );
      })}

      {/* Forecast bar */}
      {(() => {
        const fY = scY(catForecast); const fH = AXIS_Y - fY; const cx = fcX + BW / 2;
        return (
          <g>
            <rect x={fcX} y={fY} width={BW} height={fH} fill={FCC} rx="1" />
            <text x={cx} y={fY - 22} textAnchor="middle"
              fill={FCC} fontFamily={OV.sans} fontWeight="700" fontSize="8" letterSpacing="0.1em">
              {totFav ? '\u25b2 FAV' : '\u25bc UNFAV'}{'\u2002'}{totFav ? '\u2212' : '+'}{varPct}%
            </text>
            <text x={cx} y={fY - 8} textAnchor="middle"
              fill={FCC} fontFamily={OV.serif} fontWeight="700" fontSize="13"
              style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt.m(catForecast)}</text>
            <text x={cx} y={AXIS_Y + 16} textAnchor="middle"
              fill={FCC} fontFamily={OV.sans} fontWeight="600" fontSize="11">Forecast</text>
          </g>
        );
      })()}
      <text x={VW / 2} y={VH - 6} textAnchor="middle" fill="#C4C2BE" fontFamily={OV.sans} fontSize="9">
        {`Budget ${fmt.m(catBudget)} ${totFav ? '\u2212' : '+'} ${fmt.m(Math.abs(totalVar))} variance = Forecast ${fmt.m(catForecast)}`}
      </text>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────
function OverviewTab({ data }) {
  const [sel, setSel]             = useStateOV(null);
  const [openPanel, setOpenPanel] = useStateOV(null);
  const [selVendorDrill, setSelVendorDrill]     = useStateOV(null);
  const [flt, setFlt]             = useStateOV({ domains: [], owners: [], cats: [] });

  const allItems = data.lineItems || [];
  const lookups  = data.lookups   || {};

  // ── Filter option lists ───────────────────────────────────────────────
  const domainOpts = useMemoOV(() => {
    if (lookups.domains?.length) return lookups.domains.filter(Boolean).sort();
    return [...new Set(allItems.map(li => li.domain).filter(Boolean))].sort();
  }, [allItems, lookups]);

  const ownerOpts = useMemoOV(() => {
    if (lookups.owners?.length) return lookups.owners.filter(x => x && x !== 'N/A').sort();
    return [...new Set(allItems.map(li => li.owner).filter(x => x && x !== 'N/A'))].sort();
  }, [allItems, lookups]);

  // ── Filtered line items ───────────────────────────────────────────────
  const items = useMemoOV(() => {
    const { domains, owners, cats } = flt;
    if (!domains.length && !owners.length && !cats.length) return allItems;
    return allItems.filter(li => {
      if (domains.length && !domains.includes(li.domain)) return false;
      if (owners.length  && !owners.includes(li.owner))   return false;
      if (cats.length    && !cats.includes(ovCat(li)))     return false;
      return true;
    });
  }, [allItems, flt]);

  const filterActive = flt.domains.length + flt.owners.length + flt.cats.length > 0;
  const clearFilters = () => setFlt({ domains: [], owners: [], cats: [] });

  // ── KPIs ─────────────────────────────────────────────────────────────
  // When no filters active: use workbook SUBTOTAL values directly (exact match to source).
  // When filters active: derive from filtered line items.
  const kpi = useMemoOV(() => {
    // Priority 1: YTD Financials Run Rate Grand Total—matches the user-visible reconciliation page
    if (!filterActive && data.ytdSummary) {
      const ys     = data.ytdSummary;
      const actual = data.workbookSubtotal?.actual ?? data.summary?.actual ?? 0;
      return {
        budget:    ys.budget,
        forecast:  ys.forecast,
        actual,
        remaining: ys.forecast - actual,
        risk:      ys.risk,
        opp:       ys.absOpp,
        net:       ys.net,
      };
    }
    // Priority 2: workbookSubtotal (lineItems sum after filtered-SUBTOTAL fallback)
    if (!filterActive && data.workbookSubtotal) {
      const ws = data.workbookSubtotal;
      return {
        budget:    ws.budget,
        forecast:  ws.forecast,
        actual:    ws.actual,
        remaining: ws.remaining,
        risk:      ws.risk,
        opp:       ws.absOpp,
        net:       ws.net,
      };
    }
    // Filtered view — derive from filtered line items
    let b = 0, f = 0, a = 0, r = 0, o = 0, n = 0;
    for (const li of items) {
      b += li.budget   || 0;
      f += li.forecast || 0;
      a += li.actual   || 0;
      r += li.risk     || 0;
      o += li.opp      || 0;
      n += li.net      || 0;
    }
    return { budget: b, forecast: f, actual: a, remaining: f - a, risk: r, opp: Math.abs(o), net: n };
  }, [items, filterActive, data.workbookSubtotal, data.ytdSummary]);

  // Back Pocket: computed from full workbook lineItems (not filtered).
  // = |Σ net| where Non-Committed flag = Y / Yes / True / 1 (case-insensitive).
  // Falls back to data.summary.backPocket if lineItems lack the nonCommitted field
  // (e.g. pre-fix localStorage data restored at boot).
  const backPocket = useMemoOV(() => {
    const src = data.lineItems || [];
    const isFlag = v => { const s = String(v || '').trim().toLowerCase(); return s==='y'||s==='yes'||s==='true'||s==='1'; };
    const flagged = src.filter(li => isFlag(li.nonCommitted));
    const sum     = flagged.reduce((s, li) => s + (li.net || 0), 0);
    console.log('[overview] backPocket lineItems count', src.length);
    console.log('[overview] backPocket flagged count',   flagged.length);
    console.log('[overview] backPocket raw sum',         sum);
    console.log('[overview] backPocket display',         Math.abs(sum));
    // If no rows flagged but summary carries a pre-computed value, use it as fallback
    if (flagged.length === 0 && data.summary && data.summary.backPocket > 0) {
      console.log('[overview] backPocket using summary.backPocket fallback', data.summary.backPocket);
      return data.summary.backPocket;
    }
    return Math.abs(sum);
  }, [data.lineItems, data.summary]);

  // ── Category aggregation — gross Risk and Opportunity per category ──────
  // Priority: YTD category rows (consistent with KPI cards).
  // Fallback: Master Data lineItems aggregation when filtered or YTD unavailable.
  // Risk bars (red) = positive values from risk column (unfavorable exposure).
  // Opp bars (green) = abs of negative opp values (favorable upside).
  const cats = useMemoOV(() => {
    if (!filterActive && data.ytdCategories?.length) {
      const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      return OV_CATS.map(cat => {
        const ytd = data.ytdCategories.find(c =>
          c.category === cat ||
          norm(c.category).startsWith(norm(cat).slice(0, 4))
        );
        if (!ytd) return { cat, risk: 0, opp: 0, v: 0 };
        return {
          cat,
          risk: Math.max(0, Math.round(ytd.risk)),   // positive = unfavorable
          opp:  Math.max(0, Math.round(-ytd.opp)),   // negative opp → positive bar
          v:    Math.round(ytd.forecast - ytd.budget),
        };
      });
    }
    // Filtered or YTD unavailable — aggregate from lineItems
    const agg = {};
    for (const li of items) {
      const c = ovCat(li);
      if (!agg[c]) agg[c] = { risk: 0, opp: 0, net: 0 };
      agg[c].risk += li.risk || 0;
      agg[c].opp  += Math.abs(li.opp || 0);
      agg[c].net  += (li.forecast || 0) - (li.budget || 0);
    }
    return OV_CATS.map(cat => {
      const d = agg[cat] || { risk: 0, opp: 0, net: 0 };
      return { cat, risk: Math.round(d.risk), opp: Math.round(d.opp), v: Math.round(d.net) };
    });
  }, [items, filterActive, data.ytdCategories]);

  const ovMaxBar   = Math.max(...cats.map(c => Math.max(c.risk, c.opp)), 1);

  // Reconciliation: risk bars → kpi.risk; opp bars → kpi.opp.
  useEffectOV(() => {
    const chartRiskTotal = cats.reduce((s, c) => s + c.risk, 0);
    const chartOppTotal  = cats.reduce((s, c) => s + c.opp,  0);
    const kpiRisk = kpi.risk;
    const kpiOpp  = kpi.opp;
    const riskDiff = Math.abs(chartRiskTotal - kpiRisk);
    const oppDiff  = Math.abs(chartOppTotal  - kpiOpp);
    console.log('[risk/opp chart reconcile]', { chartRiskTotal, kpiRisk, riskDiff, chartOppTotal, kpiOpp, oppDiff });
    if (riskDiff > 1000) console.warn('[risk/opp chart] riskDiff > $1K — check data source');
    if (oppDiff  > 1000) console.warn('[risk/opp chart] oppDiff > $1K — check data source');
  }, [cats, kpi.risk, kpi.opp]);

  // ── Drill-down vendors ────────────────────────────────────────────────
  const drillRows = useMemoOV(() => {
    if (!sel) return [];
    const by = {};
    for (const li of items) {
      if (ovCat(li) !== sel) continue;
      const key = sel === 'FPC'
        ? (li.project || li.vendor || 'Other')
        : (li.vendor || 'Other');
      if (!by[key]) by[key] = 0;
      by[key] += (li.forecast || 0) - (li.budget || 0);
    }
    const total = Object.values(by).reduce((s, v) => s + v, 0);
    const rows  = Object.entries(by)
      .map(([name, v]) => ({ name, v: Math.round(v) }))
      .filter(r => Math.abs(r.v) >= 500)
      .sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
      .slice(0, 8);
    const rest = Math.round(total - rows.reduce((s, r) => s + r.v, 0));
    if (Math.abs(rest) >= 1) rows.push({ name: 'Other', v: rest });
    return rows;
  }, [sel, items]);

  const drillCatV   = cats.find(c => c.cat === sel)?.v || 0;
  const drillMaxAbs = Math.max(...drillRows.map(r => Math.abs(r.v)), 1);
  // ── Vendor detail for inline waterfall + table ─────────────────────────
  const drillVendorsData = useMemoOV(() => {
    if (!sel) return { vendors: [], catBudget: 0, catForecast: 0, wfSteps: [] };
    const vm = {};
    for (const li of items) {
      if (ovCat(li) !== sel) continue;
      const v = li.vendor || '(unspecified)';
      if (!vm[v]) vm[v] = { name: v, budget: 0, forecast: 0, contracts: [] };
      vm[v].budget   += li.budget   || 0;
      vm[v].forecast += li.forecast || 0;
      const appPfx = li.application && li.application !== 'N/A' && li.application.trim()
        ? li.application + ' \u2014 ' : '';
      const cName = (appPfx + (li.project || '')).trim().slice(0, 80) || v;
      vm[v].contracts.push({ name: cName, budget: li.budget || 0, forecast: li.forecast || 0, notes: li.notes || '' });
    }
    const vendors = Object.values(vm)
      .map(v => ({ ...v, variance: v.forecast - v.budget }))
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
    const catBudget   = vendors.reduce((s, v) => s + v.budget,   0);
    const catForecast = vendors.reduce((s, v) => s + v.forecast, 0);
    const MAX_WF = 8;
    const top   = vendors.filter(v => Math.abs(v.variance) >= 500).slice(0, MAX_WF);
    const restV = vendors.reduce((s, v) => s + v.variance, 0) - top.reduce((s, v) => s + v.variance, 0);
    const restB = catBudget   - top.reduce((s, v) => s + v.budget,   0);
    const restF = catForecast - top.reduce((s, v) => s + v.forecast, 0);
    const wfAll = Math.abs(restV) >= 500
      ? [...top, { name: 'Other / minor', budget: restB, forecast: restF, variance: restV, contracts: [] }]
      : top;
    let running = catBudget;
    const wfSteps = wfAll.map(v => {
      const from = running; const to = running + v.variance; running = to;
      return { label: v.name, variance: v.variance, from, to };
    });
    return { vendors, catBudget, catForecast, wfSteps };
  }, [sel, items]);



  // ── Risk / Opp / Net drill hierarchies ───────────────────────────────────
  // Built from the same workbook-scoped lineItems so totals reconcile to KPIs.
  // dynRisk.total  === kpi.risk  (within float rounding)
  // dynOpp.total   === kpi.opp   (both use ABS of the opp column)
  // dynNet.total   === kpi.net   (signed; negative = favorable)
  const dynRisk = useMemoOV(() =>
    ovBuildDrillHierarchy(items, li => li.risk || 0),
    [items]
  );
  const dynOpp = useMemoOV(() =>
    // opp values are negative in the workbook (favorable); display as positive amounts
    ovBuildDrillHierarchy(items, li => Math.abs(li.opp || 0)),
    [items]
  );
  const dynNet = useMemoOV(() =>
    ovBuildDrillHierarchy(items, li => li.net || 0),
    [items]
  );

  // ── Bridge math ───────────────────────────────────────────────────────
  const totalVar = kpi.forecast - kpi.budget;
  const fav      = totalVar <= 0;
  const varPct   = kpi.budget ? (Math.abs(totalVar) / kpi.budget * 100).toFixed(1) : '0.0';

  // Full-width bridge SVG — ~200% wider bars vs old 84px design
  const BW  = 900, BCH = 160, BPT = 44, BPB = 56;
  const BSH = BPT + BCH + BPB;
  const BBW = 150, BM = 60;
  const BGAP = (BW - 2 * BM - 3 * BBW) / 2;           // 165px gap
  const BX   = [BM, BM + BBW + BGAP, BM + 2 * (BBW + BGAP)];
  const BAY  = BPT + BCH;
  const bScale = Math.max(kpi.budget, kpi.forecast) * 1.15;
  const bY   = v => BAY - (v / bScale) * BCH;
  const budY = bY(kpi.budget), fcY = bY(kpi.forecast);
  const dTop = Math.min(budY, fcY);
  const dH   = Math.max(Math.abs(budY - fcY), 4);
  const DC   = fav ? OV.green : OV.red;
  const FCC  = fav ? OV.navy  : OV.red;

  const CARD = { background: '#fff', border: `1px solid ${OV.border}` };
  const MB20 = { marginBottom: 20 };

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* ══ FILTER BAR ══════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 16, flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: OV.serif, fontWeight: 800, fontSize: 10,
          letterSpacing: '0.22em', textTransform: 'lowercase',
          color: OV.stone, marginRight: 4,
        }}>filter</span>
        <OvFilterDrop
          label="Domain" options={domainOpts}
          value={flt.domains} onChange={v => setFlt({ ...flt, domains: v })}
        />
        <OvFilterDrop
          label="Domain Owner" options={ownerOpts}
          value={flt.owners} onChange={v => setFlt({ ...flt, owners: v })}
        />
        <OvFilterDrop
          label="Category" options={OV_CATS}
          value={flt.cats} onChange={v => setFlt({ ...flt, cats: v })}
        />
        {filterActive && (
          <>
            <button
              onClick={clearFilters}
              style={{
                padding: '6px 12px', background: 'none',
                border: `1px solid ${OV.border}`, cursor: 'pointer',
                fontFamily: OV.sans, fontSize: 12, color: OV.stone,
              }}>✕ Clear all</button>
            <span style={{ fontSize: 11, color: OV.stone, fontStyle: 'italic', fontFamily: OV.sans }}>
              Filtered view · {items.length} of {allItems.length} rows
            </span>
          </>
        )}
      </div>

      {/* ══ ROW 1 — 4 PRIMARY KPIs ══════════════════════════════════════ */}
      <style>{`
        .kpi-flip { position: relative; cursor: default; }
        .kpi-flip-inner { position: relative; width: 100%; height: 100%; }
        .kpi-flip-front {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 28px; text-align: center;
          transition: opacity 0.25s;
        }
        .kpi-flip-back {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 28px; text-align: center;
          background: #333C66;
          opacity: 0;
          transition: opacity 0.25s;
        }
        .kpi-flip:hover .kpi-flip-back  { opacity: 1; }
        .kpi-flip:hover .kpi-flip-front { opacity: 0; }
      `}</style>
      <div style={{ ...CARD, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', overflow: 'hidden', maxWidth: 1050, margin: '0 auto 20px' }}>
        {[
          { label: 'annual budget',      val: fmt.m(kpi.budget),    sub: '2026 approved budget' },
          { label: 'year-end forecast',  val: fmt.m(kpi.forecast),  sub: 'actuals + remaining forecast' },
          { label: 'back pocket',        val: fmt.m(backPocket),    sub: 'non-committed favorable net position' },

        ].map((k, i) => (
          <div key={i} className="kpi-flip" style={{ borderLeft: i > 0 ? `1px solid ${OV.border}` : 'none', height: 128 }}>
            <div className="kpi-flip-inner">
              <div className="kpi-flip-front">
                <OvEyebrow text={k.label} />
                <div style={{
                  fontFamily: OV.serif, fontWeight: 600, fontSize: 40, lineHeight: 1,
                  letterSpacing: '-0.01em', color: OV.navy, fontVariantNumeric: 'tabular-nums',
                }}>{k.val}</div>
              </div>
              <div className="kpi-flip-back">
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.2em',
                  textTransform: 'lowercase', color: 'rgba(255,255,255,0.45)',
                  marginBottom: 10, fontFamily: OV.serif,
                }}>{k.label}</div>
                <div style={{
                  fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.9)',
                  lineHeight: 1.35, fontFamily: OV.sans,
                }}>{k.sub}</div>
                <div style={{
                  marginTop: 14, fontFamily: OV.serif, fontWeight: 600, fontSize: 24,
                  color: 'rgba(255,255,255,0.28)', fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.01em',
                }}>{k.val}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ ROW 2 — STACKED OPP/RISK + NET ════════════════════════════ */}
      <div style={{
        ...CARD, ...MB20,
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        maxWidth: 860, margin: '0 auto 20px',
      }}>

        {/* Left column: Net Opp/Risk Position (full height) */}
        <button
          onClick={() => setOpenPanel({ type: 'net' })}
          style={{
            padding: '28px 28px 24px', background: OV.navy, border: 'none', borderRight: `1px solid rgba(255,255,255,0.15)`,
            textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'filter 0.12s', width: '100%', display: 'flex',
            flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
          onMouseLeave={e => e.currentTarget.style.filter = 'none'}
        >
          <OvEyebrow text="net opp/risk position" light />
          <div style={{
            fontFamily: OV.serif, fontWeight: 600, fontSize: 36, lineHeight: 1,
            letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums',
            color: kpi.net > 0 ? '#E87878' : '#72D4A0',
          }}>{fmt.m(Math.abs(kpi.net))}</div>
          <div style={{ fontSize: 12, fontWeight: 500, marginTop: 9, color: kpi.net > 0 ? '#E87878' : '#72D4A0' }}>
            {kpi.net > 0 ? '\u25bc\u2002net unfavorable' : '\u25b2\u2002net favorable'}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', gap: 4, letterSpacing: '0.04em' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            explore variance
          </div>
        </button>

        {/* Right column: Opportunity (top) + Risk (bottom) stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${OV.border}` }}>

          {/* Opportunities */}
          <button
            onClick={() => setOpenPanel({ type: 'opp' })}
            style={{
              flex: 1, padding: '24px 28px 20px',
              borderTop: `3px solid ${OV.green}`,
              borderRight: 'none', borderLeft: 'none',
              borderBottom: `1px solid ${OV.border}`,
              background: 'transparent', textAlign: 'center', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'background 0.12s', width: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#EAF4EE'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <OvEyebrow text="opportunities" />
            <div style={{
              fontFamily: OV.serif, fontWeight: 600, fontSize: 32, lineHeight: 1,
              letterSpacing: '-0.01em', color: OV.green, fontVariantNumeric: 'tabular-nums',
            }}>{fmt.m(kpi.opp)}</div>
            <div style={{ fontSize: 12, color: OV.stone, marginTop: 8 }}>favorable upside</div>
            <div style={{ marginTop: 8, fontSize: 11, color: OV.green, opacity: 0.65,
              display: 'flex', alignItems: 'center', gap: 4, letterSpacing: '0.04em' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              investigate
            </div>
          </button>

          {/* Risk */}
          <button
            onClick={() => setOpenPanel({ type: 'risk' })}
            style={{
              flex: 1, padding: '24px 28px 20px',
              borderTop: `3px solid ${OV.red}`,
              borderRight: 'none', borderLeft: 'none', borderBottom: 'none',
              background: 'transparent', textAlign: 'center', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'background 0.12s', width: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FBEDED'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <OvEyebrow text="risk" />
            <div style={{
              fontFamily: OV.serif, fontWeight: 600, fontSize: 32, lineHeight: 1,
              letterSpacing: '-0.01em', color: OV.red, fontVariantNumeric: 'tabular-nums',
            }}>{fmt.m(kpi.risk)}</div>
            <div style={{ fontSize: 12, color: OV.stone, marginTop: 8 }}>downside exposure</div>
            <div style={{ marginTop: 8, fontSize: 11, color: OV.red, opacity: 0.65,
              display: 'flex', alignItems: 'center', gap: 4, letterSpacing: '0.04em' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              investigate
            </div>
          </button>

        </div>
      </div>

      {/* ══ ROW 4 — DRIVERS OF FORECAST VARIANCE ═══════════════════════ */}
      <div style={{ ...CARD, overflow: 'hidden' }}>

        {/* Chart panel */}
        <div style={{ padding: '32px 44px 0' }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <OvEyebrow text="risk and opportunity · by category" />
              <div style={{ fontFamily: OV.serif, fontWeight: 600, fontSize: 20, color: OV.navy, letterSpacing: '-0.005em' }}>
                Risk and Opportunity by Category
              </div>
              <div style={{ fontSize: 12, color: OV.stone, marginTop: 5, fontFamily: OV.sans }}>
                Gross downside exposure and favorable upside by category. Totals reconcile to the KPI cards above.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', paddingTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, background: OV.green, borderRadius: 1 }} />
                <span style={{ fontSize: 11, color: OV.stone }}>← Opportunity</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, background: OV.red, borderRadius: 1 }} />
                <span style={{ fontSize: 11, color: OV.stone }}>Risk →</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', marginBottom: 4, paddingLeft: 160 }}>
            <div style={{ flex: 1, textAlign: 'right', paddingRight: 8, fontSize: 9,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: OV.green, fontFamily: OV.sans, fontWeight: 600 }}>← opportunity</div>
            <div style={{ width: 2, flexShrink: 0 }} />
            <div style={{ flex: 1, paddingLeft: 8, fontSize: 9,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: OV.red, fontFamily: OV.sans, fontWeight: 600 }}>risk →</div>
          </div>
          <div style={{ height: 1, background: OV.border, marginLeft: 160 }} />

          {cats.map(({ cat, risk, opp }) => {
            const isSel     = sel === cat;
            const hasRisk   = risk > 500;
            const hasOpp    = opp  > 500;
            const drillable = hasRisk || hasOpp;
            const riskPct   = hasRisk ? (risk / ovMaxBar) * 80 : 0;
            const oppPct    = hasOpp  ? (opp  / ovMaxBar) * 80 : 0;

            return (
              <div key={cat}
                onClick={() => drillable && setSel(isSel ? null : cat)}
                style={{
                  display: 'flex', alignItems: 'center', height: 56,
                  borderBottom: '1px solid #F0EEEB',
                  cursor: drillable ? 'pointer' : 'default',
                  background: isSel ? '#F5F4F1' : 'transparent',
                  transition: 'background 0.12s',
                  marginLeft: -44, marginRight: -44,
                  paddingLeft: 44, paddingRight: 44,
                }}
                onMouseEnter={e => { if (drillable && !isSel) e.currentTarget.style.background = '#F8F7F5'; }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ width: 160, flexShrink: 0, fontSize: 14, fontWeight: isSel ? 600 : 400,
                  color: isSel ? OV.navy : '#3C3A36',
                  display: 'flex', alignItems: 'center', gap: 5 }}>
                  {cat}
                  {drillable && !isSel && <span style={{ fontSize: 9, color: OV.stone, opacity: 0.4 }}>›</span>}
                  {isSel && <span style={{ fontSize: 9, color: OV.navy, opacity: 0.5 }}>▾</span>}
                </div>

                {/* Opportunity — green, extends left */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, paddingRight: 3 }}>
                  {hasOpp && (<>
                    <div style={{ fontSize: 12, color: OV.green, fontVariantNumeric: 'tabular-nums', fontFamily: OV.sans }}>
                      {fmt.k(opp)}
                    </div>
                    <div style={{ height: 22, width: `${oppPct}%`, background: OV.green,
                      borderRadius: '3px 0 0 3px', transition: 'width 0.3s ease' }} />
                  </>)}
                </div>

                <div style={{ width: 2, height: 40, background: '#D4D2CE', flexShrink: 0 }} />

                {/* Risk — red, extends right */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 6, paddingLeft: 3 }}>
                  {hasRisk && (<>
                    <div style={{ height: 22, width: `${riskPct}%`, background: OV.red,
                      borderRadius: '0 3px 3px 0', transition: 'width 0.3s ease' }} />
                    <div style={{ fontSize: 12, color: OV.red, fontVariantNumeric: 'tabular-nums', fontFamily: OV.sans }}>
                      {fmt.k(risk)}
                    </div>
                  </>)}
                  {!hasRisk && !hasOpp && <span style={{ fontSize: 12, color: '#C8C6C2', paddingLeft: 4 }}>—</span>}
                </div>
              </div>
            );
          })}

          {/* Footer totals */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 32, alignItems: 'center',
            paddingTop: 14, paddingBottom: 2, marginTop: 6,
            borderTop: '1px solid #EDECEA',
          }}>
            <div style={{ fontSize: 11, color: OV.stone, fontFamily: OV.sans }}>
              {'Total Opportunity: '}
              <span style={{ color: OV.green, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {fmt.m(cats.reduce((s, c) => s + c.opp, 0))}
              </span>
            </div>
            <div style={{ fontSize: 11, color: OV.stone, fontFamily: OV.sans }}>
              {'Total Risk: '}
              <span style={{ color: OV.red, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {fmt.m(cats.reduce((s, c) => s + c.risk, 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Drill-down panel */}
        <div style={{ borderTop: `1px solid ${OV.border}`, background: OV.bg, minHeight: 72 }}>

          {!sel && (
            <div style={{ padding: '24px 44px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ECEAE7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#999"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
              <div style={{ fontSize: 13, color: OV.stone }}>
                Select a category above to view contributing vendors, contracts, and projects.
              </div>
            </div>
          )}

          {sel && (
            <div style={{ padding: '28px 44px 32px' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: OV.serif, fontWeight: 800, fontSize: 10,
                    letterSpacing: '0.22em', textTransform: 'lowercase',
                    color: OV.stone, marginBottom: 8 }}>
                    {sel === 'FPC' ? 'fixed price contracts' : `${sel.toLowerCase()} · variance drilldown`}
                  </div>
                  <div style={{ fontFamily: OV.serif, fontWeight: 600, fontSize: 18, color: OV.navy, marginBottom: 4 }}>
                    {sel} — Variance Detail
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                    fontFamily: OV.sans, color: drillCatV < 0 ? OV.green : OV.red }}>
                    {drillCatV < 0 ? '\u2212' : '+'}{fmt.m(Math.abs(drillCatV))}
                    {'\u2002'}net {drillCatV < 0 ? 'favorable' : 'unfavorable'}
                  </div>
                </div>
                <button onClick={() => { setSel(null); setSelVendorDrill(null); }}
                  style={{ padding: '5px 12px', background: 'none', border: `1px solid ${OV.border}`,
                    fontSize: 12, color: OV.stone, cursor: 'pointer', fontFamily: OV.sans }}>
                  ✕ close
                </button>
              </div>

              {/* Inline waterfall */}
              {drillVendorsData.wfSteps.length > 0 && (
                <div style={{ marginBottom: 24, marginLeft: -44, marginRight: -44,
                  paddingLeft: 44, paddingRight: 44, paddingBottom: 20,
                  borderBottom: `1px solid ${OV.border}` }}>
                  <div style={{ fontFamily: OV.serif, fontWeight: 800, fontSize: 10,
                    letterSpacing: '0.22em', textTransform: 'lowercase',
                    color: OV.stone, marginBottom: 12 }}>budget to forecast</div>
                  <OvCatWaterfall
                    catBudget={drillVendorsData.catBudget}
                    catForecast={drillVendorsData.catForecast}
                    wfSteps={drillVendorsData.wfSteps}
                  />
                </div>
              )}

              {/* Vendor / contract table */}
              {drillVendorsData.vendors.length > 0 ? (<>
                <div style={{ fontFamily: OV.serif, fontWeight: 800, fontSize: 10,
                  letterSpacing: '0.22em', textTransform: 'lowercase',
                  color: OV.stone, marginBottom: 10 }}>
                  {sel === 'FPC' ? 'contract detail' : 'vendor detail'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 96px 96px 96px',
                  padding: '0 0 7px', borderBottom: `1px solid ${OV.border}`,
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: OV.stone, fontFamily: OV.sans, marginBottom: 2 }}>
                  <span>{sel === 'FPC' ? 'Project' : 'Vendor'}</span>
                  <span style={{ textAlign: 'right' }}>Budget</span>
                  <span style={{ textAlign: 'right' }}>Forecast</span>
                  <span style={{ textAlign: 'right' }}>Variance</span>
                </div>
                {drillVendorsData.vendors.map((v, vi) => {
                  const vFav     = v.variance < 0;
                  const vCol     = vFav ? OV.green : OV.red;
                  const isExpand = selVendorDrill === v.name;
                  const ctracts  = v.contracts
                    .map(c => ({ ...c, variance: c.forecast - c.budget }))
                    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
                  return (
                    <div key={v.name}>
                      <div
                        onClick={() => setSelVendorDrill(isExpand ? null : v.name)}
                        style={{ display: 'grid', gridTemplateColumns: '1fr 96px 96px 96px',
                          padding: '9px 0', borderBottom: '1px solid #F0EEEB',
                          cursor: 'pointer', transition: 'background 0.1s',
                          background: isExpand ? '#F5F4F1' : 'transparent',
                          marginLeft: -44, marginRight: -44, paddingLeft: 44, paddingRight: 44,
                        }}
                        onMouseEnter={e => { if (!isExpand) e.currentTarget.style.background = '#F8F7F5'; }}
                        onMouseLeave={e => { if (!isExpand) e.currentTarget.style.background = 'transparent'; }}>
                        <span style={{ fontSize: 13, color: isExpand ? OV.navy : '#3C3A36',
                          fontWeight: isExpand ? 600 : 400, display: 'flex', alignItems: 'center', gap: 5 }}>
                          {v.name}
                          <span style={{ fontSize: 9, color: OV.stone, opacity: 0.5 }}>{isExpand ? '\u25be' : '\u203a'}</span>
                        </span>
                        <span style={{ fontSize: 12, color: OV.stone, textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums', fontFamily: OV.sans }}>{fmt.m(v.budget)}</span>
                        <span style={{ fontSize: 12, color: OV.stone, textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums', fontFamily: OV.sans }}>{fmt.m(v.forecast)}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: vCol, textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums', fontFamily: OV.sans }}>
                          {vFav ? '\u2212' : '+'}{fmt.k(Math.abs(v.variance))}
                        </span>
                      </div>
                      {isExpand && ctracts.length > 0 && (
                        <div style={{ background: '#F5F4F1', padding: '12px 44px 14px',
                          borderBottom: `1px solid ${OV.border}`, marginLeft: -44, marginRight: -44 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
                            textTransform: 'uppercase', color: OV.stone,
                            fontFamily: OV.sans, marginBottom: 8 }}>Contract / Project Detail</div>
                          {ctracts.map((c, ci) => {
                            const cFav = c.variance < 0;
                            const cCol = cFav ? OV.green : OV.red;
                            return (
                              <div key={ci} style={{ marginBottom: 8, paddingBottom: 8,
                                borderBottom: ci < ctracts.length - 1 ? '1px solid #ECEAE7' : 'none' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 96px 96px 96px' }}>
                                  <span style={{ fontSize: 12, color: '#3C3A36', paddingRight: 10,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {c.name}
                                  </span>
                                  <span style={{ fontSize: 11, color: OV.stone, textAlign: 'right',
                                    fontVariantNumeric: 'tabular-nums', fontFamily: OV.sans }}>
                                    {fmt.m(c.budget)}
                                  </span>
                                  <span style={{ fontSize: 11, color: OV.stone, textAlign: 'right',
                                    fontVariantNumeric: 'tabular-nums', fontFamily: OV.sans }}>
                                    {fmt.m(c.forecast)}
                                  </span>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: cCol, textAlign: 'right',
                                    fontVariantNumeric: 'tabular-nums', fontFamily: OV.sans }}>
                                    {cFav ? '\u2212' : '+'}{fmt.k(Math.abs(c.variance))}
                                  </span>
                                </div>
                                {c.notes && (
                                  <div style={{ fontSize: 11, color: OV.stone, lineHeight: 1.5,
                                    marginTop: 3, fontStyle: 'italic' }}>{c.notes}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>) : (
                <div style={{ fontSize: 13, color: OV.stone, fontStyle: 'italic' }}>
                  No vendor detail available for {sel}.
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── KPI Drill Panels ─────────────────────────────────────────── */}
      {openPanel?.type === 'risk'     && <KPIDrillPanel mode="risk" rawData={dynRisk} onClose={() => setOpenPanel(null)} />}
      {openPanel?.type === 'opp'      && <KPIDrillPanel mode="opp"  rawData={dynOpp}  onClose={() => setOpenPanel(null)} />}
      {openPanel?.type === 'net'      && <NetDrillPanel             rawData={dynNet}  onClose={() => setOpenPanel(null)} />}
      {openPanel?.type === 'variance' && <VarianceExplorerPanel varData={buildVarData(items)} initialCat={openPanel.initialCat || null} onClose={() => setOpenPanel(null)} />}


    </div>
  );
}

// ── buildVarData ──────────────────────────────────────────────────────────────
// Builds the category → vendor → contract hierarchy expected by VarianceExplorerPanel
// from live lineItems (same workbook-scoped set used by all other components).
// Pass as varData={buildVarData(items)} when rendering VarianceExplorerPanel.
function buildVarData(lineItems) {
  const byCat = {};
  for (const li of lineItems) {
    const cat    = ovCat(li);
    const vendor = li.vendor || '(unspecified)';
    const appPfx = li.application && li.application !== 'N/A' && li.application.trim()
      ? li.application + ' \u2014 ' : '';
    const cName  = (appPfx + (li.project || '')).slice(0, 80) || vendor;
    if (!byCat[cat]) byCat[cat] = {};
    if (!byCat[cat][vendor]) byCat[cat][vendor] = { variance: 0, contracts: [] };
    byCat[cat][vendor].variance += (li.forecast || 0) - (li.budget || 0);
    byCat[cat][vendor].contracts.push({
      name:     cName,
      budget:   li.budget     || 0,
      forecast: li.forecast   || 0,
      actual:   li.actual     || 0,
      risk:     li.risk       || 0,
      opp:      li.opp        || 0,
      notes:    li.notes      || '',
      monthly:  li.monthlyFC  || new Array(12).fill(0),
    });
  }
  return OV_CATS
    .map(cat => {
      const vm = byCat[cat] || {};
      const vendors = Object.entries(vm)
        .map(([name, d]) => ({
          name,
          variance: Math.round(d.variance),
          contracts: d.contracts.sort((a, b) => Math.abs(b.forecast - b.budget) - Math.abs(a.forecast - a.budget)),
        }))
        .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
      return { cat, variance: vendors.reduce((s, v) => s + v.variance, 0), vendors };
    })
    .filter(c => c.vendors.length > 0);
}

Object.assign(window, { OverviewTab, buildVarData, OvFilterDrop });
