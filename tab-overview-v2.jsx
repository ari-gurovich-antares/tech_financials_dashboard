// tab-overview.jsx — Executive Overview · Fixed executive story
// Row 1: 4 Primary KPIs · Row 2: 3 Risk/Opp/Net KPIs
// Row 3: Executive Bridge · Row 4: Forecast Variance + Drill-Down

// ── Fixed executive story ─────────────────────────────────────────────────
const EXEC_STORY = {
  budget:    44790000,
  forecast:  46170000,
  actual:    19830000,
  remaining: 26340000,
  risk:      3510000,
  opp:       2010000,
  net:       1500000,
};

const EXEC_CATEGORIES = [
  { cat: "Labor/ T&M", variance: 1761250, hasDrill: true },
  { cat: "Software", variance: 772434, hasDrill: true },
  { cat: "MS", variance: 203152, hasDrill: true },
  { cat: "Infrastructure", variance: -14371, hasDrill: false },
  { cat: "Hardware", variance: 59289, hasDrill: true },
  { cat: "OOE", variance: 74411, hasDrill: true },
  { cat: "FPC", variance: -1353167, hasDrill: true },
];

const EXEC_DRILL = {
  "Labor/ T&M": [
    { name: "Intelligent Business Platforms LLC", variance: 916752 },
    { name: "Indus Valley Partners Corporation", variance: 807200 },
    { name: "Andersen Tax Holdings", variance: 95033 },
    { name: "Coforge DPA NA Inc.", variance: -52195 },
    { name: "Cognizant Worldwide Limited", variance: -5540 },
  ],
  "Software": [
    { name: "Finastra Technology, Inc", variance: 456079 },
    { name: "MARKIT NORTH AMERICA, INC.", variance: 232488 },
    { name: "Indus Valley Partners Corporation", variance: -215776 },
    { name: "PactFi Inc.", variance: 132828 },
    { name: "CME Group", variance: 92000 },
    { name: "Allvue Systems, LLC", variance: 86226 },
    { name: "Other", variance: -11411 },
  ],
  "MS": [
    { name: "Coforge DPA NA Inc.", variance: 247000 },
    { name: "Indus Valley Partners Corporation", variance: -21401 },
    { name: "Virteva LLC", variance: -10000 },
    { name: "Archetype Consulting, Inc.", variance: -7725 },
    { name: "NewRocket, LLC", variance: -4330 },
    { name: "Other", variance: -392 },
  ],
  "Infrastructure": [
    { name: "CDW DIRECT LLC", variance: -11985 },
    { name: "Cisco Systems, Inc.", variance: -1674 },
    { name: "Other", variance: -712 },
  ],
  "Hardware": [
    { name: "CDW DIRECT LLC", variance: 67802 },
    { name: "SHI International Corp", variance: -8513 },
  ],
  "OOE": [
    { name: "G Treasury SS, LLC", variance: 41250 },
    { name: "Amortization/Multiple", variance: 19602 },
    { name: "Norske Finansielle Referanser AS", variance: 15208 },
    { name: "Bloomberg Finance L.P.", variance: -1821 },
    { name: "Other", variance: 172 },
  ],
  "FPC": [
    { name: "Indus Valley Partners Corporation", variance: -884000 },
    { name: "MARKIT NORTH AMERICA, INC.", variance: -330000 },
    { name: "Coforge DPA NA Inc.", variance: -139167 },
  ],
};

// Percentage of total absolute variance per category
const TOTAL_ABS_VAR = EXEC_CATEGORIES.reduce((s, d) => s + Math.abs(d.variance), 0);
function catPct(v) {
  if (Math.abs(v) < 25000) return null;
  return Math.round(Math.abs(v) / TOTAL_ABS_VAR * 100);
}

// ─────────────────────────────────────────────────────────────────────────
function OverviewTab({ data }) {
  const { useState: useStateOV } = React;
  const [selectedCat, setSelectedCat] = useStateOV(null);
  const [openPanel,   setOpenPanel]   = useStateOV(null);

  const e        = EXEC_STORY;
  const variance = e.forecast - e.budget;   // +1,380,000
  const favorable = variance <= 0;
  const varPct   = (Math.abs(variance) / e.budget * 100).toFixed(1);

  // ── Bridge chart math (≈35% shorter than original) ───────────────────
  const CHART_H     = 130;
  const LABEL_SPACE = 40;
  const SVG_W       = 640;
  const AXIS_Y      = LABEL_SPACE + CHART_H;
  const SVG_H       = AXIS_Y + 44;
  const BAR_W       = 110;
  const M           = 52;
  const barGap      = (SVG_W - 2 * M - 3 * BAR_W) / 2;
  const colX        = [M, M + BAR_W + barGap, M + 2 * BAR_W + 2 * barGap];

  const NAVY  = '#333C66';
  const CONN  = '#C7C5C1';
  const GREEN = '#2F7A4D';
  const RED   = '#B23A3A';

  const scaleMax   = Math.max(e.budget, e.forecast) * 1.14;
  const toY        = v => AXIS_Y - (v / scaleMax) * CHART_H;
  const budgetTopY = toY(e.budget);
  const fcTopY     = toY(e.forecast);
  const deltaTopY  = Math.min(budgetTopY, fcTopY);
  const deltaBotY  = Math.max(budgetTopY, fcTopY);
  const deltaH     = Math.max(deltaBotY - deltaTopY, 3);
  const DELTA_C    = favorable ? GREEN : RED;
  const FC_C       = favorable ? NAVY  : RED;

  const bridgeNote = `Forecast is ${fmt.m(Math.abs(variance))} ${favorable ? 'favorable to' : 'unfavorable to'} Budget  ·  ${varPct}% variance`;

  // ── Category chart scales ─────────────────────────────────────────────
  const maxAbs = Math.max(...EXEC_CATEGORIES.map(d => Math.abs(d.variance)), 1);

  // ── Drill data ────────────────────────────────────────────────────────
  const drillItems  = selectedCat ? (EXEC_DRILL[selectedCat] || []) : [];
  const drillCat    = EXEC_CATEGORIES.find(d => d.cat === selectedCat);
  const drillTotal  = drillCat ? drillCat.variance : 0;
  const drillMaxAbs = Math.max(...drillItems.map(d => Math.abs(d.variance)), 1);

  // ── Shared tokens ─────────────────────────────────────────────────────
  const EYEBROW = {
    fontFamily: "'Source Serif 4', Georgia, serif",
    fontWeight: 800, fontSize: 10,
    letterSpacing: '0.22em', textTransform: 'lowercase',
    color: 'var(--antares-stone-gray)',
  };
  const CARD  = { background: '#fff', border: '1px solid var(--color-border)' };
  const MB    = { marginBottom: 20 };
  const SERIF = "'Source Serif 4', Georgia, serif";
  const SANS  = "'Inter', Arial, sans-serif";

  function SectionHead({ eyebrow, title, style }) {
    return (
      <div style={style}>
        <div style={{ ...EYEBROW, marginBottom: 6 }}>{eyebrow}</div>
        <div style={{
          fontFamily: SERIF, fontWeight: 600, fontSize: 18,
          color: 'var(--antares-signature-navy)', letterSpacing: '-0.005em',
        }}>
          {title}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* ══════════════════════════════════════════════════════════════════
          ROW 1 · 4 PRIMARY KPIs
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...CARD, ...MB, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'annual budget',      value: fmt.m(e.budget),    sub: '2026 approved' },
          { label: 'year-end forecast',  value: fmt.m(e.forecast),  sub: 'actuals + remaining' },
          { label: 'ytd actual spend',   value: fmt.m(e.actual),    sub: `${(e.actual / e.budget * 100).toFixed(1)}% of budget consumed` },
          { label: 'remaining forecast', value: fmt.m(e.remaining), sub: 'balance to year-end' },
        ].map((kpi, i) => (
          <div key={i} style={{
            padding: '32px 28px 28px',
            borderLeft: i > 0 ? '1px solid var(--color-border)' : 'none',
          }}>
            <div style={{ ...EYEBROW, marginBottom: 12 }}>{kpi.label}</div>
            <div style={{
              fontFamily: SERIF, fontWeight: 600, fontSize: 40, lineHeight: 1,
              letterSpacing: '-0.01em', color: 'var(--antares-signature-navy)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--antares-stone-gray)', marginTop: 9 }}>
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ROW 2 · 3 RISK / OPP / NET KPIs
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...CARD, ...MB, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>

        <button
          onClick={() => setOpenPanel({ type: 'risk' })}
          style={{
            padding: '28px 28px 24px',
            borderTop: '3px solid #B23A3A', borderRight: 'none', borderBottom: 'none', borderLeft: 'none',
            background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#FBEDED'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <div style={{ ...EYEBROW, marginBottom: 12 }}>risk</div>
          <div style={{
            fontFamily: SERIF, fontWeight: 600, fontSize: 36, lineHeight: 1,
            letterSpacing: '-0.01em', color: '#B23A3A', fontVariantNumeric: 'tabular-nums',
          }}>
            {fmt.m(e.risk)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--antares-stone-gray)', marginTop: 9 }}>downside exposure</div>
          <div style={{ marginTop: 10, fontSize: 11, color: '#B23A3A', opacity: 0.65,
            display: 'flex', alignItems: 'center', gap: 4, letterSpacing: '0.04em' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            investigate
          </div>
        </button>

        <button
          onClick={() => setOpenPanel({ type: 'opp' })}
          style={{
            padding: '28px 28px 24px',
            borderTop: '3px solid #2F7A4D', borderRight: 'none', borderBottom: 'none',
            borderLeft: '1px solid var(--color-border)',
            background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#EAF4EE'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <div style={{ ...EYEBROW, marginBottom: 12 }}>opportunities</div>
          <div style={{
            fontFamily: SERIF, fontWeight: 600, fontSize: 36, lineHeight: 1,
            letterSpacing: '-0.01em', color: '#2F7A4D', fontVariantNumeric: 'tabular-nums',
          }}>
            {fmt.m(e.opp)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--antares-stone-gray)', marginTop: 9 }}>favorable upside</div>
          <div style={{ marginTop: 10, fontSize: 11, color: '#2F7A4D', opacity: 0.65,
            display: 'flex', alignItems: 'center', gap: 4, letterSpacing: '0.04em' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            investigate
          </div>
        </button>

        <button
          onClick={() => setOpenPanel({ type: 'variance' })}
          style={{
            padding: '28px 28px 24px',
            borderTop: 'none', borderRight: 'none', borderBottom: 'none',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            background: 'var(--antares-signature-navy)',
            cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%',
            transition: 'filter 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
          onMouseLeave={e => e.currentTarget.style.filter = 'none'}
          onClick={() => setOpenPanel({ type: 'net' })}
        >
          <div style={{ ...EYEBROW, color: 'rgba(255,255,255,0.52)', marginBottom: 12 }}>net opp/risk position</div>
          <div style={{
            fontFamily: SERIF, fontWeight: 600, fontSize: 36, lineHeight: 1,
            letterSpacing: '-0.01em', color: '#fff', fontVariantNumeric: 'tabular-nums',
          }}>
            {fmt.m(e.net)}
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, marginTop: 9, color: '#72D4A0' }}>▲  net favorable</div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', gap: 4, letterSpacing: '0.04em' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            explore variance
          </div>
        </button>

      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ROW 3 · EXECUTIVE BRIDGE
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...CARD, ...MB, padding: '28px 44px 20px' }}>

        <SectionHead
          eyebrow="budget to forecast"
          title="Executive Bridge"
          style={{ marginBottom: 20 }}
        />

        <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block', overflow: 'visible' }}>
          {/* Axis */}
          <line x1={M - 8} y1={AXIS_Y} x2={SVG_W - M + 8} y2={AXIS_Y} stroke={CONN} strokeWidth="1" />
          {/* Connectors */}
          <line x1={colX[0] + BAR_W} y1={budgetTopY} x2={colX[1]}        y2={budgetTopY} stroke={CONN} strokeWidth="1" />
          <line x1={colX[1] + BAR_W} y1={fcTopY}     x2={colX[2]}        y2={fcTopY}     stroke={CONN} strokeWidth="1" />

          {/* Budget bar */}
          <rect x={colX[0]} y={budgetTopY} width={BAR_W} height={AXIS_Y - budgetTopY} fill={NAVY} />
          <text x={colX[0] + BAR_W / 2} y={budgetTopY - 8}
            textAnchor="middle" fill={NAVY}
            fontFamily={SERIF} fontWeight="600" fontSize="13"
            style={{ fontVariantNumeric: 'tabular-nums' }}>
            {fmt.m(e.budget)}
          </text>

          {/* Movement bar */}
          <rect x={colX[1]} y={deltaTopY} width={BAR_W} height={deltaH} fill={DELTA_C} />
          <text x={colX[1] + BAR_W / 2} y={deltaTopY - 22}
            textAnchor="middle" fill={DELTA_C}
            fontFamily={SANS} fontWeight="700" fontSize="8" letterSpacing="0.09">
            {favorable ? 'FAVORABLE' : 'UNFAVORABLE'}
          </text>
          <text x={colX[1] + BAR_W / 2} y={deltaTopY - 9}
            textAnchor="middle" fill={DELTA_C}
            fontFamily={SERIF} fontWeight="600" fontSize="13"
            style={{ fontVariantNumeric: 'tabular-nums' }}>
            {favorable ? '−' : '+'}{fmt.m(Math.abs(variance))}
          </text>

          {/* Forecast bar */}
          <rect x={colX[2]} y={fcTopY} width={BAR_W} height={AXIS_Y - fcTopY} fill={FC_C} />
          <text x={colX[2] + BAR_W / 2} y={fcTopY - 8}
            textAnchor="middle" fill={FC_C}
            fontFamily={SERIF} fontWeight="600" fontSize="13"
            style={{ fontVariantNumeric: 'tabular-nums' }}>
            {fmt.m(e.forecast)}
          </text>

          {/* X-axis labels */}
          <text x={colX[0] + BAR_W / 2} y={AXIS_Y + 17} textAnchor="middle" fill={NAVY}    fontFamily={SANS} fontWeight="600" fontSize="11">Budget</text>
          <text x={colX[1] + BAR_W / 2} y={AXIS_Y + 17} textAnchor="middle" fill="#807E7A" fontFamily={SANS} fontWeight="400" fontSize="11">Movement</text>
          <text x={colX[2] + BAR_W / 2} y={AXIS_Y + 17} textAnchor="middle" fill={FC_C}    fontFamily={SANS} fontWeight="600" fontSize="11">Forecast</text>

          {/* Summary note */}
          <text x={SVG_W / 2} y={AXIS_Y + 37} textAnchor="middle" fill="#A09E9A" fontFamily={SANS} fontSize="10">
            {bridgeNote}
          </text>
        </svg>

      </div>

      {/* ── Filter trigger ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          onClick={() => setOpenPanel({ type: 'filter' })}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px',
            background: '#fff', border: '1px solid var(--color-border)',
            cursor: 'pointer', fontFamily: SANS, fontSize: 12, fontWeight: 500,
            color: 'var(--antares-stone-gray)', transition: 'color 0.12s, border-color 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--antares-signature-navy)'; e.currentTarget.style.borderColor = 'var(--antares-signature-navy)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--antares-stone-gray)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
          Filters
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ROW 4 · DRIVERS OF FORECAST VARIANCE + DRILL-DOWN
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...CARD, overflow: 'hidden' }}>

        {/* ── Chart panel ────────────────────────────────────────────── */}
        <div style={{ padding: '36px 44px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <SectionHead
              eyebrow="forecast variance · key drivers"
              title="Drivers of Forecast Variance"
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--antares-stone-gray)', textAlign: 'right', lineHeight: 1.6 }}>
                Unfavorable → over budget<br />← Favorable = under budget
              </div>
              <button
                onClick={() => setOpenPanel({ type: 'variance' })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                  background: 'var(--antares-signature-navy)', border: 'none',
                  color: '#fff', cursor: 'pointer', fontFamily: SANS,
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
                }}>
                Explore variance
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
                    <div style={{ fontSize: 11, color: 'var(--antares-stone-gray)', textAlign: 'right', lineHeight: 1.6 }}>
                  Unfavorable → over budget<br />← Favorable = under budget
                </div>
                <button
                  onClick={() => setOpenPanel({ type: 'variance' })}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                    background: 'var(--antares-signature-navy)', border: 'none',
                    color: '#fff', cursor: 'pointer', fontFamily: SANS, fontSize: 11, fontWeight: 600 }}>
                  Explore variance
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </>)}
            </div>
          </div>

          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4, paddingLeft: 160 }}>
            <div style={{
              flex: 1, textAlign: 'right', paddingRight: 10,
              fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: GREEN, fontFamily: SANS, fontWeight: 600,
            }}>
              ← favorable
            </div>
            <div style={{ width: 2, flexShrink: 0 }} />
            <div style={{
              flex: 1, paddingLeft: 10,
              fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: RED, fontFamily: SANS, fontWeight: 600,
            }}>
              unfavorable →
            </div>
          </div>

          <div style={{ height: 1, background: '#ECEAE7', marginLeft: 160, marginBottom: 2 }} />

          {/* Category rows */}
          {EXEC_CATEGORIES.map(({ cat, variance: catVar, hasDrill }) => {
            const isSelected = selectedCat === cat;
            const isFav      = catVar < 0;
            const isNeutral  = Math.abs(catVar) < 25000;
            const barPct     = isNeutral ? 0 : (Math.abs(catVar) / maxAbs) * 84;
            const color      = isNeutral ? '#C7C5C1' : isFav ? GREEN : RED;
            const labelStr   = fmt.k(Math.abs(catVar));
            const pct        = catPct(catVar);

            return (
              <div
                key={cat}
                onClick={() => hasDrill ? setSelectedCat(isSelected ? null : cat) : null}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: 50,
                  borderBottom: '1px solid #F0EEEB',
                  cursor: hasDrill ? 'pointer' : 'default',
                  background: isSelected ? '#F5F4F1' : 'transparent',
                  transition: 'background 0.12s',
                  marginLeft: -44,
                  marginRight: -44,
                  paddingLeft: 44,
                  paddingRight: 44,
                }}
              >
                {/* Label */}
                <div style={{
                  width: 160, flexShrink: 0,
                  fontSize: 14, fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? NAVY : 'var(--antares-soft-black)',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {cat}
                  {hasDrill && !isSelected && (
                    <span style={{ fontSize: 9, color: 'var(--antares-stone-gray)', opacity: 0.55 }}>›</span>
                  )}
                  {isSelected && (
                    <span style={{ fontSize: 9, color: NAVY, opacity: 0.5 }}>▾</span>
                  )}
                </div>

                {/* Left area — favorable */}
                <div style={{
                  flex: 1, display: 'flex', justifyContent: 'flex-end',
                  alignItems: 'center', gap: 6, paddingRight: 3,
                }}>
                  {isFav && !isNeutral && (
                    <>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 12, color, fontVariantNumeric: 'tabular-nums', fontFamily: SANS }}>
                          −{labelStr}
                        </span>
                        {pct !== null && (
                          <span style={{ fontSize: 10, color: 'var(--antares-stone-gray)', marginLeft: 5 }}>
                            ({pct}%)
                          </span>
                        )}
                      </div>
                      <div style={{
                        height: 22, width: `${barPct}%`,
                        background: color, borderRadius: '3px 0 0 3px',
                        transition: 'width 0.3s ease',
                      }} />
                    </>
                  )}
                </div>

                {/* Center axis */}
                <div style={{ width: 2, height: 36, background: '#D4D2CE', flexShrink: 0 }} />

                {/* Right area — unfavorable */}
                <div style={{
                  flex: 1, display: 'flex', justifyContent: 'flex-start',
                  alignItems: 'center', gap: 6, paddingLeft: 3,
                }}>
                  {!isFav && !isNeutral && (
                    <>
                      <div style={{
                        height: 22, width: `${barPct}%`,
                        background: color, borderRadius: '0 3px 3px 0',
                        transition: 'width 0.3s ease',
                      }} />
                      <div>
                        <span style={{ fontSize: 12, color, fontVariantNumeric: 'tabular-nums', fontFamily: SANS }}>
                          +{labelStr}
                        </span>
                        {pct !== null && (
                          <span style={{ fontSize: 10, color: 'var(--antares-stone-gray)', marginLeft: 5 }}>
                            ({pct}%)
                          </span>
                        )}
                      </div>
                    </>
                  )}
                  {isNeutral && (
                    <span style={{ fontSize: 12, color: '#C8C6C2', paddingLeft: 4 }}>—</span>
                  )}
                </div>
              </div>
            );
          })}
          </>)}

        </div>

          {viewMode === 'sunburst' && (
            <div style={{ paddingBottom:36 }}><SunburstView /></div>
          )}

        {/* ── Drill-down panel — always present */}
        <div style={{
          borderTop: '1px solid var(--color-border)',
          background: '#FAFAF8',
          minHeight: 80,
        }}>
           {/* Default / empty state */}
          {!selectedCat && (
            <div style={{
              padding: '28px 44px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#ECEAE7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--antares-soft-black)', marginBottom: 2 }}>
                  Category Breakdown
                </div>
                <div style={{ fontSize: 12, color: 'var(--antares-stone-gray)' }}>
                  Select Labor / T&amp;M, Software, or FPC above to view contributing vendors, contracts, and projects.
                </div>
              </div>
            </div>
          )}
           {/* Populated state */}
          {selectedCat && (
            <div style={{ padding: '28px 44px 32px' }}>
               {/* Drill-down header — improved */}
              <div style={{
                display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}>
                <div>
                  <div style={{ ...EYEBROW, marginBottom: 8 }}>
                    {selectedCat === 'FPC' ? 'fixed price contracts' : 'vendor detail'}
                  </div>
                  {/* Primary: Category Drivers */}
                  <div style={{
                    fontFamily: SERIF, fontWeight: 600, fontSize: 20,
                    color: 'var(--antares-signature-navy)', marginBottom: 4,
                  }}>
                    {selectedCat} Drivers
                  </div>
                  {/* Secondary: variance amount */}
                  <div style={{
                    fontSize: 14, fontWeight: 600,
                    color: drillTotal < 0 ? GREEN : RED,
                    fontVariantNumeric: 'tabular-nums', fontFamily: SANS,
                  }}>
                    {drillTotal < 0 ? '−' : '+'}{fmt.m(Math.abs(drillTotal))} Net {drillTotal < 0 ? 'Favorable' : 'Unfavorable'}
                  </div>
                </div>
                 <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  {drillItems.length > 0 && (
                    <button
                      onClick={() => setOpenPanel({ type: 'variance', initialCat: selectedCat })}
                      style={{
                        background: 'var(--antares-signature-navy)', border: '1px solid var(--antares-signature-navy)',
                        borderRadius: 4, padding: '5px 12px',
                        fontSize: 12, color: '#fff',
                        cursor: 'pointer', fontFamily: SANS, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      Full analysis
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedCat(null)}
                    style={{
                      background: 'none', border: '1px solid var(--color-border)',
                      borderRadius: 4, padding: '5px 12px',
                      fontSize: 12, color: 'var(--antares-stone-gray)',
                      cursor: 'pointer', fontFamily: SANS,
                    }}
                  >
                    ✕ close
                  </button>
                </div>
              </div>
               {/* Contributor rows */}
              {drillItems.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {drillItems.map((item, i) => {
                    const itemFav   = item.variance < 0;
                    const itemColor = itemFav ? GREEN : RED;
                    const itemPct   = (Math.abs(item.variance) / drillMaxAbs) * 72;
                     return (
                      <div key={i} style={{
                        display: 'grid',
                        gridTemplateColumns: '220px 1fr auto',
                        alignItems: 'center',
                        gap: 16,
                        padding: '10px 0',
                        borderBottom: i < drillItems.length - 1 ? '1px solid #EBEBEB' : 'none',
                      }}>
                        <div style={{
                          fontSize: 13, color: 'var(--antares-soft-black)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {item.name}
                        </div>
                         <div style={{ height: 8, background: '#ECEAE7', borderRadius: 2 }}>
                          <div style={{
                            height: '100%', width: `${itemPct}%`,
                            background: itemColor, borderRadius: 2,
                            opacity: 0.8,
                            transition: 'width 0.35s ease',
                          }} />
                        </div>
                         <div style={{
                          fontSize: 13, fontWeight: 600,
                          color: itemColor, fontVariantNumeric: 'tabular-nums',
                          fontFamily: SANS, whiteSpace: 'nowrap', textAlign: 'right',
                          minWidth: 72,
                        }}>
                          {itemFav ? '−' : '+'}{fmt.k(Math.abs(item.variance))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--antares-stone-gray)', fontStyle: 'italic' }}>
                  No breakdown available for {selectedCat}.
                </div>
              )}
             </div>
          )}
        </div>


      </div>

      {/* ── Drill panels ──────────────────────────────────────────── */}
      {openPanel?.type === 'risk'     && <KPIDrillPanel mode="risk" onClose={() => setOpenPanel(null)} />}
      {openPanel?.type === 'opp'      && <KPIDrillPanel mode="opp"  onClose={() => setOpenPanel(null)} />}
      {openPanel?.type === 'net'      && <NetDrillPanel onClose={() => setOpenPanel(null)} />}
      {openPanel?.type === 'variance' && <VarianceExplorerPanel initialCat={openPanel.initialCat || null} onClose={() => setOpenPanel(null)} />}
      {openPanel?.type === 'filter'   && <FilterPanel onClose={() => setOpenPanel(null)} />}

    </div>
  );
}

window.OverviewTab = OverviewTab;
