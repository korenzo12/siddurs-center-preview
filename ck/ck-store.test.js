/* ck-store.js · מרכז הסידורים · CK Digital 360
   עמוד מוצר, סטודיו הקדשה, מגירת סל, חיפוש ומילוי ההקדשה בקופה, 1:1 מהקונספט (concept/site.html),
   על נתונים חיים מ-WooCommerce Store API. נבנה מ-ck-store.src.js + קבועים מהקונספט (build.py). */
(function () {
  'use strict';
  if (window.__ckStore) return; window.__ckStore = 1;

  /* ---------- הגדרות ---------- */
  const CFG = Object.assign({
    api: '/wp-json/wc/store/v1',
    dedProduct: { one: 17303, names: 17304 },   // מזהי מוצרי ההקדשה (₪130, ₪10 לספר). 0 = רק הערה להזמנה
    free: 350,
    wa: '972526845740',
    cartUrl: '/cart/', checkoutUrl: '/checkout/', trackUrl: '/track-order/'
  }, window.CK_STORE || {});

  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '₪' + (Number.isInteger(n) ? n.toLocaleString('he-IL') : n.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const decode = s => { const t = document.createElement('textarea'); t.innerHTML = s || ''; return t.value; };
  const priceOf = pr => pr ? Number(pr) / Math.pow(10, 2) : 0;

  const P = {
    search: '<circle pathLength="1" cx="10.5" cy="10.5" r="6.5"/><path pathLength="1" d="m15.4 15.4 4.6 4.6"/><path pathLength="1" d="M7.6 9.2a3.3 3.3 0 0 1 2.3-2"/>',
    bag: '<path pathLength="1" d="M5.4 8.6h13.2l-1 10.9a1.6 1.6 0 0 1-1.6 1.4H8a1.6 1.6 0 0 1-1.6-1.4Z"/><path pathLength="1" d="M9 8.6V7.2a3 3 0 0 1 6 0v1.4"/><path pathLength="1" d="M9.2 12.2c.6 1.3 1.6 2 2.8 2s2.2-.7 2.8-2"/>',
    user: '<circle pathLength="1" cx="12" cy="8.3" r="3.6"/><path pathLength="1" d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0"/>',
    tg: '<path pathLength="1" d="M20.4 4.3 3.9 10.6c-.9.4-.9 1.6.1 1.9l4.1 1.3 1.6 5c.3.8 1.3 1 1.9.4l2.3-2.2 4.2 3.1c.7.5 1.7.1 1.9-.8l2.6-13.4c.2-1-.8-1.9-1.7-1.6Z"/><path pathLength="1" d="m8.1 13.8 9.3-6.1-6.6 7.5"/>',
    wa: '<path pathLength="1" d="M12 3.6a8.4 8.4 0 0 0-7.3 12.6l-1.1 4.2 4.3-1.1A8.4 8.4 0 1 0 12 3.6Z"/><path pathLength="1" d="M9.3 8.4c.3-.4.7-.4 1-.1l.9 1.4c.2.3.1.6-.1.8l-.5.5a5.4 5.4 0 0 0 2.6 2.6l.5-.5c.2-.2.5-.3.8-.1l1.4.9c.3.2.3.7-.1 1-.6.6-1.5.9-2.4.6a8 8 0 0 1-4.6-4.6c-.3-.9 0-1.8.5-2.5Z"/>',
    phone: '<path pathLength="1" d="M6.6 3.8h2.6l1.4 3.8-1.9 1.3a10.6 10.6 0 0 0 5.6 5.6l1.3-1.9 3.8 1.4v2.6a1.9 1.9 0 0 1-2 1.9A15.4 15.4 0 0 1 4.7 5.8a1.9 1.9 0 0 1 1.9-2Z"/>',
    mail: '<rect pathLength="1" x="3.5" y="5.5" width="17" height="13" rx="2"/><path pathLength="1" d="m4 7 8 6 8-6"/>',
    pin: '<path pathLength="1" d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle pathLength="1" cx="12" cy="10" r="2.3"/>',
    truck: '<path pathLength="1" d="M2.8 6.8h11v9.4h-11Z"/><path pathLength="1" d="M13.8 9.8h3.9l3 3.3v3.1h-6.9"/><circle pathLength="1" cx="7" cy="17.4" r="1.7"/><circle pathLength="1" cx="17" cy="17.4" r="1.7"/><path pathLength="1" d="M5.5 10h4"/>',
    quill: '<path pathLength="1" d="M19.8 4.2C13.6 4.6 9 9 7.6 15.6"/><path pathLength="1" d="M19.8 4.2c.5 5.6-3.6 10.1-9.8 11.2"/><path pathLength="1" d="M13.2 9.6 9.4 13"/><path pathLength="1" d="M7.6 15.6 5 19.6"/><path pathLength="1" d="M4.2 20.6h8.6"/>',
    nusach: '<path pathLength="1" d="M12 6.6c-2.1-1.6-4.8-2-7.6-1.6v12.7c2.8-.4 5.5 0 7.6 1.6 2.1-1.6 4.8-2 7.6-1.6V5c-2.8-.4-5.5 0-7.6 1.6Z"/><path pathLength="1" d="M12 6.6v12.7"/><path pathLength="1" d="M15.5 4.6v5.2l1.4-1 1.4 1V5"/>',
    shield: '<path pathLength="1" d="M12 3.4 5.2 6v5.4c0 4.3 2.9 7.8 6.8 9.2 3.9-1.4 6.8-4.9 6.8-9.2V6Z"/><path pathLength="1" d="m9.2 12 2 2 3.7-3.8"/>',
    star: '<path d="m12 3.6 2.5 5.3 5.7.7-4.2 4 1.1 5.7L12 16.5l-5.1 2.8 1.1-5.7-4.2-4 5.7-.7Z"/>',
    access: '<circle pathLength="1" cx="12" cy="4.9" r="1.7"/><path pathLength="1" d="M4.8 8.4c2.4.8 4.8 1.2 7.2 1.2s4.8-.4 7.2-1.2"/><path pathLength="1" d="M12 9.6v4.6"/><path pathLength="1" d="m8.8 20.4 3.2-6.2 3.2 6.2"/>',
    menu: '<path pathLength="1" d="M4 9h16M4 15h11"/>',
    close: '<path pathLength="1" d="m6 6 12 12M18 6 6 18"/>',
    arrow: '<path pathLength="1" d="M19 12H5m6-6-6 6 6 6"/>',
    next: '<path pathLength="1" d="m15 6-6 6 6 6"/>', prev: '<path pathLength="1" d="m9 6 6 6-6 6"/>',
    chev: '<path pathLength="1" d="m6 9 6 6 6-6"/>',
    plus: '<path pathLength="1" d="M12 5v14M5 12h14"/>', minus: '<path pathLength="1" d="M5 12h14"/>', check: '<path pathLength="1" d="m5 12.5 4.2 4.2L19 7"/>',
    home: '<path pathLength="1" d="M4 10.6 12 4l8 6.6V20h-5.4v-5.6H9.4V20H4Z"/>',
    grid: '<rect pathLength="1" x="4" y="4" width="6.6" height="6.6" rx="1.6"/><rect pathLength="1" x="13.4" y="4" width="6.6" height="6.6" rx="1.6"/><rect pathLength="1" x="4" y="13.4" width="6.6" height="6.6" rx="1.6"/><rect pathLength="1" x="13.4" y="13.4" width="6.6" height="6.6" rx="1.6"/>',
    text: '<path pathLength="1" d="M4 18 8.5 6h1L14 18M5.6 14h6.8"/><path pathLength="1" d="m15 18 2.6-7h.8L21 18M15.9 15.6h4.2"/>',
    contrast: '<circle pathLength="1" cx="12" cy="12" r="8"/><path pathLength="1" d="M12 4v16"/><path pathLength="1" d="M12 7.5a4.5 4.5 0 0 1 0 9"/>',
    link: '<path pathLength="1" d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path pathLength="1" d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    pause: '<circle pathLength="1" cx="12" cy="12" r="8"/><path pathLength="1" d="M10 9v6M14 9v6"/>',
    play: '<circle pathLength="1" cx="12" cy="12" r="8"/><path pathLength="1" d="m10.4 8.8 4.6 3.2-4.6 3.2Z"/>',
    font: '<path pathLength="1" d="M5 19V6h7M5 12h5.5"/><path pathLength="1" d="M14 19h5M16.5 19v-8"/>',
    zoom: '<circle pathLength="1" cx="10.5" cy="10.5" r="6.5"/><path pathLength="1" d="m15.4 15.4 4.6 4.6M10.5 8v5M8 10.5h5"/>',
    tag: '<path pathLength="1" d="M3.8 12.4V4.6a.8.8 0 0 1 .8-.8h7.8l8 8-8.6 8.6Z"/><circle pathLength="1" cx="8.4" cy="8.4" r="1.4"/>',
    users: '<circle pathLength="1" cx="9" cy="8.6" r="3.2"/><path pathLength="1" d="M3.4 19.4a5.6 5.6 0 0 1 11.2 0"/><path pathLength="1" d="M15.4 5.6a3.2 3.2 0 0 1 0 6.2M17.4 14.2a5.6 5.6 0 0 1 3.2 5.2"/>',
    siddur: '<path pathLength="1" d="M6.2 4.4h10.6a1.4 1.4 0 0 1 1.4 1.4v14H7.6a1.4 1.4 0 0 1-1.4-1.4Z"/><path pathLength="1" d="M6.2 18.4A1.4 1.4 0 0 1 7.6 17h10.6"/><path pathLength="1" d="M9.6 7.4h5.2v6.2H9.6Z"/><path pathLength="1" d="M12.2 9v3"/>',
    machzor: '<path pathLength="1" d="M4 6.2h4v13.6H4Z"/><path pathLength="1" d="M8.6 4.2h4.2v15.6H8.6Z"/><path pathLength="1" d="m14.2 7.2 3.7-.9 3 13-3.7.9Z"/><path pathLength="1" d="M4 9h4M8.6 7.2h4.2M4 17h4M8.6 17h4.2"/>',
    tehilim: '<path pathLength="1" d="M6.5 20.2V5.2c5.3 0 9.6 4.1 11.6 9.4l.8 5.6Z"/><path pathLength="1" d="M9.6 8.2v12M12.6 10.2v10M15.6 13.4v6.8"/><path pathLength="1" d="M5.2 20.2h14.6"/>',
    chumash: '<path pathLength="1" d="M7.4 5.6h9.2v12.8H7.4Z"/><path pathLength="1" d="M5.6 3.6v16.8M18.4 3.6v16.8"/><path pathLength="1" d="M9.6 9h4.8M9.6 12h4.8M9.6 15h3.2"/>',
    limud: '<path pathLength="1" d="M3.6 19.2h16.8"/><path pathLength="1" d="M5 15.6h14v3.6H5Z"/><path pathLength="1" d="M6.4 12h11.2v3.6H6.4Z"/><path pathLength="1" d="M8 8.4h8V12H8Z"/><path pathLength="1" d="M12 3.8v2.4M9.6 4.6l.8 1.4M14.4 4.6l-.8 1.4"/>',
    birkon: '<path pathLength="1" d="M7.6 4h8.8l-.7 5.2a3.7 3.7 0 0 1-7.4 0Z"/><path pathLength="1" d="M12 12.9v5.5"/><path pathLength="1" d="M8.4 20.2h7.2"/><path pathLength="1" d="M8 6.6h8"/>',
    zmirot: '<path pathLength="1" d="M8 20.2v-8.8h3v8.8M13 20.2v-8.8h3v8.8"/><path pathLength="1" d="M9.5 8.6c-1-1-.4-2.4 0-3.4.7 1 1.4 2.2 0 3.4ZM14.5 8.6c-1-1-.4-2.4 0-3.4.7 1 1.4 2.2 0 3.4Z"/><path pathLength="1" d="M5 20.2h14"/>',
    hagada: '<circle pathLength="1" cx="12" cy="12" r="8"/><path class="dot" d="M8 8.5h.01M12 7.2h.01M16 8.5h.01M7 12h.01M10.5 11h.01M13.5 11h.01M17 12h.01M8.5 15.2h.01M12 16.6h.01M15.5 15.2h.01"/>',
    mazkeret: '<rect pathLength="1" x="4" y="10" width="16" height="10.5" rx="1"/><path pathLength="1" d="M3 7.2h18V10H3Z"/><path pathLength="1" d="M12 7.2v13.3"/><path pathLength="1" d="M12 7.2C10.6 4.4 7 4 7 6s3.6 1.2 5 1.2c1.4 0 5 .8 5-1.2s-3.6-1.6-5 1.2"/>',
    kids: '<path pathLength="1" d="m12 4 2.1 4.4 4.8.6-3.5 3.3.9 4.7L12 14.7 7.7 17l.9-4.7-3.5-3.3 4.8-.6Z"/><path pathLength="1" d="M12 17.6v2.8"/>',
    mark: '<path pathLength="1" d="M12 7.6c-2.3-1.7-5.2-2.1-8-1.7v12.4c2.8-.4 5.7 0 8 1.7 2.3-1.7 5.2-2.1 8-1.7V5.9c-2.8-.4-5.7 0-8 1.7Z"/><path pathLength="1" d="M12 7.6V20"/><path pathLength="1" d="M12 2.4v2.2M8.8 3.4l.8 1.4M15.2 3.4l-.8 1.4"/>'
  };
  const ic = (n, cls) => '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (P[n] || '') + '</svg>';
  const GLOGO = '<svg class="g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.2 5.6c4.2-3.9 7.1-9.7 7.1-17.1z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.2-5.6c-2.2 1.5-5 2.4-8.7 2.4-6.3 0-11.6-4.1-13.5-9.9l-7.8 6.1C6.6 42.6 14.6 48 24 48z"/></svg>';
  const STAR = f => '<svg class="ic' + (f ? ' f' : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + P.star + '</svg>';
  const stars = (n, cls) => '<span class="' + (cls || 'stars') + '" role="img" aria-label="' + n + ' מתוך 5 כוכבים">' + [1, 2, 3, 4, 5].map(i => STAR(i <= Math.round(n))).join('') + '</span>';
  const DED_ONE = 130, DED_NAME = 10;
  const FOIL = { gold: ['#8a6420', '#f3dc9a', '#b8892f', '#fff1c4', '#a87a2a', '#e9cf88'], silver: ['#6d7076', '#f4f5f7', '#9a9da3', '#ffffff', '#8b8e94', '#dfe1e4'] };
  const EMB = {
    neshama: '<path d="M60 9c6 8 8.5 14 5 20.5-1.6 3-3.4 4.2-5 4.2s-3.4-1.2-5-4.2C51.5 23 54 17 60 9Z"/><path d="M60 21c2 3 2.4 5.6 1 8-.5.8-.9 1-1 1s-.5-.2-1-1c-1.4-2.4-1-5 1-8Z" fill="var(--hole)"/><path d="M36 37h48c-2 8-11 13-24 13S38 45 36 37Z"/><path d="M53 51h14v4H53z"/><path d="M33 40c-7-2-12 3-9 7 2.5 3 7 1 5.5-2" fill="none" stroke-width="2.4"/><path d="M87 40c7-2 12 3 9 7-2.5 3-7 1-5.5-2" fill="none" stroke-width="2.4"/><path d="M14 47h9M97 47h9" fill="none" stroke-width="2"/>',
    barmitzva: '<path d="M44 8h32v28H44z" fill="none" stroke-width="2.6"/><path d="M76 8l5-4v28l-5 4" fill="none" stroke-width="2.2"/><text x="60" y="30" font-size="20" text-anchor="middle" stroke="none">ש</text><path d="M36 36h48v7H36z" fill="none" stroke-width="2.4"/><path d="M84 40c12 2 16 10 6 14-12 5-32-2-48 2-6 1.5-10 4-12 7" fill="none" stroke-width="3.2"/>',
    wedding: '<circle cx="51" cy="40" r="13" fill="none" stroke-width="3"/><circle cx="69" cy="40" r="13" fill="none" stroke-width="3"/><path d="M69 26l-6-7 6-8 6 8Z"/><path d="M28 48h10M82 48h10" fill="none" stroke-width="2"/>',
    chatan: '<path d="M45 10h30c0 17-6 27-15 27S45 27 45 10Z" fill="none" stroke-width="2.8"/><path d="M48 16h24" fill="none" stroke-width="1.6"/><path d="M60 37v10" fill="none" stroke-width="3"/><path d="M47 55c1.5-5 7-8 13-8s11.5 3 13 8Z"/><path d="M30 30c-6 0-9 5-5 8M90 30c6 0 9 5 5 8" fill="none" stroke-width="2.2"/>',
    henna: '<circle cx="60" cy="32" r="5"/><g fill="none" stroke-width="2.4"><ellipse cx="60" cy="18" rx="6" ry="9"/><ellipse cx="60" cy="46" rx="6" ry="9"/><ellipse cx="46" cy="32" rx="9" ry="6"/><ellipse cx="74" cy="32" rx="9" ry="6"/></g><path d="M36 50c-8 2-14-2-16-8 6 0 12 2 16 8ZM84 50c8 2 14-2 16-8-6 0-12 2-16 8Z"/>',
    gift: '<path d="M60 22l5 6-5 6-5-6Z"/><g fill="none" stroke-width="2.4"><path d="M53 28c-6-8-18-9-20-1-1.6 6 6 8 9 4 2-3-1-6-3-4"/><path d="M67 28c6-8 18-9 20-1 1.6 6-6 8-9 4-2-3 1-6 3-4"/><path d="M22 40c10 4 26 4 38-2 12 6 28 6 38 2"/></g>'
  };
  const TPL = {
    neshama: { name: 'לעילוי נשמת', fields: [['n', 'שם הנפטר/ת', 'שרה לוי'], ['p', 'בן/בת', 'בת רחל ויעקב ז״ל'], ['d', 'תאריך הפטירה', 'כ״ט תשרי תשפ״ז']], lines: f => [['s', 'מוקדש לעילוי נשמת'], ['E'], ['L', f.n], ['m', f.p], ['m', f.d], ['m', 'ת.נ.צ.ב.ה.']] },
    barmitzva: { name: 'בר מצווה', fields: [['n', 'שם החוגג', 'יוסף חיים'], ['d', 'תאריך', 'י״ד בטבת תשפ״ז']], lines: f => [['E'], ['L', f.n], ['M', 'חוגג בר מצווה'], ['M', f.d]] },
    wedding: { name: 'חתונה', fields: [['n', 'החתן והכלה', 'יוסף ושרה'], ['d', 'תאריך', 'כ״ה באדר תשפ״ז']], lines: f => [['s', 'מזכרת משמחת נישואי'], ['E'], ['L', f.n], ['m', f.d]] },
    chatan: { name: 'שבת חתן', fields: [['n', 'שם החתן', 'יוסף כהן'], ['d', 'השבת', 'שבת פרשת וישב תשפ״ז']], lines: f => [['s', 'מזכרת משבת חתן'], ['E'], ['L', f.n], ['m', f.d]] },
    henna: { name: 'חינה', fields: [['n', 'החתן והכלה', 'יוסף ושרה'], ['d', 'תאריך', 'כ״ג באדר תשפ״ז']], lines: f => [['s', 'מזכרת מטקס החינה'], ['E'], ['L', f.n], ['m', f.d]] },
    gift: { name: 'מתנה', fields: [['n', 'שורה ראשית', 'למשפחת לוי היקרה'], ['d', 'שורה שנייה', 'באהבה, משפחת כהן']], lines: f => [['E'], ['L', f.n], ['m', f.d]] }
  };
  const SZ = { s: 17, L: 34, M: 25, m: 18 };
  const SW = { 'חום': 'linear-gradient(135deg,#7a4e2e,#4a2c18)', 'לבן': '#F6F3EC', 'פנינה': 'linear-gradient(135deg,#fbf6ea,#e6dcc8 60%,#f4eee2)', 'כספסף': 'linear-gradient(135deg,#e9ebee,#b9bdc3 55%,#f1f2f4)', 'ורוד בהיר': '#EDCFCB', 'כסף': 'linear-gradient(135deg,#d9dce0,#9ea3a9 55%,#e4e6e9)', 'בורדו': 'linear-gradient(135deg,#7c2433,#4c1220)', 'ורוד': '#D9919F', 'סגול': 'linear-gradient(135deg,#6a46a0,#3d2466)', 'ברונזה': 'linear-gradient(135deg,#a7804b,#6e4f2a 55%,#b99363)', 'אפור': '#8B8E92', 'תכלת': '#A9D0EA', 'כחול': 'linear-gradient(135deg,#29497f,#14284d)', 'טורקיז': '#2BA6A0', 'שחור': 'linear-gradient(135deg,#2b2825,#0f0e0d)', 'זהב': 'linear-gradient(135deg,#8a6420,#f3dc9a 45%,#b8892f)', 'אדום': '#A6262E', 'ירוק': '#2F6B4A', 'צהוב': '#E7C34A' };
  const MENU = [
    { id: 'siddur', name: 'סידורים', g: ['siddur'], subs: ['נוסח אשכנז', 'נוסח ספרד', 'נוסח עדות המזרח'], blurb: 'בכל הנוסחים, בכריכות עור, דמוי עור וכריכה קשה.', short: 'בכל הנוסחים', nus: true },
    { id: 'machzor', name: 'מחזורים', g: ['machzor'], subs: ['כריכה קשה', 'כריכת עור', 'דמוי עור'], blurb: 'סטים לכל החגים ומחזורים בודדים, בכל הנוסחים.', short: 'סטים לכל החגים', nus: true },
    { id: 'tehilim', name: 'תהילים', g: ['tehilim'], subs: ['תהילים תכשיט', 'בקשות ותחינות'], blurb: 'מתהילים קטן לכיס ועד מהדורות מהודרות בכריכת עור.', short: 'מכיס ועד מהודר' },
    { id: 'chumash', name: 'חומשים', g: ['chumash'], subs: ['חומשים', 'ביאורי הפרשה', 'חומש עם סידור'], blurb: 'חומשים לבית ולבית הכנסת, עם ביאורים ובלעדיהם.', short: 'לבית ולבית הכנסת' },
    { id: 'limud', name: 'ספרי לימוד', g: ['limud'], subs: ['גמרא', 'משניות', 'ספרי הלכה'], blurb: 'ש״ס, משניות, ספרי הלכה וסטים מלאים לבית ולבית המדרש.', short: 'ש״ס וסטים מלאים' },
    { id: 'birkon', name: 'ברכונים', g: ['birkon'], subs: ['ברכת המזון', 'סדר הבדלה', 'הפרשת חלה', 'בקשות'], blurb: 'ברכונים לשולחן, ולמזכרת משמחה, עם הקדשה אישית והנחה לכמות.', short: 'לשולחן ולשמחות', nus: true },
    { id: 'zmirot', name: 'זמירות שבת', g: ['zmirot'], subs: ['זמירות שבת', 'שירונים', 'ספרי קידוש'], blurb: 'זמירות, שירונים וספרי קידוש לשולחן השבת ולשבת חתן.', short: 'לשולחן השבת', nus: true },
    { id: 'hagada', name: 'חגים וזמנים', g: ['hagada', 'megila', 'slichot'], subs: ['הגדות לפסח', 'מגילות אסתר', 'סליחות'], blurb: 'הגדות לפסח, מגילות אסתר, סליחות וכל מה שצריך לחגים.', short: 'הגדות, מגילות וסליחות' },
    { id: 'mazkeret', name: 'מזכרות לאירועים', nav: 'מזכרות', g: ['birkon', 'zmirot'], subs: [], blurb: 'ברכונים, שירונים וזמירות בכמות לאירוע: בר מצווה, חתונה, שבע ברכות ואזכרה. הקדשה אחידה לכל הכמות, או שם אישי לכל עותק.', short: 'בכמות, עם הקדשה' },
    { id: 'kids', name: 'ספרי ילדים', g: ['kids'], subs: [], blurb: 'ספרי קריאה, קומיקס וספרים בעקבות הפרשה לילדים.', short: 'לגיל הרך ולילדים' }
  ];

  const ARW = ic('arrow');
  const BI = '<span class="bi">' + ARW + '</span>';
  const EXTA = ' target="_blank" rel="noopener"';
  /* phone, WhatsApp, mail and the free-shipping threshold come from the header and footer the shop edits in Elementor */
  CFG.phone = '0526845740'; CFG.mail = 'sidurscenter@gmail.com';
  function readSiteFacts() {
    const scope = [...document.querySelectorAll('[data-elementor-type="header"], [data-elementor-type="footer"], .elementor-location-header, .elementor-location-footer, header, footer')];
    const pick = sel => { for (const r of scope) { const a = r.querySelector(sel); if (a) return a; } return document.querySelector(sel); };
    const tel = pick('a[href^="tel:"]'); if (tel) { const d = tel.getAttribute('href').replace(/[^\d+]/g, '').replace(/^\+?972/, '0'); if (/^0\d{8,9}$/.test(d)) CFG.phone = d; }
    const wa = pick('a[href*="wa.me/"]'); if (wa) { const m = wa.getAttribute('href').match(/wa\.me\/(\d{9,15})/); if (m) CFG.wa = m[1]; }
    const ml = pick('a[href^="mailto:"]'); if (ml) { const m = ml.getAttribute('href').slice(7).split('?')[0].trim(); if (/@/.test(m)) CFG.mail = m; }
    const txt = scope.map(r => r.textContent).join(' ') || document.body.textContent;
    const f = txt.match(/משלוח חינם[^\d₪]{0,24}(\d[\d,]{1,6})/); if (f) { const v = +f[1].replace(/,/g, ''); if (v > 0 && v < 100000) CFG.free = v; }
  }
  const phoneShow = () => CFG.phone.replace(/^(\d{2,3})(\d{7})$/, '$1-$2');
  const telHref = () => 'tel:+972' + CFG.phone.replace(/^0/, '');
  const freeTxt = () => CFG.free.toLocaleString('he-IL') + ' ₪';
  const waLink = t => 'https://wa.me/' + CFG.wa + (t ? '?text=' + encodeURIComponent(t) : '');
  const NUSACH = [{ id: 'ash', name: 'אשכנז', full: 'נוסח אשכנז' }, { id: 'sfd', name: 'ספרד', full: 'נוסח ספרד' }, { id: 'edot', name: 'עדות המזרח', full: 'נוסח עדות המזרח' }];
  const nusName = id => (NUSACH.find(n => n.id === id) || {}).name || '';
  const nusFull = id => id === 'ash-sfd' ? 'נוסח אשכנז / ספרד' : ((NUSACH.find(n => n.id === id) || {}).full || '');
  const nusOfCats = cats => { for (const c of cats || []) { const n = decode(c.name); if (/אשכנז|ליטא/.test(n)) return 'ash'; if (/ספרד/.test(n)) return 'sfd'; if (/עדות/.test(n)) return 'edot'; } return ''; };
  const PC = s => '/product-category/' + encodeURIComponent(s) + '/';
  const GROUPS = [
    [/^(סט\s+)?סידור/, 'סידורים', 0, '/?s=%D7%A1%D7%99%D7%93%D7%95%D7%A8&post_type=product', 'סידור'],
    [/^(סט\s+)?מחזור/, 'מחזורים', 106, PC('מחזורים')],
    [/^(סט\s+)?(תהילים|תהלים)/, 'תהילים', 114, PC('תהילים')],
    [/^(סט\s+)?(חומש|חמש)/, 'חומשים', 124, PC('חומשים')],
    [/^(סט\s+)?(ברכון|מזכרת|בקשות|הפרשת|סדר הבדלה)/, 'ברכונים', 135, PC('ברכונים-מזכרות-בקשות')],
    [/^(סט\s+)?זמירות/, 'זמירות שבת', 154, PC('זמירות-שבת')],
    [/^(סט\s+)?הגד/, 'הגדות לפסח', 134, PC('הגדת-פסח')],
    [/^(סט\s+)?מגיל/, 'מגילות', 133, PC('מגילת-אסתר')],
    [/סליחות/, 'סליחות', 104, PC('סליחות')],
    [/ש["״]ס|גמרא|תלמוד|משניות|משנה ברורה|שולחן ערוך|קיצור/, 'ספרי לימוד', 136, PC('ספרים')]
  ].map(g => ({ re: g[0], name: g[1], id: g[2], link: g[3], q: g[4] || '' }));
  const groupOf = name => GROUPS.find(g => g.re.test(decode(name).trim())) || null;
  /* same name cleanup as the concept catalog (tools/build_catalog.py clean + site.html base) */
  const clean = n => decode(n).replace(/[–—]/g, '·').replace(/\s+-\s*|\s*-\s+/g, ' · ').replace(/\s+\/\s+/g, ' · ').replace(/זמירותשבת/g, 'זמירות שבת').replace(/\s+,/g, ',').replace(/\s{2,}/g, ' ').trim().replace(/^[\s·]+|[\s·]+$/g, '');
  const base = name => clean(name).split(' · נוסח')[0].split(' · עדות')[0].split(' · ')[0].trim();

  /* ---------- Store API ---------- */
  let nonce = null;
  async function api(path, opts) {
    opts = opts || {};
    const h = { 'Content-Type': 'application/json' };
    if (opts.method && opts.method !== 'GET') {
      if (!nonce) { try { const r = await fetch(CFG.api + '/cart', { credentials: 'same-origin' }); nonce = r.headers.get('Nonce') || r.headers.get('X-WC-Store-API-Nonce'); } catch (e) {} }
      if (nonce) { h.Nonce = nonce; h['X-WC-Store-API-Nonce'] = nonce; }
    }
    const r = await fetch(CFG.api + path, { method: opts.method || 'GET', credentials: 'same-origin', headers: h, body: opts.body ? JSON.stringify(opts.body) : undefined });
    const n = r.headers.get('Nonce'); if (n) nonce = n;
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.message || ('HTTP ' + r.status)); e.data = j; throw e; }
    return j;
  }

  /* ---------- busy state: every slow action shows it is working and ignores repeat clicks ---------- */
  function busy(btn, label) {
    if (!btn || btn.dataset.ckBusy) return () => {};
    const html = btn.innerHTML; btn.dataset.ckBusy = '1'; btn.classList.add('ck-busy'); btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = '<span class="ck-spin" aria-hidden="true"></span>' + (label ? '<span>' + esc(label) + '</span>' : '');
    return () => { btn.innerHTML = html; delete btn.dataset.ckBusy; btn.classList.remove('ck-busy'); btn.removeAttribute('aria-busy'); };
  }

  /* ---------- toast ---------- */
  let toastT = null;
  function toast(t, icon) { const el = $('#ck-toast'); if (!el) return; el.innerHTML = (icon ? ic(icon) : '') + esc(t); el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2400); }

  /* ---------- overlays: scrim, cart drawer, search, toast, fbuy ---------- */
  function mountOverlays() {
    if ($('#ck-ov')) return;
    const w = document.createElement('div'); w.className = 'ckx'; w.id = 'ck-ov';
    w.innerHTML =
      '<div class="scrim" id="ck-scrim" hidden></div>' +
      '<aside class="drawer" id="ck-cart" role="dialog" aria-modal="true" aria-labelledby="ck-cart-title" hidden><div class="dh"><h2 id="ck-cart-title">הסל שלך</h2><button class="ib" type="button" data-ck-close aria-label="סגירה">' + ic('close') + '</button></div><div class="citems" id="ck-cart-items"></div><div class="df" id="ck-cart-foot"></div></aside>' +
      '<div class="search" id="ck-search" role="dialog" aria-modal="true" aria-label="חיפוש באתר" hidden><div class="wrap"><div class="sbox">' + ic('search') + '<input id="ck-q" type="search" placeholder="מה מחפשים? סידור, מחזור, תהילים…" aria-label="חיפוש מוצרים" autocomplete="off"><button class="ib" type="button" data-ck-close aria-label="סגירת החיפוש">' + ic('close') + '</button></div><div class="sugg" id="ck-sugg"></div><div class="sres" id="ck-sres" aria-live="polite"></div></div></div>' +
      '<div class="toast" id="ck-toast" role="status" aria-live="polite"></div>' +
      '<div class="fbuy" id="ck-fbuy" aria-hidden="true"></div>';
    document.body.appendChild(w);
    $('#ck-scrim').addEventListener('click', closeAll);
    let st = null; $('#ck-q').addEventListener('input', e => { clearTimeout(st); st = setTimeout(() => renderSearch(e.target.value), 220); });
  }
  let lastFocus = null, openId = null;
  function open(id) {
    closeAll(); lastFocus = document.activeElement; openId = id;
    const el = $('#ck-' + id); el.hidden = false; $('#ck-scrim').hidden = false; document.body.classList.add('ck-locked');
    requestAnimationFrame(() => { el.classList.add('open'); $('#ck-scrim').classList.add('on'); });
    if (id === 'search') { renderSearch($('#ck-q').value || ''); setTimeout(() => $('#ck-q').focus(), 60); }
    if (id === 'cart') { renderCart(); setTimeout(() => { const c = el.querySelector('[data-ck-close]'); if (c) c.focus(); }, 60); }
  }
  function closeAll() {
    if (!openId) return;
    const el = $('#ck-' + openId); el.classList.remove('open'); $('#ck-scrim').classList.remove('on'); document.body.classList.remove('ck-locked');
    const id = openId; openId = null;
    setTimeout(() => { if (openId !== id) { el.hidden = true; if (!openId) $('#ck-scrim').hidden = true; } }, 600);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAll();
    if (e.key !== 'Tab' || !openId) return;
    const f = [...$('#ck-' + openId).querySelectorAll('a[href], button, input, select')].filter(x => x.offsetParent !== null);
    if (!f.length) return; const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- cart (Store API) ---------- */
  let cartData = null;
  async function loadCart() { try { cartData = await api('/cart'); } catch (e) { cartData = null; } paintCount(); return cartData; }
  function paintCount() {
    const n = cartData ? cartData.items_count || 0 : 0;
    document.querySelectorAll('[data-ck-count]').forEach(el => { const was = el.textContent; el.textContent = n; el.hidden = !n; if (n && String(n) !== was) { el.classList.remove('cart-bump'); void el.offsetWidth; el.classList.add('cart-bump'); } });
  }
  function renderCart() {
    const items = $('#ck-cart-items'), foot = $('#ck-cart-foot');
    if (!cartData) { items.innerHTML = '<div class="cempty">' + ic('bag') + '<p>טוען את הסל…</p></div>'; foot.innerHTML = ''; loadCart().then(() => { if (openId === 'cart') renderCart(); }); return; }
    const list = cartData.items || [];
    if (!list.length) { items.innerHTML = '<div class="cempty">' + ic('bag') + '<p>הסל עדיין ריק.</p><a class="btn solid" href="' + MLINK.siddur + '">לסידורים</a></div>'; foot.innerHTML = ''; return; }
    const tt = cartData.totals || {}; const total = priceOf(tt.total_items) + priceOf(tt.total_items_tax);
    const left = Math.max(0, CFG.free - total);
    const notes = store.get('ck-ded', []);
    items.innerHTML = '<div class="ship">' + (left ? 'עוד <b>' + money(+left.toFixed(2)) + '</b> ויש לכם משלוח חינם' : '<b>יש לכם משלוח חינם</b>') + '<div class="bar"><i style="width:' + Math.min(100, Math.round(total / CFG.free * 100)) + '%"></i></div></div>' +
      list.map(it => {
        const isDed = it.id === CFG.dedProduct.one || it.id === CFG.dedProduct.names;
        const img = (it.images && it.images[0]) ? '<img class="pic" src="' + esc(it.images[0].thumbnail || it.images[0].src) + '" alt="">' : (isDed ? '<span style="display:grid;place-items:center;width:100%;height:100%;color:var(--gold)">' + ic('quill') + '</span>' : '');
        const vars = (it.variation || []).map(v => decode(v.value)).filter(Boolean).join(' · ');
        const note = notes.find(n => String(n.id) === String(it.id));
        return '<div class="ci2"><div class="t">' + img + '</div><div><div class="n">' + esc(base(it.name)) + '</div>' +
          (vars ? '<div style="font-size:13px;color:var(--ink-3)">' + esc(vars) + '</div>' : '') +
          (note ? '<div style="font-size:13px;color:var(--gold)">הקדשה: ' + esc(note.text) + '</div>' : '') +
          '<div class="sq"><button type="button" data-ck-cq="' + esc(it.key) + '" data-q="' + (it.quantity + 1) + '" aria-label="להוסיף אחד">' + ic('plus') + '</button><span>' + it.quantity + '</span><button type="button" data-ck-cq="' + esc(it.key) + '" data-q="' + (it.quantity - 1) + '" aria-label="להוריד אחד">' + ic('minus') + '</button></div></div>' +
          '<div class="p">' + money(+(priceOf(it.totals.line_total) + priceOf(it.totals.line_total_tax)).toFixed(2)) + '</div></div>';
      }).join('');
    foot.innerHTML = '<div class="tot"><span>סך הכל</span><span>' + money(+total.toFixed(2)) + '</span></div><a class="btn solid" href="' + CFG.checkoutUrl + '">למעבר לתשלום' + BI + '</a>';
  }
  const qWant = {}, qBusy = {};
  async function setQty(key, q) {
    q = Math.max(0, q);
    qWant[key] = q;
    /* show the new quantity at once; the store confirms in the background */
    if (cartData && cartData.items) { const it = cartData.items.find(x => x.key === key); if (it) { it.quantity = q; if (!q) cartData.items = cartData.items.filter(x => x.key !== key); } renderCart(); const ft = $('#ck-cart-foot .tot'); if (ft) ft.classList.add('ck-pending'); }
    if (qBusy[key]) return;
    qBusy[key] = true;
    while (true) {
      const target = qWant[key];
      await setQtyNow(key, target);
      if (qWant[key] === target) break;
    }
    delete qBusy[key]; delete qWant[key];
  }
  async function setQtyNow(key, q) {
    try { cartData = q > 0 ? await api('/cart/update-item', { method: 'POST', body: { key, quantity: q } }) : await api('/cart/remove-item', { method: 'POST', body: { key } }); } catch (e) { toast('לא הצלחנו לעדכן את הסל'); }
    try { await syncDedLines(); } catch (e) {}
    paintCount(); renderCart();
  }
  /* a dedication line never stays in the cart without the book it belongs to */
  async function syncDedLines() {
    if (!cartData) return;
    const ids = CFG.dedProduct; const items = cartData.items || [];
    const isDed = it => it.id === ids.one || it.id === ids.names;
    const notes = store.get('ck-ded', []);
    const books = items.filter(it => !isDed(it));
    const live = notes.filter(n => books.some(b => String(b.id) === String(n.id)));
    if (live.length !== notes.length) store.set('ck-ded', live);
    const wantOne = live.some(n => /^הקדשה עם גלופה/.test(n.text));
    const nameQty = books.filter(b => live.some(n => String(n.id) === String(b.id) && /^חריטת שם/.test(n.text))).reduce((t, b) => t + b.quantity, 0);
    for (const it of items.filter(isDed)) {
      if (it.id === ids.one && !wantOne) cartData = await api('/cart/remove-item', { method: 'POST', body: { key: it.key } });
      else if (it.id === ids.names && !nameQty) cartData = await api('/cart/remove-item', { method: 'POST', body: { key: it.key } });
    }
  }

  /* ---------- search (Store API) ---------- */
  let sSeq = 0;
  async function renderSearch(q) {
    const sug = ['סידור', 'מחזור', 'תהילים', 'ברכון', 'חומש', 'הגדה', 'ש״ס', 'מזכרת'];
    $('#ck-sugg').innerHTML = q ? '' : sug.map(s => '<button class="chip" type="button" data-ck-sug="' + s + '">' + s + '</button>').join('');
    const qq = q.trim(); const my = ++sSeq;
    if (!qq) { $('#ck-sres').innerHTML = ''; return; }
    $('#ck-sres').innerHTML = '<p class="count-line">מחפשים…</p>';
    try {
      let res = await api('/products?per_page=24&search=' + encodeURIComponent(qq.replace(/״/g, '"')));
      if (my !== sSeq) return;
      res = res.filter(notDed);
      $('#ck-sres').innerHTML = res.length ? res.map(p => card(p)).join('') : '<p class="count-line">לא נמצאו מוצרים. אפשר לנסות מילה אחרת, או לכתוב לנו בוואטסאפ.</p>';
    } catch (e) { $('#ck-sres').innerHTML = '<p class="count-line">החיפוש לא זמין כרגע.</p>'; }
  }

  /* ---------- product card (rails, search) ---------- */
  function card(p) {
    const short = base(p.name); const n = nusOfCats(p.categories);
    const pr = p.prices || {}; const price = priceOf(pr.price), reg = priceOf(pr.regular_price);
    const variable = p.type === 'variable' || p.has_options;
    const img = (p.images && p.images[0]) ? '<img class="pic" src="' + esc(p.images[0].thumbnail || p.images[0].src) + '" alt="' + esc(short) + '" loading="lazy">' : '';
    return '<div class="pc"><a href="' + esc(p.permalink) + '"><div class="pl">' + (p.on_sale ? '<span class="badge">מבצע</span>' : '') + img + '</div>' +
      '<div class="meta"><div class="nm">' + esc(short) + '</div>' + (n ? '<div class="nu">' + esc(nusFull(n)) + '</div>' : '') +
      '<div class="pr">' + (!price && !variable ? '<span>המחיר בתיאום</span>' : p.on_sale && reg > price ? '<span>' + money(price) + '</span><s>' + money(reg) + '</s>' : '<span>' + money(price) + '</span>') + (variable ? '<span class="k">· כמה אפשרויות</span>' : '') + '</div></div></a>' +
      '<a class="qa" href="' + esc(p.permalink) + '" aria-label="למוצר: ' + esc(short) + '">' + ic('plus') + '</a></div>';
  }
  const railBtns = id => '<div class="rbtns"><button type="button" data-ck-rail="' + id + '" data-dir="-1" aria-label="הקודם">' + ic('prev') + '</button><button type="button" data-ck-rail="' + id + '" data-dir="1" aria-label="הבא">' + ic('next') + '</button></div>';
  const kick = t => '<p class="kick">' + esc(t) + '</p>';

  /* ---------- dedication studio (concept, 1:1) ---------- */
  let ded = { mode: 'none', tpl: 'neshama', f: {}, names: '', c: 'gold' };
  let pstate = { qty: 1, img: 0, sel: {} }, cur = null;
  const dedNames = () => ded.names.split('\n').map(x => x.trim()).filter(Boolean);
  const dedFee = q => ded.mode === 'one' ? DED_ONE : ded.mode === 'names' ? DED_NAME * Math.max(dedNames().length, q || 0) : 0;
  const paint = id => ded.c === 'ink' ? '#1B1917' : 'url(#fg-' + id + '-' + ded.c + ')';
  function plateInner(id) {
    if (ded.mode === 'names') {
      const nm = dedNames()[0] || ''; const fs = SZ.L;
      return '<text x="150" y="' + (190 + fs * .35).toFixed(1) + '" font-size="' + fs + '" text-anchor="middle" direction="rtl" fill="' + paint(id) + '"' + (nm ? '' : ' opacity=".5"') + ' data-fit>' + esc(nm || 'משפחת כהן') + '</text>';
    }
    const t = TPL[ded.tpl]; const ph = {}; t.fields.forEach(([k, , x]) => { ph[k] = x; });
    const val = k => ded.f[k] || '';
    const f = {}; t.fields.forEach(([k]) => { f[k] = val(k) || ph[k]; });
    const empty = {}; t.fields.forEach(([k]) => { empty[f[k]] = !val(k); });
    const ls = t.lines(f); const gap = 9;
    const h = ls.reduce((a, l) => a + (l[0] === 'E' ? 54 : SZ[l[0]] * 1.12) + gap, -gap);
    let y = 190 - h / 2; let out = '';
    ls.forEach(l => {
      if (l[0] === 'E') { out += '<g transform="translate(90 ' + (y - 4).toFixed(1) + ') scale(1)" fill="' + paint(id) + '" stroke="' + paint(id) + '" stroke-linecap="round" stroke-linejoin="round">' + EMB[ded.tpl] + '</g>'; y += 54 + gap; return; }
      const fs = SZ[l[0]]; y += fs * .95;
      out += '<text x="150" y="' + y.toFixed(1) + '" font-size="' + fs + '" text-anchor="middle" direction="rtl" fill="' + paint(id) + '"' + (empty[l[1]] ? ' opacity=".5"' : '') + ' data-fit>' + esc(l[1]) + '</text>';
      y += fs * .17 + gap;
    });
    return out;
  }
  function fitPlate(svg) { svg.querySelectorAll('[data-fit]').forEach(t => { try { const w = t.getComputedTextLength(); if (w > 236) t.setAttribute('font-size', (parseFloat(t.getAttribute('font-size')) * 236 / w).toFixed(1)); } catch (e) {} }); }
  function dedPreview(id) {
    const defs = '<defs>' + Object.keys(FOIL).map(k => '<linearGradient id="fg-' + id + '-' + k + '" x1="0" x2="1" y1="0" y2=".35">' + FOIL[k].map((c, n) => '<stop offset="' + (n / 5) + '" stop-color="' + c + '"/>').join('') + '</linearGradient>').join('') + '</defs>';
    return '<div class="ded-prev plate ' + (ded.c === 'ink' ? 'white' : 'leather') + '" data-plate-wrap><span class="tag2">הדמיה להמחשה בלבד</span><div class="cv"><svg viewBox="0 0 300 380" role="img" aria-label="הדמיית ההקדשה על הכריכה, להמחשה בלבד" data-plate="' + id + '">' + defs + '<g data-plate-in>' + plateInner(id) + '</g></svg></div></div>';
  }
  function priceLine() {
    if (ded.mode === 'one') return '<b>₪' + DED_ONE + '</b><span>להזמנה כולה, אותו מחיר ל-10 עותקים או ל-100</span>';
    const n = dedNames().length; const k = Math.max(n, pstate.qty);
    return '<b>₪' + DED_NAME + '</b><span>לכל ספר' + (k ? ' · ' + k + (k === 1 ? ' ספר' : ' ספרים') + ' = ₪' + (k * DED_NAME) : '') + '</span>';
  }
  function namesInfo() { const n = dedNames().length; return n ? n + (n === 1 ? ' שם, ספר אחד.' : ' שמות, ' + n + ' ספרים.') + ' הכמות בהזמנה תתעדכן בהתאם.' : 'כל שורה היא ספר אחד עם שם משלו.'; }
  function dedBlock(id) {
    if (id === 'ded-home' && ded.mode === 'none') ded.mode = 'one';
    const t = TPL[ded.tpl];
    return '<div class="ded" data-ded="' + id + '">' +
      '<div class="dmodes" role="group" aria-label="סוג ההקדשה">' + (id === 'ded-home' ? [] : [['none', 'בלי הקדשה', '', '']]).concat([['one', 'הקדשה עם גלופה', '₪' + DED_ONE, 'לעילוי נשמת, בר מצווה ואירועים. אותו מחיר לכל כמות'], ['names', 'חריטת שם', '₪' + DED_NAME + ' לספר', 'שם על כל ספר, לכל אורח או בן משפחה']]).map(m => '<button type="button" data-ded-mode="' + m[0] + '" aria-pressed="' + (ded.mode === m[0]) + '"><span class="r" aria-hidden="true"></span><span class="tt"><b>' + m[1] + '</b>' + (m[3] ? '<span>' + m[3] + '</span>' : '') + '</span>' + (m[2] ? '<em>' + m[2] + '</em>' : '') + '</button>').join('') + '</div>' +
      (ded.mode === 'none' ? '' :
        (ded.mode === 'one' ? '<div class="tpls" role="radiogroup" aria-label="סוג האירוע">' + Object.keys(TPL).map(k => '<button type="button" role="radio" data-ded-tpl="' + k + '" aria-checked="' + (ded.tpl === k) + '"><svg viewBox="0 0 120 64" aria-hidden="true"><g fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="--hole:var(--paper)">' + EMB[k] + '</g></svg><span>' + TPL[k].name + '</span></button>').join('') + '</div>' : '') +
        dedPreview(id) +
        (ded.mode !== 'one' ? '' : '<div class="dfl">' + t.fields.map(([k, label, ph]) => '<div class="fld"><label for="' + id + '-' + k + '">' + label + '</label><input id="' + id + '-' + k + '" data-ded-fld="' + k + '" maxlength="40" placeholder="' + esc(ph) + '" value="' + esc(ded.f[k] || '') + '" autocomplete="off"></div>').join('') + '</div>') +
        (ded.mode === 'names' ? '<div class="fld"><label for="' + id + '-n">שם לחריטה, שורה לכל ספר</label><textarea class="names" id="' + id + '-n" data-ded-n placeholder="משפחת כהן&#10;משפחת לוי&#10;משפחת מזרחי">' + esc(ded.names) + '</textarea><small id="' + id + '-nc" aria-live="polite">' + namesInfo() + '</small></div>' : '') +
        '<div class="ded-two"><div><span class="ol2">צבע ההטבעה</span><div class="seg" role="group" aria-label="צבע ההטבעה">' + [['gold', 'זהב'], ['silver', 'כסף'], ['ink', 'שחור']].map(c => '<button type="button" data-ded-c="' + c[0] + '" aria-pressed="' + (ded.c === c[0]) + '"><i class="sw ' + c[0] + '" aria-hidden="true"></i>' + c[1] + '</button>').join('') + '</div></div></div>' +
        '<div class="dprice" data-ded-price aria-live="polite">' + priceLine() + '</div>' +
        '<div class="note">' + ic('tag') + '<span>ההדמיה כאן להמחשה בלבד. לפני ההטבעה נשלחת אליכם בוואטסאפ הדמיה מדויקת של העיצוב, ומטביעים רק אחרי האישור שלכם.</span></div>') +
    '</div>';
  }
  function refreshFoil() {
    document.querySelectorAll('[data-plate]').forEach(sv => { const id = sv.dataset.plate; sv.querySelector('[data-plate-in]').innerHTML = plateInner(id); fitPlate(sv); const w = sv.closest('[data-plate-wrap]'); if (w) { w.classList.toggle('white', ded.c === 'ink'); w.classList.toggle('leather', ded.c !== 'ink'); } });
    syncQty();
  }
  function redrawDed() { document.querySelectorAll('[data-ded]').forEach(el => { const tmp = document.createElement('div'); tmp.innerHTML = dedBlock(el.dataset.ded); const nw = tmp.firstChild; el.replaceWith(nw); nw.querySelectorAll('[data-plate]').forEach(fitPlate); }); syncQty(); }
  function dedNote() {
    if (ded.mode === 'one') { const f = ded.f; const txt = [f.n, f.p, f.d].filter(Boolean).join(', '); return txt ? 'הקדשה עם גלופה, ' + TPL[ded.tpl].name + ': ' + txt + ' (' + ({ gold: 'זהב', silver: 'כסף', ink: 'שחור' })[ded.c] + ')' : ''; }
    if (ded.mode === 'names') { const ns = dedNames(); return ns.length ? 'חריטת שם (' + ({ gold: 'זהב', silver: 'כסף', ink: 'שחור' })[ded.c] + '), ' + ns.length + ' שמות: ' + ns.join(' / ') : ''; }
    return '';
  }

  /* ---------- product page ---------- */
  const unitPrice = () => { const v = cur && cur.vsel; const pr = (v || cur.p).prices; return priceOf(pr.price); };
  function syncQty(fromInput) {
    const q = $('#ck-qty'); if (q && !fromInput) q.value = pstate.qty;
    document.querySelectorAll('[data-qc]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.qc === pstate.qty)));
    const tot = $('#ck-tot'); if (tot && cur) tot.textContent = 'סה״כ ' + money(+(unitPrice() * pstate.qty + dedFee(pstate.qty)).toFixed(2)) + (ded.mode !== 'none' ? ' כולל הקדשה' : '');
    document.querySelectorAll('[data-ded-price]').forEach(el => { el.innerHTML = priceLine(); });
  }
  function shareRow(title, u) {
    const t = title + ' | מרכז הסידורים';
    return '<div class="share" role="group" aria-label="שיתוף המוצר"><span>שיתוף</span>' +
      '<a href="https://api.whatsapp.com/send?text=' + encodeURIComponent(t + ' ' + u) + '"' + EXTA + ' aria-label="שיתוף בוואטסאפ">' + ic('wa') + '</a>' +
      '<a href="https://telegram.me/share/url?url=' + encodeURIComponent(u) + '&amp;text=' + encodeURIComponent(t) + '"' + EXTA + ' aria-label="שיתוף בטלגרם">' + ic('tg') + '</a>' +
      '<a href="mailto:?subject=' + encodeURIComponent(t) + '&amp;body=' + encodeURIComponent(u) + '" aria-label="שליחה במייל">' + ic('mail') + '</a>' +
      '<button type="button" data-ck-copy="' + esc(u) + '" aria-label="העתקת קישור למוצר">' + ic('link') + '</button></div>';
  }
  function descLines(p) {
    const tmp = document.createElement('div'); tmp.innerHTML = (p.short_description || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|li|div)>/gi, '\n');
    const b = base(p.name);
    return tmp.textContent.split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(s => s && s !== b && !s.includes(b.slice(0, 12))).slice(0, 5);
  }
  function attrsOf(p) { return (p.attributes || []).filter(a => a.has_variations); }
  function findVar(p) {
    const vs = p.variations || []; const sel = pstate.sel;
    return vs.find(v => v.attributes.every(a => { const want = sel[a.name]; return !a.value || !want || decodeURIComponent(a.value) === want; }));
  }
  function gallery(p) {
    const imgs = (p.images || []);
    const title = base(p.name);
    const main = imgs[pstate.img] || imgs[0];
    const bulk = cur.bulk;
    return '<div class="gal' + (imgs.length > 1 ? '' : ' single') + '"><button class="main" type="button" id="ck-gzoom" aria-label="הגדלת התמונה">' + (p.on_sale ? '<span class="tag2">מבצע</span>' : (bulk ? '<span class="tag2">' + ic('users') + 'הנחה לכמות</span>' : '')) +
      (main ? '<img class="pic" id="ck-gmain" src="' + esc(main.src) + '" alt="' + esc(main.alt || title) + '">' : '') + '</button>' +
      (imgs.length > 1 ? '<div class="thumbs">' + imgs.map((g, i) => '<button type="button" data-ck-img="' + i + '" aria-label="תמונה ' + (i + 1) + '" aria-current="' + (i === pstate.img) + '"><img class="pic" src="' + esc(g.thumbnail || g.src) + '" alt="" loading="lazy"></button>').join('') + '</div>' : '') +
      '</div>';
  }
  function priceRow() {
    const v = cur.vsel; const pr = (v || cur.p).prices || {}; const price = priceOf(pr.price), reg = priceOf(pr.regular_price);
    const range = !v && cur.p.prices && cur.p.prices.price_range;
    const ptxt = noPrice() ? 'המחיר בתיאום' : range && range.min_amount !== range.max_amount ? money(priceOf(range.min_amount)) + ' – ' + money(priceOf(range.max_amount)) : money(price);
    return '<span class="price" id="ck-price">' + ptxt + '</span>' + ((v || cur.p).on_sale && reg > price ? '<s>' + money(reg) + '</s>' : '') + (cur.bulk ? '<span class="qd">' + ic('users') + 'הנחה לכמות</span>' : '');
  }
  function attrBlocks(p) {
    return attrsOf(p).map(a => {
      const isCol = /color|צבע/i.test(a.taxonomy || '') || /צבע/.test(a.name);
      const curName = pstate.sel[a.name] ? (a.terms.find(t => decodeURIComponent(t.slug) === pstate.sel[a.name]) || {}).name : '';
      if (isCol) return '<div class="blk"><span class="ol">' + esc(a.name === 'צבע' ? 'צבע הכריכה' : a.name) + ' <span id="ck-col-cur">' + esc(curName || '') + '</span></span><div class="swatches" role="radiogroup" aria-label="' + esc(a.name) + '">' + a.terms.map(t => '<button type="button" role="radio" data-ck-attr="' + esc(a.name) + '" data-v="' + esc(decodeURIComponent(t.slug)) + '" aria-checked="' + (pstate.sel[a.name] === decodeURIComponent(t.slug)) + '" aria-label="' + esc(t.name) + '" title="' + esc(t.name) + '"><i style="background:' + (SW[t.name] || '#ccc') + '"></i></button>').join('') + '</div></div>';
      return '<div class="blk"><span class="ol">' + esc(a.name) + ' <span>' + esc(curName || '') + '</span></span><div class="seg" role="group" aria-label="' + esc(a.name) + '">' + a.terms.map(t => '<button type="button" data-ck-attr="' + esc(a.name) + '" data-v="' + esc(decodeURIComponent(t.slug)) + '" aria-pressed="' + (pstate.sel[a.name] === decodeURIComponent(t.slug)) + '">' + esc(t.name) + '</button>').join('') + '</div></div>';
    }).join('');
  }
  function viewProduct(h1html) {
    const p = cur.p; const title = base(p.name); const n = cur.n;
    const lines = descLines(p);
    const grp = cur.grp;
    const sibs = cur.sibs;
    const nusSwitch = sibs.length > 1 ? '<div class="blk"><span class="ol">נוסח <span>' + esc(nusFull(n)) + '</span></span><div class="seg" role="group" aria-label="אותו ספר בנוסח אחר">' + sibs.map(s => '<a href="' + esc(s.permalink) + '"' + (s.id === p.id ? ' aria-current="page"' : '') + '>' + esc(nusName(s.n)) + '</a>').join('') + '</div></div>' : '';
    const cover = (p.categories || []).map(c => decode(c.name)).find(x => /כריכ/.test(x));
    return '<div class="wrap"><div class="pp">' +
      gallery(p) +
      '<div class="info">' +
        '<nav class="crumbs" aria-label="מיקום באתר"><a href="/">דף הבית</a><span aria-hidden="true">/</span>' + (grp ? '<a href="' + esc(grp.link) + '">' + esc(decode(grp.name)) + '</a>' : '') + '</nav>' +
        '<div class="chips2">' + (n ? '<span>' + ic('nusach') + esc(nusFull(n)) + '</span>' : '') + (cover ? '<span>' + esc(cover.replace(/\s*\/\s*/g, ' / ')) + '</span>' : '') + '<span id="ck-stock">' + (p.is_in_stock === false ? 'אזל מהמלאי' : 'במלאי') + '</span></div>' +
        h1html +
        '<div class="rate">' + GLOGO + stars(4.3) + '<span>4.3 · 65 ביקורות על החנות</span></div>' +
        '<div class="prow" id="ck-prow">' + priceRow() + '</div>' +
        '<p class="pnote">כולל מע״מ · משלוח חינם בהזמנה מעל ' + freeTxt() + '</p>' +
        (lines.length ? '<ul class="desc">' + lines.map(l => '<li>' + esc(l) + '</li>').join('') + '</ul>' : '') +
        nusSwitch + attrBlocks(p) +
        '<div class="blk"><span class="ol">הקדשה אישית <span>בתוספת תשלום</span></span>' + dedBlock('ded-p') + '</div>' +
        '<div class="blk"><span class="ol">כמות <span id="ck-tot">סה״כ ' + money(unitPrice()) + '</span></span>' +
        '<div class="buy" id="ck-buy"><div class="qty" role="group" aria-label="כמות"><button type="button" data-ck-q="1" aria-label="להוסיף אחד">' + ic('plus') + '</button><input id="ck-qty" type="number" inputmode="numeric" min="1" max="999" value="' + pstate.qty + '" aria-label="כמות"><button type="button" data-ck-q="-1" aria-label="להוריד אחד">' + ic('minus') + '</button></div>' +
        '<button class="btn solid" type="button" data-ck-add>הוספה לסל' + BI + '</button></div>' +
        (cur.bulk ? '<div class="qchips" role="group" aria-label="כמויות מהירות לאירוע">' + [10, 25, 50, 100].map(k => '<button type="button" data-qc="' + k + '" aria-pressed="false">' + k + ' יח׳</button>').join('') + '</div>' : '') +
        '<a class="wa-q" href="' + waLink('שלום, יש לי שאלה על ' + title + ' ' + p.permalink) + '"' + EXTA + '>' + ic('wa') + 'שאלה על המוצר? כתבו לנו בוואטסאפ</a>' + shareRow(title, p.permalink) + '</div>' +
        '<div class="trust"><div>' + ic('truck') + 'משלוח חינם<br>מעל ' + freeTxt() + '</div><div>' + ic('quill') + 'סקיצה לאישור<br>לפני הטבעה</div><div>' + ic('shield') + 'תשלום<br>מאובטח</div></div>' +
        '<div class="accs"><details class="acc"><summary>משלוחים והחזרות' + ic('plus') + '</summary><div class="ab">משלוח חינם בהזמנה מעל ' + freeTxt() + '. זמן האספקה מאושר בהזמנה. מוצר עם הקדשה מיוצר במיוחד בשבילכם ולכן אינו ניתן להחזרה, אלא אם יש בו פגם. <a href="/refund_returns/" style="text-decoration:underline">כל התנאים</a></div></details>' +
        '<details class="acc"><summary>הזמנה בכמות לאירוע' + ic('plus') + '</summary><div class="ab">מזמינים 10 עותקים ומעלה? כתבו לנו את הכמות ואת תאריך האירוע, ונחזור עם הצעת מחיר והנחה לכמות.</div></details></div>' +
      '</div>' +
      '</div>' +
      '<section aria-labelledby="ck-sn-h" id="ck-rail-nus-sec" hidden style="padding-bottom:clamp(64px,8vw,110px)"><div class="sh"><div class="tx">' + kick('משלימים את הסט') + '<h2 class="h2" id="ck-sn-h" style="font-size:clamp(30px,3.2vw,44px)">עוד בנוסח ' + esc(nusName(n)) + '</h2></div>' + railBtns('nus') + '</div><div class="rail-row" id="ck-rail-nus"></div></section>' +
      '<section aria-labelledby="ck-rel-h" id="ck-rail-rel-sec" hidden style="padding-bottom:clamp(80px,10vw,140px)"><div class="sh"><h2 class="h2" id="ck-rel-h" style="font-size:clamp(30px,3.2vw,44px)">עוד ' + esc(grp ? decode(grp.name) : 'ספרים') + '</h2>' + railBtns('rel') + '</div><div class="rail-row" id="ck-rail-rel"></div></section>' +
    '</div>';
  }
  /* a product without a price (price 0 / not purchasable) is never added to the cart: the customer asks on WhatsApp */
  const noPrice = () => { const x = cur.vsel || cur.p; const pr = x.prices || {}; const rg = !cur.vsel && pr.price_range; return x.is_purchasable === false || (!rg && !priceOf(pr.price) && !cur.p._carrier); };
  function repaintPurchase() {
    const pr = $('#ck-prow'); if (pr) pr.innerHTML = priceRow();
    const st = $('#ck-stock'); if (st) st.textContent = ((cur.vsel || cur.p).is_in_stock === false) ? 'אזל מהמלאי' : 'במלאי';
    const add = document.querySelector('.ckx-pp #ck-buy [data-ck-add], .ckx-pp [data-ck-add]'); if (add) add.disabled = (cur.vsel || cur.p).is_in_stock === false || noPrice();
    const ask = $('#ck-ask');
    if (noPrice() && add && !ask) add.insertAdjacentHTML('afterend', '<a class="btn solid" id="ck-ask" href="' + waLink('שלום, אשמח לדעת את המחיר של ' + base(cur.p.name) + ' ' + (cur.p.permalink || '')) + '"' + EXTA + '>לבירור מחיר בוואטסאפ' + BI + '</a>');
    if (add) add.style.display = noPrice() ? 'none' : '';
    if (!noPrice() && ask) ask.remove();
    syncQty(); setFbuy();
  }
  async function selectAttr(name, v) {
    pstate.sel[name] = v;
    document.querySelectorAll('[data-ck-attr="' + CSS.escape(name) + '"]').forEach(b => { const on = b.dataset.v === v; b.setAttribute(b.getAttribute('role') === 'radio' ? 'aria-checked' : 'aria-pressed', String(on)); });
    const a = attrsOf(cur.p).find(x => x.name === name); const t = a && a.terms.find(x => decodeURIComponent(x.slug) === v);
    const l = $('#ck-col-cur'); if (l && t && /צבע/.test(name)) l.textContent = t.name;
    const vv = findVar(cur.p);
    if (vv) {
      try { cur.vsel = cur.vcache[vv.id] || (cur.vcache[vv.id] = await api('/products/' + vv.id)); } catch (e) { cur.vsel = null; }
      const im = cur.vsel && cur.vsel.images && cur.vsel.images[0];
      if (im) { const m = $('#ck-gmain'); if (m) m.src = im.src; const i = (cur.p.images || []).findIndex(x => x.id === im.id); if (i >= 0) { pstate.img = i; document.querySelectorAll('[data-ck-img]').forEach(b => b.setAttribute('aria-current', String(+b.dataset.ckImg === i))); } }
    } else cur.vsel = null;
    repaintPurchase();
  }
  function setFbuy() {
    const f = $('#ck-fbuy'); if (!f || !cur) return;
    const p = cur.p; const img = p.images && p.images[0];
    f.innerHTML = '<span class="t">' + (img ? '<img class="pic" src="' + esc(img.thumbnail || img.src) + '" alt="">' : '') + '</span><span class="x"><b>' + esc(base(p.name)) + '</b><span>' + money(unitPrice()) + '</span></span><button class="btn solid" type="button" data-ck-add data-fbuy>הוספה לסל</button>';
  }
  function fbuyWatch() {
    const f = $('#ck-fbuy'); const b = $('#ck-buy'); if (!f || !b) return;
    const r = b.getBoundingClientRect(); const out = r.bottom < 80 || r.top > innerHeight;
    f.classList.toggle('on', out); f.setAttribute('aria-hidden', String(!out)); document.documentElement.classList.toggle('fb-on', out);
  }
  async function addCurrent(btn) {
    const p = cur.p; const attrs = attrsOf(p);
    if (noPrice()) { toast('את המחיר של המוצר הזה מבררים בוואטסאפ'); return; }
    if ((cur.vsel || p).is_in_stock === false) { toast('המוצר אזל מהמלאי'); return; }
    if (attrs.length && !cur.vsel) {
      const miss = attrs.find(a => !pstate.sel[a.name]);
      toast(miss ? 'בחרו ' + (miss.name === 'צבע' ? 'צבע כריכה' : miss.name) + ' לפני ההוספה לסל' : 'השילוב הזה לא זמין');
      const el = document.querySelector('[data-ck-attr="' + CSS.escape((miss || attrs[0]).name) + '"]'); if (el) el.closest('.blk').scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
      return;
    }
    if (ded.mode === 'one' && !(ded.f.n || '').trim()) { toast('כתבו את הנוסח להקדשה'); const i = document.querySelector('[data-ded-fld="n"]'); if (i) i.focus(); return; }
    if (ded.mode === 'names' && !dedNames().length) { toast('כתבו לפחות שם אחד לחריטה'); const i = document.querySelector('[data-ded-n]'); if (i) i.focus(); return; }
    if (btn.dataset.ckBusy) return;
    const undo = [...document.querySelectorAll('.ckx-pp [data-ck-add], #ck-fbuy [data-ck-add]')].map(b => busy(b, 'מוסיף לסל…'));
    btn.disabled = true;
    try {
      const body = { id: cur.vsel ? cur.vsel.id : p.id, quantity: pstate.qty };
      if (cur.vsel) body.variation = attrs.map(a => ({ attribute: a.taxonomy || a.name, value: pstate.sel[a.name] }));
      cartData = await api('/cart/add-item', { method: 'POST', body });
      const note = dedNote();
      if (note) {
        const ids = CFG.dedProduct;
        const dq = ded.mode === 'one' ? 1 : Math.max(dedNames().length, pstate.qty);
        const did = ded.mode === 'one' ? ids.one : ids.names;
        if (did) { try { cartData = await api('/cart/add-item', { method: 'POST', body: { id: did, quantity: dq } }); } catch (e) {} }
        const list = store.get('ck-ded', []).filter(x => !(String(x.id) === String(body.id) && x.text === note));
        list.push({ id: body.id, product: base(p.name), text: note }); store.set('ck-ded', list);
      }
      paintCount(); toast(note ? 'נוסף לסל, עם הקדשה' : 'נוסף לסל', 'check');
      setTimeout(() => open('cart'), 350);
    } catch (e) { toast(e.message && e.message.length < 90 ? decode(e.message) : 'לא הצלחנו להוסיף לסל, נסו שוב'); }
    undo.forEach(f => f());
    btn.disabled = false;
  }
  async function loadRails() {
    const n = cur.n; const p = cur.p; const grp = cur.grp;
    const nusCat = n && (p.categories || []).find(c => nusOfCats([c]) === n && /נוסח|עדות/.test(decode(c.name)) && !/כריכ/.test(decode(c.name)));
    const fill = (id, list) => { const sec = $('#ck-' + id + '-sec'); const row = $('#ck-' + id); const seen = new Set(); const items = list.filter(x => x.id !== p.id && base(x.name) !== base(p.name) && !seen.has(base(x.name)) && seen.add(base(x.name))).slice(0, 10); if (!items.length) return; row.innerHTML = items.map(card).join(''); sec.hidden = false; sec.classList.add('ck-in'); };
    const jobs = [];
    if (nusCat) jobs.push(apiCached('/products?per_page=40&category=' + nusCat.id + '&orderby=popularity').then(list => fill('rail-nus', list.filter(x => { const g = groupOf(x.name); return !grp || !g || g.name !== grp.name; }))).catch(() => {}));
    if (grp) jobs.push(apiCached('/products?per_page=20&orderby=popularity&' + (grp.id ? 'category=' + grp.id : 'search=' + encodeURIComponent(grp.q || grp.name))).then(list => fill('rail-rel', list.filter(x => { const g = groupOf(x.name); return !g || !grp.q || g.name === grp.name; }))).catch(() => {}));
    await Promise.all(jobs);
  }
  const ss = { get(k) { try { const v = sessionStorage.getItem(k); if (!v) return null; const o = JSON.parse(v); return (Date.now() - o.t < 18e4) ? o.v : null; } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, JSON.stringify({ t: Date.now(), v })); } catch (e) {} } };
  async function apiCached(path) { const c = ss.get('ck' + path); if (c) return c; const v = await api(path); ss.set('ck' + path, v); return v; }
  function fromCarrier(rootEl) {
    const q = s => rootEl.querySelector(s);
    const id = parseInt((q('.ckp-id') || {}).textContent || (document.body.className.match(/postid-(\d+)/) || [])[1], 10);
    const cats = [...rootEl.querySelectorAll('.ckp-cats a')].map(a => ({ id: 0, name: a.textContent.trim(), link: a.href }));
    const pt = (q('.ckp-price') || {}).textContent || '';
    const nums = (pt.match(/[\d,.]+/g) || []).map(x => Math.round(parseFloat(x.replace(/,/g, '')) * 100)).filter(x => !isNaN(x));
    const img = q('.ckp-img');
    const h1 = q('h1');
    const canon = document.querySelector('link[rel="canonical"]');
    return { id, name: h1 ? h1.textContent.trim() : '', permalink: (canon && /\/(מוצרים|product)\//.test(decodeURI(canon.href)) ? canon.href : location.href.split('#')[0]),
      prices: { price: String(nums[0] || 0), regular_price: String(nums[0] || 0), price_range: nums.length > 1 ? { min_amount: String(Math.min(...nums)), max_amount: String(Math.max(...nums)) } : null },
      images: img && img.getAttribute('src') ? [{ id: +img.id || 0, src: img.getAttribute('src'), thumbnail: img.getAttribute('src'), alt: img.alt }] : [],
      categories: cats, short_description: (q('.ckp-desc') || {}).innerHTML || '', is_in_stock: true, attributes: [], variations: [], type: nums.length > 1 ? 'variable' : '', _carrier: true };
  }
  const SK = '<div class="blk ck-sk" aria-hidden="true"><span class="ol"><i class="ck-skl" style="width:84px"></i></span><div class="swatches">' + '<i class="ck-skc"></i>'.repeat(6) + '</div></div>';
  function patchFromApi(p) {
    const w = $('.ckx-pp'); if (!w) return;
    const keepImg = pstate.img; cur.p = p;
    cur.n = nusOfCats(p.categories) || cur.n;
    attrsOf(p).forEach(a => { if (!pstate.sel[a.name] && a.terms && a.terms.length) pstate.sel[a.name] = decodeURIComponent(a.terms[0].slug); });
    const g = w.querySelector('.gal'); if (g) { const t = document.createElement('div'); pstate.img = Math.min(keepImg, (p.images || []).length - 1); t.innerHTML = gallery(p); g.replaceWith(t.firstChild); }
    const d = w.querySelector('.desc'); const lines = descLines(p);
    if (lines.length) { const html = lines.map(l => '<li>' + esc(l) + '</li>').join(''); if (d) d.innerHTML = html; else { const pn = w.querySelector('.pnote'); if (pn) pn.insertAdjacentHTML('afterend', '<ul class="desc">' + html + '</ul>'); } }
    const sk = w.querySelector('.ck-sk'); const ab = attrBlocks(p);
    if (sk) { if (ab) sk.outerHTML = ab; else sk.remove(); }
    const wa = w.querySelector('.wa-q'); if (wa) wa.href = waLink('שלום, יש לי שאלה על ' + base(p.name) + ' ' + p.permalink);
    const sh = w.querySelector('.share'); if (sh) { const t = document.createElement('div'); t.innerHTML = shareRow(base(p.name), p.permalink); sh.replaceWith(t.firstChild); }
    const vv = findVar(p); if (vv) selectAttr(attrsOf(p)[0].name, pstate.sel[attrsOf(p)[0].name]); else repaintPurchase();
  }
  /* fetch every variation quietly, one at a time, so choosing a colour is instant */
  async function prefetchVariations(p) {
    const ids = (p.variations || []).map(v => v.id).slice(0, 16);
    for (const id of ids) {
      if (!cur || cur.p.id !== p.id) return;
      if (cur.vcache[id]) continue;
      try { cur.vcache[id] = await api('/products/' + id); } catch (e) { return; }
      await new Promise(r => setTimeout(r, 700));
    }
  }
  async function loadSiblings() {
    const p = cur.p; const b = base(p.name); if (!b) return;
    let res = []; try { res = await apiCached('/products?per_page=20&search=' + encodeURIComponent(b)); } catch (e) { return; }
    const seen = new Set();
    const sibs = [p].concat(res).map(x => Object.assign({}, x, { n: nusOfCats(x.categories) })).filter(x => base(x.name) === b && x.n && !seen.has(x.n) && seen.add(x.n));
    if (sibs.length < 2) return;
    const ord = { ash: 0, sfd: 1, edot: 2 }; sibs.sort((a, c) => ord[a.n] - ord[c.n]); cur.sibs = sibs;
    const html = '<div class="blk ck-in" id="ck-nus-blk"><span class="ol">נוסח <span>' + esc(nusFull(cur.n)) + '</span></span><div class="seg" role="group" aria-label="אותו ספר בנוסח אחר">' + sibs.map(s => '<a href="' + esc(s.permalink) + '"' + (s.id === p.id ? ' aria-current="page"' : '') + '>' + esc(nusName(s.n)) + '</a>').join('') + '</div></div>';
    const anchor = $('.ckx-pp .desc') || $('.ckx-pp .pnote'); if (anchor && !$('#ck-nus-blk')) anchor.insertAdjacentHTML('afterend', html);
  }
  async function initProduct(rootEl) {
    const p0 = fromCarrier(rootEl); if (!p0.id) return;
    const cats = p0.categories;
    const g0 = groupOf(p0.name); const fc = cats.find(c => !nusOfCats([c]) && !/כריכ/.test(c.name));
    const grp = g0 ? { name: g0.name, link: g0.link, id: g0.id, q: g0.q } : (fc ? { name: fc.name, link: fc.link, id: 0, q: '' } : null);
    const bulk = /ברכון|זמירות|תהילים|מזכר/.test(cats.map(c => c.name).join(' ')) || /מזכרת|חתן|בר מצווה/.test(p0.name);
    cur = { p: p0, n: nusOfCats(cats), grp, bulk, sibs: [], vsel: null, vcache: {} };
    const h1 = rootEl.querySelector('h1');
    const h1html = '<h1>' + esc(base(h1 ? h1.textContent : p0.name)) + '</h1>';
    const w = document.createElement('div'); w.className = 'ckx ckx-pp';
    w.innerHTML = viewProduct(h1html).replace('<div class="blk"><span class="ol">הקדשה אישית', SK + '<div class="blk"><span class="ol">הקדשה אישית');
    rootEl.parentNode.insertBefore(w, rootEl); rootEl.classList.add('ckp-done'); fitWrap(w);
    w.querySelectorAll('[data-plate]').forEach(fitPlate);
    repaintPurchase(); setFbuy(); fbuyWatch(); addEventListener('scroll', fbuyWatch, { passive: true }); addEventListener('resize', fbuyWatch);
    let p; try { p = await apiCached('/products/' + p0.id); } catch (e) { const sk = $('.ck-sk'); if (sk) sk.remove(); return; }
    if (cur.grp && !cur.grp.id && !cur.grp.q) { const m = (p.categories || []).find(c => decode(c.name) === cur.grp.name); if (m) cur.grp.id = m.id; }
    patchFromApi(p);
    loadSiblings(); loadRails(); prefetchVariations(p);
  }

  /* ---------- catalog classification (concept tools/build_catalog.py, 1:1) ---------- */
  const NUS_BY_CAT = { 43: 'edot', 80: 'edot', 82: 'edot', 83: 'edot', 84: 'edot', 44: 'ash', 58: 'ash', 60: 'ash', 61: 'ash', 66: 'ash', 62: 'sfd', 59: 'sfd', 63: 'sfd', 64: 'sfd', 65: 'sfd' };
  function cNusach(name, cats) {
    const t = cats.map(c => c.name).join(' ') + ' ' + name;
    if (/אשכנז\s*\/\s*ספרד|אשכנז ספרד/.test(t)) return 'ash-sfd';
    for (const c of cats) if (NUS_BY_CAT[c.id]) return NUS_BY_CAT[c.id];
    if (t.includes('עדות המזרח') || t.includes('ספרדי')) return 'edot';
    if (t.includes('נוסח ספרד')) return 'sfd';
    if (/אשכנז|ליטא/.test(t)) return 'ash';
    return '';
  }
  function cGroup(n, cats) {
    const c = new Set(cats.map(x => x.name));
    if (c.has('ספרי ילדים') || c.has('ילדים בעקבות הפרשה')) return 'kids';
    if (/הגדה|הגדת/.test(n) || c.has('הגדות לפסח')) return 'hagada';
    if (/מגיל/.test(n) || c.has('מגילת אסתר / משלוחי מנות')) return 'megila';
    if (/סליחות/.test(n)) return 'slichot';
    if (/זמירות|שירון|ספר הקידוש|ספרון סדר זמירות/.test(n)) return 'zmirot';
    if (/מחזור/.test(n)) return 'machzor';
    if (/סידור/.test(n)) return 'siddur';
    if (/תהילים|תהלים/.test(n) || c.has('תהילים')) return 'tehilim';
    if (/ברכון|ספרון|בקשות|תחינות|הפרשת חלה|ברכת המזון|נשמת/.test(n) || c.has('ברכונים/מזכרות/בקשות')) return 'birkon';
    if (/חומש|תנ"ך|מקראות/.test(n) || c.has('חומשים') || c.has('ביאורי הפרשה')) return 'chumash';
    /* a new product whose name says nothing still lands where the shop put it */
    const t = cats.map(x => TERM[x.id]).find(Boolean);
    return t ? t[0] : 'limud';
  }
  function cCover(name, cats) {
    const t = cats.map(c => c.name).join(' ') + ' ' + name;
    if (t.includes('דמוי עור') || t.includes('פלקסי')) return 'דמוי עור';
    if (t.includes('כריכת עור') || t.includes('עור אמיתי')) return 'עור';
    if (t.includes('רכה')) return 'כריכה רכה';
    if (t.includes('קשה') || t.includes('עבה')) return 'כריכה קשה';
    return '';
  }
  /* a slim product record, the same fields the concept catalog carries */
  function slim(p) {
    const cats = (p.categories || []).map(c => ({ id: c.id, name: decode(c.name) }));
    const name = decode(p.name); const pr = p.prices || {};
    const im = (p.images && p.images[0]) || null;
    return { id: p.id, name, link: p.permalink, price: priceOf(pr.price), regular: priceOf(pr.regular_price), sale: !!p.on_sale,
      var: p.type === 'variable' || !!p.has_options, stock: p.is_in_stock !== false, img: im ? (im.thumbnail || im.src) : '',
      g: cGroup(name, cats), n: cNusach(name, cats), c: cCover(name, cats), k: cats.map(c => c.id) };
  }

  /* ---------- category view (concept viewCategory, 1:1) ---------- */
  const cbase = p => base(p.name);
  const uniq = list => { const seen = new Set(); return list.filter(p => { const k = p.g + cbase(p); if (seen.has(k)) return false; seen.add(k); return true; }); };
  const fitsNus = (p, k) => !k || k === 'all' || !p.n || p.n === k || (p.n === 'ash-sfd' && (k === 'ash' || k === 'sfd'));
  const menuOf = id => MENU.find(x => x.id === id);
  const MLINK = { siddur: '/?s=%D7%A1%D7%99%D7%93%D7%95%D7%A8&post_type=product', machzor: PC('מחזורים'), tehilim: PC('תהילים'), chumash: PC('חומשים'), limud: PC('ספרים'),
    birkon: PC('ברכונים-מזכרות-בקשות'), zmirot: PC('זמירות-שבת'), hagada: PC('הגדת-פסח'), mazkeret: PC('ברכונים-מזכרות-בקשות') + '?ckv=mazkeret', kids: PC('ספרי-ילדים') };
  const NUSLINK = { siddur: { ash: PC('נוסח-ליטא'), sfd: PC('נוסח-ספרד'), edot: PC('עדות-המזרח') },
    machzor: { ash: '/product-category/' + encodeURIComponent('נוסח-ליטא') + '/' + encodeURIComponent('מחזורים-אשכנז') + '/', sfd: '/product-category/' + encodeURIComponent('נוסח-ספרד') + '/' + encodeURIComponent('מחזורים-ספרד') + '/', edot: '/product-category/' + encodeURIComponent('עדות-המזרח') + '/' + encodeURIComponent('מחזורים-עדות-המזרח') + '/' } };
  const mlink = (id, nus) => (nus && NUSLINK[id] && NUSLINK[id][nus]) || MLINK[id] || '/';
  /* WooCommerce term → concept screen [menu id, nusach, cover] */
  const TERM = { 106: ['machzor'], 66: ['machzor', 'ash'], 65: ['machzor', 'sfd'], 80: ['machzor', 'edot'],
    44: ['siddur', 'ash'], 58: ['siddur', 'ash'], 60: ['siddur', 'ash', 'כריכה קשה'], 61: ['siddur', 'ash', 'עור'],
    62: ['siddur', 'sfd'], 64: ['siddur', 'sfd'], 63: ['siddur', 'sfd', 'כריכה קשה'], 59: ['siddur', 'sfd', 'עור'],
    43: ['siddur', 'edot'], 84: ['siddur', 'edot'], 82: ['siddur', 'edot', 'כריכה קשה'], 83: ['siddur', 'edot', 'עור'],
    114: ['tehilim'], 115: ['tehilim', '', 'עור'], 116: ['tehilim', '', 'כריכה קשה'], 117: ['tehilim', '', 'דמוי עור'], 118: ['tehilim'], 129: ['tehilim'],
    124: ['chumash'], 125: ['chumash'], 126: ['chumash'], 127: ['chumash'], 128: ['chumash'],
    136: ['limud'], 137: ['limud'], 138: ['limud'], 139: ['limud'], 148: ['limud'],
    135: ['birkon'], 154: ['zmirot'], 134: ['hagada'], 133: ['hagada'], 104: ['hagada'], 130: ['kids'] };
  let cstate = { nus: 'all', cover: '', sort: 'rec', shown: 24 }, cview = null;
  const myNus = () => store.get('ck-nus', 'all');

  async function fetchAll(path) {
    const sep = path.includes('?') ? '&' : '?';
    const one = async pg => { const r = await fetch(CFG.api + path + sep + 'per_page=100&page=' + pg, { credentials: 'same-origin' }); if (!r.ok) throw new Error('HTTP ' + r.status); return { list: await r.json(), pages: +(r.headers.get('X-WP-TotalPages') || 1) }; };
    const first = await one(1); let list = first.list;
    /* at most two requests at a time, so the host firewall never sees a burst from one shopper */
    for (let pg = 2; pg <= first.pages; pg += 2) {
      const batch = [one(pg)]; if (pg + 1 <= first.pages) batch.push(one(pg + 1));
      (await Promise.all(batch)).forEach(x => { list = list.concat(x.list); });
    }
    return list;
  }
  /* the two hidden dedication products never show in lists */
  const notDed = p => p.id !== CFG.dedProduct.one && p.id !== CFG.dedProduct.names;
  /* the whole public catalog, like the concept's CATALOG_ALL; cached 20 minutes in this browser */
  let allP = null;
  function loadCatalog() {
    if (allP) return allP;
    /* up to 3 minutes old: use as is. Older: show it at once and refresh in the background, so a change in the shop shows within minutes */
    let c = null; try { c = JSON.parse(localStorage.getItem('ck-cat') || 'null'); } catch (e) {}
    const age = c && c.v && c.v.length ? Date.now() - c.t : Infinity;
    if (age < 18e4) return (allP = Promise.resolve(c.v));
    const net = fetchAll('/products').then(list => { const out = list.filter(notDed).map(slim); try { localStorage.setItem('ck-cat', JSON.stringify({ t: Date.now(), v: out })); } catch (e) {} return out; });
    if (age < 864e5) { net.then(v => { allP = Promise.resolve(v); document.dispatchEvent(new CustomEvent('ck-catalog')); }).catch(() => {}); return (allP = Promise.resolve(c.v)); }
    allP = net;
    allP.catch(() => { allP = null; });
    return allP;
  }
  function sourceOf(v) {
    /* plain categories (sales, dated imports...) come straight from the store: products do not always list them */
    if (v.kind === 'term') { const ck = 'ckt:' + v.term; const c = ss.get(ck); if (c) return Promise.resolve(c); return fetchAll('/products?category=' + v.term).then(l => { const o = l.filter(notDed).map(slim); ss.set(ck, o); return o; }); }
    if (v.kind === 'q') { const ck = 'ckq:' + v.q; const c = ss.get(ck); if (c) return Promise.resolve(c); return fetchAll('/products?search=' + encodeURIComponent(v.q)).then(l => { const o = l.filter(notDed).map(slim); ss.set(ck, o); return o; }); }
    return loadCatalog().then(all => {
      if (v.kind === 'term') return null;
      let src = all.filter(p => v.m.g.includes(p.g));
      if (v.m.id === 'mazkeret') src = src.filter(p => /מזכרת|חתן|בר מצווה|שבע ברכות|ברכון|שירון|ספרון/.test(p.name));
      return src;
    });
  }

  const cpic = (p, alt) => p.img ? '<img class="pic" src="' + esc(p.img) + '" alt="' + esc(alt || '') + '" loading="lazy" draggable="false">' : '<span class="pic" aria-hidden="true"></span>';
  function ccard(p, all, opts) {
    opts = opts || {};
    const short = cbase(p);
    const sibs = p.n ? new Set(all.filter(x => x.g === p.g && x.n && cbase(x) === short).map(x => x.n)).size : 0;
    const nl = !p.n ? '' : (sibs > 1 && (opts.multi || myNus() === 'all')) ? 'זמין ב-' + sibs + ' נוסחים' : nusFull(p.n);
    const mine = opts.nusBadge && myNus() !== 'all' && p.n && fitsNus(p, myNus());
    const badge = p.sale ? '<span class="badge">מבצע</span>' : (mine ? '<span class="badge me">' + ic('nusach') + 'הנוסח שלך</span>' : '');
    return '<div class="pc' + (opts.rv === false ? '' : ' rv') + '"><a href="' + esc(p.link) + '"><div class="pl">' + badge + cpic(p, short) + '</div>' +
      '<div class="meta"><div class="nm">' + esc(short) + '</div>' + (nl ? '<div class="nu">' + esc(nl) + '</div>' : '') +
      '<div class="pr">' + (!p.price && !p.var ? '<span>המחיר בתיאום</span>' : p.sale && p.regular > p.price ? '<span>' + money(p.price) + '</span><s>' + money(p.regular) + '</s>' : '<span>' + money(p.price) + '</span>') + (p.var ? '<span class="k">· כמה אפשרויות</span>' : '') + '</div></div></a>' +
      (p.var || !p.price || p.stock === false ? '<a class="qa" href="' + esc(p.link) + '" aria-label="' + (p.var ? 'בחירת אפשרויות ל' : 'למוצר: ') + esc(short) + '">' + ic('plus') + '</a>' : '<button class="qa" type="button" data-ck-qadd="' + p.id + '" aria-label="הוספה לסל: ' + esc(short) + '">' + ic('plus') + '</button>') + '</div>';
  }
  const crumbs = last => '<nav class="crumbs" aria-label="מיקום באתר"><a href="/">דף הבית</a><span aria-hidden="true">/</span><span aria-current="page">' + esc(last) + '</span></nav>';
  function viewCategory(v, src) {
    const m = v.m; const loadingNow = !src; src = src || [];
    let items = src;
    if (m.nus && cstate.nus !== 'all') items = items.filter(p => fitsNus(p, cstate.nus));
    if (cstate.cover) items = items.filter(p => p.c === cstate.cover);
    items = uniq(items);
    if (cstate.sort === 'low') items = items.slice().sort((a, b) => a.price - b.price);
    if (cstate.sort === 'high') items = items.slice().sort((a, b) => b.price - a.price);
    const nusCount = k => k === 'all' ? uniq(src).length : uniq(src.filter(p => p.n && fitsNus(p, k))).length;
    const covers = [...new Set(src.map(p => p.c).filter(Boolean))];
    const shown = items.slice(0, cstate.shown);
    const keep = m.nus && cstate.nus !== 'all' ? cstate.nus : '';
    const related = MENU.filter(x => x.id !== m.id).slice(0, 8);
    const sk = n => '<span class="k"><i class="ck-skl ck-sk" style="width:16px;height:10px"></i></span>';
    const tiles = uniq(src).filter(x => x.img).slice(0, 4);
    return '<div class="wrap">' +
      '<header class="chead"><div class="cbox"><div>' + crumbs(m.name) +
        '<h1 class="draw" data-draw>' + (v.kind === 'menu' ? ic(m.id) : '') + esc(m.name) + '</h1>' + (m.blurb ? '<p>' + esc(m.blurb) + '</p>' : '') + '</div>' +
        '<div class="ctiles" aria-hidden="true">' + (loadingNow ? '<span class="ct ck-sk"></span>'.repeat(4) : tiles.map(x => '<a class="ct" href="' + esc(x.link) + '" tabindex="-1">' + cpic(x) + '</a>').join('')) + '</div></div></header>' +
      '<div class="smart">' +
        (m.nus ? '<div class="row"><span class="lbl">נוסח</span><div class="seg" role="group" aria-label="בחירת נוסח">' + [{ id: 'all', name: 'כל הנוסחים' }].concat(NUSACH).map(n => '<button type="button" data-ck-nus="' + n.id + '" aria-pressed="' + (cstate.nus === n.id) + '">' + esc(n.name) + (loadingNow ? sk() : '<span class="k">' + nusCount(n.id) + '</span>') + '</button>').join('') + '</div></div>' : '') +
        '<div class="row"><span class="lbl">' + (keep ? 'באותו נוסח, גם' : 'עוברים ל') + '</span><div class="chips">' + related.map(x => '<a class="chip" href="' + esc(mlink(x.id, x.nus ? keep : '')) + '">' + ic(x.id) + esc(x.name) + '</a>').join('') + '</div></div>' +
        '<div class="row">' + (covers.length > 1 ? '<span class="lbl">כריכה</span><div class="chips" role="group" aria-label="סוג כריכה">' + covers.map(c => '<button class="chip" type="button" data-ck-cover="' + esc(c) + '" aria-pressed="' + (cstate.cover === c) + '">' + esc(c) + '</button>').join('') + '</div>' : '') +
        '<label class="sort">מיון<select id="ck-sort"><option value="rec"' + (cstate.sort === 'rec' ? ' selected' : '') + '>מומלצים</option><option value="low"' + (cstate.sort === 'low' ? ' selected' : '') + '>מחיר, מהנמוך</option><option value="high"' + (cstate.sort === 'high' ? ' selected' : '') + '>מחיר, מהגבוה</option></select></label></div>' +
      '</div>' +
      '<p class="count-line" aria-live="polite">' + (loadingNow ? 'טוען מוצרים…' : items.length + ' מוצרים' + (keep ? ' ב' + nusFull(keep) : '')) + '</p>' +
      (loadingNow ? '<div class="grid">' + (v.pre && v.pre.length ? v.pre.map(p => ccard(p, v.pre, { rv: false })).join('') : SKC.repeat(10)) + '</div>' :
      (shown.length ? '<div class="grid">' + shown.map(p => ccard(p, src, { nusBadge: m.nus, multi: cstate.nus === 'all' })).join('') + '</div>' : '<div class="empty"><p>אין כרגע מוצרים שמתאימים לבחירה הזו.</p><button class="btn line" type="button" data-ck-reset>ניקוי הבחירה</button></div>') +
      (items.length > shown.length ? '<div style="text-align:center;padding-bottom:100px;margin-top:-40px"><button class="btn line" type="button" data-ck-more>להציג עוד ' + Math.min(24, items.length - shown.length) + ' מתוך ' + (items.length - shown.length) + '</button></div>' : '')) +
    '</div>';
  }
  const SKC = '<div class="pc ck-sk" aria-hidden="true"><div class="pl"></div><div class="meta"><div class="nm"><i class="ck-skl" style="width:80%"></i></div><div class="pr"><i class="ck-skl" style="width:40px"></i></div></div></div>';

  /* ---------- all products (concept viewAll) ---------- */
  function viewAll(data) {
    const total = data ? data.total : 0;
    return '<div class="wrap"><header class="chead" style="grid-template-columns:1fr"><div>' + crumbs('כל המוצרים') + '<h1>כל המוצרים</h1><p>' + (data ? total + ' מוצרים ב-' + MENU.length + ' קטגוריות.' : 'טוען…') + '</p></div></header>' +
      MENU.map(m => { const it = data ? uniq(m.id === 'mazkeret' ? (data[m.id] || []).filter(p => /מזכרת|חתן|בר מצווה|שבע ברכות/.test(p.name)) : (data[m.id] || [])) : []; return '<section style="padding-bottom:56px"><div class="sh" style="margin-bottom:24px"><h2 class="h3">' + esc(m.name) + ' <span style="color:var(--ink-3);font-size:.6em">' + (data ? (data[m.id] || []).length : '') + '</span></h2><a class="tlink" href="' + esc(mlink(m.id)) + '">לכל ה' + esc(m.name) + ARW + '</a></div><div class="rail-row" id="ck-rail-all-' + m.id + '">' + (data ? it.slice(0, 12).map(p => ccard(p, data[m.id], { rv: false })).join('') : SKC.repeat(6)) + '</div></section>'; }).join('') +
      (data && data.extra ? data.extra.map(x => '<section style="padding-bottom:56px"><div class="sh" style="margin-bottom:24px"><h2 class="h3">' + esc(x.c.name) + ' <span style="color:var(--ink-3);font-size:.6em">' + x.list.length + '</span></h2><a class="tlink" href="' + esc(x.c.path) + '">לכל ' + esc(x.c.name) + ARW + '</a></div><div class="rail-row">' + uniq(x.list).slice(0, 12).map(p => ccard(p, x.list, { rv: false })).join('') + '</div></section>').join('') : '') + '</div>';
  }

  /* the page is drawn edge to edge like the concept: cancel any side padding of the Elementor block it sits in */
  function fitWrap(w) {
    const fit = () => { w.style.marginLeft = w.style.marginRight = ''; const r = w.getBoundingClientRect(); const vw = document.documentElement.clientWidth;
      if (r.left > 0.5 || vw - r.right > 0.5) { w.style.marginLeft = -r.left + 'px'; w.style.marginRight = -(vw - r.right) + 'px'; } };
    fit(); addEventListener('resize', fit, { passive: true });
  }
  /* ---------- reveal (concept reveal(), for the screens the module draws) ---------- */
  let rio = null;
  function reveal(root) {
    if (reduced() || !('IntersectionObserver' in window)) { root.querySelectorAll('.rvimg, [data-draw]').forEach(e => e.classList.add('on')); return; }
    if (!rio) rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('pend'); e.target.classList.add('on'); rio.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    root.querySelectorAll('.rv, .rvimg, [data-draw]').forEach(el => { if (el.dataset.rvd) return; el.dataset.rvd = 1; if (el.classList.contains('rv') && el.getBoundingClientRect().top > innerHeight * .92) el.classList.add('pend'); rio.observe(el); });
    if (!window.ckHio) window.ckHio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('words-in'); window.ckHio.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
    root.querySelectorAll('.h2').forEach(h => { if (h.getBoundingClientRect().top > innerHeight * .9) { splitWords(h); window.ckHio.observe(h); } });
  }
  function splitWords(h) {
    if (h.dataset.split) return; h.dataset.split = '1';
    const walk = n => { [...n.childNodes].forEach(c => { if (c.nodeType === 3) { const frag = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach(t => { if (!t) return; if (/^\s+$/.test(t)) frag.appendChild(document.createTextNode(t)); else { const w = document.createElement('span'); w.className = 'w'; const i = document.createElement('i'); i.textContent = t; w.appendChild(i); frag.appendChild(w); } }); c.replaceWith(frag); } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c); }); };
    walk(h);
  }

  /* ---------- which screen is this archive? ---------- */
  function archiveView(root) {
    const qs = new URLSearchParams(location.search);
    const bc = document.body.className;
    const forced = qs.get('ckv') || (root && root.dataset.ckv);
    const clsCat = root ? ([...root.classList].map(c => (c.match(/^ckc-cat-(\d+)$/) || [])[1]).find(Boolean) || '') : '';
    const termM = (qs.get('ckcat') || (root && root.dataset.ckcat) || clsCat || ((/\btax-product_cat\b/.test(bc) && (bc.match(/(?:^|\s)term-(\d+)(?=\s|$)/) || [])[1]) || ''));
    const term = parseInt(termM, 10) || 0;
    const titleEl = root && root.querySelector('.ckc-h1');
    const title = titleEl ? titleEl.textContent.trim() : '';
    const pre = root ? [...root.querySelectorAll('.ckc-it')].map(fromCarrierItem).filter(p => p.id) : [];
    if (forced === 'all' || (!term && !qs.has('s') && /\bpost-type-archive-product\b/.test(bc))) return { kind: 'all' };
    if (forced && menuOf(forced)) return { kind: 'menu', m: menuOf(forced), nus: '', cover: '', pre };
    if (qs.has('s')) {
      const q = (qs.get('s') || '').trim();
      if (!q) return { kind: 'all' };
      if (/^סידור(ים)?$/.test(q)) return { kind: 'menu', m: menuOf('siddur'), nus: qs.get('nus') || '', cover: '', pre };
      return { kind: 'q', q, m: { id: 'q', name: 'תוצאות חיפוש: ' + q, blurb: '', nus: false }, pre };
    }
    if (TERM[term]) { const t = TERM[term]; return { kind: 'menu', m: menuOf(t[0]), nus: t[1] || '', cover: t[2] || '', pre, term }; }
    if (term) return { kind: 'term', term, m: { id: 't' + term, name: title || 'מוצרים', blurb: '', nus: false }, pre };
    return null;
  }
  function fromCarrierItem(el) {
    const q = s => el.querySelector(s);
    const a = q('.ckc-nm a') || q('a'); const img = q('.ckc-img img') || q('img');
    const cats = [...el.querySelectorAll('.ckc-cats a')].map(x => ({ id: 0, name: x.textContent.trim() }));
    const nums = (((q('.ckc-pr') || {}).textContent || '').match(/[\d,.]+/g) || []).map(x => parseFloat(x.replace(/,/g, ''))).filter(x => !isNaN(x));
    const name = ((q('.ckc-nm') || {}).textContent || '').trim();
    return { id: parseInt((q('.ckc-id') || {}).textContent, 10) || 0, name, link: a ? a.href : '#', price: nums.length ? Math.min(...nums) : 0, regular: nums.length ? Math.max(...nums) : 0, sale: false, var: nums.length > 1, stock: true,
      img: img ? (img.currentSrc || img.getAttribute('src') || '') : '', g: cGroup(name, cats), n: cNusach(name, cats), c: cCover(name, cats) };
  }
  let cwrap = null;
  function paintCat(src) {
    if (!cwrap || !cview) return;
    const y = scrollY;
    cwrap.innerHTML = cview.kind === 'all' ? viewAll(src) : viewCategory(cview, src);
    if (src) { cwrap.classList.remove('ck-loading'); window.scrollTo(0, y); }
    reveal(cwrap);
  }
  async function initArchive(root) {
    cview = archiveView(root); if (!cview) return;
    const qs = new URLSearchParams(location.search);
    if (cview.kind !== 'all') cstate = { nus: cview.m.nus ? (qs.get('nus') || cview.nus || myNus()) : 'all', cover: qs.get('cover') || cview.cover || '', sort: qs.get('sort') || 'rec', shown: 24 };
    cwrap = document.createElement('div'); cwrap.className = 'ckx ckx-pg ckx-cc ck-loading';
    root.parentNode.insertBefore(cwrap, root); root.classList.add('ckc-done'); fitWrap(cwrap);
    paintCat(null);
    if (cview.kind === 'all') {
      const all = await loadCatalog();
      const data = { total: all.length }; MENU.forEach(m => { data[m.id] = all.filter(p => m.g.includes(p.g)); });
      cview.data = data; paintCat(data);
      /* main categories outside the ten groups (sales, new ranges) get their own row, as soon as they have a picture */
      try {
        const extra = (await getCats()).filter(c => !c.p && c.img && c.n > 0 && !TERM[c.id]);
        const rows = [];
        for (const c of extra) { const list = await sourceOf({ kind: 'term', term: c.id }); if (list.length) rows.push({ c, list }); }
        if (rows.length) { data.extra = rows; data.total = all.length; paintCat(data); }
      } catch (e) {}
      return;
    }
    /* first paint fast: one page of this category (≈4s on this server); the full catalog completes the counts right after */
    const fresh = (() => { try { const c = JSON.parse(localStorage.getItem('ck-cat') || 'null'); return c && c.v && c.v.length && Date.now() - c.t < 864e5; } catch (e) { return false; } })();
    if (!fresh && (cview.kind === 'menu' || cview.kind === 'term')) {
      const qp = cview.term ? '/products?category=' + cview.term : (cview.m.id === 'siddur' ? '/products?search=' + encodeURIComponent('סידור') : '');
      if (qp) fetch(CFG.api + qp + '&per_page=100', { credentials: 'same-origin' }).then(r => r.ok ? r.json() : []).then(list => {
        if (cview.src) return;
        const part = list.filter(notDed).map(slim).filter(p => cview.kind === 'term' || cview.m.g.includes(p.g));
        if (part.length) { cview.part = part; paintCat(part); }
      }).catch(() => {});
    }
    try { cview.src = await sourceOf(cview); } catch (e) { cview.src = cview.pre || []; }
    if (cstate.cover && !cview.src.some(p => p.c === cstate.cover)) cstate.cover = '';
    paintCat(cview.src);
  }
  /* the shop changed something since this browser last looked: repaint with the fresh list */
  document.addEventListener('ck-catalog', async () => {
    if (!cview || !cwrap) return;
    try {
      if (cview.kind === 'all') { const all = await loadCatalog(); const data = { total: all.length, extra: cview.data && cview.data.extra }; MENU.forEach(m => { data[m.id] = all.filter(p => m.g.includes(p.g)); }); cview.data = data; return paintCat(data); }
      if (cview.kind === 'menu') { cview.src = await sourceOf(cview); paintCat(cview.src); }
    } catch (e) {}
  });
  function catState() {
    paintCat(cview.kind === 'all' ? cview.data : (cview.src || cview.part));
    const u = new URL(location.href);
    ['nus', 'cover', 'sort'].forEach(k => { const v = cstate[k]; if (v && v !== 'all' && v !== 'rec' && !(k === 'nus' && v === cview.nus) && !(k === 'cover' && v === cview.cover)) u.searchParams.set(k, v); else u.searchParams.delete(k); });
    try { history.replaceState(null, '', u.toString()); } catch (e) {}
  }
  /* warm the cache when someone hovers a category link */
  const warmed = new Set();
  document.addEventListener('pointerover', e => {
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || warmed.has(a.href)) return;
    let u; try { u = new URL(a.href); } catch (er) { return; } if (u.origin !== location.origin) return;
    const path = decodeURIComponent(u.pathname); let id = null;
    if (u.searchParams.get('s') && /^סידור/.test(u.searchParams.get('s'))) id = 'siddur';
    else { const seg = path.split('/').filter(Boolean); if (seg[0] === 'product-category') { const slug = seg[seg.length - 1]; const hit = Object.keys(MLINK).find(k => decodeURIComponent(MLINK[k]).split('?')[0].replace(/\/$/, '').endsWith('/' + slug)); id = hit || null; } }
    if (!id) return; warmed.add(a.href);
    setTimeout(() => loadCatalog().catch(() => {}), 120);
  }, { passive: true });

  async function quickAdd(btn, id) {
    if (btn.dataset.ckBusy) return;
    const undo = busy(btn, '');
    btn.disabled = true;
    try { cartData = await api('/cart/add-item', { method: 'POST', body: { id, quantity: 1 } }); paintCount(); toast('נוסף לסל', 'check'); }
    catch (e) { toast((e.data && e.data.message) ? decode(e.data.message).replace(/<[^>]+>/g, '') : 'לא הצלחנו להוסיף לסל'); }
    undo(); btn.disabled = false;
  }


  /* ---------- content pages (concept viewAbout / viewContact / viewShipping / viewTrack / viewA11y, 1:1) ---------- */
  const ASSET = CFG.asset || 'https://korenzo12.github.io/siddurs-center-preview/';
  const QUOTE = ['מרדכי ב.', 'הזמנה של ספרים לעילוי נשמת אימי האהובה ומשה היה כל כך קשוב, סבלני, מבין… הספרים היו ברמה גבוה העבודה היתה מושלמת… והתמונה באתר של הספרים בדיוק כמו שבמציאות!'];
  const pageHead = (crumb, title, lead) => '<header class="ph-head"><nav class="crumbs" aria-label="מיקום באתר"><a href="/">דף הבית</a><span aria-hidden="true">/</span><span aria-current="page">' + esc(crumb) + '</span></nav><h1>' + esc(title) + '</h1>' + (lead ? '<p class="lead">' + esc(lead) + '</p>' : '') + '</header>';
  const kick2 = t => '<p class="kick">' + esc(t) + '</p>';
  const PAGES = {
    about: () => '<div class="wrap">' + pageHead('אודות', 'מרכז הסידורים', 'חנות ספרי קודש מירושלים: סידורים, מחזורים, תהילים וחומשים בכל הנוסחים, עם הקדשה אישית ושירות של אדם אמיתי שעונה לכם.') +
      '<section class="about-split" style="padding-bottom:clamp(80px,10vw,140px)"><div class="ph rvimg"><img src="' + ASSET + 'gen4/detail-gilt.jpg" alt="פינת סידור בכריכת עור כחולה עם חיתוך דפים מוזהב"></div>' +
        '<div class="rv">' + kick2('מה אנחנו עושים') + '<h2 class="h2">ספר שנפתח כל יום צריך להיות יפה.</h2><p class="lead">אנחנו מביאים סידורים, מחזורים וספרי לימוד בכריכות עור ובמהדורות מהודרות, בכל הנוסחים. לכל ספר אפשר להוסיף הקדשה: לבר מצווה, לחתונה, לעילוי נשמה, או מזכרת בכמות לאירוע.</p><p class="lead">משה, שמנהל את החנות, עונה אישית בוואטסאפ, שולח סקיצה לפני שמתחילים, ודואג שהספרים יגיעו עד הבית.</p></div></section>' +
      '<section class="sec tight" style="padding-top:0"><div class="vals draw" data-draw><div>' + ic('nusach') + '<b>כל הנוסחים</b><p>אשכנז, ספרד ועדות המזרח, ומעבר נוח ביניהם בכל האתר.</p></div><div>' + ic('quill') + '<b>הקדשה מדויקת</b><p>סקיצה לאישור לפני העבודה, כדי שהשם ייצא בדיוק כמו שרציתם.</p></div><div>' + ic('wa') + '<b>אדם אמיתי עונה</b><p>שאלה על ספר, נוסח או הזמנה? כותבים בוואטסאפ ומקבלים תשובה.</p></div></div></section>' +
      '<section class="sec" style="padding-top:0"><blockquote class="pull rv">"' + esc(QUOTE[1]) + '"<cite>' + esc(QUOTE[0]) + ', ביקורת בגוגל</cite></blockquote></section></div>',
    contact: () => '<div class="wrap">' + pageHead('יצירת קשר', 'דברו איתנו.', 'הדרך הכי מהירה היא וואטסאפ. כתבו איזה ספר, באיזה נוסח, איזו הקדשה ואיזו כמות, ונחזור אליכם.') +
      '<div class="cgrid" style="padding-bottom:clamp(80px,10vw,140px)"><div class="ccards draw" data-draw>' +
        '<a class="ccard main" href="' + waLink('שלום, הגעתי מהאתר') + '"' + EXTA + '>' + ic('wa') + '<div><b>וואטסאפ</b><span dir="ltr">' + phoneShow() + '</span><span> · הכי מהיר</span></div></a>' +
        '<a class="ccard" href="' + telHref() + '">' + ic('phone') + '<div><b>טלפון</b><span dir="ltr">' + phoneShow() + '</span></div></a>' +
        '<a class="ccard" href="mailto:' + esc(CFG.mail) + '">' + ic('mail') + '<div><b>מייל</b><span>' + esc(CFG.mail) + '</span></div></a>' +
        '<a class="ccard" href="https://telegram.me/share/url?url=https%3A%2F%2Fsiddurs-center.co.il%2F&amp;text=%D7%9E%D7%A8%D7%9B%D7%96%20%D7%94%D7%A1%D7%99%D7%93%D7%95%D7%A8%D7%99%D7%9D"' + EXTA + '>' + ic('tg') + '<div><b>טלגרם</b><span>שיתוף האתר עם חברים ומשפחה</span></div></a>' +
        '<a class="ccard" href="/my-account/orders/">' + ic('truck') + '<div><b>ההזמנות שלי</b><span>סטטוס ההזמנה בחשבון שלכם באתר</span></div></a>' +
      '</div>' +
      '<form class="form rv" data-ck-form novalidate><h2>השאירו הודעה</h2>' +
        '<div class="row2"><div class="fld"><label for="f-n">שם</label><input id="f-n" name="n" autocomplete="name" required></div><div class="fld"><label for="f-p">טלפון</label><input id="f-p" name="p" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" required></div></div>' +
        '<div class="fld"><label for="f-t">במה נוכל לעזור?</label><select id="f-t" name="t"><option>שאלה על ספר</option><option>הקדשה אישית</option><option>מזכרות בכמות לאירוע</option><option>הזמנה קיימת</option></select></div>' +
        '<div class="fld"><label for="f-m">הודעה</label><textarea id="f-m" name="m"></textarea><small>נחזור אליכם בוואטסאפ או בטלפון.</small></div>' +
        '<button class="btn solid" type="submit">שליחה' + BI + '</button></form></div></div>',
    shipping: () => '<div class="wrap">' + pageHead('משלוחים והחזרות', 'מההזמנה עד הבית.', 'משלוח חינם בהזמנה מעל ' + freeTxt() + ', לכל הארץ. ככה זה עובד, צעד אחרי צעד.') +
      '<ol class="tl draw" data-draw style="padding-block:clamp(20px,4vw,48px) clamp(64px,8vw,110px)"><li><span class="dotc">' + ic('bag') + '</span><b>מזמינים</b><p>באתר או בוואטסאפ. מקבלים אישור עם מספר הזמנה.</p></li><li><span class="dotc">' + ic('quill') + '</span><b>מאשרים סקיצה</b><p>אם יש הקדשה, שולחים לכם סקיצה לאישור לפני העבודה.</p></li><li><span class="dotc">' + ic('mazkeret') + '</span><b>אורזים</b><p>הספרים נבדקים ונארזים בקפידה.</p></li><li><span class="dotc">' + ic('truck') + '</span><b>מגיע עד הבית</b><p>מקבלים הודעה כשהמשלוח יוצא, עם מספר מעקב.</p></li></ol>' +
      '<section class="faq" style="padding-bottom:clamp(80px,10vw,140px)"><h2 class="h2" style="margin-bottom:24px">שאלות נפוצות</h2>' +
        '<details class="acc"><summary>כמה זמן לוקח משלוח?' + ic('plus') + '</summary><div class="ab">זמן האספקה מאושר בהזמנה. הזמנה עם הקדשה לוקחת מעט יותר, ולכן לאירוע כדאי להזמין מראש ולציין את התאריך.</div></details>' +
        '<details class="acc"><summary>יש לי אירוע בתאריך מסוים. מה עושים?' + ic('plus') + '</summary><div class="ab">כותבים את תאריך האירוע בהזמנה או בוואטסאפ, ואנחנו מאשרים מראש אם אפשר לעמוד בו.</div></details>' +
        '<details class="acc"><summary>אפשר להזמין בכמות גדולה?' + ic('plus') + '</summary><div class="ab">כן. ברכונים, תהילים, בקשות ומזכרות בכמויות לאירועים, אזכרות, שבתות חתן, בר מצווה, חתונות ומוסדות, עם הנחה לכמות.</div></details>' +
        '<details class="acc"><summary>אפשר להחזיר ספר?' + ic('plus') + '</summary><div class="ab">ספר בלי הקדשה אפשר להחזיר לפי <a href="/terms/" style="text-decoration:underline;text-underline-offset:3px">תקנון האתר</a>. ספר עם הקדשה מיוצר במיוחד בשבילכם, ולכן לא ניתן להחזיר אותו, אלא אם יש בו פגם.</div></details>' +
        '<p class="lead" style="margin-top:28px">התנאים המלאים למשלוחים, לביטול עסקה ולהחזרות מופיעים ב<a href="/terms/" style="text-decoration:underline;text-underline-offset:3px">תקנון האתר</a>.</p>' +
      '</section></div>',
    track: () => '<div class="wrap">' + pageHead('מעקב הזמנה', 'איפה ההזמנה שלי?', 'מכניסים את מספר ההזמנה והטלפון שהזמנתם איתו, ורואים באיזה שלב היא.') +
      '<form class="form track rv" data-ck-track novalidate style="margin-bottom:clamp(80px,10vw,140px)"><div class="fld"><label for="t-o">מספר הזמנה</label><input id="t-o" inputmode="numeric" dir="ltr" placeholder="לדוגמה 18452" required></div><div class="fld"><label for="t-p">טלפון</label><input id="t-p" type="tel" inputmode="tel" dir="ltr" autocomplete="tel" required></div><button class="btn solid" type="submit">בדיקת סטטוס' + BI + '</button><div id="t-res" aria-live="polite"></div></form></div>',
    a11y: () => {
      const sec = (t, body) => '<section class="a11y-sec"><h2 class="h3">' + esc(t) + '</h2>' + body + '</section>';
      const p = t => '<p class="lead">' + t + '</p>';
      return '<div class="wrap ckx-a11y" style="padding-block:calc(var(--ut) + 140px) 140px;max-width:860px">' +
        '<nav class="crumbs" aria-label="מיקום באתר"><a href="/">דף הבית</a><span aria-hidden="true">/</span><span aria-current="page">הצהרת נגישות</span></nav>' +
        '<h1 class="h2">הצהרת נגישות</h1>' +
        p('במרכז הסידורים אנו רואים חשיבות רבה במתן שירות שוויוני, מכבד ונגיש לכלל לקוחותינו, לרבות אנשים עם מוגבלויות.') +
        p('אנו פועלים לשיפור חוויית הגלישה באתר ולאפשר לכל אדם ליהנות ממגוון המוצרים והשירותים שאנו מציעים, הכוללים סידורים, ספרי תהילים, מחזורים, ברכונים וספרי קודש.') +
        sec('נגישות אתר האינטרנט', p('כתובת האתר: <span dir="ltr">https://siddurs-center.co.il</span>') + p('אנו שואפים להתאים את האתר לדרישות תקן ישראלי 5568 ולהנחיות הנגישות הבינלאומיות WCAG 2.1 ברמה AA.') + p('במסגרת מאמצי הנגישות אנו פועלים לקידום הנושאים הבאים:') +
          '<ul class="a11y-list">' + ['ניווט נוח וברור בין עמודי האתר.', 'התאמת האתר לצפייה במחשבים, בטאבלטים ובטלפונים ניידים.', 'שימוש בטקסטים ברורים וקריאים.', 'שיפור ניגודיות הצבעים וקריאות התכנים.', 'התאמת רכיבי האתר לשימוש באמצעות מקלדת.', 'שיפור התאימות לטכנולוגיות מסייעות ולקוראי מסך.', 'הנגשת טפסי יצירת קשר והזמנה.'].map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
          p('מצב הנגישות בפועל: באתר קיים תפריט נגישות להגדלת טקסט, לניגודיות ולהדגשת קישורים. ניתן לנווט באתר באמצעות המקלדת, האתר מותאם לטלפונים ניידים, ומי שהגדיר במכשיר הפחתת תנועה מקבל את האתר בלי אנימציות.')) +
        sec('סייגים לנגישות', p('ייתכן שחלקים מסוימים באתר עדיין אינם נגישים באופן מלא. אנו פועלים לאיתור קשיי נגישות ולשיפורם בהתאם לצורך.') + p('אם נתקלתם בקושי בגלישה, בקריאת התכנים או בביצוע הזמנה, נשמח לסייע ולספק חלופה נגישה ככל האפשר.')) +
        sec('הסדרי נגישות השירות', p('השירות ניתן באמצעות האתר, בוואטסאפ ובטלפון, וההזמנות נשלחות עד הבית. איסוף עצמי בירושלים אפשרי בתיאום מראש.')) +
        sec('יצירת קשר בנושא נגישות', p('אם נתקלתם בבעיית נגישות באתר, ניתן לפנות אלינו באמצעות פרטי ההתקשרות הבאים:') +
          '<ul class="a11y-list a11y-contact"><li><b>שם העסק:</b> מרכז הסידורים</li><li><b>אתר האינטרנט:</b> <span dir="ltr">https://siddurs-center.co.il</span></li><li><b>טלפון:</b> <a href="tel:+972526845740" dir="ltr">052-6845740</a></li><li><b>דוא״ל:</b> <a href="mailto:Moses024@gmail.com" dir="ltr">Moses024@gmail.com</a></li><li><b>איש קשר בנושא נגישות:</b> משה</li></ul>' +
          p('בפנייה מומלץ לציין את תיאור הבעיה, כתובת העמוד שבו נתקלתם בקושי וסוג המכשיר או הדפדפן שבו השתמשתם.') + p('אנו נעשה מאמץ לטפל בפניות ולספק מענה נגיש ומכבד.')) +
        sec('עדכון ההצהרה', p('תאריך עדכון אחרון: 19.10.2026') + p('ההצהרה תעודכן בהתאם לשינויים ולהתאמות הנגישות שיבוצעו באתר.')) +
        '<p style="margin-top:32px"><a class="btn line" href="/">חזרה לדף הבית</a></p></div>';
    }
  };
  /* ---------- content pages read their words from the page itself ----------
     the shop edits headings and paragraphs in Elementor; the design is built around them in order:
     h1 + paragraph = page head, h3 = small label or a step/value title, h2 = a section, a paragraph starting with "•" = a list item.
     Anything added that has no special place is shown at the end, in the same type. The amount in "משלוח חינם ... ₪" always follows the site setting. */
  const freeFix = h => h.replace(/(משלוח חינם[^\d<]{0,30})\d[\d,]*(\s*(?:₪|ש״ח|ש"ח))/g, (m, a, b) => a + CFG.free.toLocaleString('he-IL') + b);
  /* Elementor drops dir="ltr": web addresses, phones and mail read left to right again */
  const ltrFix = h => h.replace(/<a (?![^>]*dir=)([^>]*href="(?:tel:|mailto:|https?:)[^"]*")/g, '<a dir="ltr" $1').replace(/<span>(https?:\/\/[^<]+)<\/span>/g, '<span dir="ltr">$1</span>');
  function carrierBlocks(root) {
    return [...root.querySelectorAll('h1,h2,h3,h4,p,img')].map(e => e.tagName === 'IMG' ? { t: 'img', src: e.currentSrc || e.getAttribute('src') || '', alt: e.getAttribute('alt') || '' }
      : { t: e.tagName.toLowerCase().replace('h4', 'h3'), h: ltrFix(freeFix(e.innerHTML.trim())), x: freeFix(e.textContent.trim()) }).filter(b => b.t === 'img' ? b.src : b.x);
  }
  const VAL_IC = ['nusach', 'quill', 'wa', 'truck', 'bag', 'mazkeret'], STEP_IC = ['bag', 'quill', 'mazkeret', 'truck'];
  const isLi = b => b.t === 'p' && /^[•·*-]\s/.test(b.x);
  const liH = b => b.h.replace(/^\s*[•·*-]\s*/, '');
  function restHtml(rest) {
    let out = '', ul = [];
    const flush = () => { if (ul.length) { out += '<ul class="a11y-list">' + ul.map(b => '<li>' + liH(b) + '</li>').join('') + '</ul>'; ul = []; } };
    rest.forEach(b => { if (isLi(b)) return ul.push(b); flush();
      out += b.t === 'h2' ? '<h2 class="h2" style="margin-top:40px">' + b.h + '</h2>' : b.t === 'h3' ? '<h3 class="h3" style="margin-top:28px">' + b.h + '</h3>' : b.t === 'img' ? '<div class="ph rvimg" style="margin-top:28px"><img src="' + esc(b.src) + '" alt="' + esc(b.alt) + '"></div>' : '<p class="lead">' + b.h + '</p>'; });
    flush();
    return out ? '<section class="sec" style="padding-top:0">' + out + '</section>' : '';
  }
  const LIVE = {
    about: B => {
      let i = 0; const nx = t => B[i] && B[i].t === t ? B[i++] : null;
      const h1 = nx('h1'); if (!h1) return null; const lead = nx('p');
      let img = null, kick = null, h2 = null; const leads = [], vals = [], rest = [];
      while (i < B.length) {
        const b = B[i++];
        if (b.t === 'img' && !img) { img = b; continue; }
        if (b.t === 'h3' && !h2 && B[i] && B[i].t === 'h2') { kick = b; continue; }
        if (b.t === 'h2' && !h2) { h2 = b; while (B[i] && B[i].t === 'p') leads.push(B[i++]); continue; }
        if (b.t === 'h3' && h2 && !rest.length) { vals.push({ b, p: B[i] && B[i].t === 'p' ? B[i++] : null }); continue; }
        rest.push(b);
      }
      return '<div class="wrap">' + pageHead('אודות', h1.x, lead ? lead.x : '') +
        '<section class="about-split" style="padding-bottom:clamp(80px,10vw,140px)"><div class="ph rvimg"><img src="' + esc(img ? img.src : ASSET + 'gen4/detail-gilt.jpg') + '" alt="' + esc(img ? img.alt : 'פינת סידור בכריכת עור כחולה עם חיתוך דפים מוזהב') + '"></div>' +
        '<div class="rv">' + (kick ? kick2(kick.x) : '') + (h2 ? '<h2 class="h2">' + h2.h + '</h2>' : '') + leads.map(p => '<p class="lead">' + p.h + '</p>').join('') + '</div></section>' +
        (vals.length ? '<section class="sec tight" style="padding-top:0"><div class="vals draw" data-draw>' + vals.map((v, k) => '<div>' + ic(VAL_IC[k % VAL_IC.length]) + '<b>' + v.b.h + '</b>' + (v.p ? '<p>' + v.p.h + '</p>' : '') + '</div>').join('') + '</div></section>' : '') +
        restHtml(rest) +
        '<section class="sec" style="padding-top:0"><blockquote class="pull rv">"' + esc(QUOTE[1]) + '"<cite>' + esc(QUOTE[0]) + ', ביקורת בגוגל</cite></blockquote></section></div>';
    },
    contact: B => {
      let i = 0; const nx = t => B[i] && B[i].t === t ? B[i++] : null;
      const h1 = nx('h1'); if (!h1) return null; const lead = nx('p'); const ft = nx('h2');
      const old = PAGES.contact();
      const head = pageHead('יצירת קשר', h1.x, lead ? lead.x : '');
      return old.replace(/<header class="ph-head">[\s\S]*?<\/header>/, head).replace('<h2>השאירו הודעה</h2>', '<h2>' + (ft ? ft.h : 'השאירו הודעה') + '</h2>').replace(/<\/div>$/, restHtml(B.slice(i)) + '</div>');
    },
    shipping: B => {
      let i = 0; const nx = t => B[i] && B[i].t === t ? B[i++] : null;
      const h1 = nx('h1'); if (!h1) return null; const lead = nx('p');
      const steps = [], faq = [], close = []; let fh = null; const rest = [];
      while (B[i] && B[i].t === 'h3') { const b = B[i++]; steps.push({ b, p: B[i] && B[i].t === 'p' ? B[i++] : null }); }
      if (B[i] && B[i].t === 'h2') { fh = B[i++]; while (B[i] && B[i].t === 'h3') { const b = B[i++]; faq.push({ b, p: B[i] && B[i].t === 'p' ? B[i++] : null }); } while (B[i] && B[i].t === 'p') close.push(B[i++]); }
      while (i < B.length) rest.push(B[i++]);
      const AL = 'text-decoration:underline;text-underline-offset:3px';
      const ln = h => h.replace(/<a (?![^>]*style=)/g, '<a style="' + AL + '" ');
      return '<div class="wrap">' + pageHead('משלוחים והחזרות', h1.x, lead ? lead.x : '') +
        (steps.length ? '<ol class="tl draw" data-draw style="padding-block:clamp(20px,4vw,48px) clamp(64px,8vw,110px)">' + steps.map((s, k) => '<li><span class="dotc">' + ic(STEP_IC[k % STEP_IC.length]) + '</span><b>' + s.b.h + '</b>' + (s.p ? '<p>' + s.p.h + '</p>' : '') + '</li>').join('') + '</ol>' : '') +
        (fh ? '<section class="faq" style="padding-bottom:clamp(80px,10vw,140px)"><h2 class="h2" style="margin-bottom:24px">' + fh.h + '</h2>' +
          faq.map(q => '<details class="acc"><summary>' + q.b.h + ic('plus') + '</summary><div class="ab">' + (q.p ? ln(q.p.h) : '') + '</div></details>').join('') +
          close.map((p, k) => '<p class="lead"' + (k ? '' : ' style="margin-top:28px"') + '>' + ln(p.h) + '</p>').join('') + '</section>' : '') +
        restHtml(rest) + '</div>';
    },
    a11y: B => {
      let i = 0; const nx = t => B[i] && B[i].t === t ? B[i++] : null;
      const h1 = nx('h1'); if (!h1) return null;
      const body = list => { let out = '', ul = []; const flush = (c) => { if (ul.length) { out += '<ul class="a11y-list' + (ul.some(b => /<b>|<strong>/.test(b.h)) ? ' a11y-contact' : '') + '">' + ul.map(b => '<li>' + liH(b) + '</li>').join('') + '</ul>'; ul = []; } };
        list.forEach(b => { if (isLi(b)) return ul.push(b); flush(); out += b.t === 'h3' ? '<h3 class="h3">' + b.h + '</h3>' : b.t === 'img' ? '' : '<p class="lead">' + b.h + '</p>'; }); flush(); return out; };
      const intro = []; while (B[i] && B[i].t !== 'h2') intro.push(B[i++]);
      let secs = '';
      while (i < B.length) { const h = B[i++]; const inner = []; while (B[i] && B[i].t !== 'h2') inner.push(B[i++]); secs += '<section class="a11y-sec"><h2 class="h3">' + h.h + '</h2>' + body(inner) + '</section>'; }
      return '<div class="wrap ckx-a11y" style="padding-block:calc(var(--ut) + 140px) 140px;max-width:860px">' +
        '<nav class="crumbs" aria-label="מיקום באתר"><a href="/">דף הבית</a><span aria-hidden="true">/</span><span aria-current="page">' + esc(h1.x) + '</span></nav>' +
        '<h1 class="h2">' + h1.h + '</h1>' + body(intro) + secs +
        '<p style="margin-top:32px"><a class="btn line" href="/">חזרה לדף הבית</a></p></div>';
    }
  };
  function initPage(root) {
    const key = [...root.classList].map(c => (c.match(/^ckpg-(\w+)$/) || [])[1]).find(Boolean);
    if (!key || !PAGES[key]) return;
    const w = document.createElement('div'); w.className = 'ckx ckx-pg ckx-page';
    let html = null;
    try { const B = carrierBlocks(root); if (LIVE[key]) html = LIVE[key](B); } catch (e) { html = null; }
    w.innerHTML = html || PAGES[key](); w.dataset.ckSrc = html ? 'page' : 'built';
    window.__ckDiag = { page: () => ({ live: LIVE[key] ? LIVE[key](carrierBlocks(root)) : '', built: PAGES[key]() }) };
    root.parentNode.insertBefore(w, root); root.classList.add('ckpg-done'); fitWrap(w); reveal(w);
  }
  document.addEventListener('submit', e => {
    const f = e.target; if (!f.matches('[data-ck-form], [data-ck-track]')) return; e.preventDefault();
    const bad = [...f.querySelectorAll('[required]')].filter(x => !x.value.trim());
    f.querySelectorAll('[aria-invalid]').forEach(x => x.removeAttribute('aria-invalid'));
    if (bad.length) { bad.forEach(x => x.setAttribute('aria-invalid', 'true')); bad[0].focus(); toast('חסר: ' + bad.map(x => f.querySelector('label[for="' + x.id + '"]').textContent).join(', ')); return; }
    const v = id => (f.querySelector('#' + id) || {}).value || '';
    if (f.hasAttribute('data-ck-track')) {
      window.open(waLink('שלום, אשמח לדעת מה מצב ההזמנה שלי. מספר הזמנה: ' + v('t-o').trim() + ', טלפון: ' + v('t-p').trim()), '_blank', 'noopener');
      $('#t-res').innerHTML = '<p class="lead" style="margin-top:6px">פתחנו לכם וואטסאפ עם מספר ההזמנה. משה עונה ומעדכן באיזה שלב ההזמנה: התקבלה, בהקדשה או נשלחה, עם מספר מעקב.</p>'; return;
    }
    window.open(waLink(v('f-t') + '\nשם: ' + v('f-n').trim() + '\nטלפון: ' + v('f-p').trim() + (v('f-m').trim() ? '\n' + v('f-m').trim() : '')), '_blank', 'noopener');
    toast('פתחנו וואטסאפ עם ההודעה שלכם', 'check');
  });


  /* ---------- home page: the dedication studio and the hero controls, 1:1 from the concept ---------- */
  function initHomeDed() {
    const sec = document.getElementById('engrave'); if (!sec) return;
    let col = sec.querySelector('[data-interaction-id="2ed35a14"]');
    if (!col) { const t = [...sec.querySelectorAll('p, span')].find(x => /לשליחת פרטי ההקדשה/.test(x.textContent)); col = t && t.closest('.e-con') && t.closest('.e-con').parentElement; }
    if (!col || col.querySelector('.ckx-dedhome')) return;
    col.innerHTML = '<div class="ckx ckx-dedhome">' + dedBlock('ded-home') + '</div>';
    col.querySelectorAll('[data-plate]').forEach(fitPlate);
  }
  let hsT = null, hsI = 0, hsPaused = false, hs = null; const HS_DUR = 7000;
  function hsGo(i) {
    if (!hs) return;
    hsI = (i + hs.slides.length) % hs.slides.length;
    hs.slides.forEach((c, k) => { c.getAnimations().forEach(a => a.cancel()); c.style.opacity = k === hsI ? '1' : '0'; c.style.zIndex = k === hsI ? '2' : '1'; c.style.pointerEvents = k === hsI ? 'auto' : 'none'; c.setAttribute('aria-hidden', String(k !== hsI)); c.tabIndex = k === hsI ? 0 : -1; });
    hs.nav.querySelectorAll('.hc-dots button').forEach((b, k) => b.setAttribute('aria-current', String(k === hsI)));
    hs.live.textContent = 'שקופית ' + (hsI + 1) + ' מתוך ' + hs.slides.length;
    hsPlay();
  }
  function hsPlay() {
    if (!hs) return;
    clearTimeout(hsT); hs.nav.classList.remove('play'); void hs.nav.offsetWidth;
    if (hsPaused || hs.hover || reduced() || document.hidden) return;
    hs.nav.style.setProperty('--dur', HS_DUR + 'ms'); hs.nav.classList.add('play');
    hsT = setTimeout(() => hsGo(hsI + 1), HS_DUR);
  }
  function initHomeHero() {
    const track = document.querySelector('[data-interaction-id="70496405"]'); if (!track || hs) return;
    const slides = [...track.children].filter(c => c.matches('a, .e-con') && !c.matches('[data-interaction-id="41f7dffc"]') && c.querySelector('img'));
    if (slides.length < 2) return;
    const old = document.querySelector('[data-interaction-id="41f7dffc"]'); if (old) old.style.display = 'none';
    const w = document.createElement('div'); w.className = 'ckx ck-hcnav';
    w.innerHTML = '<div class="hc-nav"><button class="rb" type="button" data-ck-hs="prev" aria-label="השקופית הקודמת">' + ic('prev') + '</button><div class="hc-dots" role="tablist" aria-label="בחירת שקופית">' +
      slides.map((s, i) => '<button type="button" role="tab" data-ck-slide="' + i + '" aria-label="שקופית ' + (i + 1) + '" aria-current="' + (i === 0) + '"><span class="b"><i></i></span></button>').join('') +
      '</div><button class="rb" type="button" data-ck-hs="next" aria-label="השקופית הבאה">' + ic('next') + '</button><button class="rb" type="button" data-ck-hs-pause aria-label="עצירת ההחלפה האוטומטית">' + ic('pause') + '</button></div><p class="sr" aria-live="polite"></p>';
    track.appendChild(w);
    slides.forEach(c => { c.style.transition = 'opacity .9s cubic-bezier(.32,.72,0,1)'; });
    hs = { track, slides, nav: w, live: w.querySelector('.sr'), hover: false };
    w.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hs.hover = true; hsPlay(); } });
    w.addEventListener('pointerleave', () => { hs.hover = false; hsPlay(); });
    w.addEventListener('focusin', e => { if (e.target.matches(':focus-visible')) { hs.hover = true; hsPlay(); } });
    w.addEventListener('focusout', () => { hs.hover = false; hsPlay(); });
    track.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { e.preventDefault(); hsGo(hsI + 1); } if (e.key === 'ArrowRight') { e.preventDefault(); hsGo(hsI - 1); } });
    let x0 = null, y0 = 0;
    track.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { x0 = e.clientX; y0 = e.clientY; } }, { passive: true });
    track.addEventListener('pointerup', e => { if (x0 === null) return; const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) hsGo(hsI + (dx > 0 ? 1 : -1)); });
    document.addEventListener('visibilitychange', hsPlay);
    hsGo(0);
  }
  /* ---------- events ---------- */
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.matches('[data-ded-fld]')) { ded.f[t.dataset.dedFld] = t.value; refreshFoil(); }
    if (t.matches('[data-ded-n]')) { ded.names = t.value; const c = document.getElementById(t.id + 'c'); if (c) c.textContent = namesInfo(); const n = dedNames().length; const q = $('#ck-qty'); if (q && n) { pstate.qty = n; q.value = n; } refreshFoil(); }
    if (t.id === 'ck-qty') { pstate.qty = Math.max(1, Math.min(999, parseInt(t.value, 10) || 1)); syncQty(true); }
  });
  document.addEventListener('click', e => {
    const t = e.target.closest('button, a, [data-ck-close]'); if (!t) return;
    const d = t.dataset;
    // header / tab bar hooks: cart + search open the concept overlays
    if (t.matches('a[href*="/cart"]') && !t.closest('#ck-ov') && !e.metaKey && !e.ctrlKey) { e.preventDefault(); return open('cart'); }
    /* only the bare search link (empty query) opens the search; links like "?s=סידור" are real listings */
    if (t.matches('a[href*="?s="]') && !t.closest('#ck-ov') && !e.metaKey && !e.ctrlKey) { let q = null; try { q = new URL(t.href, location.href).searchParams.get('s'); } catch (er) {} if (!q) { e.preventDefault(); return open('search'); } }
    if (d.ckClose !== undefined) { if (t.tagName === 'BUTTON') e.preventDefault(); return closeAll(); }
    if (d.ckSug) { $('#ck-q').value = d.ckSug; return renderSearch(d.ckSug); }
    if (d.ckCq) return setQty(d.ckCq, +d.q);
    if (d.ckCopy) { const done = () => toast('הקישור הועתק', 'check'); if (navigator.clipboard) navigator.clipboard.writeText(d.ckCopy).then(done, done); else done(); return; }
    if (d.ckRail) { const r = $('#ck-' + 'rail-' + d.ckRail); const c = r && r.firstElementChild; const step = c ? c.getBoundingClientRect().width + 18 : 300; if (r) r.scrollBy({ left: -step * (+d.dir), behavior: reduced() ? 'auto' : 'smooth' }); return; }
    if (d.ckQadd) return quickAdd(t, +d.ckQadd);
    if (cview) {
      if (d.ckNus) { cstate.nus = d.ckNus; cstate.shown = 24; return catState(); }
      if (d.ckCover !== undefined) { cstate.cover = cstate.cover === d.ckCover ? '' : d.ckCover; cstate.shown = 24; return catState(); }
      if (d.ckReset !== undefined) { cstate = { nus: 'all', cover: '', sort: 'rec', shown: 24 }; return catState(); }
      if (d.ckMore !== undefined) { cstate.shown += 24; return catState(); }
    }
    if (d.dedMode) { ded.mode = d.dedMode; redrawDed(); const b = document.querySelector('[data-ded-mode="' + ded.mode + '"]'); if (b) b.focus(); return; }
    if (d.dedTpl) { ded.tpl = d.dedTpl; redrawDed(); const b = document.querySelector('[data-ded-tpl="' + ded.tpl + '"]'); if (b) b.focus(); return; }
    if (d.dedC) { ded.c = d.dedC; refreshFoil(); document.querySelectorAll('[data-ded-c]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.dedC === ded.c))); return; }
    if (d.ckHs) return hsGo(hsI + (d.ckHs === 'next' ? 1 : -1));
    if (d.ckSlide !== undefined) return hsGo(+d.ckSlide);
    if (d.ckHsPause !== undefined) { hsPaused = !hsPaused; t.innerHTML = ic(hsPaused ? 'play' : 'pause'); t.setAttribute('aria-label', hsPaused ? 'הפעלת ההחלפה האוטומטית' : 'עצירת ההחלפה האוטומטית'); return hsPlay(); }
    if (!cur) return;
    if (d.qc) { pstate.qty = +d.qc; syncQty(); return; }
    if (d.ckImg !== undefined) { pstate.img = +d.ckImg; document.querySelectorAll('[data-ck-img]').forEach(b => b.setAttribute('aria-current', String(b.dataset.ckImg === d.ckImg))); const im = cur.p.images[+d.ckImg]; if (im) $('#ck-gmain').src = im.src; return; }
    if (t.id === 'ck-gzoom') { t.classList.toggle('zoom'); t.setAttribute('aria-label', t.classList.contains('zoom') ? 'הקטנת התמונה' : 'הגדלת התמונה'); return; }
    if (d.ckQ !== undefined) { pstate.qty = Math.max(1, pstate.qty + +d.ckQ); syncQty(); return; }
    if (d.ckAttr) return selectAttr(d.ckAttr, d.v);
    if (d.ckAdd !== undefined) return addCurrent(t);
  });
  document.addEventListener('change', e => { if (e.target.id === 'ck-sort' && cview) { cstate.sort = e.target.value; catState(); } });
  document.addEventListener('pointermove', e => { const z = e.target.closest && e.target.closest('#ck-gzoom.zoom'); if (!z) return; const r = z.getBoundingClientRect(); const pc = z.querySelector('.pic'); if (pc) pc.style.transformOrigin = ((e.clientX - r.left) / r.width * 100).toFixed(1) + '% ' + ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%'; });

  /* ---------- checkout: the dedication goes into the order notes ---------- */
  function shopHead() {
    const b = document.body.classList; if (!(b.contains('woocommerce-checkout') || b.contains('woocommerce-cart')) || b.contains('woocommerce-order-received') || $('.ckx-shophead')) return;
    const wg = document.querySelector('.elementor-widget-woocommerce-checkout-page, .elementor-widget-woocommerce-cart'); if (!wg) return;
    const co = b.contains('woocommerce-checkout');
    const h = document.createElement('div'); h.className = 'ckx ckx-pg ckx-shophead';
    h.innerHTML = '<div class="wrap">' + pageHead(co ? 'תשלום' : 'הסל', co ? 'סיום הזמנה' : 'הסל שלך', '') + '</div>';
    wg.parentNode.insertBefore(h, wg); fitWrap(h);
  }
  function initCheckout() {
    try { shopHead(); } catch (e) {}
    fillOrderNotes();
  }
  function fillOrderNotes() {
    const list = store.get('ck-ded', []);
    if (document.body.classList.contains('woocommerce-order-received')) { store.set('ck-ded', []); return; }
    const ta = document.querySelector('#order_comments, textarea[name="order_comments"]');
    if (!ta || !list.length) return;
    api('/cart').then(c => {
      const ids = new Set((c.items || []).map(it => String(it.id)));
      const live = list.filter(x => ids.has(String(x.id)));
      if (live.length !== list.length) store.set('ck-ded', live);
      writeNotes(ta, live);
    }).catch(() => writeNotes(ta, list));
  }
  function writeNotes(ta, list) {
    if (!list.length) return;
    const txt = list.map(x => x.product + ': ' + x.text).join('\n');
    if (!ta.value.includes(txt)) ta.value = (ta.value ? ta.value + '\n' : '') + 'פרטי הקדשה:\n' + txt;
    const box = ta.closest('.form-row, p') || ta; box.style.outline = '0';
  }

  /* ---------- header cart badge ---------- */
  function badge() {
    document.querySelectorAll('a[href*="/cart"]').forEach(a => {
      if (a.closest('#ck-ov') || a.querySelector('[data-ck-count]')) return;
      const s = document.createElement('span'); s.className = 'ck-count'; s.setAttribute('data-ck-count', ''); s.hidden = true; s.textContent = '0';
      a.style.position = a.style.position || 'relative'; a.appendChild(s);
    });
  }

  /* ---------- header: the menu follows the store ----------
     featured products refresh their name and picture, a deleted or sold out one is swapped for a live one from
     the same category, a deleted or empty category link hides, and a category opened after launch joins the
     "עוד" panel (a main category once it has a picture). Any failure leaves the menu exactly as built. */
  const NEW_CAT_FROM = 162;
  const lsGet = (k, ttl) => { try { const o = JSON.parse(localStorage.getItem(k) || 'null'); return o && Date.now() - o.t < ttl ? o.v : null; } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify({ t: Date.now(), v })); } catch (e) {} };
  const cached = (k, ttl, get) => { const c = lsGet(k, ttl); return c ? Promise.resolve(c) : get().then(v => { lsSet(k, v); return v; }); };
  const pathOf = h => { try { return decodeURIComponent(new URL(h, location.href).pathname).replace(/\/+$/, '/'); } catch (e) { return ''; } };
  const pidOf = h => { try { const u = new URL(h, location.href); return +(u.searchParams.get('p') || 0); } catch (e) { return 0; } };
  const plain = s => decode(String(s || '').replace(/<[^>]+>/g, '')).trim();
  function getCats() { return cached('ck-cats', 3e5, () => fetchAll('/products/categories').then(l => l.map(c => ({ id: c.id, p: c.parent, name: plain(c.name), n: c.count, path: pathOf(c.permalink), img: c.image ? (c.image.thumbnail || c.image.src) : '' })))); }
  async function syncMenu() {
    const mgs = [...document.querySelectorAll('.h-mg')]; if (!mgs.length) return;
    const cats = await getCats();
    window.__ckMenuSync = cats.length;
    const byPath = new Map(cats.map(c => [c.path, c]));
    const total = c => c.n + cats.filter(x => x.p === c.id).reduce((t, x) => t + total(x), 0);
    const hide = el => el && el.style.setProperty('display', 'none', 'important');
    const catLinks = [...document.querySelectorAll('.h-ni a[href*="product-category"]')];
    /* a category that no longer exists or has nothing in it: hide the link (a whole menu tab if it is the tab itself) */
    catLinks.forEach(a => { const c = byPath.get(pathOf(a.href)); if (c && total(c) > 0) return; hide(a.classList.contains('h-nl') ? a.closest('.h-ni') : a); });
    window.__ckMenuHidden = catLinks.filter(a => a.style.display === 'none').length;
    /* featured products: one request for all of them */
    const items = [...document.querySelectorAll('.h-mg a.h-mg-it')].filter(a => pidOf(a.href));
    if (items.length) {
      const ids = [...new Set(items.map(a => pidOf(a.href)))];
      const live = await cached('ck-menup:' + ids.join(','), 3e5, () => fetch(CFG.api + '/products?per_page=100&include=' + ids.join(','), { credentials: 'same-origin' }).then(r => r.ok ? r.json() : Promise.reject(r.status)).then(l => l.map(p => ({ id: p.id, name: plain(p.name), link: p.permalink, ok: p.is_in_stock !== false && p.is_purchasable !== false, th: p.images && p.images[0] ? p.images[0].thumbnail : '', img: p.images && p.images[0] ? p.images[0].src : '' }))));
      const byId = new Map(live.map(p => [p.id, p]));
      for (const mg of mgs) {
        const its = [...mg.querySelectorAll('a.h-mg-it')].filter(a => pidOf(a.href)); if (!its.length) continue;
        const tab = mg.closest('.h-ni'); const tabCat = tab && byPath.get(pathOf((tab.querySelector('a.h-nl') || {}).href || ''));
        let spare = null;
        for (const a of its) {
          let p = byId.get(pidOf(a.href));
          if (!p || !p.ok) {
            if (!tabCat) { hide(a); continue; }
            if (!spare) spare = await cached('ck-menus:' + tabCat.id, 3e5, () => fetch(CFG.api + '/products?per_page=12&orderby=popularity&category=' + tabCat.id, { credentials: 'same-origin' }).then(r => r.ok ? r.json() : []).then(l => l.filter(notDed).filter(x => x.is_in_stock !== false).map(x => ({ id: x.id, name: plain(x.name), link: x.permalink, ok: true, th: x.images && x.images[0] ? x.images[0].thumbnail : '', img: x.images && x.images[0] ? x.images[0].src : '' }))));
            const taken = new Set(its.map(x => pidOf(x.href)));
            p = spare.find(x => !taken.has(x.id));
            if (!p) { hide(a); continue; }
          }
          paintMenuItem(mg, a, p);
        }
      }
    }
    /* categories opened after launch */
    const linked = new Set([...document.querySelectorAll('.h-ni a[href*="product-category"]')].map(a => pathOf(a.href)));
    const fresh = cats.filter(c => c.id >= NEW_CAT_FROM && c.n > 0 && (c.p || c.img) && !linked.has(c.path));
    const more = [...document.querySelectorAll('.h-ni')].find(n => /עוד/.test(((n.querySelector('.h-nl-t') || {}).textContent || ''))) || [...document.querySelectorAll('.h-ni')].pop();
    const list = more && more.querySelector('.h-mg-items'); const tpl = list && list.querySelector('a.h-mg-it');
    if (tpl && fresh.length) for (const c of fresh) {
      const a = tpl.cloneNode(true);
      a.className = a.className.replace(/\bh-i\d+\b/g, '').trim(); a.removeAttribute('data-id'); a.removeAttribute('data-interaction-id'); a.style.removeProperty('display');
      a.href = c.path; a.dataset.ckNew = c.id;
      const nm = a.querySelector('.h-mg-name'); if (nm) nm.textContent = c.name;
      const parent = c.p && cats.find(x => x.id === c.p);
      const sub = a.querySelector('.h-mg-sub'); if (sub) sub.textContent = parent ? parent.name : c.n + ' מוצרים';
      const im = a.querySelector('.h-mg-thimg'); let src = c.img;
      if (!src) { try { const one = await cached('ck-catimg:' + c.id, 3e5, () => fetch(CFG.api + '/products?per_page=1&category=' + c.id, { credentials: 'same-origin' }).then(r => r.ok ? r.json() : []).then(l => l[0] && l[0].images[0] ? l[0].images[0].thumbnail : '')); src = one; } catch (e) {} }
      if (im) { im.removeAttribute('srcset'); im.removeAttribute('id'); if (src) { im.src = src; im.alt = ''; } else im.remove(); }
      list.appendChild(a);
    }
    adminCatNotice(cats);
  }
  function paintMenuItem(mg, a, p) {
    /* the shop's own short label stays; only a product that replaced a missing one gets its (short) name */
    const swapped = pidOf(a.href) !== p.id; if (swapped) a.href = p.link;
    const label = swapped ? base(p.name) : '';
    const nm = a.querySelector('.h-mg-name'); if (nm && label) nm.textContent = label;
    const th = a.querySelector('.h-mg-thimg'); if (th && p.th && th.getAttribute('src') !== p.th) { th.removeAttribute('srcset'); th.src = p.th; }
    const k = (a.className.match(/\bh-i(\d+)\b/) || [])[1]; if (k == null) return;
    const layer = mg.querySelector('.h-l' + k); if (!layer) return;
    const cap = layer.querySelector('.h-cap-t'); if (cap && label) cap.textContent = label;
    const li = layer.querySelector('img'); if (li && p.img && li.getAttribute('src') !== p.img) { li.removeAttribute('srcset'); li.src = p.img; }
  }
  /* only a logged-in site manager sees this: a main category with products but no picture stays out of the menu */
  function adminCatNotice(cats) {
    if (!document.getElementById('wpadminbar') || document.getElementById('ck-catnote')) return;
    const ok = store.get('ck-catok', []);
    const miss = cats.filter(c => c.id >= NEW_CAT_FROM && !c.p && c.n > 0 && !c.img && !ok.includes(c.id));
    if (!miss.length) return;
    const c = miss[0];
    const bar = document.createElement('div'); bar.id = 'ck-catnote'; bar.className = 'ckx ck-catnote'; bar.setAttribute('role', 'status');
    bar.innerHTML = '<p><b>הקטגוריה "' + esc(c.name) + '" לא מופיעה בתפריט העליון</b> כי אין לה תמונה. מוסיפים תמונה לקטגוריה והיא נכנסת לתפריט לבד.' + (miss.length > 1 ? ' (ועוד ' + (miss.length - 1) + ')' : '') + '</p>' +
      '<a class="btn solid" href="/wp-admin/term.php?taxonomy=product_cat&amp;tag_ID=' + c.id + '&amp;post_type=product">הוספת תמונה</a><button class="btn line" type="button" data-ck-catok="' + c.id + '">זו קטגוריה פנימית</button>';
    document.body.appendChild(bar);
    bar.querySelector('[data-ck-catok]').addEventListener('click', () => { store.set('ck-catok', ok.concat(c.id)); bar.remove(); adminCatNotice(cats); });
  }

  function boot() {
    /* the module runs only on pages built in the new design (new header, product/category/page carriers);
       every other page of the live site stays exactly as it is */
    /* the dedication text reaches the order notes on every checkout, whatever header the page has */
    try { fillOrderNotes(); } catch (e) {}
    if (!document.querySelector('.h-mg, .ckp, .ckc, .ckpg')) return;
    document.documentElement.classList.add('ck-on');
    if (![...document.querySelectorAll('link[rel=stylesheet]')].some(l => /elementor\/css\/base-desktop\.css/.test(l.href))) document.documentElement.classList.add('ck-nobase');
    try { readSiteFacts(); } catch (e) {}
    mountOverlays(); badge(); loadCart(); initCheckout();
    const root = document.querySelector('.ckp');
    if (root && !root.classList.contains("ckp-done")) initProduct(root).catch(e => { console.error("ck-store product", e); });
    try { initHomeHero(); } catch (e) { console.error('ck-store hero', e); }
    try { initHomeDed(); } catch (e) { console.error('ck-store home ded', e); }
    const proot = document.querySelector('.ckpg');
    if (proot && !proot.classList.contains('ckpg-done')) try { initPage(proot); } catch (e) { console.error('ck-store page', e); }
    if (document.querySelector('.h-mg')) syncMenu().catch(e => { console.warn('ck-store menu', e); });
    const croot = document.querySelector('.ckc');
    if (croot && !croot.classList.contains('ckc-done')) initArchive(croot).catch(e => { console.error('ck-store archive', e); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.CKStore = { open, closeAll, loadCart, toast };
})();
