// tab-overview-v3.jsx — Executive Overview · Waterfall Experiment
// Replaces: Executive Bridge + Drivers of Forecast Variance
// With:     Single category-level waterfall  Budget → [categories] → Forecast
// All other sections (filters, KPIs, Risk/Opp/Net, drill panels) are preserved.

const { useState: useStateV3, useMemo: useMemoV3, useRef: useRefV3, useEffect: useEffectV3 } = React;

const V3T = {
  navy:   '#333C66',
  red:    '#B23A3A',
  green:  '#2F7A4D',
  stone:  '#807E7A',
  border: '#ECEAE7',
  bg:     '#FAFAF8',
  serif:  "'Source Serif 4', Georgia, serif",
  sans:   "'Inter', Arial, sans-serif",
};

const V3_CATS_ALL  = ['Labor/ T&M', 'Software', 'MS', 'Infrastructure', 'Hardware', 'OOE', 'Amortization', 'FPC'];
const WF_STEP_ORDER = ['Software', 'Labor/ T&M', 'MS', 'Hardware', 'Infrastructure', 'OOE', 'Amortization', 'FPC'];

function v3Cat(li) {
  if ((li.category || '').toLowerCase() === 'amortization') return 'Amortization';
  return li.subCategory || '(Other)';
}

// ── Eyebrow (V3-scoped) ──────────────────────────────────────────────────
function V3Eyebrow({ text, light }) {
  return (
    <div style={{
      fontFamily: V3T.serif, fontWeight: 800, fontSize: 10,
      letterSpacing: '0.22em', textTransform: 'lowercase',
      color: light ? 'rgba(255,255,255,0.52)' : V3T.stone, marginBottom: 10,
    }}>{text}</div>
  );
}

// ── FilterDrop (V3-scoped) ───────────────────────────────────────────────
function V3FilterDrop({ label, options, value, onChange }) {
  const [open, setOpen] = useStateV3(false);
  const ref = useRefV3(null);
  useEffectV3(() => {
    if (!open) return;
    const onDown = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);
  const active = value.length > 0;
  const toggle = v => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
        background: active ? V3T.navy : '#fff', border: `1px solid ${active ? V3T.navy : V3T.border}`,
        color: active ? '#fff' : V3T.stone, cursor: 'pointer',
        fontFamily: V3T.sans, fontSize: 12, fontWeight: active ? 600 : 500, transition: 'all 0.12s',
      }}>
        {active ? `${label} · ${value.length}` : label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d={open ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6'} />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
          background: '#fff', border: `1px solid ${V3T.border}`,
          boxShadow: '0 4px 20px rgba(51,60,102,0.14)', minWidth: 220, maxHeight: 300, overflowY: 'auto',
        }}>
          {options.map(opt => (
            <label key={opt} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
              cursor: 'pointer', background: value.includes(opt) ? '#F4F6FF' : 'transparent',
            }}>
              <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)}
                style={{ accentColor: V3T.navy, width: 13, height: 13, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontFamily: V3T.sans,
                color: value.includes(opt) ? V3T.navy : '#3C3A36',
                fontWeight: value.includes(opt) ? 600 : 400 }}>{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Drill hierarchy builder (V3-scoped) ──────────────────────────────────
function v3BuildDrillHierarchy(lineItems, getAmount) {
  const byCat = {};
  for (const li of lineItems) {
    const amt = getAmount(li);
    if (Math.abs(amt) < 0.005) continue;
    const cat    = v3Cat(li);
    const vendor = li.vendor || '(unspecified)';
    const appPfx = li.application && li.application !== 'N/A' && li.application.trim() ? li.application + ' — ' : '';
    const cName  = (appPfx + (li.project || '')).slice(0, 80) || vendor;
    if (!byCat[cat]) byCat[cat] = {};
    if (!byCat[cat][vendor]) byCat[cat][vendor] = { total: 0, contracts: [] };
    byCat[cat][vendor].total += amt;
    byCat[cat][vendor].contracts.push({ name: cName, amount: amt, notes: li.notes || '' });
  }
  const r2 = n => Math.round(n * 100) / 100;
  const categories = Object.entries(byCat).map(([cat, vendorMap]) => {
    const vendors = Object.entries(vendorMap).map(([name, data]) => {
      const vTotal = data.total;
      const mat    = data.contracts.filter(c => Math.abs(c.amount) >= 100).map(c => ({ ...c, amount: r2(c.amount) }));
      const resid  = vTotal - mat.reduce((s, c) => s + c.amount, 0);
      if (Math.abs(resid) >= 0.01) mat.push({ name: 'Other / minor', amount: r2(resid), notes: '' });
      return { name, amount: r2(vTotal), contracts: mat };
    }).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    return { cat, amount: r2(vendors.reduce((s, v) => s + v.amount, 0)), vendors };
  }).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  return { total: r2(categories.reduce((s, c) => s + c.amount, 0)), categories };
}

// ── Waterfall SVG ─────────────────────────────────────────────────────────
function V3Waterfall({ kpi, catAgg, sel, setSel }) {
  const [hov, setHov] = useStateV3(null);

  // Build steps: running total walks through each category in spec order
  let running = kpi.budget;
  const steps = WF_STEP_ORDER.map(cat => {
    const v    = Math.round((catAgg[cat]?.f || 0) - (catAgg[cat]?.b || 0));
    const from = running;
    const to   = running + v;
    running    = to;
    return { cat, v, from, to };
  });

  // Y-scale: encompass all running totals, budget, forecast
  const allVals = [kpi.budget, kpi.forecast, ...steps.map(s => s.from), ...steps.map(s => s.to)];
  const rawMin  = Math.min(...allVals);
  const rawMax  = Math.max(...allVals);
  const spread  = Math.max(rawMax - rawMin, kpi.budget * 0.005);
  // Floor well below budget so the bars have readable height; headroom above max for labels
  const floorV  = rawMin - spread * 1.3;
  const ceilV   = rawMax + spread * 0.65;
  const vRange  = ceilV - floorV;

  // SVG geometry
  const VW = 1160, VH = 420;
  const CT = 76, CB = 86;
  const CH = VH - CT - CB;
  const AXIS_Y = CT + CH;
  const CL = 28, CR = 1132;

  // Bar widths — 10 items (Budget + 8 cats + Forecast) with equal gaps
  const BW  = 98;   // Budget / Forecast bar
  const CW  = 76;   // Category step bar
  // CL + BW + 9*(GAP) + 8*CW + BW = CR  →  GAP = (CR-CL-2*BW-8*CW)/9
  const GAP = (CR - CL - 2 * BW - 8 * CW) / 9;
  const catX = i => CL + BW + GAP + i * (CW + GAP);
  const fcX  = CL + BW + GAP + 8 * (CW + GAP);

  const scY = v => CT + CH * (1 - (v - floorV) / vRange);

  // Identify largest unfavorable and largest favorable for badges
  const maxUnfav = Math.max(...steps.filter(s => s.v > 0).map(s => s.v),  0);
  const maxFav   = Math.max(...steps.filter(s => s.v < 0).map(s => -s.v), 0);

  const totalVar = kpi.forecast - kpi.budget;
  const fav      = totalVar <= 0;
  const FCC      = fav ? V3T.green : V3T.red;
  const varPct   = kpi.budget ? Math.abs(totalVar / kpi.budget * 100).toFixed(1) : '0.0';

  return (
    <svg width="100%" viewBox={`0 0 ${VW} ${VH}`} style={{ display: 'block', overflow: 'visible' }}>

      {/* Grid lines — subtle horizontal reference */}
      {[0.25, 0.5, 0.75].map(t => {
        const gy = CT + CH * t;
        return <line key={t} x1={CL} y1={gy} x2={CR} y2={gy}
          stroke="#ECEAE7" strokeWidth="1" strokeDasharray="2 4" />;
      })}

      {/* Axis baseline */}
      <line x1={CL - 6} y1={AXIS_Y} x2={CR + 6} y2={AXIS_Y} stroke="#D4D2CE" strokeWidth="1.5" />
      <text x={CL} y={AXIS_Y + 14} fill="#C6C4C0" fontFamily={V3T.sans} fontSize="9">
        baseline {fmt.m(floorV)}
      </text>

      {/* ── Budget bar ─────────────────────────────────────────────── */}
      {(() => {
        const bY = scY(kpi.budget);
        const bH = AXIS_Y - bY;
        const cx = CL + BW / 2;
        return (
          <g>
            <rect x={CL} y={bY} width={BW} height={bH} fill={V3T.navy} rx="1" />
            <text x={cx} y={bY - 28} textAnchor="middle"
              fill={V3T.stone} fontFamily={V3T.sans} fontWeight="700" fontSize="9" letterSpacing="0.12em">
              BUDGET
            </text>
            <text x={cx} y={bY - 12} textAnchor="middle"
              fill={V3T.navy} fontFamily={V3T.serif} fontWeight="700" fontSize="15"
              style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmt.m(kpi.budget)}
            </text>
            <text x={cx} y={AXIS_Y + 22} textAnchor="middle"
              fill={V3T.navy} fontFamily={V3T.sans} fontWeight="700" fontSize="12">
              Annual Budget
            </text>
            {/* Connector dashed line to first step */}
            <line x1={CL + BW} y1={bY} x2={catX(0)} y2={bY}
              stroke="#CFCCC7" strokeWidth="1" strokeDasharray="4 3" />
          </g>
        );
      })()}

      {/* ── Category step bars ─────────────────────────────────────── */}
      {steps.map((step, i) => {
        const isNeut    = Math.abs(step.v) < 5000;
        const isFav     = step.v < 0;
        const color     = isNeut ? '#C8C6C2' : isFav ? V3T.green : V3T.red;
        const isSel     = sel === step.cat;
        const isHov     = hov === step.cat;
        const isTopUnfav = step.v > 0 && step.v === maxUnfav;
        const isTopFav  = step.v < 0 && -step.v === maxFav;
        const cx        = catX(i) + CW / 2;

        // Floating bar: from running total "before" to "after"
        const hiVal = Math.max(step.from, step.to);
        const loVal = Math.min(step.from, step.to);
        const topY  = scY(hiVal);
        const botY  = scY(loVal);
        const stepH = Math.max(botY - topY, 2);

        const connY = scY(step.to);
        const nextX = i < 7 ? catX(i + 1) : fcX;
        const catLabel = step.cat === 'Labor/ T&M' ? 'Labor/T&M' : step.cat;
        const drillable = !isNeut;

        return (
          <g key={step.cat}
            onClick={() => drillable && setSel(isSel ? null : step.cat)}
            onMouseEnter={() => drillable && setHov(step.cat)}
            onMouseLeave={() => setHov(null)}
            style={{ cursor: drillable ? 'pointer' : 'default' }}>

            {/* Expanded hit area */}
            <rect x={catX(i) - 4} y={Math.min(topY - 40, AXIS_Y - stepH - 40)}
              width={CW + 8} height={AXIS_Y - Math.min(topY - 40, AXIS_Y - stepH - 40) + 4}
              fill="transparent" />

            {/* Highlight ring on hover/select */}
            {(isSel || isHov) && !isNeut && (
              <rect x={catX(i) - 2} y={topY - 2} width={CW + 4} height={stepH + 4} rx="2"
                fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />
            )}

            {/* Step bar */}
            <rect x={catX(i)} y={topY} width={CW} height={stepH} rx="1"
              fill={color}
              opacity={isNeut ? 0.35 : (isSel || isHov) ? 1 : 0.82}
              style={{ transition: 'opacity 0.12s' }} />

            {/* "LARGEST UNFAVORABLE" badge */}
            {isTopUnfav && (
              <g>
                <rect x={catX(i) + 4} y={topY - 23} width={CW - 8} height={15} rx="2"
                  fill={V3T.red} opacity="0.14" />
                <text x={cx} y={topY - 12} textAnchor="middle"
                  fill={V3T.red} fontFamily={V3T.sans} fontWeight="800" fontSize="8" letterSpacing="0.1em">
                  LARGEST DRIVER ▲
                </text>
              </g>
            )}

            {/* "LARGEST FAVORABLE" badge */}
            {isTopFav && (
              <g>
                <rect x={catX(i) + 4} y={topY - 23} width={CW - 8} height={15} rx="2"
                  fill={V3T.green} opacity="0.14" />
                <text x={cx} y={topY - 12} textAnchor="middle"
                  fill={V3T.green} fontFamily={V3T.sans} fontWeight="800" fontSize="8" letterSpacing="0.1em">
                  LARGEST OFFSET ▼
                </text>
              </g>
            )}

            {/* Value label above bar */}
            {!isNeut && (
              <text x={cx} y={topY - (isTopUnfav || isTopFav ? 28 : 10)} textAnchor="middle"
                fill={color} fontFamily={V3T.serif} fontWeight="700" fontSize="13"
                style={{ fontVariantNumeric: 'tabular-nums' }}>
                {isFav ? '−' : '+'}{fmt.k(Math.abs(step.v))}
              </text>
            )}

            {/* Category name */}
            <text x={cx} y={AXIS_Y + 21} textAnchor="middle"
              fill={isSel ? V3T.navy : (isHov ? '#3C3A36' : '#6C6A66')}
              fontFamily={V3T.sans} fontWeight={isSel ? 700 : 500} fontSize="11.5">
              {catLabel}
            </text>

            {/* Drill hint */}
            {drillable && (
              <text x={cx} y={AXIS_Y + 35} textAnchor="middle"
                fill={isSel ? V3T.navy : color}
                fontFamily={V3T.sans} fontSize="9"
                opacity={isSel || isHov ? 0.9 : 0.45}>
                {isSel ? '▲ close' : '▾ drill down'}
              </text>
            )}

            {/* Connector dashed line to next bar */}
            <line x1={catX(i) + CW} y1={connY} x2={nextX} y2={connY}
              stroke="#CFCCC7" strokeWidth="1" strokeDasharray="4 3" />
          </g>
        );
      })}

      {/* ── Forecast bar ───────────────────────────────────────────── */}
      {(() => {
        const fY = scY(kpi.forecast);
        const fH = AXIS_Y - fY;
        const cx = fcX + BW / 2;
        return (
          <g>
            <rect x={fcX} y={fY} width={BW} height={fH} fill={FCC} rx="1" />
            <text x={cx} y={fY - 30} textAnchor="middle"
              fill={FCC} fontFamily={V3T.sans} fontWeight="700" fontSize="9" letterSpacing="0.12em">
              {fav ? '▲ FAVORABLE' : '▼ UNFAVORABLE'}{'  '}{fav ? '−' : '+'}{varPct}%
            </text>
            <text x={cx} y={fY - 12} textAnchor="middle"
              fill={FCC} fontFamily={V3T.serif} fontWeight="700" fontSize="15"
              style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmt.m(kpi.forecast)}
            </text>
            <text x={cx} y={AXIS_Y + 21} textAnchor="middle"
              fill={FCC} fontFamily={V3T.sans} fontWeight="700" fontSize="12">
              Year-End Forecast
            </text>
          </g>
        );
      })()}

      {/* Reconciliation note */}
      <text x={VW / 2} y={VH - 4} textAnchor="middle" fill="#C6C4C0" fontFamily={V3T.sans} fontSize="9.5">
        {`Budget ${fmt.m(kpi.budget)} ${fav ? '−' : '+'} ${fmt.m(Math.abs(totalVar))} forecast variance = ${fmt.m(kpi.forecast)}`}
      </text>
    </svg>
  );
}

// ── Main OverviewTabV3 ────────────────────────────────────────────────────
function OverviewTabV3({ data }) {
  const [sel,       setSel]       = useStateV3(null);
  const [openPanel, setOpenPanel] = useStateV3(null);
  const [flt,       setFlt]       = useStateV3({ domains: [], owners: [], cats: [] });

  const allItems = data.lineItems || [];
  const lookups  = data.lookups   || {};

  const domainOpts = useMemoV3(() => {
    if (lookups.domains?.length) return lookups.domains.filter(Boolean).sort();
    return [...new Set(allItems.map(li => li.domain).filter(Boolean))].sort();
  }, [allItems, lookups]);

  const ownerOpts = useMemoV3(() => {
    if (lookups.owners?.length) return lookups.owners.filter(x => x && x !== 'N/A').sort();
    return [...new Set(allItems.map(li => li.owner).filter(x => x && x !== 'N/A'))].sort();
  }, [allItems, lookups]);

  const items = useMemoV3(() => {
    const { domains, owners, cats } = flt;
    if (!domains.length && !owners.length && !cats.length) return allItems;
    return allItems.filter(li => {
      if (domains.length && !domains.includes(li.domain)) return false;
      if (owners.length  && !owners.includes(li.owner))   return false;
      if (cats.length    && !cats.includes(v3Cat(li)))     return false;
      return true;
    });
  }, [allItems, flt]);

  const filterActive = flt.domains.length + flt.owners.length + flt.cats.length > 0;
  const clearFilters = () => setFlt({ domains: [], owners: [], cats: [] });

  // KPIs: use workbook subtotals when no filter active (exact reconciliation)
  const kpi = useMemoV3(() => {
    if (!filterActive && data.workbookSubtotal) {
      const ws = data.workbookSubtotal;
      return { budget: ws.budget, forecast: ws.forecast, actual: ws.actual,
               remaining: ws.remaining, risk: ws.risk, opp: ws.absOpp, net: ws.net };
    }
    let b = 0, f = 0, a = 0, r = 0, o = 0, n = 0;
    for (const li of items) {
      b += li.budget || 0; f += li.forecast || 0; a += li.actual || 0;
      r += li.risk   || 0; o += li.opp      || 0; n += li.net    || 0;
    }
    return { budget: b, forecast: f, actual: a, remaining: f - a, risk: r, opp: Math.abs(o), net: n };
  }, [items, filterActive, data.workbookSubtotal]);

  // Category aggregation for waterfall steps
  const catAgg = useMemoV3(() => {
    const agg = {};
    for (const li of items) {
      const c = v3Cat(li);
      if (!agg[c]) agg[c] = { b: 0, f: 0 };
      agg[c].b += li.budget   || 0;
      agg[c].f += li.forecast || 0;
    }
    return agg;
  }, [items]);

  // Drill rows for the selected waterfall step
  const drillRows = useMemoV3(() => {
    if (!sel) return [];
    const by = {};
    for (const li of items) {
      if (v3Cat(li) !== sel) continue;
      const key = sel === 'FPC' ? (li.project || li.vendor || 'Other') : (li.vendor || 'Other');
      if (!by[key]) by[key] = 0;
      by[key] += (li.forecast || 0) - (li.budget || 0);
    }
    const total = Object.values(by).reduce((s, v) => s + v, 0);
    const rows  = Object.entries(by)
      .map(([name, v]) => ({ name, v: Math.round(v) }))
      .filter(r => Math.abs(r.v) >= 500)
      .sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
      .slice(0, 10);
    const rest = Math.round(total - rows.reduce((s, r) => s + r.v, 0));
    if (Math.abs(rest) >= 1) rows.push({ name: 'Other', v: rest });
    return rows;
  }, [sel, items]);

  const drillCatV   = sel ? Math.round((catAgg[sel]?.f || 0) - (catAgg[sel]?.b || 0)) : 0;
  const drillMaxAbs = Math.max(...drillRows.map(r => Math.abs(r.v)), 1);

  // Risk / Opp / Net hierarchies (same pattern as classic view)
  const dynRisk = useMemoV3(() => v3BuildDrillHierarchy(items, li => li.risk || 0), [items]);
  const dynOpp  = useMemoV3(() => v3BuildDrillHierarchy(items, li => Math.abs(li.opp || 0)), [items]);
  const dynNet  = useMemoV3(() => v3BuildDrillHierarchy(items, li => li.net || 0), [items]);

  const CARD = { background: '#fff', border: `1px solid ${V3T.border}` };
  const MB20 = { marginBottom: 20 };

  return (
    <div>

      {/* ══ FILTER BAR ══════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: V3T.serif, fontWeight: 800, fontSize: 10,
          letterSpacing: '0.22em', textTransform: 'lowercase',
          color: V3T.stone, marginRight: 4 }}>filter</span>
        <V3FilterDrop label="Domain"       options={domainOpts}  value={flt.domains} onChange={v => setFlt({ ...flt, domains: v })} />
        <V3FilterDrop label="Domain Owner" options={ownerOpts}   value={flt.owners}  onChange={v => setFlt({ ...flt, owners: v })}  />
        <V3FilterDrop label="Category"     options={V3_CATS_ALL} value={flt.cats}    onChange={v => setFlt({ ...flt, cats: v })}    />
        {filterActive && (<>
          <button onClick={clearFilters} style={{
            padding: '6px 12px', background: 'none', border: `1px solid ${V3T.border}`,
            cursor: 'pointer', fontFamily: V3T.sans, fontSize: 12, color: V3T.stone,
          }}>✕ Clear all</button>
          <span style={{ fontSize: 11, color: V3T.stone, fontStyle: 'italic', fontFamily: V3T.sans }}>
            Filtered view · {items.length} of {allItems.length} rows
          </span>
        </>)}
      </div>

      {/* ══ ROW 1 — 4 PRIMARY KPIs ══════════════════════════════════════ */}
      <div style={{ ...CARD, ...MB20, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'annual budget',      val: fmt.m(kpi.budget),    sub: '2026 approved budget' },
          { label: 'year-end forecast',  val: fmt.m(kpi.forecast),  sub: 'actuals + remaining forecast' },
          { label: 'ytd actual spend',   val: fmt.m(kpi.actual),    sub: `${kpi.budget > 0 ? (kpi.actual / kpi.budget * 100).toFixed(1) : 0}% of budget consumed` },
          { label: 'remaining forecast', val: fmt.m(kpi.remaining), sub: 'balance to year-end' },
        ].map((k, i) => (
          <div key={i} style={{ padding: '32px 28px 28px', borderLeft: i > 0 ? `1px solid ${V3T.border}` : 'none' }}>
            <V3Eyebrow text={k.label} />
            <div style={{ fontFamily: V3T.serif, fontWeight: 600, fontSize: 40, lineHeight: 1,
              letterSpacing: '-0.01em', color: V3T.navy, fontVariantNumeric: 'tabular-nums' }}>{k.val}</div>
            <div style={{ fontSize: 12, color: V3T.stone, marginTop: 9 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ══ ROW 2 — NET OPP/RISK ════════════════════════════════════════ */}
      <div style={{ ...CARD, ...MB20, display: 'grid', gridTemplateColumns: '1fr 1fr',
        maxWidth: 860, margin: '0 auto 20px' }}>

        {/* Net position */}
        <button onClick={() => setOpenPanel({ type: 'net' })} style={{
          padding: '28px 28px 24px', background: V3T.navy, border: 'none',
          borderRight: `1px solid rgba(255,255,255,0.15)`,
          textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
          transition: 'filter 0.12s', width: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
          onMouseLeave={e => e.currentTarget.style.filter = 'none'}>
          <V3Eyebrow text="net opp/risk position" light />
          <div style={{ fontFamily: V3T.serif, fontWeight: 600, fontSize: 36, lineHeight: 1,
            letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums',
            color: kpi.net > 0 ? '#E87878' : '#72D4A0' }}>{fmt.m(Math.abs(kpi.net))}</div>
          <div style={{ fontSize: 12, fontWeight: 500, marginTop: 9,
            color: kpi.net > 0 ? '#E87878' : '#72D4A0' }}>
            {kpi.net > 0 ? '\u25bc\u2002net unfavorable' : '\u25b2\u2002net favorable'}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', gap: 4, letterSpacing: '0.04em' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            explore variance
          </div>
        </button>

        {/* Opp + Risk stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${V3T.border}` }}>
          <button onClick={() => setOpenPanel({ type: 'opp' })} style={{
            flex: 1, padding: '24px 28px 20px', borderTop: `3px solid ${V3T.green}`,
            borderRight: 'none', borderLeft: 'none', borderBottom: `1px solid ${V3T.border}`,
            background: 'transparent', textAlign: 'left', cursor: 'pointer',
            fontFamily: 'inherit', transition: 'background 0.12s', width: '100%',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#EAF4EE'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <V3Eyebrow text="opportunities" />
            <div style={{ fontFamily: V3T.serif, fontWeight: 600, fontSize: 32, lineHeight: 1,
              letterSpacing: '-0.01em', color: V3T.green, fontVariantNumeric: 'tabular-nums' }}>{fmt.m(kpi.opp)}</div>
            <div style={{ fontSize: 12, color: V3T.stone, marginTop: 8 }}>favorable upside</div>
            <div style={{ marginTop: 8, fontSize: 11, color: V3T.green, opacity: 0.65,
              display: 'flex', alignItems: 'center', gap: 4, letterSpacing: '0.04em' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              investigate
            </div>
          </button>
          <button onClick={() => setOpenPanel({ type: 'risk' })} style={{
            flex: 1, padding: '24px 28px 20px', borderTop: `3px solid ${V3T.red}`,
            borderRight: 'none', borderLeft: 'none', borderBottom: 'none',
            background: 'transparent', textAlign: 'left', cursor: 'pointer',
            fontFamily: 'inherit', transition: 'background 0.12s', width: '100%',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#FBEDED'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <V3Eyebrow text="risk" />
            <div style={{ fontFamily: V3T.serif, fontWeight: 600, fontSize: 32, lineHeight: 1,
              letterSpacing: '-0.01em', color: V3T.red, fontVariantNumeric: 'tabular-nums' }}>{fmt.m(kpi.risk)}</div>
            <div style={{ fontSize: 12, color: V3T.stone, marginTop: 8 }}>downside exposure</div>
            <div style={{ marginTop: 8, fontSize: 11, color: V3T.red, opacity: 0.65,
              display: 'flex', alignItems: 'center', gap: 4, letterSpacing: '0.04em' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              investigate
            </div>
          </button>
        </div>
      </div>

      {/* ══ ROW 3 — WATERFALL (replaces Executive Bridge + Drivers) ═════ */}
      <div style={{ ...CARD, ...MB20, padding: '28px 32px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <V3Eyebrow text="budget to forecast · category bridge" />
            <div style={{ fontFamily: V3T.serif, fontWeight: 600, fontSize: 20,
              color: V3T.navy, letterSpacing: '-0.005em' }}>
              Forecast Variance Waterfall
            </div>
            <div style={{ fontSize: 12, color: V3T.stone, marginTop: 5 }}>
              Each step shows how that category moved the forecast away from budget · click any bar to drill down
            </div>
          </div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', paddingTop: 6, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, background: V3T.green, borderRadius: 1 }} />
              <span style={{ fontSize: 11, color: V3T.stone }}>Favorable</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, background: V3T.red, borderRadius: 1 }} />
              <span style={{ fontSize: 11, color: V3T.stone }}>Unfavorable</span>
            </div>
          </div>
        </div>

        <V3Waterfall kpi={kpi} catAgg={catAgg} sel={sel} setSel={setSel} />
      </div>

      {/* ══ DRILL PANEL — vendor / contract detail for selected step ════ */}
      <div style={{ ...CARD, overflow: 'hidden', marginBottom: 20 }}>
        {!sel ? (
          <div style={{ padding: '22px 44px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ECEAE7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#999"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
            <div style={{ fontSize: 13, color: V3T.stone }}>
              Select a category bar above to view contributing vendors, contracts, and projects.
            </div>
          </div>
        ) : (
          <div style={{ padding: '28px 44px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: V3T.serif, fontWeight: 800, fontSize: 10,
                  letterSpacing: '0.22em', textTransform: 'lowercase',
                  color: V3T.stone, marginBottom: 8 }}>
                  {sel === 'FPC' ? 'fixed price contracts' : `${sel.toLowerCase()} · vendor detail`}
                </div>
                <div style={{ fontFamily: V3T.serif, fontWeight: 600, fontSize: 18, color: V3T.navy, marginBottom: 4 }}>
                  {sel} — Variance Detail
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                  fontFamily: V3T.sans, color: drillCatV < 0 ? V3T.green : V3T.red }}>
                  {drillCatV < 0 ? '\u2212' : '+'}{fmt.m(Math.abs(drillCatV))}
                  {'\u2002'}net {drillCatV < 0 ? 'favorable' : 'unfavorable'}
                </div>
              </div>
              <button onClick={() => setSel(null)} style={{
                padding: '5px 12px', background: 'none', border: `1px solid ${V3T.border}`,
                fontSize: 12, color: V3T.stone, cursor: 'pointer', fontFamily: V3T.sans,
              }}>✕ close</button>
            </div>

            {drillRows.length > 0
              ? drillRows.map((r, i) => {
                  const rFav = r.v < 0;
                  const rCol = rFav ? V3T.green : V3T.red;
                  const rPct = (Math.abs(r.v) / drillMaxAbs) * 72;
                  return (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '250px 1fr 100px',
                      alignItems: 'center', gap: 14, padding: '10px 0',
                      borderBottom: i < drillRows.length - 1 ? '1px solid #EBEBEB' : 'none',
                    }}>
                      <div style={{ fontSize: 13, color: '#3C3A36', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                      <div style={{ height: 8, background: '#ECEAE7', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${rPct}%`,
                          background: rCol, borderRadius: 2, transition: 'width 0.35s' }} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: rCol,
                        fontVariantNumeric: 'tabular-nums', fontFamily: V3T.sans, textAlign: 'right' }}>
                        {rFav ? '\u2212' : '+'}{fmt.k(Math.abs(r.v))}
                      </div>
                    </div>
                  );
                })
              : (
                <div style={{ fontSize: 13, color: V3T.stone, fontStyle: 'italic' }}>
                  No material variance contributors for {sel}.
                </div>
              )
            }
          </div>
        )}
      </div>

      {/* ── KPI Drill Panels ─────────────────────────────────────────── */}
      {openPanel?.type === 'risk' && <KPIDrillPanel mode="risk" rawData={dynRisk} onClose={() => setOpenPanel(null)} />}
      {openPanel?.type === 'opp'  && <KPIDrillPanel mode="opp"  rawData={dynOpp}  onClose={() => setOpenPanel(null)} />}
      {openPanel?.type === 'net'  && <NetDrillPanel             rawData={dynNet}  onClose={() => setOpenPanel(null)} />}

    </div>
  );
}

window.OverviewTabV3 = OverviewTabV3;
