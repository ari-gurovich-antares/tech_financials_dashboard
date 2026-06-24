// drill-panels.jsx — Reconciled drill panels
// Data loaded from drill-data.js (RISK_DATA, OPP_DATA, NET_DATA, FILTER_OPTS)
const { useState: useStateDR, useEffect: useEffectDR } = React;
// Color aliases (SunburstView defined in tab-sunburst.jsx, loaded before this file)
const SB_RED   = '#B23A3A';
const SB_GREEN = '#2F7A4D';

const DRP_SERIF = "'Source Serif 4', Georgia, serif";
const DRP_SANS  = "'Inter', Arial, sans-serif";
const DRP_NAVY  = '#333C66';
const DRP_RED   = '#B23A3A';
const DRP_GREEN = '#2F7A4D';

// Per-category color palette — distinct colors for visual differentiation
const DRILL_CAT_PALETTE = {
  'Labor/ T&M':    '#6699FF',
  'Software':      '#EDAC4B',
  'MS':            '#B088D4',
  'Infrastructure':'#5DB8A2',
  'Hardware':      '#E08070',
  'OOE':           '#C9B54A',
  'Amortization':  '#80BCDC',
  'FPC':           '#72C472',
};
// Color utilities for depth-based lightening
function _drH2H(hex){let r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;if(mx===mn)return[0,0,l*100];const d=mx-mn,s=l>.5?d/(2-mx-mn):d/(mx+mn);let h;switch(mx){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}return[h/6*360,s*100,l*100];}
function _drH2hex(h,s,l){h/=360;s/=100;l/=100;if(s===0){const v=Math.round(l*255);return'#'+[v,v,v].map(x=>x.toString(16).padStart(2,'0')).join('');}const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q,hr=(t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<.5)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};return'#'+[h+1/3,h,h-1/3].map(t=>Math.round(hr(t)*255).toString(16).padStart(2,'0')).join('');}
// depth: 0=category(full strength), 1=vendor(lighter), 2=contract(lightest); idx for subtle per-item variation
function drillCatColor(cat, depth=0, idx=0) {
  const base = DRILL_CAT_PALETTE[cat] || '#8899BB';
  const [h,s,l] = _drH2H(base);
  return _drH2hex(h, Math.max(18, s - 13*depth - 2.5*idx), Math.min(85, l + 15*depth + 3.5*idx));
}
// Diverging color for Net Position bars: negative=favorable(green), positive=unfavorable(red)
// scale = max absolute value at this level; depth 0=category, 1=vendor, 2=contract
function netDivColor(amount, scale, depth) {
  const d   = depth || 0;
  const abs = Math.abs(amount);
  const sc  = Math.max(scale, 1);
  if (abs < sc * 0.03) return `hsl(0,0%,${50 + d*12}%)`; // < 3% of scale → neutral gray
  const t   = Math.min(1, abs / sc);
  const fav = amount < 0;
  const hue = fav ? 138 : 4;
  const sat = Math.max(18, (fav ? 42 + t*28 : 48 + t*26) - d*10);
  const lit = Math.min(82, (fav ? 60 - t*24 : 64 - t*28) + d*13);
  return `hsl(${hue},${sat}%,${lit}%)`;
}

// ── ReconcBadge: shows sum-vs-total diff at every level ─────────────────
function ReconcBadge({ parentLabel, parentAmt, childLabel, childAmt, light }) {
  const diff = Math.abs(parentAmt - childAmt);
  const ok   = diff < 1.0;
  const bg   = light ? 'rgba(255,255,255,0.06)' : '#F4F8F0';
  const col  = ok ? (light ? '#72D4A0' : '#2F7A4D') : '#B23A3A';
  const txt  = light ? 'rgba(255,255,255,0.5)' : '#807E7A';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'5px 10px',
      background:bg, fontSize:11, marginBottom:8, borderRadius:2 }}>
      <span style={{ color:col, fontWeight:700, fontFamily:DRP_SANS, fontSize:13 }}>
        {ok ? '✓' : '!'}
      </span>
      <span style={{ color:txt }}>
        {childLabel}:&nbsp;
        <strong style={{ color:light?'rgba(255,255,255,0.82)':'#333C66', fontVariantNumeric:'tabular-nums' }}>
          {fmt.m(childAmt)}
        </strong>
        &nbsp;
        {ok ? <span style={{ color:col }}>= {parentLabel} ✓</span>
             : <span style={{ color:col }}>≠ {parentLabel} (diff: {fmt.k(diff)})</span>}
      </span>
    </div>
  );
}

// ── HBar: horizontal bar row ─────────────────────────────────────────────
function HBar({ label, amount, maxAmt, color, bgTrack, onClick, selected, signed, leftAccent }) {
  const pct  = maxAmt > 0 ? (Math.abs(amount) / maxAmt) * 76 : 0;
  const fav  = amount < 0;
  const col  = color || (fav ? DRP_GREEN : DRP_RED);
  const sign = signed ? (fav ? '−' : '+') : '';
  return (
    <div onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0 10px 10px',
        borderBottom:'1px solid rgba(255,255,255,0.07)',
        borderLeft: leftAccent ? `3px solid ${leftAccent}` : '3px solid transparent',
        cursor:onClick?'pointer':'default',
        background:selected?'rgba(102,153,255,0.1)':'transparent',
        transition:'background 0.1s' }}>
      <div style={{ width:190, fontSize:13, color:selected?'#fff':'rgba(255,255,255,0.85)',
        fontWeight:selected?600:400, flexShrink:0, display:'flex', alignItems:'center', gap:5 }}>
        {label}
        {onClick && !selected && <span style={{ fontSize:10, opacity:0.3 }}>›</span>}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ height:18, background:bgTrack||'rgba(255,255,255,0.07)', borderRadius:2, position:'relative' }}>
          <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${pct}%`,
            background:col, opacity:0.75, borderRadius:2, transition:'width 0.3s' }} />
        </div>
      </div>
      <div style={{ width:80, textAlign:'right', fontSize:13, fontWeight:600,
        color:col, fontVariantNumeric:'tabular-nums', fontFamily:DRP_SANS, flexShrink:0 }}>
        {sign}{fmt.k(Math.abs(amount))}
      </div>
    </div>
  );
}



// ── KPIDrillPanel: sunburst (left) + analytical drilldown (right) ─────
function KPIDrillPanel({ mode, rawData, onClose }) {
  const [selCat,    setSelCat]    = useStateDR(null);
  const [selVendor, setSelVendor] = useStateDR(null);

  const pickCat    = c => { setSelCat(c);  setSelVendor(null); };
  const pickVendor = v => setSelVendor(v);

  const isRisk  = mode === 'risk';
  // Always use dynamically built hierarchy from uploaded workbook lineItems.
  // Empty fallback ensures no stale drill-data.js constant is ever served.
  if (!rawData) console.warn('[KPIDrillPanel] WARNING: static fallback data used — uploaded workbook data was not provided.');
  const raw     = rawData || { total: 0, categories: [] };
  const sign    = isRisk ? '+' : '−';
  const accent  = isRisk ? SB_RED : SB_GREEN;
  const hdBg    = isRisk ? '#5A1E1E' : '#1A4A2A';
  const bodyBg  = isRisk ? '#18100E' : '#0E1812';
  const eyebrow = isRisk ? 'risk · downside exposure' : 'opportunities · favorable upside';
  const kpiLbl  = isRisk ? 'Total Risk' : 'Total Opportunity';

  const items = raw.categories.map(c => ({
    cat: c.cat, variance: isRisk ? c.amount : -c.amount,
    vendors: c.vendors.map(v => ({
      name: v.name, variance: isRisk ? v.amount : -v.amount,
      contracts: v.contracts.map(ct => ({ name:ct.name, variance:isRisk?ct.amount:-ct.amount, notes:ct.notes })),
    })),
  }));

  const catData    = selCat    ? raw.categories.find(c=>c.cat===selCat)         : null;
  const vendorData = selVendor ? catData?.vendors.find(v=>v.name===selVendor)   : null;
  const maxCat     = raw.categories.length ? Math.max(...raw.categories.map(c=>c.amount),1) : 1;
  const maxVend    = catData?.vendors.length ? Math.max(...catData.vendors.map(v=>v.amount),1) : 1;
  const maxContr   = vendorData?.contracts.length ? Math.max(...vendorData.contracts.map(c=>Math.abs(c.amount)),1) : 1;
  const catSum     = raw.categories.reduce((s,c)=>s+c.amount,0);
  const vendorSum  = catData ? catData.vendors.reduce((s,v)=>s+v.amount,0) : 0;
  const contrSum   = vendorData ? vendorData.contracts.reduce((s,c)=>s+c.amount,0) : 0;

  const diff = Math.abs(raw.total - catSum);

  return (
    <div className="drill-overlay" onClick={onClose}>
      <div className="drill-panel drill-panel-wide" onClick={e=>e.stopPropagation()}
        style={{ display:'flex', flexDirection:'column', background:bodyBg, overflow:'hidden' }}>

        {/* Header */}
        <div style={{ background:hdBg, padding:'18px 24px', flexShrink:0, position:'relative' }}>
          <button className="drill-close" onClick={onClose}>✕ close</button>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.22em', fontFamily:DRP_SERIF,
            color:'rgba(255,255,255,0.48)', marginBottom:4, textTransform:'lowercase' }}>{eyebrow}</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:14 }}>
            <div style={{ fontFamily:DRP_SERIF, fontWeight:600, fontSize:26, color:'#fff' }}>
              {isRisk?'Risk Analysis':'Opportunity Analysis'}
            </div>
            <div style={{ fontFamily:DRP_SERIF, fontWeight:600, fontSize:28, color:accent, fontVariantNumeric:'tabular-nums' }}>
              {sign}{fmt.m(raw.total)}
            </div>
            <div style={{ fontSize:11, color:diff<1?'#72D4A0':'#E87878' }}>
              {diff<1?'✓ reconciled':'! diff '+fmt.k(diff)}
            </div>
          </div>
        </div>

        {/* Body — left: sunburst | right: drilldown tables */}
        <div style={{ flex:1, overflow:'hidden', display:'flex', minHeight:0 }}>

          {/* LEFT: Sunburst */}
          <div style={{ width:430, flexShrink:0, borderRight:'1px solid rgba(255,255,255,0.08)',
            overflow:'auto', padding:'16px 8px' }}>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase',
              color:'rgba(255,255,255,0.36)', fontFamily:DRP_SERIF, marginBottom:8, paddingLeft:8 }}>
              Navigate by clicking
            </div>
            <SunburstView
              items={items} totalAmount={raw.total}
              centerSign={sign} centerColor={accent} centerLabel={kpiLbl}
              isDark={true} size={360}
              zoomed={selCat} onZoom={pickCat}
              hideLegend={true}
            />
          </div>

          {/* RIGHT: Analytical drilldown */}
          <div style={{ flex:1, overflow:'auto', padding:'16px 20px' }}>

            {/* Breadcrumb */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, fontSize:12 }}>
              <button onClick={()=>pickCat(null)} style={{ background:'none', border:'none',
                color:selCat?accent:'#fff', cursor:selCat?'pointer':'default',
                fontFamily:DRP_SANS, fontSize:12, fontWeight:selCat?600:400, padding:0 }}>
                {kpiLbl}
              </button>
              {selCat && <><span style={{ color:'rgba(255,255,255,0.3)' }}>›</span>
                <button onClick={()=>pickVendor(null)} style={{ background:'none', border:'none',
                  color:selVendor?accent:'#fff', cursor:selVendor?'pointer':'default',
                  fontFamily:DRP_SANS, fontSize:12, fontWeight:selVendor?600:400, padding:0 }}>
                  {selCat}
                </button></>}
              {selVendor && <><span style={{ color:'rgba(255,255,255,0.3)' }}>›</span>
                <span style={{ fontSize:12, color:'#fff' }}>{selVendor}</span></>}
            </div>

            {/* LEVEL 1: Categories */}
            {!selCat && (<div>
              <ReconcBadge parentLabel={kpiLbl} parentAmt={raw.total}
                childLabel="Sum of categories" childAmt={catSum} light />
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.2em', fontFamily:DRP_SERIF,
                  color:'rgba(255,255,255,0.35)', textTransform:'lowercase' }}>
                  by category — click to see vendors
                </div>
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase',
                  background:isRisk?'rgba(178,58,58,0.2)':'rgba(47,122,77,0.2)',
                  color:isRisk?'#E87878':'#72D4A0',
                  border:`1px solid ${isRisk?'rgba(178,58,58,0.38)':'rgba(47,122,77,0.38)'}`,
                  borderRadius:3, padding:'2px 7px' }}>
                  {isRisk ? '▲ Risk' : '↓ Opp'}
                </span>
              </div>
              {raw.categories.map(c=>(
                <HBar key={c.cat} label={c.cat} amount={c.amount} maxAmt={maxCat}
                  color={drillCatColor(c.cat)} onClick={()=>pickCat(c.cat)} selected={selCat===c.cat}
                  leftAccent={isRisk ? 'rgba(178,58,58,0.6)' : 'rgba(47,122,77,0.6)'} />
              ))}
            </div>)}

            {/* LEVEL 2: Vendors */}
            {selCat && !selVendor && catData && (<div>
              <ReconcBadge parentLabel={selCat} parentAmt={catData.amount}
                childLabel="Sum of vendors" childAmt={vendorSum} light />
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.2em', fontFamily:DRP_SERIF,
                  color:'rgba(255,255,255,0.35)', textTransform:'lowercase' }}>
                  {selCat} · vendor breakdown — click to see contracts
                </div>
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase',
                  background:isRisk?'rgba(178,58,58,0.2)':'rgba(47,122,77,0.2)',
                  color:isRisk?'#E87878':'#72D4A0',
                  border:`1px solid ${isRisk?'rgba(178,58,58,0.38)':'rgba(47,122,77,0.38)'}`,
                  borderRadius:3, padding:'2px 7px' }}>
                  {isRisk ? '▲ Risk' : '↓ Opp'}
                </span>
              </div>
              {catData.vendors.map((v,vi)=>(
                <HBar key={v.name} label={v.name} amount={v.amount} maxAmt={maxVend}
                  color={drillCatColor(selCat, 1, vi)}
                  leftAccent={isRisk ? 'rgba(178,58,58,0.4)' : 'rgba(47,122,77,0.4)'}
                  onClick={v.contracts.length>0?()=>pickVendor(v.name):null} />
              ))}
            </div>)}

            {/* LEVEL 3: Contracts + notes */}
            {selVendor && vendorData && (<div>
              <ReconcBadge parentLabel={selVendor.split(' ').slice(0,2).join(' ')}
                parentAmt={vendorData.amount} childLabel="Sum of contracts" childAmt={contrSum} light />
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.2em', fontFamily:DRP_SERIF,
                  color:'rgba(255,255,255,0.35)', textTransform:'lowercase' }}>
                  {selVendor} · contract detail
                </div>
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase',
                  background:isRisk?'rgba(178,58,58,0.2)':'rgba(47,122,77,0.2)',
                  color:isRisk?'#E87878':'#72D4A0',
                  border:`1px solid ${isRisk?'rgba(178,58,58,0.38)':'rgba(47,122,77,0.38)'}`,
                  borderRadius:3, padding:'2px 7px' }}>
                  {isRisk ? '▲ Risk' : '↓ Opp'}
                </span>
              </div>
              {vendorData.contracts.map((c,i)=>(
                <div key={i} style={{ padding:'10px 0 10px 10px', borderBottom:'1px solid rgba(255,255,255,0.07)',
                  borderLeft:`3px solid ${isRisk?'rgba(178,58,58,0.35)':'rgba(47,122,77,0.35)'}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.85)', flex:1, paddingRight:12 }}>{c.name}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:drillCatColor(selCat, 2, i),
                      fontVariantNumeric:'tabular-nums', fontFamily:DRP_SANS, flexShrink:0 }}>
                      {sign}{fmt.k(c.amount)}
                    </div>
                  </div>
                  <div style={{ height:6, background:'rgba(255,255,255,0.07)', borderRadius:2, marginBottom:6 }}>
                    <div style={{ height:'100%', width:`${(c.amount/maxContr)*100}%`,
                      background:drillCatColor(selCat, 2, i), opacity:0.85, borderRadius:2 }} />
                  </div>
                  {c.notes && <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', lineHeight:1.5 }}>{c.notes}</div>}
                </div>
              ))}
            </div>)}

          </div>
        </div>
      </div>
    </div>
  );
}

// ── NetDrillPanel: sunburst (left) + net position drilldown (right) ───
function NetDrillPanel({ onClose, rawData }) {
  const [selCat,    setSelCat]    = useStateDR(null);
  const [selVendor, setSelVendor] = useStateDR(null);
  const pickCat    = c => { setSelCat(c); setSelVendor(null); };
  const pickVendor = v => setSelVendor(v);

  // Always use dynamically built hierarchy from uploaded workbook lineItems.
  if (!rawData) console.warn('[NetDrillPanel] WARNING: static fallback data used — uploaded workbook data was not provided.');
  const netSrc = rawData || { total: 0, categories: [] };
  const items = netSrc.categories.map(c=>({
    cat:c.cat, variance:c.amount,
    vendors:c.vendors.map(v=>({
      name:v.name, variance:v.amount,
      contracts:v.contracts.map(ct=>({ name:ct.name, variance:ct.amount, notes:ct.notes||'' })),
    })),
  }));

  const catData    = selCat    ? netSrc.categories.find(c=>c.cat===selCat)       : null;
  const vendorData = selVendor ? catData?.vendors.find(v=>v.name===selVendor)       : null;
  const maxCat     = netSrc.categories.length ? Math.max(...netSrc.categories.map(c=>Math.abs(c.amount)),1) : 1;
  const maxVend    = catData?.vendors.length ? Math.max(...catData.vendors.map(v=>Math.abs(v.amount)),1) : 1;
  const maxContr   = vendorData?.contracts.length ? Math.max(...vendorData.contracts.map(c=>Math.abs(c.amount)),1) : 1;
  const catSum     = netSrc.categories.reduce((s,c)=>s+c.amount,0);
  const vendorSum  = catData ? catData.vendors.reduce((s,v)=>s+v.amount,0) : 0;
  const contrSum   = vendorData ? vendorData.contracts.reduce((s,c)=>s+c.amount,0) : 0;
  const diff       = Math.abs(netSrc.total - catSum);
  const netFav     = netSrc.total < 0;
  const netAccent  = netFav ? '#72D4A0' : '#E87878';

  function netColor(amt) { return amt<0?'#72D4A0':'#E87878'; }
  function netSign(amt)  { return amt<0?'−':'+'; }

  return (
    <div className="drill-overlay" onClick={onClose}>
      <div className="drill-panel drill-panel-wide" onClick={e=>e.stopPropagation()}
        style={{ display:'flex', flexDirection:'column', background:'#111827', overflow:'hidden' }}>

        {/* Header */}
        <div className="drill-head" style={{ flexShrink:0, padding:'18px 24px' }}>
          <button className="drill-close" onClick={onClose}>✕ close</button>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.22em', fontFamily:DRP_SERIF,
            color:'rgba(255,255,255,0.52)', marginBottom:4, textTransform:'lowercase' }}>
            net opp/risk position · reconciled hierarchy
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:14 }}>
            <div style={{ fontFamily:DRP_SERIF, fontWeight:600, fontSize:26, color:'#fff' }}>
              Net Position Analysis
            </div>
            <div style={{ fontFamily:DRP_SERIF, fontWeight:600, fontSize:28, color:netAccent, fontVariantNumeric:'tabular-nums' }}>
              {netFav?'−':'+'}{fmt.m(Math.abs(netSrc.total))}
            </div>
            <div style={{ fontSize:11, color:diff<1?'#72D4A0':'#E87878' }}>
              {diff<1?'✓ reconciled':'! diff '+fmt.k(diff)}
            </div>
          </div>
        </div>

        {/* Body — left: sunburst | right: drilldown */}
        <div style={{ flex:1, overflow:'hidden', display:'flex', minHeight:0 }}>

          {/* LEFT: Sunburst */}
          <div style={{ width:430, flexShrink:0, borderRight:'1px solid rgba(255,255,255,0.08)',
            overflow:'auto', padding:'16px 8px' }}>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase',
              color:'rgba(255,255,255,0.36)', fontFamily:DRP_SERIF, marginBottom:8, paddingLeft:8 }}>
              Navigate by clicking
            </div>
            <SunburstView
              items={items} totalAmount={Math.abs(netSrc.total)}
              centerSign={netFav?'−':'+'} centerColor={netAccent} centerLabel="Net Position"
              isDark={true} size={360}
              zoomed={selCat} onZoom={pickCat}
              diverging={true}
              hideLegend={true}
            />
          </div>

          {/* RIGHT: Analytical drilldown */}
          <div style={{ flex:1, overflow:'auto', padding:'16px 20px' }}>

            {/* Breadcrumb */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, fontSize:12 }}>
              <button onClick={()=>pickCat(null)} style={{ background:'none', border:'none',
                color:selCat?netAccent:'#fff', cursor:selCat?'pointer':'default',
                fontFamily:DRP_SANS, fontSize:12, fontWeight:selCat?600:400, padding:0 }}>
                Net Position
              </button>
              {selCat && <><span style={{ color:'rgba(255,255,255,0.3)' }}>›</span>
                <button onClick={()=>pickVendor(null)} style={{ background:'none', border:'none',
                  color:selVendor?netAccent:'#fff', cursor:selVendor?'pointer':'default',
                  fontFamily:DRP_SANS, fontSize:12, fontWeight:selVendor?600:400, padding:0 }}>
                  {selCat}
                </button></>}
              {selVendor && <><span style={{ color:'rgba(255,255,255,0.3)' }}>›</span>
                <span style={{ fontSize:12, color:'#fff' }}>{selVendor}</span></>}
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12, flexWrap:'wrap' }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.5 }}>+ unfavorable · − favorable</div>
              <div style={{ display:'flex', gap:10 }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, color:'rgba(255,255,255,0.45)' }}>
                  <span style={{ width:10, height:10, borderRadius:2, background:'rgba(232,120,120,0.85)', display:'inline-block', flexShrink:0 }}></span>
                  unfavorable
                </span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, color:'rgba(255,255,255,0.45)' }}>
                  <span style={{ width:10, height:10, borderRadius:2, background:'rgba(114,212,160,0.85)', display:'inline-block', flexShrink:0 }}></span>
                  favorable
                </span>
              </div>
            </div>

            {/* LEVEL 1: Categories */}
            {!selCat && (<div>
              <ReconcBadge parentLabel="Net KPI" parentAmt={netSrc.total}
                childLabel="Sum of categories" childAmt={catSum} light />
              {netSrc.categories.map(c=>(
                <HBar key={c.cat} label={c.cat} amount={c.amount} maxAmt={maxCat}
                  color={netDivColor(c.amount, maxCat)} signed onClick={()=>pickCat(c.cat)}
                  leftAccent={c.amount < 0 ? 'rgba(114,212,160,0.7)' : c.amount > 0 ? 'rgba(232,120,120,0.7)' : 'rgba(255,255,255,0.2)'} />
              ))}
            </div>)}

            {/* LEVEL 2: Vendors */}
            {selCat && !selVendor && catData && (<div>
              <ReconcBadge parentLabel={selCat} parentAmt={catData.amount}
                childLabel="Sum of vendors" childAmt={vendorSum} light />
              {catData.vendors.map((v,vi)=>(
                <HBar key={v.name} label={v.name} amount={v.amount} maxAmt={maxVend}
                  color={netDivColor(v.amount, maxVend, 1)} signed
                  leftAccent={v.amount < 0 ? 'rgba(114,212,160,0.55)' : v.amount > 0 ? 'rgba(232,120,120,0.55)' : 'rgba(255,255,255,0.2)'}
                  onClick={v.contracts.length>0?()=>pickVendor(v.name):null} />
              ))}
            </div>)}

            {/* LEVEL 3: Contracts */}
            {selVendor && vendorData && (<div>
              <ReconcBadge parentLabel={selVendor.split(' ').slice(0,2).join(' ')}
                parentAmt={vendorData.amount} childLabel="Sum of contracts" childAmt={contrSum} light />
              {vendorData.contracts.map((c,i)=>(
                <div key={i} style={{ padding:'10px 0 10px 10px', borderBottom:'1px solid rgba(255,255,255,0.07)',
                  borderLeft:`3px solid ${c.amount<0?'rgba(114,212,160,0.45)':c.amount>0?'rgba(232,120,120,0.45)':'rgba(255,255,255,0.18)'}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.85)', flex:1, paddingRight:12 }}>{c.name}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:netColor(c.amount),
                      fontVariantNumeric:'tabular-nums', fontFamily:DRP_SANS, flexShrink:0 }}>
                      {netSign(c.amount)}{fmt.k(Math.abs(c.amount))}
                    </div>
                  </div>
                  <div style={{ height:6, background:'rgba(255,255,255,0.07)', borderRadius:2, marginBottom:c.notes?6:0 }}>
                    <div style={{ height:'100%', width:`${(Math.abs(c.amount)/maxContr)*100}%`,
                      background:netDivColor(c.amount, maxContr, 2), opacity:0.9, borderRadius:2 }} />
                  </div>
                  {c.notes && <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', lineHeight:1.5 }}>{c.notes}</div>}
                </div>
              ))}
            </div>)}

          </div>
        </div>
      </div>
    </div>
  );
}

// ── VarianceExplorerPanel (budget→forecast variance) ─────────────────────
// Accessed via "Explore Variance" button in category chart — separate from Net KPI drill
const VAR_DATA = [
  {
    "cat": "Labor/ T&M",
    "variance": 1761250,
    "vendors": [
      {
        "name": "Intelligent Business Platforms LLC",
        "variance": 916752,
        "contracts": [
          {
            "name": "T&M — T&M",
            "budget": 0,
            "forecast": 940800,
            "actual": 0,
            "risk": 940800,
            "opp": 0,
            "notes": "T&M- H2-2026 Risk",
            "monthly": [
              0,
              0,
              0,
              0,
              0,
              0,
              157,
              157,
              157,
              157,
              157,
              157
            ]
          },
          {
            "name": "T&M — T&M",
            "budget": 940800,
            "forecast": 916752,
            "actual": 446352,
            "risk": 0,
            "opp": -24048,
            "notes": "T&M - Intellibus",
            "monthly": [
              157,
              157,
              157,
              157,
              157,
              157,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "Indus Valley Partners Corporation",
        "variance": 807200,
        "contracts": [
          {
            "name": "Prj Mgmt T&M — T&M",
            "budget": 0,
            "forecast": 528000,
            "actual": 0,
            "risk": 528000,
            "opp": 0,
            "notes": "T&M IVP Mgmt (TOM)- Rahul & Vaibhav + 2 for H2-2026 - Risk",
            "monthly": [
              0,
              0,
              0,
              0,
              0,
              0,
              88,
              88,
              88,
              88,
              88,
              88
            ]
          },
          {
            "name": "Prj Mgmt T&M — T&M",
            "budget": 216000,
            "forecast": 495200,
            "actual": 143200,
            "risk": 279200,
            "opp": 0,
            "notes": "T&M IVP Mgmt (TOM)- Rahul & Vaibhav + 2",
            "monthly": [
              88,
              88,
              88,
              88,
              88,
              88,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "Andersen Tax Holdings",
        "variance": 95033,
        "contracts": [
          {
            "name": "T&M",
            "budget": 0,
            "forecast": 71440,
            "actual": 0,
            "risk": 71440,
            "opp": 0,
            "notes": "Swati Yadav",
            "monthly": [
              0,
              0,
              4,
              8,
              8,
              8,
              8,
              8,
              8,
              8,
              8,
              8
            ]
          },
          {
            "name": "T&M",
            "budget": 0,
            "forecast": 37224,
            "actual": 7144,
            "risk": 37224,
            "opp": 0,
            "notes": "Danny's extra 1Rivet HC - Risk",
            "monthly": [
              0,
              0,
              8,
              8,
              8,
              8,
              8,
              0,
              0,
              0,
              0,
              0
            ]
          },
          {
            "name": "T&M",
            "budget": 1505280,
            "forecast": 1471496,
            "actual": 342536,
            "risk": 0,
            "opp": -33784,
            "notes": "Support SOW + Desktop Support- T&M, QA is not part of our budget",
            "monthly": [
              125,
              125,
              125,
              125,
              125,
              125,
              125,
              125,
              125,
              125,
              125,
              125
            ]
          },
          {
            "name": "T&M",
            "budget": 414080,
            "forecast": 443578,
            "actual": 96538,
            "risk": 29498,
            "opp": 0,
            "notes": "Support SOW + Desktop Support- T&M, QA is not part of our budget",
            "monthly": [
              39,
              39,
              39,
              39,
              39,
              39,
              39,
              39,
              39,
              39,
              39,
              39
            ]
          },
          {
            "name": "T&M",
            "budget": 1438080,
            "forecast": 1426303,
            "actual": 347743,
            "risk": 0,
            "opp": -11777,
            "notes": "Support SOW + Desktop Support- T&M, QA is not part of our budget",
            "monthly": [
              120,
              120,
              120,
              120,
              120,
              120,
              120,
              120,
              120,
              120,
              120,
              120
            ]
          },
          {
            "name": "T&M",
            "budget": 291840,
            "forecast": 294272,
            "actual": 75392,
            "risk": 2432,
            "opp": 0,
            "notes": "Support SOW + Desktop Support- T&M, QA is not part of our budget",
            "monthly": [
              24,
              24,
              24,
              24,
              24,
              24,
              24,
              24,
              24,
              24,
              24,
              24
            ]
          }
        ]
      },
      {
        "name": "Coforge DPA NA Inc.",
        "variance": -52195,
        "contracts": [
          {
            "name": "T&M",
            "budget": 403200,
            "forecast": 512243,
            "actual": 209843,
            "risk": 109043,
            "opp": 0,
            "notes": "T&M - [KA - Feb 23] - Forcast updated from Feb to Dec, based on Raymond's exit. This T&M forecast is adjusted in the new QA contract. Adjusted monthly rate starting Apr based on Shanky's exit",
            "monthly": [
              34,
              34,
              34,
              34,
              34,
              34,
              34,
              34,
              34,
              34,
              34,
              34
            ]
          },
          {
            "name": "T&M",
            "budget": 600000,
            "forecast": 514000,
            "actual": 67600,
            "risk": 0,
            "opp": -86000,
            "notes": "T&M - [KA - Feb 23] - Forcast updated from Feb to Dec, based on Raymond's exit. This T&M forecast is adjusted in the new QA contract. Adjusted monthly rate starting Apr based on Shanky's exit",
            "monthly": [
              50,
              24,
              24,
              24,
              53,
              53,
              53,
              53,
              53,
              53,
              53,
              53
            ]
          },
          {
            "name": "T&M",
            "budget": 161280,
            "forecast": 84992,
            "actual": 36032,
            "risk": 0,
            "opp": -76288,
            "notes": "T&M - [KA - Feb 23] - Forcast updated from Feb to Dec, based on Raymond's exit. This T&M forecast is adjusted in the new QA contract. Adjusted monthly rate starting Apr based on Shanky's exit",
            "monthly": [
              13,
              13,
              13,
              5,
              5,
              5,
              5,
              5,
              5,
              5,
              5,
              5
            ]
          },
          {
            "name": "T&M",
            "budget": 252000,
            "forecast": 253050,
            "actual": 64050,
            "risk": 1050,
            "opp": 0,
            "notes": "T&M - [KA - Feb 23] - Forcast updated from Feb to Dec, based on Raymond's exit. This T&M forecast is adjusted in the new QA contract. Adjusted monthly rate starting Apr based on Shanky's exit",
            "monthly": [
              21,
              21,
              21,
              21,
              21,
              21,
              21,
              21,
              21,
              21,
              21,
              21
            ]
          }
        ]
      },
      {
        "name": "Cognizant Worldwide Limited",
        "variance": -5540,
        "contracts": [
          {
            "name": "D365 CRM — T&M",
            "budget": 218880,
            "forecast": 213340,
            "actual": 49180,
            "risk": 0,
            "opp": -5540,
            "notes": "T&M",
            "monthly": [
              18,
              18,
              18,
              18,
              18,
              18,
              18,
              18,
              18,
              18,
              18,
              18
            ]
          }
        ]
      }
    ]
  },
  {
    "cat": "Software",
    "variance": 772434,
    "vendors": [
      {
        "name": "Finastra Technology, Inc",
        "variance": 456079,
        "contracts": [
          {
            "name": "LIQ - Loan IQ — Support - Prod Support for Ops Apps",
            "budget": 3617396,
            "forecast": 4073475,
            "actual": 4073475,
            "risk": 456079,
            "opp": 0,
            "notes": "Recurring License Fee/Maintenance for the period 1-Jan-2026 to 14-Jan-2026 and Subscription Fees for the period 15-Jan-2026 to 14-Jan-2027",
            "monthly": [
              334,
              334,
              334,
              334,
              334,
              334,
              334,
              334,
              334,
              334,
              334,
              334
            ]
          }
        ]
      },
      {
        "name": "MARKIT NORTH AMERICA, INC.",
        "variance": 232488,
        "contracts": [
          {
            "name": "Support - Prod Support for Ops Apps",
            "budget": 0,
            "forecast": 232488,
            "actual": 232488,
            "risk": 232488,
            "opp": 0,
            "notes": "WSO Web Services - Subs/ WSO Web/AUM/SubVar- Potential Risk",
            "monthly": [
              0,
              0,
              0,
              232,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "Indus Valley Partners Corporation",
        "variance": -215776,
        "contracts": [
          {
            "name": "Polaris/EDM/SecMast Core — Support - Data Analytics Office",
            "budget": 1051186,
            "forecast": 835410,
            "actual": 835410,
            "risk": 0,
            "opp": -215776,
            "notes": "IVP EDM, Polaris, Security Master Year 3 SaaS Fees/ Production License Fee + Annual Consulting Fee for IVP EDM, Polaris, Security Master-Prepaid",
            "monthly": [
              103,
              81,
              81,
              81,
              81,
              81,
              81,
              81,
              81,
              81,
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "PactFi Inc.",
        "variance": 132828,
        "contracts": [
          {
            "name": "PactFi Annual Platform Fee — Support - Prod Support for Credit Apps",
            "budget": 411548,
            "forecast": 544375,
            "actual": 544375,
            "risk": 132828,
            "opp": 0,
            "notes": "Year 1 of 3: 1/26/26 to 1/25/27 - Capitalizable",
            "monthly": [
              0,
              0,
              412,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          },
          {
            "name": "Other / minor items",
            "budget": 0,
            "forecast": 1,
            "actual": 0,
            "risk": 0,
            "opp": 0,
            "notes": "",
            "monthly": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "CME Group",
        "variance": 92000,
        "contracts": [
          {
            "name": "LIQ — Support - Prod Support for Ops Apps",
            "budget": 0,
            "forecast": 92000,
            "actual": 92000,
            "risk": 92000,
            "opp": 0,
            "notes": "This was not part of initial budget",
            "monthly": [
              0,
              0,
              0,
              92,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "Allvue Systems, LLC",
        "variance": 86226,
        "contracts": [
          {
            "name": "BMS — Support - Prod Support for Credit Apps",
            "budget": 1778446,
            "forecast": 1864672,
            "actual": 1864672,
            "risk": 86226,
            "opp": 0,
            "notes": "Prepaid 2026",
            "monthly": [
              155,
              155,
              155,
              155,
              155,
              155,
              155,
              155,
              155,
              155,
              155,
              155
            ]
          }
        ]
      },
      {
        "name": "NewRocket, LLC",
        "variance": 72736,
        "contracts": [
          {
            "name": "ServiceNow Agile Team + Various — Support - Infrastructure for Tech",
            "budget": 361049,
            "forecast": 461681,
            "actual": 461681,
            "risk": 100632,
            "opp": 0,
            "notes": "Prepaid in 2025; to be renewed in Dec 2026-Prepaid in 2025; to be renewed in Dec 2026",
            "monthly": [
              42,
              42,
              42,
              42,
              42,
              42,
              42,
              42,
              42,
              42,
              42,
              0
            ]
          },
          {
            "name": "Strategic Portfolio Management (SPM) Pro — Support - Infrastructure for Tech",
            "budget": 57088,
            "forecast": 29192,
            "actual": 0,
            "risk": 0,
            "opp": -27896,
            "notes": "Strategic Portfolio Management (SPM) Pro, paid in Dec2025, to be renewed in Dec2026-Strategic Portfolio Management (SPM) Pro, paid in Dec2025, to be renewed in Dec2026",
            "monthly": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              29
            ]
          }
        ]
      },
      {
        "name": "Alation Inc.",
        "variance": -47911,
        "contracts": [
          {
            "name": "Alation — Support - Data Analytics Office",
            "budget": 191646,
            "forecast": 143735,
            "actual": 128265,
            "risk": 0,
            "opp": -47911,
            "notes": "Contract is Apr-Mar Budegetd 26 - 191K v/s Actual 172K",
            "monthly": [
              0,
              0,
              0,
              16,
              16,
              16,
              16,
              16,
              16,
              16,
              16,
              16
            ]
          }
        ]
      },
      {
        "name": "OneStream Software, LLC",
        "variance": -14216,
        "contracts": [
          {
            "name": "Support - Prod support for Finance Applications",
            "budget": 298544,
            "forecast": 284328,
            "actual": 284328,
            "risk": 0,
            "opp": -14216,
            "notes": "Prepaid 2026",
            "monthly": [
              24,
              24,
              24,
              24,
              24,
              24,
              24,
              24,
              24,
              24,
              24,
              24
            ]
          }
        ]
      },
      {
        "name": "CDW DIRECT LLC",
        "variance": -6405,
        "contracts": [
          {
            "name": "NCE M365 Jan - Dec Mthly Invoice — Support - Infrastructure for Tech",
            "budget": 86950,
            "forecast": 80545,
            "actual": 3364,
            "risk": 0,
            "opp": -6405,
            "notes": "NCE M365 E5",
            "monthly": [
              1,
              2,
              7,
              7,
              7,
              7,
              7,
              7,
              7,
              7,
              7,
              19
            ]
          }
        ]
      },
      {
        "name": "FinDox Inc.",
        "variance": -6029,
        "contracts": [
          {
            "name": "FinDox Core — Support - Asset Management Applications",
            "budget": 238898,
            "forecast": 232869,
            "actual": 0,
            "risk": 0,
            "opp": -6029,
            "notes": "Total contract - 342k IT cost 232k recharge to Liquid Credit 109k",
            "monthly": [
              0,
              0,
              0,
              233,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "Coforge DPA NA Inc.",
        "variance": -4802,
        "contracts": [
          {
            "name": "UiPath — Support - L2 CoE Management for Tech Horizontals",
            "budget": 100844,
            "forecast": 96042,
            "actual": 96042,
            "risk": 0,
            "opp": -4802,
            "notes": "UiPath Sftwr-UiPath Sftwr",
            "monthly": [
              0,
              101,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "Monday.com Ltd",
        "variance": -3631,
        "contracts": [
          {
            "name": "Management Enterprise 600 Seats — Support - Tech Enablement 2026",
            "budget": 307614,
            "forecast": 303983,
            "actual": 124542,
            "risk": 0,
            "opp": -3631,
            "notes": "Paid as Prepaid in 2025; to be renewed in 2026-Paid as Prepaid in 2025; to be renewed in 2026",
            "monthly": [
              25,
              25,
              25,
              25,
              25,
              26,
              26,
              26,
              26,
              26,
              26,
              26
            ]
          }
        ]
      },
      {
        "name": "RFPIO INC. (Responsive)",
        "variance": -3471,
        "contracts": [
          {
            "name": "Implement - Minor Enhancements for Enterprise Apps",
            "budget": 72889,
            "forecast": 69418,
            "actual": 69418,
            "risk": 0,
            "opp": -3471,
            "notes": "",
            "monthly": [
              0,
              0,
              73,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "SALESFORCE COM INC",
        "variance": 2253,
        "contracts": [
          {
            "name": "Tableau Creator (5) + Viewer (40) + Explorer (10) — Support - Data Analytics Off",
            "budget": 44460,
            "forecast": 46713,
            "actual": 46713,
            "risk": 2253,
            "opp": 0,
            "notes": "",
            "monthly": [
              0,
              0,
              44,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "Broadridge Output  Solutions",
        "variance": 2001,
        "contracts": [
          {
            "name": "Centry CLO — Support - Asset Management Applications",
            "budget": 1091544,
            "forecast": 1093544,
            "actual": 598992,
            "risk": 2000,
            "opp": 0,
            "notes": "Quarterly Prepaid",
            "monthly": [
              301,
              0,
              0,
              260,
              0,
              0,
              260,
              0,
              0,
              270,
              0,
              0
            ]
          },
          {
            "name": "Other / minor items",
            "budget": 0,
            "forecast": 1,
            "actual": 0,
            "risk": 0,
            "opp": 0,
            "notes": "",
            "monthly": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "Seismic Software Inc.",
        "variance": -1330,
        "contracts": [
          {
            "name": "Implement - Minor Enhancements for Enterprise Apps",
            "budget": 139031,
            "forecast": 137702,
            "actual": 79772,
            "risk": 0,
            "opp": -1330,
            "notes": "FPC TBD Dependent on Investor Reporting Integration into Seismic - Prepaid",
            "monthly": [
              11,
              11,
              11,
              11,
              11,
              11,
              11,
              12,
              12,
              12,
              12,
              12
            ]
          },
          {
            "name": "Other / minor items",
            "budget": 0,
            "forecast": -1,
            "actual": 0,
            "risk": 0,
            "opp": 0,
            "notes": "",
            "monthly": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "HSO Enterprise Solutions LLC",
        "variance": -600,
        "contracts": [
          {
            "name": "Support - Prod support for Finance Applications",
            "budget": 12600,
            "forecast": 12000,
            "actual": 12000,
            "risk": 0,
            "opp": -600,
            "notes": "",
            "monthly": [
              0,
              13,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "Other",
        "variance": -6,
        "contracts": []
      }
    ]
  },
  {
    "cat": "MS",
    "variance": 203152,
    "vendors": [
      {
        "name": "Coforge DPA NA Inc.",
        "variance": 247000,
        "contracts": [
          {
            "name": "Support - QA CoE Management for Tech Horizontals",
            "budget": 345000,
            "forecast": 592000,
            "actual": 99250,
            "risk": 247000,
            "opp": 0,
            "notes": "QA SOW FPC - [KA - Feb23] - Updated forecast from Mar to Dec based on the new contract that superseeded the original one",
            "monthly": [
              29,
              29,
              42,
              55,
              55,
              55,
              55,
              55,
              55,
              55,
              55,
              55
            ]
          }
        ]
      },
      {
        "name": "Indus Valley Partners Corporation",
        "variance": -21401,
        "contracts": [
          {
            "name": "Data MS — Support - L2 CoE Management for Tech Horizontals",
            "budget": 85455,
            "forecast": 74250,
            "actual": 27000,
            "risk": 0,
            "opp": -11205,
            "notes": "Data Managed Srvc",
            "monthly": [
              7,
              7,
              7,
              7,
              7,
              7,
              7,
              7,
              7,
              7,
              7,
              0
            ]
          },
          {
            "name": "Polaris/EDM/SecMast Core l2 — Support - L2 CoE Management for Tech Horizontals",
            "budget": 195584,
            "forecast": 185388,
            "actual": 61796,
            "risk": 0,
            "opp": -10196,
            "notes": "IVP L2 Tech MS",
            "monthly": [
              15,
              15,
              15,
              15,
              15,
              15,
              15,
              15,
              15,
              15,
              15,
              15
            ]
          }
        ]
      },
      {
        "name": "Virteva LLC",
        "variance": -10000,
        "contracts": [
          {
            "name": "Support - Enterprise Tech Helpdesk",
            "budget": 190000,
            "forecast": 180000,
            "actual": 60000,
            "risk": 0,
            "opp": -10000,
            "notes": "",
            "monthly": [
              15,
              15,
              15,
              15,
              15,
              15,
              15,
              15,
              15,
              15,
              15,
              15
            ]
          }
        ]
      },
      {
        "name": "Archetype Consulting, Inc.",
        "variance": -7725,
        "contracts": [
          {
            "name": "Support - Prod support for Finance Applications",
            "budget": 100000,
            "forecast": 92275,
            "actual": 31475,
            "risk": 0,
            "opp": -7725,
            "notes": "check for contract copy",
            "monthly": [
              8,
              8,
              8,
              8,
              8,
              8,
              8,
              8,
              8,
              8,
              8,
              8
            ]
          }
        ]
      },
      {
        "name": "NewRocket, LLC",
        "variance": -4330,
        "contracts": [
          {
            "name": "ServiceNow — Implement - Minor Enhancements SNOW - Phase 2",
            "budget": 178500,
            "forecast": 174170,
            "actual": 116113,
            "risk": 0,
            "opp": -4330,
            "notes": "Monthly SOW",
            "monthly": [
              29,
              29,
              29,
              29,
              29,
              29,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "Other",
        "variance": -392,
        "contracts": []
      }
    ]
  },
  {
    "cat": "Infrastructure",
    "variance": -14371,
    "vendors": [
      {
        "name": "CDW DIRECT LLC",
        "variance": -11985,
        "contracts": [
          {
            "name": "Support - Infrastructure for Tech",
            "budget": 180000,
            "forecast": 168015,
            "actual": 33015,
            "risk": 0,
            "opp": -11985,
            "notes": "Network Managed Services (Network Operation Centre (NOC))",
            "monthly": [
              15,
              15,
              15,
              15,
              15,
              15,
              15,
              15,
              15,
              15,
              15,
              15
            ]
          }
        ]
      },
      {
        "name": "Cisco Systems, Inc.",
        "variance": -1674,
        "contracts": [
          {
            "name": "Support - Infrastructure for Tech",
            "budget": 1674,
            "forecast": 0,
            "actual": 0,
            "risk": 0,
            "opp": -1674,
            "notes": "Webex service  has been cancelled in Dec'25, confirmed by Danny",
            "monthly": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "Other",
        "variance": -712,
        "contracts": []
      }
    ]
  },
  {
    "cat": "Hardware",
    "variance": 59289,
    "vendors": [
      {
        "name": "CDW DIRECT LLC",
        "variance": 67802,
        "contracts": [
          {
            "name": "Support - Infrastructure for Tech",
            "budget": 0,
            "forecast": 75000,
            "actual": 0,
            "risk": 75000,
            "opp": 0,
            "notes": "2026 Laptops - Danny- Risk",
            "monthly": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              75
            ]
          },
          {
            "name": "Support - Infrastructure for Tech",
            "budget": 34646,
            "forecast": 27448,
            "actual": 1464,
            "risk": 0,
            "opp": -7198,
            "notes": "",
            "monthly": [
              3,
              3,
              3,
              3,
              3,
              3,
              3,
              3,
              3,
              3,
              3,
              3
            ]
          }
        ]
      },
      {
        "name": "SHI International Corp",
        "variance": -8513,
        "contracts": [
          {
            "name": "Support - Enterprise Tech Helpdesk",
            "budget": 81590,
            "forecast": 66307,
            "actual": 5115,
            "risk": 0,
            "opp": -15283,
            "notes": "",
            "monthly": [
              0,
              0,
              20,
              0,
              0,
              20,
              0,
              0,
              20,
              0,
              0,
              20
            ]
          },
          {
            "name": "Papercut SaaS Maintenance — Support - Infrastructure for Tech",
            "budget": 0,
            "forecast": 6770,
            "actual": 6770,
            "risk": 6770,
            "opp": 0,
            "notes": "Not part of original budget; risk added, category updated from software to hardware since laptop purchase",
            "monthly": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          }
        ]
      }
    ]
  },
  {
    "cat": "OOE",
    "variance": 54809,
    "vendors": [
      {
        "name": "G Treasury SS, LLC",
        "variance": 41250,
        "contracts": [
          {
            "name": "Implement - Cash Matching Recon Solution",
            "budget": 0,
            "forecast": 41250,
            "actual": 0,
            "risk": 41250,
            "opp": 0,
            "notes": "New Risk for cash application matching - new project",
            "monthly": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              41
            ]
          }
        ]
      },
      {
        "name": "Norske Finansielle Referanser AS",
        "variance": 15208,
        "contracts": [
          {
            "name": "Support - Prod Support for Ops Apps",
            "budget": 0,
            "forecast": 15208,
            "actual": 15208,
            "risk": 15208,
            "opp": 0,
            "notes": "",
            "monthly": [
              0,
              0,
              0,
              15,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "Bloomberg Finance L.P.",
        "variance": -1821,
        "contracts": [
          {
            "name": "Support - Prod Support for Credit Apps",
            "budget": 14886,
            "forecast": 13065,
            "actual": 3266,
            "risk": 0,
            "opp": -1821,
            "notes": "Subscription",
            "monthly": [
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              1,
              1
            ]
          }
        ]
      },
      {
        "name": "ASX Benchmarks PTY limited",
        "variance": 574,
        "contracts": [
          {
            "name": "Support - Prod Support for Ops Apps",
            "budget": 4409,
            "forecast": 4983,
            "actual": 4983,
            "risk": 574,
            "opp": 0,
            "notes": "in AUD",
            "monthly": [
              4,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          }
        ]
      },
      {
        "name": "Other",
        "variance": -402,
        "contracts": []
      }
    ]
  },
  {
    "cat": "FPC",
    "variance": -1353167,
    "vendors": [
      {
        "name": "Indus Valley Partners Corporation",
        "variance": -884000,
        "contracts": [
          {
            "name": "Polaris/EDM/SecMast Core Implementation — Implement - Build Pipes from CORE Syst",
            "budget": 1344000,
            "forecast": 960000,
            "actual": 480000,
            "risk": 0,
            "opp": -384000,
            "notes": "FPC- IVP Implementation Post Contract - Capitalizable-160K per month from Jan to June 2026 - Capitalizable",
            "monthly": [
              160,
              160,
              160,
              160,
              160,
              160,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          },
          {
            "name": "New FPC BOW — Implement - Odyssey Reporting & Exception Mgmt",
            "budget": 600000,
            "forecast": 300000,
            "actual": 0,
            "risk": 0,
            "opp": -300000,
            "notes": "New 2026 BoW (Capitalizable)",
            "monthly": [
              0,
              0,
              0,
              0,
              0,
              0,
              50,
              50,
              50,
              50,
              50,
              50
            ]
          },
          {
            "name": "New FPC BOW — Implement - Reporting for Internal Audit",
            "budget": 500000,
            "forecast": 300000,
            "actual": 0,
            "risk": 0,
            "opp": -200000,
            "notes": "New 2026 BoW",
            "monthly": [
              0,
              0,
              0,
              0,
              0,
              0,
              50,
              50,
              50,
              50,
              50,
              50
            ]
          }
        ]
      },
      {
        "name": "MARKIT NORTH AMERICA, INC.",
        "variance": -330000,
        "contracts": [
          {
            "name": "Implement - WSO Own Instance (AM)",
            "budget": 850000,
            "forecast": 600000,
            "actual": 0,
            "risk": 0,
            "opp": -250000,
            "notes": "New 2026 BoW",
            "monthly": [
              0,
              0,
              100,
              200,
              200,
              100,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          },
          {
            "name": "Implement - WSO Balance Sheet Mig & Reporting",
            "budget": 500000,
            "forecast": 420000,
            "actual": 0,
            "risk": 0,
            "opp": -80000,
            "notes": "New 2026 BoW (Capitalizable)",
            "monthly": [
              0,
              0,
              0,
              0,
              0,
              60,
              60,
              60,
              60,
              60,
              60,
              60
            ]
          }
        ]
      },
      {
        "name": "Coforge DPA NA Inc.",
        "variance": -139167,
        "contracts": [
          {
            "name": "Implement - L1/L2 CoE for Additional Platforms",
            "budget": 250000,
            "forecast": 152500,
            "actual": 0,
            "risk": 0,
            "opp": -97500,
            "notes": "T&M- Implementing CoE for L1/L2 Platforms",
            "monthly": [
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              153
            ]
          },
          {
            "name": "Implement - QA CoE to Additional Platforms",
            "budget": 250000,
            "forecast": 208333,
            "actual": 0,
            "risk": 0,
            "opp": -41667,
            "notes": "New 2026 BoW",
            "monthly": [
              0,
              0,
              21,
              21,
              21,
              21,
              21,
              21,
              21,
              21,
              21,
              21
            ]
          }
        ]
      }
    ]
  }
];

function VarianceExplorerPanel({ initialCat, onClose, varData: varDataProp }) {
  const [selCat,    setSelCat]    = useStateDR(initialCat||null);
  const [selVendor, setSelVendor] = useStateDR(null);
  const [selContr,  setSelContr]  = useStateDR(null);
  useEffectDR(() => {
    if (!varDataProp) console.warn('[VarianceExplorerPanel] WARNING: static fallback data used — uploaded workbook data was not provided. Pass varData={buildVarData(items)} from OverviewTab.');
  }, []);
  const pickCat = c => { setSelCat(c); setSelVendor(null); setSelContr(null); };
  const pickVendor = v => { setSelVendor(v); setSelContr(null); };
  const catRow    = selCat    ? varDataProp || VAR_DATA.find(d=>d.cat===selCat)                         : null;
  const vendorRow = selVendor ? catRow?.vendors.find(v=>v.name===selVendor)               : null;
  return (
    <div className="drill-overlay" onClick={onClose}>
      <div className="drill-panel drill-panel-wide" onClick={e=>e.stopPropagation()}
        style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div className="drill-head" style={{ flexShrink:0 }}>
          <button className="drill-close" onClick={onClose}>✕ close</button>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.22em', fontFamily:DRP_SERIF,
            color:'rgba(255,255,255,0.52)', marginBottom:5, textTransform:'lowercase' }}>
            forecast variance · budget to forecast · by category and vendor
          </div>
          <h2 style={{ margin:'0 0 4px', fontFamily:DRP_SERIF, fontWeight:600, fontSize:22, color:'#fff' }}>
            Forecast Variance Explorer
          </h2>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.58)' }}>
            Category → Vendor → Contract · click to drill into root causes
          </div>
        </div>
        <div style={{ flex:1, overflow:'hidden', display:'flex', minHeight:0 }}>
          {/* Col 1 */}
          <div style={{ width:210, borderRight:'1px solid var(--color-border)', overflow:'auto', flexShrink:0, background:'#FAFAF8' }}>
            <div style={{ padding:'9px 14px 7px', fontSize:9, fontWeight:800, letterSpacing:'0.18em',
              textTransform:'uppercase', color:'var(--antares-stone-gray)', borderBottom:'1px solid var(--color-border)', fontFamily:DRP_SERIF }}>Category</div>
            {(varDataProp || VAR_DATA).map(d => {
              const isSel=selCat===d.cat; const fav=d.variance<0; const nil=Math.abs(d.variance)<25000;
              const col=nil?'var(--antares-stone-gray)':fav?DRP_GREEN:DRP_RED;
              return (
                <div key={d.cat} onClick={()=>pickCat(d.cat)} style={{ padding:'11px 14px',
                  borderBottom:'1px solid var(--color-border)', cursor:'pointer',
                  background:isSel?DRP_NAVY:'transparent',
                  display:'flex', justifyContent:'space-between', alignItems:'center', transition:'background 0.1s' }}>
                  <span style={{ fontSize:13, fontWeight:isSel?600:400, color:isSel?'#fff':'var(--antares-soft-black)' }}>{d.cat}</span>
                  <span style={{ fontSize:12, fontWeight:600, fontVariantNumeric:'tabular-nums', fontFamily:DRP_SANS,
                    color:isSel?(fav?'#72D4A0':'#E87878'):col }}>
                    {nil?'—':(fav?'−':'+')}{nil?'':fmt.k(Math.abs(d.variance))}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Col 2 */}
          <div style={{ width:250, borderRight:'1px solid var(--color-border)', overflow:'auto', flexShrink:0 }}>
            {!selCat && <div style={{ padding:'40px 20px', color:'var(--antares-stone-gray)', fontSize:13, textAlign:'center' }}>← Select a category</div>}
            {catRow && (<>
              <div style={{ padding:'9px 14px 7px', fontSize:9, fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase',
                color:'var(--antares-stone-gray)', borderBottom:'1px solid var(--color-border)', fontFamily:DRP_SERIF,
                background:'#FAFAF8', display:'flex', justifyContent:'space-between' }}>
                <span>Vendor</span><span>Variance</span>
              </div>
              {catRow.vendors.map(v => {
                const isSel=selVendor===v.name; const fav=v.variance<0; const col=fav?DRP_GREEN:DRP_RED;
                return (
                  <div key={v.name} onClick={()=>pickVendor(v.name)} style={{ padding:'11px 14px',
                    borderBottom:'1px solid var(--color-border)', cursor:'pointer',
                    background:isSel?'#EEF3FF':'transparent', display:'flex', justifyContent:'space-between',
                    alignItems:'center', transition:'background 0.1s' }}>
                    <span style={{ fontSize:13, fontWeight:isSel?600:400, color:isSel?DRP_NAVY:'var(--antares-soft-black)',
                      maxWidth:148, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.name}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:col, fontVariantNumeric:'tabular-nums', fontFamily:DRP_SANS, flexShrink:0 }}>
                      {fav?'−':'+'}{fmt.k(Math.abs(v.variance))}
                    </span>
                  </div>
                );
              })}
            </>)}
          </div>
          {/* Col 3 */}
          <div style={{ flex:1, overflow:'auto', background:'#fff' }}>
            {!selCat && <div style={{ padding:'48px 24px', color:'var(--antares-stone-gray)', fontSize:13 }}>Select a category to begin.</div>}
            {selCat && !selVendor && <div style={{ padding:'48px 24px', color:'var(--antares-stone-gray)', fontSize:13 }}>← Select a vendor.</div>}
            {vendorRow && (
              <div style={{ padding:'18px 22px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', border:'1px solid var(--color-border)', marginBottom:18 }}>
                  {[['budget',vendorRow.contracts.reduce((s,c)=>s+c.budget,0),DRP_NAVY],
                    ['forecast',vendorRow.contracts.reduce((s,c)=>s+c.forecast,0),vendorRow.variance<0?DRP_GREEN:DRP_RED],
                    ['ytd actual',vendorRow.contracts.reduce((s,c)=>s+c.actual,0),DRP_NAVY],
                    ['net variance',vendorRow.variance,vendorRow.variance<0?DRP_GREEN:DRP_RED]
                  ].map(([l,v,c],i)=>(
                    <div key={i} style={{ padding:'11px 13px', borderRight:i<3?'1px solid var(--color-border)':'none', background:'#FAFAF8' }}>
                      <div style={{ fontSize:9,fontWeight:800,letterSpacing:'0.16em',textTransform:'lowercase',fontFamily:DRP_SERIF,color:'var(--antares-stone-gray)',marginBottom:3 }}>{l}</div>
                      <div style={{ fontFamily:DRP_SERIF,fontWeight:600,fontSize:17,color:c,fontVariantNumeric:'tabular-nums' }}>
                        {l==='net variance'?(v<0?'−':'+'):''}{fmt.m(Math.abs(v))}
                      </div>
                    </div>
                  ))}
                </div>
                {vendorRow.contracts.map((c,ci)=>{
                  const open=selContr===c.name;
                  return (
                    <div key={ci} style={{ marginBottom:12, border:'1px solid var(--color-border)' }}>
                      <div onClick={()=>setSelContr(open?null:c.name)} style={{ padding:'11px 14px', cursor:'pointer',
                        background:open?DRP_NAVY:'#FAFAF8', display:'flex', justifyContent:'space-between', alignItems:'center',
                        borderBottom:open?'1px solid rgba(255,255,255,0.1)':'none' }}>
                        <span style={{ fontSize:13,fontWeight:600,color:open?'#fff':DRP_NAVY }}>{c.name}</span>
                        <span style={{ fontSize:11,color:open?'rgba(255,255,255,0.55)':'var(--antares-stone-gray)' }}>{open?'▾':'▸'} details</span>
                      </div>
                      {open && (
                        <div style={{ padding:'14px' }}>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', border:'1px solid var(--color-border)', marginBottom:14 }}>
                            {[['budget',c.budget,DRP_NAVY],['forecast',c.forecast,c.risk>0?DRP_RED:DRP_GREEN],
                              ['actuals',c.actual,DRP_NAVY],['risk',c.risk,DRP_RED],['opp',c.opp,DRP_GREEN]
                            ].map(([l,v,col],i)=>(
                              <div key={i} style={{ padding:'9px 11px', borderRight:i<4?'1px solid var(--color-border)':'none' }}>
                                <div style={{ fontSize:9,fontWeight:800,letterSpacing:'0.16em',textTransform:'lowercase',fontFamily:DRP_SERIF,color:'var(--antares-stone-gray)',marginBottom:3 }}>{l}</div>
                                <div style={{ fontFamily:DRP_SERIF,fontWeight:600,fontSize:14,color:v===0?'var(--antares-stone-gray)':col,fontVariantNumeric:'tabular-nums' }}>
                                  {v===0?'—':fmt.m(v)}
                                </div>
                              </div>
                            ))}
                          </div>
                          <MonthlyMiniChart monthly={c.monthly} />
                          {c.notes && (
                            <div style={{ marginTop:12, padding:'10px 12px', background:'#FAFAF8',
                              border:'1px solid var(--color-border)', borderLeft:`3px solid ${c.risk>0?DRP_RED:DRP_GREEN}` }}>
                              <div style={{ fontSize:9,fontWeight:800,letterSpacing:'0.16em',textTransform:'lowercase',fontFamily:DRP_SERIF,color:'var(--antares-stone-gray)',marginBottom:4 }}>notes</div>
                              <div style={{ fontSize:12,color:'var(--antares-soft-black)',lineHeight:1.65 }}>{c.notes}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FilterPanel ────────────────────────────────────────────────────────────
function FilterPanel({ filterState: initState, setFilterState, onClose, lookups: lk }) {
  const [active, setActive] = useStateDR(initState || { categories:[],vendors:[],domains:[],domainOwners:[],contractTypes:[],riskOppStatus:[] });
  function toggle(g,v) { const c=active[g]; setActive({...active,[g]:c.includes(v)?c.filter(x=>x!==v):[...c,v]}); }
  const total = Object.values(active).flat().length;
  // When a lookups prop is provided (from uploaded workbook), use it.
  // Fall back to FILTER_OPTS only if no lookups are passed.
  if (!lk) console.warn('[FilterPanel] WARNING: static fallback data used — uploaded workbook data was not provided. Pass lookups={data.lookups}.');
  const dynOpts = lk ? {
    categories:    lk.categories || [],
    vendors:       lk.vendors    || [],
    domains:       lk.domains    || [],
    domainOwners:  lk.owners     || lk.domainOwners || [],
    contractTypes: lk.contractTypes || [],
    riskOppStatus: lk.riskOppStatus || [],
  } : FILTER_OPTS;
  const SECTS=[
    {k:'categories',   l:'Category',         opts:dynOpts.categories},
    {k:'vendors',      l:'Vendor',            opts:dynOpts.vendors},
    {k:'domains',      l:'Domain',            opts:dynOpts.domains},
    {k:'domainOwners', l:'Domain Owner',      opts:dynOpts.domainOwners},
    {k:'contractTypes',l:'Contract Type',     opts:dynOpts.contractTypes},
    {k:'riskOppStatus',l:'Risk / Opp Status', opts:dynOpts.riskOppStatus},
  ];
  return (
    <div className="drill-overlay" onClick={onClose}>
      <div className="drill-panel" onClick={e=>e.stopPropagation()}
        style={{ width:380, maxWidth:'92vw', display:'flex', flexDirection:'column', background:'#fff', overflow:'hidden' }}>
        <div style={{ background:DRP_NAVY, padding:'20px 24px 18px', flexShrink:0, position:'relative' }}>
          <button className="drill-close" onClick={onClose}>✕ close</button>
          <div style={{ fontSize:10,fontWeight:800,letterSpacing:'0.22em',fontFamily:DRP_SERIF,color:'rgba(255,255,255,0.48)',marginBottom:6,textTransform:'lowercase' }}>analysis filters</div>
          <div style={{ fontFamily:DRP_SERIF,fontWeight:600,fontSize:22,color:'#fff',marginBottom:5 }}>Filter Panel</div>
          <div style={{ fontSize:12,color:'rgba(255,255,255,0.58)' }}>{total===0?'No active filters — full dataset':''+total+' filter'+(total>1?'s':'')+' active'}</div>
        </div>
        <div style={{ flex:1, overflow:'auto' }}>
          {SECTS.map(sec=>(
            <div key={sec.k} style={{ borderBottom:'1px solid var(--color-border)' }}>
              <div style={{ padding:'11px 18px 8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:DRP_NAVY,fontFamily:DRP_SANS }}>{sec.l}</span>
                {active[sec.k].length>0 && <button onClick={()=>setActive({...active,[sec.k]:[]})} style={{ background:'none',border:'none',cursor:'pointer',fontSize:11,color:'#6699FF',fontFamily:DRP_SANS,fontWeight:600,padding:0 }}>Clear</button>}
              </div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:6,padding:'0 18px 12px' }}>
                {sec.opts.map(opt=>{
                  const on=active[sec.k].includes(opt);
                  return <button key={opt} onClick={()=>toggle(sec.k,opt)} style={{ padding:'5px 10px',fontSize:12,fontWeight:on?600:400,background:on?DRP_NAVY:'#fff',color:on?'#fff':'var(--antares-soft-black)',border:`1px solid ${on?DRP_NAVY:'var(--color-border)'}`,cursor:'pointer',fontFamily:DRP_SANS,transition:'all 0.12s' }}>{opt}</button>;
                })}
              </div>
            </div>
          ))}
          <div style={{ padding:'12px 18px',fontSize:11,color:'var(--antares-stone-gray)',fontStyle:'italic' }}>Filters apply to detailed analysis views.</div>
        </div>
        <div style={{ padding:'12px 18px',borderTop:'1px solid var(--color-border)',display:'flex',gap:8,background:'#FAFAF8',flexShrink:0 }}>
          <button onClick={()=>setActive({categories:[],vendors:[],domains:[],domainOwners:[],contractTypes:[],riskOppStatus:[]})} style={{ flex:1,padding:'9px 0',background:'#fff',border:'1px solid var(--color-border)',cursor:'pointer',fontFamily:DRP_SANS,fontSize:13,fontWeight:500,color:'var(--antares-stone-gray)' }}>Reset all</button>
          <button onClick={()=>{ if(setFilterState) setFilterState(active); onClose(); }} style={{ flex:2,padding:'9px 0',background:DRP_NAVY,border:'none',cursor:'pointer',fontFamily:DRP_SANS,fontSize:13,fontWeight:600,color:'#fff' }}>Apply</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { KPIDrillPanel, NetDrillPanel, VarianceExplorerPanel, FilterPanel });
