/* Argosy – semi-automatic naval combat scene (canvas). Cannons fire on their own cooldowns; the player can board or flee. */
(function (G) {
  const A = G.A, R = A.game, h = A.h, t = A.t;
  const K = (A.combat = {});
  let c, cv, ctx, root, w, hh, dpr, time, raf, last, projs, parts, floats, vis, pos, shake, speed, overT, finished, onDone, ui, lastBoom;
  const rnd = (a, b) => a + Math.random() * (b - a);

  K.start = function (pirates, opts, done) {
    opts = opts || {}; onDone = done; c = R.newCombat(pirates);
    time = 0; projs = []; parts = []; floats = []; vis = {}; pos = {}; shake = 0; speed = 1; overT = 0; finished = false; lastBoom = 0;
    c.p.concat(c.e).forEach((s) => { vis[s.id] = { hull: s.hull, max: s.hull, sink: 0, sinking: false, flash: 0, phase: Math.random() * 6 }; });
    if (opts.enemyVolley) c.e.forEach((s) => s._cd.forEach((_, i) => { s._cd[i] = Math.min(s._cd[i], 0.2 + i * 0.15); }));
    A.audio.gullsStop(); A.audio.battleStart && A.audio.battleStart(); A.audio.ambOn && A.audio.ambOn('battle_tail', 0.35);
    cv = h('canvas', { class: 'combatcv' });
    ui = {};
    ui.title = h('div', { class: 'ctitle' }, t('combat.vs', { n: c.e.length }));
    ui.log = h('div', { class: 'clog' });
    ui.speed = h('button', { class: 'cspeed', onClick: () => { speed = speed === 1 ? 2 : 1; ui.speed.textContent = '×' + speed; } }, '×1');
    ui.boardCd = h('i', { class: 'cd' }); ui.fleeCd = h('i', { class: 'cd' });
    ui.boardTxt = h('span'); ui.fleeTxt = h('span');
    ui.board = h('button', { class: 'cbtn board', onClick: () => act('board') }, ui.boardCd, ui.boardTxt);
    ui.flee = h('button', { class: 'cbtn flee', onClick: () => act('flee') }, ui.fleeCd, ui.fleeTxt);
    root = h('div', { class: 'combat' }, cv, h('div', { class: 'chud' }, ui.title, ui.speed), ui.log, h('div', { class: 'cactions' }, ui.board, ui.flee));
    document.getElementById('overlay').append(root);
    ctx = cv.getContext('2d'); resize(); window.addEventListener('resize', resize);
    last = performance.now(); raf = requestAnimationFrame(frame);
  };
  function resize() { const r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); w = r.width; hh = r.height; cv.width = w * dpr; cv.height = hh * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function say(txt) { ui.log.textContent = txt; ui.log.classList.remove('flash'); void ui.log.offsetWidth; ui.log.classList.add('flash'); }
  function act(kind) {
    A.audio.unlock();
    if (kind === 'board') { const r = R.board(c); if (r) say(r.ok ? t('combat.boarded') : t('combat.repelled')); }
    else { const r = R.flee(c); if (r) say(r.ok ? t('combat.escaped') : t('combat.escapeFailed')); }
  }

  const FXI = {}; const fx = (n) => (FXI[n] = FXI[n] || Object.assign(new Image(), { src: 'img/' + n + '.png' }));
  ['muzzle','boom1','boom2','boom3','hit','splash1','splash2','splash3','smoke1','smoke2','smoke3','fire1','fire2','fire3','splinters','ball','tear','ripple','sparkle'].forEach((n) => fx('fx_' + n));
  function layout() {
    [['p', c.p, 0.76, 1], ['e', c.e, 0.30, -1]].forEach(([side, arr, fy, dir]) => {
      const n = arr.length; const sp = (w * 0.94) / Math.max(1, n); const px = Math.min(0.40, sp * 0.95 / 340, hh * 0.2 / 234);
      arr.forEach((s, i) => {
        const im = new Image(); im.src = 'img/ship_' + s.type + '.png'; const nw = im.naturalWidth || 250, nh = im.naturalHeight || 170;
        const wd = nw * px, hg = nh * px;
        pos[s.id] = { x: w * 0.03 + sp * (i + 0.5), y: hh * fy + (n > 1 ? (i % 2 ? 1 : -1) * hh * 0.03 : 0), u: 1, px, wd, hg, hl: wd * 0.45, bw: hg * 0.5, dir };
      });
    });
  }
  const find = (id) => c.p.concat(c.e).find((s) => s.id === id);

  function consume() {
    for (const ev of c.events.splice(0)) {
      if (ev.kind === 'shot') {
        const a = find(ev.from), b = find(ev.to); if (!a || !b) continue;
        const pa = pos[a.id], pb = pos[b.id]; if (!pa || !pb) continue;
        const sx0 = pa.x + (Math.random() - 0.5) * pa.hl * 1.0; const sy0 = pa.y - pa.hg * 0.3;
        let tx, ty; if (ev.hit) { tx = pb.x + (Math.random() - 0.5) * pb.hl * 1.1; ty = pb.y - pb.hg * (0.12 + Math.random() * 0.4); }
        else { tx = pb.x + (Math.random() - 0.5) * pb.hl * 1.8; ty = pb.y + (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 22); }
        projs.push({ sx: sx0, sy: sy0, tx, ty, t: 0, dur: 1.15 + Math.random() * 0.35, ev, tid: b.id, trail: [] });
        parts.push({ k: 'spr', f: ['fx_muzzle'], x: sx0 + pa.dir * 6, y: sy0, sz: pa.wd * 0.22, life: 0, max: 0.18 }); for (let i = 0; i < 3; i++) parts.push({ k: 'spr', f: ['fx_smoke1', 'fx_smoke2', 'fx_smoke3'], x: sx0 + pa.dir * (8 + i * 5), y: sy0 - i * 3, vx: pa.dir * rnd(4, 14), vy: -rnd(6, 16), sz: pa.wd * rnd(0.12, 0.2), life: 0, max: rnd(0.9, 1.6) });
        if (time - lastBoom > 0.07) { A.audio.cannon(a._side === 'p' ? 1 : 0.7); lastBoom = time; }
      } else if (ev.kind === 'board') {
        const tp = pos[ev.target]; if (tp) floats.push({ x: tp.x, y: tp.y - tp.bw * 1.6, txt: ev.ok ? t('combat.boarded') : t('combat.lostCrew', { n: ev.lost }), col: ev.ok ? '#2f6b3a' : '#a02a1a', t: 0, big: true });
        shake = 8; A.audio.hit();
      } else if (ev.kind === 'flee') {
        floats.push({ x: w * 0.5, y: hh * 0.5, txt: ev.ok ? t('combat.escaped') : t('combat.escapeFailed'), col: ev.ok ? '#2f6b3a' : '#a02a1a', t: 0, big: true });
      }
    }
  }
  function impact(p) {
    const tgt = find(p.tid); const v = vis[p.tid]; const pp = pos[p.tid]; if (!tgt || !v || !pp) return;
    if (p.ev.hit) {
      v.hull = Math.max(0, v.hull - (p.ev.dmg || 0)); v.flash = 1;
      parts.push({ k: 'spr', f: ['fx_hit', 'fx_boom1', 'fx_boom2', 'fx_boom3'], x: p.tx, y: p.ty, sz: pp.wd * 0.3, life: 0, max: 0.55 }); v.shk = 1; v.hits = (v.hits || 0) + 1; for (let i = 0; i < 9; i++) parts.push({ k: 'spark', x: p.tx, y: p.ty, vx: rnd(-70, 70), vy: rnd(-90, 20), r: rnd(1, 2.4), life: 0, max: rnd(0.3, 0.6) });
      parts.push({ k: 'spr', f: ['fx_splinters'], x: p.tx, y: p.ty, vx: rnd(-20, 20), vy: -rnd(20, 40), sz: pp.wd * 0.16, life: 0, max: 0.7 });
      floats.push({ x: p.tx, y: p.ty - 6, txt: '-' + Math.max(1, Math.round(p.ev.dmg || 1)), col: tgt._side === 'p' ? '#a02a1a' : '#fff3d0', t: 0 });
      if (tgt._side === 'p') shake = Math.max(shake, 5);
      A.audio.hit(p.ev.sunk);
      if (p.ev.cannonLost) floats.push({ x: pp.x, y: pp.y - pp.bw * 1.6, txt: t('combat.cannonLost'), col: '#a02a1a', t: 0 });
      if (p.ev.sunk) { A.audio.sink(); v.sinking = true; floats.push({ x: pp.x, y: pp.y - pp.bw * 2, txt: t('combat.sunk'), col: '#a02a1a', t: 0, big: true }); say(t('combat.sunkLog', { n: tgt.name })); for (let i = 0; i < 14; i++) parts.push({ k: 'bubble', x: pp.x + rnd(-pp.hl, pp.hl), y: pp.y + rnd(-pp.bw, pp.bw), vx: rnd(-8, 8), vy: rnd(-30, -10), r: rnd(2, 5), life: 0, max: rnd(0.8, 1.6) }); }
    } else {
      parts.push({ k: 'spr', f: ['fx_splash1', 'fx_splash2', 'fx_splash3'], x: p.tx, y: p.ty - 6, sz: pp.wd * 0.24, life: 0, max: 0.6 }); parts.push({ k: 'spr', f: ['fx_ripple'], x: p.tx, y: p.ty + 2, sz: pp.wd * 0.3, life: 0, max: 1.1 });
      A.audio.splash();
    }
  }

  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts; time += dt; const sdt = dt * speed;
    layout();
    if (!c.over) R.stepCombat(c, sdt);
    consume();
    if (c.over) { overT += dt; if (overT > 1.6 && !finished) finish(); }
    projs = projs.filter((p) => { p.t += sdt; { const f = Math.min(1, p.t / p.dur); const px = p.sx + (p.tx - p.sx) * f, py = p.sy + (p.ty - p.sy) * f; p.trail.push([px, py]); if (p.trail.length > 9) p.trail.shift(); if (Math.random() < 0.5) parts.push({ k: 'smoke', x: px, y: py, vx: 0, vy: 0, r: 2, life: 0, max: 0.5 }); } if (p.t >= p.dur) { impact(p); return false; } return true; });
    parts.forEach((q) => { q.life += sdt; q.x += q.vx * sdt; q.y += q.vy * sdt; if (q.k === 'spark' || q.k === 'wood' || q.k === 'drop') q.vy += 160 * sdt; });
    parts = parts.filter((q) => q.life < q.max);
    floats.forEach((f) => { f.t += dt; }); floats = floats.filter((f) => f.t < 1.4);
    Object.keys(vis).forEach((id) => { const v = vis[id]; v.flash = Math.max(0, v.flash - dt * 4); v.shk = Math.max(0, (v.shk || 0) - dt * 3.2); if (v.sinking) v.sink = Math.min(1, v.sink + sdt * 0.45); });
    shake = Math.max(0, shake - dt * 14);
    draw(); buttons();
  }

  function buttons() {
    const bc = R.boardChance(c), fc = R.fleeChance(c);
    ui.boardTxt.textContent = t('combat.board', { p: Math.round(bc * 100) }); ui.fleeTxt.textContent = t('combat.flee', { p: Math.round(fc * 100) });
    ui.boardCd.style.width = (c.boardCd / 15) * 100 + '%'; ui.fleeCd.style.width = (c.fleeCd / 12) * 100 + '%';
    ui.board.disabled = !!c.over || c.boardCd > 0; ui.flee.disabled = !!c.over || c.fleeCd > 0;
  }

  function draw() {
    ctx.save(); ctx.clearRect(0, 0, w, hh);
    if (shake > 0) ctx.translate(rnd(-shake, shake) * 0.5, rnd(-shake, shake) * 0.5);
    let g = ctx.createLinearGradient(0, 0, w, hh); g.addColorStop(0, '#5f9aa0'); g.addColorStop(0.5, '#4f8a93'); g.addColorStop(1, '#3d737f'); ctx.fillStyle = g; ctx.fillRect(-10, -10, w + 20, hh + 20);
    // swell bands + streaks scrolling downwards (ships sail up)
    const S = R.S(); const ws = S ? S.wind.str : 1; A.windStr = ws;
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 6; i++) { const y = ((time * 14 + i * hh / 6) % (hh + 80)) - 40; ctx.beginPath(); for (let x = 0; x <= w; x += 12) { const yy = y + Math.sin(x * 0.03 + i) * 10; x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } for (let x = w; x >= 0; x -= 12) ctx.lineTo(x, y + 28 + Math.sin(x * 0.03 + i + 1) * 10); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.32)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
    for (let r = 0; r < 26; r++) { const by = (r * 61.7) % hh, bx = ((r * 97.3 - time * (22 + ws * 6)) % (w + 40) + w + 40) % (w + 40) - 20, L = 14 + (r % 4) * 6; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + L * 0.5, by + 4, bx + L, by - 1); ctx.stroke(); }
    const all = c.p.concat(c.e).slice().sort((a, b) => pos[a.id].y - pos[b.id].y);
    all.forEach((s) => {
      const p = pos[s.id], v = vis[s.id]; if (v.sink >= 1) return;
      const hp = v.hull / (v.max || A.SHIPS[s.type].hull); const sk = (v.shk || 0) * Math.sin(time * 60) * p.wd * 0.025;
      ctx.fillStyle = 'rgba(10,40,50,0.28)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 3, p.wd * 0.46, p.hg * 0.06, 0, 0, 6.3); ctx.fill();
      A.drawShip(ctx, p.x, p.y, p.hg * 0.9, s.type, { side: s._side, dir: p.dir, time, phase: v.phase, sink: v.sink, hullPct: hp, px: p.px, shakeX: sk });
      if (v.flash > 0) { ctx.globalAlpha = v.flash * 0.35; ctx.fillStyle = '#fff'; ctx.fillRect(p.x - p.wd * 0.4, p.y - p.hg * 0.6, p.wd * 0.8, p.hg * 0.5); ctx.globalAlpha = 1; }
      if (!v.sinking) {
        if (hp < 0.75) { const tw = fx('fx_tear'); if (tw.complete) ctx.drawImage(tw, p.x - p.wd * 0.12, p.y - p.hg * 0.78, p.wd * 0.2, p.wd * 0.2 * tw.naturalHeight / (tw.naturalWidth || 1)); }
        const nf = hp < 0.25 ? 3 : hp < 0.5 ? 2 : hp < 0.75 ? 1 : 0;
        for (let k = 0; k < nf; k++) { const f = fx('fx_fire' + (1 + (Math.floor(time * 8 + k) % 3))); const sm = fx('fx_smoke' + (1 + (Math.floor(time * 3 + k) % 3))); const fxp = p.x + (k - 1) * p.wd * 0.24, fyp = p.y - p.hg * 0.3; if (f.complete) ctx.drawImage(f, fxp - p.wd * 0.07, fyp - p.wd * 0.14, p.wd * 0.14, p.wd * 0.14 * f.naturalHeight / (f.naturalWidth || 1)); if (sm.complete) { ctx.globalAlpha = 0.6; const o = (time * 18 + k * 20) % 40; ctx.drawImage(sm, fxp - p.wd * 0.06, fyp - p.wd * 0.2 - o, p.wd * 0.12, p.wd * 0.1); ctx.globalAlpha = 1; } }
        bars(s, p, v);
      }
    });
    parts.forEach((q) => {
      const f = 1 - q.life / q.max; ctx.globalAlpha = Math.max(0, f);
      if (q.k === 'spr') { const fi = Math.min(q.f.length - 1, Math.floor(q.life / q.max * q.f.length)); const im = fx(q.f[fi]); if (im.complete && im.naturalWidth) { const ww = q.sz, hg2 = q.sz * im.naturalHeight / im.naturalWidth; ctx.drawImage(im, q.x - ww / 2, q.y - hg2 / 2, ww, hg2); } }
      else if (q.k === 'smoke') { ctx.fillStyle = 'rgba(235,230,220,0.75)'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (1 + q.life * 2.2), 0, 6.3); ctx.fill(); }
      else if (q.k === 'flash') { ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (1 + q.life * 6), 0, 6.3); ctx.fill(); }
      else if (q.k === 'spark') { ctx.fillStyle = '#ffb347'; ctx.fillRect(q.x, q.y, q.r, q.r); }
      else if (q.k === 'wood') { ctx.fillStyle = '#5a3a1c'; ctx.fillRect(q.x, q.y, q.r * 1.6, q.r * 0.7); }
      else if (q.k === 'drop') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.3); ctx.fill(); }
      else { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.3); ctx.stroke(); }
      ctx.globalAlpha = 1;
    });
    projs.forEach((p) => {
      const f = p.t / p.dur; const x = p.sx + (p.tx - p.sx) * f; const y = p.sy + (p.ty - p.sy) * f; const lift = Math.sin(f * Math.PI);
      ctx.fillStyle = 'rgba(10,30,40,0.35)'; ctx.beginPath(); ctx.ellipse(x, y + 4 + lift * 10, 2.6, 1.8, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#17110b'; ctx.beginPath(); ctx.arc(x, y - lift * 12, 2.6 + lift * 1.6, 0, 6.3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x - 0.8, y - lift * 12 - 0.8, 0.9, 0, 6.3); ctx.fill();
    });
    ctx.textAlign = 'center';
    floats.forEach((f) => { ctx.globalAlpha = Math.min(1, 1.6 - f.t); ctx.font = (f.big ? 'bold 17px' : 'bold 13px') + ' Georgia, serif'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.strokeText(f.txt, f.x, f.y - f.t * 30); ctx.fillStyle = f.col; ctx.fillText(f.txt, f.x, f.y - f.t * 30); ctx.globalAlpha = 1; });
    ctx.restore();
  }
  function bars(s, p, v) {
    const T = A.SHIPS[s.type]; const bw = Math.max(54, Math.min(p.wd, 90)); const x = p.x - bw / 2, y = p.y + 10;
    ctx.fillStyle = 'rgba(30,20,10,0.55)'; ctx.fillRect(x - 1, y - 1, bw + 2, 7);
    const pct = Math.max(0, v.hull / T.hull); ctx.fillStyle = pct > 0.5 ? '#5aa65a' : pct > 0.25 ? '#d6a53a' : '#c0432a'; ctx.fillRect(x, y, bw * pct, 5);
    const n = s._cd ? s._cd.length : 0; const cw = Math.min(5, (bw - 2) / Math.max(1, n) - 1);
    for (let i = 0; i < n; i++) { const ready = 1 - Math.max(0, s._cd[i]) / (s._cdm[i] || 4); ctx.fillStyle = 'rgba(30,20,10,0.5)'; ctx.fillRect(x + i * (cw + 1), y + 8, cw, 4); ctx.fillStyle = ready >= 0.98 ? '#ffd66b' : '#e9a34a'; ctx.fillRect(x + i * (cw + 1), y + 8, cw * Math.max(0, Math.min(1, ready)), 4); }
    ctx.font = '600 10px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2.5;
    const label = s.name + ' · ' + s.crew; ctx.strokeText(label, p.x, y + 24); ctx.fillText(label, p.x, y + 24);
  }

  function finish() {
    finished = true; A.audio.ambOff && A.audio.ambOff('battle_tail'); cancelAnimationFrame(raf); window.removeEventListener('resize', resize);
    root.remove();
    const res = R.finishCombat(c);
    onDone && onDone(res, c);
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
