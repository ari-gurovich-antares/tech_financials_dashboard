// Tab: User Guide — operating procedure for the 2026 Tech Financials Dashboard
const { useState: useStateUG, useEffect: useEffectUG } = React;

// ── Checklist ────────────────────────────────────────────────────────────────
const UG_CHECKLIST = [
  { key: 'budget',     text: 'Budget matches workbook' },
  { key: 'forecast',   text: 'Forecast matches workbook' },
  { key: 'risk',       text: 'Risk matches workbook' },
  { key: 'opp',        text: 'Opportunity matches workbook' },
  { key: 'net',        text: 'Net Position matches workbook' },
  { key: 'risk_drill', text: 'Risk drilldowns reconcile to Risk KPI' },
  { key: 'opp_drill',  text: 'Opportunity drilldowns reconcile to Opportunity KPI' },
  { key: 'net_drill',  text: 'Net Position drilldowns reconcile to Net Position KPI' },
  { key: 'filters',    text: 'Filters work correctly' },
];

// ── Component ────────────────────────────────────────────────────────────────
function UserGuideTab() {
  const [checks, setChecks] = useStateUG(() => {
    try { return JSON.parse(localStorage.getItem('ug-checks-v2') || '{}'); }
    catch { return {}; }
  });

  useEffectUG(() => {
    try { localStorage.setItem('ug-checks-v2', JSON.stringify(checks)); }
    catch {}
  }, [checks]);

  function toggleCheck(key) {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const doneCount = UG_CHECKLIST.filter(c => checks[c.key]).length;
  const allDone   = doneCount === UG_CHECKLIST.length;
  const pct       = Math.round((doneCount / UG_CHECKLIST.length) * 100);

  return (
    <div className="ug-page">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <div className="ug-hero">
        <div className="ug-hero-inner">
          <div className="ug-hero-eyebrow">operating procedure · technology financials</div>
          <h1 className="ug-hero-title">Dashboard User Guide</h1>
          <p className="ug-hero-sub">
            Reference guide for the 2026 Technology Financials Dashboard.
          </p>
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────── */}
      <div className="ug-body">

        {/* ── 01 PURPOSE ─────────────────────────────────────────────── */}
        <div className="ug-card">
          <div className="ug-sec-label">
            <span className="ug-sec-num">01</span>
            <span className="ug-sec-divider">—</span>
            <span className="ug-sec-name">Purpose</span>
          </div>
          <h2 className="ug-sec-title">Dashboard Purpose</h2>
          <p className="ug-prose">
            This dashboard provides an executive view of Technology Financials, including:
          </p>
          <div className="ug-pills">
            {[
              'KPI Cards', 'Drivers of Forecast Variance',
              'Risk Analysis', 'Opportunity Analysis', 'Net Position Analysis',
              'Drilldowns', 'Filters',
            ].map(p => <span key={p} className="ug-pill">{p}</span>)}
          </div>
        </div>

        {/* ── 02 REFRESHING THE DASHBOARD ────────────────────────────── */}
        <div className="ug-card">
          <div className="ug-sec-label">
            <span className="ug-sec-num">02</span>
            <span className="ug-sec-divider">—</span>
            <span className="ug-sec-name">Refreshing the Dashboard</span>
          </div>
          <h2 className="ug-sec-title">Refreshing the Dashboard</h2>
          <p className="ug-prose">
            Use these steps when the dashboard needs to be updated with a new
            Technology Financials workbook.
          </p>

          <div className="ug-steps" style={{ marginTop: '24px' }}>

            <div className="ug-step">
              <div className="ug-step-rail">
                <div className="ug-step-badge">1</div>
                <div className="ug-step-line"></div>
              </div>
              <div className="ug-step-content">
                <div className="ug-step-title">Download the Latest Workbook from SharePoint</div>
                <p className="ug-prose">
                  Open the latest approved Technology Financials workbook in{' '}
                  <a
                    href="https://antarescap.sharepoint.com/sites/AntaresITDemo/IT%20Internal/TechPMO/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2FAntaresITDemo%2FIT%20Internal%2FTechPMO%2FShared%20Documents%2F02%20%E2%80%93%20Financials%2C%20Vendors%20%26%20Administration%2F07%20%2D%20Tech%20Financials&viewid=72234ea3%2D982f%2D49c6%2Da4ff%2D663c8a912115&newTargetListUrl=%2Fsites%2FAntaresITDemo%2FIT%20Internal%2FTechPMO%2FShared%20Documents&viewpath=%2Fsites%2FAntaresITDemo%2FIT%20Internal%2FTechPMO%2FShared%20Documents%2FForms%2FAllItems%2Easpx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ug-link"
                  >SharePoint → Tech Financials</a>.
                  Before downloading, confirm the workbook is in the approved reporting state:
                </p>
                <ul className="ug-verify-list">
                  <li>No additional ad hoc filters are applied beyond the approved reporting view</li>
                  <li>No rows are hidden outside of the approved reporting scope</li>
                  <li>Master Data (DO NOT EDIT) has not been modified</li>
                  <li>Workbook totals appear as expected</li>
                </ul>
                <div className="ug-callout ug-callout--ok">
                  <Icon name="check" size={13} color="#2F7A4D" />
                  <span>The dashboard automatically excludes rows where Transaction Type = Capitalization during upload. Upload the latest approved workbook without manually changing workbook filters.</span>
                </div>
              </div>
            </div>

            <div className="ug-step">
              <div className="ug-step-rail">
                <div className="ug-step-badge">2</div>
                <div className="ug-step-line"></div>
              </div>
              <div className="ug-step-content">
                <div className="ug-step-title">Click "Upload Workbook" in the dashboard</div>
                <p className="ug-prose">
                  Click the <strong>Upload Workbook</strong> button in the top bar of the dashboard.
                  Select the downloaded workbook file (.xlsx). The dashboard will parse the workbook,
                  locate the SUBTOTAL reporting scope row, exclude Capitalization rows automatically,
                  and run reconciliation checks.
                </p>
              </div>
            </div>

            <div className="ug-step">
              <div className="ug-step-rail">
                <div className="ug-step-badge">3</div>
                <div className="ug-step-line"></div>
              </div>
              <div className="ug-step-content">
                <div className="ug-step-title">Review the reconciliation summary</div>
                <p className="ug-prose">
                  The upload modal shows a reconciliation summary before applying any changes:
                </p>
                <ul className="ug-verify-list">
                  <li><strong>KPI Reconciliation</strong> — workbook SUBTOTAL values vs line-item sums for all 7 KPIs</li>
                  <li><strong>Variance Reconciliation</strong> — executive forecast variance vs sum of category variances</li>
                  <li><strong>Drilldown Reconciliation</strong> — Risk, Opportunity, and Net Position KPIs vs drilldown totals</li>
                </ul>
                <div className="ug-callout ug-callout--warn">
                  <Icon name="alert" size={13} color="#7A5200" />
                  <span>All differences must equal $0.00. If any check fails the upload is rejected and the previous dataset remains active.</span>
                </div>
              </div>
            </div>

            <div className="ug-step ug-step--last">
              <div className="ug-step-rail">
                <div className="ug-step-badge">4</div>
              </div>
              <div className="ug-step-content">
                <div className="ug-step-title">Click "Apply to Dashboard" and verify</div>
                <p className="ug-prose">
                  If all reconciliation checks pass, click <strong>Apply to Dashboard</strong>.
                  All KPI cards, Drivers of Forecast Variance, Risk / Opportunity / Net Position
                  drilldowns, and filters update immediately from the new workbook data.
                  Use the Quick Validation Checklist in Section 03 to confirm.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ── 03 QUICK VALIDATION CHECKLIST ───────────────────────────── */}
        <div className="ug-card">
          <div className="ug-sec-label">
            <span className="ug-sec-num">03</span>
            <span className="ug-sec-divider">—</span>
            <span className="ug-sec-name">Validation</span>
          </div>
          <h2 className="ug-sec-title">Quick Validation Checklist</h2>
          <p className="ug-prose" style={{ marginBottom: '24px' }}>
            After applying a new workbook, verify each item below. Progress is saved automatically.
          </p>

          <div className="ug-checklist">
            <div className="ug-cl-head">
              <span>After Upload</span>
              <span className="ug-cl-progress-text">
                <span className="ug-cl-done-count">{doneCount}</span>
                {' / '}{UG_CHECKLIST.length} complete
              </span>
            </div>
            <div className="ug-cl-progress-bar">
              <div
                className="ug-cl-progress-fill"
                style={{ width: `${pct}%`, background: allDone ? 'var(--opp-green)' : 'var(--antares-bright-blue)' }}
              ></div>
            </div>
            <div className="ug-cl-list">
              {UG_CHECKLIST.map((item) => (
                <label key={item.key} className={`ug-cl-item${checks[item.key] ? ' ug-cl-item--on' : ''}`}>
                  <input
                    type="checkbox"
                    style={{ display: 'none' }}
                    checked={!!checks[item.key]}
                    onChange={() => toggleCheck(item.key)}
                  />
                  <div className={`ug-cl-box${checks[item.key] ? ' ug-cl-box--on' : ''}`}>
                    {checks[item.key] && <Icon name="check" size={9} color="#fff" />}
                  </div>
                  <span className="ug-cl-text">{item.text}</span>
                </label>
              ))}
            </div>
            {allDone && (
              <div className="ug-callout ug-callout--ok ug-callout--inline">
                <Icon name="check" size={13} color="#2F7A4D" />
                <span>All checks passed. Dashboard is ready for distribution.</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { UserGuideTab });
