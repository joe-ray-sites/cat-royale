/* ============ BATTLE ENGINE ============ */
const ENGINE = (() => {
  const W = 360, H = 560;
  const LAYOUT = { lanes: [90, 270], river: 280, kingX: 180, kingY: { 0: 505, 1: 55 }, postY: { 0: 425, 1: 135 } };
  const MATCH_TIME = 180, OVERTIME = 60, DOUBLE_AT = 120;
  const KIBBLE_RATE = 1 / 2.5, KIBBLE_MAX = 10, CANNON_TIME = 25;
  const TOWER = { post: { hp: 1500, dmg: 62, range: 130, rate: 0.8 }, king: { hp: 2700, dmg: 95, range: 115, rate: 1.0 } };
  const UNIT_R = 14;

  function computeStats(def, { level = 1, form = 0, mult = 1 }) {
    const st = Object.assign({}, def);
    if (def.formAdd && def.formAdd[form]) Object.assign(st, def.formAdd[form]);
    let m = mult;
    if (def.kind === 'spell') m *= (1 + 0.08 * (level - 1));
    else m *= DATA.LEVEL_MULT(level) * DATA.FORM_MULT[form];
    st.hp = Math.round((st.hp || 0) * m); st.dmg = Math.round((st.dmg || 0) * m);
    if (st.heal) st.heal = Math.round(st.heal * m);
    st.mult = m;
    return st;
  }
  function makeCard(def, opts, owner) {
    const st = computeStats(def, opts);
    const form = opts.form || 0;
    const look = def.forms ? def.forms[form].look : def.look;
    const name = def.forms ? def.forms[form].name : def.name;
    return { def, name, cost: def.cost, kind: def.kind, stats: st, look, form, owner, level: opts.level || 1 };
  }
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  class Battle {
    /** opts: { world, stage, playerCards:[card], enemyCards:[card], enemyMult, enemyTowerMult, playerTowerMult, aiLevel, boss(card|null), onEvent } */
    constructor(o) {
      this.o = o; this.t = 0; this.phase = 'play'; this.over = false; this.winner = -1; this.draw = false;
      this.onEvent = o.onEvent || (() => {});
      this.units = []; this.buildings = []; this.projectiles = []; this.effects = [];
      this.paws = [0, 0]; this.nextId = 1; this.bossSpawned = false; this.doubleAnnounced = false;
      this.players = [this.mkPlayer(o.playerCards), this.mkPlayer(o.enemyCards)];
      this.players[1].cannonDmg = Math.round(150 * (o.enemyMult || 1));
      this.players[0].cannonDmg = Math.round(170 * (o.playerTowerMult || 1));
      // towers
      const mk = (owner, type, x, y, lane, mult) => ({ id: this.nextId++, type, owner, x, y, lane, hp: Math.round(TOWER[type].hp * mult), maxHp: Math.round(TOWER[type].hp * mult), dmg: Math.round(TOWER[type].dmg * mult), range: TOWER[type].range, rate: TOWER[type].rate, cd: 1 + Math.random(), dead: false, flash: 0, building: true, flying: false, traits: [] });
      for (const owner of [0, 1]) {
        const mult = owner === 0 ? (o.playerTowerMult || 1) : (o.enemyTowerMult || 1);
        this.buildings.push(mk(owner, 'king', LAYOUT.kingX, LAYOUT.kingY[owner], -1, mult));
        LAYOUT.lanes.forEach((lx, li) => this.buildings.push(mk(owner, 'post', lx, LAYOUT.postY[owner], li, mult)));
      }
      const wb = o.world && o.world.bg;
      this.buildings.filter(b => b.owner === 1).forEach(b => { b.roofTint = wb ? wb.river : '#c0392b'; b.flag = o.world ? o.world.icon : '🦴'; });
    }
    mkPlayer(cards) {
      const deck = shuffle(cards.slice());
      return { kibble: 5, hand: deck.slice(0, 4), next: deck[4], queue: deck.slice(5), cannon: 0, cannonDmg: 150, spent: 0 };
    }
    // ---------- public API ----------
    dir(owner) { return owner === 0 ? -1 : 1; }
    laneOf(x) { return Math.abs(x - LAYOUT.lanes[0]) <= Math.abs(x - LAYOUT.lanes[1]) ? 0 : 1; }
    ownHalf(owner, y) { return owner === 0 ? y >= LAYOUT.river + 14 : y <= LAYOUT.river - 14; }
    canPlay(owner, handIdx) { const p = this.players[owner]; const c = p.hand[handIdx]; return !!c && p.kibble >= c.cost && !this.over; }
    playCard(owner, handIdx, x, y) {
      const p = this.players[owner]; const card = p.hand[handIdx];
      if (!card || p.kibble < card.cost || this.over) return false;
      if (card.kind !== 'spell' && !this.ownHalf(owner, y)) return false;
      p.kibble -= card.cost; p.spent += card.cost;
      // cycle
      p.hand[handIdx] = p.next; p.next = p.queue.shift(); p.queue.push(card);
      if (card.kind === 'spell') this.castSpell(owner, card, x, y);
      else this.spawnUnit(owner, card, x, y, true);
      this.onEvent(card.kind === 'spell' ? 'spell' : 'deploy', { owner, card });
      return true;
    }
    fireCannon(owner) {
      const p = this.players[owner];
      if (p.cannon < 1 || this.over) return false;
      p.cannon = 0;
      const startY = owner === 0 ? LAYOUT.kingY[0] - 30 : LAYOUT.kingY[1] + 30;
      this.effects.push({ type: 'wave', owner, y: startY, speed: 380, dmg: p.cannonDmg, hit: new Set(), t: 0, dur: 2 });
      this.onEvent('cannon', { owner });
      return true;
    }
    // ---------- spawn ----------
    spawnUnit(owner, card, x, y, fromHand) {
      const st = card.stats; const lane = this.laneOf(x);
      const lx = LAYOUT.lanes[lane];
      const n = st.count || 1;
      const yLim = owner === 0 ? [LAYOUT.river + 16, H - 40] : [30, LAYOUT.river - 16];
      const cy = Math.max(yLim[0], Math.min(yLim[1], y));
      const spawned = [];
      for (let i = 0; i < n; i++) {
        const ox = n > 1 ? (i - (n - 1) / 2) * 16 : 0, oy = n > 1 ? ((i % 2) * 2 - 1) * 8 : 0;
        const u = {
          id: this.nextId++, owner, card, def: card.def, look: card.look, name: card.name, lane, x: lx + ox, y: cy + oy,
          hp: st.hp, maxHp: st.hp, dmg: st.dmg, range: st.range, speed: st.speed, rate: st.rate, cd: 0.4,
          flying: !!st.flying, hitsAir: !!st.hitsAir, targetMode: st.target || 'any', area: st.area || 0, knockback: !!st.knockback,
          strongVs: st.strongVs || [], traits: st.traits || [], revive: st.revive || 0, lifesteal: st.lifesteal || 0, armor: st.armor || 0,
          slow: st.slow || 0, freeze: st.freeze || 0, stun: st.stun || 0, stick: st.stick || 0, gummedUntil: 0, critEvery: st.critEvery || 0, critMult: st.critMult || 1.5, shots: 0, pierce: !!st.pierce, suicide: !!st.suicide, heal: st.heal || 0,
          building: st.kind === 'building', spawns: st.spawns, spawnEvery: st.spawnEvery || 4, spawnT: st.spawnEvery ? 1.5 : 0, life: st.lifetime || 0,
          stunUntil: 0, slowUntil: 0, frozenUntil: 0, rageUntil: 0, flashUntil: 0, kbv: 0, bobT: Math.random() * 6, squash: 0,
          dead: false, dying: 0, boss: !!st.boss, healT: 0, dir: this.dir(owner), target: null,
        };
        this.units.push(u); spawned.push(u);
      }
      this.effects.push({ type: 'puff', x: lx, y: cy, t: 0, dur: 0.4 });
      if (fromHand && st.kibbleOnDeploy) {
        const p = this.players[owner]; p.kibble = Math.min(KIBBLE_MAX, p.kibble + st.kibbleOnDeploy);
        this.effects.push({ type: 'text', x: lx, y: cy - 30, txt: '+' + st.kibbleOnDeploy + ' 🐟 fans!', t: 0, dur: 1.2, color: '#5ec8ff' });
      }
      return spawned;
    }
    castSpell(owner, card, x, y) {
      const st = card.stats; const r = st.radius;
      const enemies = this.units.filter(u => u.owner !== owner && !u.dead && Math.hypot(u.x - x, u.y - y) <= r + UNIT_R * 0.5);
      if (st.rage) {
        this.units.filter(u => u.owner === owner && !u.dead && Math.hypot(u.x - x, u.y - y) <= r + UNIT_R).forEach(u => { u.rageUntil = this.t + st.rage; });
        this.effects.push({ type: 'ring', x, y, r, t: 0, dur: 0.8, color: '#7be495' });
        this.effects.push({ type: 'cloud', x, y, r, t: 0, dur: st.rage, color: 'rgba(120,230,140,0.25)' });
        return;
      }
      for (const u of enemies) {
        if (st.dmg) this.damage(null, u, st.dmg * (u.flying && !st.hitsAir ? 0 : 1), { knockback: st.knockback, owner });
        if (st.stun) u.stunUntil = Math.max(u.stunUntil, this.t + st.stun);
      }
      if (st.dmg) this.buildings.filter(b => b.owner !== owner && !b.dead && Math.hypot(b.x - x, b.y - y) <= r + 20).forEach(b => this.damage(null, b, Math.round(st.dmg * 0.35), { owner }));
      this.effects.push({ type: 'ring', x, y, r, t: 0, dur: 0.6, color: st.stun && !st.dmg ? '#ff4d4d' : '#ffb347' });
      if (st.dmg) this.effects.push({ type: 'burst', x, y, r: r * 0.8, t: 0, dur: 0.45, color: '#ffb347' });
      if (st.stun && !st.dmg) this.effects.push({ type: 'dot', x, y, t: 0, dur: st.stun });
    }
    // ---------- damage ----------
    damage(att, tgt, amount, opts = {}) {
      if (tgt.dead) return 0;
      // gum: sticks the target in place even though it deals no damage (bosses for half as long)
      if (att && att.stick && !tgt.building) {
        const dur = tgt.boss ? att.stick * 0.5 : att.stick;
        tgt.stunUntil = Math.max(tgt.stunUntil, this.t + dur); tgt.gummedUntil = Math.max(tgt.gummedUntil || 0, this.t + dur);
        this.effects.push({ type: 'text', x: tgt.x, y: tgt.y - 22, txt: 'STUCK!', t: 0, dur: 0.8, color: '#ff8ac4' });
      }
      if (amount <= 0) return 0;
      let d = amount;
      if (att) {
        const aSV = att.strongVs || [], aTr = att.traits || [];
        if (att.rageUntil > this.t) d *= 1.4;
        const strong = aSV.some(t => tgt.traits && tgt.traits.includes(t));
        if (strong) d *= 1.5;
        if (tgt.traits && tgt.traits.includes('metal') && !aSV.includes('metal') && !tgt.building && !att.building) d *= 0.25;
        // defender is strong vs attacker's traits -> takes half
        if (tgt.strongVs && tgt.strongVs.some(t => aTr.includes(t))) d *= 0.5;
      }
      if (tgt.armor) d *= (1 - tgt.armor);
      d = Math.max(1, Math.round(d));
      tgt.hp -= d;
      if (tgt.building) { tgt.flash = 0.1; if (tgt.hp <= 0) this.destroyBuilding(tgt); return d; }
      tgt.flashUntil = this.t + 0.08;
      if (opts.knockback && !tgt.boss) tgt.kbv = (att ? att.dir : (opts.owner === 0 ? -1 : 1)) * 110;
      if (opts.knockback && tgt.boss) tgt.kbv = (att ? att.dir : (opts.owner === 0 ? -1 : 1)) * 30;
      if (att && att.lifesteal) att.hp = Math.min(att.maxHp, att.hp + d * att.lifesteal);
      if (att && att.slow) tgt.slowUntil = Math.max(tgt.slowUntil, this.t + att.slow);
      if (att && att.freeze) tgt.frozenUntil = Math.max(tgt.frozenUntil, this.t + att.freeze);
      if (att && att.stun && !tgt.boss) tgt.stunUntil = Math.max(tgt.stunUntil, this.t + att.stun);
      if (tgt.hp <= 0) {
        if (tgt.revive > 0) { tgt.revive--; tgt.hp = Math.round(tgt.maxHp * 0.5); tgt.stunUntil = this.t + 0.6; this.effects.push({ type: 'text', x: tgt.x, y: tgt.y - 20, txt: 'REVIVE!', t: 0, dur: 0.9, color: '#b8e0b0' }); }
        else { tgt.dead = true; tgt.dying = 0.35; this.onEvent('death', { unit: tgt }); }
      }
      return d;
    }
    destroyBuilding(b) {
      b.dead = true; b.hp = 0;
      const winner = 1 - b.owner;
      this.paws[winner] = Math.min(3, this.paws[winner] + 1);
      this.effects.push({ type: 'burst', x: b.x, y: b.y, r: 60, t: 0, dur: 0.7, color: '#ff8c42' });
      this.effects.push({ type: 'text', x: b.x, y: b.y - 40, txt: b.type === 'king' ? 'BASE DOWN!' : 'TOWER DOWN!', t: 0, dur: 1.4, color: '#ffe14a' });
      this.onEvent('towerDown', { building: b, winner });
      if (b.type === 'king') { this.paws[winner] = 3; this.end(winner); return; }
      if (this.phase === 'overtime') this.end(winner);
    }
    end(winner) {
      if (this.over) return;
      this.over = true; this.winner = winner; this.phase = 'done';
      this.onEvent('end', { winner, paws: this.paws });
    }
    // ---------- targeting helpers ----------
    enemyBuildingAhead(u) {
      // the post in the unit's lane if alive, else king
      const post = this.buildings.find(b => b.owner !== u.owner && b.type === 'post' && b.lane === u.lane && !b.dead);
      if (post) return post;
      return this.buildings.find(b => b.owner !== u.owner && b.type === 'king' && !b.dead) || null;
    }
    distToBuilding(u, b) { return (b.y - u.y) * u.dir - 22; }
    findTarget(u) {
      let best = null, bestD = 1e9;
      if (u.targetMode !== 'buildings') {
        for (const v of this.units) {
          if (v.owner === u.owner || v.dead || v.lane !== u.lane) continue;
          if (v.flying && !u.hitsAir) continue;
          const ahead = (v.y - u.y) * u.dir;
          if (ahead < -18) continue;
          const d = Math.abs(v.y - u.y) - 8;
          if (d <= u.range && d < bestD) { best = v; bestD = d; }
        }
      }
      const b = this.enemyBuildingAhead(u);
      if (b) { const d = this.distToBuilding(u, b); if (d <= u.range && d < bestD - 6) { best = b; bestD = d; } }
      return best;
    }
    // ---------- step ----------
    step(dt) {
      if (this.over) { this.tickVisuals(dt); return; }
      this.t += dt;
      const double = this.t >= DOUBLE_AT;
      if (double && !this.doubleAnnounced) { this.doubleAnnounced = true; this.onEvent('double', {}); }
      for (const p of this.players) {
        p.kibble = Math.min(KIBBLE_MAX, p.kibble + KIBBLE_RATE * dt * (double ? 2 : 1));
        p.cannon = Math.min(1, p.cannon + dt / CANNON_TIME);
      }
      // timing phases
      if (this.phase === 'play' && this.t >= MATCH_TIME) {
        if (this.paws[0] !== this.paws[1]) { this.end(this.paws[0] > this.paws[1] ? 0 : 1); return; }
        this.phase = 'overtime'; this.onEvent('overtime', {});
      }
      if (this.phase === 'overtime' && this.t >= MATCH_TIME + OVERTIME) {
        const hpf = o => this.buildings.filter(b => b.owner === o).reduce((a, b) => a + b.hp / b.maxHp, 0);
        const a = hpf(0), b = hpf(1);
        if (Math.abs(a - b) < 0.001) { this.draw = true; this.end(1); } else this.end(a > b ? 0 : 1);
        return;
      }
      // boss
      if (this.o.boss && !this.bossSpawned && this.t >= 40) {
        this.bossSpawned = true;
        const lane = Math.random() < 0.5 ? 0 : 1;
        this.spawnUnit(1, this.o.boss, LAYOUT.lanes[lane], 70, false);
        this.onEvent('boss', { card: this.o.boss });
      }
      // AI hook
      if (this.o.ai) this.o.ai.update(dt, this);

      // towers
      for (const b of this.buildings) {
        if (b.dead) continue;
        b.flash = Math.max(0, b.flash - dt); b.cd -= dt;
        if (b.cd <= 0) {
          let best = null, bd = 1e9;
          for (const u of this.units) { if (u.owner === b.owner || u.dead) continue; const d = Math.hypot(u.x - b.x, u.y - b.y); if (d <= b.range && d < bd) { best = u; bd = d; } }
          if (best) { b.cd = b.rate; b.flash = 0.12; this.projectiles.push({ x: b.x, y: b.y - (b.type === 'king' ? 20 : 40), target: best, speed: 300, dmg: b.dmg, owner: b.owner, att: b, style: b.owner === 0 ? 'yarn' : 'bone', area: 0 }); }
        }
      }
      // units
      for (const u of this.units) {
        if (u.dead) continue;
        u.bobT += dt; u.squash = Math.max(0, u.squash - dt * 4);
        if (u.life) { u.life -= dt; if (u.life <= 0) { u.dead = true; u.dying = 0.35; continue; } }
        // knockback
        if (u.kbv) { u.y += u.kbv * dt; u.kbv *= Math.pow(0.02, dt); if (Math.abs(u.kbv) < 4) u.kbv = 0; u.y = Math.max(30, Math.min(H - 30, u.y)); }
        const frozen = u.frozenUntil > this.t, stunned = u.stunUntil > this.t;
        if (frozen || stunned) continue;
        u.cd -= dt * (u.rageUntil > this.t ? 1.4 : 1);
        // healer aura
        if (u.heal) { u.healT -= dt; if (u.healT <= 0) { u.healT = 1; for (const v of this.units) { if (v.owner === u.owner && !v.dead && v !== u && Math.hypot(v.x - u.x, v.y - u.y) < 70 && v.hp < v.maxHp) { v.hp = Math.min(v.maxHp, v.hp + u.heal); this.effects.push({ type: 'text', x: v.x, y: v.y - 16, txt: '+' + u.heal, t: 0, dur: 0.6, color: '#7be495' }); } } } }
        // spawner
        if (u.spawns) { u.spawnT -= dt; if (u.spawnT <= 0) { u.spawnT = u.spawnEvery; const def = DATA.CAT_BY_ID[u.spawns]; const card = makeCard(def, { level: u.card.level, form: 0, mult: u.card.stats.mult / (DATA.LEVEL_MULT(u.card.level) * DATA.FORM_MULT[u.card.form]) }, u.owner); this.spawnUnit(u.owner, card, u.x, u.y + u.dir * 14, false); } continue; }
        if (u.building) continue;
        const tgt = this.findTarget(u);
        u.target = tgt;
        if (tgt) {
          if (u.cd <= 0) { u.cd = u.rate; this.attack(u, tgt); }
        } else {
          const slow = u.slowUntil > this.t ? 0.5 : 1;
          const rage = u.rageUntil > this.t ? 1.35 : 1;
          const b = this.enemyBuildingAhead(u);
          let step = u.speed * slow * rage * dt;
          if (b) { const d = this.distToBuilding(u, b); if (d - step < Math.min(u.range, 20)) step = Math.max(0, d - Math.min(u.range, 20)); }
          u.y += u.dir * step;
          u.y = Math.max(24, Math.min(H - 24, u.y));
        }
      }
      this.tickVisuals(dt);
    }
    attack(u, tgt) {
      u.squash = 1;
      if (u.suicide) {
        this.splash(u, tgt.x, tgt.y, u.dmg, u.area, tgt);
        u.dead = true; u.dying = 0.2; this.effects.push({ type: 'burst', x: u.x, y: u.y, r: u.area, t: 0, dur: 0.5, color: '#ff8c42' });
        this.onEvent('boom', {}); return;
      }
      if (u.pierce) {
        // beam hits everything ahead in lane within range
        const y2 = u.y + u.dir * u.range;
        for (const v of this.units) { if (v.owner === u.owner || v.dead || v.lane !== u.lane) continue; if ((v.y - u.y) * u.dir >= -8 && Math.abs(v.y - u.y) <= u.range) this.damage(u, v, u.dmg); }
        if (tgt.building) this.damage(u, tgt, u.dmg);
        this.effects.push({ type: 'beam', x: u.x, y1: u.y, y2, t: 0, dur: 0.25 });
        return;
      }
      if (u.range > 40) {
        const style = u.stick ? 'gum' : u.critEvery ? 'water' : u.look.item === '🏹' ? 'arrow' : u.look.item === '❄️' || u.look.item === '🧊' ? 'snow' : (u.look.item === '🔥' || u.look.item === '🌋' || u.look.hat === '🧙') ? 'fire' : u.flying ? 'zap' : 'ball';
        // every Nth shot is a critical hit
        let dmg = u.dmg, crit = false;
        if (u.critEvery) { u.shots++; if (u.shots % u.critEvery === 0) { crit = true; dmg = Math.round(u.dmg * u.critMult); this.effects.push({ type: 'text', x: u.x, y: u.y - 30, txt: 'CRITICAL HIT!', t: 0, dur: 1.0, color: '#ffe14a' }); this.onEvent('crit', { owner: u.owner }); } }
        this.projectiles.push({ x: u.x, y: u.y - 8, target: tgt, speed: 280, dmg, owner: u.owner, att: u, style, area: u.area, tx: tgt.x, ty: tgt.y, crit });
      } else {
        if (u.area) this.splash(u, tgt.x, tgt.y, u.dmg, u.area, tgt);
        else this.damage(u, tgt, u.dmg, { knockback: u.knockback });
        this.onEvent('hit', {});
      }
    }
    splash(att, x, y, dmg, r, primary) {
      const owner = att ? att.owner : -1;
      if (primary && primary.building) this.damage(att, primary, dmg, { knockback: false });
      for (const v of this.units) {
        if (v.owner === owner || v.dead) continue;
        if (v.flying && att && !att.hitsAir) continue;
        if (Math.hypot(v.x - x, v.y - y) <= r) this.damage(att, v, dmg, { knockback: att && att.knockback });
      }
      this.effects.push({ type: 'burst', x, y, r: r * 0.9, t: 0, dur: att && att.stick ? 0.5 : 0.3, color: att && att.stick ? 'rgba(255,120,180,0.6)' : 'rgba(255,200,80,0.6)' });
    }
    tickVisuals(dt) {
      // projectiles
      for (const p of this.projectiles) {
        if (p.done) continue;
        const tx = p.target.dead ? (p.tx || p.x) : p.target.x, ty = p.target.dead ? (p.ty || p.y) : p.target.y - (p.target.flying ? 16 : 0);
        p.tx = tx; p.ty = ty;
        const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
        const st = p.speed * dt;
        if (d <= st) {
          p.done = true;
          if (p.att && p.att.dead && !p.att.building) continue;
          if (p.area) this.splash(p.att, tx, ty, p.dmg, p.area, p.target);
          else if (!p.target.dead) this.damage(p.att, p.target, p.dmg, { knockback: p.att && p.att.knockback });
        } else { p.x += dx / d * st; p.y += dy / d * st; }
      }
      this.projectiles = this.projectiles.filter(p => !p.done);
      // effects
      for (const e of this.effects) {
        e.t += dt;
        if (e.type === 'wave') {
          e.y += (e.owner === 0 ? -1 : 1) * e.speed * dt;
          for (const u of this.units) {
            if (u.owner === e.owner || u.dead || e.hit.has(u.id)) continue;
            if (Math.abs(u.y - e.y) < 16) { e.hit.add(u.id); this.damage(null, u, e.dmg, { knockback: true, owner: e.owner }); }
          }
          if (e.y < -20 || e.y > H + 20) e.t = e.dur + 1;
        }
      }
      this.effects = this.effects.filter(e => e.t < e.dur);
      for (const u of this.units) if (u.dead) u.dying -= dt;
      this.units = this.units.filter(u => !u.dead || u.dying > 0);
    }
    timeLeft() { return this.phase === 'overtime' ? Math.max(0, MATCH_TIME + OVERTIME - this.t) : Math.max(0, MATCH_TIME - this.t); }

    // ---------- render ----------
    render(ctx, opts = {}) {
      ART.drawArena(ctx, this.o.world, W, H, LAYOUT);
      // deploy zone hint
      if (opts.showZone) {
        ctx.fillStyle = 'rgba(94,200,255,0.16)'; ctx.fillRect(0, LAYOUT.river + 14, W, H - LAYOUT.river - 14);
        ctx.strokeStyle = 'rgba(94,200,255,0.7)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeRect(2, LAYOUT.river + 14, W - 4, H - LAYOUT.river - 16); ctx.setLineDash([]);
      }
      if (opts.spellZone) {
        ctx.fillStyle = 'rgba(255,107,107,0.10)'; ctx.fillRect(0, 0, W, H);
      }
      // rubble for dead buildings
      for (const b of this.buildings) {
        if (!b.dead) continue;
        ctx.fillStyle = 'rgba(60,40,20,0.5)'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 10, 30, 12, 0, 0, Math.PI * 2); ctx.fill();
        ART.emoji(ctx, '💥', b.x, b.y, 22);
      }
      // cloud effects under units
      for (const e of this.effects) if (e.type === 'cloud') { ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill(); }
      // sort ground by y, flying last
      const ground = this.units.filter(u => !u.flying).sort((a, b) => a.y - b.y);
      const air = this.units.filter(u => u.flying).sort((a, b) => a.y - b.y);
      const bl = this.buildings.filter(b => !b.dead);
      const items = [...ground.map(u => ({ y: u.y, u })), ...bl.map(b => ({ y: b.y + 10, b }))].sort((a, b) => a.y - b.y);
      for (const it of items) { if (it.b) ART.drawTower(ctx, it.b, this.t); else this.drawUnit(ctx, it.u); }
      for (const u of air) this.drawUnit(ctx, u);
      // projectiles
      for (const p of this.projectiles) this.drawProjectile(ctx, p);
      // effects
      for (const e of this.effects) this.drawEffect(ctx, e);
      // preview ghost
      if (opts.ghost) { ctx.save(); ctx.globalAlpha = 0.5; ART.drawCreature(ctx, opts.ghost.look, opts.ghost.x, opts.ghost.y, UNIT_R, {}); ctx.restore(); }
      if (opts.ring) { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(opts.ring.x, opts.ring.y, opts.ring.r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    }
    drawUnit(ctx, u) {
      const alpha = u.dead ? Math.max(0, u.dying / 0.35) : 1;
      const walking = !u.target && !u.building && !u.dead && u.stunUntil < this.t;
      const bob = walking ? Math.sin(u.bobT * 12) * 2.5 : 0;
      const lift = u.flying ? -18 + Math.sin(u.bobT * 3) * 3 : 0;
      if (u.flying) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(u.x, u.y + 12, 12, 4, 0, 0, Math.PI * 2); ctx.fill(); }
      ART.drawCreature(ctx, u.look, u.x, u.y + lift, UNIT_R, { bob, squash: u.squash, flash: u.flashUntil > this.t, alpha, frozen: u.frozenUntil > this.t, gummed: u.gummedUntil > this.t && !u.dead, stunned: u.stunUntil > this.t && !u.dead, raged: u.rageUntil > this.t, t: u.bobT, facing: u.owner === 0 ? 1 : -1 });
      if (!u.dead) {
        const sc = (u.look.scale || 1);
        const w = 26 * Math.min(1.6, sc), y = u.y + lift - UNIT_R * sc - 12 - (u.look.hat ? 8 : 0) - (u.look.ears === 'cat' ? 4 : 0);
        ART.rrect(ctx, u.x - w / 2, y, w, 4, 2, 'rgba(0,0,0,0.6)');
        ART.rrect(ctx, u.x - w / 2, y, w * Math.max(0, u.hp / u.maxHp), 4, 2, u.owner === 0 ? '#5ee08c' : '#ff6b6b');
        if (u.boss) { ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BOSS', u.x, y - 3); }
      }
    }
    drawProjectile(ctx, p) {
      ctx.save();
      switch (p.style) {
        case 'arrow': ctx.strokeStyle = '#5a3b1e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y - 6); ctx.lineTo(p.x, p.y + 6); ctx.stroke(); break;
        case 'snow': ART.ellipse(ctx, p.x, p.y, 5, 5, '#e8f8ff', '#8cc8f0', 1.5); break;
        case 'fire': ART.ellipse(ctx, p.x, p.y, 6, 6, '#ff7a1a'); ART.ellipse(ctx, p.x, p.y, 3, 3, '#ffe14a'); break;
        case 'zap': ART.ellipse(ctx, p.x, p.y, 4, 4, '#a0e7ff', '#5ec8ff', 1.5); break;
        case 'yarn': ART.ellipse(ctx, p.x, p.y, 4.5, 4.5, '#ff6b8a', '#222', 1); break;
        case 'water': { const r = p.crit ? 7 : 4.5; ART.ellipse(ctx, p.x, p.y, r, r, p.crit ? '#8fe0ff' : '#5ec8ff', '#1b6fa8', 1.5); if (p.crit) ART.ellipse(ctx, p.x - 2, p.y - 2, 2, 1.5, 'rgba(255,255,255,0.9)'); break; }
        case 'gum': ART.ellipse(ctx, p.x, p.y, 7, 7, 'rgba(255,120,180,0.9)', '#c2447a', 1.5); ART.ellipse(ctx, p.x - 2, p.y - 2, 2, 1.5, 'rgba(255,255,255,0.8)'); break;
        case 'bone': ART.emoji(ctx, '🦴', p.x, p.y, 11); break;
        default: ART.ellipse(ctx, p.x, p.y, 4, 4, '#fff', '#222', 1.5);
      }
      ctx.restore();
    }
    drawEffect(ctx, e) {
      const k = e.t / e.dur;
      ctx.save();
      if (e.type === 'burst') { ctx.globalAlpha = 1 - k; ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (0.4 + k * 0.6), 0, Math.PI * 2); ctx.fill(); }
      else if (e.type === 'ring') { ctx.globalAlpha = 1 - k; ctx.strokeStyle = e.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (0.3 + k * 0.7), 0, Math.PI * 2); ctx.stroke(); }
      else if (e.type === 'puff') { ctx.globalAlpha = 1 - k; ctx.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * 14 * k, e.y + Math.sin(a) * 8 * k, 5 * (1 - k), 0, Math.PI * 2); ctx.fill(); } }
      else if (e.type === 'text') { ctx.globalAlpha = 1 - k; ctx.fillStyle = e.color || '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.strokeText(e.txt, e.x, e.y - k * 20); ctx.fillText(e.txt, e.x, e.y - k * 20); }
      else if (e.type === 'beam') { ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#ff2a2a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(e.x, e.y1); ctx.lineTo(e.x, e.y2); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
      else if (e.type === 'wave') { ctx.globalAlpha = 0.85; ctx.fillStyle = e.owner === 0 ? 'rgba(94,200,255,0.55)' : 'rgba(255,107,107,0.55)'; for (const lx of LAYOUT.lanes) { ctx.beginPath(); ctx.ellipse(lx, e.y, 46, 10, 0, 0, Math.PI * 2); ctx.fill(); } ART.emoji(ctx, '💥', LAYOUT.lanes[0], e.y, 18); ART.emoji(ctx, '💥', LAYOUT.lanes[1], e.y, 18); }
      else if (e.type === 'dot') { ART.ellipse(ctx, e.x + Math.sin(e.t * 9) * 8, e.y + Math.cos(e.t * 7) * 6, 4, 4, '#ff2020'); }
      ctx.restore();
    }
  }
  return { Battle, computeStats, makeCard, LAYOUT, W, H, MATCH_TIME, OVERTIME, KIBBLE_MAX, CANNON_TIME, UNIT_R, TOWER };
})();
