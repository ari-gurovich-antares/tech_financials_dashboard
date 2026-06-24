// Shared helpers — exposed on window
const fmt = {
  m: (n) => {
    if (n === null || n === undefined || isNaN(n)) return '$0';
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    if (abs >= 1e6) return `${sign}$${(abs/1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}$${(abs/1e3).toFixed(0)}K`;
    return `${sign}$${abs.toFixed(0)}`;
  },
  k: (n) => {
    if (!n) return '$0';
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    if (abs >= 1e6) return `${sign}$${(abs/1e6).toFixed(1)}M`;
    return `${sign}$${(abs/1e3).toFixed(0)}K`;
  },
  // 2-decimal currency: $1.23M / $123.45K / $1,234.56
  m2: (n) => {
    if (n === null || n === undefined || isNaN(n)) return '$0.00';
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    if (abs >= 1e6) return `${sign}$${(abs/1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}$${(abs/1e3).toFixed(2)}K`;
    return `${sign}$${abs.toFixed(2)}`;
  },
  signed2: (n) => {
    if (!n || Math.abs(n) < 0.005) return '$0.00';
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    let body;
    if (abs >= 1e6) body = `$${(abs/1e6).toFixed(2)}M`;
    else if (abs >= 1e3) body = `$${(abs/1e3).toFixed(2)}K`;
    else body = `$${abs.toFixed(2)}`;
    return (n > 0 ? '+' : '-') + body;
  },
  pct: (n) => `${(n*100).toFixed(1)}%`,
  signed: (n) => {
    if (!n || Math.abs(n) < 1) return '$0';
    return (n > 0 ? '+' : '') + fmt.m(n);
  },
  num: (n) => Math.round(n).toLocaleString('en-US')
};

// Domain owner role labels
const OWNER_ROLES = {
  'Devang Shah': 'Asset Mgmt & Data',
  'Danny Borkowski': 'Infrastructure & Controls',
  'Dan Royer': 'Finance & Treasury Tech',
  'John Spencer': 'Credit Technology',
  'Melissa Tumminia': 'PMO & Enterprise Tech',
  'Erik Wynkoop': 'Operations Technology',
  'N/A': 'Unallocated'
};

// Tiny SVG icon
function Icon({ name, size = 14, color = 'currentColor' }) {
  const paths = {
    refresh: <path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" />,
    upload: <path d="M12 16V4M6 10l6-6 6 6M4 20h16" />,
    download: <path d="M12 4v12m6-6-6 6-6-6M4 20h16" />,
    file: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" />,
    sharepoint: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    close: <path d="M18 6 6 18M6 6l18 12" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    check: <path d="m20 6-11 11-5-5" />,
    alert: <><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></>,
    trend: <path d="m3 17 6-6 4 4 8-8M14 7h7v7" />,
    filter: <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      {paths[name]}
    </svg>
  );
}

// Sparkline (12 months)
function Sparkline({ ac, fc, height = 32, width = 120 }) {
  const all = [...ac, ...fc];
  const max = Math.max(...all, 1);
  const w = width / 12;
  return (
    <svg width={width} height={height}>
      {ac.map((v, i) => {
        const h = Math.max(1, (v / max) * (height - 2));
        return <rect key={'a'+i} x={i*w + 1} y={height-h} width={w-2} height={h} fill="#333C66" />;
      })}
      {fc.map((v, i) => {
        if (i < ac.filter(x => x > 0).length) return null; // only show forecast for un-actualed months
        const h = Math.max(1, (v / max) * (height - 2));
        return <rect key={'f'+i} x={i*w + 1} y={height-h} width={w-2} height={h} fill="#6699FF" opacity="0.55" />;
      })}
    </svg>
  );
}

// Donut SVG
function Donut({ items, size = 140, thickness = 22 }) {
  const total = items.reduce((s, x) => s + Math.abs(x.value), 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size}>
      <g transform={`translate(${size/2},${size/2}) rotate(-90)`}>
        <circle r={r} fill="none" stroke="#EFEDE9" strokeWidth={thickness} />
        {items.map((it, i) => {
          const v = Math.abs(it.value) / total;
          const dash = v * c;
          const offset = -acc * c;
          acc += v;
          return <circle key={i} r={r} fill="none" stroke={it.color} strokeWidth={thickness} strokeDasharray={`${dash} ${c-dash}`} strokeDashoffset={offset} />;
        })}
      </g>
    </svg>
  );
}

Object.assign(window, { fmt, OWNER_ROLES, Icon, Sparkline, Donut });
