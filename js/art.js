/* ============ ART: procedural Battle-Cats-style drawing ============ */
const ART = (() => {
  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  const OUTLINE = '#222';

  function emoji(ctx, ch, x, y, px) {
    ctx.save();
    ctx.font = `${px}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ch, x, y + px * 0.05);
    ctx.restore();
  }
  function ellipse(ctx, x, y, rx, ry, fill, stroke, lw) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
  }
  function rrect(ctx, x, y, w, h, r, fill, stroke, lw) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
  }
  function darken(hex, amt) {
    const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex);
    if (!m) return hex;
    const f = v => Math.max(0, Math.min(255, Math.round(parseInt(v, 16) * (1 - amt)))).toString(16).padStart(2, '0');
    return '#' + f(m[1]) + f(m[2]) + f(m[3]);
  }

  // Body metrics for a look
  function bodyDims(look, s) {
    switch (look.body) {
      case 'round': return { rx: s * 1.05, ry: s * 1.05 };
      case 'wide': return { rx: s * 1.25, ry: s * 0.85 };
      case 'tall': return { rx: s * 0.8, ry: s * 1.15 };
      case 'long': return { rx: s * 1.3, ry: s * 0.72 };
      case 'box': return { rx: s * 1.0, ry: s * 0.95 };
      default: return { rx: s * 1.0, ry: s * 0.92 };
    }
  }

  /**
   * Draw a creature. (x,y) = body center. s = base radius (about 16 for a normal unit).
   * o = { bob, squash, flash, alpha, hpFrac, stunned, frozen, raged, dying }
   */
  function drawCreature(ctx, look, x, y, s, o = {}) {
    s *= (look.scale || 1);
    const { rx, ry } = bodyDims(look, s);
    const color = look.color || '#fff';
    const bob = o.bob || 0;
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.translate(x, y + bob);
    if (o.squash) ctx.scale(1 + o.squash * 0.15, 1 - o.squash * 0.15);
    if (o.facing === -1) ctx.scale(-1, 1);

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(0, ry + 3 - bob, rx * 0.9, ry * 0.25, 0, 0, Math.PI * 2); ctx.fill();

    // behind-body props
    if (look.cape) {
      ctx.fillStyle = '#b3223a';
      ctx.beginPath(); ctx.moveTo(-rx * 0.9, -ry * 0.5); ctx.lineTo(rx * 0.9, -ry * 0.5); ctx.lineTo(rx * 1.3, ry * 1.1); ctx.lineTo(-rx * 1.3, ry * 1.1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.stroke();
    }
    if (look.wings) {
      const wf = Math.sin((o.t || 0) * 14) * 0.25;
      ctx.fillStyle = look.color === '#ffffff' || !look.color ? '#f4f4f4' : darken(color, 0.1);
      for (const d of [-1, 1]) {
        ctx.save(); ctx.scale(d, 1); ctx.rotate(-0.3 - wf);
        ellipse(ctx, rx * 1.05, -ry * 0.3, rx * 0.75, ry * 0.42, ctx.fillStyle, OUTLINE, 2);
        ctx.restore();
      }
    }
    if (look.mane) {
      ctx.fillStyle = '#e08a2a';
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * rx * 0.6, Math.sin(a) * ry * 0.6 - ry * 0.3);
        ctx.lineTo(Math.cos(a + 0.26) * rx * 1.25, Math.sin(a + 0.26) * ry * 1.25 - ry * 0.3);
        ctx.lineTo(Math.cos(a + 0.52) * rx * 0.6, Math.sin(a + 0.52) * ry * 0.6 - ry * 0.3); ctx.fill();
      }
    }
    if (look.ufo) {
      ellipse(ctx, 0, ry * 0.75, rx * 1.7, ry * 0.42, '#8ea0b8', OUTLINE, 2);
      ellipse(ctx, 0, ry * 0.7, rx * 1.2, ry * 0.25, '#b9c9de');
      for (let i = -1; i <= 1; i++) ellipse(ctx, i * rx * 0.9, ry * 0.85, 3, 3, '#ffd166');
    }
    if (look.treads) rrect(ctx, -rx * 1.1, ry * 0.5, rx * 2.2, ry * 0.6, 6, '#444', OUTLINE, 2);
    if (look.legs) {
      const L = look.legs === 'longer' ? ry * 1.9 : ry * 1.3;
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (const d of [-0.4, 0.4]) { ctx.beginPath(); ctx.moveTo(rx * d, ry * 0.6); ctx.lineTo(rx * d * 1.3, ry * 0.6 + L); ctx.stroke(); }
      ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      for (const d of [-0.4, 0.4]) { ctx.beginPath(); ctx.moveTo(rx * d, ry * 0.6); ctx.lineTo(rx * d * 1.3, ry * 0.6 + L); ctx.stroke(); }
    }
    if (look.tail === 'cat' || (look.ears === 'cat' && !look.tail)) {
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(rx * 0.7, ry * 0.5); ctx.quadraticCurveTo(rx * 1.6, ry * 0.2, rx * 1.4, -ry * 0.6); ctx.stroke();
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    } else if (look.tail === 'lizard') {
      ctx.fillStyle = color; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(rx * 0.6, ry * 0.3); ctx.quadraticCurveTo(rx * 1.9, ry * 0.9, rx * 2.1, -ry * 0.3); ctx.quadraticCurveTo(rx * 1.6, ry * 0.5, rx * 0.5, ry * 0.7); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (look.tail === 'rat') {
      ctx.strokeStyle = '#e8a0a0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rx * 0.7, ry * 0.4); ctx.quadraticCurveTo(rx * 2, ry * 0.6, rx * 2.2, -ry * 0.2); ctx.stroke();
    } else if (look.tail === 'ring') {
      ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) { ctx.strokeStyle = i % 2 ? '#333' : '#aaa'; ctx.beginPath(); ctx.moveTo(rx * (0.7 + i * 0.22), ry * (0.4 - i * 0.16)); ctx.lineTo(rx * (0.7 + (i + 1) * 0.22), ry * (0.4 - (i + 1) * 0.16)); ctx.stroke(); }
    }

    // ears (behind body top)
    ctx.fillStyle = color; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2;
    if (look.ears === 'cat') {
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * rx * 0.75, -ry * 0.55); ctx.lineTo(d * rx * 0.55, -ry * 1.45); ctx.lineTo(d * rx * 0.15, -ry * 0.9); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    } else if (look.ears === 'pointy') {
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * rx * 0.8, -ry * 0.4); ctx.lineTo(d * rx * 0.75, -ry * 1.6); ctx.lineTo(d * rx * 0.2, -ry * 0.85); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    } else if (look.ears === 'round') {
      for (const d of [-1, 1]) ellipse(ctx, d * rx * 0.7, -ry * 0.85, rx * 0.32, ry * 0.32, color, OUTLINE, 2);
    }

    // body
    if (look.ghost) {
      ctx.beginPath(); ctx.moveTo(-rx, ry * 0.6); ctx.lineTo(-rx, -ry * 0.2); ctx.arc(0, -ry * 0.2, rx, Math.PI, 0); ctx.lineTo(rx, ry * 0.6);
      for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(rx - rx * (i * 0.5 + 0.25), ry * (i % 2 ? 0.55 : 1.05), rx - rx * (i + 1) * 0.5, ry * 0.7);
      ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.stroke();
    } else if (look.body === 'box') {
      rrect(ctx, -rx, -ry, rx * 2, ry * 2, 6, color, OUTLINE, 2.5);
      ctx.strokeStyle = darken(color, 0.3); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-rx + 4, -ry + 6); ctx.lineTo(rx - 4, -ry + 6); ctx.stroke();
    } else if (look.fluffy) {
      ctx.beginPath();
      const n = 14;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2, a2 = (i + 0.5) / n * Math.PI * 2;
        const px = Math.cos(a) * rx, py = Math.sin(a) * ry, cx = Math.cos(a2) * rx * 1.18, cy = Math.sin(a2) * ry * 1.18;
        if (i === 0) ctx.moveTo(px, py);
        ctx.quadraticCurveTo(cx, cy, Math.cos((i + 1) / n * Math.PI * 2) * rx, Math.sin((i + 1) / n * Math.PI * 2) * ry);
      }
      ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2.5; ctx.stroke();
    } else {
      ellipse(ctx, 0, 0, rx, ry, color, OUTLINE, 2.5);
    }
    if (look.belly) ellipse(ctx, 0, ry * 0.25, rx * 0.6, ry * 0.6, look.belly);
    if (look.belt) { ctx.fillStyle = '#3b3b7a'; ctx.fillRect(-rx, ry * 0.25, rx * 2, ry * 0.3); }
    if (look.bandage) { ctx.strokeStyle = '#f8f8f8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-rx * 0.9, -ry * 0.1); ctx.lineTo(rx * 0.7, ry * 0.5); ctx.moveTo(-rx * 0.5, ry * 0.7); ctx.lineTo(rx * 0.9, ry * 0.1); ctx.stroke(); ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.stroke(); }
    if (look.neck) { /* giraffe: a second smaller head above */ ellipse(ctx, 0, -ry * 1.6, rx * 0.5, ry * 0.5, color, OUTLINE, 2); }
    if (look.antenna) { ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -ry); ctx.lineTo(0, -ry * 1.5); ctx.stroke(); ellipse(ctx, 0, -ry * 1.6, 3.5, 3.5, '#ff5252', OUTLINE, 1.5); }
    if (look.rotor) { ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-rx * 1.4, -ry * 1.3); ctx.lineTo(rx * 1.4, -ry * 1.3); ctx.moveTo(0, -ry); ctx.lineTo(0, -ry * 1.3); ctx.stroke(); }
    if (look.halo) ellipse(ctx, 0, -ry * 1.55, rx * 0.6, ry * 0.18, null, '#ffd54a', 3);
    if (look.hair === 'mohawk') { ctx.fillStyle = '#ff5252'; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(i * rx * 0.2 - rx * 0.12, -ry * 0.85); ctx.lineTo(i * rx * 0.2, -ry * 1.7); ctx.lineTo(i * rx * 0.2 + rx * 0.12, -ry * 0.85); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
    if (look.hair === 'long') { ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(-rx * 0.9, -ry * 0.6); ctx.quadraticCurveTo(-rx * 1.3, ry * 0.4, -rx * 0.9, ry * 0.9); ctx.lineTo(-rx * 0.6, ry * 0.2); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.5; ctx.stroke(); }

    // face
    const ey = -ry * 0.15, ex = rx * 0.38;
    if (look.mask) { ctx.fillStyle = '#2a2a33'; ctx.fillRect(-rx * 0.85, ey - ry * 0.28, rx * 1.7, ry * 0.5); }
    const eyeColor = o.frozen ? '#4ac8ff' : OUTLINE;
    if (look.eyes === 'peek') {
      // box: eyes peeking over the top edge
      ellipse(ctx, -ex, -ry * 0.75, 3, 3, OUTLINE); ellipse(ctx, ex, -ry * 0.75, 3, 3, OUTLINE);
    } else if (look.eyes === 'closed') {
      ctx.strokeStyle = eyeColor; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * ex, ey, 4, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
    } else if (look.eyes === 'x') {
      ctx.strokeStyle = eyeColor; ctx.lineWidth = 2;
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * ex - 3, ey - 3); ctx.lineTo(d * ex + 3, ey + 3); ctx.moveTo(d * ex + 3, ey - 3); ctx.lineTo(d * ex - 3, ey + 3); ctx.stroke(); }
    } else if (look.eyes === 'wide') {
      for (const d of [-1, 1]) { ellipse(ctx, d * ex, ey, 5, 5.5, '#fff', OUTLINE, 1.5); ellipse(ctx, d * ex + 1, ey, 2.5, 2.5, OUTLINE); }
    } else if (look.eyes === 'glow') {
      for (const d of [-1, 1]) { ellipse(ctx, d * ex, ey, 4.5, 4.5, '#ffe14a'); ellipse(ctx, d * ex, ey, 2, 2, '#c22'); }
    } else if (look.eyes === 'laser') {
      ctx.fillStyle = '#ff2a2a'; ctx.fillRect(-ex - 5, ey - 2.5, 10, 5); ctx.fillRect(ex - 5, ey - 2.5, 10, 5);
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.5; ctx.strokeRect(-ex - 5, ey - 2.5, 10, 5); ctx.strokeRect(ex - 5, ey - 2.5, 10, 5);
    } else if (look.eyes === 'alien') {
      for (const d of [-1, 1]) { ctx.save(); ctx.translate(d * ex, ey); ctx.rotate(d * 0.5); ellipse(ctx, 0, 0, 3.5, 6.5, '#111'); ctx.restore(); }
    } else if (look.eyes === 'angry') {
      for (const d of [-1, 1]) { ellipse(ctx, d * ex, ey, 3, 3, eyeColor); ctx.strokeStyle = eyeColor; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(d * ex - 5 * d, ey - 8); ctx.lineTo(d * ex + 5 * d, ey - 4); ctx.stroke(); }
    } else {
      for (const d of [-1, 1]) ellipse(ctx, d * ex, ey, 2.8, 2.8, eyeColor);
    }
    // snout / mouth
    if (look.beak) {
      ctx.fillStyle = '#ffb030'; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-5, ey + 6); ctx.lineTo(5, ey + 6); ctx.lineTo(0, ey + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (look.snout) {
      ellipse(ctx, 0, ry * 0.35, rx * 0.42, ry * 0.3, look.snoutColor || '#e6c39a', OUTLINE, 1.5);
      ellipse(ctx, 0, ry * 0.22, 3.5, 2.5, OUTLINE);
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, ry * 0.3); ctx.lineTo(0, ry * 0.45); ctx.stroke();
      if (look.tusks) { ctx.fillStyle = '#fff'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 6, ry * 0.45); ctx.lineTo(d * 8, ry * 0.95); ctx.lineTo(d * 3, ry * 0.5); ctx.fill(); } }
    } else if (look.eyes !== 'peek') {
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      const my = ey + 8;
      if (look.mouth === 'w') { ctx.beginPath(); ctx.moveTo(-6, my); ctx.quadraticCurveTo(-3, my + 5, 0, my); ctx.quadraticCurveTo(3, my + 5, 6, my); ctx.stroke(); }
      else if (look.mouth === 'tongue') { ctx.beginPath(); ctx.moveTo(-4, my); ctx.lineTo(4, my); ctx.stroke(); ctx.fillStyle = '#ff6b8a'; ctx.fillRect(-1.5, my, 3, 6); }
      else { ctx.beginPath(); ctx.arc(0, my - 2, 5, 0.2, Math.PI - 0.2); ctx.stroke(); }
      if (look.fangs) { ctx.fillStyle = '#fff'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 4, my); ctx.lineTo(d * 5, my + 6); ctx.lineTo(d * 2, my); ctx.fill(); } }
      if (look.ears === 'cat' && !look.mask) { // whiskers
        ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1;
        for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * rx * 0.5, ey + 6); ctx.lineTo(d * rx * 1.25, ey + 3); ctx.moveTo(d * rx * 0.5, ey + 9); ctx.lineTo(d * rx * 1.25, ey + 11); ctx.stroke(); }
      }
    }
    // props
    if (look.hat) emoji(ctx, look.hat, 0, -ry * 1.25, s * 1.2);
    if (look.item) emoji(ctx, look.item, rx * 1.05, ry * 0.05, s * 1.3);
    if (look.emoji) emoji(ctx, look.emoji, 0, 0, s * 2.4);
    if (look.speedlines) { ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-rx * 1.2, i * 6); ctx.lineTo(-rx * 1.9, i * 6); ctx.stroke(); } }

    // status overlays
    if (o.flash) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(255,80,80,0.55)'; ctx.fillRect(-rx * 2.2, -ry * 2.2, rx * 4.4, ry * 4.4); ctx.globalCompositeOperation = 'source-over'; }
    if (o.frozen) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(120,200,255,0.5)'; ctx.fillRect(-rx * 2.2, -ry * 2.2, rx * 4.4, ry * 4.4); ctx.globalCompositeOperation = 'source-over'; }
    if (o.raged) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(160,255,120,0.3)'; ctx.fillRect(-rx * 2.2, -ry * 2.2, rx * 4.4, ry * 4.4); ctx.globalCompositeOperation = 'source-over'; }
    if (o.stunned) emoji(ctx, '💫', 0, -ry * 1.6 - (look.hat ? 10 : 0), 13);
    ctx.restore();
  }

  // Portrait cache
  const portraitCache = new Map();
  function portrait(def, formIdx = 0, size = 64) {
    const key = def.id + ':' + formIdx + ':' + size;
    if (portraitCache.has(key)) return portraitCache.get(key);
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const look = def.forms ? def.forms[formIdx].look : def.look;
    const sc = (look.scale || 1);
    let s = size * 0.24 / Math.max(1, sc * 0.85);
    if (look.legs) s *= 0.75;
    drawCreature(ctx, look, size / 2, size / 2 + (look.legs ? -size * 0.12 : 0) + (look.hat ? size * 0.06 : 0), s, {});
    portraitCache.set(key, c);
    return c;
  }
  function drawPortraitTo(canvas, def, formIdx = 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(portrait(def, formIdx, canvas.width), 0, 0);
  }

  // ---------- Towers ----------
  function drawTower(ctx, b, t) {
    const { x, y } = b;
    const frac = Math.max(0, b.hp / b.maxHp);
    const king = b.type === 'king';
    ctx.save();
    if (b.owner === 0) {
      // Scratching post / Cat Base (cardboard castle)
      if (king) {
        rrect(ctx, x - 44, y - 30, 88, 60, 8, '#d9a066', OUTLINE, 3);
        for (let i = 0; i < 4; i++) rrect(ctx, x - 44 + i * 24, y - 42, 16, 14, 3, '#c98a4b', OUTLINE, 2);
        rrect(ctx, x - 12, y - 4, 24, 34, [10, 10, 0, 0], '#5a3b1e', OUTLINE, 2);
        drawCreature(ctx, { body: 'blob', color: '#fff', ears: 'cat', mouth: 'w', eyes: 'dot', tail: 'none' }, x - 26, y - 12, 9, {});
        emoji(ctx, '🚩', x + 30, y - 46, 16);
      } else {
        // cat tree
        ctx.fillStyle = '#8b5a2b'; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2;
        ctx.fillRect(x - 6, y - 30, 12, 50); ctx.strokeRect(x - 6, y - 30, 12, 50);
        rrect(ctx, x - 26, y + 16, 52, 10, 4, '#a9713d', OUTLINE, 2);
        rrect(ctx, x - 22, y - 38, 44, 12, 4, '#a9713d', OUTLINE, 2);
        ctx.strokeStyle = '#d2b48c'; ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x - 6, y - 24 + i * 8); ctx.lineTo(x + 6, y - 22 + i * 8); ctx.stroke(); }
        drawCreature(ctx, { body: 'blob', color: '#fff', ears: 'cat', mouth: 'w', eyes: 'dot' }, x, y - 48, 8, {});
      }
    } else {
      // Doghouse
      const w = king ? 46 : 32, h = king ? 34 : 26;
      const wall = b.tint || '#e8c9a0', roof = b.roofTint || '#c0392b';
      rrect(ctx, x - w, y - h * 0.3, w * 2, h * 1.3, 4, wall, OUTLINE, 3);
      ctx.fillStyle = roof; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x - w - 8, y - h * 0.3); ctx.lineTo(x, y - h * 1.3); ctx.lineTo(x + w + 8, y - h * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3a2410'; ctx.beginPath(); ctx.arc(x, y + h * 0.35, w * 0.45, Math.PI, 0); ctx.lineTo(x + w * 0.45, y + h); ctx.lineTo(x - w * 0.45, y + h); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.stroke();
      if (king) { emoji(ctx, b.flag || '🦴', x, y - h * 1.45, 18); }
      if (b.owner === 1) { // peeking eyes
        ellipse(ctx, x - 6, y + h * 0.45, 3, 3, '#ffe14a'); ellipse(ctx, x + 6, y + h * 0.45, 3, 3, '#ffe14a');
      }
    }
    // hp bar
    const bw = king ? 70 : 50;
    const by = y + (king ? 40 : 34);
    rrect(ctx, x - bw / 2, by, bw, 7, 3, '#000c');
    rrect(ctx, x - bw / 2 + 1, by + 1, (bw - 2) * frac, 5, 2, b.owner === 0 ? '#5ee08c' : '#ff6b6b');
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(Math.ceil(b.hp), x, by + 16);
    // firing flash
    if (b.flash > 0) { ellipse(ctx, x, y - (king ? 20 : 40), 6, 6, '#ffe14a'); }
    ctx.restore();
  }

  // ---------- Arena ----------
  let bgCache = null, bgKey = '';
  function drawArena(ctx, world, W, H, layout) {
    const key = world.id + ':' + W + 'x' + H;
    if (bgKey !== key) {
      bgCache = document.createElement('canvas'); bgCache.width = W; bgCache.height = H;
      const c = bgCache.getContext('2d');
      const bg = world.bg;
      c.fillStyle = bg.grass; c.fillRect(0, 0, W, H);
      // seeded decor
      let seed = world.id * 977 + 13;
      const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      c.fillStyle = bg.accent;
      for (let i = 0; i < 90; i++) { const dx = rnd() * W, dy = rnd() * H, r = 1 + rnd() * 3; c.beginPath(); c.arc(dx, dy, r, 0, Math.PI * 2); c.fill(); }
      // lanes
      for (const lx of layout.lanes) { c.fillStyle = bg.lane; c.beginPath(); c.roundRect(lx - 44, 20, 88, H - 40, 30); c.fill(); }
      // halves tint
      c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(0, layout.river, W, H - layout.river);
      // river / fence
      c.fillStyle = bg.river; c.fillRect(0, layout.river - 12, W, 24);
      c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, layout.river - 12); c.lineTo(W, layout.river - 12); c.moveTo(0, layout.river + 12); c.lineTo(W, layout.river + 12); c.stroke();
      // gates (bridges)
      for (const lx of layout.lanes) { c.fillStyle = '#a97a44'; c.fillRect(lx - 30, layout.river - 16, 60, 32); c.strokeStyle = OUTLINE; c.lineWidth = 2; c.strokeRect(lx - 30, layout.river - 16, 60, 32); c.strokeStyle = 'rgba(0,0,0,0.3)'; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(lx - 30 + i * 15, layout.river - 16); c.lineTo(lx - 30 + i * 15, layout.river + 16); c.stroke(); } }
      // world label
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillText(world.icon + ' ' + world.name.toUpperCase(), W / 2, layout.river + 4);
      bgKey = key;
    }
    ctx.drawImage(bgCache, 0, 0);
  }

  return { drawCreature, portrait, drawPortraitTo, drawTower, drawArena, emoji, ellipse, rrect, darken, EMOJI_FONT };
})();
