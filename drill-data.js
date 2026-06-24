/* ============================================================
   Antares Capital — Colors & Type tokens
   Source: Color Palette and Fonts Guidelines (January 2026)
   ============================================================ */

/* ---------- Webfonts (Google Fonts) ---------------------------
   Source Serif 4 — headers, numbers, captions
   Inter — subheaders, body, footnotes
   Note: brand wordmark uses ARGENT CF (commercial). The wordmark
   is treated as a logo asset (PNG/SVG); body type uses the pair
   above. Default fallbacks: Georgia (serif) / Arial (sans).
---------------------------------------------------------------- */
@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Inter:wght@300..800&display=swap');

:root {
  /* ---------------- PRIMARY PALETTE ---------------- */
  --antares-signature-navy: #333C66;        /* PMS 534 C / 648 */
  --antares-bright-blue:    #6699FF;        /* PMS 279 C — RGB build */
  --antares-bright-blue-cmyk:#4E7EE3;       /* CMYK printing only */
  --antares-bright-blue-100:#E5EEFF;        /* tint, PMS 2707 C */
  --antares-bright-blue-600:#4E7EE3;        /* darker build */
  --antares-pure-white:     #FFFFFF;

  /* ---------------- EXPANDED PALETTE ---------------- */
  --antares-olive-gold:     #D9D962;        /* PMS 584 C — sparingly */
  --antares-stone-gray:     #807E7A;        /* PMS Warm Gray 7 C */
  --antares-stone-gray-200: #C7C5C1;        /* derived stroke tint */
  --antares-stone-gray-100: #EBE9E6;        /* PMS Warm Gray 1 C — title bars */
  --antares-gray-100:       #EBE9E6;        /* alias */
  --antares-soft-black:     #1C1C1C;

  /* ---------------- GRADIENT STOPS ---------------- */
  /* Soft Navy / "primary" gradient — three stops */
  --antares-grad-stop-0:   #4B5E8B;
  --antares-grad-stop-75:  #202652;
  --antares-grad-stop-100: #1C213F;

  --antares-gradient-soft-navy: linear-gradient(135deg,
      var(--antares-grad-stop-0)   0%,
      var(--antares-grad-stop-75) 75%,
      var(--antares-grad-stop-100) 100%);

  /* Bright-Blue tint-to-white gradient (secondary chart highlight) */
  --antares-gradient-bright-tint: linear-gradient(90deg,
      rgba(102,153,255,0.9) 0%,
      rgba(102,153,255,0)   100%);

  /* ---------------- SEMANTIC ROLES ---------------- */
  --color-bg:           var(--antares-pure-white);
  --color-bg-tint:      var(--antares-bright-blue-100);
  --color-bg-neutral:   var(--antares-stone-gray-100);
  --color-bg-dark:      var(--antares-signature-navy);
  --color-bg-gradient:  var(--antares-gradient-soft-navy);

  --color-fg-1:         var(--antares-soft-black);          /* body */
  --color-fg-2:         var(--antares-stone-gray);          /* secondary */
  --color-fg-on-dark:   var(--antares-pure-white);
  --color-fg-header:    var(--antares-signature-navy);      /* on light */
  --color-accent:       var(--antares-bright-blue);

  --color-border:       var(--antares-stone-gray-200);
  --color-border-soft:  rgba(128,126,122,0.25);
  --color-divider:      var(--antares-stone-gray-100);

  /* Chart priority order (Navy → Bright Blue → Olive → Stone) */
  --chart-1: var(--antares-signature-navy);
  --chart-2: var(--antares-bright-blue);
  --chart-3: var(--antares-olive-gold);
  --chart-4: var(--antares-stone-gray);

  /* ---------------- TYPE FAMILIES ---------------- */
  --font-serif:    "Source Serif 4", Georgia, "Times New Roman", serif;
  --font-sans:     "Inter", Arial, Helvetica, sans-serif;
  --font-fallback-serif: Georgia, "Times New Roman", serif;  /* default if Source Serif unavailable */
  --font-fallback-sans:  Arial, Helvetica, sans-serif;       /* default if Inter unavailable */

  /* ---------------- TYPE SCALE ----------------
     Sizes in px for 1920x1080 slide context;
     scale down ~0.6x for web body usage.        */
  --fs-impact:      96px;   /* Impact Statement — short & sharp */
  --fs-h1:          56px;   /* Header */
  --fs-h2:          40px;
  --fs-h3:          28px;
  --fs-lead:        22px;   /* Lead copy intro */
  --fs-body:        16px;
  --fs-small:       14px;
  --fs-stats:       72px;   /* Big numbers */
  --fs-caption:     11px;   /* Tracked +200, all-caps */

  /* ---------------- SPACING (8pt grid) ---------------- */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;
  --space-10: 128px;

  /* ---------------- RADII ---------------- */
  /* Antares is restrained: the brand favors squared corners
     (echoing the geometric "anchor" squares in the graphic
     system). Cards & buttons use a small radius only. */
  --radius-0: 0px;
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-pill: 999px;     /* used only for tags / data chips */

  /* ---------------- ELEVATION / SHADOWS ----------------
     The brand is print-first; shadows are rarely used. When
     elevation is needed we keep them tight, low-opacity, navy-
     toned (never warm). */
  --shadow-1: 0 1px 2px rgba(28,33,63,0.06), 0 1px 1px rgba(28,33,63,0.04);
  --shadow-2: 0 4px 16px rgba(28,33,63,0.08), 0 1px 2px rgba(28,33,63,0.05);
  --shadow-focus: 0 0 0 3px rgba(102,153,255,0.35);
}

/* ============================================================
   SEMANTIC TYPE STYLES — apply directly or @extend
   ============================================================ */
.t-impact, h1.impact {
  font-family: var(--font-serif);
  font-weight: 600;          /* Semi-Bold */
  font-size: var(--fs-impact);
  line-height: 1.02;
  letter-spacing: -0.01em;
  color: var(--color-fg-header);
}

.t-h1, h1 {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: var(--fs-h1);
  line-height: 1.08;
  letter-spacing: -0.005em;
  color: var(--color-fg-header);
}

.t-h2, h2 {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: var(--fs-h2);
  line-height: 1.12;
  color: var(--color-fg-header);
}

.t-h3, h3 {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: var(--fs-h3);
  line-height: 1.2;
  color: var(--color-fg-header);
}

.t-lead {
  font-family: var(--font-sans);
  font-weight: 600;          /* Semibold */
  font-size: var(--fs-lead);
  line-height: 1.35;
  color: var(--color-fg-1);
}

.t-body, p {
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: var(--fs-body);
  line-height: 1.55;
  color: var(--color-fg-1);
  text-wrap: pretty;
}

.t-small {
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: var(--fs-small);
  line-height: 1.5;
  color: var(--color-fg-2);
}

.t-stats {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: var(--fs-stats);
  line-height: 1;
  letter-spacing: -0.01em;
  color: var(--color-fg-header);
  font-variant-numeric: lining-nums tabular-nums;
}

.t-caption, .eyebrow {
  font-family: var(--font-serif);
  font-weight: 800;          /* Extra-Bold */
  font-size: var(--fs-caption);
  line-height: 1.2;
  letter-spacing: 0.20em;    /* Tracked +200 */
  text-transform: lowercase; /* the brand sets captions in lowercase, see PDF p.20 */
  color: var(--color-fg-2);
}

/* When set on dark backgrounds */
.on-dark { color: var(--color-fg-on-dark); }
.on-dark .t-h1, .on-dark .t-h2, .on-dark .t-h3,
.on-dark .t-impact, .on-dark .t-stats { color: var(--color-fg-on-dark); }
.on-dark .t-small, .on-dark .t-caption { color: rgba(255,255,255,0.72); }

/* ============================================================
   UTILITIES
   ============================================================ */
.bg-navy      { background: var(--color-bg-dark); color: var(--color-fg-on-dark); }
.bg-gradient  { background: var(--color-bg-gradient); color: var(--color-fg-on-dark); }
.bg-tint      { background: var(--color-bg-tint); }
.bg-neutral   { background: var(--color-bg-neutral); }
.bg-white     { background: var(--color-bg); }
