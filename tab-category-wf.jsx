// tab-category-wf.jsx — Category waterfall drilldown panel
// Opens when user clicks "Waterfall View" on a selected category in the Drivers chart.
// Level 1: Category Budget → Vendor variance steps → Category Forecast
// Level 2: (click a vendor bar) Vendor Budget → Contract steps → Vendor Forecast

const { useState: useStateCWF, useMemo: useMemoCWF } = React;

// mirrors ovCat / v3Cat
function cwfCat(li) {
  if ((li.category || '').toLowerCase() === 'amortization') return 'Amortization';
  return li.subCategory || '(Other)';
}

// ── Waterfall SVG ─────────────────────────────────────────────────────────
// totalBudget / totalForecast — the start and end anchor bars
// steps — [{ label, variance, from, to, drillable }]
// sel   — currently selected step label (for ring highlight)
// onSelect — fn(label | null) called on bar click
function CWFWaterfallSVG({ totalBudget, totalForecast, steps, sel, onSelect }) {
  const [hov, setHov] = useStateCWF(null);

  if (!steps || steps.length === 0) return null;
  const N = steps.length;

  // ── Y scale ───────────────────────────────────────────────────────────
  const allVals = [
    totalBudget, totalForecast,
    ...steps.map(s => s.from), ...steps.map(s => s.to),
  ];
  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const spread = Math.max(rawMax - rawMin, Math.abs(totalBudget) * 0.005, 1);
  const floorV = rawMin - spread * 1.3;
  const ceilV  = rawMax + spread * 0.65;
  const vRange = Math.max(ceilV - floorV, 1);

  // ── SVG geometry ──────────────────────────────────────────────────────
  const VW = 900, VH = 300;
  const CT = 62, CB = 68;
  const CH = VH - CT - CB;
  const AXIS_Y = CT + CH;
  const CL = 18, CR = 882;

  // Bar widths: Budget/Forecast fixed at BW; steps sized to fill remaining space
  const BW = 78;
  const AVAIL = CR - CL - 2 * BW;
  const CW    = Math.max(28, Math.min(68, Math.floor(AVAIL / (N * 1.6))));
  const GAP   = Math.max(4, (AVAIL - N * CW) / (N + 1));
  const stepX = i => CL + BW + (i + 1) * GAP + i * CW;
  const fcX   = CL + BW + (N + 1) * GAP + N * CW;

  const scY = v => CT + CH * (1 - (v - floorV) / vRange);

  // Largest driver badges
  const maxUnfav = steps.filter(s => s.variance > 0).reduce((m, s) => Math.max(m, s.variance), -Infinity);
  const minFav   = steps.filter(s => s.variance < 0).reduce((m, s) => Math.min(m, s.variance), Infinity);

  const totalVar = totalForecast - totalBudget;
  const totFav   = totalVar <= 0;
  const FCC      = totFav ? '#2F7A4D' : '#B23A3A';
  const varPct   = Math.abs(totalBudget) > 0 ? Math.abs(totalVar / totalBudget * 100).toFixed(1) : '0.0';

  const truncLabel = (s, n) => s.length > n ? s.slice(0, n - 1) + '\u2026' : s;

  return (
    <svg width="100%" viewBox={`0 0 ${VW} ${VH}`} style={{ display: 'block' }}>

      {/* Grid lines */}
      {[0.33, 0.67].map(t => (
        <line key={t} x1={CL} y1={CT + CH * t} x2={CR} y2={CT + CH * t}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}

      {/* Axis */}
      <line x1={CL - 4} y1={AXIS_Y} x2={CR + 4} y2={AXIS_Y}
        stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

      {/* ── Budget bar ── */}
      {(() => {
        const bY = scY(totalBudget);
        const bH = AXIS_Y - bY;
        const cx = CL + BW / 2;
        return (
          <g>
            <rect x={CL} y={bY} width={BW} height={bH} fill="#3D4F80" rx="1" />
            <text x={cx} y={bY - 24} textAnchor="middle"
              fill="rgba(255,255,255,0.38)" fontFamily="'Inter',sans-serif"
              fontWeight="700" fontSize="8" letterSpacing="0.12em">BUDGET</text>
            <text x={cx} y={bY - 8} textAnchor="middle"
              fill="rgba(255,255,255,0.92)" fontFamily="'Source Serif 4',Georgia,serif"
              fontWeight="700" fontSize="13" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmt.m(totalBudget)}
            </text>
            <text x={cx} y={AXIS_Y + 17} textAnchor="middle"
              fill="rgba(255,255,255,0.42)" fontFamily="'Inter',sans-serif"
              fontSize="11" fontWeight="600">Budget</text>
            <line x1={CL + BW} y1={bY} x2={stepX(0)} y2={bY}
              stroke="rgba(255,255,255,0.16)" strokeWidth="1" strokeDasharray="4 3" />
          </g>
        );
      })()}

      {/* ── Step bars ── */}
      {steps.map((step, i) => {
        const isNeut        = Math.abs(step.variance) < 500;
        const isFav         = step.variance < 0;
        const color         = isNeut ? 'rgba(255,255,255,0.2)' : isFav ? '#2F7A4D' : '#B23A3A';
        const isSel         = sel === step.label;
        const isHov         = hov === step.label;
        const isLargestUF   = step.variance > 0 && step.variance === maxUnfav;
        const isLargestFav  = step.variance < 0 && step.variance === minFav;
        const hasBadge      = (isLargestUF || isLargestFav) && !isNeut;
        const cx            = stepX(i) + CW / 2;

        const hiVal  = Math.max(step.from, step.to);
        const loVal  = Math.min(step.from, step.to);
        const topY   = scY(hiVal);
        const botY   = scY(loVal);
        const stepH  = Math.max(botY - topY, 2);
        const connY  = scY(step.to);
        const nextX  = i < N - 1 ? stepX(i + 1) : fcX;
        const maxCh  = Math.max(5, Math.floor(CW / 6.8));
        const lbl    = truncLabel(step.label, maxCh);

        return (
          <g key={`step-${i}`}
            onClick={() => step.drillable && onSelect && onSelect(isSel ? null : step.label)}
            onMouseEnter={() => step.drillable && setHov(step.label)}
            onMouseLeave={() => setHov(null)}
            style={{ cursor: step.drillable ? 'pointer' : 'default' }}>

            {/* Transparent hit area */}
            <rect x={stepX(i) - 4} y={Math.min(topY - 36, AXIS_Y - stepH - 36)}
              width={CW + 8}
              height={AXIS_Y - Math.min(topY - 36, AXIS_Y - stepH - 36) + 4}
              fill="transparent" />

            {/* Hover / select glow ring */}
            {(isSel || isHov) && !isNeut && (
              <rect x={stepX(i) - 2} y={topY - 2} width={CW + 4} height={stepH + 4} rx="2"
                fill="none" stroke={color} strokeWidth="1.5" opacity="0.65" />
            )}

            {/* Bar */}
            <rect x={stepX(i)} y={topY} width={CW} height={stepH} rx="1"
              fill={color}
              opacity={isNeut ? 0.28 : (isSel || isHov) ? 1 : 0.8}
              style={{ transition: 'opacity 0.12s' }} />

            {/* Badge pill */}
            {hasBadge && (
              <g>
                <rect x={stepX(i) + 2} y={topY - 19} width={CW - 4} height={12} rx="2"
                  fill={color} opacity="0.18" />
                <text x={cx} y={topY - 10} textAnchor="middle"
                  fill={color} fontFamily="'Inter',sans-serif" fontWeight="800" fontSize="7" letterSpacing="0.1em">
                  {isFav ? '\u2193 LARGEST OFFSET' : '\u2191 LARGEST DRIVER'}
                </text>
              </g>
            )}

            {/* Value label */}
            {!isNeut && (
              <text x={cx} y={topY - (hasBadge ? 24 : 8)} textAnchor="middle"
                fill={color} fontFamily="'Source Serif 4',Georgia,serif" fontWeight="700" fontSize="12"
                style={{ fontVariantNumeric: 'tabular-nums' }}>
                {isFav ? '\u2212' : '+'}{fmt.k(Math.abs(step.variance))}
              </text>
            )}

            {/* Name label */}
            <text x={cx} y={AXIS_Y + 17} textAnchor="middle"
              fill={isSel ? '#fff' : 'rgba(255,255,255,0.48)'}
              fontFamily="'Inter',sans-serif" fontWeight={isSel ? 600 : 400} fontSize="10">
              {lbl}
            </text>

            {/* Drill hint arrow */}
            {step.drillable && (
              <text x={cx} y={AXIS_Y + 29} textAnchor="middle"
                fill={isSel ? '#fff' : color} fontFamily="'Inter',sans-serif"
                fontSize="8" opacity={isSel || isHov ? 0.9 : 0.4}>
                {isSel ? '\u25b2' : '\u25be'}
              </text>
            )}

            {/* Connector dashes to next bar */}
            <line x1={stepX(i) + CW} y1={connY} x2={nextX} y2={connY}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 3" />
          </g>
        );
      })}

      {/* ── Forecast bar ── */}
      {(() => {
        const fY = scY(totalForecast);
        const fH = AXIS_Y - fY;
        const cx = fcX + BW / 2;
        return (
          <g>
            <rect x={fcX} y={fY} width={BW} height={fH} fill={FCC} rx="1" opacity="0.88" />
            <text x={cx} y={fY - 26} textAnchor="middle"
              fill={FCC} fontFamily="'Inter',sans-serif" fontWeight="700" fontSize="8" letterSpacing="0.1em">
              {totFav ? '\u25b2 FAV' : '\u25bc UNFAV'}{'\u2002'}{totFav ? '\u2212' : '+'}{varPct}%
            </text>
            <text x={cx} y={fY - 8} textAnchor="middle"
              fill={FCC} fontFamily="'Source Serif 4',Georgia,serif" fontWeight="700" fontSize="13"
              style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmt.m(totalForecast)}
            </text>
            <text x={cx} y={AXIS_Y + 17} textAnchor="middle"
              fill={FCC} fontFamily="'Inter',sans-serif" fontWeight="600" fontSize="11">
              Forecast
            </text>
          </g>
        );
      })()}

      {/* Reconciliation note */}
      <text x={VW / 2} y={VH - 4} textAnchor="middle"
        fill="rgba(255,255,255,0.15)" fontFamily="'Inter',sans-serif" fontSize="9">
        {`Budget ${fmt.m(totalBudget)} ${totFav ? '\u2212' : '+'} ${fmt.m(Math.abs(totalVar))} = Forecast ${fmt.m(totalForecast)}`}
      </text>
    </svg>
  );
}

// ── CategoryWaterfallPanel ─────────────────────────────────────────────────
function CategoryWaterfallPanel({ cat, lineItems, onClose }) {
  const [selVendor, setSelVendor] = useStateCWF(null);
  const MAX_STEPS = 8;

  // ── Derive all data from lineItems filtered to this category ────────────
  const derived = useMemoCWF(() => {
    const catItems = lineItems.filter(li => cwfCat(li) === cat);
    const catBudget   = catItems.reduce((s, li) => s + (li.budget   || 0), 0);
    const catForecast = catItems.reduce((s, li) => s + (li.forecast || 0), 0);

    // Build vendor map
    const vm = {};
    for (const li of catItems) {
      const v = li.vendor || '(unspecified)';
      if (!vm[v]) vm[v] = { name: v, budget: 0, forecast: 0, contracts: [] };
      vm[v].budget   += li.budget   || 0;
      vm[v].forecast += li.forecast || 0;
      const appPfx = li.application && li.application !== 'N/A' && li.application.trim()
        ? li.application + ' \u2014 ' : '';
      const cName = (appPfx + (li.project || '')).trim().slice(0, 80) || v;
      vm[v].contracts.push({
        name:     cName,
        budget:   li.budget   || 0,
        forecast: li.forecast || 0,
        notes:    li.notes    || '',
      });
    }
    const vendorMap = Object.values(vm)
      .map(v => ({ ...v, variance: v.forecast - v.budget }))
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

    // Build category-level waterfall steps from top vendors
    const topVendors = vendorMap.filter(v => Math.abs(v.variance) >= 500).slice(0, MAX_STEPS);
    const restVariance = vendorMap.reduce((s, v) => s + v.variance, 0)
                       - topVendors.reduce((s, v) => s + v.variance, 0);
    const restBudget   = catBudget   - topVendors.reduce((s, v) => s + v.budget,   0);
    const restForecast = catForecast - topVendors.reduce((s, v) => s + v.forecast, 0);
    const wfVendors = Math.abs(restVariance) >= 500
      ? [...topVendors, { name: 'Other / minor', budget: restBudget, forecast: restForecast, variance: restVariance, contracts: [] }]
      : topVendors;

    let running = catBudget;
    const catSteps = wfVendors.map(v => {
      const from = running;
      const to   = running + v.variance;
      running    = to;
      return { label: v.name, variance: v.variance, from, to,
               drillable: v.name !== 'Other / minor' && v.contracts.length > 0 };
    });

    return { catBudget, catForecast, catVariance: catForecast - catBudget, vendorMap, catSteps };
  }, [lineItems, cat]);

  const { catBudget, catForecast, catVariance, vendorMap, catSteps } = derived;
  const catFav    = catVariance <= 0;
  const catVarPct = Math.abs(catBudget) > 0 ? Math.abs(catVariance / catBudget * 100).toFixed(1) : '0.0';

  // ── Vendor-level data for second drill ──────────────────────────────────
  const vendorData = selVendor ? vendorMap.find(v => v.name === selVendor) : null;

  const vendorSteps = useMemoCWF(() => {
    if (!vendorData) return [];
    const contracts = vendorData.contracts
      .map(c => ({ ...c, variance: c.forecast - c.budget }))
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
    const top = contracts.slice(0, MAX_STEPS);
    const restV = contracts.reduce((s, c) => s + c.variance, 0) - top.reduce((s, c) => s + c.variance, 0);
    const restB = vendorData.budget   - top.reduce((s, c) => s + c.budget,   0);
    const restF = vendorData.forecast - top.reduce((s, c) => s + c.forecast, 0);
    const all = Math.abs(restV) >= 500
      ? [...top, { name: 'Other / minor', budget: restB, forecast: restF, variance: restV, notes: '' }]
      : top;
    let running = vendorData.budget;
    return all.map(c => {
      const from = running;
      const to   = running + c.variance;
      running    = to;
      return { label: c.name, variance: c.variance, from, to, drillable: false, notes: c.notes };
    });
  }, [vendorData, selVendor]);

  const accent = catFav ? '#72D4A0' : '#E87878';

  return (
    <div className="drill-overlay" onClick={onClose}>
      <div className="drill-panel drill-panel-wide"
        onClick={e => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', background: '#0E1520', overflow: 'hidden' }}>

        {/* ── Header ────────────────────────────────────────────────── */}
        <div style={{ background: '#162035', padding: '18px 24px', flexShrink: 0, position: 'relative' }}>
          <button className="drill-close" onClick={onClose}>✕ close</button>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span
              onClick={() => setSelVendor(null)}
              style={{ fontSize: 12, fontFamily: "'Inter',sans-serif",
                color: selVendor ? 'rgba(255,255,255,0.4)' : '#fff',
                cursor: selVendor ? 'pointer' : 'default',
                fontWeight: selVendor ? 400 : 600 }}>
              {cat}
            </span>
            {selVendor && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 13 }}>›</span>
                <span style={{ fontSize: 12, color: '#fff', fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>
                  {selVendor.length > 40 ? selVendor.slice(0, 39) + '\u2026' : selVendor}
                </span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: "'Source Serif 4',Georgia,serif", fontWeight: 600, fontSize: 22, color: '#fff' }}>
              {selVendor
                ? (selVendor.length > 44 ? selVendor.slice(0, 43) + '\u2026' : selVendor)
                : `${cat} \u2014 Budget to Forecast`}
            </div>
            <div style={{ fontFamily: "'Source Serif 4',Georgia,serif", fontWeight: 700, fontSize: 24,
              color: accent, fontVariantNumeric: 'tabular-nums' }}>
              {catFav ? '\u2212' : '+'}
              {fmt.m(Math.abs(selVendor && vendorData ? vendorData.variance : catVariance))}
            </div>
            <div style={{ fontSize: 11, fontFamily: "'Inter',sans-serif",
              color: catFav ? '#72D4A0' : '#E87878', fontWeight: 600, letterSpacing: '0.06em' }}>
              {catFav ? '\u25b2 favorable' : '\u25bc unfavorable'} · {catVarPct}%
            </div>
          </div>

          {selVendor && (
            <button onClick={() => setSelVendor(null)} style={{
              marginTop: 10, padding: '4px 11px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.16)',
              color: 'rgba(255,255,255,0.65)',
              fontSize: 11, fontFamily: "'Inter',sans-serif", cursor: 'pointer',
            }}>← Back to {cat}</button>
          )}
        </div>

        {/* ── Waterfall chart ───────────────────────────────────────── */}
        <div style={{ padding: '16px 20px 4px', flexShrink: 0 }}>
          {!selVendor ? (
            <CWFWaterfallSVG
              totalBudget={catBudget}
              totalForecast={catForecast}
              steps={catSteps}
              sel={selVendor}
              onSelect={label => setSelVendor(label)}
            />
          ) : vendorData ? (
            <CWFWaterfallSVG
              totalBudget={vendorData.budget}
              totalForecast={vendorData.forecast}
              steps={vendorSteps}
              sel={null}
              onSelect={null}
            />
          ) : null}
        </div>

        {/* ── Detail table ──────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Column header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 104px 104px 104px',
            padding: '8px 24px', position: 'sticky', top: 0,
            background: '#0E1520', zIndex: 2,
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.28)', fontFamily: "'Inter',sans-serif",
          }}>
            <span>{!selVendor ? 'Vendor' : 'Contract / Project'}</span>
            <span style={{ textAlign: 'right' }}>Budget</span>
            <span style={{ textAlign: 'right' }}>Forecast</span>
            <span style={{ textAlign: 'right' }}>Variance</span>
          </div>

          {/* Rows */}
          {!selVendor
            ? vendorMap.map((v, i) => {
                const vFav = v.variance < 0;
                const vCol = vFav ? '#72D4A0' : '#E87878';
                const canDrill = v.contracts.length > 0;
                return (
                  <div key={v.name}
                    onClick={() => canDrill && setSelVendor(v.name)}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 104px 104px 104px',
                      padding: '10px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                      cursor: canDrill ? 'pointer' : 'default', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (canDrill) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)',
                      display: 'flex', alignItems: 'center', gap: 6,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                      {v.name}
                      {canDrill && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', flexShrink: 0 }}>›</span>}
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter',sans-serif" }}>
                      {fmt.m(v.budget)}
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter',sans-serif" }}>
                      {fmt.m(v.forecast)}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: vCol, textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter',sans-serif" }}>
                      {vFav ? '\u2212' : '+'}{fmt.k(Math.abs(v.variance))}
                    </span>
                  </div>
                );
              })
            : vendorData
              ? vendorData.contracts
                  .map(c => ({ ...c, variance: c.forecast - c.budget }))
                  .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
                  .map((c, i) => {
                    const cFav = c.variance < 0;
                    const cCol = cFav ? '#72D4A0' : '#E87878';
                    return (
                      <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 104px 104px 104px',
                          padding: '10px 24px 6px' }}>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            paddingRight: 10 }}>{c.name}</span>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'right',
                            fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter',sans-serif" }}>
                            {fmt.m(c.budget)}
                          </span>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'right',
                            fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter',sans-serif" }}>
                            {fmt.m(c.forecast)}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: cCol, textAlign: 'right',
                            fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter',sans-serif" }}>
                            {cFav ? '\u2212' : '+'}{fmt.k(Math.abs(c.variance))}
                          </span>
                        </div>
                        {c.notes && (
                          <div style={{ padding: '0 24px 10px 36px', fontSize: 11,
                            color: 'rgba(255,255,255,0.26)', lineHeight: 1.55,
                            borderLeft: `2px solid ${cFav ? 'rgba(47,122,77,0.35)' : 'rgba(178,58,58,0.35)'}`,
                            marginLeft: 24 }}>
                            {c.notes}
                          </div>
                        )}
                      </div>
                    );
                  })
              : null
          }

          {/* Total row */}
          {!selVendor ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 104px 104px 104px',
              padding: '10px 24px', borderTop: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.03)', position: 'sticky', bottom: 0 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)',
                fontStyle: 'italic', fontFamily: "'Inter',sans-serif" }}>Total</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)',
                textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter',sans-serif" }}>
                {fmt.m(catBudget)}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)',
                textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter',sans-serif" }}>
                {fmt.m(catForecast)}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700,
                color: catFav ? '#72D4A0' : '#E87878', textAlign: 'right',
                fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter',sans-serif" }}>
                {catFav ? '\u2212' : '+'}{fmt.k(Math.abs(catVariance))}
              </span>
            </div>
          ) : vendorData ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 104px 104px 104px',
              padding: '10px 24px', borderTop: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.03)', position: 'sticky', bottom: 0 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)',
                fontStyle: 'italic', fontFamily: "'Inter',sans-serif" }}>Vendor Total</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)',
                textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter',sans-serif" }}>
                {fmt.m(vendorData.budget)}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)',
                textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter',sans-serif" }}>
                {fmt.m(vendorData.forecast)}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700,
                color: vendorData.variance < 0 ? '#72D4A0' : '#E87878', textAlign: 'right',
                fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter',sans-serif" }}>
                {vendorData.variance < 0 ? '\u2212' : '+'}{fmt.k(Math.abs(vendorData.variance))}
              </span>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}

window.CategoryWaterfallPanel = CategoryWaterfallPanel;
