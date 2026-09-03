/* ============ NPC AI ============ */
const AI = (() => {
  const L = ENGINE.LAYOUT, H = ENGINE.H;
  // per-level tuning: think interval, chance to answer a threat, kibble it waits for before attacking, cannon smarts
  const TUNE = {
    1: { think: 1.6, defend: 0.45, attackAt: 5, combo: 0, cannonAt: 4, random: 0.35 },
    2: { think: 1.2, defend: 0.65, attackAt: 6, combo: 0.3, cannonAt: 3, random: 0.2 },
    3: { think: 0.9, defend: 0.8, attackAt: 7, combo: 0.6, cannonAt: 3, random: 0.1 },
    4: { think: 0.7, defend: 0.9, attackAt: 8, combo: 0.8, cannonAt: 2, random: 0.05 },
    5: { think: 0.5, defend: 0.97, attackAt: 9, combo: 1, cannonAt: 2, random: 0.02 },
  };
  class NpcAI {
    constructor(level, owner = 1) { this.owner = owner; this.level = Math.max(1, Math.min(5, level)); this.tune = TUNE[this.level]; this.timer = 2.5; this.pushLane = Math.random() < 0.5 ? 0 : 1; this.pushT = -10; }
    update(dt, b) {
      this.timer -= dt; if (this.timer > 0) return;
      this.timer = this.tune.think + Math.random() * 0.4;
      const me = this.owner, p = b.players[me], T = this.tune;
      // work in mirrored space where 'my' base is at the top (like owner 1); my(y) converts both ways
      const my = y => me === 1 ? y : H - y;
      const enemies = b.units.filter(u => u.owner !== me && !u.dead);
      const inMyHalf = enemies.filter(u => my(u.y) < L.river + 40);
      // Cat Cannon
      if (p.cannon >= 1 && inMyHalf.length >= T.cannonAt) { b.fireCannon(me); return; }
      // Threat per lane
      const laneThreat = [0, 1].map(l => inMyHalf.filter(u => u.lane === l).reduce((a, u) => a + u.card.cost * (u.hp / u.maxHp) + 0.5, 0));
      const dl = laneThreat[0] >= laneThreat[1] ? 0 : 1;
      const affordable = p.hand.map((c, i) => ({ c, i })).filter(x => x.c && x.c.cost <= p.kibble);
      if (!affordable.length) return;
      if (laneThreat[dl] > 0 && Math.random() < T.defend) {
        const threats = inMyHalf.filter(u => u.lane === dl);
        const flying = threats.some(u => u.flying), many = threats.length >= 3, tank = threats.some(u => u.hp > 700), rusher = threats.some(u => u.targetMode === 'buildings');
        const myDefenders = b.units.filter(u => u.owner === me && !u.dead && u.lane === dl && my(u.y) < L.river).length;
        if (myDefenders >= threats.length + 2) return; // already handled
        let best = null, bs = -1e9;
        for (const x of affordable) {
          const s = x.c.stats; let sc = Math.random() * 1.5;
          if (x.c.kind === 'spell') { sc += threats.length >= 2 ? 2.5 : -3; }
          else {
            if (flying) sc += s.hitsAir ? 3 : -2.5;
            if (many) sc += s.area ? 3 : (s.count > 1 ? 1 : 0);
            if (tank) sc += (s.dmg / Math.max(0.3, s.rate)) / 40;
            if (rusher) sc += s.hp / 300;
            sc += s.hp / 500 + s.dmg / 100;
            sc -= x.c.cost * 0.3;
          }
          if (sc > bs) { bs = sc; best = x; }
        }
        if (best) {
          const front = threats.reduce((a, u) => Math.min(a, my(u.y)), 1e9);
          const y = best.c.kind === 'spell' ? front + 10 : Math.max(60, Math.min(L.river - 20, front - 60 - Math.random() * 30));
          b.playCard(me, best.i, L.lanes[dl], my(y));
        }
        return;
      }
      // Random derp plays for low levels
      if (Math.random() < T.random) {
        const x = affordable[Math.floor(Math.random() * affordable.length)];
        if (x.c.kind === 'spell') return;
        b.playCard(me, x.i, L.lanes[Math.floor(Math.random() * 2)], my(90 + Math.random() * 150));
        return;
      }
      // Attack: wait to bank kibble, then push a lane (tank first, then damage)
      if (p.kibble < T.attackAt && !(b.t - this.pushT < 8 && p.kibble >= 4)) return;
      const posts = [0, 1].map(l => b.buildings.find(bb => bb.owner !== me && bb.type === 'post' && bb.lane === l));
      if (b.t - this.pushT > 12) {
        // pick new lane: weakest player post (dead = go there!)
        const w = l => posts[l].dead ? -1 : posts[l].hp / posts[l].maxHp;
        this.pushLane = w(0) <= w(1) ? 0 : 1;
        if (Math.random() < 0.25) this.pushLane = 1 - this.pushLane;
      }
      this.pushT = b.t;
      const units = affordable.filter(x => x.c.kind !== 'spell');
      if (!units.length) return;
      const myPush = b.units.filter(u => u.owner === me && !u.dead && u.lane === this.pushLane);
      const haveTank = myPush.some(u => u.hp > 400);
      let pick;
      if (!haveTank && Math.random() < T.combo) pick = units.reduce((a, x) => x.c.stats.hp > a.c.stats.hp ? x : a, units[0]);
      else pick = units.reduce((a, x) => (x.c.stats.dmg / x.c.stats.rate) > (a.c.stats.dmg / a.c.stats.rate) ? x : a, units[0]);
      if (Math.random() < 0.3) pick = units[Math.floor(Math.random() * units.length)];
      const y = haveTank ? 120 + Math.random() * 80 : 70 + Math.random() * 60;
      b.playCard(me, pick.i, L.lanes[this.pushLane], my(y));
    }
  }
  return { NpcAI };
})();
