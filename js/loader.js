/* ============ LOADER: 3s cinematic intro (pulse + emoji lock-in + sunburst reveal) ============ */
const LOADER = (() => {
  const EMOJIS = ['😺', '😹', '😻', '😼', '🙀', '😿'];
  const DUR = 3.0;            // pulse + shuffle phase
  const BURST = 0.7;          // rays explode to cover the page
  const FADE_START = 3.45, FADE_END = 4.1;
  const BLUE = [63, 184, 255], RED = [255, 96, 64];
  let el, cv, ctx, logo, slots = [], t0 = 0, rays = [], streaks = [], done = false, nextSwap = 0, frozen = 0, manual = false;

  function mkRays() {
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    rays = []; streaks = [];
    for (let i = 0; i < 44; i++) rays.push({ a: (i / 44) * Math.PI * 2 + (rnd() - 0.5) * 0.12, w: 0.012 + rnd() * 0.06, len: 0.55 + rnd() * 0.9, spin: 0.6 + rnd() * 0.8 });
    for (let i = 0; i < 70; i++) streaks.push({ a: rnd() * Math.PI * 2, w: 0.002 + rnd() * 0.006, len: 0.9 + rnd() * 1.3, off: 0.15 + rnd() * 0.5, spin: 1 + rnd() * 1.5 });
  }
  const mix = (a, b, f) => a.map((v, i) => Math.round(v + (b[i] - v) * f));
  const rgba = (c, al) => `rgba(${c[0]},${c[1]},${c[2]},${al})`;
  const clamp01 = v => Math.max(0, Math.min(1, v));

  function drawRays(t, W, H, cx, cy) {
    ctx.clearRect(0, 0, W, H);
    const pulse = t < DUR ? 0.5 - 0.5 * Math.cos((t / 0.5) * Math.PI * 2) : 1;   // one beat per 0.5s, in sync with the logo
    const u = clamp01((t - DUR) / BURST), e = 1 - Math.pow(1 - u, 3);              // burst easing
    const base = Math.max(W, H) * (0.42 + 0.06 * pulse) * (1 + 7 * e);
    const widen = 1 + 1.6 * e;
    const glow = (0.55 + 0.25 * pulse) * (1 - 0.45 * e);   // rays hand the color over to the wash as it floods
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const drawRay = (a, w, len, alpha) => {
      const f = (Math.cos(a) + 1) / 2;                                             // right = red, left = blue (like the icon)
      const c = mix(BLUE, RED, f);
      const L = base * len;
      const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * L, cy + Math.sin(a) * L);
      g.addColorStop(0, rgba(c, alpha)); g.addColorStop(0.35, rgba(c, alpha * 0.55)); g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a - w) * L, cy + Math.sin(a - w) * L);
      ctx.lineTo(cx + Math.cos(a + w) * L, cy + Math.sin(a + w) * L);
      ctx.closePath(); ctx.fill();
    };
    for (const r of rays) drawRay(r.a + t * 0.12 * r.spin, r.w * widen, r.len, glow * 0.9);
    for (const s of streaks) drawRay(s.a - t * 0.2 * s.spin, s.w * widen, s.len, glow * 0.7);
    // soft core behind the logo, becomes a white-hot flash during the burst
    const coreR = 150 + 40 * pulse + 380 * e;
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    core.addColorStop(0, `rgba(255,255,255,${0.35 + 0.4 * e})`); core.addColorStop(0.45, `rgba(255,240,220,${0.15 + 0.25 * e})`); core.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // wash: the dark ground gives way to color as the burst covers the page
    if (e > 0) { ctx.save(); ctx.globalCompositeOperation = 'destination-over'; const wash = ctx.createLinearGradient(0, 0, W, 0); wash.addColorStop(0, rgba(BLUE, e)); wash.addColorStop(0.36, rgba(mix(BLUE, [255, 255, 255], 0.45), e)); wash.addColorStop(0.5, `rgba(255,248,240,${e})`); wash.addColorStop(0.64, rgba(mix(RED, [255, 255, 255], 0.45), e)); wash.addColorStop(1, rgba(RED, e)); ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }
  function swapInterval(t) { return 0.045 + 0.28 * Math.pow(clamp01(t / DUR), 1.6); }  // seconds between shuffles: fast, then slow
  function frame(t) {
    const W = cv.width, H = cv.height, cx = W / 2, cy = logo.offsetTop + logo.offsetHeight / 2 + el.querySelector('.loader-center').offsetTop;
    // emoji shuffle with slowing cadence; slot i locks at 0.5*(i+1)s, left to right
    if (t >= nextSwap && t < DUR) {
      nextSwap = t + swapInterval(t);
      slots.forEach((s, i) => { if (!s.dataset.locked) { let e; do { e = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]; } while (e === s.textContent && EMOJIS.length > 1); s.textContent = e; } });
    }
    while (frozen < slots.length && t >= 0.5 * (frozen + 1)) { const s = slots[frozen]; s.textContent = EMOJIS[frozen]; s.dataset.locked = '1'; s.classList.add('locked'); frozen++; }
    drawRays(t, W, H, cx, cy);
    const u = clamp01((t - DUR) / BURST);
    el.querySelector('#loader-emojis').style.opacity = String(1 - clamp01((t - DUR) / 0.3));
    el.style.background = u > 0 ? 'transparent' : '';
    logo.style.transform = t >= DUR ? `scale(${1 + 0.12 * u})` : '';
    logo.classList.toggle('pulsing', t < DUR);
    if (t >= FADE_START) el.style.opacity = String(1 - clamp01((t - FADE_START) / (FADE_END - FADE_START)));
    if (t >= FADE_END) finish();
  }
  function finish() { if (done) return; done = true; el.remove(); document.dispatchEvent(new Event('loader:done')); }
  function loop(now) { if (done || manual) return; frame((now - t0) / 1000); requestAnimationFrame(loop); }
  function start() {
    el = document.getElementById('loader'); if (!el) return;
    cv = el.querySelector('canvas'); ctx = cv.getContext('2d'); logo = el.querySelector('#loader-logo'); slots = Array.from(el.querySelectorAll('#loader-emojis span'));
    const app = document.getElementById('app'); cv.width = app.clientWidth; cv.height = app.clientHeight;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.style.transition = 'opacity .4s'; el.style.opacity = '0'; setTimeout(finish, 450); return; }
    mkRays(); t0 = performance.now(); nextSwap = 0; frozen = 0;
    requestAnimationFrame(loop);
  }
  // debugFrame(t): halt the live loop and render one exact moment (used for testing)
  function debugFrame(t) { manual = true; if (!el) return; frame(t); }
  return { start, frame, debugFrame, EMOJIS };
})();
