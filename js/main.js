/* ============ MAIN: bootstrap, battle loop & input ============ */
const GAME = (() => {
  const $ = UI.$;
  let battle = null, raf = 0, last = 0, acc = 0, cur = null; // cur = {w,s}
  let selected = -1, dragging = false, pointer = null, endTimer = 0, paused = false;
  const canvas = () => $('#arena');

  function canvasPos(ev) {
    const c = canvas(); const r = c.getBoundingClientRect();
    return { x: (ev.clientX - r.left) / r.width * ENGINE.W, y: (ev.clientY - r.top) / r.height * ENGINE.H, inside: ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom };
  }

  function startBattle(w, s) {
    const P = SAVE.get(); const world = DATA.WORLDS[w]; const idx = DATA.stageIndex(w, s);
    cur = { w, s };
    const playerCards = P.deck.map(id => ENGINE.makeCard(DATA.CAT_BY_ID[id], { level: P.cats[id].level, form: P.cats[id].form }, 0));
    const mult = DATA.enemyMult(idx);
    const enemyCards = UI.enemyDeckFor(w, s).map(id => ENGINE.makeCard(DATA.ENEMY_BY_ID[id], { mult }, 1));
    const boss = s === 4 ? ENGINE.makeCard(DATA.ENEMY_BY_ID[world.boss], { mult: mult * 0.8 }, 1) : null;
    battle = new ENGINE.Battle({ world, stage: s, playerCards, enemyCards, enemyMult: mult, enemyTowerMult: DATA.towerMult(idx), playerTowerMult: SAVE.towerMult(), ai: new AI.NpcAI(DATA.aiLevel(idx)), boss, onEvent });
    P.battles++; SAVE.save();
    selected = -1; dragging = false; endTimer = 0; paused = false;
    $('#result').classList.add('hidden'); $('#banner').classList.add('hidden'); $('#pause').classList.add('hidden');
    UI.showScreen('battle');
    renderHand();
    if (!P.tutorialSeen) { $('#tutorial').classList.remove('hidden'); } else $('#tutorial').classList.add('hidden');
    banner(`${world.icon} ${world.stages[s]}`, 1800);
    last = performance.now(); acc = 0;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function banner(txt, ms = 1500) { const b = $('#banner'); b.textContent = txt; b.classList.remove('hidden'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; clearTimeout(b._h); b._h = setTimeout(() => b.classList.add('hidden'), ms); }
  function onEvent(type, d) {
    switch (type) {
      case 'deploy': if (d.owner === 0) { SFX.meow(); SAVE.questEvent('deploy'); } else SFX.deploy(); break;
      case 'spell': SFX.spell(); if (d.owner === 0) SAVE.questEvent('spell'); break;
      case 'hit': if (Math.random() < 0.3) SFX.hit(); break;
      case 'boom': SFX.boom(); break;
      case 'crit': if (d.owner === 0) SFX.coin(); break;
      case 'cannon': SFX.cannon(); if (d.owner === 0) SAVE.questEvent('cannon'); banner(d.owner === 0 ? '🔫 CAT CANNON!' : '🔫 ENEMY CANNON!', 1000); break;
      case 'towerDown': SFX.towerDown(); if (d.winner === 0) SAVE.questEvent('tower'); if (!battle.over) banner(d.winner === 0 ? '🐾 TOWER DOWN!' : '😿 We lost a tower!', 1300); break;
      case 'double': banner('🐟 DOUBLE KIBBLE!', 1500); SFX.alarm(); break;
      case 'overtime': banner('⏱️ OVERTIME! Next tower wins!', 2000); SFX.alarm(); break;
      case 'boss': banner('👑 BOSS INCOMING!', 2000); SFX.alarm(); break;
      case 'end': endTimer = 1.3; if (d.winner === 0) SFX.win(); else SFX.lose(); banner(d.winner === 0 ? '🏆 VICTORY!' : '💀 DEFEAT', 2500); break;
    }
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!battle) return;
    const halted = paused || !$('#tutorial').classList.contains('hidden');
    let dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!halted) {
      acc += dt;
      while (acc >= 1 / 60) { battle.step(1 / 60); acc -= 1 / 60; }
      if (battle.over && endTimer > 0) { endTimer -= dt; if (endTimer <= 0) showResult(); }
    }
    draw(); updateHud();
  }
  function draw() {
    const ctx = canvas().getContext('2d');
    const opts = {};
    const card = selected >= 0 ? battle.players[0].hand[selected] : null;
    if (card) {
      if (card.kind === 'spell') opts.spellZone = true; else opts.showZone = true;
      if (pointer && pointer.inside) {
        if (card.kind === 'spell') opts.ring = { x: pointer.x, y: pointer.y, r: card.stats.radius };
        else if (battle.ownHalf(0, pointer.y)) opts.ghost = { look: card.look, x: ENGINE.LAYOUT.lanes[battle.laneOf(pointer.x)], y: pointer.y };
      }
    }
    battle.render(ctx, opts);
  }
  function renderHand() {
    const p = battle.players[0];
    UI.$$('#hand .card').forEach((c, i) => {
      const card = p.hand[i]; if (!card) return;
      ART.drawPortraitTo(c.querySelector('canvas'), card.def, card.form);
      c.querySelector('.cost').textContent = card.cost; c.querySelector('.cname').textContent = card.name;
    });
    if (p.next) ART.drawPortraitTo($('#next-card canvas'), p.next.def, p.next.form);
  }
  function updateHud() {
    const p = battle.players[0];
    const tl = battle.timeLeft(); const m = Math.floor(tl / 60), s = Math.floor(tl % 60);
    const timer = $('#timer'); timer.textContent = (battle.phase === 'overtime' ? 'OT ' : '') + m + ':' + String(s).padStart(2, '0'); timer.classList.toggle('hot', battle.t >= 120 && !battle.over);
    $('#paws-me').textContent = '🐾 ' + battle.paws[0]; $('#paws-enemy').textContent = '🐾 ' + battle.paws[1];
    const kf = $('#kibble-fill'); kf.style.width = (p.kibble / ENGINE.KIBBLE_MAX * 100) + '%'; kf.classList.toggle('double', battle.t >= 120);
    $('#kibble-num').textContent = '🐟 ' + Math.floor(p.kibble);
    $('#cannon-fill').style.width = (p.cannon * 100) + '%'; $('#cannon-btn').classList.toggle('ready', p.cannon >= 1 && !battle.over);
    UI.$$('#hand .card').forEach((c, i) => { const card = p.hand[i]; c.classList.toggle('poor', !card || p.kibble < card.cost); c.classList.toggle('sel', i === selected); });
  }
  function tryDeploy(pos) {
    if (selected < 0 || !battle || battle.over) return false;
    const card = battle.players[0].hand[selected];
    if (!card) return false;
    if (battle.players[0].kibble < card.cost) { UI.toast('Not enough Kibble 🐟'); return false; }
    if (card.kind !== 'spell' && !battle.ownHalf(0, pos.y)) { UI.toast('Deploy on YOUR half of the yard!'); return false; }
    const ok = battle.playCard(0, selected, pos.x, pos.y);
    if (ok) { selected = -1; renderHand(); }
    return ok;
  }
  function showResult() {
    const P = SAVE.get(); const { w, s } = cur; const won = battle.winner === 0; const paws = battle.paws[0];
    const idx = DATA.stageIndex(w, s); const world = DATA.WORLDS[w];
    let first = false, food, nip = 0, newCat = null, unlockedWorld = false;
    SAVE.questEvent('play');
    if (won) {
      SAVE.questEvent('win'); if (paws === 3) SAVE.questEvent('paws3'); if (s === 4) SAVE.questEvent('boss');
      const wasUnlocked = P.unlockedWorld;
      first = SAVE.recordWin(w, s, paws);
      unlockedWorld = P.unlockedWorld > wasUnlocked;
      const rw = DATA.stageRewards(w, s, first, paws); food = rw.food; nip = rw.nip;
      const catReward = s === 4 ? world.rewardCat : DATA.STAGE_CAT_REWARDS[`${w}-${s}`];
      if (catReward && !P.cats[catReward]) newCat = catReward;
      else if (Math.random() < 0.08) { const pool = DATA.CATS.filter(c => !P.cats[c.id] && (c.rarity === 'special' || c.rarity === 'rare')); if (pool.length) newCat = pool[Math.floor(Math.random() * pool.length)].id; }
    } else { food = 20 + 5 * idx; }
    const r = $('#result'); r.classList.remove('hidden');
    r.innerHTML = `<div class="box"><h1>${won ? '🏆 VICTORY!' : battle.draw ? '🤝 DRAW' : '💀 DEFEAT'}</h1><div style="font-size:28px">${won ? '🐾'.repeat(paws) : '😿'}</div>
      <div class="sub">${won ? (first ? 'First clear! ' : '') + world.stages[s] + ' cleared!' : 'The enemy held on. Upgrade your cats and try again!'}</div>
      <div id="box-area"><div class="sub">${won ? 'You earned a Toy Box! Tap to open it.' : 'Consolation prize:'}</div><div class="toybox bounce" id="toybox">${won ? '🎁' : '🥫'}</div></div>
      <div class="rewards hidden" id="rewards"></div>
      <div class="row" id="res-actions"></div></div>`;
    const open = () => {
      SFX.coin(); SAVE.addRewards(food, nip); if (newCat) SAVE.grant(newCat);
      $('#toybox').classList.remove('bounce'); $('#toybox').textContent = '🎉'; $('#toybox').onclick = null;
      const rw = $('#rewards'); rw.classList.remove('hidden');
      rw.innerHTML = `<div class="rw">🥫 +${food}</div>${nip ? `<div class="rw">🌿 +${nip}</div>` : ''}`;
      if (newCat) { const d = UI.el('div', 'rw reveal', `🐱 NEW CAT!<br>`); const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; ART.drawPortraitTo(cv, DATA.CAT_BY_ID[newCat], 0); d.appendChild(cv); d.appendChild(UI.el('div', null, DATA.CAT_BY_ID[newCat].name)); rw.appendChild(d); SFX.fanfare(); }
      if (unlockedWorld) rw.appendChild(UI.el('div', 'rw reveal', `🗺️ World ${w + 2} unlocked!<br>${DATA.WORLDS[w + 1].icon} ${DATA.WORLDS[w + 1].name}`));
      const doneQ = SAVE.questView().filter(q => q.done && !q.claimed).length; if (doneQ) rw.appendChild(UI.el('div', 'rw reveal', `🎯 ${doneQ} quest${doneQ > 1 ? 's' : ''} complete!<br>Claim in the Daily tab`));
      const act = $('#res-actions');
      const home = UI.el('button', 'btn gray', '🏠 Home'); home.onclick = () => { SFX.click(); leaveBattle(); }; act.appendChild(home);
      const again = UI.el('button', 'btn', '🔁 Replay'); again.onclick = () => { SFX.click(); startBattle(w, s); }; act.appendChild(again);
      if (won) { const nx = s < 4 ? { w, s: s + 1 } : (w < 7 ? { w: w + 1, s: 0 } : null); if (nx && SAVE.stageUnlocked(nx.w, nx.s)) { const nb = UI.el('button', 'btn green', '➡️ Next'); nb.onclick = () => { SFX.click(); startBattle(nx.w, nx.s); }; act.appendChild(nb); } }
    };
    $('#toybox').onclick = open;
  }
  function leaveBattle() { cancelAnimationFrame(raf); battle = null; paused = false; $('#pause').classList.add('hidden'); UI.showScreen('home'); UI.setTab('worlds'); }
  function pauseBattle() {
    if (!battle || battle.over || paused) return;
    paused = true; selected = -1; dragging = false;
    const world = DATA.WORLDS[cur.w];
    $('#pause-info').innerHTML = `${world.icon} ${world.stages[cur.s]} · 🐾 ${battle.paws[0]} – ${battle.paws[1]}`;
    $('#pause').classList.remove('hidden');
  }
  function resumeBattle() { if (!paused) return; paused = false; $('#pause').classList.add('hidden'); last = performance.now(); acc = 0; }

  // ---------- input ----------
  function bindInput() {
    const hand = $('#hand');
    hand.addEventListener('pointerdown', ev => {
      const c = ev.target.closest('.card'); if (!c || !battle) return;
      const i = +c.dataset.slot; SFX.init();
      if (selected === i) { selected = -1; } else { selected = i; SFX.click(); }
      dragging = selected >= 0; pointer = null;
    });
    const cv = canvas();
    cv.addEventListener('pointerdown', ev => { SFX.init(); const pos = canvasPos(ev); pointer = pos; if (selected >= 0) { tryDeploy(pos); dragging = false; } });
    document.addEventListener('pointermove', ev => { if (!battle) return; const pos = canvasPos(ev); pointer = pos; });
    document.addEventListener('pointerup', ev => {
      if (!battle) return;
      const pos = canvasPos(ev);
      if (dragging && pos.inside) { tryDeploy(pos); }
      dragging = false; pointer = null;
    });
    $('#cannon-btn').addEventListener('pointerdown', () => { SFX.init(); if (battle && battle.players[0].cannon >= 1) battle.fireCannon(0); else UI.toast('Cannon is charging... 🔫'); });
    $('#pause-btn').addEventListener('pointerdown', ev => { ev.stopPropagation(); SFX.init(); SFX.click(); if (paused) resumeBattle(); else pauseBattle(); });
    $('#pause-resume').onclick = () => { SFX.click(); resumeBattle(); };
    $('#pause-restart').onclick = () => { SFX.click(); startBattle(cur.w, cur.s); };
    $('#pause-quit').onclick = () => { SFX.click(); leaveBattle(); };
    // Auto-pause when the app goes to the background (phone locked, app switched)
    document.addEventListener('visibilitychange', () => { if (document.hidden && battle && !battle.over) pauseBattle(); });
    $('#tut-ok').onclick = () => { SFX.init(); SFX.click(); const P = SAVE.get(); P.tutorialSeen = true; SAVE.save(); $('#tutorial').classList.add('hidden'); last = performance.now(); };
    UI.$$('.tab').forEach(t => t.addEventListener('click', () => { SFX.init(); SFX.click(); UI.setTab(t.dataset.tab); }));
    $('#modal').addEventListener('click', ev => { if (ev.target.id === 'modal') UI.closeModal(); });
    document.addEventListener('pointerdown', () => SFX.init(), { once: true });
  }

  function init() {
    const P = SAVE.load(); SFX.setEnabled(P.sound !== false);
    UI.scaleStage(); window.addEventListener('resize', UI.scaleStage); window.addEventListener('orientationchange', () => setTimeout(UI.scaleStage, 200));
    bindInput(); UI.showScreen('home'); UI.renderHome();
  }
  document.addEventListener('DOMContentLoaded', init);
  return { startBattle, leaveBattle, showResult, pauseBattle, resumeBattle, get battle() { return battle; } };
})();
