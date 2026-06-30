/* Dashboard-specific styles building on Antares tokens */
@import url('design-system/colors_and_type.css');

* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  background: #F6F5F2;
  font-family: var(--font-sans);
  color: var(--color-fg-1);
  -webkit-font-smoothing: antialiased;
}

/* === Semantic colors for risk/opp === */
:root {
  --risk-red: #B23A3A;
  --risk-red-bg: #FBEDED;
  --risk-red-border: #E8C7C7;
  --opp-green: #2F7A4D;
  --opp-green-bg: #EAF4EE;
  --opp-green-border: #C6DDCF;
  --neutral-bg: #F6F5F2;
  --card-bg: #FFFFFF;
  --grid-line: #EFEDE9;
}

/* === Top bar === */
.topbar {
  background: var(--antares-signature-navy);
  color: #fff;
  padding: 14px 28px;
  display: flex; align-items: center; gap: 24px;
  border-bottom: 3px solid #1C213F;
}
.topbar .brand {
  display: flex; align-items: center; gap: 14px;
  padding-right: 24px;
  border-right: 1px solid rgba(255,255,255,0.18);
}
.topbar .brand img { height: 22px; display: block; }
.topbar .title-block { display: flex; flex-direction: column; gap: 2px; }
.topbar .eyebrow {
  font-family: var(--font-serif);
  font-weight: 800;
  font-size: 10px;
  letter-spacing: 0.22em;
  color: rgba(255,255,255,0.6);
  text-transform: lowercase;
}
.topbar .h-title {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 18px;
  color: #fff;
  letter-spacing: -0.005em;
}
.topbar .spacer { flex: 1; }

/* === Refresh meta cluster === */
.refresh-cluster {
  display: flex; align-items: center; gap: 16px;
  font-family: var(--font-sans);
  font-size: 12px;
  color: rgba(255,255,255,0.78);
}
.refresh-cluster .src-pill {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 12px;
  border: 1px solid rgba(255,255,255,0.22);
  background: rgba(255,255,255,0.05);
  font-size: 12px;
  color: #fff;
  cursor: pointer;
  font-family: var(--font-sans);
  letter-spacing: -0.005em;
  transition: background 0.15s;
}
.refresh-cluster .src-pill:hover { background: rgba(255,255,255,0.12); }
.refresh-cluster .src-pill.active { background: var(--antares-bright-blue); border-color: var(--antares-bright-blue); }
.refresh-cluster .timestamp {
  display: flex; flex-direction: column; align-items: flex-end; line-height: 1.3;
}
.refresh-cluster .timestamp .label {
  font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
  color: rgba(255,255,255,0.55);
}
.refresh-cluster .timestamp .val { color: #fff; font-weight: 500; }
.btn-refresh {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px;
  background: var(--antares-bright-blue);
  color: #fff; border: none;
  font-family: var(--font-sans); font-weight: 600; font-size: 13px;
  cursor: pointer; transition: opacity 0.15s, transform 0.15s;
  letter-spacing: -0.005em;
}
.btn-refresh:hover { opacity: 0.92; }
.btn-refresh:active { transform: translateY(1px); }
.btn-refresh:disabled { opacity: 0.6; cursor: wait; }
.btn-refresh .spin { animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* === Tabs strip === */
.tabs-bar {
  background: #fff;
  border-bottom: 1px solid var(--color-border);
  padding: 0 28px;
  display: flex; align-items: stretch; gap: 0;
  position: sticky; top: 0; z-index: 5;
}
.tab {
  padding: 16px 22px 14px;
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 14px;
  color: var(--antares-stone-gray);
  background: transparent; border: none; cursor: pointer;
  border-bottom: 2px solid transparent;
  letter-spacing: -0.005em;
  display: inline-flex; align-items: center; gap: 8px;
  transition: color 0.12s;
}
.tab:hover { color: var(--antares-signature-navy); }
.tab.active {
  color: var(--antares-signature-navy);
  font-weight: 600;
  border-bottom-color: var(--antares-bright-blue);
}
.tab .count {
  font-size: 11px;
  background: var(--antares-bright-blue-100);
  color: var(--antares-signature-navy);
  padding: 2px 7px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.tabs-bar .tab-spacer { flex: 1; }
.view-toggle {
  align-self: center;
  display: inline-flex;
  border: 1px solid var(--color-border);
}
.view-toggle button {
  padding: 8px 14px;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  background: #fff; border: none;
  color: var(--antares-stone-gray);
  cursor: pointer;
  letter-spacing: -0.005em;
}
.view-toggle button + button { border-left: 1px solid var(--color-border); }
.view-toggle button.active {
  background: var(--antares-signature-navy); color: #fff;
}

/* === Content === */
.content {
  padding: 28px;
  max-width: 1480px;
  margin: 0 auto;
}

/* === Eyebrow caption === */
.eyebrow-cap {
  font-family: var(--font-serif);
  font-weight: 800;
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: lowercase;
  color: var(--antares-stone-gray);
}

/* === Section header (Camel Case, bold, normal spacing) === */
.section-h {
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0;
  color: var(--antares-signature-navy);
  text-transform: none;
  line-height: 1.3;
}
.section-h-sm {
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0;
  color: var(--antares-signature-navy);
  text-transform: none;
}

/* Monthly breakdown table */
.tbl-monthly { font-size: 12px; }
.tbl-monthly th, .tbl-monthly td { padding: 8px 10px; }
.tbl-monthly thead th {
  background: var(--antares-stone-gray-100);
  font-family: var(--font-sans);
  font-weight: 600;
  color: var(--antares-soft-black);
  letter-spacing: 0.04em;
  font-size: 11px;
}
.tbl-monthly td.num { font-variant-numeric: tabular-nums; }

/* === KPI tiles === */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0;
  background: #fff;
  border: 1px solid var(--color-border);
}
.kpi-grid.kpi-narrative { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.kpi-grid.kpi-executive { grid-template-columns: repeat(7, minmax(0, 1fr)); }
.kpi-grid.kpi-analyst { grid-template-columns: repeat(9, minmax(0, 1fr)); }
@media (max-width: 1480px) {
  .kpi-grid.kpi-analyst { grid-template-columns: repeat(5, minmax(0, 1fr)); }
}
@media (max-width: 1280px) {
  .kpi-grid.kpi-executive,
  .kpi-grid.kpi-analyst { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .kpi-grid.kpi-executive,
  .kpi-grid.kpi-analyst,
  .kpi-grid.kpi-narrative { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.kpi {
  padding: 22px 22px 24px;
  border-right: 1px solid var(--color-border);
  display: flex; flex-direction: column; gap: 6px;
  background: #fff;
  position: relative;
  min-width: 0;
}
.kpi:last-child { border-right: none; }
.kpi.accent { background: linear-gradient(180deg, #FAFBFD 0%, #fff 100%); }
.kpi.risk-tile { border-top: 3px solid var(--risk-red); }
.kpi.opp-tile { border-top: 3px solid var(--opp-green); }
.kpi.net-tile { background: var(--antares-signature-navy); color: #fff; }
.kpi.net-tile .kpi-label { color: rgba(255,255,255,0.6); }
.kpi.net-tile .kpi-value { color: #fff; }
.kpi.net-tile .kpi-sub { color: rgba(255,255,255,0.7); }

.kpi-label {
  font-family: var(--font-serif);
  font-weight: 800;
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: lowercase;
  color: var(--antares-stone-gray);
}
.kpi-value {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 30px;
  line-height: 1;
  color: var(--antares-signature-navy);
  letter-spacing: -0.01em;
  font-variant-numeric: lining-nums tabular-nums;
  margin-top: 4px;
  white-space: nowrap;
}
.kpi-value.risk { color: var(--risk-red); }
.kpi-value.opp { color: var(--opp-green); }
.kpi-sub {
  font-size: 12px;
  color: var(--antares-stone-gray);
  margin-top: 2px;
}

/* === Card === */
.card {
  background: #fff;
  border: 1px solid var(--color-border);
  padding: 22px 24px 24px;
}
.card-header {
  display: flex; justify-content: space-between; align-items: flex-end;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--grid-line);
}
.card-title {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 18px;
  color: var(--antares-signature-navy);
  letter-spacing: -0.005em;
}
.card-sub {
  font-size: 12px;
  color: var(--antares-stone-gray);
  margin-top: 2px;
}

/* === 2-col grid === */
.row { display: grid; gap: 16px; margin-top: 16px; }
.row.r-2 { grid-template-columns: 1.6fr 1fr; }
.row.r-2-eq { grid-template-columns: 1fr 1fr; }
.row.r-3 { grid-template-columns: 1fr 1fr 1fr; }

/* === Tables === */
.tbl { width: 100%; border-collapse: collapse; font-size: 13px; font-variant-numeric: tabular-nums; }
.tbl th {
  text-align: left;
  font-family: var(--font-serif);
  font-weight: 800;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: lowercase;
  color: var(--antares-stone-gray);
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
  background: #FAFAF8;
  cursor: pointer; user-select: none;
  white-space: nowrap;
}
.tbl th.num { text-align: right; }
.tbl th.sortable:hover { color: var(--antares-signature-navy); }
.tbl th .sort-arrow { color: var(--antares-bright-blue); margin-left: 4px; }
.tbl td {
  padding: 12px 12px;
  border-bottom: 1px solid var(--grid-line);
  color: var(--antares-soft-black);
  vertical-align: middle;
}
.tbl td.num { text-align: right; font-variant-numeric: tabular-nums; }
.tbl tr.clickable { cursor: pointer; transition: background 0.1s; }
.tbl tr.clickable:hover td { background: #F8FAFE; }
.tbl tr.selected td { background: var(--antares-bright-blue-100); }
.tbl .vendor-name { font-weight: 600; color: var(--antares-signature-navy); }
.tbl .pos { color: var(--opp-green); font-weight: 600; }
.tbl .neg { color: var(--risk-red); font-weight: 600; }
.tbl .zero { color: var(--antares-stone-gray); }

/* === Mini bar === */
.mini-bar {
  height: 6px; background: #EEF1F4; position: relative; overflow: hidden;
}
.mini-bar > div { height: 100%; background: var(--antares-signature-navy); }
.mini-bar > div.over { background: var(--risk-red); }

/* === Chart utilities === */
.bar-row {
  display: grid;
  grid-template-columns: 200px 1fr 90px;
  align-items: center;
  gap: 12px;
  padding: 7px 0;
  font-size: 13px;
}
.bar-row .label { color: var(--antares-soft-black); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar-row .label .sub { font-size: 11px; color: var(--antares-stone-gray); font-weight: 400; }
.bar-row .bar-track { position: relative; height: 22px; background: #F4F2EE; }
.bar-row .bar-fill {
  position: absolute; left: 0; top: 0; height: 100%;
  background: var(--antares-signature-navy);
}
.bar-row .bar-fill.forecast { background: var(--antares-bright-blue); opacity: 0.55; }
.bar-row .num { text-align: right; font-variant-numeric: tabular-nums; font-size: 13px; font-weight: 600; color: var(--antares-signature-navy); }

/* Risk/Opp diverging bar */
.div-row {
  display: grid;
  grid-template-columns: 200px 1fr 90px;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  font-size: 13px;
}
.div-track {
  position: relative; height: 18px; background: linear-gradient(90deg, #FBEDED 0%, #FBEDED 50%, #EAF4EE 50%, #EAF4EE 100%);
}
.div-track .center { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: var(--antares-stone-gray); }
.div-track .neg-fill { position: absolute; right: 50%; top: 0; bottom: 0; background: var(--risk-red); }
.div-track .pos-fill { position: absolute; left: 50%; top: 0; bottom: 0; background: var(--opp-green); }

/* === Badge === */
.badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 8px;
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.02em;
  font-family: var(--font-sans);
  text-transform: uppercase;
}
.badge.risk { background: var(--risk-red-bg); color: var(--risk-red); border: 1px solid var(--risk-red-border); }
.badge.opp { background: var(--opp-green-bg); color: var(--opp-green); border: 1px solid var(--opp-green-border); }
.badge.neutral { background: var(--antares-stone-gray-100); color: var(--antares-stone-gray); border: 1px solid var(--color-border); }

/* === R/O pill (icon only) === */
.ro-pill {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px;
  border-radius: 50%;
}
.ro-pill.risk { background: var(--risk-red); }
.ro-pill.opp  { background: var(--opp-green); }
.ro-pill.flat { background: var(--antares-stone-gray-100); color: var(--antares-stone-gray); font-weight: 700; font-size: 12px; }

/* === Clickable KPI button reset === */
.kpi-clickable {
  font-family: inherit;
  text-align: left;
  background: none;
  border: none;
  border-right: 1px solid var(--color-border);
  cursor: pointer;
  width: 100%;
  transition: background-color 120ms ease, transform 80ms ease;
}
.kpi-clickable:hover { background: var(--antares-bright-blue-100); }
.kpi-clickable:active { transform: translateY(1px); }
.kpi-clickable:focus-visible { outline: 2px solid var(--antares-bright-blue); outline-offset: -2px; }

/* === Clickable table rows === */
.tbl-clickable tbody tr { cursor: pointer; transition: background-color 100ms ease; }
.tbl-clickable tbody tr:hover { background: var(--antares-bright-blue-100) !important; }
.tbl-clickable tbody tr:hover td { color: var(--antares-signature-navy); }

/* === Drill panel === */
.drill-overlay {
  position: fixed; inset: 0;
  background: rgba(28,33,63,0.45);
  z-index: 50;
  display: flex; justify-content: flex-end;
  animation: fadein 0.2s ease;
}
@keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
.drill-panel {
  width: 720px; max-width: 92vw;
  background: #fff;
  height: 100vh; overflow: auto;
  box-shadow: -10px 0 40px rgba(28,33,63,0.18);
  animation: slidein 0.25s cubic-bezier(0.2,0,0.2,1);
}
@keyframes slidein { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.drill-head {
  background: var(--antares-signature-navy); color: #fff;
  padding: 24px 28px 22px;
  position: sticky; top: 0; z-index: 2;
}
.drill-head .ec { color: rgba(255,255,255,0.6); }
.drill-head h2 { font-family: var(--font-serif); font-weight: 600; font-size: 24px; color: #fff; margin: 4px 0 6px; letter-spacing: -0.005em; }
.drill-head .meta { display: flex; gap: 18px; font-size: 12px; color: rgba(255,255,255,0.7); }
.drill-close {
  position: absolute; top: 18px; right: 22px;
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
  color: #fff; padding: 6px 10px; cursor: pointer; font-family: var(--font-sans); font-size: 12px;
  letter-spacing: 0.06em;
}
.drill-close:hover { background: rgba(255,255,255,0.2); }
.drill-body { padding: 24px 28px; }
.drill-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 1px solid var(--color-border); margin-bottom: 22px; }
.drill-kpi { padding: 14px 16px; border-right: 1px solid var(--color-border); }
.drill-kpi:last-child { border-right: none; }
.drill-kpi .l { font-family: var(--font-serif); font-weight: 800; font-size: 9px; letter-spacing: 0.2em; text-transform: lowercase; color: var(--antares-stone-gray); }
.drill-kpi .v { font-family: var(--font-serif); font-weight: 600; font-size: 22px; color: var(--antares-signature-navy); margin-top: 4px; font-variant-numeric: tabular-nums; }
.drill-kpi .v.risk { color: var(--risk-red); }
.drill-kpi .v.opp { color: var(--opp-green); }

/* monthly mini-chart */
.month-grid {
  display: grid; grid-template-columns: repeat(12, 1fr); gap: 4px;
  align-items: end; height: 140px;
}
.month-col { display: flex; flex-direction: column; align-items: stretch; gap: 1px; height: 100%; justify-content: flex-end; }
.month-col .ac-bar { background: var(--antares-signature-navy); }
.month-col .fc-bar { background: var(--antares-bright-blue); opacity: 0.55; }
.month-col-label { font-size: 10px; text-align: center; color: var(--antares-stone-gray); margin-top: 6px; letter-spacing: 0.04em; }
.month-axis { display: grid; grid-template-columns: repeat(12, 1fr); gap: 4px; }

/* === Search box === */
.search-box {
  display: inline-flex; align-items: center; gap: 8px;
  background: #fff; border: 1px solid var(--color-border);
  padding: 7px 12px; min-width: 240px;
}
.search-box input { flex: 1; border: none; outline: none; font-family: var(--font-sans); font-size: 13px; color: var(--antares-soft-black); }
.search-box input::placeholder { color: var(--antares-stone-gray); }

/* Filter chips */
.chips { display: flex; gap: 6px; flex-wrap: wrap; }
.chip {
  padding: 5px 10px; font-size: 11px; font-weight: 500;
  background: #fff; border: 1px solid var(--color-border);
  color: var(--antares-stone-gray); cursor: pointer;
  letter-spacing: 0.02em;
}
.chip.active { background: var(--antares-signature-navy); color: #fff; border-color: var(--antares-signature-navy); }
.chip:hover:not(.active) { color: var(--antares-signature-navy); }

/* Upload modal */
.modal-bg { position: fixed; inset: 0; background: rgba(28,33,63,0.45); z-index: 100; display: flex; align-items: center; justify-content: center; animation: fadein 0.2s; }
.modal {
  background: #fff; width: 560px; max-width: 92vw;
  border-top: 4px solid var(--antares-bright-blue);
}
.modal-head { padding: 22px 26px 14px; border-bottom: 1px solid var(--grid-line); }
.modal-head h3 { font-family: var(--font-serif); font-weight: 600; font-size: 20px; color: var(--antares-signature-navy); margin: 0; letter-spacing: -0.005em; }
.modal-head p { font-size: 13px; color: var(--antares-stone-gray); margin: 6px 0 0; }
.modal-body { padding: 22px 26px; }
.modal-foot { padding: 16px 26px; border-top: 1px solid var(--grid-line); display: flex; justify-content: flex-end; gap: 10px; background: #FAFAF8; }
.btn { padding: 9px 16px; font-family: var(--font-sans); font-size: 13px; font-weight: 600; cursor: pointer; border: none; letter-spacing: -0.005em; }
.btn-primary { background: var(--antares-signature-navy); color: #fff; }
.btn-primary:hover { background: #2A335A; }
.btn-secondary { background: #fff; color: var(--antares-stone-gray); border: 1px solid var(--color-border); }
.btn-secondary:hover { color: var(--antares-signature-navy); }

.dropzone {
  border: 1.5px dashed var(--color-border);
  background: #FAFAF8;
  padding: 32px 24px;
  text-align: center;
  transition: all 0.15s;
  cursor: pointer;
}
.dropzone.drag { border-color: var(--antares-bright-blue); background: var(--antares-bright-blue-100); }
.dropzone .icon { font-size: 32px; color: var(--antares-bright-blue); margin-bottom: 8px; }
.dropzone .ttl { font-family: var(--font-serif); font-weight: 600; font-size: 16px; color: var(--antares-signature-navy); }
.dropzone .sub { font-size: 12px; color: var(--antares-stone-gray); margin-top: 4px; }
.dropzone .or { color: var(--antares-stone-gray); margin: 12px 0 8px; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; }
.dropzone .browse-link { color: var(--antares-bright-blue); font-weight: 600; cursor: pointer; }

.sp-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; background: #FAFAF8; border: 1px solid var(--color-border);
  margin-top: 14px;
  font-size: 12px;
}
.sp-row .sp-ico { color: var(--antares-bright-blue); font-size: 16px; }
.sp-row .sp-path { color: var(--antares-soft-black); font-family: 'SF Mono', Menlo, monospace; font-size: 12px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sp-row .sp-status { color: var(--opp-green); font-weight: 600; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; }

/* Refresh history */
.refresh-log { font-size: 12px; }
.refresh-log .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--grid-line); }
.refresh-log .item:last-child { border: none; }
.refresh-log .item .when { color: var(--antares-stone-gray); }
.refresh-log .item .what { color: var(--antares-soft-black); font-weight: 500; }

/* Donut */
.donut-wrap { display: flex; align-items: center; gap: 24px; }
.legend-list { display: flex; flex-direction: column; gap: 8px; font-size: 12px; }
.legend-list .li { display: flex; align-items: center; gap: 10px; }
.legend-list .swatch { width: 12px; height: 12px; flex-shrink: 0; }
.legend-list .l-name { color: var(--antares-soft-black); flex: 1; }
.legend-list .l-val { color: var(--antares-stone-gray); font-variant-numeric: tabular-nums; }

/* Bridge */
.bridge {
  display: flex; align-items: stretch; gap: 4px; height: 220px;
  margin-top: 8px;
}
.bridge .col { flex: 1; display: flex; flex-direction: column; align-items: stretch; }
.bridge .colbar { flex: 1; position: relative; display: flex; flex-direction: column; justify-content: flex-end; }
.bridge .seg { width: 100%; }
.bridge .seg.budget { background: var(--antares-signature-navy); }
.bridge .seg.actual { background: var(--antares-signature-navy); opacity: 0.85; }
.bridge .seg.fc { background: var(--antares-bright-blue); }
.bridge .seg.risk { background: var(--risk-red); }
.bridge .seg.opp { background: var(--opp-green); }
.bridge .label { text-align: center; padding-top: 8px; font-size: 11px; color: var(--antares-stone-gray); letter-spacing: 0.04em; }
.bridge .label .v { font-family: var(--font-serif); font-weight: 600; font-size: 15px; color: var(--antares-signature-navy); display: block; margin-top: 2px; font-variant-numeric: tabular-nums; }
.bridge .connector {
  border-top: 1px dashed var(--antares-stone-gray-200);
  position: absolute; left: 0; right: 0;
}

/* === Domain owner card === */
.owner-card {
  background: #fff; border: 1px solid var(--color-border);
  padding: 18px 20px;
  display: flex; flex-direction: column; gap: 10px;
}

/* === Domain Owner card v2 (clickable, larger, KPI-rich) === */
.owner-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
@media (max-width: 1080px) {
  .owner-grid { grid-template-columns: 1fr; }
}
.owner-card-v2 {
  background: #fff;
  border: 1px solid var(--color-border);
  padding: 18px 20px 14px;
  display: flex; flex-direction: column; gap: 14px;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
  position: relative;
}
.owner-card-v2:hover {
  border-color: var(--antares-bright-blue);
  background: #FAFCFF;
  box-shadow: 0 1px 0 rgba(51,60,102,0.04), 0 4px 12px -4px rgba(51,60,102,0.12);
}
.owner-card-v2:focus-visible {
  outline: 3px solid var(--antares-bright-blue);
  outline-offset: -1px;
}
.owner-card-v2 .ohead {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 16px;
  border-bottom: 1px solid var(--grid-line);
  padding-bottom: 12px;
}
.owner-card-v2 .oname {
  font-family: var(--font-serif); font-weight: 600; font-size: 18px;
  color: var(--antares-signature-navy); letter-spacing: -0.005em;
  line-height: 1.2;
}
.owner-card-v2 .orole {
  font-size: 11px; color: var(--antares-stone-gray);
  margin-top: 3px; letter-spacing: 0.02em;
}
.owner-card-v2 .onet { text-align: right; }
.owner-card-v2 .onet-l {
  font-size: 9.5px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--antares-stone-gray); font-weight: 600;
}
.owner-card-v2 .onet-v {
  font-family: var(--font-serif); font-weight: 600; font-size: 18px;
  color: var(--antares-signature-navy); font-variant-numeric: tabular-nums;
  margin-top: 2px;
}
.owner-card-v2 .onet.risk .onet-v { color: var(--risk-red); }
.owner-card-v2 .onet.opp  .onet-v { color: var(--opp-green); }

.owner-card-v2 .okpis {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
  border: 1px solid var(--grid-line);
  background: #FCFBF8;
}
.owner-card-v2 .okpi {
  padding: 10px 12px;
  border-right: 1px solid var(--grid-line);
}
.owner-card-v2 .okpi:last-child { border-right: none; }
.owner-card-v2 .okpi-l {
  font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--antares-stone-gray); font-weight: 600;
  margin-bottom: 4px;
}
.owner-card-v2 .okpi-v {
  font-family: var(--font-serif); font-weight: 600; font-size: 17px;
  color: var(--antares-signature-navy); font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.owner-card-v2 .okpi-v.risk { color: var(--risk-red); }
.owner-card-v2 .okpi-s {
  font-size: 10px; color: var(--antares-stone-gray); margin-top: 2px;
}

.owner-card-v2 .obar-block { display: flex; flex-direction: column; gap: 4px; }
.owner-card-v2 .obar-cap {
  display: flex; justify-content: space-between;
  font-size: 10.5px; color: var(--antares-stone-gray);
  letter-spacing: 0.04em;
}
.owner-card-v2 .obar-cap .tabular { color: var(--antares-soft-black); font-weight: 600; }
.owner-card-v2 .obar {
  position: relative;
  height: 10px; background: #F5F4F1; border: 1px solid var(--grid-line);
}
.owner-card-v2 .obar-spent {
  position: absolute; left: 0; top: 0; bottom: 0;
  background: var(--antares-signature-navy);
}
.owner-card-v2 .obar-remain {
  position: absolute; top: 0; bottom: 0;
  background: var(--antares-bright-blue);
  opacity: 0.55;
}
.owner-card-v2 .obar-risk {
  position: absolute; left: 0; top: 0; bottom: 0;
  background: var(--risk-red);
}
.owner-card-v2 .obar-opp {
  position: absolute; top: 0; bottom: 0;
  background: var(--opp-green);
}
.owner-card-v2 .ofoot {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 11px; color: var(--antares-stone-gray);
  border-top: 1px solid var(--grid-line); padding-top: 10px;
}
.owner-card-v2 .odrill {
  color: var(--antares-bright-blue-600);
  font-weight: 600; letter-spacing: 0.02em;
}

/* Wide drill panel (used by Domain Owner drill) */
.drill-panel-wide { width: 1540px !important; max-width: 96vw !important; }

/* Static info chip (e.g. domain pills in drill-down) */
.chip-static {
  display: inline-block;
  padding: 5px 10px;
  background: var(--antares-bright-blue-100);
  color: var(--antares-signature-navy);
  font-size: 11.5px;
  font-weight: 500;
  border: 1px solid rgba(102, 153, 255, 0.3);
}
.owner-card .name { font-family: var(--font-serif); font-weight: 600; font-size: 16px; color: var(--antares-signature-navy); letter-spacing: -0.005em; }
.owner-card .role { font-size: 11px; color: var(--antares-stone-gray); letter-spacing: 0.04em; }
.owner-card .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 4px; }
.owner-card .stat { }
.owner-card .stat .l { font-size: 10px; letter-spacing: 0.16em; text-transform: lowercase; color: var(--antares-stone-gray); font-family: var(--font-serif); font-weight: 800; }
.owner-card .stat .v { font-family: var(--font-serif); font-weight: 600; font-size: 18px; color: var(--antares-signature-navy); font-variant-numeric: tabular-nums; }
.owner-card .stat .v.neg { color: var(--risk-red); }
.owner-card .stat .v.pos { color: var(--opp-green); }
.owner-card .ro-strip { display: flex; height: 8px; background: var(--neutral-bg); margin-top: 6px; }
.owner-card .ro-strip .r { background: var(--risk-red); }
.owner-card .ro-strip .o { background: var(--opp-green); }
.owner-card .progress-line { display: flex; justify-content: space-between; font-size: 11px; color: var(--antares-stone-gray); margin-top: 8px; }

/* Toast */
.toast {
  position: fixed; bottom: 24px; right: 24px;
  background: var(--antares-signature-navy); color: #fff;
  padding: 12px 18px;
  font-size: 13px; font-weight: 500;
  z-index: 200;
  box-shadow: var(--shadow-2);
  display: flex; align-items: center; gap: 10px;
  animation: slideup 0.25s cubic-bezier(0.2,0,0.2,1);
}
@keyframes slideup { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.toast .ico { color: var(--antares-bright-blue); }

/* Scrollbar */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--antares-stone-gray-200); }
::-webkit-scrollbar-thumb:hover { background: var(--antares-stone-gray); }

/* === Filter bar === */
.filter-bar {
  background: #fff;
  border-bottom: 1px solid var(--color-border);
  padding: 10px 28px;
  display: flex; flex-direction: column; gap: 6px;
  align-items: center;
}
.fb-row {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  justify-content: center;
}
.fb-lbl {
  font-family: var(--font-serif); font-weight: 800;
  font-size: 10px; letter-spacing: 0.18em; text-transform: lowercase;
  color: var(--antares-stone-gray);
  margin-right: 2px;
}
.fb-reset {
  background: transparent; border: none; cursor: pointer;
  font-family: var(--font-sans); font-size: 12px; font-weight: 500;
  color: var(--antares-bright-blue); padding: 6px 8px;
  text-decoration: underline;
}
.fb-reset:hover { color: var(--antares-signature-navy); }

.seg-ctrl { display: inline-flex; border: 1px solid var(--color-border); }
.seg-btn {
  padding: 7px 12px; background: #fff; border: none; cursor: pointer;
  font-family: var(--font-sans); font-size: 12px; font-weight: 500;
  color: var(--antares-stone-gray); letter-spacing: -0.005em;
}
.seg-btn + .seg-btn { border-left: 1px solid var(--color-border); }
.seg-btn.active { background: var(--antares-signature-navy); color: #fff; }
.seg-btn:hover:not(.active) { color: var(--antares-signature-navy); }

.ms { position: relative; }
.ms-trigger {
  background: #fff; border: 1px solid var(--color-border); cursor: pointer;
  padding: 7px 10px; font-family: var(--font-sans); font-size: 12px; font-weight: 500;
  color: var(--antares-soft-black); display: inline-flex; align-items: center; gap: 8px;
  min-width: 110px; justify-content: space-between;
}
.ms-trigger:hover { border-color: var(--antares-bright-blue); }
.ms-caret { color: var(--antares-stone-gray); font-size: 10px; }
.ms-menu {
  position: absolute; top: calc(100% + 4px); left: 0; z-index: 30;
  background: #fff; border: 1px solid var(--color-border);
  box-shadow: var(--shadow-2);
  min-width: 240px; max-height: 320px; overflow-y: auto;
  padding: 4px 0;
}
.ms-opt {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 7px 12px; border: none; background: transparent; cursor: pointer;
  font-family: var(--font-sans); font-size: 12px; color: var(--antares-soft-black);
  text-align: left;
}
.ms-opt:hover { background: var(--antares-bright-blue-100); }
.ms-opt.all { font-weight: 600; color: var(--antares-signature-navy); }
.ms-check { color: var(--antares-bright-blue); font-size: 11px; width: 12px; }
.ms-divider { height: 1px; background: var(--grid-line); margin: 4px 0; }

/* === Tweaks-driven theme variants === */
body.density-cozy .content { padding: 36px 36px; }
body.density-cozy .card { padding: 26px 28px 28px; }
body.density-cozy .kpi { padding: 26px 24px 28px; }
body.density-cozy .tbl td { padding: 14px 14px; }

body.density-compact .content { padding: 18px; }
body.density-compact .card { padding: 16px 18px 18px; }
body.density-compact .kpi { padding: 14px 16px 16px; }
body.density-compact .kpi-value { font-size: 24px; }
body.density-compact .tbl td { padding: 8px 10px; font-size: 12px; }
body.density-compact .card-header { margin-bottom: 12px; padding-bottom: 10px; }

/* Mood: Editorial — print-feel, ivory background, navy serif emphasis */
body.mood-editorial { background: #F4F1EA; }
body.mood-editorial .topbar {
  background: #FAF7F0; color: var(--antares-signature-navy);
  border-bottom: 1px solid var(--color-border);
}
body.mood-editorial .topbar .h-title,
body.mood-editorial .topbar .eyebrow { color: var(--antares-signature-navy); }
body.mood-editorial .topbar .eyebrow { color: var(--antares-stone-gray); }
body.mood-editorial .topbar .brand { border-right-color: rgba(51,60,102,0.18); filter: invert(1) hue-rotate(180deg) saturate(0.9); }
body.mood-editorial .refresh-cluster { color: var(--antares-stone-gray); }
body.mood-editorial .refresh-cluster .src-pill { background: #fff; border-color: var(--color-border); color: var(--antares-soft-black); }
body.mood-editorial .refresh-cluster .timestamp .label { color: var(--antares-stone-gray); }
body.mood-editorial .refresh-cluster .timestamp .val { color: var(--antares-signature-navy); }
body.mood-editorial .card,
body.mood-editorial .kpi-grid,
body.mood-editorial .tbl th { background: #FAF7F0; }
body.mood-editorial .kpi { background: #FAF7F0; }
body.mood-editorial .kpi.accent { background: linear-gradient(180deg, #F4F1EA 0%, #FAF7F0 100%); }
body.mood-editorial .card-title,
body.mood-editorial .kpi-value:not(.risk):not(.opp) { font-family: var(--font-serif); }
body.mood-editorial .vendor-name { font-family: var(--font-serif); font-weight: 600; }
body.mood-editorial .filter-bar { background: #FAF7F0; }

/* Mood: Constellation — navy gradient field with bright-blue dot anchors (Antares motif) */
body.mood-constellation {
  background:
    radial-gradient(ellipse at top, rgba(102,153,255,0.06), transparent 60%),
    linear-gradient(135deg, #F4F5F8 0%, #ECEEF4 100%);
}
body.mood-constellation::before {
  content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    radial-gradient(circle at 12% 22%, var(--antares-bright-blue) 1.5px, transparent 2px),
    radial-gradient(circle at 78% 16%, var(--antares-bright-blue) 1.5px, transparent 2px),
    radial-gradient(circle at 32% 78%, var(--antares-bright-blue) 1.5px, transparent 2px),
    radial-gradient(circle at 88% 64%, var(--antares-bright-blue) 1.5px, transparent 2px),
    radial-gradient(circle at 56% 42%, var(--antares-bright-blue) 1.5px, transparent 2px),
    radial-gradient(circle at 22% 52%, var(--antares-bright-blue) 1.5px, transparent 2px);
  opacity: 0.35;
}
body.mood-constellation .content { position: relative; z-index: 1; }
body.mood-constellation .topbar {
  background: linear-gradient(135deg, #4B5E8B 0%, #202652 75%, #1C213F 100%);
  border-bottom: 1px solid rgba(102,153,255,0.4);
}
body.mood-constellation .card,
body.mood-constellation .kpi-grid {
  border-color: rgba(51,60,102,0.18);
  box-shadow: var(--shadow-1);
}
body.mood-constellation .filter-bar { background: rgba(255,255,255,0.7); backdrop-filter: blur(8px); }

/* layout helpers */
.flex { display: flex; }
.flex-1 { flex: 1; }
.gap-2 { gap: 8px; } .gap-3 { gap: 12px; } .gap-4 { gap: 16px; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.mb-2 { margin-bottom: 8px; } .mb-3 { margin-bottom: 12px; } .mb-4 { margin-bottom: 16px; } .mb-5 { margin-bottom: 24px; }
.mt-2 { margin-top: 8px; } .mt-3 { margin-top: 12px; } .mt-4 { margin-top: 16px; } .mt-5 { margin-top: 24px; }
.text-stone { color: var(--antares-stone-gray); }
.text-navy { color: var(--antares-signature-navy); }
.text-risk { color: var(--risk-red); }
.text-opp { color: var(--opp-green); }
.fs-small { font-size: 12px; }
.fs-tiny { font-size: 11px; }
.font-serif { font-family: var(--font-serif); }
.fw-600 { font-weight: 600; }
.tabular { font-variant-numeric: tabular-nums; }
.text-right { text-align: right; }

/* ============================================================
   USER GUIDE TAB
   ============================================================ */

/* Page shell */
.ug-page {
  background: var(--neutral-bg);
  min-height: 100vh;
}

/* Hero banner */
.ug-hero {
  background: var(--antares-signature-navy);
  padding: 44px 28px 40px;
  border-bottom: 3px solid #1C213F;
}
.ug-hero-inner {
  max-width: 820px;
  margin: 0 auto;
}
.ug-hero-eyebrow {
  font-family: var(--font-serif);
  font-weight: 800;
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: lowercase;
  color: rgba(255,255,255,0.48);
  margin-bottom: 12px;
}
.ug-hero-title {
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 30px;
  color: #fff;
  letter-spacing: -0.01em;
  line-height: 1.1;
  margin: 0 0 10px;
}
.ug-hero-sub {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255,255,255,0.65);
  max-width: 540px;
  margin: 0;
  text-wrap: pretty;
}

/* Body wrapper */
.ug-body {
  max-width: 820px;
  margin: 0 auto;
  padding: 28px 28px 80px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Cards */
.ug-card {
  background: #fff;
  border: 1px solid var(--color-border);
  padding: 32px 36px 36px;
}

/* Section label row */
.ug-sec-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.ug-sec-num {
  font-family: var(--font-serif);
  font-weight: 800;
  font-size: 13px;
  color: var(--antares-bright-blue);
  letter-spacing: 0.08em;
}
.ug-sec-divider {
  font-size: 11px;
  color: var(--antares-stone-gray-200);
}
.ug-sec-name {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  color: var(--antares-stone-gray);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.ug-sec-title {
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 22px;
  color: var(--antares-signature-navy);
  letter-spacing: -0.01em;
  line-height: 1.2;
  margin: 0 0 14px;
}

/* Prose */
.ug-prose {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.65;
  color: var(--antares-soft-black);
  margin: 0 0 12px;
  text-wrap: pretty;
}

/* Pills */
.ug-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 18px;
}
.ug-pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  background: var(--antares-bright-blue-100);
  color: var(--antares-signature-navy);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

/* Steps */
.ug-steps {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
}
.ug-step {
  display: flex;
  gap: 20px;
  padding-bottom: 28px;
}
.ug-step--last { padding-bottom: 0; }
.ug-step-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 30px;
}
.ug-step-badge {
  width: 30px;
  height: 30px;
  background: var(--antares-signature-navy);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}
.ug-step-line {
  flex: 1;
  width: 1px;
  background: var(--color-border);
  margin-top: 6px;
  min-height: 20px;
}
.ug-step-content {
  flex: 1;
  padding-top: 4px;
  min-width: 0;
}
.ug-step-title {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  color: var(--antares-signature-navy);
  letter-spacing: -0.01em;
  margin-bottom: 10px;
  line-height: 1.3;
}

/* Callout boxes */
.ug-callout {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 14px;
  margin-top: 14px;
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.5;
}
.ug-callout--warn {
  background: #FFF8E6;
  border: 1px solid #E8C96A;
  color: #5C3E00;
}
.ug-callout--ok {
  background: var(--opp-green-bg);
  border: 1px solid var(--opp-green-border);
  color: #1F5C36;
}
.ug-callout--info {
  background: var(--antares-bright-blue-100);
  border: 1px solid rgba(102,153,255,0.45);
  color: var(--antares-signature-navy);
}

/* Flow diagram */
.ug-flow {
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
  gap: 0;
  margin-top: 24px;
}
.ug-flow-step {
  flex: 1;
  min-width: 110px;
}
.ug-flow-box {
  height: 100%;
  border: 1px solid var(--color-border);
  padding: 18px 14px;
  background: var(--neutral-bg);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.ug-flow-box--end {
  background: var(--antares-bright-blue-100);
  border-color: var(--antares-bright-blue);
}
.ug-flow-icon {
  color: var(--antares-signature-navy);
  opacity: 0.55;
}
.ug-flow-label {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  color: var(--antares-signature-navy);
  line-height: 1.35;
}
.ug-flow-sub {
  font-family: var(--font-sans);
  font-size: 10px;
  color: var(--antares-stone-gray);
  letter-spacing: 0.01em;
}
.ug-flow-arrow {
  display: flex;
  align-items: center;
  padding: 0 6px;
  flex-shrink: 0;
}
.ug-callout--inline {
  margin: 0;
  border-left: none;
  border-right: none;
  border-bottom: none;
  border-top: 1px solid var(--opp-green-border);
}
.ug-callout strong { font-weight: 600; }

/* Prompt block */
.ug-prompt {
  border: 1px solid var(--color-border);
  overflow: hidden;
}
.ug-prompt-bar {
  background: #1C213F;
  padding: 13px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.ug-prompt-bar-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.ug-prompt-bar-title {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  letter-spacing: -0.005em;
}
.ug-prompt-bar-hint {
  font-family: var(--font-sans);
  font-size: 11px;
  color: rgba(255,255,255,0.45);
}
.ug-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--antares-bright-blue);
  border: none;
  color: #fff;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  letter-spacing: -0.005em;
  transition: opacity 0.15s, background 0.2s;
}
.ug-copy-btn:hover { opacity: 0.88; }
.ug-copy-btn--done { background: var(--opp-green); }
.ug-prompt-pre {
  background: #242A48;
  color: rgba(255,255,255,0.85);
  font-family: "SF Mono", "Consolas", "Fira Code", "Monaco", monospace;
  font-size: 12.5px;
  line-height: 1.8;
  padding: 22px 24px;
  margin: 0;
  white-space: pre;
  overflow-x: auto;
  tab-size: 2;
}

/* Checklist */
.ug-checklist {
  border: 1px solid var(--color-border);
  overflow: hidden;
}
.ug-cl-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--antares-stone-gray-100);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  color: var(--antares-signature-navy);
  border-bottom: 1px solid var(--color-border);
}
.ug-cl-progress-text {
  font-weight: 400;
  color: var(--antares-stone-gray);
  font-size: 12px;
}
.ug-cl-done-count {
  font-family: var(--font-serif);
  font-weight: 700;
  color: var(--antares-bright-blue);
  font-variant-numeric: tabular-nums;
}
.ug-cl-progress-bar {
  height: 3px;
  background: var(--antares-stone-gray-100);
  border-bottom: 1px solid var(--color-border);
}
.ug-cl-progress-fill {
  height: 100%;
  transition: width 0.3s ease, background 0.3s ease;
}
.ug-cl-list { display: flex; flex-direction: column; }
.ug-cl-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--grid-line);
  cursor: pointer;
  transition: background 0.1s;
  font-family: var(--font-sans);
  font-size: 13.5px;
  color: var(--antares-soft-black);
  user-select: none;
}
.ug-cl-item:last-child { border-bottom: none; }
.ug-cl-item:hover { background: #F8F8FB; }
.ug-cl-item--on { color: var(--antares-stone-gray); }
.ug-cl-item--on .ug-cl-text { text-decoration: line-through; text-decoration-color: var(--antares-stone-gray-200); }
.ug-cl-box {
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.12s, border-color 0.12s;
  background: #fff;
}
.ug-cl-box--on {
  background: var(--antares-signature-navy);
  border-color: var(--antares-signature-navy);
}
.ug-cl-text { flex: 1; line-height: 1.4; }

/* Known Business Rules grid */
.ug-rules-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 20px;
}
@media (max-width: 640px) {
  .ug-rules-grid { grid-template-columns: 1fr; }
}
.ug-rules-group {
  background: var(--neutral-bg);
  border: 1px solid var(--color-border);
  padding: 18px 20px;
}
.ug-rules-group-title {
  font-family: var(--font-sans);
  font-size: 10px;
  font-weight: 700;
  color: var(--antares-signature-navy);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}
.ug-rules-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ug-rules-list li {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--antares-soft-black);
  line-height: 1.5;
  padding-left: 14px;
  position: relative;
  text-wrap: pretty;
}
.ug-rules-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 7px;
  width: 5px;
  height: 5px;
  background: var(--antares-bright-blue);
  border-radius: 50%;
}
.ug-rules-list li strong { color: var(--antares-signature-navy); }

/* Step verification list */
.ug-link {
  color: var(--antares-bright-blue);
  text-decoration: none;
  font-weight: 600;
  border-bottom: 1px solid rgba(102,153,255,0.35);
  transition: border-color 0.15s;
}
.ug-link:hover { border-bottom-color: var(--antares-bright-blue); }

/* Step verification list */
.ug-verify-list {
  margin: 10px 0 14px;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ug-verify-list li {
  font-family: var(--font-sans);
  font-size: 13.5px;
  color: var(--antares-soft-black);
  line-height: 1.5;
  padding-left: 16px;
  position: relative;
}
.ug-verify-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  width: 5px;
  height: 5px;
  background: var(--antares-bright-blue);
  border-radius: 50%;
}
