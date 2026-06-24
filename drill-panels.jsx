// Main app — executive overview only
// Tabs, filter bar, and view controls removed.

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
  const [sourceInfo, setSourceInfo] = useStateA(null);
  const [asOfDate, setAsOfDate] = useStateA(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
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
    const asof = now.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
    setSourceInfo(info);
    setAsOfDate(asof);
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



  const ctx = { ...data, ...filtered, filters, filterState, setFilterState };



  return (
    <div>

      {/* ── TOP BAR ───────────────────────────────────────────────────── */}
      <div className="topbar">
        <div className="brand">
          <img src={(window.__resources && window.__resources.antaresLogo) || 'assets/logos/antares-primary-white.png'} alt="Antares" />
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
            <span className="label">as of date</span>
            <span className="val">{asOfDate}</span>
          </div>
          {sourceInfo && (
            <div className="timestamp" style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight:1.3, borderLeft:'1px solid rgba(255,255,255,0.18)', paddingLeft:20 }}>
              <span className="label">last updated</span>
              <span className="val">{_fmtTs(sourceInfo.timestamp)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── PORTFOLIO SCOPE BAR ──────────────────────────────────────── */}
      <div style={{
        background: '#F0EEE9',
        borderBottom: '1px solid var(--color-border)',
        padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 10,
        minHeight: 44,
      }}>
        <span style={{ fontSize:12, fontFamily:'var(--font-sans)', color:'var(--antares-stone-gray)', fontWeight:500 }}>
          Full Technology Portfolio
        </span>
        <span style={{ fontSize:11, color:'var(--color-border)' }}>·</span>
        <span style={{ fontSize:11, fontFamily:'var(--font-sans)', color:'var(--antares-stone-gray)', fontStyle:'italic' }}>
          Capitalization excluded · Amortization included
        </span>
        {sourceInfo && sourceInfo.filename && (
          <>
            <span style={{ fontSize:11, color:'var(--color-border)' }}>·</span>
            <span style={{ fontSize:11, fontFamily:'var(--font-sans)', color:'var(--antares-stone-gray)', fontStyle:'italic' }}>
              {sourceInfo.filename}
            </span>
          </>
        )}
      </div>

      {/* ── TAB BAR ──────────────────────────────────────────────────── */}
      <div className="tabs-bar">
        <button
          className={`tab${activeTab === 'overview' ? ' active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >Overview</button>
        <button
          className={`tab${activeTab === 'guide' ? ' active' : ''}`}
          onClick={() => setActiveTab('guide')}
        >User Guide</button>
      </div>

      {/* ── TAB CONTENT ──────────────────────────────────────────────── */}
      {activeTab === 'overview' ? (
        <div className="content"><OverviewTab key={uploadKey} data={ctx} /></div>
      ) : (
        <UserGuideTab />
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

// ── Boot: latest GitHub workbook → JSON fallback ────────────────────────
(async function boot() {
  try {
    let data;

    // Clear old per-browser uploads so every visitor sees the latest deployed workbook.
    try {
      localStorage.removeItem('techfin-data-v1');
      localStorage.removeItem('techfin-source-v1');
      localStorage.removeItem('techfin-asof-v1');
    } catch(e) {
      console.warn('[boot] localStorage clear failed:', e.message);
    }

    // ── 1. Always load the latest workbook from GitHub Pages.
    try {
      const baseExcelUrl = (window.__resources && window.__resources.excelFile) || 'uploads/new_workbook.xlsx';
      const sep = baseExcelUrl.includes('?') ? '&' : '?';
      const resp = await fetch(baseExcelUrl + sep + 'v=' + Date.now(), { cache: 'no-store' });
      if (resp.ok) {
        const buf = await resp.arrayBuffer();
        data = parseTechFinancialsXlsxFromArrayBuffer(buf);
        data._bootSource = 'excel';
      }
    } catch(e) {
      console.warn('[boot] Excel load failed, using JSON fallback:', e.message);
    }

    // ── 2. Fall back to financials.json
    if (!data) {
      const baseJsonUrl = (window.__resources && window.__resources.financialsJson) || 'data/financials.json';
      const sep = baseJsonUrl.includes('?') ? '&' : '?';
      const resp = await fetch(baseJsonUrl + sep + 'v=' + Date.now(), { cache: 'no-store' });
      data = await resp.json();
      data._bootSource = 'json';
    }
    const root = ReactDOM.createRoot(document.getElementById('app'));
    root.render(<App data={data} />);
  } catch(err) {
    document.getElementById('app').innerHTML =
      `<div style="padding:40px;color:#B23A3A;font-family:sans-serif">Failed to load data: ${err.message}</div>`;
  }
})();
