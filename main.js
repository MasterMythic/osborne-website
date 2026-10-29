/* Osborne — interactions. No dependencies, no network calls. */
(() => {
  'use strict';
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  $('#yr').textContent = String(new Date().getFullYear());

  /* ---------- nav ---------- */
  const nav = $('.nav');
  const menuBtn = $('.menu');
  const menu = $('#mobile-menu');
  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
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

  const links = $$('.nav-links a');
  const secIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['shift', 'protect', 'approach', 'engage', 'enquire'].forEach(id => secIO.observe(document.getElementById(id)));
  secIO.observe($('.hero'));

  /* ---------- reveal ---------- */
  const revIO = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); revIO.unobserve(en.target); } });
  }, { threshold: 0.15 });
  $$('.reveal').forEach(el => revIO.observe(el));

  /* ================= HERO: signal field with a protected perimeter ================= */
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
    ? { cx: W * 0.76, cy: H * 0.5, rx: Math.min(W * 0.2, 300), ry: Math.min(H * 0.3, 260) }
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

  /* ================= SHIFT: before / now toggle ================= */
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

  /* ================= PROTECT: layer rings ================= */
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

  /* ================= ENQUIRY BRIEF (local only) ================= */
  const form = $('#brief');
  const out = $('#brief-out');
  const status = $('#brief-status');
  const say = (msg, warn) => { status.textContent = msg; status.classList.toggle('warn', !!warn); };

  const build = () => {
    const f = form.elements;
    const v = (n) => (f[n] && f[n].value || '').trim();
    const protect = $$('input[name="protect"]:checked', form).map(i => i.value);
    const stageEl = $('input[name="stage"]:checked', form);
    const stage = stageEl ? stageEl.value : '';
    const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const lines = ['OSBORNE · PROJECT ENQUIRY BRIEF (draft)', 'Prepared ' + date, ''];
    const add = (k, val) => { if (val) lines.push((k + ':').padEnd(18) + val); };
    add('Name', v('name'));
    add('Organisation', v('org'));
    add('Role', v('role'));
    add('Website', v('domain'));
    add('Protect', protect.join(', '));
    add('Situation', stage);
    add('Timing', v('timing'));
    add('Team size', v('size'));
    if (v('notes')) { lines.push('', 'What is prompting this:', v('notes')); }
    if (stage === 'Something has already happened') {
      lines.push('', 'If an incident is still active, contact your IT or incident response provider now rather than waiting on this brief.');
    }
    lines.push('', '—', 'Generated on this device. Nothing has been sent.');
    const filled = [v('name'), v('org'), v('role'), v('domain'), v('notes'), v('timing'), v('size'), stage, protect.length ? 'y' : ''].some(Boolean);
    return { text: lines.join('\n'), filled };
  };
  const render = () => {
    const b = build();
    out.textContent = b.filled ? b.text : 'Your brief will appear here as you answer.';
    return b;
  };
  form.addEventListener('input', () => { render(); say(''); });
  form.addEventListener('change', () => { render(); say(''); });
  form.addEventListener('submit', e => e.preventDefault());
  render();

  const legacyCopy = (text) => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    ta.remove(); return ok;
  };
  $('#copy-brief').addEventListener('click', async () => {
    const b = build();
    if (!b.filled) { say('Add a few details first, then copy your brief.', true); return; }
    let ok = false;
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(b.text); ok = true; } } catch (_) { ok = false; }
    if (!ok) ok = legacyCopy(b.text);
    if (ok) say('Brief copied to your clipboard. Nothing has been sent.');
    else { say('Your browser blocked copying. Select the brief text and copy it manually.', true); out.focus(); }
  });
  $('#dl-brief').addEventListener('click', () => {
    const b = build();
    if (!b.filled) { say('Add a few details first, then download your brief.', true); return; }
    const blob = new Blob([b.text + '\n'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'osborne-enquiry-brief.txt';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    say('Brief downloaded to your device. Nothing has been sent.');
  });
  $('#clear-brief').addEventListener('click', () => { form.reset(); render(); say('Cleared.'); });
})();
