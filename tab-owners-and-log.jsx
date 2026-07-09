// Domain Owner tab + Risk & Opportunity Log tab
const { useState: useStateD, useMemo: useMemoD } = React;

function DomainOwnersTab({ data }) {
  const [selected, setSelected] = useStateD(null);
  // Real owners only (drop N/A) for the cards; keep N/A in summary
  const owners = data.domainOwners
    .filter(o => o.owner !== 'N/A')
    .slice()
    .sort((a,b) => b.budget - a.budget);
  const totals = data.domainOwners.reduce((acc, o) => ({
    budget: acc.budget + o.budget, actual: acc.actual + o.actual, forecast: acc.forecast + o.forecast,
    risk: acc.risk + o.risk, opp: acc.opp + o.opp, net: acc.net + o.net,
  }), {budget:0,actual:0,forecast:0,risk:0,opp:0,net:0});

  return (
    <div>
      {/* Portfolio summary strip */}
      <div className="card mb-4">
        <div className="card-header">
          <div>
            <div className="card-title">Domain Owners — Portfolio Health</div>
            <div className="card-sub">{owners.length} owners managing {fmt.m(totals.budget)} of approved budget · click any card to drill in</div>
          </div>
          <div className="flex gap-3 fs-tiny text-stone">
            <span className="flex items-center gap-2"><span style={{width:10,height:10,background:'#333C66',display:'inline-block'}}/>spent</span>
            <span className="flex items-center gap-2"><span style={{width:10,height:10,background:'#6699FF',opacity:0.55,display:'inline-block'}}/>remaining</span>
            <span className="flex items-center gap-2"><span style={{width:10,height:10,background:'#B23A3A',display:'inline-block'}}/>risk</span>
            <span className="flex items-center gap-2"><span style={{width:10,height:10,background:'#2F7A4D',display:'inline-block'}}/>opp</span>
          </div>
          <ExportBtn onClick={() => xlsxExport(owners.map(o => ({
            'Domain Owner': o.owner,
            'Domains': (o.domains||[]).join('; '),
            'Vendors': (o.vendors||[]).join('; '),
            'Budget': o.budget, 'Actuals': o.actual, 'Forecast': o.forecast,
            'Risk': o.risk, 'Opportunity': o.opp, 'Net': o.net,
          })), 'Domain Owners')} />
        </div>
      </div>
      <div className="owner-grid">
        {owners.map(o => {
          const remaining = o.budget - o.actual;
          const consumed = o.budget > 0 ? (o.actual/o.budget * 100) : 0;
          const isOver = consumed > 100;
          const roTotal = o.risk + Math.abs(o.opp);
          const riskShare = roTotal > 0 ? (o.risk/roTotal*100) : 0;
          const oppShare = roTotal > 0 ? (Math.abs(o.opp)/roTotal*100) : 0;
          return (
            <button className="owner-card-v2" key={o.owner} onClick={() => setSelected(o)}>
              <div className="ohead">
                <div>
                  <div className="oname">{o.owner}</div>
                  <div className="orole">{OWNER_ROLES[o.owner] || ''} · {o.vendors.length} vendor{o.vendors.length===1?'':'s'}</div>
                </div>
                <div className={`onet ${o.net > 100 ? 'risk' : o.net < -100 ? 'opp' : ''}`}>
                  <div className="onet-l">Net R/O</div>
                  <div className="onet-v">{Math.abs(o.net) < 1 ? '$0' : fmt.signed(o.net)}</div>
                </div>
              </div>
              <div className="okpis">
                <div className="okpi">
                  <div className="okpi-l">Annual Budget</div>
                  <div className="okpi-v">{fmt.m2(o.budget)}</div>
                </div>
                <div className="okpi">
                  <div className="okpi-l">YTD Actual</div>
                  <div className="okpi-v">{fmt.m2(o.actual)}</div>
                  <div className="okpi-s">{consumed.toFixed(1)}% spent</div>
                </div>
                <div className="okpi">
                  <div className="okpi-l">Remaining Budget</div>
                  <div className={`okpi-v ${isOver ? 'risk' : ''}`}>{fmt.m2(remaining)}</div>
                  <div className="okpi-s">{(100-consumed).toFixed(1)}% available</div>
                </div>
                <div className="okpi">
                  <div className="okpi-l">Risk / Opp</div>
                  <div className="okpi-v" style={{display:'flex', gap:8, alignItems:'baseline', fontSize: 16}}>
                    <span className="text-risk">{fmt.k(o.risk)}</span>
                    <span style={{color:'var(--antares-stone-gray)', fontSize:12}}>/</span>
                    <span className="text-opp">{fmt.k(Math.abs(o.opp))}</span>
                  </div>
                </div>
                <div className="okpi">
                  <div className="okpi-l">Year-End Forecast</div>
                  <div className="okpi-v" style={{color: (o.budget + o.net) > o.budget ? 'var(--risk-red)' : 'var(--antares-signature-navy)'}}>{fmt.m2(o.budget + o.net)}</div>
                  <div className="okpi-s">{fmt.signed(o.net)} vs budget</div>
                </div>
              </div>

              {/* Budget consumed bar */}
              <div className="obar-block">
                <div className="obar-cap">
                  <span>Budget Consumption</span>
                  <span className="tabular">{consumed.toFixed(1)}%</span>
                </div>
                <div className="obar">
                  <div className="obar-spent" style={{width: `${Math.min(consumed,100)}%`}} />
                  {!isOver && <div className="obar-remain" style={{left: `${consumed}%`, width: `${100-consumed}%`}} />}
                </div>
              </div>

              {/* R&O composition */}
              {roTotal > 100 && (
                <div className="obar-block">
                  <div className="obar-cap">
                    <span>R&O Exposure</span>
                    <span className="tabular">{fmt.k(roTotal)}</span>
                  </div>
                  <div className="obar ro">
                    {riskShare > 0 && <div className="obar-risk" style={{width: `${riskShare}%`}} />}
                    {oppShare > 0 && <div className="obar-opp" style={{width: `${oppShare}%`, left: `${riskShare}%`}} />}
                  </div>
                </div>
              )}

              <div className="ofoot">
                <span>{o.domains.length} domain{o.domains.length===1?'':'s'}</span>
                <span className="odrill">View details →</span>
              </div>
            </button>
          );
        })}
      </div>

      {selected && <DomainOwnerDrill owner={selected} data={data} onClose={() => setSelected(null)} />}

      {/* Annual Budget vs Year-End Forecast by Domain Owner */}
      <div className="card mt-4">
        <div className="card-header">
          <div>
            <div className="card-title">Annual Budget vs Year-End Forecast by Domain Owner</div>
            <div className="card-sub">Sorted by Annual Budget · descending</div>
          </div>
          <div className="flex gap-3 fs-tiny text-stone">
            <span className="flex items-center gap-2"><span style={{width:10,height:10,background:'#333C66',display:'inline-block'}}/>annual budget</span>
            <span className="flex items-center gap-2"><span style={{width:10,height:10,background:'#6699FF',display:'inline-block'}}/>year-end forecast</span>
            <span className="flex items-center gap-2"><span style={{width:10,height:10,background:'var(--risk-red)',display:'inline-block'}}/>over budget</span>
          </div>
        </div>
        {(() => {
          const ownersSorted = owners.slice().sort((a,b) => b.budget - a.budget);
          const max = Math.max(...ownersSorted.map(o => Math.max(o.budget, o.budget + o.net)), 1);
          return (
            <div>
              {ownersSorted.map(o => {
                const yef = o.budget + o.net;
                const bw = (o.budget / max) * 100;
                const fw = (yef / max) * 100;
                const over = yef > o.budget;
                return (
                  <div key={o.owner} style={{display:'grid', gridTemplateColumns:'200px 1fr 220px', gap:14, alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--grid-line)', cursor:'pointer'}} onClick={() => setSelected(o)}>
                    <div>
                      <div style={{fontWeight:600, color:'var(--antares-signature-navy)', fontSize:13}}>{o.owner}</div>
                      <div className="fs-tiny text-stone">{OWNER_ROLES[o.owner] || ''}</div>
                    </div>
                    <div style={{display:'grid', gridTemplateRows:'1fr 1fr', gap:4}}>
                      <div style={{position:'relative', height:16, background:'#FAFAF8'}}>
                        <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${bw}%`, background:'#333C66'}} />
                        <div style={{position:'absolute', right:6, top:0, bottom:0, display:'flex', alignItems:'center', fontSize:11, color:'var(--antares-stone-gray)'}}>budget</div>
                      </div>
                      <div style={{position:'relative', height:16, background:'#FAFAF8'}}>
                        <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${fw}%`, background: over ? 'var(--risk-red)' : '#6699FF'}} />
                        <div style={{position:'absolute', right:6, top:0, bottom:0, display:'flex', alignItems:'center', fontSize:11, color:'var(--antares-stone-gray)'}}>forecast</div>
                      </div>
                    </div>
                    <div className="text-right tabular fs-small" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6}}>
                      <span style={{color:'var(--antares-signature-navy)', fontWeight:600}}>{fmt.k(o.budget)}</span>
                      <span style={{color: over ? 'var(--risk-red)' : 'var(--antares-bright-blue-600)', fontWeight:600}}>{fmt.k(yef)}</span>
                      <span style={{color: over ? 'var(--risk-red)' : 'var(--opp-green)', fontWeight:600}}>{fmt.signed(yef - o.budget)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function DomainOwnerDrill({ owner: o, data, onClose }) {
  // Filter vendors that belong to this owner
  const ownerVendors = data.vendors
    .filter(v => v.domainOwners.includes(o.owner))
    .sort((a,b) => b.actual - a.actual);

  // Aggregate monthly across all vendors for this owner
  const monthlyAC = new Array(12).fill(0);
  const monthlyFC = new Array(12).fill(0);
  ownerVendors.forEach(v => {
    v.monthlyAC.forEach((x, i) => monthlyAC[i] += x);
    v.monthlyFC.forEach((x, i) => monthlyFC[i] += x);
  });

  // Collect all line items for this owner (across vendors)
  const allLineItems = [];
  ownerVendors.forEach(v => {
    v.lineItems.forEach(li => allLineItems.push({ ...li, vendor: v.vendor }));
  });

  // Top R&O items
  const topRO = allLineItems
    .filter(li => Math.abs(li.net) > 100)
    .sort((a,b) => Math.abs(b.net) - Math.abs(a.net))
    .slice(0, 8);

  const remaining = o.budget - o.actual;
  const consumed = o.budget > 0 ? (o.actual/o.budget * 100) : 0;

  return (
    <div className="drill-overlay" onClick={onClose}>
      <div className="drill-panel drill-panel-wide" onClick={e => e.stopPropagation()}>
        <div className="drill-head">
          <button className="drill-close" onClick={onClose}>✕ close</button>
          <div className="ec section-h-sm" style={{textTransform:'uppercase',letterSpacing:'0.12em',fontSize:11,color:'rgba(255,255,255,0.6)',fontWeight:700}}>Domain Owner Drill-Down</div>
          <h2>{o.owner}</h2>
          <div className="meta">
            <span>{OWNER_ROLES[o.owner] || ''}</span>
            <span>·</span>
            <span>{ownerVendors.length} vendors</span>
            <span>·</span>
            <span>{o.domains.length} domain{o.domains.length===1?'':'s'}</span>
            <span>·</span>
            <span>{allLineItems.length} line items</span>
          </div>
        </div>
        <div className="drill-body">
          <div className="drill-kpi-grid">
            <div className="drill-kpi"><div className="l">Annual Budget</div><div className="v">{fmt.m2(o.budget)}</div></div>
            <div className="drill-kpi"><div className="l">YTD Actual Spent</div><div className="v">{fmt.m2(o.actual)}</div><div className="fs-tiny text-stone">{consumed.toFixed(1)}% of budget</div></div>
            <div className="drill-kpi"><div className="l">Remaining Budget</div><div className="v">{fmt.m2(remaining)}</div></div>
            <div className="drill-kpi"><div className="l">Net Opp/Risk</div><div className={`v ${o.net > 100 ? 'risk' : o.net < -100 ? 'opp' : ''}`}>{Math.abs(o.net) < 1 ? '—' : fmt.signed2(o.net)}</div></div>
          </div>

          {/* Domains */}
          {o.domains.length > 0 && (
            <div style={{marginBottom: 22}}>
              <div className="section-h" style={{marginBottom:10}}>Domains Managed</div>
              <div style={{display:'flex', flexWrap:'wrap', gap: 8}}>
                {o.domains.map(d => <span key={d} className="chip-static">{d}</span>)}
              </div>
            </div>
          )}

          {/* Vendor breakdown */}
          <div className="section-h" style={{marginBottom:10}}>Vendors ({ownerVendors.length})</div>
          <div style={{overflowX:'auto', marginBottom: 22}}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th className="num">Budget</th>
                  <th className="num">YTD Actual</th>
                  <th className="num">Forecast</th>
                  <th className="num">% Spent</th>
                  <th className="num">Net R/O</th>
                </tr>
              </thead>
              <tbody>
                {ownerVendors.map((v, i) => {
                  const c = v.budget > 0 ? (v.actual/v.budget*100) : 0;
                  return (
                    <tr key={i}>
                      <td className="vendor-name">{v.vendor}</td>
                      <td className="num">{fmt.k(v.budget)}</td>
                      <td className="num">{fmt.k(v.actual)}</td>
                      <td className="num">{fmt.k(v.forecast)}</td>
                      <td className="num">{c.toFixed(1)}%</td>
                      <td className={`num ${v.net > 100 ? 'neg' : v.net < -100 ? 'pos' : 'zero'}`}>{Math.abs(v.net) < 1 ? '—' : fmt.signed(v.net)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Monthly breakdown */}
          <div className="section-h" style={{marginBottom:10}}>Monthly Breakdown</div>
          {(() => {
            const ytdMonths = 3;
            const totalAC = monthlyAC.reduce((a,b)=>a+b,0);
            const totalFC = monthlyFC.reduce((a,b)=>a+b,0);
            return (
              <div style={{overflowX:'auto', marginBottom: 22}}>
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
                      {monthlyAC.map((ac, i) => (
                        <td key={i} className="num" style={{color: ac > 0 ? 'var(--antares-signature-navy)' : 'var(--antares-stone-gray)'}}>{ac > 0 ? fmt.k(ac) : '—'}</td>
                      ))}
                      <td className="num" style={{fontWeight:600, color:'var(--antares-signature-navy)'}}>{fmt.k(totalAC)}</td>
                    </tr>
                    <tr>
                      <td style={{fontWeight:600, color:'var(--antares-signature-navy)'}}>Forecast</td>
                      {monthlyFC.map((fc, i) => (
                        <td key={i} className="num" style={{color: fc > 0 ? 'var(--antares-bright-blue-600)' : 'var(--antares-stone-gray)'}}>{fc > 0 ? fmt.k(fc) : '—'}</td>
                      ))}
                      <td className="num" style={{fontWeight:600, color:'var(--antares-bright-blue-600)'}}>{fmt.k(totalFC)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Top R&O drivers for this owner */}
          {topRO.length > 0 && (
            <>
              <div className="section-h" style={{marginBottom:10}}>Top Risk & Opportunity Drivers</div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{width:70}}>Type</th>
                    <th>Vendor</th>
                    <th>Application / Item</th>
                    <th className="num">Net</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {topRO.map((it, i) => (
                    <tr key={i}>
                      <td>{it.net > 100 ? <span className="badge risk">RISK</span> : <span className="badge opp">OPP</span>}</td>
                      <td className="vendor-name">{it.vendor}</td>
                      <td>
                        <div style={{fontWeight:500}}>{it.application || it.subCategory || it.project}</div>
                        <div className="fs-tiny text-stone">{it.treatment}</div>
                      </td>
                      <td className={`num ${it.net > 100 ? 'neg' : 'pos'}`}>{fmt.signed(it.net)}</td>
                      <td className="fs-small text-stone" style={{maxWidth:280}}>{(it.notes||'').toString().trim() || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RiskOppLogTab({ data }) {
  const [tab, setTab] = useStateD('all');
  const [search, setSearch] = useStateD('');
  const [drill, setDrill] = useStateD(null);   // 'risks' | 'opps' | 'net' for KPI drill
  const [rowDrill, setRowDrill] = useStateD(null); // single-row drill

  const items = useMemoD(() => {
    let v = data.riskOppLog.slice();
    if (tab === 'risks') v = v.filter(x => x.net > 100);
    if (tab === 'opps') v = v.filter(x => x.net < -100);
    if (search.trim()) {
      const q = search.toLowerCase();
      v = v.filter(x => (x.vendor||'').toLowerCase().includes(q) || (x.notes||'').toLowerCase().includes(q) || (x.application||'').toLowerCase().includes(q));
    }
    return v;
  }, [tab, search, data.riskOppLog]);

  const totalRisk = data.riskOppLog.filter(x => x.net > 100).reduce((s,x)=>s+x.net, 0);
  const totalOpp = data.riskOppLog.filter(x => x.net < -100).reduce((s,x)=>s+x.net, 0);
  const riskCount = data.riskOppLog.filter(x => x.net > 100).length;
  const oppCount = data.riskOppLog.filter(x => x.net < -100).length;

  return (
    <div>
      <div className="kpi-grid mb-4" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        <button className="kpi risk-tile kpi-clickable" onClick={() => setDrill('risks')}>
          <div className="kpi-label">total risk exposure</div>
          <div className="kpi-value risk">{fmt.m(totalRisk)}</div>
          <div className="kpi-sub">{riskCount} risk items logged · click to drill in →</div>
        </button>
        <button className="kpi opp-tile kpi-clickable" onClick={() => setDrill('opps')}>
          <div className="kpi-label">total opp upside</div>
          <div className="kpi-value opp">{fmt.m(Math.abs(totalOpp))}</div>
          <div className="kpi-sub">{oppCount} opportunity items logged · click to drill in →</div>
        </button>
        <button className="kpi net-tile kpi-clickable" onClick={() => setDrill('net')}>
          <div className="kpi-label">net position</div>
          <div className="kpi-value" style={{color: (totalRisk+totalOpp) > 0 ? 'var(--risk-red)' : (totalRisk+totalOpp) < 0 ? 'var(--opp-green)' : 'inherit'}}>{fmt.signed(totalRisk + totalOpp)}</div>
          <div className="kpi-sub">{(totalRisk + totalOpp) > 0 ? 'unfavorable' : 'favorable'} to budget · click to drill in →</div>
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Risk & Opportunity Log</div>
            <div className="card-sub">{items.length} items · click any row to view full detail</div>
          </div>
          <div className="flex gap-3 items-center">
            <div className="chips">
              <button className={`chip ${tab==='all'?'active':''}`} onClick={()=>setTab('all')}>All ({data.riskOppLog.length})</button>
              <button className={`chip ${tab==='risks'?'active':''}`} onClick={()=>setTab('risks')}>Risks</button>
              <button className={`chip ${tab==='opps'?'active':''}`} onClick={()=>setTab('opps')}>Opportunities</button>
            </div>
            <div className="search-box">
              <Icon name="search" size={14} color="#807E7A" />
              <input type="text" placeholder="Search items, notes…" value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
          </div>
          <ExportBtn onClick={() => xlsxExport(items.map(x => ({
            'Vendor': x.vendor, 'Domain': x.domain, 'Owner': x.owner,
            'Project': x.project, 'Application': x.application,
            'Category': x.category, 'Sub-Category': x.subCategory,
            'Budget': x.budget, 'Forecast': x.forecast,
            'Risk': x.risk, 'Opportunity': x.opp, 'Net': x.net,
            'Notes': x.notesRO || x.notes || '',
          })), `Risk & Opp Log`)} />
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="tbl tbl-clickable">
            <thead>
              <tr>
                <th style={{width:60}}>Type</th>
                <th>Vendor</th>
                <th>Application / Item</th>
                <th>Owner</th>
                <th className="num">Budget</th>
                <th className="num">Forecast</th>
                <th className="num">Net</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} onClick={() => setRowDrill(it)}>
                  <td>
                    {it.net > 100
                      ? <span className="badge risk">RISK</span>
                      : it.net < -100
                        ? <span className="badge opp">OPP</span>
                        : <span className="badge neutral">FLAT</span>}
                  </td>
                  <td className="vendor-name">{it.vendor || '—'}</td>
                  <td>
                    <div style={{fontWeight:500}}>{it.application || it.subCategory || it.project}</div>
                    <div className="fs-tiny text-stone">{it.treatment}</div>
                  </td>
                  <td className="fs-small text-stone">{it.owner === 'N/A' ? '—' : it.owner}</td>
                  <td className="num">{fmt.k(it.budget)}</td>
                  <td className="num">{fmt.k(it.forecast)}</td>
                  <td className={`num ${it.net > 100 ? 'neg' : it.net < -100 ? 'pos' : 'zero'}`}>{Math.abs(it.net) < 1 ? '—' : fmt.signed(it.net)}</td>
                  <td className="fs-small text-stone" style={{maxWidth:280}}>{it.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {drill && <RiskOppKpiDrill kind={drill} data={data} onClose={() => setDrill(null)} onPickRow={(it)=>{ setDrill(null); setRowDrill(it); }} />}
      {rowDrill && <RiskOppItemDrill item={rowDrill} onClose={() => setRowDrill(null)} />}
    </div>
  );
}

// KPI tile drill (filtered list of risks / opps / all)
function RiskOppKpiDrill({ kind, data, onClose, onPickRow }) {
  const all = data.riskOppLog;
  let items, title, subtitle, color, total;
  if (kind === 'risks') {
    items = all.filter(x => x.net > 100).sort((a,b) => b.net - a.net);
    title = 'Risk Exposure — Detailed View';
    subtitle = `${items.length} risk items · downside to budget`;
    color = 'var(--risk-red)';
    total = items.reduce((s,x)=>s+x.net,0);
  } else if (kind === 'opps') {
    items = all.filter(x => x.net < -100).sort((a,b) => a.net - b.net);
    title = 'Opportunity Upside — Detailed View';
    subtitle = `${items.length} opportunity items · favorable to budget`;
    color = 'var(--opp-green)';
    total = items.reduce((s,x)=>s+x.net,0);
  } else {
    items = all.slice().sort((a,b) => Math.abs(b.net) - Math.abs(a.net));
    title = 'Net Position — All Items';
    subtitle = `${items.length} items contributing to the full-year net forecast position`;
    color = 'var(--antares-signature-navy)';
    total = items.reduce((s,x)=>s+x.net,0);
  }

  // Group by owner
  const byOwner = {};
  items.forEach(it => {
    const o = it.owner === 'N/A' ? 'Unallocated' : (it.owner || 'Unallocated');
    if (!byOwner[o]) byOwner[o] = { owner: o, count: 0, total: 0 };
    byOwner[o].count += 1;
    byOwner[o].total += it.net;
  });
  const ownerRows = Object.values(byOwner).sort((a,b) => Math.abs(b.total) - Math.abs(a.total));

  return (
    <div className="drill-overlay" onClick={onClose}>
      <div className="drill-panel drill-panel-wide" onClick={e => e.stopPropagation()}>
        <div className="drill-head">
          <button className="drill-close" onClick={onClose}>✕ close</button>
          <div className="ec section-h-sm" style={{textTransform:'uppercase',letterSpacing:'0.12em',fontSize:11,color:'rgba(255,255,255,0.6)',fontWeight:700}}>
            {kind === 'risks' ? 'Risk Drill-Down' : kind === 'opps' ? 'Opportunity Drill-Down' : 'Net Position Drill-Down'}
          </div>
          <h2>{title}</h2>
          <div className="meta"><span>{subtitle}</span><span>·</span><span style={{fontVariantNumeric:'tabular-nums'}}>Total: {fmt.signed2(total)}</span></div>
        </div>
        <div className="drill-body">
          {/* By Owner summary */}
          <div className="section-h" style={{marginBottom:10}}>By Domain Owner</div>
          <div style={{overflowX:'auto', marginBottom: 22}}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Owner</th>
                  <th className="num">Items</th>
                  <th className="num">Net Impact</th>
                  <th>Distribution</th>
                </tr>
              </thead>
              <tbody>
                {ownerRows.map((r, i) => {
                  const max = Math.max(...ownerRows.map(x => Math.abs(x.total)), 1);
                  const w = Math.abs(r.total)/max*100;
                  return (
                    <tr key={i}>
                      <td className="vendor-name">{r.owner}</td>
                      <td className="num">{r.count}</td>
                      <td className={`num ${r.total > 0 ? 'neg' : 'pos'}`} style={{fontVariantNumeric:'tabular-nums'}}>{fmt.signed(r.total)}</td>
                      <td>
                        <div style={{height:8, background:'#F5F4F1', position:'relative', width:'100%', maxWidth:240}}>
                          <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${w}%`, background: r.total > 0 ? 'var(--risk-red)' : 'var(--opp-green)'}} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Item list */}
          <div className="section-h" style={{marginBottom:10}}>All Items ({items.length})</div>
          <table className="tbl tbl-clickable">
            <thead>
              <tr>
                <th style={{width:50}}></th>
                <th>Vendor</th>
                <th>Application / Item</th>
                <th>Owner</th>
                <th className="num">Net</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} onClick={() => onPickRow(it)}>
                  <td>
                    {it.net > 0
                      ? <span className="badge risk">RISK</span>
                      : <span className="badge opp">OPP</span>}
                  </td>
                  <td className="vendor-name">{it.vendor || '—'}</td>
                  <td>
                    <div style={{fontWeight:500}}>{it.application || it.subCategory || it.project}</div>
                    <div className="fs-tiny text-stone">{it.treatment}</div>
                  </td>
                  <td className="fs-small text-stone">{it.owner === 'N/A' ? '—' : it.owner}</td>
                  <td className={`num ${it.net > 0 ? 'neg' : 'pos'}`}>{fmt.signed(it.net)}</td>
                  <td className="fs-small text-stone" style={{maxWidth:300}}>{it.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Single-item drill — full detail
function RiskOppItemDrill({ item: it, onClose }) {
  const isRisk = it.net > 100;
  const isOpp = it.net < -100;
  return (
    <div className="drill-overlay" onClick={onClose}>
      <div className="drill-panel" onClick={e => e.stopPropagation()}>
        <div className="drill-head" style={{background: isRisk ? '#7A1E1E' : isOpp ? '#1E5A37' : 'var(--antares-signature-navy)'}}>
          <button className="drill-close" onClick={onClose}>✕ close</button>
          <div className="ec section-h-sm" style={{textTransform:'uppercase',letterSpacing:'0.12em',fontSize:11,color:'rgba(255,255,255,0.7)',fontWeight:700}}>
            {isRisk ? 'Risk Item' : isOpp ? 'Opportunity Item' : 'R&O Item'}
          </div>
          <h2>{it.application || it.subCategory || it.project || '—'}</h2>
          <div className="meta">
            <span>{it.vendor || '—'}</span>
            <span>·</span>
            <span>{it.owner === 'N/A' ? 'Unallocated' : (it.owner || 'Unallocated')}</span>
            <span>·</span>
            <span>{it.domain || '—'}</span>
          </div>
        </div>
        <div className="drill-body">
          <div className="drill-kpi-grid">
            <div className="drill-kpi"><div className="l">Budget</div><div className="v">{fmt.m2(it.budget)}</div></div>
            <div className="drill-kpi"><div className="l">YTD Actual</div><div className="v">{fmt.m2(it.actual)}</div></div>
            <div className="drill-kpi"><div className="l">Forecast</div><div className="v">{fmt.m2(it.forecast)}</div></div>
            <div className="drill-kpi">
              <div className="l">Net Opp/Risk</div>
              <div className={`v ${isRisk ? 'risk' : isOpp ? 'opp' : ''}`}>{Math.abs(it.net) < 1 ? '—' : fmt.signed2(it.net)}</div>
            </div>
          </div>

          <div className="section-h" style={{marginBottom:10}}>Classification</div>
          <table className="tbl" style={{marginBottom:22}}>
            <tbody>
              <tr><td style={{width:'30%', fontWeight:600, color:'var(--antares-signature-navy)'}}>Vendor</td><td>{it.vendor || '—'}</td></tr>
              <tr><td style={{fontWeight:600, color:'var(--antares-signature-navy)'}}>Project</td><td>{it.project || '—'}</td></tr>
              <tr><td style={{fontWeight:600, color:'var(--antares-signature-navy)'}}>Application</td><td>{it.application || '—'}</td></tr>
              <tr><td style={{fontWeight:600, color:'var(--antares-signature-navy)'}}>Domain</td><td>{it.domain || '—'}</td></tr>
              <tr><td style={{fontWeight:600, color:'var(--antares-signature-navy)'}}>Domain Owner</td><td>{it.owner === 'N/A' ? 'Unallocated' : (it.owner || '—')}</td></tr>
              <tr><td style={{fontWeight:600, color:'var(--antares-signature-navy)'}}>Category</td><td>{it.category || '—'}</td></tr>
              <tr><td style={{fontWeight:600, color:'var(--antares-signature-navy)'}}>Sub-Category</td><td>{it.subCategory || '—'}</td></tr>
              <tr><td style={{fontWeight:600, color:'var(--antares-signature-navy)'}}>Accounting Treatment</td><td>{it.treatment || '—'}</td></tr>
            </tbody>
          </table>

          <div className="section-h" style={{marginBottom:10}}>Variance Analysis</div>
          <table className="tbl" style={{marginBottom: 22}}>
            <tbody>
              <tr>
                <td style={{width:'30%', fontWeight:600, color:'var(--antares-signature-navy)'}}>Risk Component</td>
                <td className="num neg" style={{textAlign:'left'}}>{Math.abs(it.risk||0) < 1 ? '$0' : fmt.k(it.risk)}</td>
              </tr>
              <tr>
                <td style={{fontWeight:600, color:'var(--antares-signature-navy)'}}>Opportunity Component</td>
                <td className="num pos" style={{textAlign:'left'}}>{Math.abs(it.opp||0) < 1 ? '$0' : fmt.k(Math.abs(it.opp))}</td>
              </tr>
              <tr style={{borderTop:'2px solid var(--antares-signature-navy)'}}>
                <td style={{fontWeight:700, color:'var(--antares-signature-navy)'}}>Net Position</td>
                <td className={`num ${isRisk ? 'neg' : isOpp ? 'pos' : 'zero'}`} style={{textAlign:'left', fontWeight:700}}>{Math.abs(it.net) < 1 ? '—' : fmt.signed(it.net)}</td>
              </tr>
              <tr>
                <td style={{fontWeight:600, color:'var(--antares-signature-navy)'}}>Forecast vs Budget</td>
                <td style={{textAlign:'left'}}>{fmt.signed(it.forecast - it.budget)} ({((it.forecast-it.budget)/it.budget*100).toFixed(2)}%)</td>
              </tr>
            </tbody>
          </table>

          {it.notes && (
            <>
              <div className="section-h" style={{marginBottom:10}}>Notes</div>
              <div className="fs-small" style={{padding:'12px 14px', background:'#FAFAF8', borderLeft:'3px solid ' + (isRisk ? 'var(--risk-red)' : isOpp ? 'var(--opp-green)' : 'var(--antares-bright-blue)'), color:'var(--antares-soft-black)', lineHeight: 1.5}}>
                {it.notes}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

window.DomainOwnersTab = DomainOwnersTab;
window.RiskOppLogTab = RiskOppLogTab;
