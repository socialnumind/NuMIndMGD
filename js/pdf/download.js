/* ════════════════════════════════════════════════════════════════════
   pdf/download.js
   Master PDF report generator - 10-page A4 with template-faithful layout, AI prose integration, dynamic footers.
════════════════════════════════════════════════════════════════════ */

import { S } from '../state.js';
import { NMAP_DIMS } from '../engine/nmap.js';

async function downloadPDF() {
  /* ════════════════════════════════════════════════════════════════════
     NuMind MAPS - Template-faithful 10-page A4 report
     Mirrors numind_maps_jspdf_template-1.jsx, wired to live S + AI data
  ════════════════════════════════════════════════════════════════════ */
  const btn = document.getElementById('pdf-download-btn');
  if (btn) { btn.classList.add('loading'); btn.disabled = true; }

  try {
    // ── Ensure jsPDF is loaded ─────────────────────────────────────
    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = resolve;
        s.onerror = () => reject(new Error('Failed to load jsPDF'));
        document.head.appendChild(s);
      });
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // ── NuMind Logo (base64) ──────────────────────────────────────
    const NUMIND_LOGO_B64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAEnAnwDASIAAhEBAxEB/8QAHQABAAEFAQEBAAAAAAAAAAAAAAcEBQYICQIDAf/EAFsQAAEDAwEEBQULBwYKCAcBAAEAAgMEBQYRBxIhMQgTQVFhFCJxdYEJFTI3OHSRobKztBYjNkJScrEkMzVTYsE5ZHaChJKiwtHhFyhDRGVzk/AlJjRVg8Pj8f/EABwBAQABBQEBAAAAAAAAAAAAAAAFAgMEBgcBCP/EADcRAQACAQIEAwUGBQQDAAAAAAABAgMEEQUhMUESUXEGE2Gx0SKBkaHB8BQkMkLhIzNi8SVykv/aAAwDAQACEQMRAD8A3LREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERARU9zraW22+evrpmwU0DC+SR3JoC1k2obVb1k1TLQ2maW3WgEtDI3bsk473kcdD+yOHHjqreTJFI5pbhXB8/Er7Y+VY6zPSPrKf75nmHWWR0dxyGiikadHRseZHg+LWAlWum2tbPKiURx5JEHHhrJTzMH0uYAtShC7t1K9tpz3LGnVW8m509i9HFft5LTP3R+W0/Nux7/AFk96Bd/fai97zwFT1zer17t7XTVY5U7Vtn9PKY5MiiJB01ZTyvH0tYQoodGW9GaJn/iX++VFPVa8N0LY+HaDHqsXvLzMejmXFrTotXfBTnFZmN5+EtwbJm+JXp7WW2/0U0jjoI3P3Hn/NdoVkK0gbHpyUmbM9qF2x6eKhvE0tfaiQ0753pIB3tPMjwPs0Veo4T4Y3xTv8GJi1sWna8Nk0XxoaqnrqOGspJWzQTMD43tPBwPIr7KG6M8REQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQERUV8utBZbbLcblUNgp4+bjzJ7AB2lJnZVWtrzFaxvMob6S2RyukpcWpZHNZuioq906b37DT9BOn7qhNsHeD9CzHP7tDkWW112gbI2GZw6psg84NDQBrp6F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REQEREBERAREQEREBERAREQEREFNdaKK422poZ/5ueJ0bjpxGo01HitaMgtNdY7lLQXCF8cjHHdcR5r29jmntC2gVPX0VHX07qeupYamF3NkrA4fWszSav8Ah5neN4lNcH4xbh1pia+Ks/vk1Za8ac16Enism2k4TV41XPqqWN81qkdrHIBr1Wp+A7u8D2+lYaHEFbLitTLXxV6OkabNi1WKMuKd4lXtk8V7Eg7wqBr16Ei9nGuziTRhx12YQHvq3fxK/CvODknZXTH/ABt/8SvRUVTrePjL5d9v+XG8v77y8kBeSzgvaKtpj5Fh7l9aGhnralsEEZLnHiexo7yrtYbRLXzCSRpbTNPnO/a8As0ghigZuQxMjb3NboFi59VGP7Mc5bLwf2eya2sZcs+Gn5z6fV5pIGU1NHBGPNjaGj2L6oiiZ5ukVrFYiI6QIiI9EREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQeZoo5onRTRskjeNHNcNQR3ELBL/sqxu4zPnpDNbZHcSISDHr+6eXoBAWeoruLNkxTvSdmTptbn0tvFhvNUR/8AQsN79JDp3eRf/wBFfrBspx23TMnrHz3GRuh0lIbHr+6OfoJKz5Ffvr9ReNpszsvHuIZa+G2WdvhtHyiHzZTwMpxTshjbCBuiMNAaB3aK0VmN0Mzi+Jz4CexvFv0K9osauS1J3rLXtVosGrjbPSLfvz6sZ/JQa/8A1/D/AMn/AJqtoscoIHh8u/O4dj/g/QryiuW1OW0bTLCxcB4fit4q4o3+O8/OZfjWta0NaA1o4AAcAv1EVhLxGwiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiD//2Q==';

    // ── Palette (matches template) ────────────────────────────────
    const PURPLE       = '#5B2D8E';
    const PURPLE_LIGHT = '#7B4BC4';
    const PURPLE_DARK  = '#3D1F63';
    const TEAL         = '#00B8D9';
    const YELLOW       = '#F5A623';
    const GREEN        = '#2ECC71';
    const PINK         = '#FF6B9D';
    const GRAY         = '#6B7280';
    const LIGHT_GRAY   = '#F3F4F6';
    const WHITE        = '#FFFFFF';
    const W = 210, H = 297;

    // ── Helpers (mirrors template) ────────────────────────────────
    const hex2rgb = (hex) => [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
    const setFill = (hex) => doc.setFillColor.apply(doc, hex2rgb(hex));
    const setDraw = (hex) => doc.setDrawColor.apply(doc, hex2rgb(hex));
    const setTxtColor = (hex) => doc.setTextColor.apply(doc, hex2rgb(hex));

    const rect = (x, y, w, h, fill, draw, r) => {
      r = r || 0;
      if (fill) setFill(fill);
      if (draw) setDraw(draw);
      if (r > 0) doc.roundedRect(x, y, w, h, r, r, fill && draw ? 'FD' : fill ? 'F' : 'D');
      else doc.rect(x, y, w, h, fill && draw ? 'FD' : fill ? 'F' : 'D');
    };

    const txt = (text, x, y, opts) => {
      opts = opts || {};
      const size = opts.size || 10;
      const color = opts.color || '#1F2937';
      const bold = !!opts.bold;
      const align = opts.align || 'left';
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      setTxtColor(color);
      const drawOpts = { align: align };
      if (opts.maxWidth) drawOpts.maxWidth = opts.maxWidth;
      doc.text(String(text == null ? '' : text), x, y, drawOpts);
    };

    const line = (x1, y1, x2, y2, color, lw) => {
      doc.setLineWidth(lw || 0.3);
      setDraw(color || '#E5E7EB');
      doc.line(x1, y1, x2, y2);
    };

    const pill = (label, x, y, bgColor, textColor, w, h) => {
      bgColor = bgColor || PURPLE; textColor = textColor || WHITE;
      w = w || 28; h = h || 6;
      setFill(bgColor);
      doc.roundedRect(x, y - 4, w, h, 3, 3, 'F');
      txt(label, x + w / 2, y, { size: 7, color: textColor, bold: true, align: 'center' });
    };

    // ── Pull live data ────────────────────────────────────────────
    const safe = (v) => (v == null ? '' : String(v));
    const st  = (typeof S !== 'undefined' && S && S.student) ? S.student : {};
    const nmap = (typeof S !== 'undefined' && S && S.nmap && S.nmap.scores) ? S.nmap.scores : { dims: [], sorted: [] };
    const daab = (typeof S !== 'undefined' && S && S.daab) ? S.daab : null;
    const cpi  = (typeof S !== 'undefined' && S && S.cpi && S.cpi.scores) ? S.cpi.scores : { ranked: [], top3: [] };
    const sea  = (typeof S !== 'undefined' && S && S.sea && S.sea.scores) ? S.sea.scores : { domScores: { E:0, S:0, A:0 }, cls: {} };
    const ai   = window._lastAIReport || {};

    // ── AI prose helpers ──────────────────────────────────────────
    // The AI generator produces 8 fields. These helpers safely consume
    // them: aiText() returns the field with a fallback when missing,
    // aiHas() tells us whether AI prose is available at all (so we can
    // adjust headings), and drawProse() lays out a paragraph block with
    // automatic page breaks if the text overflows.
    const aiText = (key, fallback) => {
      const v = ai && typeof ai[key] === 'string' ? ai[key].trim() : '';
      return v || fallback || '';
    };
    const aiHas = (key) => !!(ai && typeof ai[key] === 'string' && ai[key].trim().length);

    /**
     * Draw a multi-paragraph prose block, breaking pages as needed.
     * Returns the new cy after drawing. Caller passes a redraw callback
     * to render the page header/student-bar each time a new page starts.
     */
    const drawProse = (text, cy, opts) => {
      opts = opts || {};
      const size      = opts.size      || 8.5;
      const color     = opts.color     || '#374151';
      const lineH     = opts.lineH     || 5;
      const paraGap   = opts.paraGap   || 4;
      const maxW      = opts.maxW      || (W - 28);
      const x         = opts.x         || 14;
      const bottom    = opts.bottom    || (H - 14);
      const pageStart = opts.pageStart || 32;
      const onNewPage = opts.onNewPage || function () {};
      const paras = String(text || '').split(/\n+/).map(p => p.trim()).filter(Boolean);
      paras.forEach((para) => {
        const lines = doc.splitTextToSize(para, maxW);
        lines.forEach((ln) => {
          if (cy + lineH > bottom) {
            doc.addPage();
            onNewPage();
            cy = pageStart;
          }
          txt(ln, x, cy, { size: size, color: color });
          cy += lineH;
        });
        cy += paraGap;
      });
      return cy;
    };

    const studentName = safe(st.fullName) || 'Student';
    const grade       = safe(st.class) + (st.section ? ' ' + safe(st.section) : '');
    const schoolName  = safe(st.school);
    const dateStr     = new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' });

    const stanineColor = (s) => s >= 7 ? PURPLE : s >= 4 ? PURPLE_LIGHT : PINK;
    const stanineBand  = (s) => s >= 7 ? 'Strength' : s >= 4 ? 'Developing' : 'Needs Attention';

    // ── 9 personality dims (live) ─────────────────────────────────
    // NOTE: scoreNMAP returns dims as { ...NMAP_DIMS[i], stanine, label, ... }
    // where the spread carries `label: 'Leadership & Motivation'` (dim title)
    // but the next field then overwrites `label` with the stanine band ('High').
    // So the resulting object has NO `name` and `label` is the band, not the
    // trait title. The original trait title is preserved as the `id` (lowercased
    // code) and most reliably recovered via positional lookup into NMAP_DIMS,
    // which is a module-level constant defined elsewhere in app.js.
    const NMAP_TITLES_FALLBACK = [
      'Leadership & Motivation','Assertiveness','Cautiousness','Adaptability & Flexibility',
      'Ethical Awareness','Creativity & Innovation','Curiosity & Learning','Discipline & Sincerity',
      'Patience & Resilience',
    ];
    const nmapTitleAt = (i) => {
      try {
        if (typeof NMAP_DIMS !== 'undefined' && NMAP_DIMS[i] && NMAP_DIMS[i].label) return NMAP_DIMS[i].label;
      } catch (e) {}
      return NMAP_TITLES_FALLBACK[i] || ('Dimension ' + (i + 1));
    };
    const personality9 = (nmap.dims && nmap.dims.length ? nmap.dims : [
      {}, {}, {}, {}, {}, {}, {}, {}, {},
    ]).slice(0, 9).map((d, i) => {
      const stn = d.stanine || 5;
      // Prefer explicit name if a future scorer provides one; otherwise positional NMAP_DIMS title.
      const title = d.name || nmapTitleAt(i);
      return { name: title, stanine: stn, label: stanineBand(stn) };
    });
    while (personality9.length < 9) {
      const i = personality9.length;
      personality9.push({ name: nmapTitleAt(i), stanine: 5, label: stanineBand(5) });
    }

    const topPersonality = personality9.slice().sort((a,b) => b.stanine - a.stanine).slice(0, 3);

    // ── 8 aptitude domains (live) ─────────────────────────────────
    // Real shape: S.daab is an object keyed by sub-test code (va, pa, na,
    // lsa, hma, ar, ma, sa); each S.daab[key].scores = { raw, max, stanine, label }.
    // Display order matches DAAB_SUBS (defined elsewhere in app.js).
    const DAAB_KEY_ORDER = ['va', 'pa', 'na', 'lsa', 'hma', 'ar', 'ma', 'sa'];
    const DAAB_TEMPLATE_LABELS = {
      va:  'Verbal Ability',
      pa:  'Perceptual Speed',
      na:  'Numerical Ability',
      lsa: 'Legal Studies Ability',
      hma: 'Health & Medical Apt.',
      ar:  'Abstract Reasoning',
      ma:  'Mechanical Ability',
      sa:  'Spatial Ability',
    };
    let aptitude8 = DAAB_KEY_ORDER.map((key) => {
      const sub = daab && daab[key];
      const sc = sub && sub.scores;
      const stanine = (sc && typeof sc.stanine === 'number' && sc.stanine > 0) ? sc.stanine : 5;
      return { name: DAAB_TEMPLATE_LABELS[key], stanine, label: (sc && sc.label) || stanineBand(stanine), key };
    });
    // Re-order to match the template's natural visual order: Verbal, Perceptual,
    // Numerical, Spatial, Mechanical, Abstract, Legal, Health/Medical
    const APT_DISPLAY_ORDER = ['va', 'pa', 'na', 'sa', 'ma', 'ar', 'lsa', 'hma'];
    aptitude8 = APT_DISPLAY_ORDER.map(k => aptitude8.find(a => a.key === k));

    const aptStrong   = aptitude8.filter(a => a.stanine >= 7).map(a => a.name);
    const aptEmerging = aptitude8.filter(a => a.stanine >= 4 && a.stanine <= 6).map(a => a.name);

    // ── Career interest (top 8) ──────────────────────────────────
    // Template display order for career interest bars (matches template PDF)
    const CPI_DISPLAY_ORDER = [
      'Sports & Physical Perf.',
      'People & Service',
      'Creative Design & Perf. Arts',
      'Science & Technology',
      'Health & Medical Science',
      'Legal & Judiciary',
      'Language & Communication',
      'Administration & Governance',
    ];
    const cpiAll = (cpi.ranked && cpi.ranked.length ? cpi.ranked : []).map(r => ({
      label: r.label || r.name || '',
      score: typeof r.score === 'number' ? r.score : 0,
      level: r.level || (r.score >= 15 ? 'Strong' : r.score >= 8 ? 'Moderate' : 'Low'),
    }));
    // Build display list in template order, filling missing with 0
    const cpiByLabel = {};
    cpiAll.forEach(r => { cpiByLabel[r.label] = r; });
    const careers8 = CPI_DISPLAY_ORDER.map(lbl => cpiByLabel[lbl] || { label: lbl, score: 0, level: 'Low' });
    const cpiColor = (lvl) => lvl === 'Strong' ? PURPLE : lvl === 'Moderate' ? PURPLE_LIGHT : PINK;
    const top3 = (cpi.top3 && cpi.top3.length >= 3 ? cpi.top3 : cpiAll.slice().sort((a,b) => b.score - a.score).slice(0, 3));

    // ── SEAA cards (live) ────────────────────────────────────────
    const seaCat = (cat) => {
      if (cat === 'A' || cat === 'B') return { catLabel: 'Strong Readiness',     color: PURPLE };
      if (cat === 'C')                 return { catLabel: 'Developing Readiness', color: PURPLE_LIGHT };
      return                                  { catLabel: 'Support Needed',       color: PINK };
    };
    const seaCards = [
      Object.assign({ key:'S', title:'Social Adjustment',    score: sea.domScores.S || 0 }, seaCat((sea.cls.S||{}).cat)),
      Object.assign({ key:'E', title:'Emotional Adjustment', score: sea.domScores.E || 0 }, seaCat((sea.cls.E||{}).cat)),
      Object.assign({ key:'A', title:'Academic Adjustment',  score: sea.domScores.A || 0 }, seaCat((sea.cls.A||{}).cat)),
    ];
    seaCards.forEach(c => { c.label = c.catLabel; });

    // ── Integrated Fit Score ─────────────────────────────────────
    const avgPers = personality9.reduce((s,d) => s + d.stanine, 0) / personality9.length;
    const avgApt  = aptitude8.reduce((s,d) => s + d.stanine, 0) / aptitude8.length;
    const topInterestScore = (top3[0] && top3[0].score) || 0;
    const stanineToPct = (s) => ((s - 1) / 8) * 100;
    let fitRaw = (stanineToPct(avgPers) * 0.30) + (stanineToPct(avgApt) * 0.30) + ((topInterestScore / 20) * 100 * 0.40);
    seaCards.forEach(c => {
      if (c.label === 'Support Needed') fitRaw -= 7;
      else if (c.label === 'Developing Readiness') fitRaw -= 3;
    });
    const fitScore = Math.max(0, Math.min(100, Math.round(fitRaw)));
    const fitTier  = fitScore >= 75 ? 'Strong Fit' : fitScore >= 55 ? 'Emerging Fit' : 'Exploratory Fit';

    // ── Layout helpers ───────────────────────────────────────────
    // Note: page total isn't known up front because AI prose blocks may
    // overflow and add pages dynamically. We track which pages need a footer
    // here, then stamp all footers in one pass at the end using the doc's
    // actual page indices — this guarantees footer numbers always match
    // the physical page they sit on, even after AI overflow inserts pages.
    const footer = function () { /* no-op: footers are stamped at save time */ };

    const sectionHeader = (title, subtitle) => {
      rect(0, 0, W, 20, PURPLE);
      try { doc.addImage('data:image/jpeg;base64,' + NUMIND_LOGO_B64, 'JPEG', W - 46, 2, 40, 16); } catch(e) {}
      txt(title, 14, 10, { size: 13, color: WHITE, bold: true });
      if (subtitle) {
        const subLines = doc.splitTextToSize(subtitle, W - 60);
        txt(subLines.slice(0, 2).join(' '), 14, 16, { size: 6.5, color: '#D8B4FE', maxWidth: W - 60 });
      }
    };

    const studentBar = (y) => {
      y = y || 24;
      rect(10, y, W - 20, 8, LIGHT_GRAY, null, 1);
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); setTxtColor(PURPLE);
      doc.text(studentName, 14, y + 5.5);
      const nameW = doc.getTextWidth(studentName);
      const meta = '  |  ' + (grade || '-') + ' | ' + (schoolName || '-') + ' | ' + dateStr;
      txt(meta, 14 + nameW, y + 5.5, { size: 8, color: GRAY, maxWidth: W - 28 - nameW });
    };

    const stanineBar = (label, value, y, colorHex) => {
      txt(label, 14, y, { size: 7, color: '#1F2937', maxWidth: 52 });
      const barX = 70, barW = W - barX - 20;
      rect(barX, y - 3.5, barW, 5, '#E5E7EB', null, 1);
      rect(barX, y - 3.5, (value / 9) * barW, 5, colorHex, null, 1);
      txt(String(value), barX + barW + 2, y, { size: 7, color: GRAY, bold: true });
    };

    /* ═══════════════════════════════════════════════
       PAGE 1 - COVER
    ═══════════════════════════════════════════════ */
    rect(0, 0, W, H, PURPLE_DARK);
    rect(0, 0, W, 80, PURPLE);
    // NuMind logo image on cover (top-left)
    try { doc.addImage('data:image/jpeg;base64,' + NUMIND_LOGO_B64, 'JPEG', 10, 6, 54, 22); } catch(e) {}
    
    txt('Comprehensive Multidimensional Assessment Report', 14, 50, { size: 9, color: '#D8B4FE' });
    txt('NuMind MAPS', 14, 68, { size: 28, color: WHITE, bold: true });
    txt('Multidimensional Assessment', 14, 80, { size: 14, color: '#C4B5FD' });
    txt('Personalized Success', 14, 88, { size: 14, color: '#C4B5FD' });
    line(14, 94, 80, 94, WHITE, 0.8);

    rect(14, 104, W - 28, 56, WHITE, null, 3);
    txt('Prepared For', 22, 114, { size: 8, color: GRAY });
    txt(studentName, 22, 126, { size: 18, color: '#1F2937', bold: true });
    line(22, 130, W - 22, 130, '#E5E7EB', 0.3);
    txt('Grade:', 22, 140, { size: 9, color: '#1F2937', bold: true });
    txt(grade || '-', 38, 140, { size: 9, color: '#1F2937' });
    txt('School:', 22, 148, { size: 9, color: '#1F2937', bold: true });
    txt(schoolName || '-', 38, 148, { size: 9, color: '#1F2937', maxWidth: W - 60 });
    txt('Date:', 22, 156, { size: 9, color: '#1F2937', bold: true });
    txt(dateStr, 35, 156, { size: 9, color: '#1F2937' });

    // Tagline panel — fills the previously empty mid-cover area.
    rect(14, 168, W - 28, 22, PURPLE_LIGHT, null, 3);
    txt('Your Personalised Career Development Report', W / 2, 178, { size: 11, color: WHITE, bold: true, align: 'center' });
    txt('Built from 4 evidence-based assessments and AI-powered insights', W / 2, 185, { size: 8, color: '#E9D5FF', align: 'center' });

    txt('The Four Dimensions Shaping Your Profile', 14, 200, { size: 9, color: '#D8B4FE' });
    ['NMAP', 'NAAB', 'NCPI', 'NSEAA'].forEach((p, i) => {
      const px = 14 + i * 47;
      setFill(WHITE); doc.roundedRect(px, 205, 43, 18, 3, 3, 'F');
      txt(p, px + 21, 216, { size: 10, color: PURPLE, bold: true, align: 'center' });
    });
    footer(1);

    /* ═══════════════════════════════════════════════
       PAGE 2 - WELCOME & 4 PILLARS
    ═══════════════════════════════════════════════ */
    doc.addPage();
    rect(0, 0, W, 20, PURPLE);
    try { doc.addImage('data:image/jpeg;base64,' + NUMIND_LOGO_B64, 'JPEG', W - 46, 2, 40, 16); } catch(e) {}
    txt('Welcome', 14, 9, { size: 8, color: '#D8B4FE' });
    txt(studentName, 14, 16, { size: 14, color: WHITE, bold: true });

    let cy = 26;
    // Use AI holistic_summary when present — this is the personalised
    // mentor narrative weaving all four modules into the student's story.
    // Falls back to the generic welcome blurb when no AI report is available.
    const welcomeFallback =
      'Welcome to your NuMind Integrated Career Development Report. This report is based on a multidimensional assessment designed to help you better understand your strengths, preferences, abilities, and readiness factors that influence academic and career decisions.\n\n' +
      'The purpose of this report is not merely to suggest careers, but to support informed decision-making by helping you understand your strengths, growth areas, and pathways that may align well with your profile.';
    const welcomeProse = aiText('holistic_summary', welcomeFallback);
    cy = drawProse(welcomeProse, cy, {
      size: 8.5, color: '#374151', lineH: 5, paraGap: 4,
      maxW: W - 28, x: 14, bottom: H - 60,
      onNewPage: function () {
        rect(0, 0, W, 20, PURPLE);
        txt('Welcome (continued)', 14, 9, { size: 8, color: '#D8B4FE' });
        txt(studentName, 14, 16, { size: 14, color: WHITE, bold: true });
      },
    });
    cy += 2;

    rect(10, cy, W - 20, 8, PURPLE, null, 2);
    txt('The Four Pillars of NuMind MAP', W / 2, cy + 5.5, { size: 9, color: WHITE, bold: true, align: 'center' });
    cy += 12;

    const infoTxt = 'Each assessment plays a distinct role in shaping your Integrated Career Development Profile, helping you make informed and confident decisions about your future.';
    const infoL = doc.splitTextToSize(infoTxt, W - 30);
    const infoH = 6 + infoL.length * 5;
    rect(10, cy, W - 20, infoH, '#F5F3FF', '#E9D5FF', 2);
    infoL.forEach((ln, i) => txt(ln, 14, cy + 5 + i * 5, { size: 8, color: '#374151' }));
    cy += infoH + 4;

    const pillarData = [
      { code:'NMAP',  title:'NuMind Multidimensional Assessment of Personality', sub:'Understanding who you are at your core', body:'Evaluates 9 key personality dimensions that influence how you think, behave, and grow.', border:PURPLE },
      { code:'NAAB',  title:'NuMind Aptitude & Ability Battery',                 sub:'Discovering what you can do',            body:'Measures 8 essential cognitive abilities - verbal, numerical, spatial, abstract reasoning and more.', border:PURPLE_LIGHT },
      { code:'NCPI',  title:'NuMind Career Preference Inventory',                sub:'Identifying what you enjoy',             body:'Maps career interests across 10 domains to uncover environments and roles aligned with your preferences.', border:TEAL },
      { code:'NSEAA', title:'NuMind Social Emotional & Academic Adjustment',     sub:'Preparing you to thrive',                body:'Assesses emotional, social, and academic readiness ensuring long-term success and wellbeing.', border:YELLOW },
    ];
    pillarData.forEach((p, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const px = 10 + col * 97, py = cy + row * 36;
      rect(px, py, 93, 32, '#F9FAFB', p.border, 2);
      doc.setLineWidth(0.8); setDraw(p.border); doc.line(px, py, px, py + 32);
      txt(p.code,  px + 5, py + 7,  { size: 7,   color: p.border, bold: true });
      txt(p.title, px + 5, py + 12, { size: 7.5, color: '#1F2937', bold: true, maxWidth: 83 });
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7); setTxtColor(p.border);
      const sub = doc.splitTextToSize(p.sub, 83); doc.text(sub, px + 5, py + 18);
      doc.setFont('helvetica', 'normal');
      const body = doc.splitTextToSize(p.body, 83);
      txt(body.join('\n'), px + 5, py + 22, { size: 6.5, color: '#6B7280' });
    });
    cy += 76;

    txt('Know the Order of Your Report', 14, cy, { size: 9, color: '#1F2937', bold: true });
    cy += 5;
    const steps = [
      ['1', 'Profile Snapshot:',           'Quick overview of your overall profile across all four domains'],
      ['2', 'Assessment Insights:',        'Deep dive into Personality, Aptitude, Career Interest, and Wellbeing'],
      ['3', 'Career Alignment:',           'Integrated Career Fit Matrix combining all four domains'],
      ['4', 'Gap Analysis:',               'Comparison between your current profile and recommended pathway requirements'],
      ['5', 'Summary & Recommendations:',  'Final overview, suggested streams, next steps, and counsellor notes'],
    ];
    steps.forEach((row) => {
      rect(10, cy, W - 20, 8, LIGHT_GRAY, null, 1);
      setFill(PURPLE); doc.circle(16, cy + 4, 3, 'F');
      txt(row[0], 16, cy + 5.5, { size: 7, color: WHITE, bold: true, align: 'center' });
      txt(row[1], 22, cy + 5.5, { size: 8, color: PURPLE, bold: true });
      doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      const lblW = doc.getTextWidth(row[1]);
      txt(row[2], 22 + lblW + 2, cy + 5.5, { size: 8, color: GRAY, maxWidth: W - 28 - 22 - lblW - 2 });
      cy += 10;
    });

    const stText = 'These four pillars come together to provide a holistic, evidence-based view of your potential - empowering you to make informed decisions today for a more confident tomorrow.';
    const stL = doc.splitTextToSize(stText, W - 36);
    const stH = 10 + stL.length * 5;
    rect(10, cy, W - 20, stH, '#F5F3FF', PURPLE, 2);
    txt('Stronger Together', 14, cy + 7, { size: 9, color: PURPLE, bold: true });
    stL.forEach((ln, i) => txt(ln, 14, cy + 13 + i * 5, { size: 7.5, color: '#374151' }));
    cy += stH + 2;

    footer(2);

    /* ═══════════════════════════════════════════════
       PAGE 3 - PROFILE SNAPSHOT
    ═══════════════════════════════════════════════ */
    doc.addPage();
    sectionHeader('Profile Snapshot', 'A quick overview of your overall profile, key strengths and growth areas');
    studentBar(22);

    cy = 34;
    const howTo = 'For Personality, Aptitude, and Career Interest, higher scores indicate stronger alignment. For SEAA Readiness, lower scores indicate stronger readiness; higher scores indicate greater support may be helpful.';
    const howL = doc.splitTextToSize(howTo, W - 30);
    const howH = 8 + howL.length * 4.5;
    rect(10, cy, W - 20, howH, '#F8FAFF', '#C4B5FD', 2);
    txt('How to read this section:', 14, cy + 6, { size: 8, color: '#1F2937', bold: true });
    howL.forEach((ln, i) => txt(ln, 14, cy + 11 + i * 4.5, { size: 7.5, color: '#374151' }));
    cy += howH + 4;

    const persStatus  = avgPers >= 6.5 ? 'Strength' : avgPers >= 4 ? 'Developing' : 'Support Needed';
    const aptStatus   = avgApt  >= 6.5 ? 'Strength' : avgApt  >= 4 ? 'Developing' : 'Support Needed';
    const cpiStatus   = topInterestScore >= 15 ? 'Strength' : topInterestScore >= 8 ? 'Developing' : 'Support Needed';
    const seaWorst    = seaCards.reduce((w, c) => {
      if (c.label === 'Support Needed') return 'Support Needed';
      if (c.label === 'Developing Readiness' && w !== 'Support Needed') return 'Developing';
      return w;
    }, 'Strength');
    const statusBg = (s) => s === 'Strength' ? '#F5F3FF' : s === 'Developing' ? '#EFF6FF' : '#FEFCE8';
    const statusBorder = (s) => s === 'Strength' ? PURPLE : s === 'Developing' ? TEAL : YELLOW;

    const snapCards = [
      { title:'Personality',     status: persStatus, note: topPersonality.length ? 'Dominant: ' + topPersonality.slice(0,2).map(t => t.name).join(', ') : 'Personality profile across 9 dimensions.' },
      { title:'Aptitude',        status: aptStatus,  note: aptStrong.length ? 'Strong areas: ' + aptStrong.slice(0,2).join(', ') : 'Aptitude profile across 8 ability domains.' },
      { title:'Career Interest', status: cpiStatus,  note: top3[0] ? 'Top interest: ' + top3[0].label + ' (' + top3[0].score + '/20)' : 'Career interest mapped across domains.' },
      { title:'SEAA Readiness',  status: seaWorst,   note: seaCards.map(c => c.title.split(' ')[0] + ': ' + c.score + '/20').join(' | ') },
    ];
    snapCards.forEach((c, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const px = 10 + col * 97, py = cy + row * 40;
      rect(px, py, 93, 36, statusBg(c.status), statusBorder(c.status), 2);
      txt(c.title,  px + 7, py + 9,  { size: 9, color: statusBorder(c.status), bold: true });
      txt(c.status, px + 7, py + 16, { size: 10, color: '#1F2937', bold: true });
      line(px + 7, py + 19, px + 86, py + 19, '#E5E7EB', 0.2);
      const nL = doc.splitTextToSize(c.note, 79);
      txt(nL.slice(0,2).join('\n'), px + 7, py + 24, { size: 7, color: GRAY });
    });
    cy += 86;

    txt('Integrated Fit Score', 14, cy, { size: 10, color: '#1F2937', bold: true });
    cy += 5;
    rect(10, cy, W - 20, 28, PURPLE_DARK, null, 3);
    txt('Alignment Score', 18, cy + 8, { size: 9, color: '#D8B4FE' });
    txt(fitScore + ' / 100', 18, cy + 18, { size: 14, color: WHITE, bold: true });
    txt(fitTier, 18, cy + 24, { size: 7, color: '#C4B5FD' });
    const fitDesc = 'This index combines strength-based domains (personality, aptitude, interests) with readiness indicators (SEAA) to provide an integrated view of overall fit and developmental readiness.';
    const fitL = doc.splitTextToSize(fitDesc, 90);
    txt(fitL.join('\n'), 110, cy + 10, { size: 7.5, color: '#E9D5FF' });
    cy += 34;

    rect(10, cy, W - 20, 10, LIGHT_GRAY, null, 2);
    txt('Note:', 14, cy + 6, { size: 8, color: '#1F2937', bold: true });
    txt('Results reflect both strengths and readiness indicators. Developing and support areas represent opportunities for growth, not limitations.', 24, cy + 6, { size: 7.5, color: GRAY, maxWidth: W - 38 });

    footer(3);

    /* ═══════════════════════════════════════════════
       PAGE 4 - PERSONALITY PROFILE
    ═══════════════════════════════════════════════ */
    doc.addPage();
    sectionHeader('Personality Profile', 'The Personality Graph highlights your strengths across 9 important personality traits and how they may relate to personal growth and career fit');
    studentBar(22);
    cy = 34;

    rect(10, cy, W - 20, 7, LIGHT_GRAY, null, 1);
    setFill(PURPLE);       doc.circle(18, cy + 3.5, 2.5, 'F'); txt('Strength',        22, cy + 5, { size: 7.5, color: '#1F2937' });
    setFill(PURPLE_LIGHT); doc.circle(52, cy + 3.5, 2.5, 'F'); txt('Developing',      56, cy + 5, { size: 7.5, color: '#1F2937' });
    setFill(PINK);         doc.circle(92, cy + 3.5, 2.5, 'F'); txt('Needs Attention', 96, cy + 5, { size: 7.5, color: '#1F2937' });
    cy += 11;

    rect(10, cy, W - 20, 60, '#FAFAFA', '#E5E7EB', 2);
    txt('Personality Stanine Scores - 9 Dimensions', 14, cy + 6, { size: 8, color: GRAY, bold: true });
    personality9.forEach((d, i) => stanineBar(d.name, d.stanine, cy + 14 + i * 5.5, stanineColor(d.stanine)));
    for (let i = 1; i <= 9; i++) {
      const bx = 70 + ((i - 1) / 8) * (W - 90);
      txt(String(i), bx, cy + 62, { size: 6, color: GRAY, align: 'center' });
    }
    cy += 66;

    rect(10, cy, W - 20, 18, '#F5F3FF', '#C4B5FD', 2);
    txt('Personality Graph:', 14, cy + 6, { size: 8, color: '#1F2937', bold: true });
    const pgL = doc.splitTextToSize('Graphical interpretations are based on the Stanine (Standard Nine) Scale, where scores are reported across a 1-9 range, with 1-3 = Needs attention, 4-6 = Developing, and 7-9 = Strength.', W - 40);
    txt(pgL.join('\n'), 14, cy + 12, { size: 7.5, color: '#374151' });
    cy += 22;

    rect(10, cy, W - 20, 10, '#F5F3FF', PURPLE, 2);
    doc.setLineWidth(1.5); setDraw(PURPLE); doc.line(10, cy, 10, cy + 10);
    txt('Scores are indicative and should not be considered final. They reflect the current state at the time of assessment and may change over time.', 15, cy + 6, { size: 7.5, color: '#374151', maxWidth: W - 30 });
    cy += 15;

    txt('Top 3 Dominant Traits', 14, cy, { size: 9, color: '#1F2937', bold: true });
    cy += 5;
    [0, 1, 2].forEach((idx) => {
      const trait = topPersonality[idx] || { name:'-', stanine:0, label:'-' };
      const px = 10 + idx * 63;
      rect(px, cy, 59, 12, LIGHT_GRAY, '#D1D5DB', 2);
      txt('0' + (idx + 1), px + 5, cy + 8, { size: 9, color: PURPLE, bold: true });
      txt(trait.name, px + 16, cy + 6, { size: 7.5, color: '#1F2937', bold: true, maxWidth: 42 });
      txt(trait.label + ' | ' + trait.stanine + '/9', px + 16, cy + 11, { size: 7, color: GRAY });
    });
    cy += 18;

    txt('Description of Personality Parameters', 14, cy, { size: 9, color: '#1F2937', bold: true });
    cy += 5;
    const traitDescs = {
      'Leadership & Motivation':    'Shows initiative, drive and willingness to take responsibility. Shapes how a student approaches goals and engagement.',
      'Assertiveness':              "Ability to express views confidently. Influences comfort with healthy competition and standing by one's ideas.",
      'Cautiousness':               'Alertness, careful thinking and consideration of risks. Shapes how thoughtfully a student approaches decisions.',
      'Adaptability & Flexibility': 'Openness to change and adjusting to new situations. Influences how well a student responds to transitions and feedback.',
      'Ethical Awareness':          'Sensitivity toward values and responsibility. Shapes integrity, accountability and ethical decision making.',
      'Creativity & Innovation':    'Originality, imagination and openness to new ideas. Supports problem solving and innovative thinking.',
      'Curiosity & Learning':       'Interest in exploring and engaging with new knowledge. Influences motivation for learning and growth.',
      'Discipline & Sincerity':     'Consistency, responsibility and commitment to tasks. Supports organisation and follow-through.',
      'Patience & Resilience':      'Emotional steadiness and ability to cope with setbacks. Influences how a student manages challenges over time.',
    };
    personality9.forEach((d, i) => {
      const num = '0' + (i + 1);
      const desc = traitDescs[d.name] || (d.name + ' - score ' + d.stanine + '/9 (' + stanineBand(d.stanine) + ').');
      const col = i % 2, row = Math.floor(i / 2);
      const px = 10 + col * 97, py = cy + row * 22;
      rect(px, py, 93, 18, '#F0F9FF', '#BAE6FD', 2);
      txt(num,    px + 5,  py + 7, { size: 8, color: PURPLE_LIGHT, bold: true });
      txt(d.name, px + 14, py + 7, { size: 8, color: '#1F2937', bold: true, maxWidth: 75 });
      const dL = doc.splitTextToSize(desc, 83);
      txt(dL.slice(0,2).join('\n'), px + 5, py + 13, { size: 6.5, color: GRAY });
    });
    cy += Math.ceil(personality9.length / 2) * 22 + 4;

    // AI Personality Insight — always shown; uses AI prose when available,
    // falls back to a deterministic insight paragraph when not.
    if (cy + 22 > H - 16) {
      doc.addPage();
      sectionHeader('Personality Profile', 'The Personality Graph highlights your strengths across 9 important personality traits and how they may relate to personal growth and career fit');
      studentBar(22);
      cy = 34;
    }
    // Title bar — always rendered
    rect(10, cy, W - 20, 8, '#EFF6FF', '#BFDBFE', 2);
    txt('Personality Insight (AI)', 14, cy + 6, { size: 9, color: '#1D4ED8', bold: true });
    cy += 10;

    const personalityFallback = (() => {
      const top2Names = topPersonality.slice(0, 2).map(t => t.name).join(' and ');
      const weak2Names = personality9.slice().sort((a,b) => a.stanine - b.stanine).slice(0,2).map(t => t.name).join(' and ');
      return studentName + '\'s personality profile is defined by strong ' + top2Names + ', which provides a solid foundation for leadership-oriented and detail-sensitive roles. These traits support confident decision-making, careful risk assessment, and the ability to inspire peers through integrity and purpose.' +
        '\n\nWhile ' + weak2Names + ' are currently developing areas, these represent exciting opportunities for growth. Engaging in creative projects, varied learning experiences, and reflective practice can help balance the profile and expand potential pathways.';
    })();

    cy = drawProse(aiText('personality_profile', personalityFallback), cy, {
      size: 7.5, color: '#374151', lineH: 4.2, paraGap: 3,
      maxW: W - 28, x: 14, bottom: H - 16, pageStart: 32,
      onNewPage: function () {
        sectionHeader('Personality Insight (continued)', '');
        studentBar(22);
      },
    });
    cy += 2;

    // Development suggestions (always shown)
    const persWeak2 = personality9.slice().sort((a,b) => a.stanine - b.stanine).slice(0, 3);
      if (persWeak2.length && cy + 24 < H - 14) {
        const suggMap2 = {
          'Leadership & Motivation':    'Take initiative on small group projects to build leadership confidence.',
          'Assertiveness':              'Practice expressing opinions in low-pressure settings such as class discussions.',
          'Cautiousness':               'Develop a habit of pausing to weigh options before deciding.',
          'Adaptability & Flexibility': 'Try new activities or routines weekly to build comfort with change.',
          'Ethical Awareness':          'Reflect on real situations and discuss right-vs-wrong reasoning with a mentor.',
          'Creativity & Innovation':    'Explore creative outlets - writing, design, problem-solving puzzles - regularly.',
          'Curiosity & Learning':       'Read across diverse topics and ask questions about how things work.',
          'Discipline & Sincerity':     'Use a planner and set small daily goals to build consistency.',
          'Patience & Resilience':      'Practice mindfulness and journaling to build emotional steadiness.',
        };
        const suggH = 12 + persWeak2.length * 6;
        rect(10, cy, W - 20, suggH, '#EFF6FF', '#BFDBFE', 2);
        txt('Development Suggestions', 14, cy + 7, { size: 9, color: '#1D4ED8', bold: true });
        persWeak2.forEach((d, i) => {
          const sug = suggMap2[d.name] || ('Strengthen ' + d.name + ' through targeted practice and reflection.');
          txt('- ' + sug, 14, cy + 13 + i * 5, { size: 7.5, color: '#374151', maxWidth: W - 28 });
        });
      }

    footer(4);

    /* ═══════════════════════════════════════════════
       PAGE 5 - APTITUDE & ABILITY
    ═══════════════════════════════════════════════ */
    doc.addPage();
    sectionHeader('Aptitude & Ability Profile', 'Understand your strengths across different ability areas and emerging areas for development. Indicators of how abilities may align with future learning and career options.');
    studentBar(22);
    cy = 34;

    rect(10, cy, W - 20, 7, LIGHT_GRAY, null, 1);
    setFill(PURPLE);       doc.circle(18,  cy + 3.5, 2.5, 'F'); txt('Strong Aptitude Area',  22,  cy + 5, { size: 7.5, color: '#1F2937' });
    setFill(PURPLE_LIGHT); doc.circle(62,  cy + 3.5, 2.5, 'F'); txt('Emerging Area',         66,  cy + 5, { size: 7.5, color: '#1F2937' });
    setFill(PINK);         doc.circle(96,  cy + 3.5, 2.5, 'F'); txt('Area for Development', 100, cy + 5, { size: 7.5, color: '#1F2937' });
    cy += 11;

    rect(10, cy, W - 20, 56, '#FAFAFA', '#E5E7EB', 2);
    txt('Aptitude Stanine Scores - 8 Domains', 14, cy + 6, { size: 8, color: GRAY, bold: true });
    aptitude8.forEach((d, i) => stanineBar(d.name, d.stanine, cy + 14 + i * 5.5, stanineColor(d.stanine)));
    for (let i = 1; i <= 9; i++) {
      const bx = 70 + ((i - 1) / 8) * (W - 90);
      txt(String(i), bx, cy + 57, { size: 6, color: GRAY, align: 'center' });
    }
    cy += 62;

    rect(10, cy, W - 20, 16, '#F5F3FF', '#C4B5FD', 2);
    txt('Aptitude Graph:', 14, cy + 6, { size: 8, color: '#1F2937', bold: true });
    txt('Graphical interpretations are based on the Stanine (Standard Nine) Scale, where scores are reported across a 1-9 range, with 1-3 = Area of Development, 4-6 = Emerging Area, and 7-9 = Strong Aptitude Area.', 14, cy + 11, { size: 7, color: '#374151', maxWidth: W - 28 });
    cy += 20;

    rect(10,  cy, 93, 22, '#F0FDF4', GREEN,     2);
    txt('Strong Aptitude Areas', 14, cy + 7, { size: 8, color: GREEN, bold: true });
    txt(aptStrong.length ? aptStrong.slice(0,3).join('\n') : '- building foundational strengths -', 14, cy + 13, { size: 8, color: '#1F2937' });

    rect(107, cy, 93, 22, '#EFF6FF', '#3B82F6', 2);
    txt('Emerging Areas', 111, cy + 7, { size: 8, color: '#3B82F6', bold: true });
    txt(aptEmerging.length ? aptEmerging.slice(0,3).join('\n') : 'No emerging areas at present', 111, cy + 13, { size: 8, color: '#1F2937' });
    cy += 27;

    // AI Aptitude Insight — uses aptitude_profile when present;
    // otherwise renders the deterministic relevance line.
    const aptDomainMap = {
      'Verbal Ability':         ['Psychology', 'Law', 'Journalism'],
      'Perceptual Speed':       ['Data Analytics', 'Cybersecurity'],
      'Numerical Ability':      ['Finance', 'Data Science', 'AI/ML'],
      'Spatial Ability':        ['Architecture', 'UX/UI', 'Product Design'],
      'Mechanical Ability':     ['Engineering', 'Robotics'],
      'Abstract Reasoning':     ['Strategy', 'AI Research'],
      'Legal Studies Ability':  ['Law', 'Public Policy'],
      'Health & Medical Apt.':  ['Medicine', 'Biotechnology'],
    };
    if (aiHas('aptitude_profile')) {
      if (cy + 14 > H - 16) {
        doc.addPage();
        sectionHeader('Aptitude Insight (AI)', '');
        studentBar(22);
        cy = 34;
      }
      // Box header
      rect(10, cy, W - 20, 7, LIGHT_GRAY, null, 2);
      txt('Aptitude Insight (AI):', 14, cy + 5, { size: 8, color: '#1F2937', bold: true });
      cy += 9;
      cy = drawProse(aiText('aptitude_profile', ''), cy, {
        size: 7.5, color: '#374151', lineH: 4.2, paraGap: 3,
        maxW: W - 28, x: 14, bottom: H - 14, pageStart: 32,
        onNewPage: function () {
          sectionHeader('Aptitude Insight (continued)', '');
          studentBar(22);
        },
      });
      cy += 2;
    } else {
      rect(10, cy, W - 20, 14, LIGHT_GRAY, null, 2);
      txt('Career Relevance Mapping:', 14, cy + 6, { size: 8, color: '#1F2937', bold: true });
      const aptDomLine = aptStrong.slice(0,3).map(a => a.split(' ')[0] + ' -> ' + (aptDomainMap[a] || []).slice(0,2).join('/')).join('  |  ') ||
                         'Build strengths broadly across reasoning, language and quantitative skills.';
      txt(aptDomLine, 14, cy + 11, { size: 7, color: GRAY, maxWidth: W - 28 });
      cy += 18;
    }

    rect(10, cy, W - 20, 10, '#EDE9FE', null, 2);
    txt('Suggested Career Domains Based on Aptitude', 14, cy + 4, { size: 8, color: PURPLE, bold: true });
    const suggDoms = (() => {
      const set = new Set();
      aptStrong.forEach(a => (aptDomainMap[a] || []).forEach(d => set.add(d)));
      if (set.size < 4) aptEmerging.forEach(a => (aptDomainMap[a] || []).forEach(d => set.add(d)));
      const out = Array.from(set).slice(0, 4);
      while (out.length < 4) out.push('Multidisciplinary');
      return out;
    })();
    suggDoms.forEach((d, i) => pill(d, 14 + i * 47, cy + 8.5, PURPLE, WHITE, 40, 6));
    cy += 16;

    txt('Understanding Aptitude Areas and Related Career Pathways', 14, cy, { size: 9, color: '#1F2937', bold: true });
    cy += 5;
    const tblHeaders = ['Aptitude Areas', 'Description', 'Potential Careers'];
    const tblColW = [38, 68, 80];
    const tblX    = [10, 48, 116];
    rect(10, cy, W - 20, 7, PURPLE, null, 0);
    tblHeaders.forEach((h, i) => txt(h, tblX[i] + 2, cy + 5, { size: 8, color: WHITE, bold: true }));
    cy += 7;
    const aptDescriptions = {
      'Verbal Ability':         ['Language understanding, expression and communication.',           'Psychology | Law | Journalism | Content | Policy'],
      'Perceptual Speed':       ['Quick visual scanning, comparison and attention to detail.',       'Data Analytics | Cybersecurity | Forensics'],
      'Numerical Ability':      ['Comfort with numbers, data and quantitative reasoning.',           'Finance | Actuarial | Data Science | AI/ML'],
      'Spatial Ability':        ['Visualizing shapes, patterns and space-based relationships.',      'Architecture | UX/UI | Product Design'],
      'Mechanical Ability':     ['Understanding machines, tools and mechanical reasoning.',          'Engineering | Industrial Automation | Mechatronics'],
      'Abstract Reasoning':     ['Pattern recognition, logical thinking and problem solving.',       'Strategy Consulting | Cognitive Science | AI Research'],
      'Legal Studies Ability':  ['Reasoning, argument formation and rule-based thinking.',           'Law | International Relations | Public Policy'],
      'Health & Medical Apt.':  ['Readiness for health, biology and clinical reasoning.',            'Medicine | Biotechnology | Clinical Psychology'],
    };
    const aptRows = aptitude8.slice().sort((a,b) => b.stanine - a.stanine).map(d => {
      const md = aptDescriptions[d.name] || ['-', '-'];
      return [d.name, md[0], md[1]];
    });
    aptRows.forEach((row, ri) => {
      const rowBg = ri % 2 === 0 ? WHITE : LIGHT_GRAY;
      rect(10, cy, W - 20, 12, rowBg, '#E5E7EB', 0);
      row.forEach((cell, ci) => {
        const cL = doc.splitTextToSize(safe(cell), tblColW[ci] - 4);
        txt(cL.slice(0,2).join('\n'), tblX[ci] + 2, cy + 5, { size: 6.5, color: '#374151' });
      });
      cy += 12;
    });

    cy += 2;
    rect(10, cy, W - 20, 10, LIGHT_GRAY, null, 2);
    txt('Note:', 14, cy + 6, { size: 8, color: '#1F2937', bold: true });
    txt('Career options listed are indicative, not exhaustive. Explore additional pathways aligned with aptitude, interests, and academic performance.', 24, cy + 6, { size: 7.5, color: GRAY, maxWidth: W - 40 });
    cy += 12;

    footer(5);

    /* ═══════════════════════════════════════════════
       PAGE 6 - CAREER INTEREST
    ═══════════════════════════════════════════════ */
    doc.addPage();
    sectionHeader('Career Interest Profile', 'Career areas you may be most inclined toward. Primary and emerging interest clusters across career domains - helping explore pathways that connect with your preferences.');
    studentBar(22);
    cy = 34;

    rect(10, cy, W - 20, 7, LIGHT_GRAY, null, 1);
    setFill(PURPLE);       doc.circle(18,  cy + 3.5, 2.5, 'F'); txt('Strong Interest',   22,  cy + 5, { size: 7.5, color: '#1F2937' });
    setFill(PURPLE_LIGHT); doc.circle(56,  cy + 3.5, 2.5, 'F'); txt('Moderate Interest', 60,  cy + 5, { size: 7.5, color: '#1F2937' });
    setFill(PINK);         doc.circle(100, cy + 3.5, 2.5, 'F'); txt('Low Interest',     104, cy + 5, { size: 7.5, color: '#1F2937' });
    cy += 11;

    rect(10, cy, W - 20, 60, '#FAFAFA', '#E5E7EB', 2);
    txt('Career Interest Ranking - Score out of 20 per domain', 14, cy + 6, { size: 8, color: GRAY, bold: true });
    const barX2 = 70, barW2 = W - barX2 - 20;
    careers8.forEach((c, i) => {
      const y2 = cy + 14 + i * 6;
      txt(c.label, 14, y2, { size: 6.5, color: '#1F2937', maxWidth: 53 });
      rect(barX2, y2 - 3.5, barW2, 5, '#E5E7EB', null, 1);
      rect(barX2, y2 - 3.5, (Math.max(0, c.score) / 20) * barW2, 5, cpiColor(c.level), null, 1);
      txt(String(c.score), barX2 + barW2 + 2, y2, { size: 7, color: GRAY, bold: true });
    });
    for (let i = 0; i <= 20; i += 2) {
      const bx = barX2 + (i / 20) * barW2;
      txt(String(i), bx, cy + 62, { size: 5.5, color: GRAY, align: 'center' });
    }
    cy += 67;

    rect(10, cy, W - 20, 14, '#F5F3FF', '#C4B5FD', 2);
    txt('Career Interest Graph:', 14, cy + 6, { size: 8, color: '#1F2937', bold: true });
    txt('Scores in the Career Interest graph represent raw scores (0-20 scale) and reflect the student\'s relative interest levels across assessed career areas where 0-7 indicates Low Interest Area; 8-14 indicates Moderate Interest Area; 15-20 indicates Strong Interest Area.', 14, cy + 11, { size: 7, color: '#374151', maxWidth: W - 28 });
    cy += 20;

    rect(10, cy, W - 20, 10, '#F5F3FF', PURPLE, 2);
    doc.setLineWidth(1.5); setDraw(PURPLE); doc.line(10, cy, 10, cy + 10);
    txt('Scores are indicative and should not be considered final. They reflect the current state at the time of assessment and may change over time.', 15, cy + 6, { size: 7.5, color: '#374151', maxWidth: W - 30 });
    cy += 14;

    // Interest insight (AI) — sits above the cluster table when present.
    if (aiHas('interest_profile')) {
      if (cy + 14 > H - 16) {
        doc.addPage();
        sectionHeader('Interest Insight (AI)', '');
        studentBar(22);
        cy = 34;
      }
      txt('Interest Insight (AI)', 14, cy, { size: 9, color: '#1F2937', bold: true });
      cy += 5;
      cy = drawProse(aiText('interest_profile', ''), cy, {
        size: 7.5, color: '#374151', lineH: 4.2, paraGap: 3,
        maxW: W - 28, x: 14, bottom: H - 14, pageStart: 32,
        onNewPage: function () {
          sectionHeader('Career Interest (continued)', '');
          studentBar(22);
        },
      });
      cy += 3;
    }

    txt('Interest Cluster Summary', 14, cy, { size: 9, color: '#1F2937', bold: true });
    cy += 5;
    const clusterHeaders = ['Cluster', 'Top Domain', 'Interpretation', 'Sample Career Pathways'];
    const cColX = [10, 35, 70, 135];
    const cColW = [25, 35, 65, 65];
    rect(10, cy, W - 20, 7, PURPLE, null, 0);
    clusterHeaders.forEach((h, i) => txt(h, cColX[i] + 2, cy + 5, { size: 8, color: WHITE, bold: true }));
    cy += 7;

    // Keys MUST match CPI_AREAS labels exactly (defined elsewhere in app.js).
    const careerPathwayMap = {
      'Science & Technology':         'Engineering | CS | Research | AI/ML',
      'Health & Medical Science':     'Medicine | Allied Health | Public Health',
      'Language & Communication':     'Journalism | Content | Linguistics | PR',
      'Creative Design & Perf. Arts': 'UX/UI | Animation | Visual Arts | Performing Arts',
      'Legal & Judiciary':            'Law | Policy | Civil Services',
      'Administration & Governance':  'Public Admin | Management | Civil Services',
      'Education & Research':         'Teaching | Academia | Research | EdTech',
      'Business & Entrepreneurship':  'Business | Finance | Startups | Consulting',
      'People & Service':             'Counselling | Social Work | NGO | HR',
      'Sports & Physical Perf.':      'Sports Science | Coaching | Athletics',
    };
    const aiCareerTable = (ai && Array.isArray(ai.career_table)) ? ai.career_table : null;
    const clusters = ['Primary', 'Secondary', 'Exploratory'].map((tag, i) => {
      const item = top3[i] || { label: '-', score: 0 };
      let pathways = careerPathwayMap[item.label] || 'Multiple aligned pathways';
      // Pull from AI career_table when available — prefer matched cluster name,
      // else fall back to positional row.
      if (aiCareerTable) {
        const matched = aiCareerTable.find(r => (r.cluster || '').toLowerCase().includes((item.label || '').split(' ')[0].toLowerCase()))
                        || aiCareerTable[i];
        if (matched) {
          pathways = matched.career || matched.pathways || matched.careers || pathways;
        }
      }
      const interp = i === 0 ? 'Areas you may be most naturally drawn toward based on current interests'
                   : i === 1 ? 'Additional areas that may also align well and offer related pathways'
                             : 'Emerging areas worth exploring through exposure and learning';
      return [tag, item.label, interp, pathways];
    });
    clusters.forEach((row, ri) => {
      const rowBg = ri % 2 === 0 ? WHITE : LIGHT_GRAY;
      rect(10, cy, W - 20, 14, rowBg, '#E5E7EB', 0);
      pill(row[0], cColX[0] + 2, cy + 6, ri === 0 ? PURPLE : ri === 1 ? PURPLE_LIGHT : '#6B7280', WHITE, 20, 6);
      txt(row[1], cColX[1] + 2, cy + 7, { size: 8, color: '#1F2937', bold: true, maxWidth: cColW[1] - 4 });
      const interpL = doc.splitTextToSize(row[2], cColW[2] - 4);
      txt(interpL.slice(0,2).join('\n'), cColX[2] + 2, cy + 6, { size: 7, color: GRAY });
      const pathsL = doc.splitTextToSize(row[3], cColW[3] - 4);
      txt(pathsL.slice(0,2).join('\n'), cColX[3] + 2, cy + 6, { size: 7, color: '#374151' });
      cy += 14;
    });

    // Internal motivators (AI) — short prose block below the cluster table.
    if (aiHas('internal_motivators')) {
      cy += 4;
      if (cy + 14 > H - 16) {
        doc.addPage();
        sectionHeader('What Drives You (AI)', '');
        studentBar(22);
        cy = 34;
      }
      txt('What Drives You (AI)', 14, cy, { size: 9, color: '#1F2937', bold: true });
      cy += 5;
      cy = drawProse(aiText('internal_motivators', ''), cy, {
        size: 7.5, color: '#374151', lineH: 4.2, paraGap: 3,
        maxW: W - 28, x: 14, bottom: H - 14, pageStart: 32,
        onNewPage: function () {
          sectionHeader('Career Interest (continued)', '');
          studentBar(22);
        },
      });
    }

    footer(6);

    /* ═══════════════════════════════════════════════
       PAGE 7 - SEAA PROFILE
    ═══════════════════════════════════════════════ */
    doc.addPage();
    sectionHeader('Social Emotional Academic Adjustment Profile', 'Adjustment and readiness indicators across social, emotional and academic functioning - identifying strengths, developing areas and support needs');
    studentBar(22);
    cy = 34;

    rect(10, cy, W - 20, 7, LIGHT_GRAY, null, 1);
    setFill(PURPLE);       doc.circle(18,  cy + 3.5, 2.5, 'F'); txt('Strong Readiness (A-B)',   22,  cy + 5, { size: 7.5, color: '#1F2937' });
    setFill(PURPLE_LIGHT); doc.circle(68,  cy + 3.5, 2.5, 'F'); txt('Developing Readiness (C)', 72,  cy + 5, { size: 7.5, color: '#1F2937' });
    setFill(PINK);         doc.circle(118, cy + 3.5, 2.5, 'F'); txt('Support Needed (D-E)',    122, cy + 5, { size: 7.5, color: '#1F2937' });
    cy += 10;

    txt('SEAA Domain Scores - Problem Score out of 20 (Lower = Better)', 14, cy + 3, { size: 8, color: GRAY, bold: true });
    cy += 6;

    const seaDescs = [
      'Assesses peer relationships, social confidence, and ability to interact and collaborate effectively.',
      'Evaluates emotional awareness, regulation, resilience, and overall mental well-being.',
      'Measures study habits, focus, motivation, and the ability to manage academic responsibilities.',
    ];
    seaCards.forEach((c, i) => {
      const px = 10 + i * 66;
      rect(px, cy, 62, 42, '#FAFAFA', c.color, 2);
      txt(c.title, px + 4, cy + 7, { size: 7.5, color: c.color, bold: true });
      const dl = doc.splitTextToSize(seaDescs[i], 54);
      txt(dl.join('\n'), px + 4, cy + 13, { size: 5.5, color: GRAY });
      // Gauge arc (semicircle meter) — drawn with line segments
      const cx2 = px + 31, arcY = cy + 32, r = 12;
      // Background arc (grey)
      doc.setDrawColor(220, 220, 220); doc.setLineWidth(2.5);
      for (let a = 180; a <= 360; a += 5) {
        const rad1 = (a * Math.PI) / 180, rad2 = ((a + 5) * Math.PI) / 180;
        doc.line(cx2 + r * Math.cos(rad1), arcY + r * Math.sin(rad1),
                 cx2 + r * Math.cos(rad2), arcY + r * Math.sin(rad2));
      }
      // Filled arc proportional to score (score out of 20, lower = better → invert)
      const fillPct = 1 - (c.score / 20);
      const fillDeg = Math.round(fillPct * 180);
      const [fr, fg, fb] = hex2rgb(c.color);
      doc.setDrawColor(fr, fg, fb); doc.setLineWidth(2.5);
      for (let a = 180; a <= 180 + fillDeg; a += 5) {
        const rad1 = (a * Math.PI) / 180, rad2 = ((a + 5) * Math.PI) / 180;
        doc.line(cx2 + r * Math.cos(rad1), arcY + r * Math.sin(rad1),
                 cx2 + r * Math.cos(rad2), arcY + r * Math.sin(rad2));
      }
      doc.setLineWidth(0.3);
      txt(c.score + '/20', cx2, arcY + 3, { size: 7, color: c.color, bold: true, align: 'center' });
      txt(c.label,         cx2, arcY + 8, { size: 5.5, color: c.color, align: 'center' });
    });
    cy += 48;

    rect(10, cy, W - 20, 10, LIGHT_GRAY, null, 2);
    txt('Scores are based on a 20-point scale per domain. Lower scores reflect stronger adjustment and readiness.', 14, cy + 6, { size: 7.5, color: GRAY, maxWidth: W - 28 });
    cy += 14;

    txt('Adjustment Snapshot', 14, cy, { size: 10, color: '#1F2937', bold: true });
    txt('A quick view of your current zone, key strengths and focus areas.', 14, cy + 5, { size: 8, color: GRAY });
    cy += 10;

    const seaSnapshot = [
      { strengthsByLabel: { 'Strong Readiness':['Builds positive peer relationships','Comfortable in group settings'], 'Developing Readiness':['Adapts well in peer settings','Maintains basic interactions'], 'Support Needed':['Shows readiness to engage','Open to building peer connections'] },
        focusByLabel:     { 'Strong Readiness':['Lead group activities','Mentor others'],                                   'Developing Readiness':['Build self-confidence','Manage peer influence'],            'Support Needed':['Build social confidence','Strengthen peer relationships'] } },
      { strengthsByLabel: { 'Strong Readiness':['Manages emotions effectively','Handles stress with composure'],            'Developing Readiness':['Demonstrates emotional awareness','Able to express feelings'], 'Support Needed':['Aware of emotional patterns','Open to emotional support'] },
        focusByLabel:     { 'Strong Readiness':['Sustain wellbeing routines','Help peers regulate'],                        'Developing Readiness':['Strengthen regulation','Reduce stress and worry'],          'Support Needed':['Build emotional regulation','Reduce stress and anxiety'] } },
      { strengthsByLabel: { 'Strong Readiness':['Strong study habits','Engaged learner'],                                   'Developing Readiness':['Willingness to learn','Engages in assigned tasks'],          'Support Needed':['Capable when supported','Open to learning strategies'] },
        focusByLabel:     { 'Strong Readiness':['Stretch learning goals','Take on independent projects'],                   'Developing Readiness':['Improve consistency','Time management'],                    'Support Needed':['Build study consistency','Develop focus & motivation'] } },
    ];
    seaSnapshot.forEach((s, i) => {
      const c = seaCards[i];
      const px = 10 + i * 66;
      const bgByLabel = c.label === 'Strong Readiness' ? '#F0FDF4' : c.label === 'Developing Readiness' ? '#F5F3FF' : '#FFF1F2';
      rect(px, cy, 62, 38, bgByLabel, c.color, 2);
      txt(c.title, px + 4, cy + 7, { size: 7.5, color: c.color, bold: true });
      pill(c.label, px + 4, cy + 13, c.color, WHITE, 54, 6);
      txt('Strengths', px + 4, cy + 20, { size: 7, color: '#1F2937', bold: true });
      (s.strengthsByLabel[c.label] || []).slice(0, 2).forEach((it, si) => txt('- ' + it, px + 4, cy + 24 + si * 4, { size: 6.5, color: GRAY }));
      line(px + 4, cy + 29, px + 58, cy + 29, '#E5E7EB', 0.2);
      txt('Focus Areas', px + 4, cy + 32, { size: 7, color: '#1F2937', bold: true });
      (s.focusByLabel[c.label] || []).slice(0, 2).forEach((it, fi) => txt('- ' + it, px + 4, cy + 36 + fi * 4, { size: 6.5, color: GRAY }));
    });
    cy += 43;

    txt('Dimension Summary', 14, cy, { size: 9, color: '#1F2937', bold: true });
    cy += 5;
    const dimHeaders = ['Dimension', 'Status', 'Interpretation'];
    const dimColX = [10, 65, 110];
    rect(10, cy, W - 20, 7, PURPLE, null, 0);
    dimHeaders.forEach((h, i) => txt(h, dimColX[i] + 2, cy + 5, { size: 8, color: WHITE, bold: true }));
    cy += 7;
    const interpByLabel = {
      'Strong Readiness':     'Strong adjustment with consistent positive functioning. Continue practices that sustain wellbeing.',
      'Developing Readiness': 'Emerging readiness; targeted strategies and consistent practice will strengthen this area.',
      'Support Needed':       'Higher concern - structured support and guidance are recommended to build readiness.',
    };
    seaCards.forEach((c, ri) => {
      rect(10, cy, W - 20, 14, ri % 2 === 0 ? WHITE : LIGHT_GRAY, '#E5E7EB', 0);
      txt(c.title, dimColX[0] + 2, cy + 7, { size: 8, color: '#1F2937' });
      pill(c.label, dimColX[1] + 2, cy + 7, c.color, WHITE, 42, 6);
      const interpL = doc.splitTextToSize(interpByLabel[c.label] || '-', 88);
      txt(interpL.slice(0,2).join('\n'), dimColX[2] + 2, cy + 5, { size: 6.5, color: GRAY });
      cy += 14;
    });
    cy += 4;

    if (aiHas('wellbeing_guidance')) {
      if (cy + 14 > H - 16) {
        doc.addPage();
        sectionHeader('Wellbeing Guidance (AI)', '');
        studentBar(22);
        cy = 34;
      }
      txt('Wellbeing Guidance (AI)', 14, cy, { size: 9, color: '#1F2937', bold: true });
      cy += 5;
      cy = drawProse(aiText('wellbeing_guidance', ''), cy, {
        size: 7.5, color: '#374151', lineH: 4.2, paraGap: 3,
        maxW: W - 28, x: 14, bottom: H - 14, pageStart: 32,
        onNewPage: function () {
          sectionHeader('SEAA Profile (continued)', '');
          studentBar(22);
        },
      });
    } else {
      txt('Growth Support Pathway', 14, cy, { size: 9, color: '#1F2937', bold: true });
      cy += 5;
      const gspItems = [
        { step: 'Awareness', desc: 'Develop understanding of current strengths and growth areas.' },
        { step: 'Action',    desc: 'Practice routines and strategies that support improvement.'   },
        { step: 'Support',   desc: 'Use guidance and resources to sustain progress.'              },
      ];
      gspItems.forEach((g, i) => {
        const px = 10 + i * 66;
        rect(px, cy, 62, 18, LIGHT_GRAY, '#D1D5DB', 2);
        txt(g.step, px + 4, cy + 7, { size: 8.5, color: PURPLE, bold: true });
        const dl = doc.splitTextToSize(g.desc, 54);
        txt(dl.join('\n'), px + 4, cy + 13, { size: 7, color: GRAY });
      });
      cy += 22;

      rect(10, cy, W - 20, 8, LIGHT_GRAY, null, 2);
      txt('Consistent support, positive reinforcement, and collaboration help students grow with confidence.', 14, cy + 5, { size: 7.5, color: GRAY });
      cy += 12;
    }

    rect(10, cy, W - 20, 10, '#F5F3FF', PURPLE, 2);
    doc.setLineWidth(1.5); setDraw(PURPLE); doc.line(10, cy, 10, cy + 10);
    txt('These results provide a snapshot for guidance purposes only. They reflect the current state at the time of assessment and may evolve over time.', 15, cy + 6, { size: 7.5, color: '#374151', maxWidth: W - 32 });

    footer(7);

    /* ═══════════════════════════════════════════════
       PAGES 8-9 - GAP ANALYSIS
    ═══════════════════════════════════════════════ */
    const findApt  = (name) => aptitude8.find(a => a.name === name) || { name: name, stanine: 5 };
    const findPers = (name) => personality9.find(p => p.name === name) || { name: name, stanine: 5 };
    const seaToReadiness9 = (key) => {
      const ps = sea.domScores[key] || 10;
      return Math.max(1, Math.min(9, Math.round(9 - (ps / 20) * 8)));
    };

    // Maps canonical CPI cluster label → most relevant aptitude / personality
    // / SEAA dimension to highlight on the gap analysis chart.
    // Keys MUST match CPI_AREAS labels exactly.
    const pathwayMappings = {
      'Science & Technology':         { apt:'Numerical Ability',     pers:'Curiosity & Learning',    sea:'A' },
      'Health & Medical Science':     { apt:'Health & Medical Apt.', pers:'Patience & Resilience',   sea:'E' },
      'Language & Communication':     { apt:'Verbal Ability',        pers:'Curiosity & Learning',    sea:'S' },
      'Creative Design & Perf. Arts': { apt:'Spatial Ability',       pers:'Creativity & Innovation', sea:'E' },
      'Legal & Judiciary':            { apt:'Legal Studies Ability', pers:'Ethical Awareness',       sea:'A' },
      'Administration & Governance':  { apt:'Abstract Reasoning',    pers:'Leadership & Motivation', sea:'A' },
      'Education & Research':         { apt:'Verbal Ability',        pers:'Discipline & Sincerity',  sea:'A' },
      'Business & Entrepreneurship':  { apt:'Numerical Ability',     pers:'Leadership & Motivation', sea:'A' },
      'People & Service':             { apt:'Verbal Ability',        pers:'Ethical Awareness',       sea:'S' },
      'Sports & Physical Perf.':      { apt:'Mechanical Ability',    pers:'Discipline & Sincerity',  sea:'A' },
    };
    const pathwayDefaults = { apt:'Verbal Ability', pers:'Discipline & Sincerity', sea:'A' };

    const top4Pathways = (cpiAll.slice(0, 4).length === 4 ? cpiAll.slice(0, 4) : top3.concat(cpiAll).slice(0, 4));
    const pathwayGaps = top4Pathways.map((p, idx) => {
      const m = pathwayMappings[p.label] || pathwayDefaults;
      const aptD = findApt(m.apt); const persD = findPers(m.pers);
      const seaR = seaToReadiness9(m.sea);
      const seaName = m.sea === 'S' ? 'Social Readiness' : m.sea === 'E' ? 'Emotional Readiness' : 'Academic Readiness';
      return {
        title: 'Pathway ' + (idx + 1) + ' - ' + p.label,
        factors: [
          ['Aptitude Factor',    m.apt,   aptD.stanine,  7],
          ['Personality Factor', m.pers,  persD.stanine, 7],
          ['SEAA Factor',        seaName, seaR,          6],
        ],
      };
    });

    const drawPathwayGap = (pg, startY) => {
      rect(10, startY, W - 20, 8, PURPLE, null, 2);
      txt(pg.title, 14, startY + 6, { size: 9, color: WHITE, bold: true, maxWidth: W - 28 });
      let gy = startY + 12;
      pg.factors.forEach((f) => {
        const fType = f[0], fLabel = f[1], current = f[2], required = f[3];
        txt(fType, 14, gy, { size: 7.5, color: GRAY, bold: true });
        txt(fLabel, 14, gy + 5, { size: 8, color: '#1F2937' });
        const barX3 = 14, barW3 = W - 28;
        txt('Your Current Level', barX3, gy + 10, { size: 6.5, color: PURPLE });
        rect(barX3, gy + 11, barW3, 4, '#E5E7EB', null, 1);
        rect(barX3, gy + 11, (current / 9) * barW3, 4, PURPLE, null, 1);
        txt(current + '/9', barX3 + (current / 9) * barW3 + 1, gy + 14, { size: 6, color: PURPLE });
        txt('Typically Required', barX3, gy + 18, { size: 6.5, color: GRAY });
        rect(barX3, gy + 19, barW3, 4, '#E5E7EB', null, 1);
        rect(barX3, gy + 19, (required / 9) * barW3, 4, '#9CA3AF', null, 1);
        txt(required + '/9', barX3 + (required / 9) * barW3 + 1, gy + 22, { size: 6, color: GRAY });
        gy += 28;
      });
      return gy + 4;
    };

    doc.addPage();
    sectionHeader('Gap Analysis', 'Adjustment and readiness indicators across social, emotional and academic functioning - identifying strengths, developing areas and support needs');
    studentBar(22);
    cy = 34;
    const gapNote = 'For each recommended pathway, 3 key parameters are compared: 1 Aptitude factor, 1 Personality factor, and 1 SEAA readiness factor. Purple bars show your current level. Grey bars show the level typically required for that pathway.';
    const gnL = doc.splitTextToSize(gapNote, W - 28);
    txt(gnL.join('\n'), 14, cy + 4, { size: 8, color: '#374151' });
    cy += gnL.length * 5 + 4;
    cy = drawPathwayGap(pathwayGaps[0] || { title:'Pathway 1', factors:[] }, cy);
    cy = drawPathwayGap(pathwayGaps[1] || { title:'Pathway 2', factors:[] }, cy);
    footer(8);

    doc.addPage();
    sectionHeader('Gap Analysis', 'Adjustment and readiness indicators across social, emotional and academic functioning - identifying strengths, developing areas and support needs');
    studentBar(22);
    cy = 34;
    cy = drawPathwayGap(pathwayGaps[2] || { title:'Pathway 3', factors:[] }, cy);
    cy = drawPathwayGap(pathwayGaps[3] || { title:'Pathway 4', factors:[] }, cy);
    footer(9);

    /* ═══════════════════════════════════════════════
       PAGE 10 - INTEGRATED CAREER FIT MATRIX
    ═══════════════════════════════════════════════ */
    doc.addPage();
    sectionHeader('Integrated Career Fit Matrix', 'A combined view of career pathways across all four domains');
    studentBar(22);
    cy = 30;

    const matrixNote = 'This matrix combines your Interest, Aptitude, Personality and Wellbeing readiness to calculate an overall alignment level for each career cluster. Strong = well aligned across all domains. Emerging = developing alignment. Exploratory = worth exploring with more exposure.';
    const mnL = doc.splitTextToSize(matrixNote, W - 28);
    txt(mnL.join('\n'), 14, cy + 4, { size: 8, color: '#374151' });
    cy += mnL.length * 5 + 4;

    const lvlFromStanine  = (s)  => s >= 7 ? 'High' : s >= 4 ? 'Moderate' : 'Low';
    const lvlFromInterest = (sc) => sc >= 15 ? 'High' : sc >= 8 ? 'Moderate' : 'Low';

    // Source 1: AI career_table (preferred — real career names, fit ratings,
    // and a numeric suitability_pct).
    // Source 2: score-driven cluster matrix (fallback when no AI report).
    const aiTable10 = (ai && Array.isArray(ai.career_table) && ai.career_table.length) ? ai.career_table.slice(0, 6) : null;

    let matrixRowsLive;
    if (aiTable10) {
      // AI rows already carry career, cluster, interest_fit, aptitude_fit,
      // personality_fit, suitability_pct, rationale.
      matrixRowsLive = aiTable10.map((r) => {
        const cap = (s) => {
          const v = String(s || '').trim();
          if (!v) return 'Moderate';
          const lower = v.toLowerCase();
          if (lower === 'high' || lower === 'h') return 'High';
          if (lower === 'low'  || lower === 'l') return 'Low';
          return 'Moderate';
        };
        const interest = cap(r.interest_fit);
        const aptL     = cap(r.aptitude_fit);
        const persL    = cap(r.personality_fit);
        // SEAA fit isn't in the AI schema — use the student's OVERALL SEAA
        // readiness (average across S/E/A) so every row reflects the actual
        // wellbeing profile, not an arbitrary single dimension.
        const seaR = Math.round((seaToReadiness9('S') + seaToReadiness9('E') + seaToReadiness9('A')) / 3);
        const seaL = lvlFromStanine(seaR);
        const pct  = (typeof r.suitability_pct === 'number') ? Math.round(r.suitability_pct)
                   : (parseFloat(r.suitability_pct) || 0);
        const align = pct >= 80 ? 'Strong Fit' : pct >= 65 ? 'Emerging Fit' : 'Exploratory';
        const careerName = r.career || r.cluster || '-';
        return [careerName, interest, aptL, persL, seaL, align, pct, r.cluster || '', r.rationale || ''];
      });
    } else {
      const top6 = cpiAll.slice(0, 6);
      matrixRowsLive = top6.map((p) => {
        const m = pathwayMappings[p.label] || pathwayDefaults;
        const aptStn  = findApt(m.apt).stanine;
        const persStn = findPers(m.pers).stanine;
        // Same overall-SEAA approach for the score-driven fallback.
        const seaR    = Math.round((seaToReadiness9('S') + seaToReadiness9('E') + seaToReadiness9('A')) / 3);
        const interest = lvlFromInterest(p.score);
        const aptL     = lvlFromStanine(aptStn);
        const persL    = lvlFromStanine(persStn);
        const seaL     = lvlFromStanine(seaR);
        const sc = (interest === 'High' ? 3 : interest === 'Moderate' ? 2 : 1) +
                   (aptL     === 'High' ? 3 : aptL     === 'Moderate' ? 2 : 1) +
                   (persL    === 'High' ? 3 : persL    === 'Moderate' ? 2 : 1) +
                   (seaL     === 'High' ? 2 : seaL     === 'Moderate' ? 1 : 0);
        const align = sc >= 9 ? 'Strong Fit' : sc >= 6 ? 'Emerging Fit' : 'Exploratory';
        const pct = Math.round((sc / 11) * 100);
        return [p.label, interest, aptL, persL, seaL, align, pct, '', ''];
      });
    }

    const mHeaders = ['Career Cluster', 'Interest', 'Aptitude', 'Personality', 'SEAA', 'Alignment Level'];
    const mColX = [10, 62, 88, 114, 140, 158];
    const mColW = [52, 26, 26, 26, 18, 42];
    rect(10, cy, W - 20, 7, PURPLE, null, 0);
    mHeaders.forEach((h, i) => txt(h, mColX[i] + 2, cy + 5, { size: 7.5, color: WHITE, bold: true }));
    cy += 7;

    matrixRowsLive.forEach((row, ri) => {
      rect(10, cy, W - 20, 10, ri % 2 === 0 ? WHITE : LIGHT_GRAY, '#E5E7EB', 0);
      txt(row[0], mColX[0] + 2, cy + 7, { size: 7.5, color: '#1F2937', maxWidth: mColW[0] - 4 });
      const levelColors = { High: GREEN, Moderate: '#3B82F6', Low: PINK };
      [1, 2, 3, 4].forEach((ci) => pill(row[ci], mColX[ci] + 1, cy + 7, levelColors[row[ci]] || GRAY, WHITE, mColW[ci] - 4, 6));
      // Last column shows coloured dot + alignment label (matches template)
      const alignLabel = row[5]; // 'Strong Fit', 'Emerging Fit', 'Exploratory'
      const dotColor = alignLabel.indexOf('Strong') >= 0 ? PURPLE : alignLabel.indexOf('Emerging') >= 0 ? PURPLE_LIGHT : GRAY;
      const dotX = mColX[5] + 3, dotY = cy + 6.5;
      setFill(dotColor); doc.circle(dotX, dotY, 2, 'F');
      txt(alignLabel, dotX + 4, cy + 7, { size: 7, color: dotColor, bold: true, maxWidth: mColW[5] - 8 });
      cy += 10;
    });
    cy += 4;

    const strongFits   = matrixRowsLive.filter(r => r[5].indexOf('Strong') >= 0).map(r => r[0]);
    const emergingFits = matrixRowsLive.filter(r => r[5].indexOf('Emerging') >= 0).map(r => r[0]);
    const exploratory  = matrixRowsLive.filter(r => r[5].indexOf('Exploratory') >= 0).map(r => r[0]);
    const fitBoxes = [
      { title:'Strong Fit Pathways',    color: PURPLE,       bg:'#F5F3FF', items: strongFits   },
      { title:'Emerging Fit Pathways',  color: PURPLE_LIGHT, bg:'#EDE9FE', items: emergingFits },
      { title:'Exploratory Pathways',   color: GRAY,         bg: LIGHT_GRAY, items: exploratory },
    ];
    fitBoxes.forEach((fb, i) => {
      const px = 10 + i * 66;
      rect(px, cy, 62, 18, fb.bg, fb.color, 2);
      txt(fb.title, px + 4, cy + 7, { size: 8, color: fb.color, bold: true });
      const items = fb.items.length ? fb.items : ['-'];
      items.slice(0, 2).forEach((it, k) => txt(it, px + 4, cy + 12 + k * 4, { size: 7, color: '#374151', maxWidth: 56 }));
    });
    cy += 22;

    // Stream advice — AI's narrative recommendation for stream / exams /
    // degrees. Falls back to the score-derived 3-card subject pathway
    // recommendation when no AI report is present.
    if (aiHas('stream_advice')) {
      if (cy + 14 > H - 36) {
        doc.addPage();
        sectionHeader('Stream & Pathway Advice (AI)', '');
        studentBar(22);
        cy = 34;
      }
      txt('STREAM & PATHWAY ADVICE (AI)', 14, cy, { size: 9, color: '#1F2937', bold: true });
      cy += 5;
      cy = drawProse(aiText('stream_advice', ''), cy, {
        size: 7.5, color: '#374151', lineH: 4.2, paraGap: 3,
        maxW: W - 28, x: 14, bottom: H - 36, pageStart: 32,
        onNewPage: function () {
          sectionHeader('Stream & Pathway Advice (continued)', '');
          studentBar(22);
        },
      });
    } else {
      txt('RECOMMENDED SUBJECT PATHWAYS', 14, cy, { size: 9, color: '#1F2937', bold: true });
      cy += 5;
      const subjectMap = {
        'Science & Technology':         'PCM + Computer Science',
        'Health & Medical Science':     'PCB + Psychology',
        'Language & Communication':     'Languages + Media Studies',
        'Creative Design & Perf. Arts': 'Arts + Design + Performing Arts',
        'Legal & Judiciary':            'Humanities + Political Science',
        'Administration & Governance':  'Humanities + Economics + Pol. Science',
        'Education & Research':         'Humanities + Subject Specialisation',
        'Business & Entrepreneurship':  'Mathematics + Economics + Business',
        'People & Service':             'Humanities + Psychology + Sociology',
        'Sports & Physical Perf.':      'PE + Biology + Psychology',
      };
      const recPrimary = (strongFits[0] || emergingFits[0] || (top3[0] && top3[0].label) || 'Multidisciplinary');
      const recAlt     = (strongFits[1] || emergingFits[0] || (top3[1] && top3[1].label) || 'Multidisciplinary');
      const recExpl    = (exploratory[0] || (top3[2] && top3[2].label) || 'Multidisciplinary');
      const pathways = [
        { num:'01', fit:'Strong Fit',      type:'(Primary Pathway)',  subject: subjectMap[recPrimary] || 'Multidisciplinary stream', desc:'Highest alignment with your assessed strengths and top fit pathway: ' + recPrimary + '.', color: PURPLE },
        { num:'02', fit:'Alternate Fit',   type:'(Related Pathway)',  subject: subjectMap[recAlt]     || 'Multidisciplinary stream', desc:'Supports related pathways such as ' + recAlt + ' while keeping options open.',          color: PURPLE_LIGHT },
        { num:'03', fit:'Exploratory Fit', type:'(Flexible Pathway)', subject: subjectMap[recExpl]    || 'Humanities + Psychology',   desc:'Maintains broader options for exploration via ' + recExpl + '.',                       color: GRAY },
      ];
      pathways.forEach((p) => {
        rect(10, cy, W - 20, 18, '#FAFAFA', p.color, 2);
        setFill(p.color); doc.roundedRect(10, cy, 16, 18, 2, 2, 'F');
        txt(p.num, 18, cy + 10, { size: 10, color: WHITE, bold: true, align: 'center' });
        txt(p.fit, 30, cy + 7, { size: 9, color: p.color, bold: true });
        txt(p.type, 30, cy + 12, { size: 7.5, color: GRAY });
        txt(p.subject, 30, cy + 16, { size: 8, color: '#1F2937', bold: true, maxWidth: 80 });
        const dL = doc.splitTextToSize(p.desc, 90);
        txt(dL.slice(0,2).join('\n'), 118, cy + 7, { size: 7.5, color: GRAY });
        cy += 22;
      });
    }

    if (cy < H - 30) {
      cy += 2;
      txt('Tips to Strengthen Aptitude', 14, cy, { size: 8.5, color: '#1F2937', bold: true });
      cy += 5;
      const tips = [
        'Solve reasoning, analytical, and aptitude based questions regularly to strengthen core thinking skills.',
        'Practice mental math, data interpretation, and problem solving for speed and accuracy.',
        'Read widely to improve comprehension, critical thinking, and verbal reasoning.',
        'Engage in strategy based activities such as chess, coding, debates, or Olympiad style challenges.',
        'Break down complex problems into smaller steps to improve structured thinking.',
        'Use timed practice to enhance decision making under pressure.',
        'Strengthen weak aptitude areas through consistent targeted practice and feedback.',
        'Apply aptitude skills in real contexts - projects, experiments, research, and case studies.',
        'Develop curiosity by asking why, how, and exploring multiple solutions.',
        'Build a growth mindset - aptitudes can improve significantly through effort and exposure.',
      ];
      tips.forEach((tip, i) => {
        if (cy + 5 > H - 30) { doc.addPage(); sectionHeader('Tips & Wellbeing', ''); studentBar(22); cy = 34; }
        txt((i + 1) + '. ' + tip, 14, cy, { size: 7, color: '#374151', maxWidth: W - 28 });
        cy += 5;
      });
      cy += 3;
    }

    if (cy + 10 > H - 30) { doc.addPage(); sectionHeader('Fostering Wellbeing', ''); studentBar(22); cy = 34; }
    txt('Fostering Healthy Personality Development & Emotional Wellbeing', 14, cy, { size: 8.5, color: '#1F2937', bold: true });
    cy += 5;
    const wellbeingTips = [
      'Build self-awareness by reflecting on strengths, behaviours, and growth areas.',
      'Develop confidence through initiative-taking and ownership of responsibilities.',
      'Strengthen discipline through routines, time management, and goal setting.',
      'Practice adaptability by staying open to feedback, change, and new experiences.',
      'Develop emotional regulation by responding thoughtfully rather than reacting impulsively.',
      'Build resilience by learning from setbacks and persisting through challenges.',
      'Strengthen communication, empathy, and collaboration in relationships and teamwork.',
      'Cultivate healthy habits for stress management, balance, and overall wellbeing.',
      'Practice ethical decision making, responsibility, and integrity in everyday choices.',
      'Seek mentorship, support, and constructive guidance when navigating challenges.',
    ];
    wellbeingTips.forEach((tip, i) => {
      if (cy + 5 > H - 30) { doc.addPage(); sectionHeader('Fostering Wellbeing (continued)', ''); studentBar(22); cy = 34; }
      txt((i + 1) + '. ' + tip, 14, cy, { size: 7, color: '#374151', maxWidth: W - 28 });
      cy += 5;
    });
    cy += 3;

    rect(10, cy, W - 20, 8, LIGHT_GRAY, null, 2);
    txt('NOTE: These areas are developmental and can be strengthened over time through consistent practice, support, and effort.', 14, cy + 5, { size: 6.5, color: GRAY, maxWidth: W - 28 });
    cy += 12;

    if (cy + 16 > H - 16) { doc.addPage(); sectionHeader('Remarks & Disclaimer', ''); studentBar(22); cy = 34; }
    const cr = 'Dear Students, Please note that final academic and career decisions should be made by considering aptitude, interests, and academic performance together. This report is intended to serve as a guidance tool and should be used alongside discussions with parents, teachers, and counselors to support well-informed decision making.';
    const crL = doc.splitTextToSize(cr, W - 28);
    const crH = 10 + crL.length * 4.5;
    rect(10, cy, W - 20, crH, '#F5F3FF', '#C4B5FD', 2);
    txt("Counselor's Remarks", 14, cy + 6, { size: 8, color: PURPLE, bold: true });
    crL.forEach((ln, i) => txt(ln, 14, cy + 11 + i * 4.5, { size: 7, color: '#374151' }));
    cy += crH + 4;

    if (cy + 14 > H - 16) { doc.addPage(); sectionHeader('Disclaimer', ''); studentBar(22); cy = 34; }
    const disc = 'This NuMind MAPS Report presents indicative insights derived from standardized assessments to support self-awareness, exploration, and informed decision-making. Recommendations are illustrative, not prescriptive, and should be interpreted alongside academic performance, evolving interests, and guidance from parents, teachers, or qualified counselors. Final academic and career decisions should not be made solely on the basis of this report.';
    const discL = doc.splitTextToSize(disc, W - 28);
    const discH = 10 + discL.length * 4.5;
    rect(10, cy, W - 20, discH, LIGHT_GRAY, null, 2);
    txt('Disclaimer', 14, cy + 6, { size: 8, color: '#1F2937', bold: true });
    discL.forEach((ln, i) => txt(ln, 14, cy + 11 + i * 4.5, { size: 6.5, color: GRAY }));

    footer(10);

    // ── Stamp footers on every page using actual page indices ──
    // Done once at the end so AI prose overflow can't desync page numbers.
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      const fy = H - 8;
      line(10, fy - 3, W - 10, fy - 3, '#E5E7EB', 0.2);
      txt('numind.co.in | Confidential - For personal guidance only', 14, fy, { size: 7, color: GRAY });
      txt('Page ' + p + ' of ' + totalPages, W - 14, fy, { size: 7, color: GRAY, align: 'right' });
    }

    // SAVE
    const fname = 'NuMind_MAPS_' + safe(studentName).replace(/\s+/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.pdf';
    doc.save(fname);

  } catch (err) {
    console.error('[downloadPDF] failed:', err);
    alert('PDF generation failed: ' + (err.message || err));
  } finally {
    if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
  }
}


export { downloadPDF };
