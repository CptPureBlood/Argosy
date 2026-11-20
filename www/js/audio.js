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
    // heavy thud
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
    const og = c.createGain(); og.gain.setValueAtTime(0.4, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.22); o.connect(og); og.connect(AU.master); o.start(t); o.stop(t + 0.25);
    // splintering wood: a burst of short band-passed crackles
    for (let i = 0; i < 7; i++) {
      const tt = t + i * rnd(0.012, 0.045) + 0.005; const n = c.createBufferSource(); n.buffer = noiseBuf(0.08);
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = rnd(500, 2200); f.Q.value = rnd(2, 6);
      const g = c.createGain(); g.gain.setValueAtTime(rnd(0.18, 0.38), tt); g.gain.exponentialRampToValueAtTime(0.001, tt + rnd(0.03, 0.07));
      n.connect(f); f.connect(g); g.connect(AU.master); n.start(tt);
    }
    // low crunch
    const n2 = c.createBufferSource(); n2.buffer = noiseBuf(0.3); const f2 = c.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 600;
    const g2 = c.createGain(); g2.gain.setValueAtTime(0.3, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.28); n2.connect(f2); f2.connect(g2); g2.connect(AU.master); n2.start(t);
  };
  AU.splash = function () {
    if (!ready()) return; const c = AU.ctx, t = c.currentTime;
    const n = c.createBufferSource(); n.buffer = noiseBuf(0.7);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.8; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(500, t + 0.5);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3, t + 0.03); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    n.connect(f); f.connect(g); g.connect(AU.master); n.start(t);
    [0, 0.09, 0.17].forEach((d, i) => { const o = c.createOscillator(); o.type = 'sine'; const b = 380 + i * 160; o.frequency.setValueAtTime(b, t + d); o.frequency.exponentialRampToValueAtTime(b * 2.2, t + d + 0.1); const og = c.createGain(); og.gain.setValueAtTime(0.0001, t + d); og.gain.linearRampToValueAtTime(0.05, t + d + 0.01); og.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.12); o.connect(og); og.connect(AU.master); o.start(t + d); o.stop(t + d + 0.14); });
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

  // ---- bowed "cello mumble" voice used for character speech (idx 0 thinnest .. 4 deepest)
  const VOICE_F0 = [220, 174, 131, 98, 65];
  AU.voiceStart = function (idx) {
    if (!AU.on) return; AU.unlock(); const c = AU.ctx; if (!c) return; AU.voiceStop(true);
    const f0 = VOICE_F0[((idx % 5) + 5) % 5]; const t0 = c.currentTime;
    const osc = c.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = f0;
    const lfo = c.createOscillator(); lfo.frequency.value = 5.1; const lg = c.createGain(); lg.gain.value = f0 * 0.012; lfo.connect(lg); lg.connect(osc.frequency);
    const pre = c.createBiquadFilter(); pre.type = 'lowpass'; pre.frequency.value = 2500; osc.connect(pre);
    const sum = c.createGain(); sum.gain.value = 1;
    [[280, 5, 0.9], [520, 6, 0.8], [1050, 6, 0.45], [2200, 5, 0.12]].forEach((p) => { const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = p[0]; f.Q.value = p[1]; const g = c.createGain(); g.gain.value = p[2]; pre.connect(f); f.connect(g); g.connect(sum); });
    const low = c.createBiquadFilter(); low.type = 'lowpass'; low.frequency.value = 200; const lowg = c.createGain(); lowg.gain.value = 0.25; pre.connect(low); low.connect(lowg); lowg.connect(sum);
    const nb = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
    const ns = c.createBufferSource(); ns.buffer = nb; ns.loop = true; const nf = c.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 1800; const ng = c.createGain(); ng.gain.value = 0.07; ns.connect(nf); nf.connect(ng); ng.connect(sum);
    const vg = c.createGain(); vg.gain.value = 0; sum.connect(vg);
    const dly = c.createDelay(0.5); dly.delayTime.value = 0.11; const fb = c.createGain(); fb.gain.value = 0.28; const wet = c.createGain(); wet.gain.value = 0.22; vg.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(wet);
    const out = c.createGain(); out.gain.value = 0.55; vg.connect(out); wet.connect(out); out.connect(AU.master);
    osc.start(t0); lfo.start(t0); ns.start(t0);
    const V = { osc, lfo, ns, vg, out, f0, timer: null, until: 0 };
    const ratios = [1, 1.125, 0.89, 1.19, 0.84, 1.33, 1];
    const note = () => {
      const now = c.currentTime; if (now < V.until) return;
      const dur = 0.28 + Math.random() * 0.32; const f = f0 * ratios[Math.floor(Math.random() * ratios.length)];
      osc.frequency.cancelScheduledValues(now); osc.frequency.setValueAtTime(osc.frequency.value, now); osc.frequency.linearRampToValueAtTime(f, now + 0.18);
      vg.gain.cancelScheduledValues(now); vg.gain.setValueAtTime(vg.gain.value, now); vg.gain.linearRampToValueAtTime(0.5, now + dur * 0.3); vg.gain.linearRampToValueAtTime(0.0, now + dur);
      V.until = now + dur + 0.03 + Math.random() * 0.1;
    };
    note(); V.timer = setInterval(note, 40); AU._voice = V;
  };
  AU.voiceStop = function (now) {
    const V = AU._voice; if (!V) return; AU._voice = null; clearInterval(V.timer); const c = AU.ctx, t = c.currentTime;
    try { V.vg.gain.cancelScheduledValues(t); V.vg.gain.setValueAtTime(V.vg.gain.value, t); V.vg.gain.linearRampToValueAtTime(0, t + (now ? 0.02 : 0.12)); V.osc.stop(t + 0.3); V.lfo.stop(t + 0.3); V.ns.stop(t + 0.3); } catch (e) {}
    setTimeout(() => { try { V.out.disconnect(); } catch (e) {} }, 900);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
