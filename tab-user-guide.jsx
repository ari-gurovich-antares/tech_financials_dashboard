// Tab: User Guide — minimal executive reference
const SHAREPOINT_URL =
  "https://antarescap.sharepoint.com/sites/AntaresITDemo/IT%20Internal/TechPMO/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2FAntaresITDemo%2FIT%20Internal%2FTechPMO%2FShared%20Documents%2F02%20%E2%80%93%20Financials%2C%20Vendors%20%26%20Administration%2F07%20%2D%20Tech%20Financials&viewid=72234ea3%2D982f%2D49c6%2Da4ff%2D663c8a912115&newTargetListUrl=%2Fsites%2FAntaresITDemo%2FIT%20Internal%2FTechPMO%2FShared%20Documents&viewpath=%2Fsites%2FAntaresITDemo%2FIT%20Internal%2FTechPMO%2FShared%20Documents%2FForms%2FAllItems%2Easpx";

function UserGuideTab() {
  return (
    <div className="ug-page" style={{ background: 'var(--bg-page, #F4F5F7)' }}>
      <div style={{
        maxWidth: 680,
        margin: '48px auto',
        padding: '0 24px 64px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted, #8A8F9E)',
            marginBottom: 8,
          }}>User Guide</div>
          <h1 style={{
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--text-primary, #111827)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>Technology Financials Dashboard</h1>
        </div>

        {/* Section 1 — Data Refresh */}
        <div style={{
          background: '#fff',
          borderRadius: 10,
          padding: '28px 32px',
          border: '1px solid var(--border-color, #E5E7EB)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--antares-bright-blue, #0057B8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 2,
            }}>
              <Icon name="refresh" size={16} color="#fff" />
            </div>
            <div>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary, #111827)',
                marginBottom: 6,
                letterSpacing: '-0.01em',
              }}>Data Refresh</div>
              <p style={{
                fontSize: 13.5,
                color: 'var(--text-secondary, #4B5563)',
                margin: 0,
                lineHeight: 1.65,
              }}>
                The dashboard refreshes automatically each day at <strong style={{ color: 'var(--text-primary, #111827)' }}>7:00 PM</strong> after
                the SharePoint backup and publishing process runs. Users normally do not need to manually
                upload anything.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2 — Manual Upload */}
        <div style={{
          background: '#fff',
          borderRadius: 10,
          padding: '28px 32px',
          border: '1px solid var(--border-color, #E5E7EB)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--antares-bright-blue, #0057B8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 2,
            }}>
              <Icon name="upload" size={16} color="#fff" />
            </div>
            <div>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary, #111827)',
                marginBottom: 6,
                letterSpacing: '-0.01em',
              }}>Manual Workbook Upload</div>
              <p style={{
                fontSize: 13.5,
                color: 'var(--text-secondary, #4B5563)',
                margin: 0,
                lineHeight: 1.65,
              }}>
                To manually update the dashboard, click <strong style={{ color: 'var(--text-primary, #111827)' }}>Upload Workbook</strong> in
                the top bar and select the latest approved Technology Financials Excel workbook.
                This is optional and mainly useful for ad hoc refreshes or testing.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3 — Source Workbook */}
        <div style={{
          background: '#fff',
          borderRadius: 10,
          padding: '28px 32px',
          border: '1px solid var(--border-color, #E5E7EB)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--antares-bright-blue, #0057B8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 2,
            }}>
              <Icon name="file" size={16} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary, #111827)',
                marginBottom: 6,
                letterSpacing: '-0.01em',
              }}>Source Workbook</div>
              <p style={{
                fontSize: 13.5,
                color: 'var(--text-secondary, #4B5563)',
                margin: '0 0 16px',
                lineHeight: 1.65,
              }}>
                The latest approved workbook is stored in SharePoint.
              </p>
              <a
                href={SHAREPOINT_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 16px',
                  background: 'var(--antares-bright-blue, #0057B8)',
                  color: '#fff',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  textDecoration: 'none',
                  letterSpacing: '0.01em',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <Icon name="external" size={13} color="#fff" />
                Open in SharePoint
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { UserGuideTab });
