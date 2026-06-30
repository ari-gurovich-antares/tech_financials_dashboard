// Vendors tab — executive overview redesign
const { useState: useStateV, useMemo: useMemoV, useRef: useRefV } = React;

// Names that are not real vendors — exclude from rankings & matrix
const NON_VENDOR_PATTERNS = [
  /^amortization/i, /^multiple$/i, /^amortization\/multiple$/i,
  /^n\/a$/i, /^other$/i, /^2026 ph$/i,
  /^software capitalization/i,
  /^t&e\s*-/i, /^general office expense/i,
  /^\s*$/, // blank
];
function isRealVendor(name) {
  if (!name) return false;
  return !NON_VENDOR_PATTERNS.some(r => r.test(name.trim()));
}

function vendorStatus(v) {
  if (v.net > 100)         return { key:'risk', label:'Net Risk',        color:'#C03A3A', bg:'#FDF0F0', bar:'#E87878', dot:'#C03A3A' };
  if (v.net < -100)        return { key:'opp',  label:'Net Opportunity', color:'#1F7A4D', bg:'#EFF7F3', bar:'#72D4A0', dot:'#1F7A4D' };
  if (v.actual > v.budget) return { key:'over', label:'Over Budget', color:'#96600A', bg:'#FDF5E6', bar:'#E8A020', dot:'#E8A020' };
  return                          { key:'ok',   label:'On Track',    color:'#3A5A8A', bg:'#EEF3FA', bar:'#6699FF', dot:'#6699FF' };
}

// ── KPI Cards ────────────────────────────────────────────────────────────
function VendorKPIs({ vendors }) {
  const totalSpend    = vendors.reduce((s, v) => s + v.forecast, 0);
  const atRisk        = vendors.filter(v => v.net > 100);
  const withOpp       = vendors.filter(v => v.net < -100);
  const largest       = vendors.reduce((mx, v) => v.forecast > mx.forecast ? v : mx, vendors[0] || {});

  const cards = [
    {
      label: 'Total Vendor Forecast',
      value: fmt.m2(totalSpend),
      sub: `${vendors.length} vendors`,
      color: '#333C66',
      accent: '#6699FF',
    },
    {
      label: 'Vendors at Net Risk',
      value: atRisk.length,
      sub: atRisk.length > 0 ? fmt.m2(atRisk.reduce((s,v)=>s+v.risk,0)) + ' total risk' : 'None flagged',
      color: '#C03A3A',
      accent: '#E87878',
    },
    {
      label: 'Vendors at Net Opportunity',
      value: withOpp.length,
      sub: withOpp.length > 0 ? fmt.m2(Math.abs(withOpp.reduce((s,v)=>s+v.opp,0))) + ' total opp' : 'None flagged',
      color: '#1F7A4D',
      accent: '#72D4A0',
    },
  ];

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
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

// ── Top 10 Horizontal Bar Chart ──────────────────────────────────────────
function TopVendorsChart({ vendors, onSelect, selected }) {
  const top10 = useMemoV(() =>
    [...vendors]
      .filter(v => isRealVendor(v.vendor))
      .sort((a,b) => b.forecast - a.forecast)
      .slice(0, 10),
    [vendors]
  );
  const max = top10[0]?.forecast || 1;

  return (
    <div className="card" style={{ padding:'22px 28px' }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:18 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#9E9B97' }}>Top 10 Vendors · Year-End Forecast</div>
        <div style={{ fontSize:10, color:'#C8C6C0', display:'flex', gap:16 }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, background:'#E87878', borderRadius:2, display:'inline-block' }}></span>At Risk</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, background:'#72D4A0', borderRadius:2, display:'inline-block' }}></span>Opportunity</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, background:'#6699FF', borderRadius:2, display:'inline-block' }}></span>On Track</span>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {top10.map((v, i) => {
          const st    = vendorStatus(v);
          const pct   = v.forecast / max * 100;
          const isSel = selected?.vendor === v.vendor;
          const hasNet = Math.abs(v.net) > 100;
          return (
            <div
              key={v.vendor}
              onClick={() => onSelect(v)}
              style={{
                display:'grid', gridTemplateColumns:'20px 1fr 90px 100px',
                gap:10, alignItems:'center',
                cursor:'pointer', padding:'7px 10px', borderRadius:5,
                background: isSel ? '#F0EEF8' : 'transparent',
                outline: isSel ? '1.5px solid #333C6622' : 'none',
                transition:'background 0.12s',
              }}
              onMouseEnter={e => { if (!isSel) e.currentTarget.style.background='#F7F6F2'; }}
              onMouseLeave={e => { e.currentTarget.style.background = isSel ? '#F0EEF8' : 'transparent'; }}
            >
              {/* Rank */}
              <span style={{ fontSize:11, fontWeight:700, color:'#C8C6C0', textAlign:'right' }}>{i+1}</span>

              {/* Name + bar */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:'#1A1F3C', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:200 }}>{v.vendor}</span>
                </div>
                <div style={{ height:7, background:'#EDECEA', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:st.bar, borderRadius:4, transition:'width 0.5s' }} />
                </div>
              </div>

              {/* Forecast */}
              <span style={{ fontSize:13, fontWeight:800, color:'#333C66', fontVariantNumeric:'tabular-nums', textAlign:'right' }}>{fmt.k(v.forecast)}</span>

              {/* Status + net */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
                <span style={{ fontSize:9, fontWeight:700, color:st.color, background:st.bg, padding:'2px 7px', borderRadius:3, whiteSpace:'nowrap' }}>{st.label}</span>
                {hasNet && (
                  <span style={{ fontSize:9, fontWeight:600, color: v.net > 0 ? '#C03A3A' : '#1F7A4D', fontVariantNumeric:'tabular-nums' }}>
                    {fmt.signed(v.net)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Category color palette — mirrors SB_CAT_PALETTE in tab-sunburst.jsx
const V_CAT_COLORS = {
  'Labor/ T&M':    '#6699FF',
  'Software':      '#EDAC4B',
  'MS':            '#B088D4',
  'Infrastructure':'#5DB8A2',
  'Hardware':      '#E08070',
  'OOE':           '#C9B54A',
  'Amortization':  '#80BCDC',
  'FPC':           '#72C472',
};
function vendorDomCat(v) {
  const tally = {};
  (v.lineItems || []).forEach(li => {
    const c = li.subCategory || li.category || 'Other';
    const fc = (li.monthlyFC || []).reduce((s,x) => s + x, 0);
    tally[c] = (tally[c] || 0) + fc;
  });
  const top = Object.entries(tally).sort((a,b) => b[1] - a[1])[0];
  return top ? top[0] : 'Other';
}
function vendorCatColor(v) {
  return V_CAT_COLORS[vendorDomCat(v)] || '#8899BB';
}

// ── Vendors Requiring Attention ──────────────────────────────────────────
function AttentionCard({ v, colorScheme, onSelect, selected }) {
  const cs    = colorScheme;
  const isSel = selected?.vendor === v.vendor;
  const impact = Math.abs(v.net);
  return (
    <div
      onClick={() => onSelect(v)}
      style={{
        padding:'9px 12px',
        borderRadius:6,
        border:'1px solid ' + (isSel ? cs.accent + '66' : '#EDECEA'),
        background: isSel ? cs.bg : '#FAFAF8',
        cursor:'pointer',
        display:'flex', flexDirection:'column', gap:4,
        flex:1,
        transition:'border-color 0.12s, background 0.12s',
      }}
      onMouseEnter={e => { if (!isSel) { e.currentTarget.style.background='#F5F4F0'; e.currentTarget.style.borderColor='#D8D5D0'; } }}
      onMouseLeave={e => { e.currentTarget.style.background = isSel ? cs.bg : '#FAFAF8'; e.currentTarget.style.borderColor = isSel ? cs.accent+'66' : '#EDECEA'; }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#1A1F3C', lineHeight:1.3, flex:1 }}>{v.vendor}</span>
        <span style={{ fontSize:9, color:'#C8C6C0', marginTop:2, flexShrink:0 }}>›</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <span style={{ fontSize:15, fontWeight:800, color:cs.accent, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>
          {fmt.k(impact)}
        </span>
        <span style={{ fontSize:9, fontWeight:700, color:cs.accent, background:cs.accent+'18', padding:'3px 8px', borderRadius:3, whiteSpace:'nowrap' }}>
          {cs.label}
        </span>
      </div>
      <div style={{ fontSize:9, color:'#C8C6C0', fontVariantNumeric:'tabular-nums' }}>
        {fmt.k(v.forecast)} forecast
      </div>
    </div>
  );
}

function VendorMatrix({ vendors, onSelect, selected }) {
  const [expanded, setExpanded] = useStateV(false);

  const realVendors = useMemoV(() => vendors.filter(v => isRealVendor(v.vendor)), [vendors]);

  const { allRisks, allOpps } = useMemoV(() => {
    const allRisks = [...realVendors].filter(v => v.net > 100).sort((a,b) => b.net - a.net);
    const allOpps  = [...realVendors].filter(v => v.net < -100).sort((a,b) => a.net - b.net);
    return { allRisks, allOpps };
  }, [realVendors]);

  const SHOW = 6;
  const risks = expanded ? allRisks.slice(0, 8) : allRisks.slice(0, SHOW);
  const opps  = expanded ? allOpps.slice(0, 8)  : allOpps.slice(0, SHOW);
  const remRisks = Math.max(0, allRisks.length - SHOW);
  const remOpps  = Math.max(0, allOpps.length  - SHOW);

  const RISK_CS = { accent:'#C03A3A', bg:'#FDF0F0', label:'Net Risk' };
  const OPP_CS  = { accent:'#1F7A4D', bg:'#EFF7F3', label:'Net Opportunity' };

  return (
    <div className="card" style={{ padding:'18px 18px 14px', display:'flex', flexDirection:'column', gap:10 }}>
      {/* Header */}
      <div>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#9E9B97', marginBottom:3 }}>
          Vendors Requiring Attention
        </div>
        <div style={{ fontSize:10, color:'#C8C6C0' }}>Largest risk and opportunity drivers · click for detail</div>
      </div>

      {/* Shared grid — row heights are synchronized so left/right cards always match */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gridAutoRows:'auto', gap:'4px 10px', alignItems:'stretch' }}>
        {/* Column headers span their own row */}
        <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', color:'#C03A3A', paddingBottom:2 }}>Top Net Risks</div>
        <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', color:'#1F7A4D', paddingBottom:2 }}>Top Net Opportunities</div>

        {/* Paired rows */}
        {Array.from({ length: Math.max(risks.length, opps.length) }).map((_, i) => [
          risks[i]
            ? <AttentionCard key={'r'+i} v={risks[i]} colorScheme={RISK_CS} onSelect={onSelect} selected={selected} />
            : <div key={'re'+i} />,
          opps[i]
            ? <AttentionCard key={'o'+i} v={opps[i]} colorScheme={OPP_CS} onSelect={onSelect} selected={selected} />
            : <div key={'oe'+i} />,
        ])}
      </div>

      {/* Summary footer */}
      {(remRisks > 0 || remOpps > 0) && !expanded && (
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          paddingTop:10, borderTop:'1px solid #EDECEA', gap:12,
        }}>
          <div style={{ display:'flex', gap:16 }}>
            {remRisks > 0 && (
              <span style={{ fontSize:10, color:'#9E9B97' }}>
                <span style={{ fontWeight:700, color:'#C03A3A' }}>{remRisks}</span> more risk {remRisks === 1 ? 'vendor' : 'vendors'}
              </span>
            )}
            {remOpps > 0 && (
              <span style={{ fontSize:10, color:'#9E9B97' }}>
                <span style={{ fontWeight:700, color:'#1F7A4D' }}>{remOpps}</span> more {remOpps === 1 ? 'opportunity' : 'opportunities'}
              </span>
            )}
          </div>
          <button
            onClick={() => setExpanded(true)}
            style={{
              background:'none', border:'1px solid #D8D5D0', borderRadius:4,
              padding:'5px 12px', fontSize:10, fontWeight:600, color:'#807E7A',
              cursor:'pointer', whiteSpace:'nowrap',
              transition:'border-color 0.12s, color 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#333C66'; e.currentTarget.style.color='#333C66'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#D8D5D0'; e.currentTarget.style.color='#807E7A'; }}
          >
            View all vendor drivers
          </button>
        </div>
      )}

      {expanded && (
        <div style={{ paddingTop:12, borderTop:'1px solid #EDECEA', textAlign:'right' }}>
          <button
            onClick={() => setExpanded(false)}
            style={{
              background:'none', border:'none', fontSize:10, fontWeight:600,
              color:'#9E9B97', cursor:'pointer', padding:0,
            }}
          >
            Show less ↑
          </button>
        </div>
      )}
    </div>
  );
}
function VendorSunburst({ vendors, onSelect, selected, zoomed, onZoom }) {
  const items = useMemoV(() => {
    const catMap = {};
    vendors.forEach(v => {
      (v.lineItems || []).forEach(li => {
        const cat = li.subCategory || li.category || 'Other';
        const fc  = (li.monthlyFC || []).reduce((s,x) => s + x, 0);
        if (fc < 1) return;
        if (!catMap[cat]) catMap[cat] = { cat, variance: 0, vendorMap: {} };
        catMap[cat].variance += fc;
        const vn = v.vendor;
        if (!isRealVendor(vn)) return;
        if (!catMap[cat].vendorMap[vn]) catMap[cat].vendorMap[vn] = { name: vn, variance: 0, contracts: [] };
        catMap[cat].vendorMap[vn].variance += fc;
        catMap[cat].vendorMap[vn].contracts.push({
          name: li.application || li.project || li.subCategory || 'Line item',
          variance: fc,
          notes: li.notes || '',
        });
      });
    });
    return Object.values(catMap)
      .map(c => ({ ...c, vendors: Object.values(c.vendorMap).sort((a,b) => b.variance - a.variance) }))
      .sort((a,b) => b.variance - a.variance);
  }, [vendors]);

  function handleVendorClick(vendorName) {
    const v = vendors.find(v => v.vendor === vendorName);
    if (v) onSelect(v);
  }

  const total = items.reduce((s,c) => s + c.variance, 0);
  if (!total) return null;

  return (
    <div className="card" style={{ padding:'18px 22px', display:'flex', flexDirection:'column' }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#9E9B97', marginBottom:4 }}>
        Forecast Spend by Category &amp; Vendor
      </div>
      <div style={{ fontSize:11, color:'#C8C6C0', marginBottom:14 }}>Click a category to drill into vendors · Click a vendor to open detail</div>
      <SunburstView
        items={items}
        totalAmount={total}
        centerSign=""
        centerColor="#333C66"
        centerLabel="Vendor Forecast"
        diverging={false}
        size={600}
        hideLegend={true}
        lightBack={true}
        onVendorClick={handleVendorClick}
        zoomed={zoomed}
        onZoom={onZoom}
        highlightVendor={selected?.vendor}
        singleRing={true}
        sqrtScale={true}
      />
      {/* Compact stats strip */}
      {items.length > 0 && (
        <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid #EDECEA', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {[
            ['Total Forecast', fmt.m2(total)],
            ['Largest Category', items[0]?.cat || '—'],
            ['Vendors Shown', vendors.filter(v => isRealVendor(v.vendor)).length],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'#9E9B97', marginBottom:3 }}>{label}</div>
              <div style={{ fontSize:13, fontWeight:800, color:'#333C66', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Inline Vendor Detail ─────────────────────────────────────────────────
function VendorDetail({ vendor: v, onClose }) {
  const [showItems, setShowItems] = React.useState(false);
  const st = vendorStatus(v);
  const consumed = v.budget > 0 ? Math.min(v.actual / v.budget * 100, 200) : 0;

  const cats = useMemoV(() => {
    const m = {};
    v.lineItems.forEach(li => {
      const c = li.category || li.subCategory || 'Other';
      if (!m[c]) m[c] = { budget:0, actual:0, forecast:0, net:0 };
      m[c].budget   += li.budget || 0;
      m[c].actual   += (li.monthlyAC || []).reduce((s,x)=>s+x,0);
      m[c].forecast += (li.monthlyFC || []).reduce((s,x)=>s+x,0);
      m[c].net      += li.net || 0;
    });
    return Object.entries(m).sort((a,b) => Math.abs(b[1].forecast) - Math.abs(a[1].forecast));
  }, [v]);

  return (
    <div className="card" style={{ marginTop:16, padding:0, overflow:'hidden', border:'2px solid ' + st.bar + '55' }}>
      {/* Header */}
      <div style={{ background:st.bg, padding:'16px 24px', borderBottom:'1px solid ' + st.bar + '33', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:st.color, marginBottom:4 }}>{st.label}</div>
          <div style={{ fontSize:20, fontWeight:800, color:'#333C66', lineHeight:1.2, marginBottom:4 }}>{v.vendor}</div>
          {v.domains.length > 0 && <div style={{ fontSize:11, color:'#9E9B97' }}>{v.domains.join(' · ')}</div>}
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9E9B97', fontSize:13, fontWeight:600, padding:'4px 8px', display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
          <Icon name="close" size={13} color="#9E9B97" /> close
        </button>
      </div>

      <div style={{ padding:'20px 24px' }}>
        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12, marginBottom:20 }}>
          {[
            ['Budget',     fmt.m2(v.budget)],
            ['Actuals',    fmt.m2(v.actual)],
            ['Forecast',   fmt.m2(v.forecast)],
            ['Remaining',  fmt.m2(v.budget - v.forecast)],
            ['Risk',       v.risk > 100 ? fmt.m2(v.risk) : '—'],
            ['Net',        Math.abs(v.net) > 100 ? fmt.signed2(v.net) : '—'],
          ].map(([l, val], i) => (
            <div key={i} style={{ padding:'12px 14px', background:'#F7F6F2', borderRadius:4 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'#9E9B97', marginBottom:4 }}>{l}</div>
              <div style={{ fontSize:15, fontWeight:800, color: l==='Risk'&&v.risk>100?'#C03A3A': l==='Net'&&v.net<-100?'#1F7A4D': l==='Net'&&v.net>100?'#C03A3A':'#333C66', fontVariantNumeric:'tabular-nums' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Budget consumed bar */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#9E9B97', marginBottom:5 }}>
            <span style={{ fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em' }}>Budget Consumption</span>
            <span>{consumed.toFixed(1)}% consumed</span>
          </div>
          <div style={{ height:8, background:'#EDECEA', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${Math.min(consumed,100)}%`, background: consumed>100?'#C03A3A':st.bar, borderRadius:4 }} />
          </div>
        </div>

        {/* Category breakdown */}
        {cats.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#9E9B97', marginBottom:10 }}>Category Breakdown</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {cats.map(([cat, c]) => (
                <div key={cat} style={{ display:'grid', gridTemplateColumns:'160px 1fr 80px 80px 80px', gap:12, alignItems:'center', fontSize:12 }}>
                  <span style={{ fontWeight:500, color:'#333C66', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{cat}</span>
                  <div style={{ height:4, background:'#EDECEA', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.min(c.forecast/v.forecast*100,100)}%`, background:'#6699FF', borderRadius:2 }} />
                  </div>
                  <span style={{ textAlign:'right', color:'#9E9B97', fontVariantNumeric:'tabular-nums' }}>{fmt.k(c.budget)}</span>
                  <span style={{ textAlign:'right', color:'#333C66', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{fmt.k(c.forecast)}</span>
                  <span style={{ textAlign:'right', color: c.net>100?'#C03A3A':c.net<-100?'#1F7A4D':'#9E9B97', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>
                    {Math.abs(c.net) < 100 ? '—' : fmt.signed(c.net)}
                  </span>
                </div>
              ))}
              <div style={{ display:'grid', gridTemplateColumns:'160px 1fr 80px 80px 80px', gap:12, fontSize:10, color:'#9E9B97', paddingTop:4, borderTop:'1px solid #EDECEA' }}>
                <span></span><span></span>
                <span style={{ textAlign:'right', fontWeight:700 }}>Budget</span>
                <span style={{ textAlign:'right', fontWeight:700 }}>Forecast</span>
                <span style={{ textAlign:'right', fontWeight:700 }}>Net</span>
              </div>
            </div>
          </div>
        )}

        {/* Line items toggle */}
        {v.lineItems.length > 0 && (
          <div style={{ borderTop:'1px solid #EDECEA' }}>
            <button
              onClick={() => setShowItems(o => !o)}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'12px 0', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-sans,-apple-system,sans-serif)', fontSize:11, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'#333C66' }}
            >
              <span>Contract / Project Detail ({v.lineItems.length} line items)</span>
              <span style={{ fontSize:14, color:'#9E9B97', transition:'transform 0.2s', transform:showItems?'rotate(90deg)':'none', display:'inline-block' }}>›</span>
            </button>
            {showItems && (
              <div style={{ paddingBottom:16, overflowX:'auto' }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Application / Project</th>
                      <th>Category</th>
                      <th className="num">Budget</th>
                      <th className="num">Actual</th>
                      <th className="num">Forecast</th>
                      <th className="num">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.lineItems.map((li, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ fontWeight:500, color:'#333C66' }}>{li.application || li.subCategory || '—'}</div>
                          <div className="fs-tiny text-stone">{li.project}</div>
                        </td>
                        <td className="fs-small text-stone">{li.category || li.treatment || '—'}</td>
                        <td className="num">{fmt.k(li.budget)}</td>
                        <td className="num">{fmt.k((li.monthlyAC||[]).reduce((s,x)=>s+x,0))}</td>
                        <td className="num">{fmt.k((li.monthlyFC||[]).reduce((s,x)=>s+x,0))}</td>
                        <td className={`num ${li.net>100?'neg':li.net<-100?'pos':'zero'}`}>{Math.abs(li.net)<1?'—':fmt.signed(li.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── All Vendors Table (expandable) ───────────────────────────────────────
function AllVendorsTable({ vendors, onSelect }) {
  const sorted = useMemoV(() => [...vendors].sort((a,b) => a.vendor.localeCompare(b.vendor)), [vendors]);
  return (
    <div className="card" style={{ padding:0, overflow:'hidden', marginTop:4 }}>
      <table className="tbl">
        <thead>
          <tr>
            <th>Vendor</th>
            <th className="num">Budget</th>
            <th className="num">Actual</th>
            <th className="num">Forecast</th>
            <th className="num">Net</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((v, i) => {
            const st = vendorStatus(v);
            return (
              <tr key={v.vendor} style={{ cursor:'pointer' }} onClick={() => onSelect(v)}>
                <td style={{ fontWeight:500, color:'#333C66' }}>{v.vendor}</td>
                <td className="num">{fmt.k(v.budget)}</td>
                <td className="num">{fmt.k(v.actual)}</td>
                <td className="num">{fmt.k(v.forecast)}</td>
                <td className={`num ${v.net>100?'neg':v.net<-100?'pos':'zero'}`}>{Math.abs(v.net)<100?'—':fmt.signed(v.net)}</td>
                <td><span style={{ fontSize:9, fontWeight:700, color:st.color, background:st.bg, padding:'2px 6px', borderRadius:3 }}>{st.label}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Tab ─────────────────────────────────────────────────────────────
function VendorsTab({ data }) {
  const [selected,       setSelected]       = useStateV(null);
  const [sunburstZoomed, setSunburstZoomed] = useStateV(null);
  const [search,         setSearch]         = useStateV('');
  const [showAll,        setShowAll]        = useStateV(false);
  const detailRef = useRefV(null);

  const vendors = useMemoV(() => data.vendors || [], [data.vendors]);
  // Real vendors only (for KPIs and charts)
  const realVendors = useMemoV(() => vendors.filter(v => isRealVendor(v.vendor)), [vendors]);

  const searchResults = useMemoV(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return realVendors
      .filter(v => v.vendor.toLowerCase().includes(q))
      .sort((a, b) => a.vendor.localeCompare(b.vendor, undefined, { sensitivity: 'base' }))
      .slice(0, 8);
  }, [vendors, search]);

  function handleSelect(v) {
    if (selected?.vendor === v.vendor) {
      setSelected(null);
      setSunburstZoomed(null);
      return;
    }
    setSelected(v);
    setSunburstZoomed(vendorDomCat(v));
    setSearch('');
    setTimeout(() => {
      if (detailRef.current) {
        detailRef.current.scrollIntoView({ behavior:'smooth', block:'start' });
      }
    }, 50);
  }

  return (
    <div>
      {/* Section 1 — KPIs */}
      <VendorKPIs vendors={realVendors} />

      {/* Section 2 & 3 — Sunburst + Matrix equal columns */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:0, alignItems:'start' }}>
        <VendorSunburst vendors={realVendors} onSelect={handleSelect} selected={selected} zoomed={sunburstZoomed} onZoom={setSunburstZoomed} />
        <VendorMatrix   vendors={realVendors} onSelect={handleSelect} selected={selected} />
      </div>

      {/* Search + View All — secondary row */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:14, marginBottom:selected ? 0 : 4 }}>
        <div className="search-box" style={{ position:'relative' }}>
          <Icon name="search" size={13} color="#807E7A" />
          <input
            type="text"
            placeholder="Find a vendor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onBlur={() => setTimeout(() => setSearch(''), 200)}
          />
          {searchResults.length > 0 && (
            <div style={{
              position:'absolute', top:'100%', left:0, zIndex:200,
              background:'#fff', border:'1px solid #EDECEA', borderRadius:6,
              boxShadow:'0 8px 24px rgba(0,0,0,0.12)', minWidth:260, marginTop:4,
            }}>
              {searchResults.map(v => {
                const st = vendorStatus(v);
                return (
                  <div
                    key={v.vendor}
                    onMouseDown={() => handleSelect(v)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', cursor:'pointer', borderBottom:'1px solid #F0EEE9' }}
                    onMouseEnter={e => e.currentTarget.style.background='#F5F4F0'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <div style={{ width:6, height:6, borderRadius:'50%', background:st.dot, flexShrink:0 }} />
                    <span style={{ fontSize:13, fontWeight:500, color:'#333C66', flex:1 }}>{v.vendor}</span>
                    <span style={{ fontSize:11, color:'#9E9B97', fontVariantNumeric:'tabular-nums' }}>{fmt.k(v.forecast)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ flex:1 }} />
        <button
          onClick={() => setShowAll(o => !o)}
          style={{
            background:'none', border:'1px solid #D8D5D0', borderRadius:4,
            padding:'6px 14px', fontSize:11, fontWeight:600, color:'#807E7A',
            cursor:'pointer', display:'flex', alignItems:'center', gap:6,
            transition:'border-color 0.12s, color 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='#333C66'; e.currentTarget.style.color='#333C66'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='#D8D5D0'; e.currentTarget.style.color='#807E7A'; }}
        >
          {showAll ? 'Hide vendor table' : `View all ${realVendors.length} vendors`}
        </button>
      </div>

      {/* All vendors table (hidden by default) */}
      {showAll && <AllVendorsTable vendors={realVendors} onSelect={handleSelect} />}

      {/* Section 4 — Vendor detail (inline, appears when selected) */}
      <div ref={detailRef}>
        {selected && <VendorDetail vendor={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}

window.VendorsTab  = VendorsTab;
