// Vendors tab — lean table + rich drilldown
const { useState: useStateV, useMemo: useMemoV, useRef: useRefV, useEffect: useEffectV } = React;

const VD_CATS = ['Labor/ T&M', 'Software', 'MS', 'Infrastructure', 'Hardware', 'OOE', 'FPC'];
function vdCat(li) {
  return li.subCategory || li.category || '(Other)';
}

const NON_VENDOR_PATTERNS = [
  /^amortization/i, /^multiple$/i, /^amortization\/multiple$/i,
  /^n\/a$/i, /^other$/i, /^2026 ph$/i,
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
function VendorKPIs({ vendors }) {
  const totalSpend = vendors.reduce((s, v) => s + v.forecast, 0);
  const atRisk     = vendors.filter(v => v.net > 100);
  const withOpp    = vendors.filter(v => v.net < -100);
  // Aug–Dec = indices 7–11
  const remainFC   = vendors.reduce((s, v) => s + (v.monthlyFC||[]).slice(7,12).reduce((a,x)=>a+x,0), 0);
  const cards = [
    { label: 'Total Vendor Forecast',    value: fmt.m2(totalSpend), sub: `${vendors.length} vendors`,                                                                            color: '#333C66', accent: '#6699FF' },
    { label: 'Aug–Dec Remaining Spend',  value: fmt.m2(remainFC),   sub: 'Forecast Aug through Dec',                                                                             color: '#5A4A8A', accent: '#9B8FD4' },
    { label: 'Vendors at Net Risk',      value: atRisk.length,      sub: atRisk.length  ? fmt.m2(atRisk.reduce((s,v)=>s+v.risk,0)) + ' total risk' : 'None flagged',            color: '#C03A3A', accent: '#E87878' },
    { label: 'Vendors with Opportunity', value: withOpp.length,     sub: withOpp.length ? fmt.m2(Math.abs(withOpp.reduce((s,v)=>s+v.opp,0))) + ' total opp' : 'None flagged',   color: '#1F7A4D', accent: '#72D4A0' },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
      {cards.map((c, i) => (
        <div key={i} className="card" style={{ padding:'16px 20px', borderTop:`3px solid ${c.accent}` }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#9E9B97', marginBottom:6 }}>{c.label}</div>
          <div style={{ fontSize:24, fontWeight:800, color:c.color, lineHeight:1, marginBottom:4, fontVariantNumeric:'tabular-nums' }}>{c.value}</div>
          <div style={{ fontSize:11, color:'#9E9B97' }}>{c.sub}</div>
        </div>
      ))}
    </div>
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
  const st       = vendorStatus(v);
  const MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const actCnt   = (v.monthlyAC || []).filter(x => x > 0).length;
  const maxM     = Math.max(...[...(v.monthlyAC||[]),...(v.monthlyFC||[])].map(Math.abs), 1);
  const consumed = v.budget > 0 ? v.forecast / v.budget * 100 : null;

  // Category breakdown
  const cats = useMemoV(() => {
    const m = {};
    (v.lineItems || []).forEach(li => {
      const c = li.subCategory || li.category || 'Other';
      if (!m[c]) m[c] = { budget:0, actual:0, forecast:0, net:0, risk:0, opp:0 };
      m[c].budget   += li.budget || 0;
      m[c].actual   += (li.monthlyAC||[]).reduce((s,x)=>s+x,0);
      m[c].forecast += (li.monthlyFC||[]).reduce((s,x)=>s+x,0);
      m[c].net      += li.net || 0;
      m[c].risk     += li.risk || 0;
      m[c].opp      += li.opp  || 0;
    });
    return Object.entries(m).sort((a,b) => b[1].forecast - a[1].forecast);
  }, [v]);

  // Domain/owner breakdown
  const owners = useMemoV(() => {
    const m = {};
    (v.lineItems || []).forEach(li => {
      const key = li.owner || 'Unallocated';
      const dom = li.domain || '';
      const k = dom ? `${key} · ${dom}` : key;
      if (!m[k]) m[k] = { forecast:0, budget:0, net:0 };
      m[k].forecast += (li.monthlyFC||[]).reduce((s,x)=>s+x,0);
      m[k].budget   += li.budget || 0;
      m[k].net      += li.net || 0;
    });
    return Object.entries(m).sort((a,b) => b[1].forecast - a[1].forecast);
  }, [v]);

  // Line items
  const lineItems = v.lineItems || [];
  const liTotal   = { budget:0, actual:0, forecast:0, net:0 };
  lineItems.forEach(li => {
    liTotal.budget   += li.budget || 0;
    liTotal.actual   += (li.monthlyAC||[]).reduce((s,x)=>s+x,0);
    liTotal.forecast += (li.monthlyFC||[]).reduce((s,x)=>s+x,0);
    liTotal.net      += li.net || 0;
  });

  return (
    <div style={{ borderTop:'2px solid #6699FF30', background:'#FAFAF8' }}>
      {/* ── Header ── */}
      <div style={{ background:st.bg, padding:'16px 24px', borderBottom:`1px solid ${st.color}20`, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#fff', background:st.color, padding:'2px 8px', borderRadius:3 }}>{st.label}</span>
            {v.domains?.length > 0 && <span style={{ fontSize:11, color:'#9E9B97' }}>{v.domains.join(' · ')}</span>}
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:'#1A1F3C', letterSpacing:'-0.01em' }}>{v.vendor}</div>
        </div>
        <button onClick={onClose} style={{ background:'#fff', border:'1px solid #EDECEA', cursor:'pointer', color:'#807E7A', fontSize:12, fontWeight:600, padding:'6px 14px', display:'flex', alignItems:'center', gap:5, flexShrink:0, whiteSpace:'nowrap' }}>
          <Icon name="close" size={11} color="#9E9B97" /> Close
        </button>
      </div>

      <div style={{ padding:'20px 24px', display:'grid', gap:20 }}>

        {/* ── KPI strip ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8 }}>
          {[
            ['Budget',        fmt.m2(v.budget),                       null,                                              'Total approved budget'],
            ['YTD Actual',    fmt.m2(v.actual),                       null,                                              'Spent year-to-date'],
            ['Year-End FC',   fmt.m2(v.forecast),                     null,                                              'Full-year forecast'],
            ['Remaining',     fmt.m2(v.budget - v.forecast),          (v.budget-v.forecast)<-100?'#C03A3A':'#1F7A4D',   'Budget − Year-End FC'],
            ['Consumed',      consumed!=null?consumed.toFixed(1)+'%':'—', consumed>100?'#C03A3A':consumed>85?'#96600A':'#333C66', 'Year-End FC ÷ Budget'],
            ['Risk',          v.risk > 100 ? fmt.m2(v.risk) : '—',   v.risk>100?'#C03A3A':null,                         'Upside forecast exposure'],
            ['Net Position',  Math.abs(v.net)>100?fmt.signed2(v.net):'—', v.net>100?'#C03A3A':v.net<-100?'#1F7A4D':'#9E9B97', 'Risk minus Opportunity'],
          ].map(([l, val, clr, tip], i) => (
            <div key={i} style={{ padding:'12px 14px', background:'#fff', border:'1px solid #EDECEA', borderRadius:4 }} title={tip}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'#B0ADA9', marginBottom:5 }}>{l}</div>
              <div style={{ fontSize:15, fontWeight:800, color:clr||'#1A1F3C', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* ── Risk / Opportunity callout ── */}
        {(v.risk > 100 || v.opp > 100) && (
          <div style={{ display:'grid', gridTemplateColumns: v.risk>100 && v.opp>100 ? '1fr 1fr' : '1fr', gap:10 }}>
            {v.risk > 100 && (
              <div style={{ background:'#FDF0F0', border:'1px solid #E87878', borderRadius:6, padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:10 }}>
                <Icon name="alert" size={16} color="#C03A3A" />
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#C03A3A', marginBottom:3 }}>Risk: {fmt.m2(v.risk)}</div>
                  <div style={{ fontSize:11, color:'#9E9B97', lineHeight:1.5 }}>
                    {lineItems.filter(li => (li.risk||0)>100).map((li,i) => (
                      <div key={i}><span style={{ color:'#C03A3A' }}>{fmt.k(li.risk)}</span> — {li.application||li.project||li.subCategory||'line item'}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {v.opp > 100 && (
              <div style={{ background:'#EFF7F3', border:'1px solid #72D4A0', borderRadius:6, padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:10 }}>
                <Icon name="trend" size={16} color="#1F7A4D" />
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#1F7A4D', marginBottom:3 }}>Opportunity: {fmt.m2(v.opp)}</div>
                  <div style={{ fontSize:11, color:'#9E9B97', lineHeight:1.5 }}>
                    {lineItems.filter(li => (li.opp||0)>100).map((li,i) => (
                      <div key={i}><span style={{ color:'#1F7A4D' }}>{fmt.k(li.opp)}</span> — {li.application||li.project||li.subCategory||'line item'}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Monthly trend ── */}
        {(v.monthlyAC||[]).some(x => x > 0) && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#9E9B97' }}>Monthly Trend — Actual vs Forecast</span>
              <span style={{ display:'flex', gap:14, fontSize:11, color:'#9E9B97' }}>
                <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, background:'#333C66', display:'inline-block', borderRadius:2 }}></span>Actual</span>
                <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, background:'#6699FF', opacity:0.55, display:'inline-block', borderRadius:2 }}></span>Forecast</span>
              </span>
            </div>
            <div style={{ position:'relative' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(12,1fr)', gap:4, height:90, alignItems:'end' }}>
                {MONTHS.map((mo, i) => {
                  const ac   = (v.monthlyAC||[])[i] || 0;
                  const _sfc = synthMonthlyFC(v.monthlyAC, v.monthlyFC, v.forecast);
                  const fc   = _sfc[i] || 0;
                  const isAc = i < actCnt;
                  const val  = isAc ? ac : fc;
                  const h    = val > 0 ? Math.max(3, (val / maxM) * 84) : 0;
                  return (
                    <div key={i} style={{ height:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-end', alignItems:'center' }}>
                      <div
                        style={{ width:'100%', height:h, background:isAc?'#333C66':'#6699FF', opacity:isAc?1:0.55, borderRadius:'2px 2px 0 0', cursor:'default' }}
                        title={`${mo}: ${fmt.k(val)}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(12,1fr)', gap:4, marginTop:5 }}>
                {MONTHS.map((mo, i) => (
                  <div key={mo} style={{ fontSize:9, textAlign:'center', color: i < actCnt ? '#807E7A' : '#C8C6C0', fontWeight: i < actCnt ? 600 : 400 }}>{mo}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Category & Domain breakdown ── */}
        <div style={{ display:'grid', gridTemplateColumns: owners.length > 1 ? '1fr 1fr' : '1fr', gap:16 }}>
          {/* Category */}
          {cats.length > 0 && (
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#9E9B97', marginBottom:10 }}>Category Breakdown</div>
              <div style={{ display:'flex', flexDirection:'column', gap:0, border:'1px solid #EDECEA', borderRadius:6, overflow:'hidden' }}>
                {cats.map(([cat, c], i) => {
                  const pct = v.forecast > 0 ? c.forecast / v.forecast * 100 : 0;
                  return (
                    <div key={cat} style={{ display:'grid', gridTemplateColumns:'1fr 56px 64px 58px', gap:8, alignItems:'center', padding:'9px 12px', background:i%2===0?'#fff':'#FAFAF8', borderBottom: i<cats.length-1?'1px solid #F2F0EE':'none' }}>
                      <div>
                        <div style={{ fontSize:11, fontWeight:500, color:'#1A1F3C', marginBottom:3 }}>{cat}</div>
                        <div style={{ height:3, background:'#EDECEA', borderRadius:2 }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:'#6699FF', borderRadius:2 }} />
                        </div>
                      </div>
                      <span style={{ fontSize:11, textAlign:'right', color:'#9E9B97', fontVariantNumeric:'tabular-nums' }}>{fmt.k(c.budget)}</span>
                      <span style={{ fontSize:11, fontWeight:600, textAlign:'right', color:'#1A1F3C', fontVariantNumeric:'tabular-nums' }}>{fmt.k(c.forecast)}</span>
                      <span style={{ fontSize:11, fontWeight:600, textAlign:'right', fontVariantNumeric:'tabular-nums', color:c.net>100?'#C03A3A':c.net<-100?'#1F7A4D':'#C8C6C0' }}>
                        {Math.abs(c.net)<100?'—':fmt.signed(c.net)}
                      </span>
                    </div>
                  );
                })}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 56px 64px 58px', gap:8, padding:'6px 12px', background:'#F5F3F0', borderTop:'1px solid #EDECEA' }}>
                  <span style={{ fontSize:10, color:'#9E9B97', fontWeight:700 }}>Total</span>
                  <span style={{ fontSize:11, textAlign:'right', color:'#9E9B97', fontVariantNumeric:'tabular-nums', fontWeight:700 }}>{fmt.k(v.budget)}</span>
                  <span style={{ fontSize:11, textAlign:'right', color:'#1A1F3C', fontVariantNumeric:'tabular-nums', fontWeight:700 }}>{fmt.k(v.forecast)}</span>
                  <span style={{ fontSize:11, textAlign:'right', fontVariantNumeric:'tabular-nums', fontWeight:700, color:v.net>100?'#C03A3A':v.net<-100?'#1F7A4D':'#C8C6C0' }}>
                    {Math.abs(v.net)<100?'—':fmt.signed(v.net)}
                  </span>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 56px 64px 58px', gap:8, padding:'3px 12px 0', fontSize:9, color:'#C8C6C0' }}>
                <span />
                <span style={{ textAlign:'right' }}>Budget</span>
                <span style={{ textAlign:'right' }}>FC</span>
                <span style={{ textAlign:'right' }}>Net</span>
              </div>
            </div>
          )}

          {/* Domain/Owner breakdown */}
          {owners.length > 1 && (
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#9E9B97', marginBottom:10 }}>Domain / Owner</div>
              <div style={{ display:'flex', flexDirection:'column', gap:0, border:'1px solid #EDECEA', borderRadius:6, overflow:'hidden' }}>
                {owners.map(([key, o], i) => {
                  const pct = v.forecast > 0 ? o.forecast / v.forecast * 100 : 0;
                  return (
                    <div key={key} style={{ display:'grid', gridTemplateColumns:'1fr 64px 58px', gap:8, alignItems:'center', padding:'9px 12px', background:i%2===0?'#fff':'#FAFAF8', borderBottom: i<owners.length-1?'1px solid #F2F0EE':'none' }}>
                      <div>
                        <div style={{ fontSize:11, fontWeight:500, color:'#1A1F3C', marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{key}</div>
                        <div style={{ height:3, background:'#EDECEA', borderRadius:2 }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:'#9B8FD4', borderRadius:2 }} />
                        </div>
                      </div>
                      <span style={{ fontSize:11, fontWeight:600, textAlign:'right', color:'#1A1F3C', fontVariantNumeric:'tabular-nums' }}>{fmt.k(o.forecast)}</span>
                      <span style={{ fontSize:11, textAlign:'right', fontVariantNumeric:'tabular-nums', fontWeight:600, color:o.net>100?'#C03A3A':o.net<-100?'#1F7A4D':'#C8C6C0' }}>
                        {Math.abs(o.net)<100?'—':fmt.signed(o.net)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 64px 58px', gap:8, padding:'3px 12px 0', fontSize:9, color:'#C8C6C0' }}>
                <span />
                <span style={{ textAlign:'right' }}>FC</span>
                <span style={{ textAlign:'right' }}>Net</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Line Items table ── */}
        {lineItems.length > 0 && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#9E9B97', marginBottom:10 }}>
              Contract / Project Detail
              <span style={{ fontSize:10, fontWeight:400, textTransform:'none', letterSpacing:0, color:'#C8C6C0', marginLeft:8 }}>
                {lineItems.length} line items — total reconciles to vendor row
              </span>
            </div>
            <div style={{ overflowX:'auto', border:'1px solid #EDECEA', borderRadius:6, overflow:'hidden' }}>
              <table className="tbl" style={{ fontSize:12 }}>
                <thead>
                  <tr>
                    <th style={{ minWidth:180 }}>Application / Project</th>
                    <th>Category</th>
                    <th>Domain / Owner</th>
                    <th className="num">Budget</th>
                    <th className="num">YTD Actual</th>
                    <th className="num" style={{ minWidth:100 }}>Year-End FC</th>
                    <th className="num">Consumed</th>
                    <th className="num">Net</th>
                    <th style={{ minWidth:72 }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li, i) => {
                    const liAc   = (li.monthlyAC||[]).reduce((s,x)=>s+x,0);
                    const liFc   = (li.monthlyFC||[]).reduce((s,x)=>s+x,0);
                    const liCons = li.budget > 0 ? liFc / li.budget * 100 : null;
                    return (
                      <tr key={i}>
                        <td>
                          <div style={{ fontWeight:500, color:'#1A1F3C', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:220 }} title={li.application||li.project||'—'}>
                            {li.application || li.project || '—'}
                          </div>
                          {li.project && li.application && (
                            <div style={{ fontSize:10, color:'#B0ADA9', marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:220 }} title={li.project}>{li.project}</div>
                          )}
                        </td>
                        <td style={{ color:'#807E7A', whiteSpace:'nowrap' }}>{li.subCategory || li.category || '—'}</td>
                        <td style={{ color:'#807E7A', whiteSpace:'nowrap', fontSize:11 }}>
                          <div>{li.domain || '—'}</div>
                          {li.owner && li.owner !== 'N/A' && <div style={{ fontSize:10, color:'#C8C6C0' }}>{li.owner}</div>}
                        </td>
                        <td className="num" style={{ color:'#9E9B97' }}>{li.budget > 0 ? fmt.k(li.budget) : <span style={{ color:'#D8D6D2' }}>—</span>}</td>
                        <td className="num">{liAc > 0 ? fmt.k(liAc) : <span style={{ color:'#D8D6D2' }}>—</span>}</td>
                        <td className="num"><span style={{ fontWeight:600 }}>{fmt.k(liFc)}</span></td>
                        <td className="num">
                          {liCons !== null
                            ? <span style={{ color:liCons>100?'#C03A3A':liCons>85?'#96600A':'#807E7A', fontWeight:liCons>100?700:400 }}>{liCons.toFixed(0)}%</span>
                            : <span style={{ color:'#D8D6D2' }}>—</span>}
                        </td>
                        <td className={`num ${(li.net||0)>100?'neg':(li.net||0)<-100?'pos':'zero'}`}>
                          {Math.abs(li.net||0)<100?<span style={{ color:'#D8D6D2' }}>—</span>:fmt.signed(li.net)}
                        </td>
                        <td>
                          <Sparkline ac={li.monthlyAC||[]} fc={synthMonthlyFC(li.monthlyAC, li.monthlyFC, li.forecast)} height={22} width={72} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Reconciliation total row */}
                <tfoot>
                  <tr style={{ background:'#F5F3F0', fontWeight:700 }}>
                    <td style={{ fontSize:11, color:'#807E7A', fontWeight:700 }}>Vendor Total</td>
                    <td colSpan={2} />
                    <td className="num" style={{ color:'#9E9B97', fontVariantNumeric:'tabular-nums' }}>{fmt.k(liTotal.budget)}</td>
                    <td className="num" style={{ fontVariantNumeric:'tabular-nums' }}>{fmt.k(liTotal.actual)}</td>
                    <td className="num" style={{ color:'#1A1F3C', fontVariantNumeric:'tabular-nums', fontWeight:800 }}>{fmt.k(liTotal.forecast)}</td>
                    <td className="num" style={{ color: liTotal.forecast > liTotal.budget ? '#C03A3A' : '#1F7A4D', fontVariantNumeric:'tabular-nums' }}>
                      {liTotal.budget > 0 ? (liTotal.forecast/liTotal.budget*100).toFixed(0)+'%' : '—'}
                    </td>
                    <td className={`num ${liTotal.net>100?'neg':liTotal.net<-100?'pos':'zero'}`} style={{ fontWeight:800 }}>
                      {Math.abs(liTotal.net)<100?'—':fmt.signed(liTotal.net)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Lean 6-column table ────────────────────────────────────────────────────
const VTR_COLS = [
  { key:'vendor',   label:'Vendor',           cls:'',    sort:true  },
  { key:'cat',      label:'Category',          cls:'',    sort:false },
  { key:'forecast', label:'Year-End Forecast', cls:'num', sort:true  },
  { key:'budget',   label:'vs Budget',         cls:'',    sort:true  },
  { key:'net',      label:'Net Position',      cls:'num', sort:true  },
  { key:'trend',    label:'Trend',             cls:'',    sort:false },
];

function VendorTable({ vendors, onSelect, selected }) {
  const [search, setSearch] = useStateV('');
  const [chip,   setChip]   = useStateV('all');
  const [sort,   setSort]   = useStateV({ col:'budget', dir:'desc' });
  const detailRef           = useRefV(null);

  useEffectV(() => {
    if (selected && detailRef.current) {
      const el = detailRef.current;
      setTimeout(() => {
        const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: Math.max(0, top), behavior:'smooth' });
      }, 60);
    }
  }, [selected?.vendor]);

  const chipFiltered = useMemoV(() => {
    switch (chip) {
      case 'risk': return vendors.filter(v => v.net > 100);
      case 'opp':  return vendors.filter(v => v.net < -100);
      case 'over': return vendors.filter(v => v.forecast > v.budget && v.budget > 0);
      default:     return vendors;
    }
  }, [vendors, chip]);

  const rows = useMemoV(() => {
    let list = chipFiltered;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v => v.vendor.toLowerCase().includes(q));
    }
    const { col, dir } = sort;
    const mul = dir === 'desc' ? -1 : 1;
    return [...list].sort((a, b) => {
      if (col === 'vendor')   return mul * a.vendor.localeCompare(b.vendor);
      if (col === 'forecast') return mul * (a.forecast - b.forecast);
      if (col === 'budget')   return mul * (a.budget - b.budget);
      if (col === 'net')      return mul * (a.net - b.net);
      return 0;
    });
  }, [chipFiltered, search, sort]);

  function toggleSort(col) {
    setSort(s => s.col === col ? { col, dir: s.dir==='desc'?'asc':'desc' } : { col, dir:'desc' });
  }

  const CHIPS = [
    { key:'all',  label:'All' },
    { key:'risk', label:'Risk' },
    { key:'opp',  label:'Opportunity' },
    { key:'over', label:'Over budget' },
  ];

  return (
    <div className="card" style={{ padding:0, overflow:'hidden' }}>
      {/* Controls */}
      <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid #EDECEA', background:'#fff' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10, gap:12 }}>
          <div>
            <span style={{ fontFamily:'var(--font-serif)', fontSize:16, fontWeight:700, color:'#1A1F3C' }}>All Vendors</span>
            <span style={{ fontSize:11, color:'#9E9B97', marginLeft:10 }}>Click any row for full detail</span>
          </div>
          <span style={{ fontSize:11, color:'#9E9B97', flexShrink:0, fontVariantNumeric:'tabular-nums' }}>
            {rows.length}{rows.length !== vendors.length ? ` of ${vendors.length}` : ''} vendors
          </span>
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
          <div className="chips">
            {CHIPS.map(c => (
              <button key={c.key} className={`chip${chip===c.key?' active':''}`} onClick={() => setChip(c.key)}>{c.label}</button>
            ))}
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
                  <td style={{ color:'#807E7A', fontSize:12, whiteSpace:'nowrap', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis' }} title={cat}>{cat}</td>
                  {/* Year-End FC */}
                  <td className="num">
                    <span style={{ fontWeight:700, color:'#1A1F3C', fontSize:13 }}>{fmt.k(v.forecast)}</span>
                  </td>
                  {/* vs Budget bar */}
                  <td style={{ minWidth:100 }}>
                    <BudgetBar actual={v.actual} forecast={v.forecast} budget={v.budget} />
                  </td>
                  {/* Net Position */}
                  <td className="num">
                    {Math.abs(v.net) > 100
                      ? <span style={{ color:v.net>0?'#C03A3A':'#1F7A4D', fontWeight:700 }}>{fmt.signed(v.net)}</span>
                      : <span style={{ color:'#D8D6D2' }}>—</span>}
                  </td>
                  {/* Sparkline */}
                  <td>
                    <Sparkline ac={v.monthlyAC||[]} fc={synthMonthlyFC(v.monthlyAC, v.monthlyFC, v.forecast)} height={24} width={80} />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign:'center', padding:'40px 20px', color:'#9E9B97', fontSize:13 }}>
                  No vendors match
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Inline detail */}
      <div ref={detailRef}>
        {selected && <VendorDetail vendor={selected} onClose={() => onSelect(null)} />}
      </div>
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

  useEffectV(() => {
    if (selected && !realVendors.find(v => v.vendor === selected.vendor)) setSelected(null);
  }, [realVendors]);

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

      <VendorKPIs vendors={realVendors} />
      <VendorTable vendors={realVendors} onSelect={setSelected} selected={selected} />
    </div>
  );
}

window.VendorsTab = VendorsTab;
