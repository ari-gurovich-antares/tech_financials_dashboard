// tab-57.jsx — Dynamic N+M Financial Tracking — matches slide layout exactly
const { useState: useState57, useMemo: useMemo57 } = React;

// ── Dynamic N+M ─────────────────────────────────────────────────────────
const _today57 = new Date();
const LAST_ACT_57 = Math.max(0, Math.min(11, _today57.getMonth() - 2));
const ACT_MONTHS_57 = Array.from({ length: LAST_ACT_57 + 1 }, (_, i) => i);
const FC_MONTHS_57  = Array.from({ length: 12 - LAST_ACT_57 - 1 }, (_, i) => i + LAST_ACT_57 + 1);
const N_ACT_57 = LAST_ACT_57 + 1;
const N_FC_57  = 12 - N_ACT_57;
const NM_LABEL = `${N_ACT_57}+${N_FC_57}`;
const MONTH_NAMES_57 = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const AS_OF_57 = MONTH_NAMES_57[LAST_ACT_57];

// ── Category bucket mapping ─────────────────────────────────────────────
function bucketCat57(cat) {
  const c = (cat || '').toLowerCase().trim();
  if (c === 'software' || c.startsWith('software')) return 'software';
  if (c === 'infrastructure' || c === 'hardware' || c.startsWith('infra') || c.startsWith('hardware')) return 'infrastructure';
  if (c === 'labor/t&m' || c === 'labor/ t&m' || c === 'labor' || c === 'fpc' || c === 'ms' ||
      c === 'managed services' || c.startsWith('labor') || c.startsWith('fpc')) return 'labor';
  return 'other';
}

const BUCKET_ORDER = ['software', 'labor', 'infrastructure', 'other'];
const BUCKET_META = {
  software:       { label: 'Software',       color: '#333C66', light: '#6699FF' },
  infrastructure: { label: 'Infrastructure', color: '#6699FF', light: '#AAC0FF' },
  labor:          { label: 'Labor Spend',    color: '#E8873A', light: '#F5BB88' },
  other:          { label: 'Other OpEx',     color: '#9E9B97', light: '#C8C6C0' },
};

// ── Spend helpers ───────────────────────────────────────────────────────
function liFC57(li) {
  const ac = ACT_MONTHS_57.reduce((s, i) => s + ((li.monthlyAC || [])[i] || 0), 0);
  const fc = FC_MONTHS_57.reduce((s, i) => s + ((li.monthlyFC || [])[i] || 0), 0);
  return ac + fc;
}

function f$M(v) { return '$' + (Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : (v / 1e3).toFixed(0) + 'K'); }

// ── SVG Pie with external callout labels ────────────────────────────────
function PieWithLabels({ buckets, totalBudget, topVendors }) {
  const SZ = 280, CX = SZ / 2, CY = SZ / 2, R = 130;
  // Software top, Infrastructure right, Labor bottom-right, Other small at bottom (below Software)
  const PIE_ORDER = ['software', 'infrastructure', 'labor', 'other'];
  const slices = PIE_ORDER.map(k => ({ key: k, value: Math.max(0, buckets[k].budget), color: BUCKET_META[k].color }));
  const total = slices.reduce((s, sl) => s + sl.value, 0);

  let angle = Math.PI / 2;
  const arcs = slices.map(sl => {
    const frac = total > 0 ? sl.value / total : 0;
    const a0 = angle, a1 = angle + frac * 2 * Math.PI;
    angle = a1;
    const mid = (a0 + a1) / 2;
    const large = frac > 0.5 ? 1 : 0;
    const x1 = CX + R * Math.cos(a0), y1 = CY + R * Math.sin(a0);
    const x2 = CX + R * Math.cos(a1), y2 = CY + R * Math.sin(a1);
    const d = frac < 0.001 ? '' :
      `M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} Z`;
    const pct = Math.round(frac * 100);
    // Label position: 65% out from center along mid angle
    const LR = R * 0.62;
    const lx = CX + LR * Math.cos(mid), ly = CY + LR * Math.sin(mid);
    // External label for small slices: just outside the pie
    const ER = R + 18;
    const ex = CX + ER * Math.cos(mid), ey = CY + ER * Math.sin(mid);
    return { ...sl, d, pct, frac, mid, lx, ly, ex, ey, a0, a1 };
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg width={SZ + 60} height={SZ + 60} viewBox={`-30 -30 ${SZ + 60} ${SZ + 60}`}>
        {/* Slices */}
        {arcs.map((a, i) => a.d ? (
          <path key={i} d={a.d} fill={a.color} stroke="#fff" strokeWidth={1.5} />
        ) : null)}
        {/* Labels inside slice if big enough */}
        {arcs.map((a, i) => {
          if (!a.d) return null;
          const isSmall = a.frac < 0.08;
          if (isSmall) {
            // External label with leader line
            const lx2 = CX + (R + 8) * Math.cos(a.mid);
            const ly2 = CY + (R + 8) * Math.sin(a.mid);
            const anchor = Math.cos(a.mid) > 0 ? 'start' : 'end';
            const ex = CX + (R + 28) * Math.cos(a.mid);
            const ey = CY + (R + 28) * Math.sin(a.mid);
            return (
              <g key={i}>
                <line x1={lx2} y1={ly2} x2={ex} y2={ey} stroke="#9E9B97" strokeWidth={0.8} />
                <text x={ex + (anchor === 'start' ? 3 : -3)} y={ey} textAnchor={anchor} dominantBaseline="middle" fontSize={9} fontWeight="700" fill="#5A5855">{BUCKET_META[a.key].label}</text>
                <text x={ex + (anchor === 'start' ? 3 : -3)} y={ey + 11} textAnchor={anchor} dominantBaseline="middle" fontSize={9} fill={a.color} fontWeight="600">{f$M(a.value)} ({a.pct}%)</text>
              </g>
            );
          }
          return (
            <g key={i}>
              <text x={a.lx} y={a.ly - 8} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight="700" fill="#fff">{BUCKET_META[a.key].label}</text>
              <text x={a.lx} y={a.ly + 6} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#fff" fontWeight="600">{f$M(a.value)}</text>
              <text x={a.lx} y={a.ly + 18} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="rgba(255,255,255,0.85)">{a.pct}%</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}


// ── Grouped bar chart ───────────────────────────────────────────────────
function BudgetVsActualsChart({ buckets }) {
  const maxVal = Math.max(...BUCKET_ORDER.map(k => Math.max(buckets[k].budget, buckets[k].forecast)), 1);
  const BAR_H = 260;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: BAR_H + 48, padding: '0 4px', width: '100%' }}>
      {BUCKET_ORDER.map(k => {
        const bh = Math.max(2, Math.round((buckets[k].budget   / maxVal) * BAR_H));
        const fh = Math.max(2, Math.round((buckets[k].forecast / maxVal) * BAR_H));
        return (
          <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: '#333C66', marginBottom: 2, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{f$M(buckets[k].budget)}</span>
                <div style={{ width: '100%', minWidth: 24, height: bh, background: '#333C66', borderRadius: '2px 2px 0 0' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: '#C06A20', marginBottom: 2, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{f$M(buckets[k].forecast)}</span>
                <div style={{ width: '100%', minWidth: 24, height: fh, background: '#E8C547', borderRadius: '2px 2px 0 0' }} />
              </div>
            </div>
            <div style={{ height: 1, background: '#D4D2CE', width: '100%', margin: '3px 0' }} />
            <div style={{ fontSize: 9, color: '#5A5855', textAlign: 'center', lineHeight: 1.3, fontWeight: 600 }}>
              {BUCKET_META[k].label.replace(' Spend', '')}
            </div>
          </div>
        );
      })}
    </div>
  );
}


// ── Notes sidebar ───────────────────────────────────────────────────────
function NotesSidebar() {
  // Hardcoded to match slide
  const notes = {
    software: [
      { vendor: 'Finastra', note: 'Maintenance and tax-related cost increase.' },
      { vendor: 'Microsoft', note: 'Licensing true-up for D365 F&O/CRM.' },
      { vendor: 'PactFi', note: 'Commercial expansion beyond PoC scope.' },
    ],
    labor: [
      { vendor: 'Managed Services', note: 'Incremental L1/L2 CoE resource requirements.' },
      { vendor: 'QA Services', note: 'Increased capacity through contract expansion.' },
      { vendor: 'IVP Development', note: 'Additional T&M to support delivery.' },
    ],
  };

  return (
    <div style={{ background: '#E8EDF8', border: '1px solid #C4CCE8', borderRadius: 4, padding: '12px 10px', fontSize: 11, minWidth: 150, maxWidth: 160 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, color: '#1A1F3C', marginBottom: 6, fontSize: 12 }}>YoY Software Changes</div>
        {notes.software.map((n, i) => (
          <div key={i} style={{ marginBottom: 5, display: 'flex', gap: 5 }}>
            <span style={{ color: '#333C66', flexShrink: 0, marginTop: 1 }}>•</span>
            <div><span style={{ fontWeight: 700 }}>{n.vendor} : </span><span style={{ color: '#3C3A36' }}>{n.note}</span></div>
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontWeight: 700, color: '#1A1F3C', marginBottom: 6, fontSize: 12 }}>Labor Insights</div>
        {notes.labor.map((n, i) => (
          <div key={i} style={{ marginBottom: 5, display: 'flex', gap: 5 }}>
            <span style={{ color: '#333C66', flexShrink: 0, marginTop: 1 }}>•</span>
            <div><span style={{ fontWeight: 700 }}>{n.vendor}: </span><span style={{ color: '#3C3A36' }}>{n.note}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── Vendor table ────────────────────────────────────────────────────────
function VTable57({ title, headerBg, vendors, maxRows, rowPadding }) {
  const data = vendors.slice(0, maxRows);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #D4D2CE', borderRadius: 3, overflow: 'hidden', minWidth: 0, height: '100%' }}>
      <div style={{ background: headerBg, color: '#fff', fontSize: 10, fontWeight: 700, textAlign: 'center', padding: '5px 8px', lineHeight: 1.3, flexShrink: 0 }}>{title}</div>
      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '22px 1fr auto', background: '#EAECF4', flexShrink: 0 }}>
        <div style={{ padding: '4px 4px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#333C66' }}>#</div>
        <div style={{ padding: '4px 6px', fontSize: 10, fontWeight: 700, color: '#333C66' }}>Vendor</div>
        <div style={{ padding: '4px 6px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: '#333C66', whiteSpace: 'nowrap' }}>{NM_LABEL} Spend<br/>(In MMs)</div>
      </div>
      {/* Data rows — flex: 1 per row so they share available height */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {data.map((v, i) => (
          <div key={v.vendor + i} style={{ display: 'grid', gridTemplateColumns: '22px 1fr auto', flex: 1, alignItems: 'center', borderBottom: '1px solid #EDECEA', background: i % 2 === 0 ? '#fff' : '#FAFAF8' }}>
            <div style={{ padding: '3px 4px', textAlign: 'center', fontSize: 11, color: '#807E7A', fontWeight: 600 }}>{i + 1}</div>
            <div style={{ padding: '3px 6px', fontSize: 11, color: '#1A1F3C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.vendor}>{v.vendor}</div>
            <div style={{ padding: '3px 8px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#333C66', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{f$M(v.spend)}</div>
          </div>
        ))}
        {data.length === 0 && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#9E9B97' }}>No data</div>}
      </div>
    </div>
  );
}


// ── RTB/CTB stacked bar with arrows ────────────────────────────────────
function RtbCtbViz({ rtbTotal, ctbTotal }) {
  const total = rtbTotal + ctbTotal;
  const BAR_H = 260, BAR_W = 52;
  const rtbH = total > 0 ? Math.round((rtbTotal / total) * BAR_H) : 0;
  const ctbH = BAR_H - rtbH;

  const ArrowRow = ({ color, label, height }) => (
    <div style={{ height, display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 8 }}>
      <div style={{ width: 60, height: 28, background: color, flexShrink: 0, clipPath: 'polygon(0 0, 82% 0, 100% 50%, 82% 100%, 0 100%)' }} />
      <span style={{ fontSize: 12, fontWeight: 700, color, textDecoration: 'underline', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}>
      <div style={{ width: BAR_W, height: BAR_H, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ width: '100%', height: rtbH, background: '#333C66', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {rtbH > 20 && <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{f$M(rtbTotal)}</span>}
        </div>
        <div style={{ width: '100%', height: ctbH, background: '#E8C547', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {ctbH > 20 && <span style={{ fontSize: 9, fontWeight: 700, color: '#7A5A00', fontVariantNumeric: 'tabular-nums' }}>{f$M(ctbTotal)}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', height: BAR_H }}>
        <ArrowRow color="#4A6FA5" label="RTB" height={rtbH} />
        <ArrowRow color="#C0931A" label="CTB" height={ctbH} />
      </div>
    </div>
  );
}


// ── Project table ───────────────────────────────────────────────────────
function ProjTable57({ title, headerBg, color, projects, totalLabel, total, maxRows }) {
  return (
    <div style={{ border: '1px solid #D4D2CE', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ background: headerBg, color: '#fff', fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '5px 10px' }}>{title}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ background: '#EAECF4' }}>
            <th style={{ padding: '4px 8px', textAlign: 'left', color: '#333C66', fontWeight: 700 }}>Project</th>
            <th style={{ padding: '4px 8px', textAlign: 'right', color: '#333C66', fontWeight: 700, whiteSpace: 'nowrap', width: 90 }}>{totalLabel}<br/>(In MMs)</th>
          </tr>
        </thead>
        <tbody>
          {projects.slice(0, maxRows).map((p, i) => (
            <tr key={p.project + i} style={{ borderBottom: '1px solid #EDECEA', background: i % 2 === 0 ? '#fff' : '#FAFAF8' }}>
              <td style={{ padding: '3px 8px', color: '#1A1F3C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, maxWidth: 180 }} title={p.project}>{p.project || '—'}</td>
              <td style={{ padding: '3px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color, fontSize: 11, whiteSpace: 'nowrap' }}>{f$M(p.spend)}</td>
            </tr>
          ))}
          {projects.length === 0 && (
            <tr><td colSpan={2} style={{ padding: '8px', textAlign: 'center', color: '#9E9B97' }}>No data</td></tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ background: '#EAECF4' }}>
            <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, color, fontSize: 11 }}>{totalLabel} Total</td>
            <td style={{ padding: '4px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color, fontSize: 11, whiteSpace: 'nowrap' }}>{f$M(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────
function Tab57({ data }) {
  const lineItems = useMemo57(() => data.lineItems || [], [data]);

  const buckets = useMemo57(() => {
    const out = { software: { budget: 0, forecast: 0, items: [] }, infrastructure: { budget: 0, forecast: 0, items: [] }, labor: { budget: 0, forecast: 0, items: [] }, other: { budget: 0, forecast: 0, items: [] } };
    for (const li of lineItems) {
      const b = bucketCat57(li.subCategory || li.category);
      out[b].budget   += li.budget || 0;
      out[b].forecast += liFC57(li);
      out[b].items.push(li);
    }
    return out;
  }, [lineItems]);

  const totalBudget = BUCKET_ORDER.reduce((s, k) => s + buckets[k].budget, 0);

  const topVendors = useMemo57(() => {
    const out = {};
    for (const [key, bkt] of Object.entries(buckets)) {
      const vm = {};
      for (const li of bkt.items) {
        const v = li.vendor || 'Unknown';
        vm[v] = (vm[v] || 0) + liFC57(li);
      }
      out[key] = Object.entries(vm)
        .map(([vendor, spend]) => ({ vendor, spend }))
        .filter(x => x.spend > 0 && !/^PH[-\s]/i.test(x.vendor))
        .sort((a, b) => b.spend - a.spend);
    }
    return out;
  }, [buckets]);

  const rtbCtb = useMemo57(() => {
    // RTB: Support-* and T&M projects; CTB: Implement-* and other named initiatives
    const rtb = { total: 0, projects: {} };
    const ctb = { total: 0, projects: {} };
    for (const li of lineItems) {
      const t   = (li.treatment || '').toLowerCase().trim();
      const os  = (li.onestreamCategory || '').toLowerCase().trim();
      const fc  = liFC57(li);
      const proj = li.project || li.application || 'Other';
      // Split: Support-* and T&M = RTB; Implement-* = CTB
      const projL = (li.project || '').trim().toLowerCase();
      const isCtb = projL.startsWith('implement') || 
                    (projL !== '' && !projL.startsWith('support') && projL !== 't&m' && !projL.startsWith('t&m'));
      const dest = isCtb ? ctb : rtb;
      dest.total += fc;
      if (proj) dest.projects[proj] = (dest.projects[proj] || 0) + fc;
    }
    const sort = p => Object.entries(p).map(([project, spend]) => ({ project, spend })).filter(x => x.spend > 0 && !x.project.startsWith('PH -') && !x.project.startsWith('PH-')).sort((a, b) => b.spend - a.spend);
    // Aggregate RTB: consolidate Support-* and T&M into one line
    const rtbAgg = {};
    for (const [proj, spend] of Object.entries(rtb.projects)) {
      const p = proj.toLowerCase();
      const key = (p.startsWith('support') || p === 't&m' || p.startsWith('t&m'))
        ? 'Production Support & Minor Enhancements'
        : proj;
      rtbAgg[key] = (rtbAgg[key] || 0) + spend;
    }
    // Clean CTB: strip "Implement - " prefix
    const ctbClean = {};
    for (const [proj, spend] of Object.entries(ctb.projects)) {
      const key = proj.replace(/^Implement\s*-\s*/i, '');
      ctbClean[key] = (ctbClean[key] || 0) + spend;
    }
    const sortAgg = p => Object.entries(p).map(([project, spend]) => ({ project, spend })).filter(x => x.spend > 0 && !x.project.startsWith('PH -')).sort((a, b) => b.spend - a.spend);
    return { rtb: { total: rtb.total, projects: sortAgg(rtbAgg) }, ctb: { total: ctb.total, projects: sortAgg(ctbClean) } };
  }, [lineItems]);

  const _rtbCtbTotal = rtbCtb.rtb.total + rtbCtb.ctb.total;
  const _rtbBarH = _rtbCtbTotal > 0 ? Math.max(20, Math.round((rtbCtb.rtb.total / _rtbCtbTotal) * 260)) : 200;
  const _ctbBarH = Math.max(20, 260 - _rtbBarH);

return (
    <div style={{ fontFamily: 'var(--font-sans)', padding: '24px 32px 40px', maxWidth: 1440, margin: '0 auto' }}>

      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 700, color: '#1A1F3C', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
          FY2026 — ({NM_LABEL}) Financial Tracking
        </h1>
        <div style={{ fontSize: 12, color: '#6699FF', fontStyle: 'italic', fontWeight: 500 }}>
          2026 Technology Budget: {f$M(totalBudget)} Plan &middot; As of {AS_OF_57} {_today57.getFullYear()} &middot; {N_ACT_57} months actuals + {N_FC_57} months forecast
        </div>
      </div>

      {/* Row 1: Pie | Bar + Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Pie */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#333C66', textAlign: 'center', marginBottom: 14, textDecoration: 'underline' }}>
            2026 Budget by Category
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', overflow: 'visible' }}>
            <PieWithLabels buckets={buckets} totalBudget={totalBudget} topVendors={topVendors} />
          </div>
        </div>

        {/* Bar chart + notes box */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="card" style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#333C66', textAlign: 'center', marginBottom: 14, textDecoration: 'underline' }}>
              2026 ({NM_LABEL}) Budget vs. Actuals by Category
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <BudgetVsActualsChart buckets={buckets} />
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid #EDECEA' }}>
              {[['#333C66', '2026 Final Budget'], ['#E8C547', 'Actuals + Forecast']].map(([color, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#807E7A' }}>
                  <div style={{ width: 14, height: 10, background: color, borderRadius: 1 }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <NotesSidebar />
        </div>
      </div>

      {/* Row 2: 3 vendor tables | RTB/CTB */}
      <div style={{ display: 'grid', gridTemplateColumns: '55fr 45fr', gap: 16 }}>

        {/* Vendor tables — 3 side by side */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#333C66', textAlign: 'center', marginBottom: 12, textDecoration: 'underline' }}>
            2026 ({NM_LABEL}) Total Spend by Category
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', width: '100%', margin: 'auto 0' }}>
            <VTable57 title="Top 10 – Software Vendors" headerBg="#333C66" vendors={topVendors.software || []} maxRows={10} rowPadding="6.5px" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              <VTable57 title="Top 5 – Infrastructure" headerBg="#4A5A8A" vendors={topVendors.infrastructure || []} maxRows={5} rowPadding="6.5px" />
              <VTable57 title="Top 5 – Labor / T&M / FPC / MS" headerBg="#C06A20" vendors={topVendors.labor || []} maxRows={5} rowPadding="6.5px" />
            </div>
          </div>
        </div>

        {/* RTB / CTB */}
        <div className="card" style={{ padding: '16px 20px', overflow: 'visible' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#333C66', textAlign: 'center', marginBottom: 12, textDecoration: 'underline' }}>
            Mission Critical Programs Spend Tracking ({NM_LABEL})
          </div>
          {/* Badge above bar column */}
          <div style={{ marginBottom: 10 }}>
            <span style={{ border: '2px solid #333C66', borderRadius: 4, padding: '2px 10px', fontSize: 12, fontWeight: 700, color: '#1A1F3C', fontVariantNumeric: 'tabular-nums', display: 'inline-block' }}>{f$M(totalBudget)}</span>
          </div>
          {/* Grid: bar column | tables column, each row auto-sizes to table height */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', gridTemplateRows: 'auto auto', gap: '12px 8px' }}>
            {/* Stacked bar spanning both rows */}
            <div style={{ gridColumn: 1, gridRow: '1 / 3', display: 'flex', flexDirection: 'column', alignSelf: 'stretch', width: 44 }}>
              <div style={{ flex: rtbCtb.rtb.total, background: '#333C66', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px 2px 0 0', minHeight: 30 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{f$M(rtbCtb.rtb.total)}</span>
              </div>
              <div style={{ flex: rtbCtb.ctb.total, background: '#E8C547', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0 0 2px 2px', minHeight: 20 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#7A5A00', fontVariantNumeric: 'tabular-nums' }}>{f$M(rtbCtb.ctb.total)}</span>
              </div>
            </div>
            {/* RTB arrow — aligned to RTB table row */}
            <div style={{ gridColumn: 2, gridRow: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 44, height: 24, background: '#4A6FA5', clipPath: 'polygon(0 0, 82% 0, 100% 50%, 82% 100%, 0 100%)', flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#4A6FA5', textDecoration: 'underline' }}>RTB</span>
            </div>
            {/* RTB table */}
            <ProjTable57 title="RTB Projects" headerBg="#333C66" color="#333C66" projects={rtbCtb.rtb.projects} totalLabel="RTB Spend" total={rtbCtb.rtb.total} maxRows={4} />
            {/* CTB arrow — aligned to CTB table row */}
            <div style={{ gridColumn: 2, gridRow: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 44, height: 24, background: '#C0931A', clipPath: 'polygon(0 0, 82% 0, 100% 50%, 82% 100%, 0 100%)', flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#C0931A', textDecoration: 'underline' }}>CTB</span>
            </div>
            {/* CTB table */}
            <ProjTable57 title="CTB Projects" headerBg="#C06A20" color="#C06A20" projects={rtbCtb.ctb.projects} totalLabel="CTB Spend" total={rtbCtb.ctb.total} maxRows={8} />
          </div>
        </div>
      </div>
    </div>
  );
}
