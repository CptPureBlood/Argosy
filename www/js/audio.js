/* Argosy – procedural audio (Web Audio): small harbour gong, distant gulls, cannon, hit, coin. No asset files. */
(function (G) {
  const A = G.A;
  const AU = (A.audio = { on: true, ctx: null, gullTimer: null, gullOn: false });
  const rnd = (a, b) => a + Math.random() * (b - a);

  AU.unlock = function () {
    if (!AU.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
      try { AU.ctx = new Ctx(); } catch (e) { return; }
      AU.master = AU.ctx.createGain(); AU.master.gain.value = 0.9; AU.master.connect(AU.ctx.destination);
    }
    if (AU.ctx.state === 'suspended') AU.ctx.resume();
  };
  const ready = () => AU.on && AU.ctx && AU.ctx.state === 'running';

  function noiseBuf(dur) {
    const c = AU.ctx; const n = Math.floor(c.sampleRate * dur); const b = c.createBuffer(1, n, c.sampleRate); const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b;
  }

  // small, soft gong: inharmonic partials with slow decay and a little shimmer
  AU.gong = function () {
    if (!ready()) return; const c = AU.ctx, t = c.currentTime;
    const out = c.createGain(); out.gain.value = 0.2; out.connect(AU.master);
    const base = 330;
    [1, 1.52, 2.07, 2.76, 3.4].forEach((r, i) => {
      [0, 1.6].forEach((det) => {
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = base * r + det * (i + 1);
        const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5 / (i + 1.3), t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0005, t + 2.1 - i * 0.22);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + 2.2);
      });
    });
    const n = c.createBufferSource(); n.buffer = noiseBuf(0.05);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2500; const ng = c.createGain(); ng.gain.setValueAtTime(0.15, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    n.connect(f); f.connect(ng); ng.connect(out); n.start(t);
  };

  function chirp(t0, vol) {
    const c = AU.ctx; const o = c.createOscillator(); o.type = 'triangle';
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2100; f.Q.value = 2.2;
    const g = c.createGain(); const b = rnd(1350, 1700);
    o.frequency.setValueAtTime(b, t0); o.frequency.exponentialRampToValueAtTime(b * 1.55, t0 + 0.11); o.frequency.exponentialRampToValueAtTime(b * 0.85, t0 + 0.3);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.03); g.gain.linearRampToValueAtTime(vol * 0.55, t0 + 0.16); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.34);
    o.connect(f); f.connect(g); g.connect(AU.master); o.start(t0); o.stop(t0 + 0.36);
  }
  AU.gull = function () {
    if (!ready()) return; const t = AU.ctx.currentTime; const n = 2 + Math.floor(Math.random() * 3); const vol = rnd(0.012, 0.03);
    for (let i = 0; i < n; i++) chirp(t + i * rnd(0.2, 0.32), vol * (1 - i * 0.12));
  };
  AU.gullsStart = function () {
    AU.gullOn = true; if (AU.gullTimer) return;
    const loop = () => { if (!AU.gullOn) { AU.gullTimer = null; return; } AU.gull(); AU.gullTimer = setTimeout(loop, rnd(3500, 9000)); };
    AU.gullTimer = setTimeout(loop, rnd(1200, 3000));
  };
  AU.gullsStop = function () { AU.gullOn = false; if (AU.gullTimer) { clearTimeout(AU.gullTimer); AU.gullTimer = null; } };

  AU.cannon = function (vol) {
    if (!ready()) return; const c = AU.ctx, t = c.currentTime; const v = (vol || 1) * 0.42;
    // sharp crack
    const n = c.createBufferSource(); n.buffer = noiseBuf(0.9);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(140, t + 0.5);
    const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(v * 0.35, t + 0.08); g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    n.connect(f); f.connect(g); g.connect(AU.master); n.start(t);
    // deep boom thump
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(28, t + 0.45);
    const og = c.createGain(); og.gain.setValueAtTime(v * 1.7, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.55); o.connect(og); og.connect(AU.master); o.start(t); o.stop(t + 0.6);
    // rolling echo over the water
    const e = c.createBufferSource(); e.buffer = noiseBuf(1.4);
    const ef = c.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 320;
    const eg = c.createGain(); eg.gain.setValueAtTime(0.0001, t + 0.12); eg.gain.linearRampToValueAtTime(v * 0.5, t + 0.3); eg.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
    e.connect(ef); ef.connect(eg); eg.connect(AU.master); e.start(t + 0.1);
    // whistle of the ball in flight
    const w = c.createOscillator(); w.type = 'sine'; w.frequency.setValueAtTime(900, t + 0.1); w.frequency.exponentialRampToValueAtTime(380, t + 1.0);
    const wg = c.createGain(); wg.gain.setValueAtTime(0.0001, t + 0.1); wg.gain.linearRampToValueAtTime(v * 0.05, t + 0.3); wg.gain.exponentialRampToValueAtTime(0.0001, t + 1.0); w.connect(wg); wg.connect(AU.master); w.start(t + 0.1); w.stop(t + 1.05);
  };
  AU.hit = function () {
    if (!ready()) return; const c = AU.ctx, t = c.currentTime;
    const n = c.createBufferSource(); n.buffer = noiseBuf(0.2);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1100;
    const g = c.createGain(); g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    n.connect(f); f.connect(g); g.connect(AU.master); n.start(t);
  };
  AU.splash = function () {
    if (!ready()) return; const c = AU.ctx, t = c.currentTime;
    const n = c.createBufferSource(); n.buffer = noiseBuf(0.3);
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1500;
    const g = c.createGain(); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    n.connect(f); f.connect(g); g.connect(AU.master); n.start(t);
  };
  AU.coin = function () {
    if (!ready()) return; const c = AU.ctx, t = c.currentTime;
    [1250, 1760].forEach((fr, i) => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = fr; const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t + i * 0.07); g.gain.linearRampToValueAtTime(0.06, t + i * 0.07 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.22);
      o.connect(g); g.connect(AU.master); o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.25);
    });
  };
  AU.setOn = function (v) { AU.on = !!v; if (!v) AU.gullsStop(); };
  document.addEventListener('visibilitychange', () => { if (!AU.ctx) return; if (document.hidden) { AU.gullsStop(); AU.ctx.suspend(); } else AU.ctx.resume(); });
})(typeof globalThis !== 'undefined' ? globalThis : window);
