// Category tab — Annual Budget vs Year-End Forecast by Category
// "Category" in this tab maps to Sub-Category1 from the Master Data
const { useMemo: useMemoC } = React;

function CategoryTab({ data }) {
  // Aggregate by Sub-Category1 (displayed as "Category")
  const rows = useMemoC(() => {
    const map = {};
    (data.lineItems || []).forEach(li => {
      // Apply the same global filters that already shape data.vendors
      // (we re-aggregate from lineItems here for accuracy on this view)
      const key = li.subCategory || '— Uncategorized —';
      if (!map[key]) map[key] = { name: key, budget: 0, actual: 0, forecast: 0, net: 0, count: 0 };
      map[key].budget += li.budget;
      map[key].actual += li.actual;
      map[key].forecast += li.forecast;
      map[key].net += li.net;
      map[key].count += 1;
    });
    // Apply current filter set (mirrors filter-bar's filterLineItems but quickly)
    return Object.values(map)
      .map(r => ({ ...r, yef: r.budget + r.net }))
      .sort((a,b) => b.budget - a.budget);
  }, [data]);

  // Use filtered line items if available
  const filteredRows = useMemoC(() => {
    const f = data.filters || {};
    const items = (typeof window.filterLineItems === 'function' && data.lineItems)
      ? window.filterLineItems(data.lineItems, f)
      : (data.lineItems || []);
    const map = {};
    items.forEach(li => {
      const key = li.subCategory || '— Uncategorized —';
      if (!map[key]) map[key] = { name: key, budget: 0, actual: 0, forecast: 0, net: 0, count: 0 };
      map[key].budget += li.budget;
      map[key].actual += li.actual;
      map[key].forecast += li.forecast;
      map[key].net += li.net;
      map[key].count += 1;
    });
    return Object.values(map)
      .map(r => ({ ...r, yef: r.budget + r.net }))
      .sort((a,b) => b.budget - a.budget);
  }, [data]);

  const display = filteredRows.length ? filteredRows : rows;
  const totalBudget = display.reduce((s,r) => s + r.budget, 0);
  const totalYef = display.reduce((s,r) => s + r.yef, 0);
  const max = Math.max(...display.map(r => Math.max(r.budget, r.yef)), 1);

  return (
    <div>
      {/* Hero summary strip */}
      <div className="kpi-grid mb-4" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        <div className="kpi">
          <div className="kpi-label">categories</div>
          <div className="kpi-value">{display.length}</div>
          <div className="kpi-sub">distinct sub-category1 buckets</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">total annual budget</div>
          <div className="kpi-value">{fmt.m(totalBudget)}</div>
          <div className="kpi-sub">sum across categories</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">total year-end forecast</div>
          <div className="kpi-value" style={{color: totalYef > totalBudget ? 'var(--risk-red)' : 'var(--antares-signature-navy)'}}>{fmt.m(totalYef)}</div>
          <div className="kpi-sub">{fmt.signed(totalYef - totalBudget)} vs budget</div>
        </div>
      </div>

      {/* Bar chart card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Annual Budget vs Year-End Forecast by Category</div>
            <div className="card-sub">Sorted by Annual Budget · descending</div>
          </div>
          <div className="flex gap-3 fs-tiny text-stone">
            <span className="flex items-center gap-2"><span style={{width:10,height:10,background:'#333C66',display:'inline-block'}}/>annual budget</span>
            <span className="flex items-center gap-2"><span style={{width:10,height:10,background:'#6699FF',display:'inline-block'}}/>year-end forecast</span>
            <span className="flex items-center gap-2"><span style={{width:10,height:10,background:'var(--risk-red)',display:'inline-block'}}/>over budget</span>
          </div>
        </div>
        <div>
          {display.map(r => {
            const bw = (r.budget / max) * 100;
            const fw = (r.yef / max) * 100;
            const over = r.yef > r.budget;
            return (
              <div key={r.name} style={{display:'grid', gridTemplateColumns:'220px 1fr 240px', gap:14, alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--grid-line)'}}>
                <div>
                  <div style={{fontWeight:600, color:'var(--antares-signature-navy)', fontSize:13}}>{r.name}</div>
                  <div className="fs-tiny text-stone">{r.count} line item{r.count===1?'':'s'}</div>
                </div>
                <div style={{display:'grid', gridTemplateRows:'1fr 1fr', gap:4}}>
                  <div style={{position:'relative', height:16, background:'#FAFAF8'}}>
                    <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${bw}%`, background:'#333C66'}} />
                    <div style={{position:'absolute', right:6, top:0, bottom:0, display:'flex', alignItems:'center', fontSize:11, color:'var(--antares-stone-gray)', fontVariantNumeric:'tabular-nums'}}>budget</div>
                  </div>
                  <div style={{position:'relative', height:16, background:'#FAFAF8'}}>
                    <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${fw}%`, background: over ? 'var(--risk-red)' : '#6699FF'}} />
                    <div style={{position:'absolute', right:6, top:0, bottom:0, display:'flex', alignItems:'center', fontSize:11, color:'var(--antares-stone-gray)', fontVariantNumeric:'tabular-nums'}}>forecast</div>
                  </div>
                </div>
                <div className="text-right tabular fs-small" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6}}>
                  <span style={{color:'var(--antares-signature-navy)', fontWeight:600}}>{fmt.k(r.budget)}</span>
                  <span style={{color: over ? 'var(--risk-red)' : 'var(--antares-bright-blue-600)', fontWeight:600}}>{fmt.k(r.yef)}</span>
                  <span style={{color: over ? 'var(--risk-red)' : 'var(--opp-green)', fontWeight:600}}>{fmt.signed(r.yef - r.budget)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between fs-tiny text-stone mt-3" style={{borderTop:'1px solid var(--grid-line)', paddingTop: 8}}>
          <span>annual budget · year-end forecast · variance</span>
          <span>total: {fmt.m(totalBudget)} → {fmt.m(totalYef)} ({fmt.signed(totalYef - totalBudget)})</span>
        </div>
      </div>
    </div>
  );
}

window.CategoryTab = CategoryTab;
