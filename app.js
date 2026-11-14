(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const AR = window.AR || {};
  const SVC = window.SERVICES || {};
  // Only large, continuous movement respects the OS "reduce motion" setting.
  // Fades, counters and the ribbon always run (the ribbon pauses on hover).
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const COPY = {
    en: {
      words: ['POS systems', 'ERP & CRM', 'networks', 'CCTV', 'Microsoft 365', 'cybersecurity', 'AI'],
      closed: 'Support desk closed · we reply next business morning',
      pkg: {
        cafe: { name: 'CAFÉ & KIOSK', d: 'Compact counter-service setup: POS terminal, receipt printer, Wi-Fi and cameras.' },
        rest: { name: 'RESTAURANT', d: 'Multi-terminal POS, kitchen display and printers, guest Wi-Fi, full-floor CCTV and phones.' },
        retail: { name: 'RETAIL STORE', d: 'Inventory-ready POS with barcode scanning, multi-counter billing and stock sync from day one.' }
      },
      required: 'Please add your name and a valid email.',
      sent: 'Your email app has opened with the message ready to send. You can also reach us on WhatsApp.',
      interested: 'I’m interested in: ',
      themeTo: { dark: 'Switch to light theme', light: 'Switch to dark theme' }
    },
    ar: {
      words: ['أنظمة نقاط البيع', 'تخطيط الموارد وإدارة العملاء', 'الشبكات', 'كاميرات المراقبة', 'مايكروسوفت 365', 'الأمن السيبراني', 'الذكاء الاصطناعي'],
      closed: 'مكتب الدعم مغلق · نرد صباح يوم العمل التالي',
      pkg: {
        cafe: { name: 'مقهى وكشك', d: 'تجهيز مدمج للخدمة على الكاونتر: جهاز نقطة بيع وطابعة إيصالات وواي فاي وكاميرات.' },
        rest: { name: 'مطعم', d: 'نقاط بيع متعددة وشاشة وطابعات للمطبخ وواي فاي للضيوف وكاميرات تغطي الصالة وهواتف.' },
        retail: { name: 'متجر تجزئة', d: 'نقطة بيع جاهزة للمخزون مع قارئ باركود وفوترة على عدة كاونترات ومزامنة المخزون من اليوم الأول.' }
      },
      required: 'يرجى إدخال الاسم وبريد إلكتروني صحيح.',
      sent: 'تم فتح تطبيق البريد والرسالة جاهزة للإرسال. يمكنك أيضاً التواصل عبر واتساب.',
      interested: 'أنا مهتم بـ: ',
      themeTo: { dark: 'التبديل إلى الوضع الفاتح', light: 'التبديل إلى الوضع الداكن' }
    }
  };
  const LOG = [
    ['09:02', 'NEW', 'new', 'Café, JLT · receipt printer offline'],
    ['09:03', 'ASSIGNED', 'work', 'Remote session opened'],
    ['09:06', 'FIXED', 'fix', 'Driver reset · test receipt printed'],
    ['09:07', 'CLOSED', 'done', 'Owner updated on WhatsApp'],
    ['11:40', 'NEW', 'new', 'Retail, Al Barsha · new staff email'],
    ['11:52', 'FIXED', 'fix', 'Microsoft 365 user created with MFA'],
    ['11:53', 'CLOSED', 'done', 'Sign-in details sent to manager']
  ];

  /* ---------- counters: every number counts up from 0 ---------- */
  function countTo(el, target, { from = 0, pad = 0, duration = 1600 } = {}) {
    const t0 = performance.now();
    const fmt = v => String(Math.round(v)).padStart(pad, '0');
    const step = t => {
      const p = Math.min((t - t0) / duration, 1);
      el.textContent = fmt(from + (target - from) * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- word-split headings ---------- */
  function splitWords(el) {
    const text = el.textContent.trim();
    el.textContent = '';
    text.split(/\s+/).forEach((word, i, arr) => {
      const w = document.createElement('span'); w.className = 'w';
      const inner = document.createElement('span'); inner.style.setProperty('--i', i); inner.textContent = word;
      w.appendChild(inner); el.appendChild(w);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  /* ---------- language ---------- */
  let lang = root.lang === 'ar' ? 'ar' : 'en';
  const i18nNodes = $$('[data-i18n]');
  i18nNodes.forEach(n => { n.dataset.en = n.innerHTML; });

  function applyLang(next, first) {
    lang = next;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    i18nNodes.forEach(n => {
      const v = lang === 'ar' ? AR[n.dataset.i18n] : n.dataset.en;
      if (v !== undefined) n.innerHTML = v;
      if (n.classList.contains('split')) { splitWords(n); if (n.dataset.seen) n.classList.add('is-in'); }
    });
    if (first) $$('.split:not([data-i18n])').forEach(splitWords);
    $('#langLabel').textContent = lang === 'ar' ? 'EN' : 'ع';
    if (rot) { wordIdx = 0; rot.textContent = COPY[lang].words[0]; }
    if (seg) setPkg(currentPkg);
    if ($('#clock')) updateTicker();
    updateThemeLabel();
    ribbons.forEach(r => r.measure());
    try { localStorage.setItem('ito-lang', lang); } catch (e) {}
  }
  $('#langBtn').addEventListener('click', () => applyLang(lang === 'en' ? 'ar' : 'en'));

  /* ---------- theme ---------- */
  const themeBtn = $('#themeBtn');
  const metaTheme = $('meta[name="theme-color"]');
  function updateThemeLabel() {
    const th = root.dataset.theme;
    themeBtn.setAttribute('aria-label', COPY[lang].themeTo[th]);
    metaTheme.setAttribute('content', th === 'dark' ? '#0B0B0C' : '#F5F2EC');
  }
  function setTheme(th) {
    root.dataset.theme = th;
    try { localStorage.setItem('ito-theme', th); } catch (e) {}
    updateThemeLabel();
  }
  themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition) { setTheme(next); return; }
    const r = themeBtn.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(() => setTheme(next)).ready.then(() => {
      root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 700, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' });
    });
  });

  /* ---------- hero rotating word ---------- */
  const rot = $('#rotator');
  let wordIdx = 0;
  function setWord(word) {
    if (lang === 'ar') {
      rot.style.opacity = 0;
      setTimeout(() => { rot.textContent = word; rot.style.opacity = 1; }, 300);
      return;
    }
    const old = $$('.ch', rot);
    old.forEach((c, i) => setTimeout(() => c.classList.add('out'), i * 22));
    setTimeout(() => {
      rot.textContent = '';
      [...word].forEach((ch, i) => {
        const s = document.createElement('span');
        s.className = 'ch in';
        s.textContent = ch === ' ' ? ' ' : ch;
        rot.appendChild(s);
        setTimeout(() => s.classList.remove('in'), 30 + i * 28);
      });
    }, 260 + old.length * 22);
  }
  if (rot) {
    rot.style.transition = 'opacity .3s';
    setInterval(() => {
      if (document.hidden) return;
      wordIdx = (wordIdx + 1) % COPY[lang].words.length;
      setWord(COPY[lang].words[wordIdx]);
    }, 2800);
  }

  /* ---------- live ticker ---------- */
  const deadline = new Date('2027-03-31T23:59:59+04:00');
  const daysLeft = () => Math.max(0, Math.ceil((deadline - Date.now()) / 86400000));
  function updateTicker() {
    const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
    const p = Object.fromEntries(f.formatToParts(new Date()).map(x => [x.type, x.value]));
    $('#clock').textContent = `${p.hour}:${p.minute}`;
    const open = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'].includes(p.weekday) && +p.hour >= 9 && +p.hour < 18;
    const status = $('#deskStatus');
    status.textContent = open ? (lang === 'ar' ? AR['tick.open'] : status.dataset.en) : COPY[lang].closed;
    $('#deskDot').classList.toggle('is-closed', !open);
  }
  if ($('#clock')) {
    updateTicker();
    setInterval(updateTicker, 20000);
    countTo($('#tickDays'), daysLeft(), { duration: 2000 });
  }

  /* ---------- header ---------- */
  const nav = $('#nav'), bar = $('#progressBar'), menu = $('#menu'), burger = $('#burger');
  let lastY = scrollY, scrollVel = 0;
  function onScroll() {
    const y = scrollY;
    scrollVel = y - lastY;
    nav.classList.toggle('is-scrolled', y > 40);
    nav.classList.toggle('is-hidden', y > 700 && y > lastY && !menu.classList.contains('is-open') && !$('.menu__item.is-open'));
    lastY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    updateSteps();
  }
  addEventListener('scroll', onScroll, { passive: true });

  burger.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('.menu__toggle').forEach(btn => btn.addEventListener('click', e => {
    const item = btn.closest('.menu__item');
    const open = !item.classList.contains('is-open');
    $$('.menu__item.is-open').forEach(i => i !== item && i.classList.remove('is-open'));
    item.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open);
    e.stopPropagation();
  }));
  const closeMenus = () => {
    $$('.menu__item.is-open').forEach(i => i.classList.remove('is-open'));
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', false);
    document.body.style.overflow = '';
  };
  document.addEventListener('click', e => { if (!e.target.closest('.menu__item') && !e.target.closest('#burger')) $$('.menu__item.is-open').forEach(i => i.classList.remove('is-open')); });
  $$('.menu a').forEach(a => a.addEventListener('click', closeMenus));
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenus(); });

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    el.classList.add('is-in');
    el.dataset.seen = '1';
    $$('[data-count]', el).forEach(n => countTo(n, +n.dataset.count));
    if (el.id === 'timeline') runTimeline();
    if (el.id === 'console') startConsole();
    io.unobserve(el);
  }), { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
  function observeAll() { $$('.reveal, .split, .plan, .geo__board').forEach(el => io.observe(el)); }
  setTimeout(() => $('.hero, .phero')?.classList.add('is-ready'), 120);

  /* ---------- ribbon: two rows, opposite directions, speed reacts to scroll ---------- */
  class Ribbon {
    constructor(row) {
      this.row = row; this.track = $('.ribbon__track', row);
      this.dir = +row.dataset.dir; this.speed = +row.dataset.speed;
      this.x = 0; this.boost = 0; this.paused = false;
      row.addEventListener('pointerenter', () => { this.paused = true; });
      row.addEventListener('pointerleave', () => { this.paused = false; });
      this.measure();
    }
    measure() { this.unit = this.track.scrollWidth / 3; }
    tick(dt) {
      const rtl = root.dir === 'rtl' ? -1 : 1;
      this.boost += (Math.min(Math.abs(scrollVel), 60) * 0.08 - this.boost) * 0.08;
      const v = this.paused ? 0 : (this.speed + this.boost) * this.dir * rtl;
      this.x += v * dt * 0.09;
      if (this.x <= -this.unit) this.x += this.unit;
      if (this.x > 0) this.x -= this.unit;
      this.track.style.transform = `translate3d(${this.x}px,0,0)`;
    }
  }
  const ribbons = $$('.ribbon__row').map(r => new Ribbon(r));
  if (ribbons.length) {
    let last = performance.now();
    const loop = t => { const dt = Math.min(t - last, 50); last = t; ribbons.forEach(r => r.tick(dt)); scrollVel *= 0.9; requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    addEventListener('resize', () => ribbons.forEach(r => r.measure()));
    document.fonts && document.fonts.ready.then(() => ribbons.forEach(r => r.measure()));
  }

  /* ---------- packages ---------- */
  const seg = $('#pkgTabs');
  let currentPkg = 'cafe', pill;
  function placePill() { const on = seg && $('button.is-on', seg); if (on) { pill.style.left = on.offsetLeft + 'px'; pill.style.width = on.offsetWidth + 'px'; } }
  function setPkg(key) {
    currentPkg = key;
    $$('button', seg).forEach(b => b.classList.toggle('is-on', b.dataset.pkg === key));
    $('#plan').dataset.pkg = key;
    const c = COPY[lang].pkg[key];
    $('#planName').textContent = c.name;
    const desc = $('#pkgDesc');
    desc.style.opacity = 0;
    setTimeout(() => { desc.textContent = c.d; desc.style.opacity = 1; }, 180);
    placePill();
  }
  if (seg) {
    pill = document.createElement('span'); pill.className = 'seg__pill'; seg.prepend(pill);
    $$('button', seg).forEach(b => b.addEventListener('click', () => setPkg(b.dataset.pkg)));
    addEventListener('resize', placePill);
    document.fonts && document.fonts.ready.then(placePill);
  }

  /* ---------- e-invoicing countdown + timeline ---------- */
  const daysEl = $('#days');
  if (daysEl) daysEl.textContent = '000';
  function runTimeline() {
    const start = new Date('2026-07-01T00:00:00+04:00'), end = new Date('2027-07-01T00:00:00+04:00');
    const p = Math.min(1, Math.max(0, (Date.now() - start) / (end - start))) * 100;
    $('#tlFill').style.width = p + '%';
    $('#tlToday').style.insetInlineStart = p + '%';
    if (daysEl) countTo(daysEl, daysLeft(), { pad: 3, duration: 2000 });
  }

  /* ---------- support console (illustrative) ---------- */
  let consoleStarted = false;
  function startConsole() {
    if (consoleStarted) return; consoleStarted = true;
    const log = $('#consoleLog');
    let i = 0;
    const caret = () => { const l = document.createElement('li'); l.innerHTML = '<time></time><span></span><span><i class="caret"></i></span>'; return l; };
    let cur = caret(); log.appendChild(cur);
    const type = (el, text, done) => { let k = 0; const tk = () => { el.textContent = text.slice(0, ++k); k < text.length ? setTimeout(tk, 18 + Math.random() * 22) : done(); }; tk(); };
    const next = () => {
      if (i === LOG.length) { setTimeout(() => { log.innerHTML = ''; i = 0; cur = caret(); log.appendChild(cur); setTimeout(next, 700); }, 3200); return; }
      const [tm, tag, cls, msg] = LOG[i++];
      const l = document.createElement('li');
      l.innerHTML = `<time>${tm}</time><span class="tag tag--${cls}">${tag}</span><span></span>`;
      log.insertBefore(l, cur);
      type($('span:last-child', l), msg, () => setTimeout(next, 650));
    };
    setTimeout(next, 500);
  }

  /* ---------- case rail ---------- */
  const rail = $('#rail');
  if (rail) {
    const cards = $$('.case', rail);
    const btnNext = $('#railNext'), btnPrev = $('#railPrev'), now = $('#railNow'), railBar = $('#railBar');
    const targetOf = i => cards[i].offsetLeft - cards[0].offsetLeft;
    const maxScroll = () => rail.scrollWidth - rail.clientWidth;
    let current = 0, moving = false, lockUntil = 0;
    function paintRail() {
      cards.forEach((c, i) => c.classList.toggle('is-current', i === current));
      if (now) now.textContent = String(current + 1).padStart(2, '0');
      if (railBar) railBar.style.width = ((current + 1) / cards.length * 100) + '%';
      btnPrev.classList.toggle('is-off', current === 0);
      btnNext.classList.toggle('is-off', current === cards.length - 1);
    }
    // Follows manual dragging and swiping. Arrow clicks set `current` directly, because on
    // wide screens the last cards share one scroll position and can't be told apart by it.
    function syncRail() {
      if (moving || Date.now() < lockUntil) return;
      const x = rail.scrollLeft;
      const atEnd = Math.abs(x) >= maxScroll() - 2;
      current = atEnd ? cards.length - 1 : cards.reduce((best, _, i) => (Math.abs(targetOf(i) - x) < Math.abs(targetOf(best) - x) ? i : best), 0);
      paintRail();
    }
    function glideTo(i) {
      current = i;
      paintRail();
      const from = rail.scrollLeft, limit = maxScroll();
      const to = Math.sign(targetOf(i) || 1) * Math.min(Math.abs(targetOf(i)), limit);
      lockUntil = Date.now() + 900;
      if (Math.abs(to - from) < 1) return;
      const t0 = performance.now(), dur = 700;
      moving = true;
      rail.classList.add('is-moving');
      const frame = t => {
        const p = Math.min((t - t0) / dur, 1);
        const e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        rail.scrollLeft = from + (to - from) * e;
        if (p < 1) return requestAnimationFrame(frame);
        moving = false;
        rail.classList.remove('is-moving');
        lockUntil = Date.now() + 250;
      };
      requestAnimationFrame(frame);
    }
    const press = (btn, delta) => btn.addEventListener('click', () => {
      if (moving || btn.classList.contains('is-off')) return;
      btn.classList.remove('is-press'); void btn.offsetWidth; btn.classList.add('is-press');
      setTimeout(() => btn.classList.remove('is-press'), 560);
      glideTo(Math.max(0, Math.min(cards.length - 1, current + delta)));
    });
    press(btnNext, 1);
    press(btnPrev, -1);
    rail.addEventListener('scroll', syncRail, { passive: true });
    addEventListener('resize', syncRail);
    syncRail();
    let dx0 = null, s0 = 0;
    rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; dx0 = e.clientX; s0 = rail.scrollLeft; rail.classList.add('is-drag'); rail.setPointerCapture(e.pointerId); });
    rail.addEventListener('pointermove', e => { if (dx0 !== null) rail.scrollLeft = s0 - (e.clientX - dx0); });
    const end = () => { dx0 = null; rail.classList.remove('is-drag'); };
    rail.addEventListener('pointerup', end); rail.addEventListener('pointercancel', end);
  }

  /* ---------- process line ---------- */
  const stepsEls = $$('.steps');
  function updateSteps() {
    stepsEls.forEach(steps => {
      const r = steps.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * .8 - r.top) / (r.height + innerHeight * .3)));
      const fill = $('.steps__line span', steps); if (fill) fill.style.width = (p * 100) + '%';
      $$('li', steps).forEach((li, i, all) => li.classList.toggle('is-on', p > i / all.length + .02));
    });
  }

  /* ---------- FAQ: one open at a time per group ---------- */
  $$('.faq').forEach(group => $$('details', group).forEach(d => d.addEventListener('toggle', () => {
    if (d.open) $$('details', group).forEach(o => o !== d && (o.open = false));
  })));

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduceMotion) $$('.magnetic').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .28}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });

  /* ---------- contact form ---------- */
  const form = $('#contactForm');
  if (form) {
    const topic = $('#topic'), note = $('#formNote'), msg = $('#message');
    const q = new URLSearchParams(location.search);
    if (q.get('topic') && [...topic.options].some(o => o.value === q.get('topic'))) topic.value = q.get('topic');
    const svc = SVC[q.get('service')];
    if (svc && !msg.value) msg.value = COPY[lang].interested + svc[lang];
    form.addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || '');
      form.elements.name.classList.toggle('is-invalid', !d.name);
      form.elements.email.classList.toggle('is-invalid', !okEmail);
      if (!d.name || !okEmail) { note.style.color = 'var(--red)'; note.textContent = COPY[lang].required; return; }
      const tp = topic.options[topic.selectedIndex].text;
      const body = `Name: ${d.name}\nCompany: ${d.company || '-'}\nEmail: ${d.email}\nPhone: ${d.phone || '-'}\nTopic: ${tp}\n\n${d.message || ''}`;
      location.href = `mailto:info@itoasisgulf.com?subject=${encodeURIComponent('Website enquiry: ' + tp)}&body=${encodeURIComponent(body)}`;
      note.style.color = ''; note.textContent = COPY[lang].sent;
    });
  }

  const year = $('#year'); if (year) year.textContent = new Date().getFullYear();

  /* ---------- motion: network field, parallax, card spotlight, image wipes ---------- */
  // Live network in the page header: drifting nodes joined by thin lines, drawn on one
  // canvas, only while it is on screen and the tab is visible.
  function networkField(host) {
    const cv = document.createElement('canvas');
    cv.className = 'fx-net'; cv.setAttribute('aria-hidden', 'true');
    const anchor = $('.hero__inner, .phero__inner', host);
    host.insertBefore(cv, anchor);
    const ctx = cv.getContext('2d');
    const dark = host.matches('.hero--photo, .phero--img, .sec--ink');
    let w = 0, h = 0, dpr = 1, nodes = [], visible = false, raf = 0, last = 0;
    const mouse = { x: -9999, y: -9999 };
    const speed = reduceMotion ? .25 : 1;
    function size() {
      const r = host.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(64, Math.max(18, w * h / 26000)));
      nodes = Array.from({ length: n }, (_, i) => nodes[i] || { x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28, r: Math.random() * 1.4 + .8 });
    }
    function colors() {
      const light = !dark && root.dataset.theme === 'light';
      return light ? { dot: 'rgba(227,36,43,', line: 'rgba(227,36,43,' } : { dot: 'rgba(244,122,32,', line: 'rgba(253,185,19,' };
    }
    function frame(t) {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min(t - (last || t), 48) / 16.7 * speed; last = t;
      const c = colors(), link = Math.min(150, w / 7), link2 = link * link;
      ctx.clearRect(0, 0, w, h);
      for (const p of nodes) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;
        const mx = mouse.x - p.x, my = mouse.y - p.y, md = mx * mx + my * my;
        if (md < 28000) { p.x += mx * .004 * dt; p.y += my * .004 * dt; }
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
          if (d < link2) { ctx.strokeStyle = c.line + (0.22 * (1 - d / link2)).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        const mx = mouse.x - a.x, my = mouse.y - a.y, md = mx * mx + my * my;
        if (md < 32000) { ctx.strokeStyle = c.line + (0.45 * (1 - md / 32000)).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
        ctx.fillStyle = c.dot + '.75)'; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    const run = () => { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; run(); }).observe(host);
    document.addEventListener('visibilitychange', run);
    if (finePointer) {
      host.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
      host.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    }
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 150); });
    size();
  }
  $$('.hero, .phero').forEach(networkField);

  // Header photos move a little slower than the page for depth
  const para = $$('.hero__photo, .phero__img');
  if (para.length && !reduceMotion) {
    let ticking = false;
    const move = () => {
      ticking = false;
      for (const el of para) {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        el.style.translate = `0 ${Math.round(-r.top * .22)}px`;
      }
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(move); } }, { passive: true });
    move();
  }

  // Soft light that follows the pointer across cards
  if (finePointer) {
    $$('.svc-card, .sol__card, .case, .uae__item, .person, .values > article, .trio--cards > *, .testi__card, .faq__item').forEach(card => {
      card.classList.add('fx-spot');
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  // Photos wipe open as they scroll into view
  const wipeIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('is-shown'); wipeIO.unobserve(en.target);
  }), { threshold: 0.2 });
  $$('.case__img, .person__photo').forEach(el => { el.classList.add('fx-wipe'); wipeIO.observe(el); });

  /* ---------- init ---------- */
  if (rot) rot.innerHTML = [...rot.textContent].map(ch => `<span class="ch">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
  applyLang(lang, true);
  if (rot && lang === 'en') rot.innerHTML = [...COPY.en.words[0]].map(ch => `<span class="ch">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
  if (seg) setPkg('cafe');
  observeAll();
  onScroll();
})();
