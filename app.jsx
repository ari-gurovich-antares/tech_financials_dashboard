// Main app — executive overview only
// Tabs, filter bar, and view controls removed.

// Bumped every time the standalone is re-bundled with a new workbook.
// Boot uses this to decide whether localStorage (a user upload) is newer
// than the embedded Excel. Stale localStorage without an uploadTs loses.
const BUNDLE_DATE = '2026-07-08T00:00:00Z'; // bumped: notesRO, dynamic as-of, vendor charts
// Schema version — bump when parsed data shape changes (e.g. new fields added to lineItems).
// localStorage fallback is ignored if its schema doesn't match.
const SCHEMA_VERSION = 2;

const { useState: useStateA, useEffect, useMemo: useMemoA } = React;

const TWEAK_DEFAULTS = {
  "mood":    "default",
  "density": "regular"
};

// Format "Jun 23, 2026, 12:40 PM" → "Jun 23, 2026 · 12:40 PM"
function _fmtTs(ts) {
  if (!ts) return '';
  const i = ts.lastIndexOf(', ');
  return i < 0 ? ts : ts.slice(0, i) + ' · ' + ts.slice(i + 2);
}

// ── YTD Reconciliation Marker ──────────────────────────────────────────
// Subtle indicator shown in the topbar next to "last updated".
// Green = Master Data and YTD pivot agree within $1K.
// Amber = they differ (stale pivot or row scope change).
// Hover reveals a popover with the diff detail.
function YtdMarker({ workbookSubtotal, ytdSummary }) {
  const [open, setOpen] = useStateA(false);
  if (!ytdSummary || !workbookSubtotal) return null;

  const md  = workbookSubtotal;
  const ytd = ytdSummary;
  const diffs = {
    budget:   Math.round(md.budget   - ytd.budget),
    forecast: Math.round(md.forecast - ytd.forecast),
    risk:     Math.round(md.risk     - ytd.risk),
    net:      Math.round(md.net      - ytd.net),
  };
  const reconciled = Object.values(diffs).every(d => Math.abs(d) <= 1000);
  const fmtK = n => (n >= 0 ? '+' : '') + '$' + (n / 1000).toFixed(1) + 'K';
  const fmtM = n => '$' + (n / 1e6).toFixed(2) + 'M';

  return (
    <div style={{ position:'relative' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:4, cursor:'pointer',
          padding:'3px 8px', border:'1px solid',
          borderColor: reconciled ? 'rgba(114,212,160,0.5)' : 'rgba(255,200,80,0.5)',
          background:  reconciled ? 'rgba(31,122,77,0.18)'  : 'rgba(150,96,10,0.18)',
          borderRadius:3,
        }}
      >
        <span style={{ width:6, height:6, borderRadius:'50%', background: reconciled ? '#72D4A0' : '#F5B942', flexShrink:0 }} />
        <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.06em', color: reconciled ? '#A8E8C8' : '#F5D080', whiteSpace:'nowrap' }}>
          {reconciled ? 'YTD reconciled' : 'YTD refresh needed'}
        </span>
      </div>
      {open && (
        <div style={{
          position:'absolute', right:0, top:'calc(100% + 6px)', zIndex:200,
          background:'#1A1F3C', border:'1px solid #333C66', borderRadius:6,
          padding:'12px 14px', minWidth:240, boxShadow:'0 4px 16px rgba(0,0,0,0.4)',
          fontFamily:'var(--font-sans)', fontSize:11, color:'#D8D6D2',
        }}>
          <div style={{ fontWeight:700, color:'#fff', marginBottom:8, fontSize:12 }}>YTD Reconciliation</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:'3px 10px', marginBottom:10 }}>
            {[['Budget', md.budget, ytd.budget], ['Forecast', md.forecast, ytd.forecast], ['Risk', md.risk, ytd.risk], ['Net', md.net, ytd.net]].map(([label, mdV, ytdV]) => {
              const d = Math.round(mdV - ytdV);
              return [
                <span key={label+'-l'} style={{ color:'#9E9B97' }}>{label}</span>,
                <span key={label+'-m'} style={{ textAlign:'right', color:'#D8D6D2', fontVariantNumeric:'tabular-nums' }}>{fmtM(mdV)}</span>,
                <span key={label+'-d'} style={{ textAlign:'right', fontVariantNumeric:'tabular-nums', color: Math.abs(d)>1000?'#F5B942':'#72D4A0' }}>{fmtK(d)}</span>,
              ];
            })}
          </div>
          <div style={{ borderTop:'1px solid #333C66', paddingTop:8, fontSize:10, color:'#807E7A', lineHeight:1.5 }}>
            {reconciled
              ? 'Master Data and YTD pivot agree within $1K.'
              : 'Suggested action: open workbook → Data → Refresh All → save → re-upload.'}
          </div>
          <div style={{ marginTop:6, display:'grid', gridTemplateColumns:'auto auto', gap:'2px 10px', fontSize:9.5, color:'#807E7A' }}>
            <span>MD</span><span>Master Data (cleaned)</span>
            <span>Diff</span><span>MD minus YTD Financials Run Rate</span>
          </div>
          <button onClick={e=>{e.stopPropagation();setOpen(false);}} style={{ position:'absolute', top:8, right:10, background:'none', border:'none', color:'#807E7A', cursor:'pointer', fontSize:14, lineHeight:1 }}>×</button>
        </div>
      )}
    </div>
  );
}

function exportAllTables(data) {
  if (typeof XLSX === 'undefined') { alert('SheetJS not loaded — please refresh.'); return; }
  const wb = XLSX.utils.book_new();

  // Sheet 1: Vendors
  const vendorRows = (data.vendors || []).map(v => ({
    'Vendor':          v.vendor,
    'Domain':          (v.domains || []).join('; '),
    'Domain Owner':    (v.domainOwners || []).join('; '),
    'Budget':          v.budget,
    'Actuals':         v.actual,
    'Forecast':        v.forecast,
    'Risk':            v.risk,
    'Opportunity':     v.opp,
    'Net Risk/(Opp)':  v.net,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vendorRows), 'Vendors');

  // Sheet 2: Line Items
  const liRows = (data.lineItems || []).map(li => ({
    'Vendor':        li.vendor,
    'Domain':        li.domain,
    'Domain Owner':  li.owner,
    'Category':      li.category,
    'Sub-Category':  li.subCategory,
    'Project':       li.project,
    'Application':   li.application,
    'Budget':        li.budget,
    'Actuals':       li.actual,
    'Forecast':      li.forecast,
    'Risk':          li.risk,
    'Opportunity':   li.opp,
    'Net':           li.net,
    'Notes':         li.notes || '',
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(liRows), 'Line Items');

  // Sheet 3: Risk & Opp Log
  const roRows = (data.riskOppLog || []).map(li => ({
    'Vendor':       li.vendor,
    'Domain':       li.domain,
    'Project':      li.project,
    'Application':  li.application,
    'Category':     li.category,
    'Budget':       li.budget,
    'Forecast':     li.forecast,
    'Risk':         li.risk,
    'Opportunity':  li.opp,
    'Net':          li.net,
    'Notes':        li.notesRO || li.notes || '',
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(roRows), 'Risk & Opp Log');

  // Sheet 4: Domain Owners
  const doRows = (data.domainOwners || []).map(o => ({
    'Domain Owner':  o.owner,
    'Domains':       (o.domains || []).join('; '),
    'Vendors':       (o.vendors || []).join('; '),
    'Budget':        o.budget,
    'Actuals':       o.actual,
    'Forecast':      o.forecast,
    'Risk':          o.risk,
    'Opportunity':   o.opp,
    'Net':           o.net,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(doRows), 'Domain Owners');

  XLSX.writeFile(wb, '2026 Tech Financials Export.xlsx');
}

function App({ data: initialData }) {
  const [filterState, setFilterState] = useStateA({ categories:[], vendors:[], domains:[], domainOwners:[], contractTypes:[], riskOppStatus:[] });
  const [filterPanelOpen, setFilterPanelOpen] = useStateA(false);
  const [data,       setData]       = useStateA(initialData);
  const [activeTab,  setActiveTab]  = useStateA('overview');
  const [uploadOpen, setUploadOpen] = useStateA(false);
  const [uploadKey,  setUploadKey]  = useStateA(0);
  const [sourceInfo, setSourceInfo] = useStateA(() => {
    try { const s = localStorage.getItem('techfin-source-v1'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  // As-of = always one month before today
  const asOfDate = (() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() - 2, 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  })();
  const lastRefreshed = data._parsedAt ? new Date(data._parsedAt) : new Date();

  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Fixed enterprise-level filters — full year, all domains, all categories
  const filters = {
    view: 'both', period: 'full',
    domains: [], categories: [], onestreamCategories: [],
    subCategories: [], vendors: [], units: 'auto',
  };

  useEffect(() => {
    document.body.className = `mood-${t.mood} density-${t.density}`;
  }, [t.mood, t.density]);

  function handleUpload(filename, parsedData) {
    console.log('[upload] selected file:', filename);
    console.log('[upload] parsed lineItems count:', parsedData.lineItems ? parsedData.lineItems.length : 0);
    if (parsedData.workbookSubtotal) {
      const ws = parsedData.workbookSubtotal;
      console.log('[upload] parsed budget=$'+Math.round(ws.budget/1e3)+'K forecast=$'+Math.round(ws.forecast/1e3)+'K risk=$'+Math.round(ws.risk/1e3)+'K opp=$'+Math.round(Math.abs(ws.opp)/1e3)+'K net=$'+Math.round(ws.net/1e3)+'K');
    }
    if (parsedData.summary) console.log('[upload] parsed backPocket=$'+Math.round((parsedData.summary.backPocket||0)/1e3)+'K');
    try {
      localStorage.setItem('techfin-data-v1', JSON.stringify({ ...parsedData, _schema: SCHEMA_VERSION }));
      const now = new Date();
      const info = {
        filename,
        timestamp: now.toLocaleString('en-US', {
          month:'short', day:'numeric', year:'numeric',
          hour:'numeric', minute:'2-digit', hour12:true,
        }),
        rowCount:    parsedData.lineItems ? parsedData.lineItems.length : 0,
        vendorCount: parsedData.vendors   ? parsedData.vendors.length  : 0,
      };
      localStorage.setItem('techfin-source-v1', JSON.stringify(info));
      localStorage.setItem('techfin-upload-ts-v1', new Date().toISOString());
      setSourceInfo(info);
    } catch(e) {
      console.warn('[upload] localStorage write failed:', e.message);
    }
    parsedData._bootSource = 'uploaded';
    parsedData._parsedAt = new Date().toISOString();
    setData(parsedData);
    setUploadKey(k => k + 1);
    console.log('[upload] setData + setUploadKey dispatched');
  }

  // ── Render-time active data log (fires on every data change) ────────────
  useEffect(() => {
    const ws  = data.workbookSubtotal;
    const src  = data._bootSource || 'boot';
    const ts   = data._parsedAt ? new Date(data._parsedAt).toLocaleTimeString() : 'unknown';
    const liCount = (data.lineItems || []).length;
    console.log('[render] active data source:', src, '| timestamp:', ts, '| lineItems:', liCount);
    if (ws) {
      console.log('[render] active budget=$'+Math.round(ws.budget/1e3)+'K forecast=$'+Math.round(ws.forecast/1e3)+'K risk=$'+Math.round(ws.risk/1e3)+'K opp=$'+Math.round(Math.abs(ws.opp)/1e3)+'K net=$'+Math.round(ws.net/1e3)+'K');
    } else {
      console.log('[render] active data source:', src, '| workbookSubtotal: null');
    }
  }, [data]);

  const filtered = useMemoA(() => {
    const items   = filterLineItems(data.lineItems, filters);
    const summary = aggregate(items, filters.period, filters.view);

    const byVendor = {};
    for (const li of items) {
      const v = li.vendor;
      if (!byVendor[v]) byVendor[v] = {
        vendor: v, budget: 0, actual: 0, forecast: 0,
        risk: 0, opp: 0, net: 0,
        domains: new Set(), domainOwners: new Set(),
        monthlyAC: new Array(12).fill(0), monthlyFC: new Array(12).fill(0),
        lineItems: []
      };
      const b      = byVendor[v];
      const months = PERIOD_RANGES[filters.period].months;
      const sumP   = arr => months.reduce((s, i) => s + (arr[i] || 0), 0);
      b.budget  += li.budget * (months.length / 12);
      b.actual  += sumP(li.monthlyAC);
      const fcMonthly = sumP(li.monthlyFC);
      b.forecast += fcMonthly > 0 ? fcMonthly : (li.forecast || 0);
      b.risk    += li.risk;
      b.opp     += li.opp;
      b.net     += li.net;
      if (li.domain) b.domains.add(li.domain);
      if (li.owner)  b.domainOwners.add(li.owner);
      li.monthlyAC.forEach((v, i) => { b.monthlyAC[i] += v; });
      li.monthlyFC.forEach((v, i) => { b.monthlyFC[i] += v; });
      b.lineItems.push(li);
    }
    const vendors = Object.values(byVendor).map(v => ({
      ...v,
      domains:       [...v.domains],
      domainOwners:  [...v.domainOwners],
    }));

    const riskOppLog = items
      .filter(x => Math.abs(x.net) > 100 || x.risk !== 0 || x.opp !== 0)
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

    return { summary, vendors, riskOppLog };
  }, [data]);



  // Preserve backPocket from the parsed workbook summary.
  // filtered.summary (from aggregate()) overwrites data.summary but has no backPocket field.
  const _parsedBackPocket = (data.summary && typeof data.summary.backPocket === 'number')
    ? data.summary.backPocket : 0;
  const ctx = { ...data, ...filtered,
    summary: { ...filtered.summary, backPocket: _parsedBackPocket },
    filters, filterState, setFilterState };



  return (
    <div>

      {/* ── TOP BAR ───────────────────────────────────────────────────── */}
      <div className="topbar">
        <div className="brand">
          <img src={(window.__resources && window.__resources.antaresLogo) || 'design-system/antares-primary-white.png'} alt="Antares" />
        </div>
        <div className="title-block">
          <div className="eyebrow">a n t a r e s &nbsp; c a p i t a l</div>
          <div className="h-title" style={{ fontWeight: 700 }}>2026 Technology Financials</div>
        </div>
        <div className="spacer" />
        <button
          onClick={() => setUploadOpen(true)}
          style={{
            display:'flex', alignItems:'center', gap:7,
            padding:'7px 14px',
            background:'rgba(255,255,255,0.10)',
            border:'1px solid rgba(255,255,255,0.22)',
            color:'#fff', cursor:'pointer',
            fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600,
            letterSpacing:'0.01em', transition:'background 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.10)'}
        >
          <Icon name="upload" size={13} color="#fff" />
          Upload Workbook
        </button>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <YtdMarker workbookSubtotal={data.workbookSubtotal} ytdSummary={data.ytdSummary} />
          <div style={{ display:'flex', gap:20, alignItems:'center' }}>
            <div className="timestamp" style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight:1.3 }}>
              <span className="label">As of</span>
              <span className="val">{asOfDate}</span>
            </div>
            <div className="timestamp" style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight:1.3 }}>
              <span className="label">Last Refreshed</span>
              <span className="val">{_fmtTs(lastRefreshed.toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit', hour12:true }))}</span>
            </div>
          </div>
        </div>
      </div>


      {/* ── TAB BAR ──────────────────────────────────────────────────── */}
      <div className="tabs-bar">
        <button
          className={`tab${activeTab === 'overview' ? ' active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >Overview</button>
        <button
          className={`tab${activeTab === 'vendors' ? ' active' : ''}`}
          onClick={() => setActiveTab('vendors')}
        >Vendors</button>
        <button
          className={`tab${activeTab === 'guide' ? ' active' : ''}`}
          onClick={() => setActiveTab('guide')}
        >User Guide</button>
      </div>

      {/* ── TAB CONTENT ──────────────────────────────────────────────── */}
      {activeTab === 'overview' ? (
        <div className="content"><OverviewTab key={uploadKey} data={ctx} /></div>
      ) : activeTab === 'guide' ? (
        <UserGuideTab />
      ) : null}



      {activeTab === 'vendors' && (
        <div className="content"><VendorsTab data={ctx} view={filters.view} /></div>
      )}

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onUpload={handleUpload}
          lastRefresh={sourceInfo ? sourceInfo.timestamp : null}
        />
      )}

      <TweaksPanel>
        <TweakSection label="Mood" />
        <TweakRadio
          label="Visual mood"
          value={t.mood}
          options={['default', 'editorial', 'constellation']}
          onChange={v => setTweak('mood', v)}
        />
        <TweakSection label="Layout" />
        <TweakRadio
          label="Density"
          value={t.density}
          options={['compact', 'regular', 'cozy']}
          onChange={v => setTweak('density', v)}
        />
      </TweaksPanel>

    </div>
  );
}

// ── Boot: xlsx (always primary) → localStorage fallback → JSON last-resort ──────
(async function boot() {
  try {
    let data;

    // ── 1. Always fetch uploads/new_workbook.xlsx first.
    //    Cache-busting (?v=timestamp) ensures the browser never serves a stale
    //    copy after Power Automate replaces the file on GitHub Pages.
    try {
      const xlsxUrl = (window.__resources && window.__resources.excelFile)
        || ('uploads/new_workbook.xlsx?v=' + Date.now());
      const resp = await fetch(xlsxUrl);
      if (resp.ok) {
        const buf = await resp.arrayBuffer();
        data = parseTechFinancialsXlsxFromArrayBuffer(buf);
        data._bootSource = 'excel';
        data._parsedAt = new Date().toISOString();
        console.log('[boot] Loaded uploads/new_workbook.xlsx (cache-busted, fresh fetch)');
      }
    } catch(e) {
      console.warn('[boot] Excel auto-load failed:', e.message);
    }

    // ── 2. Fallback: restore a manually-uploaded workbook from localStorage.
    //    Only reached if the xlsx fetch above failed (network error, file missing, etc.).
    //    This preserves the Manual Upload Workbook experience when offline or during
    //    local development without a server.
    if (!data) {
      try {
        const saved = localStorage.getItem('techfin-data-v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.lineItems) && parsed.lineItems.length > 0
              && parsed._schema === SCHEMA_VERSION) {
            data = parsed;
            data._bootSource = 'uploaded';
            console.log('[boot] xlsx unavailable — restored manual upload from localStorage:', parsed.lineItems.length, 'rows');
          }
        }
      } catch(e) {
        console.warn('[boot] localStorage restore failed:', e.message);
      }
    }

    // ── 3. Last resort: static data/financials.json
    if (!data) {
      const resp = await fetch((window.__resources && window.__resources.financialsJson) || 'data/financials.json');
      data = await resp.json();
      data._bootSource = 'json';
      console.warn('[boot] Using static financials.json fallback — xlsx and localStorage both unavailable');
    }
    const root = ReactDOM.createRoot(document.getElementById('app'));
    root.render(<App data={data} />);
  } catch(err) {
    document.getElementById('app').innerHTML =
      `<div style="padding:40px;color:#B23A3A;font-family:sans-serif">Failed to load data: ${err.message}</div>`;
  }
})();
