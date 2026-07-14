// Filter bar — global controls that drive every tab
const { useState: useStateF, useRef: useRefF, useEffect: useEffectF } = React;

const PERIOD_RANGES = {
  'full': { months: [0,1,2,3,4,5,6,7,8,9,10,11], label: 'Full Year' },
  'ytd':  { months: [0,1,2], label: 'YTD (Mar)' },
  'q1':   { months: [0,1,2], label: 'Q1' },
  'q2':   { months: [3,4,5], label: 'Q2' },
  'q3':   { months: [6,7,8], label: 'Q3' },
  'q4':   { months: [9,10,11], label: 'Q4' },
};

function Segmented({ options, value, onChange }) {
  return (
    <div className="seg-ctrl">
      {options.map(o => (
        <button
          key={o.value}
          className={`seg-btn ${value === o.value ? 'active' : ''}`}
          onClick={() => onChange(o.value)}
        >{o.label}</button>
      ))}
    </div>
  );
}

function MultiSelect({ label, options, selected, onChange, allLabel }) {
  const [open, setOpen] = useStateF(false);
  const ref = useRefF();
  useEffectF(() => {
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const isAll = selected.length === 0;
  const display = isAll ? `${allLabel} ${options.length}` : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  function handleAll() {
    // If in no-filter mode, expand to explicit-all so user can uncheck individual items
    // If in some/explicit mode, go back to no-filter
    if (isAll) onChange(options);
    else       onChange([]);
  }

  function toggle(o) {
    const base = isAll ? options : selected;
    const next = base.includes(o) ? base.filter(x => x !== o) : [...base, o];
    onChange(next.length === options.length ? [] : next);
  }

  // An item is visually checked if we're in all-mode OR it's explicitly in selected
  const isChecked = o => isAll || selected.includes(o);
  const allChecked = isAll || selected.length === options.length;

  return (
    <div className="ms" ref={ref}>
      <button className="ms-trigger" onClick={() => setOpen(!open)}>
        <span style={{maxWidth: 180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{display}</span>
        <span className="ms-caret">▾</span>
      </button>
      {open && (
        <div className="ms-menu">
          {/* All checkbox */}
          <button className="ms-opt all" onClick={handleAll}>
            <span className="ms-check">{allChecked ? '●' : '○'}</span> {allLabel} ({options.length})
          </button>
          <div className="ms-divider" />
          {options.map(o => (
            <button key={o} className="ms-opt" onClick={() => toggle(o)}>
              <span className="ms-check">{isChecked(o) ? '●' : '○'}</span>
              <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis'}}>{o}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const CATEGORY_ORDER = [
  'Labor/T&M',
  'Managed Service',
  'Managed Service(MS)',
  'Fixed Price Contract',
  'Fixed Price Contract(FPC)',
  'Software',
  'Hardware',
  'Infrastructure',
  'Other Operating Expense',
  'Other Operating Expense(OOE)',
];
function sortCategories(cats) {
  if (!cats) return cats;
  return [...cats].sort((a, b) => {
    const ai = CATEGORY_ORDER.findIndex(o => a && a.toLowerCase().startsWith(o.toLowerCase()));
    const bi = CATEGORY_ORDER.findIndex(o => b && b.toLowerCase().startsWith(o.toLowerCase()));
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function FilterBar({ filters, setFilters, lookups }) {
  function update(k, v) { setFilters({ ...filters, [k]: v }); }
  return (
    <div className="filter-bar">
      <div className="fb-row">
        <span className="fb-lbl">view</span>
        <Segmented
          value={filters.view}
          onChange={(v) => update('view', v)}
          options={[
            { value: 'actuals', label: 'Actuals only' },
            { value: 'forecast', label: 'Forecast only' },
            { value: 'both', label: 'Actuals + Forecast' },
          ]}
        />
        <span className="fb-lbl">period</span>
        <Segmented
          value={filters.period}
          onChange={(v) => update('period', v)}
          options={[
            { value: 'full', label: 'Full year' },
            { value: 'ytd', label: 'YTD (Mar)' },
            { value: 'q1', label: 'Q1' },
            { value: 'q2', label: 'Q2' },
            { value: 'q3', label: 'Q3' },
            { value: 'q4', label: 'Q4' },
          ]}
        />
        <span className="fb-lbl">domain</span>
        <MultiSelect label="Domain" options={lookups.domains} selected={filters.domains} onChange={(v)=>update('domains', v)} allLabel="All" />
        <span className="fb-lbl">category</span>
        <MultiSelect label="Category" options={sortCategories(lookups.categories)} selected={filters.categories} onChange={(v)=>update('categories', v)} allLabel="All" />
        <span className="fb-lbl">onestream cat.</span>
        <MultiSelect label="OneStream Category" options={lookups.onestreamCategories || []} selected={filters.onestreamCategories} onChange={(v)=>update('onestreamCategories', v)} allLabel="All" />
        <span className="fb-lbl">sub-category1</span>
        <MultiSelect label="Sub-Category1" options={lookups.subCategories || []} selected={filters.subCategories || []} onChange={(v)=>update('subCategories', v)} allLabel="All" />
      </div>
      <div className="fb-row">
        <span className="fb-lbl">vendor</span>
        <MultiSelect label="Vendor" options={lookups.vendors} selected={filters.vendors} onChange={(v)=>update('vendors', v)} allLabel="All" />
        <button className="fb-reset" onClick={() => setFilters({ view:'both', period:'full', domains:[], categories:[], onestreamCategories:[], subCategories:[], vendors:[], units: filters.units })}>Reset filters</button>
        <div style={{flex:1}} />
        <span className="fb-lbl">units</span>
        <Segmented
          value={filters.units}
          onChange={(v)=>update('units', v)}
          options={[
            { value:'auto', label:'Auto' },
            { value:'M', label:'$M' },
            { value:'K', label:'$K' },
            { value:'1', label:'$' },
          ]}
        />
      </div>
    </div>
  );
}

// Helper: filter line items per the current filter state
function filterLineItems(lineItems, f) {
  return lineItems.filter(li => {
    if (f.domains.length > 0 && !f.domains.includes(li.domain)) return false;
    if (f.categories.length > 0 && !f.categories.includes(li.category)) return false;
    if (f.onestreamCategories && f.onestreamCategories.length > 0 && !f.onestreamCategories.includes(li.onestreamCategory)) return false;
    if (f.subCategories && f.subCategories.length > 0 && !f.subCategories.includes(li.subCategory)) return false;
    if (f.vendors.length > 0 && !f.vendors.includes(li.vendor)) return false;
    return true;
  });
}

// Helper: aggregate filtered line items into the same shape as data.summary / vendors / owners
function aggregate(lineItems, period, view) {
  const months = PERIOD_RANGES[period].months;
  const sumMonths = (arr) => months.reduce((s,i)=>s+(arr[i]||0), 0);
  const LAST_ACT_MONTH = 4; // May — hardcoded; update when close cycle advances
  const actMonths = months.filter(m => m <= LAST_ACT_MONTH);
  const fcMonths  = months.filter(m => m >  LAST_ACT_MONTH);

  let actualTotal = 0, forecastTotal = 0, riskTotal = 0, oppTotal = 0, budgetTotal = 0;
  const monthlyACTotal = new Array(12).fill(0);
  const monthlyFCTotal = new Array(12).fill(0);

  for (const li of lineItems) {
    const acPart = actMonths.reduce((s,i)=>s+(li.monthlyAC[i]||0), 0);
    const fcPart = fcMonths.reduce((s,i)=>s+(li.monthlyFC[i]||0), 0);
    actualTotal   += acPart;
    forecastTotal += acPart + fcPart;
    // Risk/Opp from monthly distribution restricted to period
    const ro = sumMonths(li.monthlyOR);
    if (ro > 0) oppTotal += ro;
    if (ro < 0) riskTotal += -ro;
    // Budget: prorate across selected months (12 months in dataset)
    budgetTotal += (li.budget * (months.length / 12));
    li.monthlyAC.forEach((v,i)=>{ monthlyACTotal[i]+=v; });
    li.monthlyFC.forEach((v,i)=>{ monthlyFCTotal[i]+=v; });
  }
  // Note: Risk = unfavorable (positive net), Opp = favorable (negative net)
  // Original convention in source: Risk col positive = unfav, Opp col negative = fav
  // Recompute from totals using line-item sums of risk/opp columns when full period
  let displayRisk = 0, displayOpp = 0;
  if (period === 'full') {
    displayRisk = lineItems.reduce((s,li)=>s+li.risk, 0);
    displayOpp = lineItems.reduce((s,li)=>s+li.opp, 0);
  } else {
    // For period subsets, sum monthly Opp/Risk where positive = opp (favorable) in source convention
    const periodOR = lineItems.reduce((s,li) => s + sumMonths(li.monthlyOR), 0);
    // monthlyOR: positive = opp (per source), negative = risk
    // But total Opp/Risk col in source = unfav reduces it. Let's keep: displayRisk = positive amount of NetPosition impact
    // Net contribution from monthlyOR for period (source semantics)
    // For simplicity in period mode, separate positive/negative monthlyOR contributions
    let posOR = 0, negOR = 0;
    for (const li of lineItems) {
      months.forEach(i => {
        const v = li.monthlyOR[i] || 0;
        if (v > 0) posOR += v;
        if (v < 0) negOR += v;
      });
    }
    displayOpp = -posOR; // express as negative (favorable)
    displayRisk = -negOR; // express as positive (unfavorable)
  }
  const netPosition = displayRisk + displayOpp;

  return {
    budget: budgetTotal,
    actual: actualTotal,
    forecast: forecastTotal,
    remaining: forecastTotal - actualTotal,
    risk: displayRisk,
    opp: displayOpp,
    net: netPosition,
    monthlyAC: monthlyACTotal,
    monthlyFC: monthlyFCTotal,
  };
}

window.FilterBar = FilterBar;
window.filterLineItems = filterLineItems;
window.aggregate = aggregate;
window.PERIOD_RANGES = PERIOD_RANGES;
