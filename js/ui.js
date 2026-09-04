/* ============ UI (home screens, modals, HUD) ============ */
const UI = (() => {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const state = { tab: 'worlds', swapCat: null, swapSlot: null };
  const RN = r => DATA.RARITY[r].name;

  function scaleStage() {
    const app = $('#app'), sw = window.innerWidth, sh = window.innerHeight;
    const s = Math.min(sw / 360, sh / 640);
    const h = Math.max(640, Math.min(820, Math.floor(sh / s)));
    app.style.height = h + 'px';
    app.style.transform = `scale(${s})`;
    app.style.left = Math.floor((sw - 360 * s) / 2) + 'px';
    app.style.top = Math.floor((sh - h * s) / 2) + 'px';
    app.style.position = 'absolute';
    $('#hud-bottom').style.height = Math.max(160, h - 560) + 'px';
  }
  function showScreen(id) { $$('.screen').forEach(s => s.classList.toggle('hidden', s.id !== id)); }
  function toast(msg, ms = 1600) { const t = $('#toast'); t.innerHTML = msg; t.classList.remove('hidden'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.add('hidden'), ms); }
  function modal(html) { $('#modal-box').innerHTML = html; $('#modal').classList.remove('hidden'); return $('#modal-box'); }
  function closeModal() { $('#modal').classList.add('hidden'); }
  function updateWallet() { const P = SAVE.get(); $('#w-food').textContent = '🥫 ' + P.food; $('#w-nip').textContent = '🌿 ' + P.nip; }

  // ---------- cat card element ----------
  function catCard(id, opts = {}) {
    const def = DATA.CAT_BY_ID[id]; const P = SAVE.get(); const c = P.cats[id];
    const d = el('div', 'catcard rarity-' + def.rarity + (c ? '' : ' locked'));
    const cv = document.createElement('canvas'); cv.width = 72; cv.height = 72; d.appendChild(cv);
    ART.drawPortraitTo(cv, def, c ? c.form : 0);
    d.appendChild(el('div', 'c', def.cost));
    if (c) d.appendChild(el('div', 'lv', 'Lv' + c.level));
    else if (def.exclusive) d.appendChild(el('div', 'lv', '🎁 Gift'));
    d.appendChild(el('div', 'n', c ? def.forms[c.form].name : def.name));
    if (opts.onclick) d.onclick = () => { SFX.click(); opts.onclick(id, d); };
    return d;
  }

  // ---------- WORLDS ----------
  function renderWorlds(body) {
    const P = SAVE.get();
    body.appendChild(el('h2', null, 'Choose a stage'));
    body.appendChild(el('div', 'sub', 'Beat all 5 stages of a world to unlock the next one. The 5th stage has a BOSS.'));
    DATA.WORLDS.forEach(w => {
      const locked = w.id > P.unlockedWorld;
      const d = el('div', 'world' + (locked ? ' locked' : ''));
      d.style.borderColor = w.bg.accent;
      const cleared = [0, 1, 2, 3, 4].filter(s => P.paws[`${w.id}-${s}`]).length;
      d.innerHTML = `<div class="whead"><div class="wicon" style="background:${w.bg.grass}">${w.icon}</div><div><div class="wname">World ${w.id + 1}: ${w.name}</div><div class="wdesc">${locked ? '🔒 Beat the previous boss to unlock' : w.desc}</div></div></div>`;
      d.appendChild(el('div', 'reward-tag', locked ? '' : `${cleared}/5 ✔`));
      const st = el('div', 'stages');
      w.stages.forEach((name, s) => {
        const unlocked = !locked && SAVE.stageUnlocked(w.id, s);
        const paws = P.paws[`${w.id}-${s}`] || 0;
        const b = el('div', 'stage' + (paws ? ' done' : '') + (s === 4 ? ' boss' : '') + (unlocked ? '' : ' lock'));
        b.innerHTML = `<span class="paw">${paws ? '🐾'.repeat(paws) : (unlocked ? '' : '🔒')}</span>${s === 4 ? '👑' : s + 1}`;
        if (unlocked) b.onclick = () => { SFX.click(); stagePreview(w.id, s); };
        st.appendChild(b);
      });
      d.appendChild(st);
      body.appendChild(d);
    });
  }
  function enemyDeckFor(w, s) {
    const world = DATA.WORLDS[w];
    const prev = w > 0 ? DATA.WORLDS[w - 1].pool : ['pupper', 'wormy'];
    const ids = world.pool.slice(0, 3 + s);
    for (const id of prev) if (ids.length < 8 && !ids.includes(id)) ids.push(id);
    for (const id of world.pool) if (ids.length < 8 && !ids.includes(id)) ids.push(id);
    while (ids.length < 8) ids.push(['pupper', 'wormy', 'mailmen'][ids.length % 3]);
    return ids.slice(0, 8);
  }
  function stagePreview(w, s) {
    const world = DATA.WORLDS[w]; const P = SAVE.get();
    const idx = DATA.stageIndex(w, s); const first = !P.paws[`${w}-${s}`];
    const deck = enemyDeckFor(w, s);
    const rw = DATA.stageRewards(w, s, true, 3);
    const catReward = s === 4 ? world.rewardCat : DATA.STAGE_CAT_REWARDS[`${w}-${s}`];
    const recLevel = 1 + Math.floor(idx / 4);
    let html = `<div class="mhead"><div class="wicon" style="font-size:40px;width:70px;height:70px;background:${world.bg.grass};border-radius:14px;display:flex;align-items:center;justify-content:center">${world.icon}</div><div><div class="mtitle">${world.stages[s]}</div><div class="sub">World ${w + 1}: ${world.name} · Stage ${s + 1} ${s === 4 ? '<span class="bossflag">BOSS</span>' : ''}</div></div></div>`;
    html += `<div class="desc">Enemy power: <b>×${DATA.enemyMult(idx).toFixed(1)}</b> · AI level <b>${DATA.aiLevel(idx)}</b> · Recommended cat level: <b>${recLevel}</b></div>`;
    html += `<div class="sub">Enemies you'll face:</div><div class="enemy-row" id="prev-enemies"></div>`;
    if (s === 4) html += `<div class="desc">👑 <b>Boss: ${DATA.ENEMY_BY_ID[world.boss].name}</b> — ${DATA.ENEMY_BY_ID[world.boss].desc} Appears at 2:20!</div>`;
    html += `<div class="sub">Rewards ${first ? '(first clear)' : '(already cleared: smaller rewards)'}:</div><div>`;
    html += `<span class="tag">🥫 up to ${first ? rw.food : DATA.stageRewards(w, s, false, 3).food}</span>`;
    if (first) html += `<span class="tag">🌿 ${rw.nip}</span>`;
    if (first && catReward && !P.cats[catReward]) html += `<span class="tag">🐱 NEW CAT: ${DATA.CAT_BY_ID[catReward].name}</span>`;
    if (s === 4 && first && w < 7) html += `<span class="tag">🗺️ Unlocks World ${w + 2}</span>`;
    html += `</div><div class="row"><button class="btn gray" id="pv-close">Back</button><button class="btn green big" id="pv-go">⚔️ Battle!</button></div>`;
    const box = modal(html);
    const er = box.querySelector('#prev-enemies');
    const shown = new Set();
    deck.concat(s === 4 ? [world.boss] : []).forEach(id => {
      if (shown.has(id)) return; shown.add(id);
      const def = DATA.ENEMY_BY_ID[id];
      const d = el('div', 'e'); const cv = document.createElement('canvas'); cv.width = 56; cv.height = 56; ART.drawPortraitTo(cv, def, 0); d.appendChild(cv);
      d.appendChild(el('div', null, def.name + ' ' + def.traits.map(t => DATA.TRAIT_INFO[t].icon).join('')));
      er.appendChild(d);
    });
    box.querySelector('#pv-close').onclick = () => { SFX.click(); closeModal(); };
    box.querySelector('#pv-go').onclick = () => { SFX.click(); closeModal(); GAME.startBattle(w, s); };
  }

  // ---------- CATS ----------
  function renderCats(body) {
    const P = SAVE.get();
    body.appendChild(el('h2', null, 'Your Deck'));
    body.appendChild(el('div', 'sub', state.swapCat ? `Tap a deck slot to put <b>${DATA.CAT_BY_ID[state.swapCat].name}</b> there.` : 'Tap a cat to upgrade it. Tap "Use in Deck" then a slot to swap it in.'));
    const deck = el('div', 'deck');
    P.deck.forEach((id, slot) => {
      const d = catCard(id, { onclick: () => { if (state.swapCat) { SAVE.setDeckSlot(slot, state.swapCat); state.swapCat = null; toast('Deck updated! 🐾'); renderHome(); } else catDetail(id); } });
      if (state.swapCat) d.classList.add('swap');
      deck.appendChild(d);
    });
    body.appendChild(deck);
    // Cat Base upgrade
    const tc = SAVE.towerCost();
    const base = el('div', 'world');
    base.innerHTML = `<div class="whead"><div class="wicon" style="background:#d9a066">🏰</div><div><div class="wname">Cat Base — Level ${P.towerLevel}</div><div class="wdesc">Your towers have +${Math.round((SAVE.towerMult() - 1) * 100)}% HP & damage. Cat Cannon hits harder too.</div></div></div>`;
    const bb = el('button', 'btn ' + (P.food >= tc && P.towerLevel < 15 ? 'green' : 'gray'), P.towerLevel >= 15 ? 'MAX' : `Upgrade 🥫 ${tc}`);
    bb.style.marginTop = '8px'; bb.style.width = '100%';
    bb.onclick = () => { if (SAVE.upgradeTower()) { SFX.coin(); toast('Cat Base upgraded! 🏰'); renderHome(); } else { toast('Not enough Cat Food 🥫'); } };
    base.appendChild(bb); body.appendChild(base);
    // collection by rarity
    const order = ['basic', 'special', 'rare', 'superrare', 'uber', 'spell'];
    order.forEach(r => {
      const cats = DATA.CATS.filter(c => c.rarity === r);
      const sec = el('div', 'section');
      const owned = cats.filter(c => P.cats[c.id]).length;
      sec.appendChild(el('h3', 'rtext-' + r, `${RN(r)} <span class="sub">${owned}/${cats.length}</span>`));
      const g = el('div', 'grid');
      cats.forEach(c => g.appendChild(catCard(c.id, { onclick: () => catDetail(c.id) })));
      sec.appendChild(g); body.appendChild(sec);
    });
  }
  function statTags(def, st) {
    const tags = [];
    if (def.kind === 'spell') { if (st.dmg) tags.push('💥 ' + st.dmg + ' dmg'); if (st.stun) tags.push('💫 stun ' + st.stun + 's'); if (st.rage) tags.push('😼 rage ' + st.rage + 's'); if (st.knockback) tags.push('👊 knockback'); tags.push('⭕ radius ' + st.radius); return tags; }
    if (st.flying) tags.push('🎈 Flying'); if (st.hitsAir) tags.push('🏹 Hits air'); if (st.area) tags.push('💥 Splash');
    if (st.target === 'buildings') tags.push('🏠 Targets towers'); if (st.knockback) tags.push('👊 Knockback'); if (st.count > 1) tags.push('👥 x' + st.count);
    if (st.strongVs) st.strongVs.forEach(t => tags.push('💪 Strong vs ' + DATA.TRAIT_INFO[t].icon + ' ' + DATA.TRAIT_INFO[t].name));
    if (st.revive) tags.push('🧟 Revives x' + st.revive); if (st.lifesteal) tags.push('🩸 Lifesteal'); if (st.armor) tags.push('🛡️ Armor ' + Math.round(st.armor * 100) + '%');
    if (st.stick) tags.push('🍬 Sticks enemies ' + st.stick + 's'); if (st.critEvery) tags.push('💦 Crit every ' + st.critEvery + ' shots (' + Math.round(st.dmg * st.critMult) + ' dmg)'); if (st.slow) tags.push('🐌 Slows ' + st.slow + 's'); if (st.freeze) tags.push('🧊 Freezes ' + st.freeze + 's'); if (st.pierce) tags.push('⚡ Pierces lane'); if (st.suicide) tags.push('💣 Explodes'); if (st.heal) tags.push('💚 Heals ' + st.heal + '/s');
    if (st.spawns) tags.push('📦 Spawns Kitty every ' + st.spawnEvery + 's'); if (st.traits && st.traits.length) st.traits.forEach(t => tags.push(DATA.TRAIT_INFO[t].icon + ' ' + DATA.TRAIT_INFO[t].name));
    return tags;
  }
  function catDetail(id) {
    const def = DATA.CAT_BY_ID[id]; const P = SAVE.get(); const c = P.cats[id];
    const form = c ? c.form : 0, level = c ? c.level : 1;
    const st = ENGINE.computeStats(def, { level, form });
    const inDeck = P.deck.includes(id);
    let html = `<div class="mhead"><canvas width="96" height="96" id="det-cv"></canvas><div><div class="mtitle">${def.forms[form].name}</div><div class="rtext-${def.rarity}" style="font-weight:800">${RN(def.rarity)}${def.kind === 'building' ? ' · Building' : ''}</div><div class="sub">${c ? 'Level ' + level + ' / ' + DATA.MAX_LEVEL : '🔒 Not owned yet'}</div></div></div>`;
    html += `<div class="desc">${def.desc}</div>`;
    if (def.kind === 'spell') html += `<div class="stats"><div>Cost <b>🐟 ${def.cost}</b></div><div>Radius <b>${st.radius}</b></div>${st.dmg ? `<div>Damage <b>${st.dmg}</b></div>` : ''}${st.stun ? `<div>Stun <b>${st.stun}s</b></div>` : ''}</div>`;
    else html += `<div class="stats"><div>Cost <b>🐟 ${def.cost}</b></div><div>HP <b>${st.hp}</b></div><div>Damage <b>${st.dmg}</b></div><div>Speed <b>${st.speed > 100 ? 'Very fast' : st.speed > 60 ? 'Fast' : st.speed > 40 ? 'Medium' : st.speed > 0 ? 'Slow' : 'None'}</b></div><div>Range <b>${st.range > 140 ? 'Very long' : st.range > 40 ? 'Long' : 'Melee'}</b></div><div>Attack every <b>${st.rate}s</b></div></div>`;
    html += `<div>${statTags(def, st).map(t => `<span class="tag">${t}</span>`).join('')}</div>`;
    if (def.kind !== 'spell') {
      html += `<div class="forms">` + def.forms.map((f, i) => `<div class="form ${i === form ? 'cur' : ''}" style="${i > form ? 'opacity:.55' : ''}"><canvas width="64" height="64" data-form="${i}"></canvas>${f.name}<br><span class="sub">${i === 0 ? 'Normal' : i === 1 ? 'Evolved (Lv5)' : 'True Form (Lv10)'}</span></div>`).join('') + `</div>`;
    }
    html += `<div class="row" id="det-actions"></div>`;
    const box = modal(html);
    ART.drawPortraitTo(box.querySelector('#det-cv'), def, form);
    box.querySelectorAll('canvas[data-form]').forEach(cv => ART.drawPortraitTo(cv, def, +cv.dataset.form));
    const act = box.querySelector('#det-actions');
    if (c) {
      const up = el('button', 'btn ' + (SAVE.canUpgrade(id) ? 'green' : 'gray'), level >= DATA.MAX_LEVEL ? 'MAX LEVEL' : `⬆️ Level ${level + 1}<br>🥫 ${SAVE.upgradeCost(id)}`);
      up.onclick = () => { if (SAVE.upgrade(id)) { SFX.coin(); SAVE.questEvent('upgrade'); updateWallet(); catDetail(id); } else toast(level >= DATA.MAX_LEVEL ? 'Already max level!' : 'Not enough Cat Food 🥫'); };
      act.appendChild(up);
      const ev = SAVE.evolveInfo(id);
      if (ev) {
        const eb = el('button', 'btn ' + (ev.ok ? 'blue' : 'gray'), `✨ Evolve to<br>${ev.nextName}<br>🌿 ${ev.cost} · needs Lv${ev.needLevel}`);
        eb.onclick = () => { if (SAVE.evolve(id)) { SFX.fanfare(); updateWallet(); toast('✨ EVOLVED! ✨', 2000); catDetail(id); } else toast(c.level < ev.needLevel ? `Reach level ${ev.needLevel} first!` : 'Not enough Catnip 🌿'); };
        act.appendChild(eb);
      }
      if (!inDeck) { const ub = el('button', 'btn', '🃏 Use in Deck'); ub.onclick = () => { state.swapCat = id; closeModal(); toast('Now tap a deck slot to replace'); renderHome(); }; act.appendChild(ub); }
      else act.appendChild(el('div', 'tag', '✔ In your deck'));
    } else {
      act.appendChild(el('div', 'desc', def.exclusive ? '🎁 <b>Exclusive!</b> This cat is not in any capsule or stage. Only the Game Master can give you the gift code for it. Enter it in the Shop.' : def.rarity === 'basic' ? '🔓 Unlock by beating a World boss.' : '🎁 Get it from the Toy Capsule Machine, or as a stage reward!'));
    }
    const cl = el('button', 'btn gray', 'Close'); cl.onclick = () => { SFX.click(); closeModal(); }; act.appendChild(cl);
  }

  // ---------- CAPSULES ----------
  function renderCapsule(body) {
    const P = SAVE.get();
    const d = el('div', 'capsule');
    d.innerHTML = `<h2>🎁 Toy Capsule Machine</h2><div class="sub">Spend Catnip for a random new cat! Duplicates give Cat Food.</div><div class="machine" id="machine">🎰</div>
      <div class="odds">${Object.entries(DATA.CAPSULE_ODDS).map(([r, o]) => `<span class="tag rtext-${r}">${RN(r)} ${o}%</span>`).join('')}</div>`;
    const b = el('button', 'btn big ' + (P.nip >= DATA.CAPSULE_COST ? 'green' : 'gray'), `🎁 Pull! 🌿 ${DATA.CAPSULE_COST}`);
    b.onclick = () => {
      if (P.nip < DATA.CAPSULE_COST) { toast('Not enough Catnip 🌿. Win stages to earn more!'); return; }
      P.nip -= DATA.CAPSULE_COST; SAVE.save(); updateWallet(); SFX.capsule();
      const m = d.querySelector('#machine'); m.classList.add('shake'); b.disabled = true;
      setTimeout(() => {
        m.classList.remove('shake'); b.disabled = false;
        const r = SAVE.capsulePull(); updateWallet();
        const html = `<div class="center"><div class="sub">${r.isNew ? '🎉 NEW CAT! 🎉' : 'Duplicate! +🥫 ' + r.refund}</div><div class="reveal"><canvas width="140" height="140" id="cap-cv" style="background:#1b2340;border-radius:20px"></canvas></div><div class="mtitle">${r.def.name}</div><div class="rtext-${r.def.rarity}" style="font-weight:800">${RN(r.def.rarity)}</div><div class="desc">${r.def.desc}</div><div class="row"><button class="btn" id="cap-again">Pull again 🌿 ${DATA.CAPSULE_COST}</button><button class="btn gray" id="cap-ok">Nice!</button></div></div>`;
        const box = modal(html); ART.drawPortraitTo(box.querySelector('#cap-cv'), r.def, 0);
        if (r.isNew) SFX.fanfare();
        box.querySelector('#cap-ok').onclick = () => { closeModal(); renderHome(); };
        box.querySelector('#cap-again').onclick = () => { closeModal(); renderHome(); setTimeout(() => b.click(), 50); };
      }, 900);
    };
    d.appendChild(b);
    d.appendChild(el('div', 'sub', `<br>Pulls so far: ${P.capsules}`));
    body.appendChild(d);

    // ---- Cat Food shop ----
    body.appendChild(el('h2', null, '🥫 Cat Food Shop'));
    body.appendChild(el('div', 'sub', 'Trade Catnip for Cat Food to level up your cats faster.'));
    const g = el('div', 'shopgrid3');
    SAVE.FOOD_BUNDLES.forEach((b, i) => {
      const card = el('div', 'bundle' + (i === 2 ? ' best' : ''));
      card.innerHTML = `${i === 2 ? '<div class="ribbon">BEST VALUE</div>' : ''}<div class="big">${b.icon}</div><div class="bn">${b.name}</div><div class="bf">🥫 ${b.food}</div>`;
      const btn = el('button', 'btn ' + (P.nip >= b.nip ? 'green' : 'gray'), `🌿 ${b.nip}`);
      btn.onclick = () => { const r = SAVE.buyFood(i); if (r) { SFX.coin(); updateWallet(); toast(`+🥫 ${r.food} Cat Food!`); renderHome(); } else toast('Not enough Catnip 🌿'); };
      card.appendChild(btn); g.appendChild(card);
    });
    body.appendChild(g);

    // ---- More Catnip: Venmo + promo code ----
    body.appendChild(el('h2', null, '🌿 Need more Catnip?'));
    const info = el('div', 'world');
    info.innerHTML = `<div class="whead"><div class="wicon" style="background:#2a3358">🌿</div><div><div class="wname">Earn it in battle</div><div class="wdesc">First-time stage clears give 8 🌿, bosses give 30 🌿. Daily quests give a 10 🌿 bonus, and Toy Boxes sometimes have Catnip too.</div></div></div>`;
    body.appendChild(info);
    const vm = el('div', 'world');
    vm.innerHTML = `<div class="whead"><div class="wicon" style="background:#1f78d1">💸</div><div><div class="wname">Ask the Game Master</div><div class="wdesc">Want a Catnip top-up or an <b>exclusive Facetime Cat</b>? Send a tip on Venmo and ask for a code!</div></div></div>`;
    const a = el('a', 'venmo', '💙 Venmo @joeray26'); a.href = 'https://venmo.com/u/joeray26'; a.target = '_blank'; a.rel = 'noopener';
    vm.appendChild(a);
    vm.appendChild(el('div', 'sub', '<br>Got a promo code? Enter it here (one use per day):'));
    const pr = el('div', 'promo');
    const input = document.createElement('input'); input.type = 'text'; input.placeholder = 'promo code'; input.autocapitalize = 'none'; input.autocomplete = 'off'; input.spellcheck = false; input.maxLength = 32;
    const go = el('button', 'btn', 'Redeem');
    const redeem = () => {
      const r = SAVE.redeemPromo(input.value);
      if (r.ok && r.cat) {
        SFX.fanfare(); input.value = ''; const def = DATA.CAT_BY_ID[r.cat];
        const box = modal(`<div class="center"><div class="sub">🎁 A GIFT FROM THE GAME MASTER! 🎁</div><div class="reveal"><canvas width="140" height="140" id="gift-cv" style="background:#1b2340;border-radius:20px"></canvas></div><div class="mtitle">${def.name}</div><div class="rtext-${def.rarity}" style="font-weight:800">Exclusive ${RN(def.rarity)}</div><div class="desc">${def.desc}</div><div class="row"><button class="btn green" id="gift-deck">🃏 Use in Deck</button><button class="btn gray" id="gift-ok">Awesome!</button></div></div>`);
        ART.drawPortraitTo(box.querySelector('#gift-cv'), def, 0);
        box.querySelector('#gift-ok').onclick = () => { closeModal(); renderHome(); };
        box.querySelector('#gift-deck').onclick = () => { state.swapCat = r.cat; closeModal(); toast('Now tap a deck slot to replace'); setTab('cats'); };
      }
      else if (r.ok) { SFX.fanfare(); updateWallet(); input.value = ''; toast(`🎉 +🌿 ${r.nip} Catnip!`, 2400); renderHome(); }
      else if (r.reason === 'owned') toast(`You already have ${DATA.CAT_BY_ID[r.cat].name}! 😺`, 2200);
      else if (r.reason === 'used') toast('Already used today. Come back tomorrow! ⏰', 2200);
      else toast('Hmm, that’s not a code 🤔');
    };
    go.onclick = redeem; input.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); redeem(); input.blur(); } });
    pr.appendChild(input); pr.appendChild(go); vm.appendChild(pr);
    body.appendChild(vm);
  }

  // ---------- SETTINGS ----------
  function renderSettings(body) {
    const P = SAVE.get();
    body.appendChild(el('h2', null, 'More'));
    const s = el('div', 'world');
    s.innerHTML = `<div class="whead"><div class="wicon" style="background:#2a3358">📊</div><div><div class="wname">Your stats</div><div class="wdesc">Battles: ${P.battles} · Wins: ${P.wins} · Cats owned: ${Object.keys(P.cats).length}/${DATA.CATS.length} · Paws: ${Object.values(P.paws).reduce((a, b) => a + b, 0)}/120</div></div></div>`;
    body.appendChild(s);
    const snd = el('button', 'btn blue', (P.sound ? '🔊 Sound: ON' : '🔇 Sound: OFF')); snd.style.width = '100%'; snd.style.marginBottom = '8px';
    snd.onclick = () => { P.sound = !P.sound; SAVE.save(); SFX.setEnabled(P.sound); renderHome(); };
    body.appendChild(snd);
    const how = el('button', 'btn', '📖 How to play'); how.style.width = '100%'; how.style.marginBottom = '8px';
    how.onclick = () => modal(`<h2>How to play 🐾</h2><div class="desc">🐟 <b>Kibble</b> fills up over time (max 10). Every card costs Kibble.<br><br>👆 Tap a card, then tap <b>your half</b> of the yard to deploy. Cats charge up their lane automatically.<br><br>🏠 Destroy the enemy <b>Doghouses</b> for Paws 🐾. Smash the <b>Big Doghouse</b> to win instantly. Most Paws when time runs out wins!<br><br>🔫 The <b>Cat Cannon</b> charges up. Tap it to blast both lanes.<br><br>⏱️ The last minute is <b>Double Kibble</b>. If it's a tie, it's <b>Overtime</b>: the next tower wins.<br><br>💪 Some cats are <b>strong vs</b> 🔴 Red, 🎈 Floating, ⚙️ Metal or 👽 Alien enemies. ⚙️ Metal enemies take almost no damage unless you're strong vs Metal!<br><br>⬆️ Spend 🥫 Cat Food to level cats up. At level 5 and 10, spend 🌿 Catnip to <b>Evolve</b> them into new forms.</div><div class="row"><button class="btn" onclick="UI.closeModal()">Got it!</button></div>`);
    body.appendChild(how);
    const tip = el('div', 'world');
    tip.innerHTML = `<div class="whead"><div class="wicon" style="background:#2a3358">📱</div><div><div class="wname">Play full-screen on iPhone</div><div class="wdesc">In Safari tap <b>Share</b> → <b>Add to Home Screen</b>. Cat Royale opens like a real app, with no browser bars!</div></div></div>`;
    body.appendChild(tip);
    const rs = el('button', 'btn red', '🗑️ Reset all progress'); rs.style.width = '100%'; rs.style.marginTop = '14px';
    rs.onclick = () => modal(`<h2>Reset everything?</h2><div class="desc">This deletes all your cats, levels and stage progress. There is no undo!</div><div class="row"><button class="btn gray" onclick="UI.closeModal()">Keep my stuff</button><button class="btn red" id="rs-yes">Yes, reset</button></div>`).querySelector('#rs-yes').onclick = () => { SAVE.reset(); closeModal(); toast('Progress reset'); renderHome(); };
    body.appendChild(rs);
    body.appendChild(el('div', 'sub center', '<br>Cat Royale v0.1 · Inspired by The Battle Cats & Clash Royale · Made with 🐟'));
  }

  // ---------- DAILY ----------
  function renderDaily(body) {
    const P = SAVE.get(); const st = SAVE.dailyStatus();
    body.appendChild(el('h2', null, '🎁 Daily Reward'));
    body.appendChild(el('div', 'sub', st.claimedToday ? `Day ${((st.streak - 1) % 7) + 1} claimed! Come back tomorrow to keep your ${st.streak}-day streak.` : (st.streak > 0 ? `Streak: ${st.streak} day${st.streak > 1 ? 's' : ''}. Claim today to keep it going!` : 'Play every day for bigger rewards. Miss a day and the streak starts over.')));
    const grid = el('div', 'streak');
    SAVE.STREAK.forEach((r, i) => {
      const gotIdx = st.claimedToday ? (st.streak - 1) % 7 : ((st.streak % 7) - 1);
      const got = i <= gotIdx; const isToday = i === st.dayIndex && !st.claimedToday;
      const d = el('div', 'day' + (got ? ' got' : '') + (isToday ? ' today' : '') + (i === 6 ? ' big' : ''));
      d.innerHTML = `<span class="n">Day ${i + 1}</span><span class="r">${got ? '✅' : i === 6 ? '🏆' : '🥫'}</span>${r.food}${r.nip ? `<br>🌿${r.nip}` : ''}`;
      grid.appendChild(d);
    });
    body.appendChild(grid);
    const cb = el('button', 'btn big ' + (st.claimedToday ? 'gray' : 'green'), st.claimedToday ? '✔ Claimed today' : `Claim 🥫 ${st.reward.food}${st.reward.nip ? ' + 🌿 ' + st.reward.nip : ''}`);
    cb.style.width = '100%'; cb.disabled = st.claimedToday;
    cb.onclick = () => { const r = SAVE.claimDaily(); if (!r) return; SFX.fanfare(); updateWallet(); toast(`Day ${r.day}: +🥫 ${r.food}${r.nip ? ' +🌿 ' + r.nip : ''}!`, 2200); renderHome(); };
    body.appendChild(cb);

    body.appendChild(el('h2', null, '🎯 Today’s Quests'));
    const ms = SAVE.msUntilReset(); const hh = Math.floor(ms / 3600000), mm = Math.floor(ms % 3600000 / 60000);
    body.appendChild(el('div', 'sub', `Finish quests in battle to earn extra Cat Food. New quests in ${hh}h ${mm}m.`));
    const qs = SAVE.questView();
    qs.forEach((q, i) => {
      const d = el('div', 'quest' + (q.done ? ' done' : '') + (q.claimed ? ' claimed' : ''));
      d.innerHTML = `<div class="qi">${q.icon}</div><div class="qt"><b>${q.title}</b><div class="sub">${q.claimed ? 'Claimed' : q.done ? 'Complete!' : `${q.progress} / ${q.goal}`} · 🥫 ${q.reward}</div><div class="qbar"><div style="width:${Math.min(100, q.progress / q.goal * 100)}%"></div></div></div>`;
      if (q.done && !q.claimed) { const b = el('button', 'btn green', 'Claim'); b.onclick = () => { const r = SAVE.claimQuest(i); if (r) { SFX.coin(); updateWallet(); toast(`+🥫 ${r}!`); renderHome(); } }; d.appendChild(b); }
      else d.appendChild(el('div', 'tag', q.claimed ? '✔' : '⏳'));
      body.appendChild(d);
    });
    const allClaimed = qs.every(q => q.claimed);
    const bonus = el('div', 'quest' + (allClaimed ? ' done' : '') + (P.daily.bonusClaimed ? ' claimed' : ''));
    bonus.innerHTML = `<div class="qi">🌿</div><div class="qt"><b>All quests bonus</b><div class="sub">Claim all 3 quests · 🌿 ${SAVE.QUEST_BONUS_NIP} Catnip</div><div class="qbar"><div style="width:${qs.filter(q => q.claimed).length / 3 * 100}%"></div></div></div>`;
    if (allClaimed && !P.daily.bonusClaimed) { const b = el('button', 'btn blue', 'Claim'); b.onclick = () => { const r = SAVE.claimQuestBonus(); if (r) { SFX.fanfare(); updateWallet(); toast(`+🌿 ${r} Catnip!`, 2000); renderHome(); } }; bonus.appendChild(b); }
    else bonus.appendChild(el('div', 'tag', P.daily.bonusClaimed ? '✔' : `${qs.filter(q => q.claimed).length}/3`));
    body.appendChild(bonus);
  }
  function updateBadge() { const dot = $('.tab[data-tab="daily"] .dot'); if (dot) dot.classList.toggle('hidden', !SAVE.dailyHasClaimable()); }

  function renderHome() {
    updateBadge();
    updateWallet();
    const body = $('#home-body'); const scroll = body.scrollTop; body.innerHTML = '';
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === state.tab));
    ({ worlds: renderWorlds, cats: renderCats, capsule: renderCapsule, daily: renderDaily, settings: renderSettings })[state.tab](body);
    body.scrollTop = scroll;
  }
  function setTab(t) { state.tab = t; if (t !== 'cats') state.swapCat = null; renderHome(); }

  return { $, $$, el, state, scaleStage, showScreen, toast, modal, closeModal, updateWallet, renderHome, setTab, catDetail, stagePreview, enemyDeckFor, catCard };
})();
