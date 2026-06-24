// Overview — executive summary
// Row 1: Annual Budget · Year-End Forecast · Variance to Budget
// Row 2: Budget-to-Forecast Waterfall (hero)
// Row 3: YTD Actual · Remaining · Risk · Opportunities
// Row 4: Top Variance Drivers by Category

function OverviewTab({ data }) {
  const s = data.summary;

  // ── Derived ──────────────────────────────────────────────────────────────
  const yearForecast = s.forecast;
  const variance     = yearForecast - s.budget;
  const varPct       = s.budget > 0 ? (variance / s.budget) * 100 : 0;
  const over         = variance > 0;

  // ── Category drivers (forecast – budget by category) ─────────────────────
  const catMap = {};
  (data.vendors || []).forEach(v => {
    (v.lineItems || []).forEach(li => {
      const c = li.category || 'Other';
      if (!catMap[c]) catMap[c] = { name: c, budget: 0, forecast: 0 };
      catMap[c].budget   += li.budget   || 0;
      catMap[c].forecast += li.forecast || 0;
    });
  });
  const catDrivers = Object.values(catMap)
    .map(c => ({ ...c, variance: c.forecast - c.budget }))
    .filter(c => Math.abs(c.variance) > 100)
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, 8);
  const catMaxAbs = Math.max(...catDrivers.map(c => Math.abs(c.variance)), 1);

  // ── Waterfall ─────────────────────────────────────────────────────────────
  const CHART_H  = 300;
  const scaleMax = Math.max(
    s.budget,
    yearForecast,
    s.actual + s.remaining + s.risk
  ) * 1.14;
  const px = v => (Math.max(0, v) / scaleMax) * CHART_H;

  const wfSteps = [
    {
      label: 'Budget',
      sub:   fmt.m(s.budget),
      value: s.budget,
      start: 0,
      color: '#333C66',
      isTotal: true,
    },
    {
      label: 'YTD Actual',
      sub:   fmt.m(s.actual),
      value: s.actual,
      start: Math.max(0, s.budget - s.actual),
      color: '#4E6FAE',
    },
    {
      label: 'Remaining',
      sub:   fmt.m(s.remaining),
      value: s.remaining,
      start: Math.max(0, s.budget - s.actual - s.remaining),
      color: '#6699FF',
    },
    {
      label: 'Risks',
      sub:   '+' + fmt.m(s.risk),
      value: s.risk,
      start: Math.max(0, s.budget - s.actual - s.remaining),
      color: '#B23A3A',
    },
    {
      label: 'Opportunities',
      sub:   fmt.m(s.opp),
      value: Math.abs(s.opp),
      start: Math.max(0, s.budget - s.actual - s.remaining + s.risk - Math.abs(s.opp)),
      color: '#2F7A4D',
    },
    {
      label: 'Forecast',
      sub:   fmt.m(yearForecast),
      value: yearForecast,
      start: 0,
      color: over ? '#B23A3A' : '#333C66',
      isTotal: true,
    },
  ];

  // ── Style tokens ──────────────────────────────────────────────────────────
  const eyebrow = {
    fontFamily:    'var(--font-serif)',
    fontWeight:    800,
    fontSize:      10,
    letterSpacing: '0.22em',
    textTransform: 'lowercase',
    color:         'var(--antares-stone-gray)',
  };
  const CARD = { background: '#fff', border: '1px solid var(--color-border)' };
  const DIVL = { borderLeft: '1px solid var(--color-border)' };
  const GAP  = { marginBottom: 24 };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* ══════════════════════════════════════════════════════════════════
          ROW 1 · PRIMARY KPIs
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...CARD, ...GAP, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        {[
          {
            label:    'annual budget',
            value:    fmt.m(s.budget),
            sub:      '2026 approved',
            numColor: 'var(--antares-signature-navy)',
            subColor: 'var(--antares-stone-gray)',
          },
          {
            label:    'year-end forecast',
            value:    fmt.m(yearForecast),
            sub:      'ytd actual + remaining',
            numColor: 'var(--antares-signature-navy)',
            subColor: 'var(--antares-stone-gray)',
          },
          {
            label:    'ytd actual spend',
            value:    fmt.m(s.actual),
            sub:      `${(s.actual / s.budget * 100).toFixed(1)}% of budget consumed`,
            numColor: 'var(--antares-signature-navy)',
            subColor: 'var(--antares-stone-gray)',
          },
        ].map((kpi, i) => (
          <div key={i} style={{ padding: '48px 40px', ...(i > 0 ? DIVL : {}) }}>
            <div style={{ ...eyebrow, marginBottom: 16 }}>{kpi.label}</div>
            <div style={{
              fontFamily:         'var(--font-serif)',
              fontWeight:         600,
              fontSize:           54,
              lineHeight:         1,
              letterSpacing:      '-0.01em',
              color:              kpi.numColor,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 13, color: kpi.subColor, marginTop: 10 }}>
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ROW 2 · WATERFALL (hero)
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...CARD, ...GAP, padding: '40px 44px 32px' }}>

        {/* Section header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ ...eyebrow, marginBottom: 8 }}>hero visualization</div>
          <div style={{
            fontFamily:    'var(--font-serif)',
            fontWeight:    600,
            fontSize:      18,
            color:         'var(--antares-signature-navy)',
            letterSpacing: '-0.005em',
          }}>
            Budget-to-Forecast Bridge
          </div>
        </div>

        {/* Chart */}
        <div style={{ position: 'relative', height: CHART_H }}>

          {/* Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <div key={i} style={{
              position:   'absolute',
              left: 0, right: 0,
              bottom:     t * CHART_H,
              height:     1,
              background: t === 0 ? '#C5C3BF' : 'var(--grid-line)',
            }} />
          ))}

          {/* Bars */}
          <div style={{
            position: 'absolute', inset: 0,
            display:  'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap:      24,
          }}>
            {wfSteps.map((step, i) => {
              const barH   = px(step.value);
              const startH = px(step.start);
              return (
                <div key={i} style={{ position: 'relative', height: '100%' }}>
                  {/* Value label */}
                  <div style={{
                    position:           'absolute',
                    left: 0, right: 0,
                    bottom:             startH + barH + 8,
                    textAlign:          'center',
                    fontSize:           12,
                    fontWeight:         step.isTotal ? 700 : 500,
                    fontVariantNumeric: 'tabular-nums',
                    color:              step.isTotal ? step.color : 'var(--antares-stone-gray)',
                    whiteSpace:         'nowrap',
                    lineHeight:         1.3,
                  }}>
                    {step.sub}
                  </div>
                  {/* Bar */}
                  <div style={{
                    position:   'absolute',
                    left: '8%', right: '8%',
                    bottom:     startH,
                    height:     Math.max(barH, 3),
                    background: step.color,
                  }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* X-axis labels */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap:                 24,
          marginTop:           14,
          paddingTop:          14,
          borderTop:           '1px solid var(--color-border)',
        }}>
          {wfSteps.map((step, i) => (
            <div key={i} style={{
              textAlign:  'center',
              fontSize:   11,
              fontWeight: step.isTotal ? 600 : 400,
              color:      step.isTotal ? 'var(--antares-signature-navy)' : 'var(--antares-stone-gray)',
            }}>
              {step.label}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{
          display:    'flex',
          gap:        24,
          marginTop:  20,
          paddingTop: 16,
          borderTop:  '1px solid var(--color-border)',
          flexWrap:   'wrap',
        }}>
          {[
            { color: '#333C66', label: 'budget / forecast' },
            { color: '#4E6FAE', label: 'ytd actual'        },
            { color: '#6699FF', label: 'remaining'         },
            { color: '#B23A3A', label: 'risks'             },
            { color: '#2F7A4D', label: 'opportunities'     },
          ].map(l => (
            <div key={l.label} style={{
              display:    'flex',
              alignItems: 'center',
              gap:        7,
              fontSize:   11,
              color:      'var(--antares-stone-gray)',
            }}>
              <div style={{ width: 9, height: 9, background: l.color, flexShrink: 0 }} />
              {l.label}
            </div>
          ))}
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ROW 3 · SECONDARY METRICS
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...CARD, ...GAP, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {[
          {
            label:    'risk',
            value:    fmt.m(s.risk),
            sub:      'downside exposure',
            numColor: '#B23A3A',
          },
          {
            label:    'opportunities',
            value:    fmt.m(Math.abs(s.opp)),
            sub:      'favorable upside',
            numColor: '#2F7A4D',
          },
        ].map((kpi, i) => (
          <div key={i} style={{ padding: '32px 32px 28px', ...(i > 0 ? DIVL : {}) }}>
            <div style={{ ...eyebrow, marginBottom: 10 }}>{kpi.label}</div>
            <div style={{
              fontFamily:         'var(--font-serif)',
              fontWeight:         600,
              fontSize:           30,
              lineHeight:         1,
              letterSpacing:      '-0.01em',
              color:              kpi.numColor,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--antares-stone-gray)', marginTop: 7 }}>
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ROW 4 · TOP VARIANCE DRIVERS BY CATEGORY
      ══════════════════════════════════════════════════════════════════ */}
      {catDrivers.length > 0 && (
        <div style={{ ...CARD, padding: '40px 44px 32px' }}>

          <div style={{ marginBottom: 32 }}>
            <div style={{ ...eyebrow, marginBottom: 8 }}>supporting analysis</div>
            <div style={{
              fontFamily:    'var(--font-serif)',
              fontWeight:    600,
              fontSize:      18,
              color:         'var(--antares-signature-navy)',
              letterSpacing: '-0.005em',
            }}>
              Top Variance Drivers by Category
            </div>
          </div>

          {catDrivers.map((cat, i) => {
            const isOver = cat.variance > 0;
            const barW   = (Math.abs(cat.variance) / catMaxAbs) * 50;
            return (
              <div key={i} style={{
                display:             'grid',
                gridTemplateColumns: '200px 1fr 100px',
                alignItems:          'center',
                gap:                 20,
                padding:             '11px 0',
                borderTop:           '1px solid var(--color-border)',
              }}>

                {/* Name */}
                <div style={{
                  fontSize:     13,
                  fontWeight:   500,
                  color:        'var(--antares-soft-black)',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap',
                }}>
                  {cat.name}
                </div>

                {/* Diverging bar */}
                <div style={{
                  position:   'relative',
                  height:     22,
                  background: 'linear-gradient(90deg, #FDF0F0 0%, #FDF0F0 50%, #EFF7F2 50%, #EFF7F2 100%)',
                }}>
                  <div style={{
                    position:   'absolute',
                    left:       '50%',
                    top: 0, bottom: 0,
                    width:      1,
                    background: 'rgba(128,126,122,0.35)',
                  }} />
                  {isOver ? (
                    <div style={{
                      position:   'absolute',
                      right:      '50%',
                      top: 3, bottom: 3,
                      width:      `${barW}%`,
                      background: '#B23A3A',
                    }} />
                  ) : (
                    <div style={{
                      position:   'absolute',
                      left:       '50%',
                      top: 3, bottom: 3,
                      width:      `${barW}%`,
                      background: '#2F7A4D',
                    }} />
                  )}
                </div>

                {/* Amount */}
                <div style={{
                  fontSize:           13,
                  fontWeight:         600,
                  fontVariantNumeric: 'tabular-nums',
                  color:              isOver ? '#B23A3A' : '#2F7A4D',
                  textAlign:          'right',
                }}>
                  {fmt.signed(cat.variance)}
                </div>

              </div>
            );
          })}

          {/* Axis legend */}
          <div style={{
            display:        'flex',
            justifyContent: 'space-between',
            fontSize:       11,
            color:          'var(--antares-stone-gray)',
            marginTop:      14,
            paddingTop:     12,
            borderTop:      '1px solid var(--color-border)',
          }}>
            <span>← over budget</span>
            <span>under budget →</span>
          </div>

        </div>
      )}

    </div>
  );
}

window.OverviewTab = OverviewTab;
