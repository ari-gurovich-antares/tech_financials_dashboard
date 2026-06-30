// Main app — executive overview only
// Tabs, filter bar, and view controls removed.

// Bumped every time the standalone is re-bundled with a new workbook.
// Boot uses this to decide whether localStorage (a user upload) is newer
// than the embedded Excel. Stale localStorage without an uploadTs loses.
const BUNDLE_DATE = '2026-06-30T22:00:00Z'; // bumped: final production cleanup, stale localStorage invalidated

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
  const [asOfDate, setAsOfDate] = useStateA(() => {
    try { return localStorage.getItem('techfin-asof-v1') || 'Jun 22, 2026'; } catch { return 'Jun 22, 2026'; }
  });

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

  // ── Handle workbook upload — persist, update state, re-mount overview ──
  function handleUpload(filename, parsedData) {
    try {
      localStorage.setItem('techfin-data-v1', JSON.stringify(parsedData));
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
      const asof = now.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
      localStorage.setItem('techfin-asof-v1', asof);
      setSourceInfo(info);
      setAsOfDate(asof);
    } catch(e) {
      console.warn('[upload] localStorage write failed:', e.message);
    }
    parsedData._bootSource = 'uploaded';
    setData(parsedData);
    setUploadKey(k => k + 1); // re-mount OverviewTab to reset its local filters
  }

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
      b.forecast+= sumP(li.monthlyFC);
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
        <div style={{ display:'flex', gap:20, alignItems:'center' }}>
          <div className="timestamp" style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight:1.3 }}>
            <span className="label">last updated</span>
            <span className="val">{sourceInfo ? _fmtTs(sourceInfo.timestamp) : _fmtTs(new Date(BUNDLE_DATE).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit', hour12:true }))}</span>
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
          if (parsed && Array.isArray(parsed.lineItems) && parsed.lineItems.length > 0) {
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
