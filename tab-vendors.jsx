// Vendors tab — ranking + drill-in
const { useState: useStateV, useMemo } = React;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function VendorsTab({ data, view }) {
  const [sortBy, setSortBy] = useStateV('actual');
  const [sortDir, setSortDir] = useStateV('desc');
  const [search, setSearch] = useStateV('');
  const [filter, setFilter] = useStateV('all'); // all / risk / opp / over
  const [selected, setSelected] = useStateV(null);

  const sorted = useMemo(() => {
    let v = data.vendors.slice();
    if (search.trim()) {
      const q = search.toLowerCase();
      v = v.filter(x => x.vendor.toLowerCase().includes(q));
    }
    if (filter === 'risk') v = v.filter(x => x.net > 0);
    if (filter === 'opp') v = v.filter(x => x.net < 0);
    if (filter === 'over') v = v.filter(x => x.actual > x.budget);
    v.sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy];
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return v;
  }, [data.vendors, sortBy, sortDir, search, filter]);

  function setSort(k) {
    if (sortBy === k) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(k); setSortDir('desc'); }
  }

  const top10ByActual = data.vendors.slice().sort((a,b) => b.actual - a.actual).slice(0,10);
  const top10ByForecast = data.vendors.slice().sort((a,b) => b.forecast - a.forecast).slice(0,10);

  // Top 10 by Annual Budget — for the Annual Budget vs Year-End Forecast chart
  const top10ByBudget = data.vendors.slice().sort((a,b) => b.budget - a.budget).slice(0,10);
  const totalBudget = data.vendors.reduce((s,v) => s + v.budget, 0) || 1;

  // Risks & Opportunities by Vendor — for the executive view
  const roByVendor = data.vendors
    .filter(v => Math.abs(v.net) > 100 || v.risk > 0 || Math.abs(v.opp) > 0)
    .sort((a,b) => Math.abs(b.net) - Math.abs(a.net))
    .slice(0, 12);

  return (
    <div>
      {/* Annual Budget vs Year-End Forecast — Top 10 Vendors */}
      <div className="card mb-4">
        <div className="card-header">
          <div>
            <div className="card-title">Annual Budget vs Year-End Forecast – Top 10 Vendors</div>
            <div className="card-sub">Top 10 vendors ranked by Annual Budget · descending</div>
          </div>
          <div className="flex gap-3 fs-tiny text-stone">
            <span className="flex items-center gap-2"><span style={{width:10,height:10,background:'#333C66',display:'inline-block'}}/>annual budget</span>
            <span className="flex items-center gap-2"><span style={{width:10,height:10,background:'#6699FF',display:'inline-block'}}/>year-end forecast</span>
          </div>
        </div>
        {(() => {
          const max = Math.max(...top10ByBudget.map(v => Math.max(v.budget, v.budget + v.net)), 1);
          return (
            <div>
              {top10ByBudget.map(v => {
                const yef = v.budget + v.net;
                const bw = (v.budget / max) * 100;
                const fw = (yef / max) * 100;
                const over = yef > v.budget;
                return (
                  <div key={v.vendor} style={{display:'grid', gridTemplateColumns:'200px 1fr 220px', gap:12, alignItems:'center', padding:'8px 0', cursor:'pointer'}} onClick={() => setSelected(v)}>
                    <div style={{fontWeight:600, color:'var(--antares-signature-navy)', fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{v.vendor}</div>
                    <div style={{display:'grid', gridTemplateRows:'1fr 1fr', gap:3}}>
                      <div style={{position:'relative', height:14, background:'#FAFAF8'}}>
                        <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${bw}%`, background:'#333C66'}} />
                      </div>
                      <div style={{position:'relative', height:14, background:'#FAFAF8'}}>
                        <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${fw}%`, background: over ? 'var(--risk-red)' : '#6699FF'}} />
                      </div>
                    </div>
                    <div className="num text-right tabular fs-small" style={{display:'flex', flexDirection:'column', gap:2}}>
                      <span style={{color:'var(--antares-signature-navy)', fontWeight:600}}>{fmt.k(v.budget)}</span>
                      <span style={{color: over ? 'var(--risk-red)' : 'var(--antares-bright-blue-600)', fontWeight:600}}>{fmt.k(yef)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* YTD Risks & Opportunities by Vendor — Executive */}
      <div className="card mb-4">
        <div className="card-header">
          <div>
            <div className="card-title">YTD Risks & Opportunities by Vendor</div>
            <div className="card-sub">Net position per vendor · top 12 by absolute exposure</div>
          </div>
          <div className="flex gap-3 fs-tiny text-stone">
            <span className="flex items-center gap-2"><span style={{width:10,height:10,background:'#B23A3A',display:'inline-block'}}/>risk (unfavorable)</span>
            <span className="flex items-center gap-2"><span style={{width:10,height:10,background:'#2F7A4D',display:'inline-block'}}/>opp (favorable)</span>
          </div>
        </div>
        {(() => {
          const max = Math.max(...roByVendor.map(v => Math.max(v.risk, Math.abs(v.opp))), 1);
          return (
            <div>
              {roByVendor.map(v => {
                const riskW = (v.risk / max) * 50;
                const oppW = (Math.abs(v.opp) / max) * 50;
                return (
                  <div key={v.vendor} style={{display:'grid', gridTemplateColumns:'200px 1fr 110px', gap:12, alignItems:'center', padding:'8px 0', cursor:'pointer'}} onClick={() => setSelected(v)}>
                    <div style={{fontWeight:600, color:'var(--antares-signature-navy)', fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{v.vendor}</div>
                    <div style={{position:'relative', height:22, background:'#FAFAF8'}}>
                      <div style={{position:'absolute', left:'50%', top:0, bottom:0, width:1, background:'var(--antares-stone-gray-200)'}} />
                      {v.risk > 0 && (
                        <div style={{position:'absolute', right:'50%', top:0, bottom:0, width:`${riskW}%`, background:'var(--risk-red)', display:'flex', alignItems:'center', justifyContent:'flex-start', paddingLeft:6}}>
                          <span style={{color:'#fff', fontSize:11, fontWeight:600, fontVariantNumeric:'tabular-nums'}}>{fmt.k(v.risk)}</span>
                        </div>
                      )}
                      {Math.abs(v.opp) > 0 && (
                        <div style={{position:'absolute', left:'50%', top:0, bottom:0, width:`${oppW}%`, background:'var(--opp-green)', display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:6}}>
                          <span style={{color:'#fff', fontSize:11, fontWeight:600, fontVariantNumeric:'tabular-nums'}}>{fmt.k(Math.abs(v.opp))}</span>
                        </div>
                      )}
                    </div>
                    <div className="num text-right tabular" style={{fontWeight:600, color: v.net > 0 ? 'var(--risk-red)' : v.net < 0 ? 'var(--opp-green)' : 'var(--antares-stone-gray)'}}>
                      Net {Math.abs(v.net) < 1 ? '$0' : fmt.signed(v.net)}
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-between fs-tiny text-stone mt-3" style={{borderTop:'1px solid var(--grid-line)', paddingTop: 8}}>
                <span>← unfavorable variance (risk)</span>
                <span style={{color:'var(--antares-stone-gray)'}}>$0</span>
                <span>favorable variance (opp) →</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Two ranking cards */}
      <div className="row r-2-eq">
        <RankingCard title="Top Vendors by YTD Actuals" subtitle="largest jan–mar spend" vendors={top10ByActual} metric="actual" onPick={setSelected} />
        <RankingCard title="Top Vendors by 2026 Forecast" subtitle="largest projected full-year spend" vendors={top10ByForecast} metric="forecast" onPick={setSelected} />
      </div>

      {/* Vendor table */}
      <div className="card mt-4">
        <div className="card-header">
          <div>
            <div className="card-title">All Vendors</div>
            <div className="card-sub">{sorted.length} vendors · click any row for monthly drill-down</div>
          </div>
          <div className="flex gap-3 items-center">
            <div className="chips">
              <button className={`chip ${filter==='all'?'active':''}`} onClick={()=>setFilter('all')}>All</button>
              <button className={`chip ${filter==='risk'?'active':''}`} onClick={()=>setFilter('risk')}>Risk only</button>
              <button className={`chip ${filter==='opp'?'active':''}`} onClick={()=>setFilter('opp')}>Opp only</button>
              <button className={`chip ${filter==='over'?'active':''}`} onClick={()=>setFilter('over')}>Over budget</button>
            </div>
            <div className="search-box">
              <Icon name="search" size={14} color="#807E7A" />
              <input type="text" placeholder="Search vendor…" value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="tbl">
            <thead>
              <tr>
                <th className="sortable" onClick={()=>setSort('vendor')}>Vendor {sortBy==='vendor' && <span className="sort-arrow">{sortDir==='asc'?'↑':'↓'}</span>}</th>
                <th>Domain</th>
                <th className="num">Budget %</th>
                <th className="num sortable" onClick={()=>setSort('budget')}>Budget {sortBy==='budget' && <span className="sort-arrow">{sortDir==='asc'?'↑':'↓'}</span>}</th>
                <th className="num sortable" onClick={()=>setSort('actual')}>YTD Actual {sortBy==='actual' && <span className="sort-arrow">{sortDir==='asc'?'↑':'↓'}</span>}</th>
                <th className="num">Budget Consumption %</th>
                <th className="num sortable" onClick={()=>setSort('forecast')}>Forecast {sortBy==='forecast' && <span className="sort-arrow">{sortDir==='asc'?'↑':'↓'}</span>}</th>
                <th className="num">Risk</th>
                <th className="num">Opp</th>
                <th className="num sortable" onClick={()=>setSort('net')}>Net Position {sortBy==='net' && <span className="sort-arrow">{sortDir==='asc'?'↑':'↓'}</span>}</th>
                <th className="num">Year-End Forecast</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(v => {
                const consumed = v.budget > 0 ? (v.actual / v.budget * 100) : 0;
                const budgetPct = totalBudget > 0 ? (v.budget / totalBudget * 100) : 0;
                const yef = v.budget + v.net;
                return (
                  <tr key={v.vendor} className={`clickable ${selected?.vendor === v.vendor ? 'selected' : ''}`} onClick={() => setSelected(v)}>
                    <td className="vendor-name">{v.vendor}</td>
                    <td className="fs-small text-stone" style={{maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{(v.domains[0] || '—').replace(/, /g, ', ')}</td>
                    <td className="num">{budgetPct.toFixed(1)}%</td>
                    <td className="num">{fmt.k(v.budget)}</td>
                    <td className="num">{fmt.k(v.actual)}</td>
                    <td className="num">{consumed.toFixed(1)}%</td>
                    <td className="num">{fmt.k(v.forecast)}</td>
                    <td className={`num ${v.risk > 0 ? 'neg' : 'zero'}`}>{v.risk > 0 ? fmt.k(v.risk) : '—'}</td>
                    <td className={`num ${v.opp < 0 ? 'pos' : 'zero'}`}>{v.opp < 0 ? fmt.k(Math.abs(v.opp)) : '—'}</td>
                    <td className={`num ${v.net > 100 ? 'neg' : v.net < -100 ? 'pos' : 'zero'}`}>{Math.abs(v.net) < 1 ? '—' : fmt.signed(v.net)}</td>
                    <td className={`num ${yef > v.budget ? 'neg' : ''}`} style={{fontWeight:500}}>{fmt.k(yef)}</td>
                    <td><Sparkline ac={v.monthlyAC} fc={v.monthlyFC} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <VendorDrill vendor={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function RankingCard({ title, subtitle, vendors, metric, onPick }) {
  const max = Math.max(...vendors.map(v => v[metric]));
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">{title}</div>
          <div className="card-sub">{subtitle}</div>
        </div>
      </div>
      {vendors.map((v, i) => (
        <div className="bar-row" key={v.vendor} onClick={() => onPick(v)} style={{cursor:'pointer'}}>
          <div className="label">
            <span style={{color:'var(--antares-stone-gray)', marginRight: 6, fontVariantNumeric:'tabular-nums'}}>{String(i+1).padStart(2,'0')}</span>
            <span style={{fontWeight: 500}}>{v.vendor}</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{width: `${(v[metric]/max)*100}%`}} />
          </div>
          <div className="num">{fmt.k(v[metric])}</div>
        </div>
      ))}
    </div>
  );
}

function VendorDrill({ vendor: v, onClose }) {
  const max = Math.max(...v.monthlyAC, ...v.monthlyFC, 1);
  const consumed = v.budget > 0 ? (v.actual / v.budget * 100) : 0;
  return (
    <div className="drill-overlay" onClick={onClose}>
      <div className="drill-panel" onClick={e => e.stopPropagation()}>
        <div className="drill-head">
          <button className="drill-close" onClick={onClose}>✕ close</button>
          <div className="ec section-h-sm" style={{textTransform:'uppercase',letterSpacing:'0.12em',fontSize:11,color:'var(--antares-stone-gray)',fontWeight:700}}>Vendor Drill-Down</div>
          <h2>{v.vendor}</h2>
          <div className="meta">
            <span>{v.domains.join(' · ') || '—'}</span>
            <span>·</span>
            <span>Owner: {v.domainOwners.join(', ') || '—'}</span>
            <span>·</span>
            <span>{v.lineItems.length} line item{v.lineItems.length===1?'':'s'}</span>
          </div>
        </div>
        <div className="drill-body">
          <div className="drill-kpi-grid">
            <div className="drill-kpi"><div className="l">Budget</div><div className="v">{fmt.m2(v.budget)}</div></div>
            <div className="drill-kpi"><div className="l">YTD Actual</div><div className="v">{fmt.m2(v.actual)}</div></div>
            <div className="drill-kpi"><div className="l">Forecast</div><div className="v">{fmt.m2(v.forecast)}</div></div>
            <div className="drill-kpi"><div className="l">Net Opp/Risk</div><div className={`v ${v.net > 100 ? 'risk' : v.net < -100 ? 'opp' : ''}`}>{Math.abs(v.net) < 1 ? '—' : fmt.signed2(v.net)}</div></div>
          </div>

          <div className="section-h" style={{marginBottom:10}}>Monthly Breakdown</div>
          {(() => {
            // Build a per-month table: Actuals row, Forecast row, Variance row
            const ytdMonths = 3; // jan-mar are actuals
            const totalAC = v.monthlyAC.reduce((a,b)=>a+b,0);
            const totalFC = v.monthlyFC.reduce((a,b)=>a+b,0);
            const variance = v.monthlyAC.map((ac, i) => i < ytdMonths ? (ac - v.monthlyFC[i]) : 0);
            const totalVar = variance.reduce((a,b)=>a+b,0);
            return (
              <div style={{overflowX:'auto'}}>
                <table className="tbl tbl-monthly">
                  <thead>
                    <tr>
                      <th></th>
                      {MONTHS.map(m => <th key={m} className="num" style={{textAlign:'center', fontWeight:600}}>{m.charAt(0).toUpperCase()+m.slice(1)}</th>)}
                      <th className="num" style={{fontWeight:600}}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{fontWeight:600, color:'var(--antares-signature-navy)'}}>Actuals</td>
                      {v.monthlyAC.map((ac, i) => (
                        <td key={i} className="num" style={{color: ac > 0 ? 'var(--antares-signature-navy)' : 'var(--antares-stone-gray)'}}>
                          {ac > 0 ? fmt.k(ac) : '—'}
                        </td>
                      ))}
                      <td className="num" style={{fontWeight:600, color:'var(--antares-signature-navy)'}}>{fmt.k(totalAC)}</td>
                    </tr>
                    <tr>
                      <td style={{fontWeight:600, color:'var(--antares-signature-navy)'}}>Forecast</td>
                      {v.monthlyFC.map((fc, i) => (
                        <td key={i} className="num" style={{color: fc > 0 ? 'var(--antares-bright-blue-600)' : 'var(--antares-stone-gray)'}}>
                          {fc > 0 ? fmt.k(fc) : '—'}
                        </td>
                      ))}
                      <td className="num" style={{fontWeight:600, color:'var(--antares-bright-blue-600)'}}>{fmt.k(totalFC)}</td>
                    </tr>
                    <tr style={{borderTop:'1px solid var(--grid-line)'}}>
                      <td style={{fontWeight:600, color:'var(--antares-signature-navy)'}}>Variance</td>
                      {variance.map((vr, i) => {
                        const fc = v.monthlyFC[i];
                        const ac = v.monthlyAC[i];
                        if (i >= ytdMonths) {
                          return <td key={i} className="num" style={{color:'var(--antares-stone-gray)'}}>—</td>;
                        }
                        if (Math.abs(vr) < 1) return <td key={i} className="num" style={{color:'var(--antares-stone-gray)'}}>—</td>;
                        return (
                          <td key={i} className="num" style={{color: vr > 0 ? 'var(--risk-red)' : 'var(--opp-green)', fontWeight:500}}>
                            {fmt.signed(vr)}
                          </td>
                        );
                      })}
                      <td className="num" style={{fontWeight:600, color: totalVar > 0 ? 'var(--risk-red)' : totalVar < 0 ? 'var(--opp-green)' : 'var(--antares-stone-gray)'}}>
                        {Math.abs(totalVar) < 1 ? '—' : fmt.signed(totalVar)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })()}
          <div className="flex gap-4 fs-tiny text-stone mt-3">
            <span className="flex items-center gap-2"><span style={{width:10,height:10,background:'var(--antares-signature-navy)',display:'inline-block'}}/>Actuals (Jan – Mar)</span>
            <span className="flex items-center gap-2"><span style={{width:10,height:10,background:'var(--antares-bright-blue-600)',display:'inline-block'}}/>Forecast (Apr – Dec)</span>
            <span className="flex items-center gap-2"><span style={{color:'var(--risk-red)',fontWeight:700}}>+</span>Unfavorable variance</span>
            <span className="flex items-center gap-2"><span style={{color:'var(--opp-green)',fontWeight:700}}>−</span>Favorable variance</span>
          </div>

          {v.lineItems.length > 0 && (
            <div className="mt-5">
              <div className="section-h" style={{marginBottom:10}}>Line Items</div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Application / Project</th>
                    <th>Treatment</th>
                    <th className="num">Budget</th>
                    <th className="num">Actual</th>
                    <th className="num">Forecast</th>
                    <th className="num">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {v.lineItems.map((li, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{fontWeight:500, color:'var(--antares-signature-navy)'}}>{li.application || li.subCategory || '—'}</div>
                        <div className="fs-tiny text-stone">{li.project}</div>
                      </td>
                      <td className="fs-small text-stone">{li.treatment || '—'}</td>
                      <td className="num">{fmt.k(li.budget)}</td>
                      <td className="num">{fmt.k(li.actual)}</td>
                      <td className="num">{fmt.k(li.forecast)}</td>
                      <td className={`num ${li.net > 100 ? 'neg' : li.net < -100 ? 'pos' : 'zero'}`}>{Math.abs(li.net) < 1 ? '—' : fmt.signed(li.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {v.lineItems.some(li => li.notes) && (
            <div className="mt-5">
              <div className="section-h" style={{marginBottom:10}}>Notes</div>
              <ul style={{margin:0, paddingLeft:18, listStyle:'disc'}}>
                {v.lineItems.filter(li => li.notes).map((li, i) => (
                  <li key={i} className="fs-small" style={{marginBottom:6, color:'var(--antares-soft-black)'}}>
                    <span className="text-stone" style={{fontWeight:500}}>{li.application || li.project}:</span>
                    {' '}{li.notes}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.VendorsTab = VendorsTab;
window.VendorDrill = VendorDrill;
