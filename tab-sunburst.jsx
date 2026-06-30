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
// Diverging color for Net Position mode (computed at component scope for legend access)
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

// ── Slice label helpers ───────────────────────────────────────────────
const SB_SHORT_CAT = { 'Infrastructure': 'Infra.', 'Amortization': 'Amort.' };
function sbShortLabel(name, maxLen) {
  const mapped = SB_SHORT_CAT[name];
  if (mapped) return mapped;
  const ml = maxLen || 15;
  return name.length > ml ? name.slice(0, ml - 1) + '…' : name;
}
function sbFmtAmt(v)   { return (v < 0 ? '−' : '+') + fmt.m(Math.abs(v)).replace('$', ''); }
function sbAmtColor(v) { return v < 0 ? '#72D4A0' : '#E87878'; }

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
//   size           – SVG ring area in px (default 440). SVG viewport expands by LABEL_PAD on each side.
//   zoomed         – controlled zoom (cat name or null); if omitted, self-manages
//   onZoom         – called when user clicks to zoom; required when zoomed is provided
function SunburstView({ items, totalAmount, centerSign, centerColor, centerLabel, isDark,
                        size, zoomed: zExt, onZoom, diverging, hideLegend, onVendorClick, lightBack, highlightVendor, singleRing, sqrtScale }) {
  const [zInt,    setZInt]    = useStateSB(null);
  const [tooltip, setTooltip] = useStateSB(null);
  const [hov,     setHov]     = useStateSB(null);
  const controlled = onZoom !== undefined;
  const zoomed    = controlled ? (zExt||null) : zInt;
  const setZoomed = controlled ? onZoom : (c)=>{ setZInt(c); setTooltip(null); };

  const data = items || [];
  if (!data.length) return null;

  // sqrtScale: compress large segments, expand small ones for visibility
  const scaleVal = (v) => sqrtScale ? Math.sqrt(Math.abs(v)) : Math.abs(v);

  const totalAbs = data.reduce((s,c) => s + scaleVal(c.variance), 0);
  const SZ = size || 440;
  const SC = SZ / 440;

  // Label padding: horizontal stays wide (leader lines + text), vertical is minimal
  const LABEL_PAD   = 175;   // horizontal — kept for label columns
  const LABEL_PAD_V = 38;    // vertical   — labels rarely need space above/below ring
  const W = SZ + 2 * LABEL_PAD;
  const H = SZ + 2 * LABEL_PAD_V;
  const CX = W / 2;
  const CY = H / 2;

  // singleRing: use wider band (R0→R2 range) for the single visible ring
  const R0   = Math.round(55 * SC);
  const ROUT = singleRing ? Math.round(190 * SC) : Math.round(125 * SC);
  const R1   = ROUT;
  const R2   = Math.round(188 * SC);

  // Diverging scale for Net Position mode (computed at component scope for legend access)
  const divCatScale = diverging ? Math.max(1, ...data.map(c => Math.abs(c.variance))) : 1;

  // Build segments — each segment carries a1/a2 (start/end angles in radians, 0=top, clockwise)
  const segs = [];
  if (!zoomed) {
    let angle = 0;
    data.forEach((cat, ci) => {
      const catSpan = totalAbs > 0 ? (scaleVal(cat.variance) / totalAbs) * 2 * Math.PI : 0;
      segs.push({
        key:'c'+ci, type:'cat', label:cat.cat, variance:cat.variance,
        parentLabel:'total', parentAbs:totalAbs,
        a1:angle, a2:angle+catSpan,
        d:arc(CX,CY,R0,R1,angle,angle+catSpan),
        fill:diverging ? netDivColorSB(cat.variance, divCatScale, 0) : catColorSB(cat.cat,0,ci),
        onClick:()=>setZoomed(cat.cat),
        hint:'Click to drill into vendors',
      });
      if (!singleRing) {
        const catAbsVnd = cat.vendors.reduce((s,v)=>s+scaleVal(v.variance),0);
        let va = angle;
        cat.vendors.forEach((vnd,vi) => {
          const vSpan = catAbsVnd > 0 ? (scaleVal(vnd.variance)/catAbsVnd)*catSpan : 0;
          segs.push({
            key:'v'+ci+'_'+vi, type:'vendor', label:vnd.name.length>30?vnd.name.slice(0,29)+'…':vnd.name,
            labelFull:vnd.name, variance:vnd.variance,
            parentLabel:cat.cat, parentAbs:Math.abs(cat.variance),
            a1:va, a2:va+vSpan,
            d:arc(CX,CY,R1,R2,va,va+vSpan),
            fill:diverging ? netDivColorSB(vnd.variance, divCatScale, 1) : catColorSB(cat.cat,1,vi),
            onClick:()=>{ setZoomed(cat.cat); onVendorClick && onVendorClick(vnd.labelFull||vnd.name); },
            hint:'Click to select vendor',
          });
          va += vSpan;
        });
      }
      angle += catSpan;
    });
  } else {
    const cat = data.find(c=>c.cat===zoomed);
    if (cat) {
      const divVndScale = diverging ? Math.max(1, ...cat.vendors.map(v => Math.abs(v.variance))) : 1;
      const catAbsVnd = cat.vendors.reduce((s,v)=>s+scaleVal(v.variance),0);
      let va = 0;
      cat.vendors.forEach((vnd,vi) => {
        const vSpan = catAbsVnd > 0 ? (scaleVal(vnd.variance)/catAbsVnd)*2*Math.PI : 0;
        segs.push({
          key:'zv'+vi, type:'vendor', label:vnd.name.length>30?vnd.name.slice(0,29)+'…':vnd.name,
          labelFull:vnd.name, variance:vnd.variance,
          parentLabel:cat.cat, parentAbs:Math.abs(cat.variance),
          a1:va, a2:va+vSpan,
          d:arc(CX,CY,R0,R1,va,va+vSpan),
          fill:diverging ? netDivColorSB(vnd.variance, divVndScale, 0) : catColorSB(zoomed,1,vi),
          onClick: onVendorClick ? ()=>onVendorClick(vnd.labelFull||vnd.name) : null,
          hint: onVendorClick ? 'Click to select vendor' : null,
        });
        if (!singleRing) {
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
              a1:ca, a2:ca+cSpan,
              d:arc(CX,CY,R1,R2,ca,ca+cSpan),
              fill:diverging ? netDivColorSB(ct.variance, divCtScale, 1) : catColorSB(zoomed,2,ci), onClick:null,
            });
            ca += cSpan;
          });
        }
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

  const bg          = isDark ? 'transparent' : '#F9F8F5';
  const lgC         = isDark ? 'rgba(255,255,255,0.82)' : 'var(--antares-soft-black)';
  const sgC         = isDark ? 'var(--antares-stone-gray)' : 'var(--antares-stone-gray)';
  const compact     = SZ < 400;
  const lblText     = isDark ? 'rgba(255,255,255,0.96)' : 'rgba(18,18,32,0.90)';
  const lblShadow   = isDark ? 'rgba(0,0,0,0.82)' : 'rgba(255,255,255,0.88)';
  const leaderStroke= isDark ? 'rgba(255,255,255,0.40)' : 'rgba(40,40,60,0.38)';
  const hintColor   = isDark ? 'rgba(255,255,255,0.34)' : 'rgba(40,40,60,0.40)';

  // ── Slice label renderer ──────────────────────────────────────────────
  function renderSliceLabels() {
    // Categories in default view; every vendor in zoomed view
    const eligible = !zoomed
      ? segs.filter(s => s.type === 'cat')
      : segs.filter(s => s.type === 'vendor');
    if (!eligible.length) return null;

    const labelCap = zoomed ? eligible.length : 8;
    const topN = [...eligible]
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
      .slice(0, labelCap);

    const MIN_SPAN      = 0.04;
    const INTERNAL_SPAN = 0.32;
    const EXT_R         = R2 + Math.round(22 * SC);
    const hLen          = Math.round(16 * SC);
    const COL_DIST      = EXT_R + hLen;
    const fs            = Math.max(9.5, Math.round(10.5 * SC));
    const LINE_H        = Math.round(fs + 3);

    const rightBucket = [], leftBucket = [], internalBucket = [];

    topN.forEach((s, idx) => {
      const span = s.a2 - s.a1;
      if (!zoomed && span < MIN_SPAN) return;
      const midA = (s.a1 + s.a2) / 2;
      const ca   = Math.cos(midA - Math.PI / 2);
      const sa   = Math.sin(midA - Math.PI / 2);
      const name = sbShortLabel(s.label, 22);
      if (span >= INTERNAL_SPAN) {
        internalBucket.push({ ca, sa, name, idx });
      } else {
        const entry = {
          ca, sa, name, idx,
          naturalY: CY + sa * EXT_R,
          y:        CY + sa * EXT_R,
          startX:   CX + (R1 + 5) * ca,
          startY:   CY + (R1 + 5) * sa,
          radX:     CX + EXT_R * ca,
          radY:     CY + EXT_R * sa,
        };
        if (ca >= 0) rightBucket.push(entry); else leftBucket.push(entry);
      }
    });

    rightBucket.sort((a, b) => a.naturalY - b.naturalY);
    leftBucket.sort((a,  b) => a.naturalY - b.naturalY);

    function spread(arr) {
      if (arr.length < 2) return;
      const pad = fs * 1.5;
      arr.forEach(p => { p.y = Math.max(pad, Math.min(H - pad, p.y)); });
      for (let iter = 0; iter < 80; iter++) {
        let moved = false;
        for (let i = 1; i < arr.length; i++) {
          const gap = arr[i].y - arr[i-1].y;
          if (gap < LINE_H) { const push = (LINE_H - gap) / 2; arr[i-1].y -= push; arr[i].y += push; moved = true; }
        }
        for (let i = arr.length - 2; i >= 0; i--) {
          const gap = arr[i+1].y - arr[i].y;
          if (gap < LINE_H) { const push = (LINE_H - gap) / 2; arr[i].y -= push; arr[i+1].y += push; moved = true; }
        }
        if (!moved) break;
      }
      arr.forEach(p => { p.y = Math.max(pad, Math.min(H - pad, p.y)); });
    }

    spread(rightBucket);
    spread(leftBucket);

    const nodes = [];

    internalBucket.forEach(({ ca, sa, name, idx }) => {
      const midR = R0 + (R1 - R0) * 0.54;
      const tx = CX + midR * ca, ty = CY + midR * sa;
      nodes.push(
        <g key={'il'+idx} style={{ pointerEvents:'none' }}>
          <text x={tx} y={ty + fs * 0.35} textAnchor="middle"
            fontSize={fs} fontWeight="700" fontFamily={SB_SANS}
            fill={lblText} stroke={lblShadow} strokeWidth="2.5" paintOrder="stroke">{name}</text>
        </g>
      );
    });

    [...rightBucket, ...leftBucket].forEach(({ startX, startY, radX, radY, y, name, idx, ca }) => {
      const hDir  = ca >= 0 ? 1 : -1;
      // Clamp text column so labels never clip at left or right edge of SVG
      const EST_W      = 195;   // conservative worst-case px width for 22-char bold label
      const MARGIN     = 6;
      const naturalCol = CX + hDir * COL_DIST;
      const colX  = ca >= 0
        ? Math.min(naturalCol, W - MARGIN - EST_W)   // right: don't push past right edge
        : Math.max(naturalCol, MARGIN + EST_W);       // left:  don't pull past left edge
      const textX  = ca >= 0 ? colX + 3 : colX - 3;
      const anchor = ca >= 0 ? 'start' : 'end';
      nodes.push(
        <g key={'el'+idx} style={{ pointerEvents:'none' }}>
          <polyline
            points={`${startX.toFixed(1)},${startY.toFixed(1)} ${radX.toFixed(1)},${radY.toFixed(1)} ${colX.toFixed(1)},${y.toFixed(1)}`}
            fill="none" stroke={leaderStroke} strokeWidth="1" />
          <text x={textX} y={y + fs * 0.35} textAnchor={anchor}
            fontSize={fs} fontWeight="700" fontFamily={SB_SANS}
            fill={lblText} stroke={lblShadow} strokeWidth="2.5" paintOrder="stroke">{name}</text>
        </g>
      );
    });

    return nodes;
  }

  return (
    <div style={{ position:'relative' }} onMouseLeave={onLeave}>
      <SBTooltip tip={tooltip} />
      <div style={{ display:'flex', gap:compact?12:24, alignItems:'flex-start', flexWrap:'wrap' }}>
        <div style={{ flexShrink:0, position:'relative' }}>
          {zoomed && (
            <button onClick={()=>{setZoomed(null);setTooltip(null);}} style={{
              position:'absolute', top:8, right:8, zIndex:2, background:'none',
              border: lightBack ? '1px solid #C8C6C0' : '1px solid rgba(255,255,255,0.22)',
              borderRadius:4, padding:'4px 12px', fontSize:11, cursor:'pointer',
              color: lightBack ? '#555' : 'rgba(255,255,255,0.7)',
              fontFamily:SB_SANS, fontWeight:600,
            }}>← back</button>
          )}
          <svg width={W} height={H} style={{ display:'block' }}>
            {/* Background fill behind rings only */}
            <circle cx={CX} cy={CY} r={R2+4} fill={bg} />

            {/* Ring slices */}
            {segs.map(s=>(
              <path key={s.key} d={s.d} fill={s.fill}
                fillOpacity={
                  highlightVendor
                    ? (s.labelFull === highlightVendor || s.label === highlightVendor ? 1 : 0.38)
                    : (hov===s.key ? 1 : 0.82)
                }
                stroke={isDark?'rgba(0,0,0,0.35)':'#fff'}
                strokeWidth={highlightVendor && (s.labelFull === highlightVendor || s.label === highlightVendor) ? 2.5 : 1.5}
                style={{ cursor:s.onClick?'pointer':'default', transition:'fill-opacity 0.15s, stroke-width 0.15s' }}
                onMouseMove={e=>onMove(e,s)} onMouseEnter={e=>onMove(e,s)} onClick={s.onClick}
              />
            ))}

            {/* Slice labels — rendered above ring paths, below center hole */}
            {renderSliceLabels()}

            {/* Center hole */}
            <circle cx={CX} cy={CY} r={R0-3} fill={isDark?'rgba(0,0,0,0.4)':'#fff'}
              stroke={isDark?'rgba(255,255,255,0.12)':'var(--color-border)'} strokeWidth="1" />

            {/* Center label — category/kpi name */}
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

            {/* Center value */}
            <text x={CX} y={CY+7} textAnchor="middle" fontFamily={SB_SERIF} fontWeight="600"
              fontSize="15" fill={zoomed?(data.find(c=>c.cat===zoomed)?.variance>0?SB_RED:SB_GREEN):centerColor}>
              {zoomed
                ? ((data.find(c=>c.cat===zoomed)?.variance||0)<0?'−':'+') + fmt.m(Math.abs(data.find(c=>c.cat===zoomed)?.variance||0))
                : centerSign + fmt.m(totalAmount)}
            </text>

            {/* Center interaction hint (only when right-side legend is visible) */}
            {!hideLegend && (
              <text x={CX} y={CY+21} textAnchor="middle" fontFamily={SB_SANS} fontSize="9"
                fill={isDark?'rgba(255,255,255,0.38)':'var(--antares-stone-gray)'}>
                {zoomed ? 'click ← to reset' : 'click segment to drill'}
              </text>
            )}

            {/* Ring hierarchy legend — always visible, sits below the chart in LABEL_PAD space */}
            <text
              x={CX}
              y={CY + R2 + Math.round(LABEL_PAD * 0.66)}
              textAnchor="middle"
              fontFamily={SB_SANS}
              fontSize={Math.max(9, Math.round(9.5 * SC))}
              fill={hintColor}
              letterSpacing="0.01em">
              {singleRing
                ? (zoomed
                    ? 'Vendors  ·  Click ← to reset'
                    : 'Categories  ·  Click a slice to drill into vendors')
                : (zoomed
                    ? 'Inner: Vendor  ·  Outer: Contract  ·  Click ← to reset'
                    : 'Inner ring: Category  ·  Outer ring: Vendor  ·  Click a slice to drill in')}
            </text>
          </svg>
        </div>

        {/* Right-side legend list (hidden in drill panels via hideLegend) */}
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
