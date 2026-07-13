// Vendors tab — lean table + rich drilldown
const { useState: useStateV, useMemo: useMemoV, useRef: useRefV, useEffect: useEffectV } = React;

const VD_CATS = ['Labor/ T&M', 'Software', 'MS', 'Infrastructure', 'Hardware', 'OOE', 'FPC'];
function vdCat(li) {
  return li.subCategory || li.category || '(Other)';
}

const NON_VENDOR_PATTERNS = [
  /^amortization/i, /^multiple$/i, /^amortization\/multiple$/i,
  /^n\/a$/i, /^other$/i, /^2026 ph$/i, /^ph\s*-\s*other$/i, /^ph\s*-\s*tbc$/i,
  /^software capitalization/i,
  /^t&e\s*-/i, /^general office expense/i,
  /^\s*$/,
];
function isRealVendor(name) {
  if (!name) return false;
  return !NON_VENDOR_PATTERNS.some(r => r.test(name.trim()));
}

function vendorStatus(v) {
  if (v.net > 100)                             return { key:'risk', label:'Risk',         color:'#C03A3A', bg:'#FDF0F0', light:'#FEF6F6' };
  if (v.net < -100)                            return { key:'opp',  label:'Opportunity',  color:'#1F7A4D', bg:'#EFF7F3', light:'#F4FAF7' };
  if (v.forecast > v.budget && v.budget > 0)  return { key:'over', label:'Over Budget',  color:'#96600A', bg:'#FDF5E6', light:'#FFFAF0' };
  return                                              { key:'ok',   label:'On Track',     color:'#3A5A8A', bg:'#EEF3FA', light:'#F5F8FD' };
}

// Synthesize monthly FC for display when monthly columns are blank
function synthMonthlyFC(monthlyAC, monthlyFC, totalForecast) {
  const fcSum = (monthlyFC || []).reduce((s, x) => s + x, 0);
  if (fcSum > 0) return monthlyFC; // real data — use it
  const acSum = (monthlyAC || []).reduce((s, x) => s + x, 0);
  const actCnt = (monthlyAC || []).filter(x => x > 0).length;
  const remaining = (totalForecast || 0) - acSum;
  if (remaining <= 0 || actCnt >= 12) return monthlyFC;
  const remMonths = 12 - actCnt;
  const perMonth = remaining / remMonths;
  return (monthlyFC || []).map((_, i) => i >= actCnt ? perMonth : 0);
}

function vendorDomCat(v) {
  const tally = {};
  (v.lineItems || []).forEach(li => {
    const c = li.subCategory || li.category || 'Other';
    const fc = (li.monthlyFC || []).reduce((s, x) => s + x, 0);
    tally[c] = (tally[c] || 0) + fc;
  });
  const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : '—';
}

// ── KPI Cards ────────────────────────────────────────────────────────────
function VendorKPIs({ vendors, kpi }) {
  const [hovered, setHovered] = useStateV(-1);
  // Use workbook-level KPIs (same source as overview) when available
  const totalBudget   = kpi ? kpi.budget   : vendors.reduce((s, v) => s + (v.budget || 0), 0);
  const totalForecast = kpi ? kpi.forecast : vendors.reduce((s, v) => s + (v.forecast || 0), 0);
  const totalNet      = kpi ? kpi.net      : vendors.reduce((s, v) => s + (v.net || 0), 0);
  const netIsRisk     = totalNet > 100;
  const netIsOpp      = totalNet < -100;
  const netColor      = netIsRisk ? '#C03A3A' : netIsOpp ? '#1F7A4D' : '#9E9B97';

  const cards = [
    {
      label: 'annual budget',
      value: fmt.m2(totalBudget),
      sub: '2026 approved budget',
      valueColor: '#333C66',
    },
    {
      label: 'year-end forecast',
      value: fmt.m2(totalForecast),
      sub: 'Full-year projected spend · actual spend + remaining forecast',
      valueColor: '#333C66',
    },
    {
      label: 'net risk / (opportunity)',
      value: Math.abs(totalNet) > 100 ? fmt.signed2(totalNet) : '—',
      sub: 'Sum of all vendor risk and opportunity positions. Positive = net risk.\nNegative = net opportunity.',
      valueColor: netColor,
      tooltip: 'Sum of risk and opportunity positions.\nPositive = net risk. Negative = net opportunity.',
    },
  ];

  const eyebrow = label => (
    <div style={{
      fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 10,
      letterSpacing: '0.22em', textTransform: 'lowercase',
      color: '#9E9B97', marginBottom: 10,
    }}>{label}</div>
  );

  return (
    <>
      <style>{`
        .vkpi-flip { position: relative; cursor: default; }
        .vkpi-front { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; transition: opacity 0.25s; }
        .vkpi-back  { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; background: #333C66; opacity: 0; transition: opacity 0.25s; }
        .vkpi-flip:hover .vkpi-back  { opacity: 1; }
        .vkpi-flip:hover .vkpi-front { opacity: 0; }
      `}</style>
      <div className="card" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', overflow:'hidden', padding:0, maxWidth:1050, margin:'0 auto 20px' }}>
        {cards.map((c, i) => (
          <div key={i} className="vkpi-flip" title={c.tooltip || undefined} style={{ borderLeft: i > 0 ? '1px solid #EDECEA' : 'none', height: 128 }}>
            <div className="vkpi-front">
              {eyebrow(c.label)}
              <div style={{ fontFamily:'var(--font-serif)', fontWeight:600, fontSize:40, lineHeight:1, letterSpacing:'-0.01em', color:c.valueColor, fontVariantNumeric:'tabular-nums' }}>
                {c.value}
              </div>

            </div>
            <div className="vkpi-back">
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.2em', textTransform:'lowercase', color:'rgba(255,255,255,0.45)', marginBottom:10, fontFamily:'var(--font-serif)' }}>{c.label}</div>
              <div style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.9)', lineHeight:1.4, fontFamily:'var(--font-sans)', whiteSpace:'pre-line' }}>{c.sub}</div>
              <div style={{ marginTop:12, fontFamily:'var(--font-serif)', fontWeight:600, fontSize:22, color:'rgba(255,255,255,0.28)', fontVariantNumeric:'tabular-nums', letterSpacing:'-0.01em' }}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SortArrow({ col, sort }) {
  if (sort.col !== col) return <span style={{ color:'#D0CEC8', marginLeft:3, fontSize:9 }}>↕</span>;
  return <span style={{ color:'#6699FF', marginLeft:3, fontSize:9 }}>{sort.dir === 'desc' ? '↓' : '↑'}</span>;
}

// ── Mini budget bar ───────────────────────────────────────────────────────
function BudgetBar({ actual, forecast, budget }) {
  if (!budget || budget <= 0) return <span style={{ color:'#D8D6D2', fontSize:12 }}>—</span>;
  const pct = Math.min(forecast / budget * 100, 130);
  const over = forecast > budget;
  const color = over ? '#C03A3A' : pct > 85 ? '#96600A' : '#6699FF';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:3, minWidth:80 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
        <span style={{ fontSize:11, fontWeight:600, color, fontVariantNumeric:'tabular-nums' }}>{(forecast/budget*100).toFixed(0)}%</span>
      </div>
      <div style={{ height:4, background:'#EDECEA', borderRadius:2, overflow:'hidden', position:'relative' }}>
        <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${Math.min(pct,100)}%`, background:color, borderRadius:2 }} />
      </div>
    </div>
  );
}

// ── Rich Vendor Detail ────────────────────────────────────────────────────
function VendorDetail({ vendor: v, onClose }) {
  const st     = vendorStatus(v);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const acArr  = v.monthlyAC || [];
  // Stop at first gap so future months with stray data don't count as actuals
  let actCnt = 0;
  for (let i = 0; i < 12; i++) {
    if ((acArr[i] || 0) > 1) actCnt = i + 1;
    else break;
  }
  const maxM   = Math.max(...[...(v.monthlyAC||[]),...(v.monthlyFC||[])].map(Math.abs), 1);

  const [expandedCat, setExpandedCat] = useStateV(null);
  const [detailSort, setDetailSort] = useStateV({ col:'actual', dir:'desc' });
  const lineItems = v.lineItems || [];

  function detailSortValue(li, col) {
    const ac = (li.monthlyAC||[]).reduce((s,x)=>s+x,0);
    const fc = (li.monthlyFC||[]).reduce((s,x)=>s+x,0);
    const actfc = ac + fc;
    const cons = li.budget > 0 ? actfc / li.budget * 100 : 0;
    if (col === 'vendor') return (li.vendor || '').toLowerCase();
    if (col === 'category') return (li.spendCategory || li.subCategory || li.category || '').toLowerCase();
    if (col === 'budget') return li.budget || 0;
    if (col === 'actual') return ac;
    if (col === 'forecast') return fc;
    if (col === 'actfc') return actfc;
    if (col === 'cons') return cons;
    if (col === 'risk') return li.risk || 0;
    if (col === 'opp') return Math.abs(li.opp || 0);
    if (col === 'net') return li.net || 0;
    return 0;
  }

  function toggleDetailSort(col) {
    setDetailSort(s => s.col === col ? { col, dir: s.dir==='desc'?'asc':'desc' } : { col, dir:'desc' });
  }

  const detailTh = (col, label, align='right', extra={}) => (
    <th
      onClick={() => toggleDetailSort(col)}
      style={{ padding:'7px 12px', textAlign:align, fontWeight:600, color:'#6699FF', fontSize:10, letterSpacing:'0.05em', textTransform:'uppercase', whiteSpace:'nowrap', cursor:'pointer', ...extra }}
    >
      {label}{detailSort.col===col ? (detailSort.dir==='desc'?' ↓':' ↑') : ''}
    </th>
  );




  // ── Category groups for two-level drill-down ─────────────────────────
  const catGroups = useMemoV(() => {
    // Build rollup per category from lineItems
    const rollup = new Map();
    for (const li of lineItems) {
      const cat = li.spendCategory || li.subCategory || li.category || '(Uncategorized)';
      if (!rollup.has(cat)) rollup.set(cat, { budget:0, actual:0, forecast:0, risk:0, opp:0, net:0, items:[] });
      const g = rollup.get(cat);
      const ac = (li.monthlyAC||[]).reduce((s,x)=>s+x,0);
      const fc = (li.monthlyFC||[]).reduce((s,x)=>s+x,0);
      g.items.push(li); g.budget += li.budget||0; g.actual += ac; g.forecast += fc;
      g.risk += li.risk||0; g.opp += li.opp||0; g.net += li.net||0;
    }
    // If Notes sheet provided ordered category rows, use that order + notes
    if (v.categoryNotes && v.categoryNotes.length) {
      const groups = v.categoryNotes.map(({ category, note }) => {
        // Try exact match first, then case-insensitive
        const r = rollup.get(category)
          || rollup.get([...rollup.keys()].find(k => k.toLowerCase() === category.toLowerCase()) || '')
          || { budget:0, actual:0, forecast:0, risk:0, opp:0, net:0, items:[] };
        return { category, note, ...r };
      });
      // Append any lineItem categories not in Notes sheet
      for (const [cat, r] of rollup) {
        if (!groups.find(g => g.category === cat)) groups.push({ category: cat, note:'', ...r });
      }
      return groups;
    }
    return [...rollup.entries()]
      .map(([cat, r]) => ({ category: cat, note: r.items.find(li => li.notesRO)?.notesRO || '', ...r }))
      .sort((a, b) => (b.budget||0) - (a.budget||0));
  }, [lineItems, v.categoryNotes]);



  const netIsRisk = v.net > 100;
  const netIsOpp  = v.net < -100;
  const [netCardHover, setNetCardHover] = useStateV(false);

  return (
    <div style={{ borderTop:'2px solid #6699FF30', background:'#FAFAF8' }}>

      {/* ── Header ── */}
      <div style={{ background:st.bg, padding:'16px 24px', borderBottom:`1px solid ${st.color}20`, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#fff', background:st.color, padding:'2px 8px', borderRadius:3 }}>{st.label}</span>
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:'#1A1F3C', letterSpacing:'-0.01em', marginBottom:6 }}>{v.vendor}</div>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            {v.domains?.length > 0 && (
              <span style={{ fontSize:11, color:'#807E7A' }}>
                <span style={{ color:'#B0ADA9', marginRight:4 }}>Domain:</span>{v.domains.join(' · ')}
              </span>
            )}
            {v.domainOwners?.length > 0 && (
              <span style={{ fontSize:11, color:'#807E7A' }}>
                <span style={{ color:'#B0ADA9', marginRight:4 }}>Owner:</span>{v.domainOwners.join(' · ')}
              </span>
            )}
            <span style={{ fontSize:11, color:'#B0ADA9' }}>{lineItems.length} line item{lineItems.length!==1?'s':''}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background:'#fff', border:'1px solid #EDECEA', cursor:'pointer', color:'#807E7A', fontSize:12, fontWeight:600, padding:'6px 14px', display:'flex', alignItems:'center', gap:5, flexShrink:0, whiteSpace:'nowrap' }}>
          <Icon name="close" size={11} color="#9E9B97" /> Close
        </button>
      </div>

      <div style={{ padding:'20px 24px', display:'grid', gap:20, minWidth:0 }}>

        {/* ── 3 KPI cards ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          <div style={{ padding:'16px 20px', background:'#fff', border:'1px solid #EDECEA', borderRadius:6, borderTop:'3px solid #6699FF' }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#B0ADA9', marginBottom:6 }}>Annual Budget</div>
            <div style={{ fontSize:22, fontWeight:800, color:'#333C66', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{fmt.m2(v.budget)}</div>
          </div>
          <div style={{ padding:'16px 20px', background:'#fff', border:'1px solid #EDECEA', borderRadius:6, borderTop:`3px solid ${v.forecast>v.budget?'#E87878':'#6699FF'}` }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#B0ADA9', marginBottom:6 }}>Year-End Forecast</div>
            <div style={{ fontSize:22, fontWeight:800, color:v.forecast>v.budget?'#C03A3A':'#333C66', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{fmt.m2(v.forecast)}</div>
            <div style={{ fontSize:11, color:'#9E9B97', marginTop:5 }}>{fmt.m2(Math.abs(v.forecast-v.budget))} {v.forecast>v.budget?'over':'under'} budget</div>
          </div>
          <div
            style={{ padding:'16px 20px', background:'#fff', border:'1px solid #EDECEA', borderRadius:6, borderTop:`3px solid ${netIsRisk?'#E87878':netIsOpp?'#72D4A0':'#D0CEC8'}`, position:'relative', overflow:'hidden', cursor:'default' }}
            onMouseEnter={() => setNetCardHover(true)}
            onMouseLeave={() => setNetCardHover(false)}
          >
            <div style={{ position:'absolute', inset:0, padding:'16px 20px', display:'flex', flexDirection:'column', transition:'opacity 0.25s', opacity: netCardHover ? 0 : 1 }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#B0ADA9', marginBottom:6 }}>Net Risk / (Opportunity)</div>
              <div style={{ fontSize:22, fontWeight:800, color:netIsRisk?'#C03A3A':netIsOpp?'#1F7A4D':'#9E9B97', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>
                {Math.abs(v.net)>100 ? fmt.signed2(v.net) : '—'}
              </div>
              <div style={{ fontSize:11, color:'#9E9B97', marginTop:5 }}>{netIsRisk?'Net risk exposure':netIsOpp?'Net opportunity':'Balanced'}</div>
            </div>
            <div style={{ position:'absolute', inset:0, padding:'16px 20px', display:'flex', flexDirection:'column', justifyContent:'center', background:'#333C66', transition:'opacity 0.25s', opacity: netCardHover ? 1 : 0 }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'lowercase', color:'rgba(255,255,255,0.45)', marginBottom:8, fontFamily:'var(--font-serif)' }}>net risk / (opportunity)</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.88)', lineHeight:1.45 }}>Sum of all vendor risk and opportunity positions. Positive = net risk. Negative = net opportunity.</div>
            </div>
          </div>
        </div>

        {/* ── Monthly Breakdown table ── */}
        {(v.monthlyAC||[]).some(x => x > 0) && (
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#1A1F3C', marginBottom:10 }}>Monthly Breakdown</div>
            <div style={{ overflowX:'auto', border:'1px solid #EDECEA', borderRadius:6 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:700 }}>
                <thead>
                  <tr style={{ background:'#F5F3F0' }}>
                    <th style={{ padding:'8px 14px', textAlign:'left', fontWeight:600, color:'#9E9B97', fontSize:11, width:80, borderBottom:'1px solid #EDECEA' }}></th>
                    {MONTHS.map((mo, i) => (
                      <th key={mo} style={{ padding:'8px 10px', textAlign:'center', fontWeight:500, color: i < actCnt ? '#807E7A' : '#B0ADA9', fontSize:11, borderBottom:'1px solid #EDECEA', whiteSpace:'nowrap' }}>
                        {mo.toLowerCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Actuals row */}
                  <tr style={{ borderBottom:'1px solid #F2F0EE' }}>
                    <td style={{ padding:'10px 14px', fontWeight:600, color:'#1A1F3C', fontSize:12, whiteSpace:'nowrap' }}>Actuals</td>
                    {MONTHS.map((mo, i) => {
                      const ac = (v.monthlyAC||[])[i] || 0;
                      const show = i < actCnt && ac > 0;
                      return (
                        <td key={mo} style={{ padding:'10px 10px', textAlign:'center', color: show ? '#1A1F3C' : '#D8D6D2', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>
                          {show ? fmt.k(ac) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                  {/* Forecast row */}
                  <tr style={{ borderBottom:'1px solid #F2F0EE' }}>
                    <td style={{ padding:'10px 14px', fontWeight:600, color:'#1A1F3C', fontSize:12, whiteSpace:'nowrap' }}>Forecast</td>
                    {MONTHS.map((mo, i) => {
                      const fc = (v.monthlyFC||[])[i] || 0;
                      return (
                        <td key={mo} style={{ padding:'10px 10px', textAlign:'center', color: fc > 0 ? '#6699FF' : '#D8D6D2', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>
                          {fc > 0 ? fmt.k(fc) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                  {/* Variance row */}
                  <tr>
                    <td style={{ padding:'10px 14px', fontWeight:600, color:'#1A1F3C', fontSize:12, whiteSpace:'nowrap' }}>Variance</td>
                    {MONTHS.map((mo, i) => {
                      const ac  = (v.monthlyAC||[])[i] || 0;
                      const sfc = synthMonthlyFC(v.monthlyAC, v.monthlyFC, v.forecast);
                      const fc  = sfc[i] || 0;
                      if (i >= actCnt || ac === 0) {
                        return <td key={mo} style={{ padding:'10px 10px', textAlign:'center', color:'#C8C6C0' }}>—</td>;
                      }
                      const diff = ac - fc;
                      if (Math.abs(diff) < 1) {
                        return <td key={mo} style={{ padding:'10px 10px', textAlign:'center', color:'#C8C6C0' }}>—</td>;
                      }
                      const unfav = diff > 0;
                      return (
                        <td key={mo} style={{ padding:'10px 10px', textAlign:'center', color: unfav ? '#C03A3A' : '#1F7A4D', fontWeight:600, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>
                          {unfav ? '+' : ''}{fmt.k(diff)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Legend */}
            <div style={{ display:'flex', gap:16, marginTop:8, fontSize:11, color:'#9E9B97', flexWrap:'wrap' }}>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:10, height:10, background:'#333C66', display:'inline-block', borderRadius:1 }}></span>
                Actuals
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:10, height:10, background:'#6699FF', display:'inline-block', borderRadius:1 }}></span>
                Forecast
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ color:'#C03A3A', fontWeight:700 }}>+</span> Unfavorable variance
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ color:'#1F7A4D', fontWeight:700 }}>—</span> Favorable variance
              </span>
            </div>
          </div>
        )}

        {/* ── Two-level drill-down: Category → Project ── */}
        {lineItems.length > 0 && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#9E9B97', marginBottom:10 }}>
              Line Items by Category
              <span style={{ fontSize:10, fontWeight:400, textTransform:'none', letterSpacing:0, color:'#C8C6C0', marginLeft:8 }}>{lineItems.length} items · {catGroups.length} {catGroups.length===1?'category':'categories'}</span>
            </div>
            <div style={{ border:'1px solid #EDECEA', borderRadius:6, overflow:'hidden' }}>
              {catGroups.map((cg, ci) => {
                const isOpen = expandedCat === cg.category;
                const cons   = cg.budget > 0 ? cg.forecast / cg.budget * 100 : null;
                return (
                  <div key={cg.category}>
                    {/* Level 1 – category row */}
                    <div
                      onClick={() => setExpandedCat(isOpen ? null : cg.category)}
                      style={{ display:'grid', gridTemplateColumns:'1fr repeat(4,auto)', gap:20, padding:'12px 16px', background: isOpen ? '#EEF0FA' : ci%2===0?'#fff':'#FAFAF8', borderBottom:'1px solid #EDECEA', cursor:'pointer', alignItems:'start' }}
                    >
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, color:'#1A1F3C', display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:9, color: isOpen?'#6699FF':'#B0ADA9', display:'inline-block', transform: isOpen?'rotate(90deg)':'none', transition:'transform 0.15s', lineHeight:1 }}>▶</span>
                          {cg.category}
                          <span style={{ fontSize:10, fontWeight:400, color:'#B0ADA9' }}>{cg.items.length} line{cg.items.length!==1?'s':''}</span>
                        </div>
                        {cg.note && (
                          <div style={{ fontSize:11, color:'#807E7A', marginTop:5, marginLeft:17, lineHeight:1.45, maxWidth:440 }}>{cg.note}</div>
                        )}
                      </div>
                      {[['Budget', cg.budget>0?fmt.k(cg.budget):'—'], ['Actuals', cg.actual>0?fmt.k(cg.actual):'—'], ['Forecast', fmt.k(cg.forecast)], ['Consumption', cons!==null?`${cons.toFixed(0)}%`:'—'], ['Risk', cg.risk>100?fmt.k(cg.risk):'—'], ['Opp', cg.opp<-100?fmt.k(Math.abs(cg.opp)):'—'], ['Net R/(O)', Math.abs(cg.net)>100?fmt.signed(cg.net):'—']].map(([lbl,val],vi) => (
                        <div key={lbl} style={{ textAlign:'right', minWidth:64 }}>
                          <div style={{ fontSize:9, color:'#B0ADA9', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{lbl}</div>
                          <div style={{ fontSize:13, fontWeight:700, color: lbl==='Consumption'&&cons!==null ? (cons>100?'#C03A3A':cons>85?'#96600A':'#333C66') : lbl==='Risk'&&cg.risk>100 ? '#C03A3A' : lbl==='Opp'&&cg.opp<-100 ? '#1F7A4D' : lbl==='Net R/(O)' ? (cg.net>100?'#C03A3A':cg.net<-100?'#1F7A4D':'#D8D6D2') : '#333C66', fontVariantNumeric:'tabular-nums' }}>{val}</div>
                        </div>
                      ))}
                    </div>

                    {/* Level 2 – project rows */}
                    {isOpen && (
                      <div style={{ background:'#F6F7FB', borderBottom:'1px solid #EDECEA' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11, minWidth:1400 }}>
                          <thead>
                            <tr style={{ background:'#EAECF6' }}>
                              {detailTh('vendor', 'Vendor', 'left', { position:'sticky', left:0, zIndex:2, background:'#EAECF6', paddingLeft:32 })}
                              {detailTh('category', 'Category', 'left')}
                              {detailTh('budget', 'Budget')}
                              {detailTh('actual', 'Actuals')}
                              {detailTh('forecast', 'Forecast')}
                              {detailTh('actfc', 'Actuals + Forecast')}
                              {detailTh('cons', 'Budget Consumption %')}
                              {detailTh('risk', 'Risk')}
                              {detailTh('opp', 'Opportunity')}
                              {detailTh('net', 'Net Risk/Opportunity')}
                              <th style={{ padding:'7px 16px 7px 12px', textAlign:'left', fontWeight:600, color:'#6699FF', fontSize:10, letterSpacing:'0.05em', textTransform:'uppercase', minWidth:220 }}>Notes - Risk/Opportunity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...(cg.items||[])].sort((a,b) => {
                              const av = detailSortValue(a, detailSort.col);
                              const bv = detailSortValue(b, detailSort.col);
                              const mul = detailSort.dir === 'desc' ? -1 : 1;
                              if (typeof av === 'string' || typeof bv === 'string') return mul * String(av).localeCompare(String(bv));
                              return mul * (av - bv);
                            }).map((li, idx) => {
                              const acLI = (li.monthlyAC||[]).reduce((s,x)=>s+x,0);
                              const fcLI = (li.monthlyFC||[]).reduce((s,x)=>s+x,0);
                              const totalLI = acLI + fcLI;
                              const consLI = li.budget > 0 ? totalLI / li.budget * 100 : null;
                              const catLI = li.spendCategory || li.subCategory || li.category || '—';
                              const noteLI = li.notesRO || li.notes || '';
                              const rowBg = idx%2===0 ? '#F6F7FB' : '#F0F1F8';
                              return (
                                <tr key={idx} style={{ borderTop:'1px solid #E4E6F2', background: rowBg }}>
                                  <td style={{ padding:'8px 12px 8px 32px', color:'#1A1F3C', position:'sticky', left:0, zIndex:1, background:rowBg, minWidth:180 }}>
                                    <div style={{ fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:180 }} title={li.vendor || v.vendor}>{li.vendor || v.vendor || '—'}</div>
                                    <div style={{ fontSize:10, color:'#B0ADA9', marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:180 }} title={li.application || li.project || ''}>{li.application || li.project || ''}</div>
                                  </td>
                                  <td style={{ padding:'8px 12px', color:'#1A1F3C', whiteSpace:'nowrap' }}>{catLI}</td>
                                  <td style={{ padding:'8px 12px', textAlign:'right', fontVariantNumeric:'tabular-nums', color:li.budget>0?'#1A1F3C':'#D8D6D2', whiteSpace:'nowrap' }}>{li.budget>0?fmt.k(li.budget):'—'}</td>
                                  <td style={{ padding:'8px 12px', textAlign:'right', fontVariantNumeric:'tabular-nums', color:acLI>0?'#1A1F3C':'#D8D6D2', whiteSpace:'nowrap' }}>{acLI>0?fmt.k(acLI):'—'}</td>
                                  <td style={{ padding:'8px 12px', textAlign:'right', fontVariantNumeric:'tabular-nums', color:fcLI>0?'#333C66':'#D8D6D2', whiteSpace:'nowrap' }}>{fcLI>0?fmt.k(fcLI):'—'}</td>
                                  <td style={{ padding:'8px 12px', textAlign:'right', fontVariantNumeric:'tabular-nums', fontWeight:700, color:'#1A1F3C', whiteSpace:'nowrap' }}>{totalLI>0?fmt.k(totalLI):'—'}</td>
                                  <td style={{ padding:'8px 12px', textAlign:'right', fontVariantNumeric:'tabular-nums', fontWeight:600, color:consLI!==null ? (consLI>100?'#C03A3A':consLI>85?'#96600A':'#333C66') : '#D8D6D2', whiteSpace:'nowrap' }}>{consLI!==null?`${consLI.toFixed(0)}%`:'—'}</td>
                                  <td style={{ padding:'8px 12px', textAlign:'right', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', color:(li.risk||0)>100?'#C03A3A':'#D8D6D2' }}>{(li.risk||0)>100?fmt.k(li.risk):'—'}</td>
                                  <td style={{ padding:'8px 12px', textAlign:'right', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', color:(li.opp||0)<-100?'#1F7A4D':'#D8D6D2' }}>{(li.opp||0)<-100?fmt.k(Math.abs(li.opp)):'—'}</td>
                                  <td style={{ padding:'8px 12px', textAlign:'right', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', fontWeight:Math.abs(li.net||0)>100?600:400, color:(li.net||0)>100?'#C03A3A':(li.net||0)<-100?'#1F7A4D':'#D8D6D2' }}>
                                    {Math.abs(li.net||0)>100?fmt.signed(li.net):'—'}
                                  </td>
                                  <td style={{ padding:'8px 16px 8px 12px', color:'#807E7A', fontSize:10, lineHeight:1.4, wordBreak:'break-word', minWidth:220, maxWidth:320 }}>
                                    {noteLI || <span style={{ color:'#D8D6D2' }}>—</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ background:'#EAECF6', borderTop:'2px solid #6699FF30' }}>
                              <td style={{ padding:'8px 12px 8px 32px', fontWeight:700, color:'#333C66', fontSize:11, position:'sticky', left:0, zIndex:1, background:'#EAECF6' }}>Subtotal</td>
                              <td />
                              <td style={{ padding:'8px 12px', textAlign:'right', fontWeight:700, color:'#333C66', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>{cg.budget>0?fmt.k(cg.budget):'—'}</td>
                              <td style={{ padding:'8px 12px', textAlign:'right', fontWeight:700, color:'#333C66', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>{cg.actual>0?fmt.k(cg.actual):'—'}</td>
                              <td style={{ padding:'8px 12px', textAlign:'right', fontWeight:700, color:'#333C66', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>{fmt.k(cg.forecast)}</td>
                              <td style={{ padding:'8px 12px', textAlign:'right', fontWeight:700, color:'#333C66', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>{fmt.k((cg.actual||0)+(cg.forecast||0))}</td>
                              <td style={{ padding:'8px 12px', textAlign:'right', fontWeight:700, color:'#333C66', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>{cg.budget>0?`${(((cg.actual||0)+(cg.forecast||0))/cg.budget*100).toFixed(0)}%`:'—'}</td>
                              <td style={{ padding:'8px 12px', textAlign:'right', fontWeight:700, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', color:cg.risk>100?'#C03A3A':'#D8D6D2' }}>{cg.risk>100?fmt.k(cg.risk):'—'}</td>
                              <td style={{ padding:'8px 12px', textAlign:'right', fontWeight:700, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', color:cg.opp<-100?'#1F7A4D':'#D8D6D2' }}>{cg.opp<-100?fmt.k(Math.abs(cg.opp)):'—'}</td>
                              <td style={{ padding:'8px 12px', textAlign:'right', fontWeight:700, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', color:cg.net>100?'#C03A3A':cg.net<-100?'#1F7A4D':'#D8D6D2' }}>{Math.abs(cg.net)>100?fmt.signed(cg.net):'—'}</td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Lean 6-column table ────────────────────────────────────────────────────
const VTR_COLS = [
  { key:'vendor',   label:'Vendor',                 cls:'',    sort:true  },
  { key:'cat',      label:'Category',               cls:'',    sort:false },
  { key:'budget',   label:'Budget',                 cls:'num', sort:true  },
  { key:'actual',   label:'Actuals',                cls:'num', sort:true  },
  { key:'fconly',   label:'Forecast',               cls:'num', sort:true  },
  { key:'actfc',    label:'Actuals + Forecast',     cls:'num', sort:true  },
  { key:'cons',     label:'Budget Consumption %',   cls:'num', sort:true  },
  { key:'risk',     label:'Risk',                   cls:'num', sort:true  },
  { key:'opp',      label:'Opportunity',            cls:'num', sort:true  },
  { key:'net',      label:'Net Risk/Opportunity',   cls:'num', sort:true, tooltip:'Sum of risk and opportunity positions.\nPositive = net risk. Negative = net opportunity.'  },
];

function VendorTable({ vendors, onSelect, selected }) {
  const [search, setSearch] = useStateV('');

  const [sort,   setSort]   = useStateV({ col:'actual', dir:'desc' });
const rows = useMemoV(() => {
    let list = vendors;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v => v.vendor.toLowerCase().includes(q));
    }
    const { col, dir } = sort;
    const mul = dir === 'desc' ? -1 : 1;
    return [...list].sort((a, b) => {
      if (col === 'vendor') return mul * a.vendor.localeCompare(b.vendor);
      if (col === 'budget') return mul * ((a.budget||0)   - (b.budget||0));
      if (col === 'actual') return mul * ((a.actual||0)   - (b.actual||0));
      if (col === 'fconly') return mul * ((a.forecast - a.actual) - (b.forecast - b.actual));
      if (col === 'actfc')  return mul * ((a.forecast||0) - (b.forecast||0));
      if (col === 'cons')   return mul * ((a.budget>0?a.forecast/a.budget:0) - (b.budget>0?b.forecast/b.budget:0));
      if (col === 'risk')   return mul * ((a.risk||0)     - (b.risk||0));
      if (col === 'opp')    return mul * (Math.abs(a.opp||0) - Math.abs(b.opp||0));
      if (col === 'net')    return mul * ((a.net||0)      - (b.net||0));
      return 0;
    });
  }, [vendors, search, sort]);

  function toggleSort(col) {
    setSort(s => s.col === col ? { col, dir: s.dir==='desc'?'asc':'desc' } : { col, dir:'desc' });
  }


  return (
    <div className="card" style={{ padding:0, overflow:'hidden' }}>
      {/* Controls */}
      <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid #EDECEA', background:'#fff' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10, gap:12 }}>
          <div>
            <span style={{ fontFamily:'var(--font-serif)', fontSize:16, fontWeight:700, color:'#1A1F3C' }}>All Vendors</span>
            <span style={{ fontSize:11, color:'#807E7A', marginLeft:10, fontStyle:'italic', letterSpacing:'0.01em' }}>Click any row for full detail · sorted by actual spend</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <span style={{ fontSize:11, color:'#9E9B97', fontVariantNumeric:'tabular-nums' }}>
              {rows.length}{rows.length !== vendors.length ? ` of ${vendors.length}` : ''} vendors
            </span>
            <ExportBtn onClick={() => xlsxExport(rows.map(v => ({
              'Vendor': v.vendor,
              'Domain': (v.domains||[]).join('; '),
              'Domain Owner': (v.domainOwners||[]).join('; '),
              'Category': v.cat || '',
              'Budget': v.budget,
              'Actuals': v.actual,
              'Forecast': Math.max(0, (v.forecast||0) - (v.actual||0)),
              'Actuals + Forecast': v.forecast,
              'Budget Consumption %': v.budget>0 ? (v.forecast/v.budget*100) : null,
              'Risk': v.risk,
              'Opportunity': v.opp,
              'Net Risk/Opportunity': v.net,
            })), 'Vendors')} />
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <div className="search-box" style={{ minWidth:200 }}>
            <Icon name="search" size={12} color="#807E7A" />
            <input
              type="text"
              placeholder="Search vendors…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#9E9B97', padding:'0 2px', fontSize:14, lineHeight:1, display:'flex', alignItems:'center' }}>×</button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX:'auto', maxHeight:480, overflowY:'auto' }}>
        <table className="tbl">
          <thead style={{ position:'sticky', top:0, zIndex:3 }}>
            <tr>
              {VTR_COLS.map(col => (
                <th
                  key={col.key}
                  className={`${col.cls}${col.sort?' sortable':''}`}
                  style={{ cursor:col.sort?'pointer':'default', background:'#FAFAF8', whiteSpace:'nowrap' }}
                  title={col.tooltip || undefined}
                  onClick={() => col.sort && toggleSort(col.key)}
                >
                  {col.label}{col.sort && <SortArrow col={col.key} sort={sort} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(v => {
              const st    = vendorStatus(v);
              const isSel = selected?.vendor === v.vendor;
              const cat   = vendorDomCat(v);
              return (
                <tr
                  key={v.vendor}
                  className={`clickable${isSel?' selected':''}`}
                  onClick={() => onSelect(isSel ? null : v)}
                >
                  {/* Vendor + status */}
                  <td style={{ minWidth:200 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:3, height:18, background:st.color, borderRadius:1.5, flexShrink:0 }} />
                      <div>
                        <div style={{ fontWeight:600, color:'#1A1F3C', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:200 }} title={v.vendor}>{v.vendor}</div>
                        {v.domains?.[0] && <div style={{ fontSize:10, color:'#C8C6C0', marginTop:1 }}>{v.domains[0]}</div>}
                      </div>
                    </div>
                  </td>
                  {/* Category */}
                  <td style={{ fontSize:12, whiteSpace:'nowrap', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis' }} title={cat}>{cat}</td>
                  {/* Budget */}
                  <td className="num">{v.budget>0?fmt.k(v.budget):<span style={{color:'#D8D6D2'}}>—</span>}</td>
                  {/* Actuals */}
                  <td className="num">{v.actual>0?fmt.k(v.actual):<span style={{color:'#D8D6D2'}}>—</span>}</td>
                  {/* Forecast */}
                  <td className="num">{fmt.k(v.forecast - v.actual)}</td>
                  {/* Actuals + Forecast */}
                  <td className="num" style={{ fontWeight:700, color:'#1A1F3C' }}>{fmt.k(v.forecast)}</td>
                  {/* Budget Consumption % */}
                  <td className="num" style={{ fontWeight:600, color:v.budget>0 ? (v.forecast/v.budget>1?'#C03A3A':v.forecast/v.budget>.85?'#96600A':'#333C66') : '#D8D6D2' }}>{v.budget>0?`${(v.forecast/v.budget*100).toFixed(0)}%`:<span style={{color:'#D8D6D2'}}>—</span>}</td>
                  {/* Risk */}
                  <td className="num" style={{ color:(v.risk||0)>100?'#C03A3A':'#D8D6D2' }}>{(v.risk||0)>100?fmt.k(v.risk):'—'}</td>
                  {/* Opportunity */}
                  <td className="num" style={{ color:(v.opp||0)<-100?'#1F7A4D':'#D8D6D2' }}>{(v.opp||0)<-100?fmt.k(Math.abs(v.opp)):'—'}</td>
                  {/* Net Risk/Opportunity */}
                  <td className="num">
                    {Math.abs(v.net)>100
                      ? <span style={{ color:v.net>0?'#C03A3A':'#1F7A4D', fontWeight:700 }}>{fmt.signed(v.net)}</span>
                      : <span style={{color:'#D8D6D2'}}>—</span>}
                  </td>

                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign:'center', padding:'40px 20px', color:'#9E9B97', fontSize:13 }}>
                  No vendors match
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Side panel detail */}
      {selected && (
        <div className="drill-overlay" onClick={() => onSelect(null)}
          style={{ alignItems:'flex-start', justifyContent:'center', overflowY:'auto', padding:'24px 0' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width:'92vw', background:'#FAFAF8', borderRadius:8, overflow:'hidden',
              boxShadow:'0 8px 48px rgba(28,33,63,0.22)', animation:'slidein 0.25s cubic-bezier(0.2,0,0.2,1)',
              margin:'auto' }}>
            <VendorDetail vendor={selected} onClose={() => onSelect(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Vendors Tab ──────────────────────────────────────────────────────
function VendorsTab({ data }) {
  const [selected, setSelected] = useStateV(null);
  const [flt, setFlt]           = useStateV({ domains:[], owners:[], cats:[], vendors:[] });

  const allItems = data.lineItems || [];
  const lookups  = data.lookups   || {};

  const domainOpts = useMemoV(() => {
    if (lookups.domains?.length) return lookups.domains.filter(Boolean).sort();
    return [...new Set(allItems.map(li => li.domain).filter(Boolean))].sort();
  }, [allItems, lookups]);

  const ownerOpts = useMemoV(() => {
    if (lookups.owners?.length) return lookups.owners.filter(x => x && x !== 'N/A').sort();
    return [...new Set(allItems.map(li => li.owner).filter(x => x && x !== 'N/A'))].sort();
  }, [allItems, lookups]);

  const filterActive = flt.domains.length + flt.owners.length + flt.cats.length + flt.vendors.length > 0;
  const clearFilters = () => setFlt({ domains:[], owners:[], cats:[], vendors:[] });
  const allVendors   = useMemoV(() => data.vendors || [], [data.vendors]);

  const vendors = useMemoV(() => {
    if (!filterActive) return allVendors;
    return allVendors.map(v => {
      const fi = (v.lineItems || []).filter(li => {
        if (flt.domains.length && !flt.domains.includes(li.domain)) return false;
        if (flt.owners.length  && !flt.owners.includes(li.owner))   return false;
        if (flt.cats.length    && !flt.cats.includes(vdCat(li)))     return false;
        return true;
      });
      if (!fi.length) return null;
      const ac12 = new Array(12).fill(0);
      const fc12 = new Array(12).fill(0);
      fi.forEach(li => {
        (li.monthlyAC||[]).forEach((x,i) => { ac12[i] += x; });
        (li.monthlyFC||[]).forEach((x,i) => { fc12[i] += x; });
      });
      return {
        ...v,
        budget:    fi.reduce((s,li) => s + (li.budget   || 0), 0),
        forecast:  fi.reduce((s,li) => s + (li.forecast || 0), 0),
        actual:    fi.reduce((s,li) => s + ((li.monthlyAC||[]).reduce((a,x)=>a+x,0)), 0),
        risk:      fi.reduce((s,li) => s + (li.risk || 0), 0),
        opp:       fi.reduce((s,li) => s + (li.opp  || 0), 0),
        net:       fi.reduce((s,li) => s + (li.net  || 0), 0),
        domains:   [...new Set(fi.map(li => li.domain).filter(Boolean))],
        monthlyAC: ac12, monthlyFC: fc12, lineItems: fi,
      };
    }).filter(Boolean);
  }, [allVendors, flt, filterActive]);

  const vendorOpts = useMemoV(() =>
    allVendors.filter(v => isRealVendor(v.vendor)).map(v => v.vendor).sort()
  , [allVendors]);

  const realVendors = useMemoV(() => {
    const base = vendors.filter(v => isRealVendor(v.vendor));
    if (!flt.vendors.length) return base;
    return base.filter(v => flt.vendors.includes(v.vendor));
  }, [vendors, flt.vendors]);

  // Always derive selected vendor fresh from realVendors — prevents stale data after upload
  const currentVendor = useMemoV(() => {
    if (!selected) return null;
    return realVendors.find(v => v.vendor === selected.vendor) || null;
  }, [realVendors, selected?.vendor]);

  // Clear selection if vendor disappears after filter/upload
  useEffectV(() => {
    if (selected && !realVendors.find(v => v.vendor === selected.vendor)) setSelected(null);
  }, [realVendors]);

  // Debug logging — fires whenever active workbook data changes
  useEffectV(() => {
    const lineItems = data.lineItems || [];
    const notesMatched = lineItems.filter(li => li.notesRO && li.notesRO.length > 0).length;
    const totalBudget   = realVendors.reduce((s, v) => s + (v.budget||0), 0);
    const totalForecast = realVendors.reduce((s, v) => s + (v.forecast||0), 0);
    const totalRisk     = realVendors.reduce((s, v) => s + (v.risk||0), 0);
    const totalOpp      = realVendors.reduce((s, v) => s + (v.opp||0), 0);
    const totalNet      = realVendors.reduce((s, v) => s + (v.net||0), 0);
    console.log('[vendors] active lineItems count:', lineItems.length);
    console.log('[vendors] vendor count:', realVendors.length);
    console.log('[vendors] EXCLUDED vendors:', allVendors.filter(v => !isRealVendor(v.vendor)).map(v => v.vendor));
    console.log('[vendors] total budget=$'+Math.round(totalBudget/1e3)+'K forecast=$'+Math.round(totalForecast/1e3)+'K risk=$'+Math.round(totalRisk/1e3)+'K opp=$'+Math.round(Math.abs(totalOpp)/1e3)+'K net=$'+Math.round(totalNet/1e3)+'K');
    console.log('[vendors] notes matched:', notesMatched, 'of', lineItems.length, 'line items');
  }, [realVendors, data.lineItems]);

  useEffectV(() => {
    if (!currentVendor) return;
    const li = currentVendor.lineItems || [];
    const budget   = li.reduce((s, x) => s + (x.budget||0), 0);
    const forecast = li.reduce((s, x) => s + (x.forecast||0), 0);
    const net      = li.reduce((s, x) => s + (x.net||0), 0);
    console.log('[vendors] selected vendor:', currentVendor.vendor, '| lineItems:', li.length, '| budget=$'+Math.round(budget/1e3)+'K forecast=$'+Math.round(forecast/1e3)+'K net=$'+Math.round(net/1e3)+'K');
  }, [currentVendor]);

  const OvFD = window.OvFilterDrop;

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap', justifyContent:'center' }}>
        <span style={{ fontFamily:'var(--font-serif)', fontWeight:800, fontSize:10, letterSpacing:'0.22em', textTransform:'lowercase', color:'#807E7A', marginRight:4 }}>filter</span>
        <OvFD label="Vendor"       options={vendorOpts} value={flt.vendors} onChange={v => setFlt({...flt, vendors:v})} />
        <OvFD label="Domain"       options={domainOpts} value={flt.domains} onChange={v => setFlt({...flt, domains:v})} />
        <OvFD label="Domain Owner" options={ownerOpts}  value={flt.owners}  onChange={v => setFlt({...flt, owners:v})} />
        <OvFD label="Category"     options={VD_CATS}    value={flt.cats}    onChange={v => setFlt({...flt, cats:v})} />
        {filterActive && (
          <>
            <button onClick={clearFilters} style={{ padding:'6px 12px', background:'none', border:'1px solid #ECEAE7', cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:12, color:'#807E7A' }}>
              ✕ Clear all
            </button>
            <span style={{ fontSize:11, color:'#807E7A', fontStyle:'italic', fontFamily:'var(--font-sans)' }}>
              Filtered · {realVendors.length} of {allVendors.filter(v => isRealVendor(v.vendor)).length} vendors
            </span>
          </>
        )}
      </div>

      <VendorKPIs vendors={realVendors} kpi={data.workbookSubtotal} />
      <VendorTable vendors={realVendors} onSelect={setSelected} selected={currentVendor} />

      {/* ── Budget vs Actuals vs Forecast chart ── */}
      <div style={{ marginTop: 20 }}>
        <VendorBudgetActualsChart vendors={realVendors} onSelect={setSelected} />
      </div>

      {/* ── YTD Risks & Opportunities chart ── */}
      <div style={{ marginTop: 0 }}>
        <VendorRisksOppsChart vendors={realVendors} onSelect={setSelected} />
      </div>

    </div>
  );
}

// ── YTD Risks & Opportunities by Vendor ─────────────────────────────────
function VendorRisksOppsChart({ vendors, n = 10, onSelect }) {
  const [hoveredVendor, setHoveredVendor] = useStateV(null);

  const top = useMemoV(() => {
    return [...vendors]
      .filter(v => isRealVendor(v.vendor) && (Math.abs(v.risk || 0) > 100 || Math.abs(v.opp || 0) > 100))
      .sort((a, b) => (b.net || 0) - (a.net || 0))
      .slice(0, n);
  }, [vendors, n]);

  const max = useMemoV(() =>
    Math.max(...top.map(v => Math.max(v.risk || 0, Math.abs(v.opp || 0))), 1)
  , [top]);

  if (top.length === 0) return null;

  return (
    <div className="card" style={{ padding: '24px 28px', marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, color: '#1A1F3C', marginBottom: 3 }}>
            YTD Risks &amp; Opportunities by Vendor
          </div>
          <div style={{ fontSize: 11, color: '#9E9B97' }}>Net risk/opportunity by vendor · sorted by net descending</div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#807E7A', flexShrink: 0, alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 12, height: 10, background: '#C03A3A', display: 'inline-block', borderRadius: 1 }}></span>
            risk (unfavorable)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 12, height: 10, background: '#1F7A4D', display: 'inline-block', borderRadius: 1 }}></span>
            opp (favorable)
          </span>
        </div>
      </div>

      {/* Axis labels */}
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 110px', gap: 12, marginBottom: 4 }}>
        <div />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 10, color: '#B0ADA9', marginLeft: 48 }}>
          <span style={{ textAlign: 'right', paddingRight: 8 }}>← unfavorable (risk)</span>
          <span style={{ textAlign: 'left', paddingLeft: 8 }}>favorable (opp) →</span>
        </div>
        <div />
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {top.map((v, i) => {
          const risk = v.risk || 0;
          const opp  = Math.abs(v.opp || 0);
          const net  = v.net || 0;
          const riskPct = max > 0 ? (risk / max) * 100 : 0;
          const oppPct  = max > 0 ? (opp  / max) * 100 : 0;
          const netIsRisk = net > 100;
          const netIsOpp  = net < -100;

          return (
            <div
              key={v.vendor}
              onClick={() => onSelect && onSelect(v)}
              onMouseEnter={() => setHoveredVendor(v.vendor)}
              onMouseLeave={() => setHoveredVendor(null)}
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr 110px',
                alignItems: 'center',
                gap: 12,
                padding: '8px 8px',
                borderBottom: i < top.length - 1 ? '1px solid #F2F0EE' : 'none',
                cursor: onSelect ? 'pointer' : 'default',
                borderRadius: 4,
                background: hoveredVendor === v.vendor ? '#F4F6FF' : 'transparent',
                transition: 'background 0.12s',
              }}
            >
              {/* Vendor name */}
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1F3C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={v.vendor}>
                {v.vendor}
              </span>

              {/* Diverging bars */}
              <div style={{ display: 'grid', gridTemplateColumns: '44px calc(50% + 4px) calc(50% - 48px) 44px', gap: 0, alignItems: 'center', height: 28 }}>
                {/* Risk label */}
                <span style={{ fontSize: 9, fontWeight: 700, color: '#C03A3A', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', textAlign: 'right', paddingRight: 4, opacity: risk > 100 ? 1 : 0 }}>{risk > 100 ? fmt.k(risk) : ''}</span>
                {/* Risk bar (right-aligned) */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: 28, paddingRight: 1 }}>
                  {risk > 100 && <div style={{ width: `${riskPct}%`, height: 20, background: '#C03A3A', borderRadius: '3px 0 0 3px', flexShrink: 0 }} />}
                </div>
                {/* Opp bar (left-aligned) */}
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', height: 28, paddingLeft: 1, borderLeft: '1px solid #D0CEC8' }}>
                  {opp > 100 && <div style={{ width: `${oppPct}%`, height: 20, background: '#1F7A4D', borderRadius: '0 3px 3px 0', flexShrink: 0 }} />}
                </div>
                {/* Opp label */}
                <span style={{ fontSize: 9, fontWeight: 700, color: '#1F7A4D', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', paddingLeft: 4, opacity: opp > 100 ? 1 : 0 }}>{opp > 100 ? fmt.k(opp) : ''}</span>
              </div>

              {/* Net value */}
              <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 10, color: '#B0ADA9', marginRight: 3 }}>Net</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: netIsRisk ? '#C03A3A' : netIsOpp ? '#1F7A4D' : '#9E9B97', fontVariantNumeric: 'tabular-nums' }}>
                  {Math.abs(net) > 100 ? fmt.signed2(net) : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Center $0 label */}
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 110px', gap: 12, marginTop: 6 }}>
        <div />
        <div style={{ position: 'relative', fontSize: 10, color: '#B0ADA9' }}>
          <span style={{ position: 'absolute', left: 'calc(50% + 48px)', transform: 'translateX(-50%)' }}>$0</span>
        </div>
        <div />
      </div>
    </div>
  );
}

// ── Annual Budget vs YTD Actuals vs Forecast – Top 10 ──────────
function VendorBudgetActualsChart({ vendors, n = 10, onSelect }) {
  const [hoveredVendor, setHoveredVendor] = useStateV(null);
  const top = useMemoV(() => {
    return [...vendors]
      .filter(v => isRealVendor(v.vendor))
      .sort((a, b) => (b.budget || 0) - (a.budget || 0))
      .slice(0, n);
  }, [vendors, n]);

  const max = top[0] ? (top[0].budget || 0) : 1;

  const SERIES = [
    { key: 'budget',    label: 'annual budget',       color: '#333C66' },
    { key: 'actuals',   label: 'ytd actual spend',   color: '#6699FF' },
    { key: 'remaining', label: 'remaining forecast',  color: '#E8873A' },
  ];

  return (
    <div className="card" style={{ padding: '24px 28px', marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, color: '#1A1F3C', marginBottom: 3 }}>
            Top 10 Vendors – Annual Budget vs YTD Actuals vs Forecast
          </div>
          <div style={{ fontSize: 11, color: '#9E9B97' }}>Top 10 vendors ranked by Annual Budget · descending</div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#807E7A', flexShrink: 0, alignItems: 'center' }}>
          {SERIES.map(s => (
            <span key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 12, height: 10, background: s.color, display: 'inline-block', borderRadius: 1 }}></span>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {top.map((v, i) => {
          const budget    = v.budget || 0;
          const actuals   = v.actual || 0;
          const remaining = Math.max(0, (v.forecast || 0) - actuals);
          const vals      = [budget, actuals, remaining];

          return (
            <div
              key={v.vendor}
              onClick={() => onSelect && onSelect(v)}
              onMouseEnter={() => setHoveredVendor(v.vendor)}
              onMouseLeave={() => setHoveredVendor(null)}
              style={{
                display: 'grid',
                gridTemplateColumns: '190px 1fr 170px',
                alignItems: 'center',
                gap: 16,
                padding: '10px 8px',
                borderBottom: i < top.length - 1 ? '1px solid #F2F0EE' : 'none',
                cursor: onSelect ? 'pointer' : 'default',
                borderRadius: 4,
                background: hoveredVendor === v.vendor ? '#F4F6FF' : 'transparent',
                transition: 'background 0.12s',
              }}>
              {/* Vendor name */}
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1F3C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={v.vendor}>
                {v.vendor}
              </span>

              {/* Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {SERIES.map((s, si) => {
                  const pct = max > 0 ? Math.min((vals[si] / max) * 100, 100) : 0;
                  return (
                    <div key={s.key} style={{ height: 10, background: '#EDECEA', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 2, transition: 'width 0.3s ease' }} />
                    </div>
                  );
                })}
              </div>

              {/* Values */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'right' }}>
                {SERIES.map((s, si) => (
                  <span key={s.key} style={{ fontSize: 11, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                    {fmt.m2(vals[si])}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Top Vendors ranked bar chart ─────────────────────────────────────────
function VendorRankChart({ vendors, sortKey, title, subtitle, n = 10 }) {
  const top = useMemoV(() => {
    return [...vendors]
      .filter(v => isRealVendor(v.vendor))
      .sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0))
      .slice(0, n);
  }, [vendors, sortKey, n]);

  const max = top[0] ? (top[0][sortKey] || 0) : 1;

  return (
    <div className="card" style={{ padding:'24px 28px', flex:'1 1 0', minWidth:0 }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:'var(--font-serif)', fontSize:16, fontWeight:700, color:'#1A1F3C', marginBottom:3 }}>{title}</div>
        <div style={{ fontSize:11, color:'#9E9B97' }}>{subtitle}</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
        {top.map((v, i) => {
          const val = v[sortKey] || 0;
          const pct = max > 0 ? (val / max) * 100 : 0;
          return (
            <div key={v.vendor} style={{ display:'grid', gridTemplateColumns:'32px 1fr auto', alignItems:'center', gap:12, padding:'9px 0', borderBottom: i < top.length-1 ? '1px solid #F2F0EE' : 'none' }}>
              <span style={{ fontSize:11, color:'#C8C6C0', fontWeight:700, fontVariantNumeric:'tabular-nums', letterSpacing:'0.04em' }}>
                {String(i+1).padStart(2,'0')}
              </span>
              <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:12, fontWeight:500, color:'#1A1F3C', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }} title={v.vendor}>
                  {v.vendor}
                </span>
                <div style={{ height:8, background:'#EDECEA', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:'#333C66', borderRadius:2, transition:'width 0.3s ease' }} />
                </div>
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:'#1A1F3C', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', minWidth:52, textAlign:'right' }}>
                {fmt.m2(val)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.VendorsTab = VendorsTab;
