/* Argosy – semi-automatic naval combat scene (canvas). Cannons fire on their own cooldowns; the player can board or flee. */
(function (G) {
  const A = G.A, R = A.game, h = A.h, t = A.t;
  const K = (A.combat = {});
  let c, cv, ctx, root, w, hh, dpr, time, raf, last, projs, parts, floats, vis, pos, shake, speed, overT, finished, onDone, ui, lastBoom;
  const rnd = (a, b) => a + Math.random() * (b - a);

  K.start = function (pirates, opts, done) {
    opts = opts || {}; onDone = done; c = R.newCombat(pirates);
    time = 0; projs = []; parts = []; floats = []; vis = {}; pos = {}; shake = 0; speed = 1; overT = 0; finished = false; lastBoom = 0;
    c.p.concat(c.e).forEach((s) => { vis[s.id] = { hull: s.hull, sink: 0, sinking: false, flash: 0, phase: Math.random() * 6 }; });
    if (opts.enemyVolley) c.e.forEach((s) => s._cd.forEach((_, i) => { s._cd[i] = Math.min(s._cd[i], 0.2 + i * 0.15); }));
    A.audio.gullsStop();
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

  function layout() {
    [['p', c.p, 0.25], ['e', c.e, 0.75]].forEach(([side, arr, fx]) => {
      const n = arr.length; const sp = Math.min(86, (hh * 0.52) / Math.max(1, n));
      arr.forEach((s, i) => {
        const T = A.SHIPS[s.type]; const u = Math.min(40, w * 0.095) * (0.85 + T.len * 0.22);
        pos[s.id] = { x: w * fx + ((i % 2) * 0.05 - 0.02) * w * (side === 'p' ? -1 : 1), y: hh * 0.5 + (i - (n - 1) / 2) * sp, u, dir: side === 'p' ? 1 : -1 };
      });
    });
  }
  const find = (id) => c.p.concat(c.e).find((s) => s.id === id);

  function consume() {
    for (const ev of c.events.splice(0)) {
      if (ev.kind === 'shot') {
        const a = find(ev.from), b = find(ev.to); if (!a || !b) continue;
        const pa = pos[a.id], pb = pos[b.id]; if (!pa || !pb) continue;
        projs.push({ sx: pa.x + pa.dir * pa.u * 0.9, sy: pa.y - pa.u * 0.05, tx: pb.x + (Math.random() - 0.5) * pb.u, ty: pb.y - pb.u * 0.1 + (Math.random() - 0.5) * pb.u * 0.4, t: 0, dur: 0.55 + Math.random() * 0.2, ev, tid: b.id });
        for (let i = 0; i < 4; i++) parts.push({ k: 'smoke', x: pa.x + pa.dir * pa.u * 0.9, y: pa.y - pa.u * 0.1, vx: pa.dir * rnd(8, 26), vy: rnd(-14, -4), r: rnd(3, 6), life: 0, max: rnd(0.7, 1.3) });
        if (time - lastBoom > 0.07) { A.audio.cannon(a._side === 'p' ? 1 : 0.7); lastBoom = time; }
      } else if (ev.kind === 'board') {
        const tp = pos[ev.target]; if (tp) floats.push({ x: tp.x, y: tp.y - tp.u * 1.6, txt: ev.ok ? t('combat.boarded') : t('combat.lostCrew', { n: ev.lost }), col: ev.ok ? '#2f6b3a' : '#a02a1a', t: 0, big: true });
        shake = 8; A.audio.hit();
      } else if (ev.kind === 'flee') {
        floats.push({ x: w * 0.25, y: hh * 0.3, txt: ev.ok ? t('combat.escaped') : t('combat.escapeFailed'), col: ev.ok ? '#2f6b3a' : '#a02a1a', t: 0, big: true });
      }
    }
  }
  function impact(p) {
    const tgt = find(p.tid); const v = vis[p.tid]; const pp = pos[p.tid]; if (!tgt || !v || !pp) return;
    if (p.ev.hit) {
      v.hull = Math.max(0, v.hull - (p.ev.dmg || 0)); v.flash = 1;
      for (let i = 0; i < 9; i++) parts.push({ k: 'spark', x: p.tx, y: p.ty, vx: rnd(-70, 70), vy: rnd(-90, 20), r: rnd(1, 2.4), life: 0, max: rnd(0.3, 0.6) });
      for (let i = 0; i < 5; i++) parts.push({ k: 'wood', x: p.tx, y: p.ty, vx: rnd(-50, 50), vy: rnd(-80, -10), r: rnd(1.5, 3), life: 0, max: rnd(0.5, 0.9) });
      floats.push({ x: p.tx, y: p.ty - 6, txt: '-' + Math.max(1, Math.round(p.ev.dmg || 1)), col: tgt._side === 'p' ? '#a02a1a' : '#fff3d0', t: 0 });
      if (tgt._side === 'p') shake = Math.max(shake, 5);
      A.audio.hit();
      if (p.ev.cannonLost) floats.push({ x: pp.x, y: pp.y - pp.u * 1.2, txt: t('combat.cannonLost'), col: '#a02a1a', t: 0 });
      if (p.ev.sunk) { v.sinking = true; floats.push({ x: pp.x, y: pp.y - pp.u * 1.5, txt: t('combat.sunk'), col: '#a02a1a', t: 0, big: true }); say(t('combat.sunkLog', { n: tgt.name })); for (let i = 0; i < 14; i++) parts.push({ k: 'bubble', x: pp.x + rnd(-pp.u, pp.u), y: pp.y + pp.u * 0.4, vx: rnd(-8, 8), vy: rnd(-30, -10), r: rnd(2, 5), life: 0, max: rnd(0.8, 1.6) }); }
    } else {
      for (let i = 0; i < 8; i++) parts.push({ k: 'drop', x: p.tx, y: pp.y + pp.u * 0.35, vx: rnd(-25, 25), vy: rnd(-70, -30), r: rnd(1, 2.2), life: 0, max: rnd(0.4, 0.7) });
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
    projs = projs.filter((p) => { p.t += sdt; if (p.t >= p.dur) { impact(p); return false; } return true; });
    parts.forEach((q) => { q.life += sdt; q.x += q.vx * sdt; q.y += q.vy * sdt; if (q.k === 'spark' || q.k === 'wood' || q.k === 'drop') q.vy += 160 * sdt; });
    parts = parts.filter((q) => q.life < q.max);
    floats.forEach((f) => { f.t += dt; }); floats = floats.filter((f) => f.t < 1.4);
    Object.keys(vis).forEach((id) => { const v = vis[id]; v.flash = Math.max(0, v.flash - dt * 4); if (v.sinking) v.sink = Math.min(1, v.sink + sdt * 0.45); });
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
    const hor = hh * 0.2;
    let g = ctx.createLinearGradient(0, 0, 0, hor); g.addColorStop(0, '#f1e4bb'); g.addColorStop(1, '#dccb98'); ctx.fillStyle = g; ctx.fillRect(-10, -10, w + 20, hor + 10);
    g = ctx.createLinearGradient(0, hor, 0, hh); g.addColorStop(0, '#b9cfc2'); g.addColorStop(1, '#6f978f'); ctx.fillStyle = g; ctx.fillRect(-10, hor, w + 20, hh - hor + 10);
    ctx.fillStyle = 'rgba(255,250,232,0.7)';
    for (let i = 0; i < 4; i++) { const cx = ((time * (6 + i * 3) + i * 120) % (w + 160)) - 80; ctx.beginPath(); ctx.ellipse(cx, hor * (0.25 + (i % 3) * 0.22), 38 + i * 6, 9 + i * 1.5, 0, 0, 6.3); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.2;
    for (let r = 0; r < 14; r++) { const y = hor + 14 + r * ((hh - hor) / 14); ctx.beginPath(); for (let x = 0; x <= w; x += 14) { const yy = y + Math.sin(x * 0.04 + time * 1.2 + r) * (2 + r * 0.25); x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.stroke(); }
    const all = c.p.concat(c.e).slice().sort((a, b) => pos[a.id].y - pos[b.id].y);
    all.forEach((s) => {
      const p = pos[s.id], v = vis[s.id]; if (v.sink >= 1) return;
      A.drawShip(ctx, p.x, p.y, p.u, s.type, { dir: p.dir, side: s._side, time, phase: v.phase, sink: v.sink, hullPct: v.hull / A.SHIPS[s.type].hull, cannons: s.cannons });
      if (v.flash > 0) { ctx.globalAlpha = v.flash * 0.35; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(p.x, p.y - p.u * 0.2, p.u * 1.1, p.u * 0.7, 0, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; }
      // water line over hull
      ctx.fillStyle = 'rgba(111,151,143,0.55)'; ctx.beginPath(); for (let x = -p.u * 1.3; x <= p.u * 1.3; x += 6) { const yy = p.y + p.u * 0.18 + Math.sin(x * 0.2 + time * 2 + v.phase) * 1.8; x === -p.u * 1.3 ? ctx.moveTo(p.x + x, yy) : ctx.lineTo(p.x + x, yy); } ctx.lineTo(p.x + p.u * 1.3, p.y + p.u * 0.7); ctx.lineTo(p.x - p.u * 1.3, p.y + p.u * 0.7); ctx.closePath(); ctx.fill();
      if (!v.sinking) bars(s, p, v);
    });
    parts.forEach((q) => {
      const f = 1 - q.life / q.max; ctx.globalAlpha = Math.max(0, f);
      if (q.k === 'smoke') { ctx.fillStyle = 'rgba(80,70,60,0.8)'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (1 + q.life * 2.5), 0, 6.3); ctx.fill(); }
      else if (q.k === 'spark') { ctx.fillStyle = '#ffb347'; ctx.fillRect(q.x, q.y, q.r, q.r); }
      else if (q.k === 'wood') { ctx.fillStyle = '#5a3a1c'; ctx.fillRect(q.x, q.y, q.r * 1.6, q.r * 0.7); }
      else if (q.k === 'drop') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.3); ctx.fill(); }
      else { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.3); ctx.stroke(); }
      ctx.globalAlpha = 1;
    });
    projs.forEach((p) => {
      const f = p.t / p.dur; const x = p.sx + (p.tx - p.sx) * f; const y = p.sy + (p.ty - p.sy) * f - Math.sin(f * Math.PI) * 38;
      ctx.fillStyle = '#1b130a'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 6.3); ctx.fill();
    });
    ctx.textAlign = 'center';
    floats.forEach((f) => { ctx.globalAlpha = Math.min(1, 1.6 - f.t); ctx.font = (f.big ? 'bold 17px' : 'bold 13px') + ' Georgia, serif'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.strokeText(f.txt, f.x, f.y - f.t * 30); ctx.fillStyle = f.col; ctx.fillText(f.txt, f.x, f.y - f.t * 30); ctx.globalAlpha = 1; });
    ctx.restore();
  }
  function bars(s, p, v) {
    const T = A.SHIPS[s.type]; const bw = Math.max(46, p.u * 1.9); const x = p.x - bw / 2, y = p.y + p.u * 0.78;
    ctx.fillStyle = 'rgba(30,20,10,0.55)'; ctx.fillRect(x - 1, y - 1, bw + 2, 7);
    const pct = Math.max(0, v.hull / T.hull); ctx.fillStyle = pct > 0.5 ? '#5aa65a' : pct > 0.25 ? '#d6a53a' : '#c0432a'; ctx.fillRect(x, y, bw * pct, 5);
    const n = s._cd ? s._cd.length : 0; const cw = Math.min(5, (bw - 2) / Math.max(1, n) - 1);
    for (let i = 0; i < n; i++) { const ready = 1 - Math.max(0, s._cd[i]) / (s._cdm[i] || 4); ctx.fillStyle = 'rgba(30,20,10,0.5)'; ctx.fillRect(x + i * (cw + 1), y + 8, cw, 4); ctx.fillStyle = ready >= 0.98 ? '#ffd66b' : '#e9a34a'; ctx.fillRect(x + i * (cw + 1), y + 8, cw * Math.max(0, Math.min(1, ready)), 4); }
    ctx.font = '600 10px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2.5;
    const label = s.name + ' · ' + s.crew; ctx.strokeText(label, p.x, y + 24); ctx.fillText(label, p.x, y + 24);
  }

  function finish() {
    finished = true; cancelAnimationFrame(raf); window.removeEventListener('resize', resize);
    root.remove();
    const res = R.finishCombat(c);
    onDone && onDone(res, c);
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
