/* Osborne — interactions. No dependencies, no network calls. Each feature runs only on pages that contain it. */
(() => {
  'use strict';
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  const yr = $('#yr'); if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- nav ---------- */
  const nav = $('.nav');
  const menuBtn = $('.menu');
  const menu = $('#mobile-menu');
  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    document.documentElement.classList.toggle('menu-lock', open);
    nav.classList.toggle('menu-open', open);
    nav.classList.toggle('scrolled', open || window.scrollY > 20);
    if (open) $('a', menu).focus();
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); }
  });
  window.matchMedia('(min-width: 1021px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20 || !menu.hidden);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- reveal ---------- */
  const revIO = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); revIO.unobserve(en.target); } });
  }, { threshold: 0.15 });
  $$('.reveal').forEach(el => revIO.observe(el));

  /* ================= HERO: signal field with a protected perimeter ================= */
  if ($('.field')) (() => {
  const hero = $('.hero');
  const cv = $('.field');
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1;
  const resize = () => {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };
  resize();

  let px = -9999, py = -9999, tx = -9999, ty = -9999;
  hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; }, { passive: true });
  hero.addEventListener('pointerleave', () => { tx = -9999; ty = -9999; });

  const zone = () => W > 860
    ? { cx: W * 0.8, cy: H * 0.5, rx: Math.min(W * 0.17, 260), ry: Math.min(H * 0.3, 260) }
    : { cx: W * 0.5, cy: H - 125, rx: W * 0.42, ry: 88 };

  const draw = (t) => {
    ctx.clearRect(0, 0, W, H);
    const z = zone();
    const gap = W > 860 ? 17 : 15;
    const step = 7;
    const near = px > -999;
    for (let i = 0, y0 = gap; y0 < H + gap; i++, y0 += gap) {
      const pts = [];
      for (let x = -step; x <= W + step; x += step) {
        const dx = (x - z.cx) / z.rx, dy = (y0 - z.cy) / z.ry;
        const inside = 1 - smooth(0.55, 1.05, Math.sqrt(dx * dx + dy * dy)); // 1 inside, 0 outside
        const noise = Math.sin(x * 0.011 + t * 0.9 + i * 1.7) * 0.6 + Math.sin(x * 0.027 - t * 1.3 + i * 0.6) * 0.3 + Math.sin(x * 0.071 + t * 2.3 + i * 2.3) * 0.18;
        const spike = ((Math.floor(x / 36) * 13 + i * 7 + Math.floor(t * 2.2)) % 53 === 0) ? Math.sin(x * 0.4 + t * 9) * 8 : 0;
        let d = (noise * 7 + spike) * (1 - inside) + Math.sin(x * 0.012 + t * 0.5) * 2.2 * inside;
        if (near) {
          const qd = (x - px) ** 2 + (y0 - py) ** 2;
          d += Math.sin(x * 0.09 + t * 6) * 26 * Math.exp(-qd / 9000) * (1 - inside);
        }
        pts.push(x, y0 + d, inside);
      }
      // base line
      ctx.beginPath();
      for (let k = 0; k < pts.length; k += 3) k ? ctx.lineTo(pts[k], pts[k + 1]) : ctx.moveTo(pts[k], pts[k + 1]);
      ctx.strokeStyle = 'rgba(122,170,140,.42)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // noise highlights outside the perimeter
      ctx.strokeStyle = 'rgba(226,150,118,.6)';
      ctx.lineWidth = 1.2;
      for (let k = 3; k < pts.length; k += 3) {
        const jump = Math.abs(pts[k + 1] - pts[k - 2]);
        if (jump > 3.6 && pts[k + 2] < 0.02) {
          ctx.beginPath(); ctx.moveTo(pts[k - 3], pts[k - 2]); ctx.lineTo(pts[k], pts[k + 1]); ctx.stroke();
        }
      }
      // calm inside the perimeter
      ctx.save();
      ctx.beginPath(); ctx.ellipse(z.cx, z.cy, z.rx, z.ry, 0, 0, Math.PI * 2); ctx.clip();
      ctx.beginPath();
      for (let k = 0; k < pts.length; k += 3) k ? ctx.lineTo(pts[k], pts[k + 1]) : ctx.moveTo(pts[k], pts[k + 1]);
      ctx.strokeStyle = 'rgba(47,111,77,.72)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
    // perimeter outline
    ctx.beginPath(); ctx.ellipse(z.cx, z.cy, z.rx, z.ry, 0, 0, Math.PI * 2);
    ctx.setLineDash([3, 7]); ctx.strokeStyle = 'rgba(47,111,77,.55)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '500 11px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillStyle = 'rgba(47,111,77,.9)';
    const label = 'PROTECTED';
    const lw = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(238,244,238,.92)';
    ctx.fillRect(z.cx - lw / 2 - 8, z.cy - z.ry - 9, lw + 16, 18);
    ctx.fillStyle = 'rgba(47,111,77,.95)';
    ctx.fillText(label, z.cx - lw / 2, z.cy - z.ry + 4);
  };

  let raf = 0, heroOn = true;
  const loop = (now) => {
    raf = 0;
    px += (tx - px) * 0.12; py += (ty - py) * 0.12;
    if (tx < -999) { px = -9999; py = -9999; }
    draw(now / 1000);
    if (heroOn && !RM.matches) raf = requestAnimationFrame(loop);
  };
  const start = () => { if (!raf && !RM.matches) raf = requestAnimationFrame(loop); };
  new IntersectionObserver(([en]) => { heroOn = en.isIntersecting; if (heroOn) start(); }).observe(hero);
  window.addEventListener('resize', () => { resize(); if (RM.matches) draw(0); });
  RM.addEventListener('change', () => { if (RM.matches) draw(0); else start(); });
  if (RM.matches) draw(0); else start();
  })();

  /* ================= SHIFT: before / now toggle ================= */
  if ($('.ledger')) (() => {
  const ledger = $('.ledger');
  const eraBtns = $$('.toggle button');
  let touched = false;
  const setEra = (era) => {
    ledger.dataset.era = era;
    eraBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.era === era)));
  };
  eraBtns.forEach(b => b.addEventListener('click', () => { touched = true; setEra(b.dataset.era); }));
  if (!RM.matches) {
    const lio = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      lio.disconnect();
      if (touched) return;
      setEra('then');
      setTimeout(() => { if (!touched) setEra('now'); }, 1700);
    }, { threshold: 0.45 });
    lio.observe(ledger);
  }
  })();

  /* ================= PROTECT: layer rings ================= */
  if ($('.rings')) (() => {
  const rings = $$('.rings .ring');
  const layers = $$('.layers li');
  const lightRing = (idx) => {
    rings.forEach(r => r.classList.toggle('on', r.classList.contains('r' + idx)));
    layers.forEach(l => l.classList.toggle('on', l.dataset.ring === String(idx)));
  };
  layers.forEach(l => {
    const i = l.dataset.ring;
    l.addEventListener('mouseenter', () => lightRing(i));
    l.addEventListener('focus', () => lightRing(i));
    l.addEventListener('click', () => lightRing(i));
  });
  lightRing(0);

  // probes travelling in from outside, stopped at the outer ring
  const svgNS = 'http://www.w3.org/2000/svg';
  const probeG = $('.rings .probes');
  const probes = [];
  for (let k = 0; k < 9; k++) {
    const c = document.createElementNS(svgNS, 'circle');
    c.setAttribute('r', '4');
    probeG.appendChild(c);
    probes.push({ el: c, a: (k / 9) * Math.PI * 2 + 0.3, off: k * 0.37 });
  }
  let ringsOn = false, rRaf = 0;
  const ringLoop = (now) => {
    rRaf = 0;
    const t = now / 1000;
    probes.forEach(p => {
      const ph = ((t * 0.22 + p.off) % 1);
      const r = 300 - ph * 80;            // travels from 300 to 220
      const stopped = r <= 236;
      const rr = Math.max(r, 236);
      const a = p.a + Math.sin(t * 0.3 + p.off) * 0.05;
      p.el.setAttribute('cx', (260 + Math.cos(a) * rr).toFixed(1));
      p.el.setAttribute('cy', (260 + Math.sin(a) * rr).toFixed(1));
      p.el.setAttribute('opacity', (stopped ? 1 - (ph - 0.8) * 5 : Math.min(1, ph * 4)).toFixed(2));
      p.el.classList.toggle('blocked', stopped);
    });
    if (ringsOn) rRaf = requestAnimationFrame(ringLoop);
  };
  if (!RM.matches) {
    new IntersectionObserver(([en]) => { ringsOn = en.isIntersecting; if (ringsOn && !rRaf) rRaf = requestAnimationFrame(ringLoop); }).observe($('.rings'));
  } else {
    probes.forEach(p => { p.el.setAttribute('cx', (260 + Math.cos(p.a) * 244).toFixed(1)); p.el.setAttribute('cy', (260 + Math.sin(p.a) * 244).toFixed(1)); p.el.classList.add('blocked'); });
  }
  })();

  /* ================= REVIEW REQUEST (email link) =================
     Builds a plain-text message and opens it in the visitor's own email app via a mailto: link to the one
     published address. Nothing is submitted from this page and there are no network calls: the message is
     sent only if the visitor presses Send in their email app, so the page never claims delivery. */
  const form = $('#brief');
  if (!form) return;
  const ADDRESS = 'admin@osborneos.com';
  const BODY_LIMIT = 1800; // long mailto links fail in some email apps
  const out = $('#brief-out');
  const status = $('#brief-status');
  const meta = $('#mail-meta');
  const hrefOut = $('#mailto-href');
  const say = (msg, warn) => { status.textContent = msg; status.classList.toggle('warn', !!warn); };
  // Make a pasted link unclickable in the message: hxxps://example[.]com
  const defang = (s) => s.replace(/^\s*(h)tt(ps?)(:\/\/)/i, '$1xx$2$3').replace(/\./g, '[.]');
  const oneLine = (s) => s.replace(/[\r\n]+/g, ' ').trim();

  const fields = () => {
    const f = form.elements;
    const v = (n) => (f[n] && f[n].value || '').trim();
    const svcEl = $('input[name="service"]:checked', form);
    return { name: oneLine(v('name')), email: oneLine(v('email')), company: oneLine(v('company')), website: oneLine(v('website')),
      service: svcEl ? svcEl.value : '', concern: v('concern'), suspect: v('suspect') ? defang(oneLine(v('suspect'))).slice(0, 300) : '' };
  };
  const compose = (d, concern, shortened) => {
    const lines = ['Protection review request', ''];
    const add = (k, val) => { if (val) lines.push(k + ': ' + val); };
    add('Name', d.name); add('Business email', d.email); add('Company', d.company); add('Website', d.website); add('Service', d.service);
    if (concern) { lines.push('', 'Concern:', concern); }
    if (shortened) lines.push('[Shortened to fit an email link. Add the rest in your email before sending.]');
    if (d.suspect) { lines.push('', 'Suspicious link (made unclickable, not opened):', d.suspect); }
    if (d.service === 'Brand protection' || d.service === 'Both') {
      lines.push('', 'This is a report for review. I understand Osborne acts only on written authority from the rights owner.');
    }
    return lines.join('\n');
  };
  const build = () => {
    const d = fields();
    let body = compose(d, d.concern, false), shortened = false;
    if (body.length > BODY_LIMIT) {
      const room = Math.max(0, d.concern.length - (compose(d, d.concern, true).length - BODY_LIMIT) - 1);
      body = compose(d, d.concern.slice(0, room).trimEnd() + '…', true); shortened = true;
    }
    const subject = 'Protection review request' + (d.company ? ': ' + d.company.slice(0, 80) : '');
    const href = `mailto:${ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.replace(/\n/g, '\r\n'))}`;
    const filled = Object.values(d).some(Boolean);
    return { body, subject, href, filled, shortened, data: d };
  };
  const render = () => {
    const b = build();
    out.textContent = b.filled ? `Subject: ${b.subject}\n\n${b.body}` : 'Your message will appear here as you type.';
    meta.textContent = b.filled ? `To ${ADDRESS} · ${b.body.length} characters` : `To ${ADDRESS}`;
    hrefOut.textContent = b.filled ? b.href : '';
    return b;
  };
  form.addEventListener('input', () => { render(); say(''); });
  form.addEventListener('change', () => { render(); say(''); });
  render();

  // Opening the email app is a navigation to a mailto: link, not a form post or network request.
  // A cancelable 'osborne:mailto' event lets automated tests check the link without opening an email app.
  const openMail = (href) => {
    const ev = new CustomEvent('osborne:mailto', { detail: { href }, cancelable: true });
    if (document.dispatchEvent(ev)) window.location.href = href;
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const b = build();
    if (!b.data.concern && !b.data.suspect) { say('Please describe your concern briefly first.', true); form.elements.concern.focus(); return; }
    if (b.data.email && !form.elements.email.checkValidity()) { say('That email address looks incomplete. Please check it.', true); form.elements.email.focus(); return; }
    openMail(b.href);
    say(`Your email app should now open with this message to ${ADDRESS}. It's sent only when you press Send there.` +
      (b.shortened ? ' Your concern was shortened to fit an email link, so add the rest in your email.' : '') +
      ' Nothing opened? Copy the address and the message instead.');
  });

  const legacyCopy = (text) => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.className = 'offscreen';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    ta.remove(); return ok;
  };
  const copy = async (text) => {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch (_) { /* fall back */ }
    return legacyCopy(text);
  };
  $('#copy-address').addEventListener('click', async () => {
    say(await copy(ADDRESS) ? `Address copied: ${ADDRESS}` : `Copying was blocked. The address is ${ADDRESS}.`, false);
  });
  $('#copy-brief').addEventListener('click', async () => {
    const b = build();
    if (!b.filled) { say('Add a few details first, then copy your message.', true); return; }
    if (await copy(`To: ${ADDRESS}\nSubject: ${b.subject}\n\n${b.body}`)) say(`Message copied. Paste it into an email to ${ADDRESS}.`);
    else { say('Your browser blocked copying. Select the message text and copy it manually.', true); out.focus(); }
  });
  $('#clear-brief').addEventListener('click', () => { form.reset(); render(); say('Cleared.'); });
})();
