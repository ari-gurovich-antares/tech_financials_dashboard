// tab-sunburst.jsx — Generic sunburst for Risk / Opp / Net KPI drilldowns
// Accepts items prop: [{ cat, variance, vendors: [{ name, variance, contracts: [{ name, variance, notes }] }] }]
// Positive variance = unfavorable (red). Negative = favorable (green).
const { useState: useStateSB } = React;

const SB_SERIF = "'Source Serif 4', Georgia, serif";
const SB_SANS  = "'Inter', Arial, sans-serif";
const SB_NAVY  = '#333C66';
const SB_RED   = '#B23A3A';
const SB_GREEN = '#2F7A4D';

// ── Category-based color system (matches drill-panels palette) ────────
const SB_CAT_PALETTE = {
  'Labor/ T&M':    '#6699FF',
  'Software':      '#EDAC4B',
  'MS':            '#B088D4',
  'Infrastructure':'#5DB8A2',
  'Hardware':      '#E08070',
  'OOE':           '#C9B54A',
  'Amortization':  '#80BCDC',
  'FPC':           '#72C472',
};
function _sbH2H(hex){let r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;if(mx===mn)return[0,0,l*100];const d=mx-mn,s=l>.5?d/(2-mx-mn):d/(mx+mn);let h;switch(mx){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}return[h/6*360,s*100,l*100];}
function _sbH2hex(h,s,l){h/=360;s/=100;l/=100;if(s===0){const v=Math.round(l*255);return'#'+[v,v,v].map(x=>x.toString(16).padStart(2,'0')).join('');}const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q,hr=(t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<.5)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};return'#'+[h+1/3,h,h-1/3].map(t=>Math.round(hr(t)*255).toString(16).padStart(2,'0')).join('');}
// depth 0=category(full strength), 1=vendor(lighter), 2=contract(lightest); idx adds subtle per-item variation
function catColorSB(cat, depth, idx) {
  const base = SB_CAT_PALETTE[cat] || '#8899BB';
  const [h,s,l] = _sbH2H(base);
  return _sbH2hex(h, Math.max(18, s - 13*depth - 2.5*(idx||0)), Math.min(86, l + 15*depth + 3.5*(idx||0)));
}
// Diverging color for Net Position: negative=favorable(green), positive=unfavorable(red), t=magnitude
// depth 0=category(full), 1=vendor/zoomed-vendor(lighter), 2=contract(lightest)
function netDivColorSB(amount, scale, depth) {
  const d = depth || 0;
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

function pt(cx, cy, r, a) {
  return [cx + r * Math.cos(a - Math.PI / 2), cy + r * Math.sin(a - Math.PI / 2)];
}
function arc(cx, cy, r1, r2, a1, a2) {
  if (Math.abs(a2 - a1) < 0.002) return '';
  const lg = a2 - a1 > Math.PI ? 1 : 0;
  const [x1,y1] = pt(cx, cy, r2, a1);
  const [x2,y2] = pt(cx, cy, r2, a2);
  const [x3,y3] = pt(cx, cy, r1, a2);
  const [x4,y4] = pt(cx, cy, r1, a1);
  return `M${x1.toFixed(2)},${y1.toFixed(2)} A${r2},${r2} 0 ${lg} 1 ${x2.toFixed(2)},${y2.toFixed(2)} L${x3.toFixed(2)},${y3.toFixed(2)} A${r1},${r1} 0 ${lg} 0 ${x4.toFixed(2)},${y4.toFixed(2)}Z`;
}

// ── Tooltip ────────────────────────────────────────────────────────────
function SBTooltip({ tip }) {
  if (!tip) return null;
  const fav = tip.variance < 0;
  return (
    <div style={{
      position:'fixed', left:tip.px+14, top:tip.py-10,
      background:SB_NAVY, color:'#fff', padding:'8px 13px',
      fontSize:12, lineHeight:1.7, pointerEvents:'none', zIndex:300,
      boxShadow:'0 4px 16px rgba(0,0,0,0.35)', maxWidth:240,
      border:'1px solid rgba(255,255,255,0.12)',
    }}>
      <div style={{ fontWeight:600, fontSize:13, marginBottom:2 }}>{tip.label}</div>
      <div style={{ color:fav?'#72D4A0':'#E87878', fontWeight:700, fontVariantNumeric:'tabular-nums', fontSize:14 }}>
        {fav?'−':'+'}{fmt.m(Math.abs(tip.variance))}
      </div>
      <div style={{ color:'rgba(255,255,255,0.6)', fontSize:11, marginTop:1 }}>
        {tip.pctParent}% of {tip.parentLabel} · {tip.pctTotal}% of total
      </div>
      {tip.hint && <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontStyle:'italic' }}>{tip.hint}</div>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────
// Props:
//   items          – [{ cat, variance, vendors }]  — signed; positive=unfav, negative=fav
//   totalAmount    – number to display in center (always positive)
//   centerSign     – '+' | '−'
//   centerColor    – css color for center value
//   centerLabel    – small label above center value
//   isDark         – bool, background is dark
// Props:
//   size      – SVG size in px (default 440; use 340 for compact left-column use)
//   zoomed    – controlled zoom (cat name or null); if omitted, self-manages
//   onZoom    – called when user clicks to zoom; required when zoomed is provided
function SunburstView({ items, totalAmount, centerSign, centerColor, centerLabel, isDark,
                        size, zoomed: zExt, onZoom, diverging, hideLegend }) {
  const [zInt,    setZInt]    = useStateSB(null);
  const [tooltip, setTooltip] = useStateSB(null);
  const [hov,     setHov]     = useStateSB(null);
  const controlled = onZoom !== undefined;
  const zoomed    = controlled ? (zExt||null) : zInt;
  const setZoomed = controlled ? onZoom : (c)=>{ setZInt(c); setTooltip(null); };

  const data = items || [];
  if (!data.length) return null;

  const totalAbs = data.reduce((s,c) => s + Math.abs(c.variance), 0);
  const SZ = size || 440;
  const SC = SZ / 440;
  const CX=SZ/2, CY=SZ/2, R0=Math.round(55*SC), R1=Math.round(125*SC), R2=Math.round(188*SC), W=SZ, H=SZ;

  // Diverging scale for Net Position mode (computed at component scope for legend access)
  const divCatScale = diverging ? Math.max(1, ...data.map(c => Math.abs(c.variance))) : 1;

  // Build segments
  const segs = [];
  if (!zoomed) {
    let angle = 0;
    data.forEach((cat, ci) => {
      const catSpan = totalAbs > 0 ? (Math.abs(cat.variance) / totalAbs) * 2 * Math.PI : 0;
      const isUnfav = cat.variance > 0;
      segs.push({
        key:'c'+ci, type:'cat', label:cat.cat, variance:cat.variance,
        parentLabel:'total', parentAbs:totalAbs,
        d:arc(CX,CY,R0,R1,angle,angle+catSpan),
        fill:diverging ? netDivColorSB(cat.variance, divCatScale, 0) : catColorSB(cat.cat,0,ci),
        onClick:()=>setZoomed(cat.cat),
        hint:'Click to drill into vendors',
      });
      const catAbsVnd = cat.vendors.reduce((s,v)=>s+Math.abs(v.variance),0);
      let va = angle;
      cat.vendors.forEach((vnd,vi) => {
        const vSpan = catAbsVnd > 0 ? (Math.abs(vnd.variance)/catAbsVnd)*catSpan : 0;
        segs.push({
          key:'v'+ci+'_'+vi, type:'vendor', label:vnd.name.length>30?vnd.name.slice(0,29)+'…':vnd.name,
          labelFull:vnd.name, variance:vnd.variance,
          parentLabel:cat.cat, parentAbs:Math.abs(cat.variance),
          d:arc(CX,CY,R1,R2,va,va+vSpan),
          fill:diverging ? netDivColorSB(vnd.variance, divCatScale, 1) : catColorSB(cat.cat,1,vi),
          onClick:()=>setZoomed(cat.cat),
          hint:'Click to drill in',
        });
        va += vSpan;
      });
      angle += catSpan;
    });
  } else {
    const cat = data.find(c=>c.cat===zoomed);
    if (cat) {
      const isUnfav = cat.variance > 0;
      const divVndScale = diverging ? Math.max(1, ...cat.vendors.map(v => Math.abs(v.variance))) : 1;
      const catAbsVnd = cat.vendors.reduce((s,v)=>s+Math.abs(v.variance),0);
      let va = 0;
      cat.vendors.forEach((vnd,vi) => {
        const vSpan = catAbsVnd > 0 ? (Math.abs(vnd.variance)/catAbsVnd)*2*Math.PI : 0;
        segs.push({
          key:'zv'+vi, type:'vendor', label:vnd.name.length>30?vnd.name.slice(0,29)+'…':vnd.name,
          labelFull:vnd.name, variance:vnd.variance,
          parentLabel:cat.cat, parentAbs:Math.abs(cat.variance),
          d:arc(CX,CY,R0,R1,va,va+vSpan),
          fill:diverging ? netDivColorSB(vnd.variance, divVndScale, 0) : catColorSB(zoomed,1,vi), onClick:null,
        });
        const divCtScale = diverging ? Math.max(1, ...vnd.contracts.map(c => Math.abs(c.variance))) : 1;
        const vndAbsCt = vnd.contracts.reduce((s,c)=>s+Math.abs(c.variance),0);
        let ca = va;
        vnd.contracts.forEach((ct,ci) => {
          const cSpan = vndAbsCt > 0 ? (Math.abs(ct.variance)/vndAbsCt)*vSpan : 0;
          segs.push({
            key:'zc'+vi+'_'+ci, type:'contract',
            label:ct.name.length>34?ct.name.slice(0,33)+'…':ct.name,
            labelFull:ct.name, variance:ct.variance,
            parentLabel:vnd.name.length>18?vnd.name.slice(0,17)+'…':vnd.name,
            parentAbs:Math.abs(vnd.variance),
            d:arc(CX,CY,R1,R2,ca,ca+cSpan),
            fill:diverging ? netDivColorSB(ct.variance, divCtScale, 1) : catColorSB(zoomed,2,ci), onClick:null,
          });
          ca += cSpan;
        });
        va += vSpan;
      });
    }
  }

  function onMove(e, seg) {
    const pP = seg.parentAbs>0?(Math.abs(seg.variance)/seg.parentAbs*100).toFixed(1):'0.0';
    const pT = totalAbs>0?(Math.abs(seg.variance)/totalAbs*100).toFixed(1):'0.0';
    setHov(seg.key);
    setTooltip({ px:e.clientX, py:e.clientY, label:seg.labelFull||seg.label,
      variance:seg.variance, pctParent:pP, pctTotal:pT, parentLabel:seg.parentLabel, hint:seg.hint||null });
  }
  function onLeave() { setHov(null); setTooltip(null); }

  const zCatLgd = zoomed ? data.find(c=>c.cat===zoomed) : null;
  const divLgdVScale = (diverging && zCatLgd) ? Math.max(1, ...zCatLgd.vendors.map(v => Math.abs(v.variance))) : 1;
  const legendItems = zoomed
    ? (data.find(c=>c.cat===zoomed)?.vendors||[]).map((v,i)=>({ label:v.name, variance:v.variance,
        color: diverging ? netDivColorSB(v.variance, divLgdVScale, 0) : catColorSB(zoomed,1,i) }))
    : data.map((c,i)=>({ label:c.cat, variance:c.variance,
        color: diverging ? netDivColorSB(c.variance, divCatScale, 0) : catColorSB(c.cat,0,i),
        onClick:()=>setZoomed(c.cat) }));

  const bg  = isDark ? 'transparent' : '#F9F8F5';
  const lgC = isDark ? 'rgba(255,255,255,0.82)' : 'var(--antares-soft-black)';
  const sgC = isDark ? 'var(--antares-stone-gray)' : 'var(--antares-stone-gray)';

  const compact = SZ < 400;

  return (
    <div style={{ position:'relative' }} onMouseLeave={onLeave}>
      <SBTooltip tip={tooltip} />
      <div style={{ display:'flex', gap:compact?12:24, alignItems:'flex-start', flexWrap:'wrap' }}>
        <div style={{ flexShrink:0, position:'relative' }}>
          {zoomed && (
            <button onClick={()=>{setZoomed(null);setTooltip(null);}} style={{
              position:'absolute', top:6, right:6, zIndex:2, background:'none',
              border:'1px solid rgba(255,255,255,0.22)', borderRadius:2,
              padding:'3px 10px', fontSize:11, cursor:'pointer',
              color:'rgba(255,255,255,0.7)', fontFamily:SB_SANS,
            }}>← back</button>
          )}
          <svg width={W} height={H} style={{ display:'block' }}>
            <circle cx={CX} cy={CY} r={R2+4} fill={bg} />
            {segs.map(s=>(
              <path key={s.key} d={s.d} fill={s.fill}
                fillOpacity={hov===s.key?1:0.82} stroke={isDark?'rgba(0,0,0,0.35)':'#fff'} strokeWidth="1.5"
                style={{ cursor:s.onClick?'pointer':'default', transition:'fill-opacity 0.1s' }}
                onMouseMove={e=>onMove(e,s)} onMouseEnter={e=>onMove(e,s)} onClick={s.onClick}
              />
            ))}
            <circle cx={CX} cy={CY} r={R0-3} fill={isDark?'rgba(0,0,0,0.4)':'#fff'}
              stroke={isDark?'rgba(255,255,255,0.12)':'var(--color-border)'} strokeWidth="1" />
            {(()=>{
              const rawLbl = zoomed ? (data.find(c=>c.cat===zoomed)?.cat||'') : (centerLabel||'');
              const words = rawLbl.trim().split(/\s+/).filter(Boolean);
              const lines = words.length > 1
                ? [words.slice(0,Math.ceil(words.length/2)).join(' '), words.slice(Math.ceil(words.length/2)).join(' ')]
                : [rawLbl];
              const topY = lines.length > 1 ? CY-22 : CY-14;
              return (
                <text textAnchor="middle" fontFamily={SB_SERIF} fontWeight="800"
                  fontSize="8" fill={isDark?'rgba(255,255,255,0.48)':'var(--antares-stone-gray)'}
                  letterSpacing="0.1em">
                  {lines.map((ln,i)=>(
                    <tspan key={i} x={CX} y={topY+i*11} style={{ textTransform:'uppercase' }}>{ln}</tspan>
                  ))}
                </text>
              );
            })()}
            <text x={CX} y={CY+7} textAnchor="middle" fontFamily={SB_SERIF} fontWeight="600"
              fontSize="15" fill={zoomed?(data.find(c=>c.cat===zoomed)?.variance>0?SB_RED:SB_GREEN):centerColor}>
              {zoomed
                ? ((data.find(c=>c.cat===zoomed)?.variance||0)<0?'−':'+') + fmt.m(Math.abs(data.find(c=>c.cat===zoomed)?.variance||0))
                : centerSign + fmt.m(totalAmount)}
            </text>
            {!hideLegend && <text x={CX} y={CY+21} textAnchor="middle" fontFamily={SB_SANS} fontSize="9"
              fill={isDark?'rgba(255,255,255,0.38)':'var(--antares-stone-gray)'}>
              {zoomed ? 'click ← to reset' : 'click segment to drill'}
            </text>}
          </svg>
        </div>
        {!hideLegend && (
        <div style={{ paddingTop:14, minWidth:190, maxWidth:240 }}>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase',
            color:isDark?'rgba(255,255,255,0.4)':SB_NAVY, fontFamily:SB_SERIF, marginBottom:12 }}>
            {zoomed ? zoomed + ' — Vendors' : 'Categories'}
          </div>
          {legendItems.map((item,i)=>(
            <div key={i} onClick={item.onClick}
              style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6,
                cursor:item.onClick?'pointer':'default', opacity:1, transition:'opacity 0.1s' }}
              onMouseEnter={e=>{if(item.onClick)e.currentTarget.style.opacity='0.7';}}
              onMouseLeave={e=>{e.currentTarget.style.opacity='1';}}>
              <div style={{ width:11, height:11, background:item.color, flexShrink:0, borderRadius:2 }} />
              <div style={{ fontSize:12, color:lgC, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {item.label}
              </div>
              <div style={{ fontSize:12, fontWeight:600, fontVariantNumeric:'tabular-nums', fontFamily:SB_SANS,
                flexShrink:0, color:item.variance>0?SB_RED:SB_GREEN }}>
                {item.variance>0?'+':'−'}{fmt.k(Math.abs(item.variance))}
              </div>
            </div>
          ))}
          {!zoomed && (
            <div style={{ marginTop:12, paddingTop:8, borderTop:`1px solid ${isDark?'rgba(255,255,255,0.1)':'var(--color-border)'}`,
              fontSize:11, color:sgC, lineHeight:1.6 }}>
              Inner: categories<br/>
              Outer: vendors<br/>
              Click to drill in
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

window.SunburstView = SunburstView;
