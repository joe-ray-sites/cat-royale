/* ============ SOUND: tiny WebAudio synth ============ */
const SFX = (() => {
  let ac = null, enabled = true, master = null;
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = 0.25; master.connect(ac.destination); } catch (e) { ac = null; }
  }
  function tone(freq, dur, type = 'square', vol = 1, slide = 0, delay = 0) {
    if (!ac || !enabled) return;
    const t0 = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, vol = 0.6, delay = 0) {
    if (!ac || !enabled) return;
    const t0 = ac.currentTime + delay;
    const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = ac.createBufferSource(); s.buffer = buf; const g = ac.createGain(); g.gain.value = vol; s.connect(g); g.connect(master); s.start(t0);
  }
  const S = {
    init, setEnabled: v => { enabled = v; }, get enabled() { return enabled; },
    meow() { tone(620, 0.18, 'triangle', 0.8, 320); tone(880, 0.16, 'triangle', 0.5, -400, 0.12); },
    deploy() { tone(300, 0.08, 'square', 0.5, 200); },
    spell() { tone(200, 0.3, 'sawtooth', 0.6, 600); noise(0.2, 0.3); },
    hit() { tone(180, 0.05, 'square', 0.25, -80); },
    boom() { noise(0.35, 0.8); tone(80, 0.4, 'sine', 1, -40); },
    cannon() { noise(0.5, 0.9); tone(60, 0.6, 'sawtooth', 0.9, 200); },
    towerDown() { noise(0.6, 1); tone(120, 0.5, 'square', 0.8, -80); tone(90, 0.5, 'square', 0.6, -60, 0.15); },
    click() { tone(700, 0.05, 'square', 0.3); },
    coin() { tone(900, 0.08, 'square', 0.4); tone(1300, 0.12, 'square', 0.4, 0, 0.07); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'square', 0.5, 0, i * 0.12)); tone(1319, 0.5, 'square', 0.5, 0, 0.5); },
    lose() { [400, 350, 300, 200].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.4, -30, i * 0.22)); },
    alarm() { tone(500, 0.15, 'square', 0.5); tone(400, 0.15, 'square', 0.5, 0, 0.18); tone(500, 0.15, 'square', 0.5, 0, 0.36); },
    capsule() { for (let i = 0; i < 6; i++) tone(300 + i * 120, 0.08, 'square', 0.3, 0, i * 0.08); },
    fanfare() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.3, 'triangle', 0.6, 0, i * 0.1)); },
  };
  return S;
})();
