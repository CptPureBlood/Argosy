/* Argosy – animated Mediterranean map (canvas): coast, waves, wind, skull zones, routes, ship. */
(function (G) {
  const A = G.A, W = A.world, R = A.game, C = A.C;
  const RAD = Math.PI / 180, YS = 1.27;
  const M = (A.map = { active: false, sel: null, onSelect: null, preview: null, ship: null, vAnim: null, follow: false, trail: [] });
  let cv, ctx, w = 0, h = 0, dpr = 1, time = 0, last = 0;
  const pts = new Map(); let moved = false, pinch = null;
  M.cx = 15; M.cy = 38; M.k = 13; M.tcx = 15; M.tcy = 38; M.tk = 13;

  // seeded decoration
  let seed = 7; const srnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const waves = [], peaks = [], parts = [];
  function buildDecor() {
    W.build();
    let guard = 0;
    while ((waves.length < 260 || peaks.length < 120) && guard++ < 20000) {
      const lon = C.LON_MIN + srnd() * (C.LON_MAX - C.LON_MIN), lat = C.LAT_MIN + srnd() * (C.LAT_MAX - C.LAT_MIN);
      const c = W.toCell(lon, lat);
      if (W.isLandCell(c[0], c[1])) { if (peaks.length < 120 && lat > 29.5) peaks.push([lon, lat, 0.6 + srnd() * 0.8]); }
      else if (!W.nearCoast[c[1] * W.cols + c[0]] && waves.length < 260) waves.push([lon, lat, srnd() * 6.28]);
    }
    for (let i = 0; i < 55; i++) parts.push({ x: srnd(), y: srnd(), s: 0.5 + srnd() });
  }

  const proj = (lon, lat) => [w / 2 + (lon - M.cx) * M.k, h / 2 - (lat - M.cy) * M.k * YS];
  M.proj = proj;
  function clampCam() {
    M.tk = Math.max(Math.max(7, w / (C.LON_MAX - C.LON_MIN)), Math.min(46, M.tk)); M.k = Math.max(7, Math.min(46, M.k));
    [['cx', 'tcx'], ['cy', 'tcy']].forEach(() => {});
    const vw = w / M.k, vh = h / (M.k * YS);
    const minX = C.LON_MIN + vw / 2, maxX = C.LON_MAX - vw / 2, minY = C.LAT_MIN + vh / 2, maxY = C.LAT_MAX - vh / 2;
    M.cx = minX > maxX ? (C.LON_MIN + C.LON_MAX) / 2 : Math.max(minX, Math.min(maxX, M.cx));
    M.cy = minY > maxY ? (C.LAT_MIN + C.LAT_MAX) / 2 : Math.max(minY, Math.min(maxY, M.cy));
  }

  M.init = function (wrap) {
    buildDecor();
    cv = document.createElement('canvas'); cv.className = 'mapcv'; wrap.appendChild(cv); ctx = cv.getContext('2d');
    new ResizeObserver(resize).observe(wrap);
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.offsetX, y: e.offsetY, sx: e.offsetX, sy: e.offsetY }); moved = false; if (pts.size === 2) { const p = [...pts.values()]; pinch = { d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), k: M.tk }; } });
    cv.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId); if (!p) return;
      const dx = e.offsetX - p.x, dy = e.offsetY - p.y; p.x = e.offsetX; p.y = e.offsetY;
      if (pts.size === 1) {
        if (Math.hypot(p.x - p.sx, p.y - p.sy) > 7) moved = true;
        if (moved) { M.follow = false; M.cx -= dx / M.k; M.cy += dy / (M.k * YS); M.tcx = M.cx; M.tcy = M.cy; clampCam(); M.tcx = M.cx; M.tcy = M.cy; }
      } else if (pts.size === 2 && pinch) {
        moved = true; const q = [...pts.values()]; const d = Math.hypot(q[0].x - q[1].x, q[0].y - q[1].y);
        M.tk = pinch.k * (d / pinch.d); M.k = M.tk; clampCam();
      }
    });
    const up = (e) => {
      const p = pts.get(e.pointerId); pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
      if (p && !moved && pts.size === 0) tap(p.x, p.y);
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', (e) => { pts.delete(e.pointerId); pinch = null; });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); M.tk *= e.deltaY < 0 ? 1.15 : 0.87; clampCam(); }, { passive: false });
    requestAnimationFrame(loop);
  };
  function resize() {
    if (!cv) return; dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = cv.parentElement.getBoundingClientRect(); w = Math.max(1, r.width); h = Math.max(1, r.height);
    cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    clampCam();
  }
  M.resize = resize;

  function tap(x, y) {
    let best = null, bd = 34;
    A.PORTS.forEach((p) => { const q = proj(p.lon, p.lat); const d = Math.hypot(q[0] - x, q[1] - y); if (d < bd) { bd = d; best = p.id; } });
    if (best && M.onSelect) M.onSelect(best);
  }

  M.centerOn = function (lon, lat, k) { M.tcx = lon; M.tcy = lat; if (k) M.tk = k; };
  M.fit = function (idA, idB) {
    const a = A.port(idA), b = A.port(idB);
    const lo = Math.min(a.lon, b.lon), hi = Math.max(a.lon, b.lon), la = Math.min(a.lat, b.lat), ha = Math.max(a.lat, b.lat);
    const kx = (w - 90) / Math.max(2, hi - lo), ky = (h - 150) / (Math.max(1.5, ha - la) * YS);
    M.tk = Math.max(8, Math.min(26, Math.min(kx, ky))); M.tcx = (lo + hi) / 2; M.tcy = (la + ha) / 2 - 0.4; M.follow = false;
  };
  M.setShipDocked = function (portId) { const p = A.port(portId); M.ship = { lon: p.lon, lat: p.lat, heading: 90 }; M.vAnim = null; M.trail = []; };
  // animate ship along its route from travelled a to b over ms
  M.animateVoyage = function (route, a, b, ms) { M.vAnim = { route, a, b, t: 0, ms }; };
  M.shipAt = (route, d) => { const p = W.posAt(route, d); M.ship = { lon: p.lon, lat: p.lat, heading: p.heading }; };

  function polyPath(poly) { ctx.beginPath(); poly.forEach((p, i) => { const q = proj(p[0], p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); }
  function icon(d, x, y, s, col, lw) { ctx.save(); ctx.translate(x - 12 * s, y - 12 * s); ctx.scale(s, s); ctx.strokeStyle = col; ctx.lineWidth = lw || 1.8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(pathOf(d)); ctx.restore(); }
  const iconCache = {}; function pathOf(d) { return iconCache[d] || (iconCache[d] = new Path2D(d)); }

  function drawBase() {
    ctx.fillStyle = '#e4d6ad'; ctx.fillRect(0, 0, w, h);
    const gr = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.8);
    gr.addColorStop(0, 'rgba(255,248,224,0.35)'); gr.addColorStop(1, 'rgba(120,90,40,0.22)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    // graticule
    ctx.strokeStyle = 'rgba(138,106,59,0.22)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let lo = -5; lo <= 35; lo += 5) { const x = proj(lo, 0)[0]; ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let la = 30; la <= 45; la += 5) { const y = proj(0, la)[1]; ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    // waves
    ctx.strokeStyle = 'rgba(110,90,60,0.4)'; ctx.lineWidth = 1;
    waves.forEach((v) => {
      const q = proj(v[0], v[1]); if (q[0] < -10 || q[0] > w + 10 || q[1] < -10 || q[1] > h + 10) return;
      const b = Math.sin(time * 1.4 + v[2]) * 2;
      ctx.beginPath(); ctx.moveTo(q[0] - 6, q[1]); ctx.quadraticCurveTo(q[0] - 3, q[1] - 3 + b, q[0], q[1]); ctx.quadraticCurveTo(q[0] + 3, q[1] + 3 - b, q[0] + 6, q[1]); ctx.stroke();
    });
    // land: shoreline glow, fill, outline
    const lands = [A.EURASIA, A.AFRICA].concat(A.ISLANDS);
    ctx.lineJoin = 'round';
    lands.forEach((p) => { polyPath(p); ctx.strokeStyle = 'rgba(120,90,50,0.13)'; ctx.lineWidth = 11; ctx.stroke(); ctx.lineWidth = 6; ctx.stroke(); });
    lands.forEach((p) => { polyPath(p); ctx.fillStyle = '#d6bd84'; ctx.fill(); });
    // inland water over land
    polyPath(A.BLACK_SEA); ctx.fillStyle = '#e4d6ad'; ctx.fill();
    ctx.strokeStyle = '#e4d6ad'; ctx.lineCap = 'round';
    A.CHANNELS.forEach((ch) => { ctx.beginPath(); ch.pts.forEach((p, i) => { const q = proj(p[0], p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.lineWidth = Math.max(3, ch.w * M.k * 0.7); ctx.stroke(); });
    ctx.strokeStyle = '#5b4326'; ctx.lineWidth = 1.5;
    lands.forEach((p) => { polyPath(p); ctx.stroke(); });
    polyPath(A.BLACK_SEA); ctx.stroke();
    // mountains
    if (M.k > 10) { ctx.strokeStyle = 'rgba(91,67,38,0.55)'; ctx.lineWidth = 1.1; peaks.forEach((v) => { const q = proj(v[0], v[1]); if (q[0] < 0 || q[0] > w || q[1] < 0 || q[1] > h) return; const s = 4 * v[2] * Math.min(1.6, M.k / 14); ctx.beginPath(); ctx.moveTo(q[0] - s, q[1] + s * 0.6); ctx.lineTo(q[0], q[1] - s * 0.6); ctx.lineTo(q[0] + s, q[1] + s * 0.6); ctx.stroke(); }); }
    // sea labels
    ctx.fillStyle = 'rgba(91,67,38,0.55)'; ctx.font = 'italic ' + Math.max(11, M.k * 0.9) + 'px Georgia, serif'; ctx.textAlign = 'center';
    [[A.t('sea.med'), 17, 34], [A.t('sea.adriatic'), 15.8, 43], [A.t('sea.aegean'), 25, 38.9], [A.t('sea.tyrrhenian'), 12, 39.8], [A.t('sea.black'), 33, 43.7]].forEach((s) => { const q = proj(s[1], s[2]); ctx.fillText(s[0], q[0], q[1]); });
  }

  function drawDanger() {
    const S = R.S(); if (!S) return;
    S.skulls.forEach((id) => {
      const p = A.port(id); const q = proj(p.lon, p.lat); const r = (260 / 60) * M.k * YS * (1 + Math.sin(time * 1.5) * 0.03);
      const g = ctx.createRadialGradient(q[0], q[1], r * 0.1, q[0], q[1], r); g.addColorStop(0, 'rgba(140,30,20,0.28)'); g.addColorStop(1, 'rgba(140,30,20,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, 6.3); ctx.fill();
    });
  }

  function drawRoute(r, from, fresh) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const line = (a, b) => { ctx.beginPath(); for (let d = a; d <= b; d += Math.max(8, (b - a) / 60)) { const p = W.posAt(r, d); const q = proj(p.lon, p.lat); d === a ? ctx.moveTo(q[0], q[1]) : ctx.lineTo(q[0], q[1]); } const p2 = W.posAt(r, b); const q2 = proj(p2.lon, p2.lat); ctx.lineTo(q2[0], q2[1]); ctx.stroke(); };
    ctx.strokeStyle = fresh ? '#8a3b24' : '#8a3b24'; ctx.lineWidth = 2.4;
    if (from > 0) { ctx.setLineDash([]); ctx.globalAlpha = 0.55; line(0, from); ctx.globalAlpha = 1; }
    ctx.setLineDash([7, 6]); ctx.lineDashOffset = -time * 14; line(from, r.total);
    ctx.restore();
  }

  function drawPorts() {
    const S = R.S(); const lang = A.lang;
    A.PORTS.forEach((p) => {
      const q = proj(p.lon, p.lat); if (q[0] < -60 || q[0] > w + 60 || q[1] < -30 || q[1] > h + 30) return;
      const sel = M.sel === p.id, here = S && S.port === p.id;
      if (sel) { ctx.strokeStyle = 'rgba(138,59,36,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q[0], q[1], 11 + Math.sin(time * 4) * 2, 0, 6.3); ctx.stroke(); }
      ctx.fillStyle = here ? '#8a3b24' : '#f6ecd0'; ctx.strokeStyle = '#2c1d0e'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(q[0], q[1], 5.5, 0, 6.3); ctx.fill(); ctx.stroke();
      if (p.yard) icon(A.ICONS.anchor, q[0] + 11, q[1] - 11, 0.62, '#2c1d0e', 2.4);
      if (S && S.skulls.indexOf(p.id) >= 0) { const bob = Math.sin(time * 3) * 1.5; ctx.fillStyle = 'rgba(246,236,208,0.85)'; ctx.beginPath(); ctx.arc(q[0], q[1] - 20 + bob, 9.5, 0, 6.3); ctx.fill(); icon(A.ICONS.skull, q[0], q[1] - 20 + bob, 0.62, '#8a1f14', 2.2); }
      ctx.font = '600 ' + Math.max(11, Math.min(15, M.k * 0.9)) + 'px Georgia, serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#2c1d0e';
      const lx = q[0] + 9, ly = q[1] + 15; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(236,220,182,0.85)'; ctx.strokeText(p.n[lang], lx, ly); ctx.fillText(p.n[lang], lx, ly);
      if (M.k > 12 || sel) { p.p.forEach((g, i) => icon(A.GOOD_BY_ID[g].d, lx + 8 + i * 15, ly + 12, 0.56, '#5b4326', 2.2)); }
    });
  }

  function drawWindFx() {
    const S = R.S(); if (!S) return; const b = S.wind.dir * RAD; const dx = Math.sin(b), dy = -Math.cos(b);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    parts.forEach((p) => {
      const sp = (0.015 + 0.02 * S.wind.str) * p.s; p.x = (p.x + dx * sp * 0.2 + 1) % 1; p.y = (p.y + dy * sp * 0.2 + 1) % 1;
      const x = p.x * w, y = p.y * h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx * 12 * S.wind.str, y + dy * 12 * S.wind.str); ctx.stroke();
    });
    // wind badge
    ctx.save(); ctx.translate(36, 36); ctx.fillStyle = 'rgba(246,236,208,0.9)'; ctx.strokeStyle = '#2c1d0e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 22, 0, 6.3); ctx.fill(); ctx.stroke();
    ctx.rotate(b); ctx.strokeStyle = '#8a3b24'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, -12); ctx.moveTo(-6, -5); ctx.lineTo(0, -12); ctx.lineTo(6, -5); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#2c1d0e'; ctx.font = '600 11px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(A.t('wind.force', { n: Math.round(S.wind.str * 2) }), 36, 70);
  }

  function drawCompass() {
    const x = w - 46, y = h - 120; ctx.save(); ctx.translate(x, y); ctx.strokeStyle = 'rgba(91,67,38,0.8)'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, 6.3); ctx.arc(0, 0, 14, 0, 6.3); ctx.moveTo(0, -30); ctx.lineTo(0, 30); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.moveTo(-16, -16); ctx.lineTo(16, 16); ctx.moveTo(-16, 16); ctx.lineTo(16, -16); ctx.stroke();
    ctx.fillStyle = '#8a3b24'; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(5, -12); ctx.lineTo(-5, -12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2c1d0e'; ctx.font = 'bold 11px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('N', 0, -34); ctx.restore();
  }

  function drawShip() {
    const S = R.S(); if (!S || !M.ship) return; const s = M.ship; const q = proj(s.lon, s.lat);
    const u = Math.max(9, Math.min(17, M.k * 0.85)); const dir = Math.sin(s.heading * RAD) >= 0 ? 1 : -1;
    // wake
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 1; i < M.trail.length; i++) { const a = proj(M.trail[i - 1][0], M.trail[i - 1][1]), b = proj(M.trail[i][0], M.trail[i][1]); ctx.globalAlpha = i / M.trail.length * 0.6; ctx.beginPath(); ctx.moveTo(a[0], a[1] + 3); ctx.lineTo(b[0], b[1] + 3); ctx.stroke(); }
    ctx.globalAlpha = 1;
    const t = S.ships.length ? S.ships.slice().sort((a, b) => A.SHIPS[b.type].cost - A.SHIPS[a.type].cost)[0].type : 'felucca';
    A.drawShip(ctx, q[0], q[1] - u * 0.2, u, t, { dir, time, side: 'p', cannons: 0 });
    for (let i = 1; i < Math.min(S.ships.length, 4); i++) A.drawShip(ctx, q[0] - dir * i * u * 1.5, q[1] - u * 0.2 + i * 2, u * 0.7, S.ships[i].type, { dir, time, side: 'p', phase: i, cannons: 0 });
  }

  function loop(ts) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts; if (!w) return;
    time += dt;
    if (M.vAnim) {
      const v = M.vAnim; v.t += dt * 1000; const f = Math.min(1, v.t / v.ms); M.shipAt(v.route, v.a + (v.b - v.a) * f);
      if (!M.trail.length || Math.hypot(M.trail[M.trail.length - 1][0] - M.ship.lon, M.trail[M.trail.length - 1][1] - M.ship.lat) > 0.12) { M.trail.push([M.ship.lon, M.ship.lat]); if (M.trail.length > 14) M.trail.shift(); }
      if (f >= 1) { M.vAnim = null; if (v.done) v.done(); }
    }
    if (M.follow && M.ship) { M.tcx = M.ship.lon; M.tcy = M.ship.lat; M.tk = Math.max(M.tk, 15); }
    if (!M.active) return;
    M.k += (M.tk - M.k) * 0.14; M.cx += (M.tcx - M.cx) * 0.14; M.cy += (M.tcy - M.cy) * 0.14; clampCam();
    ctx.clearRect(0, 0, w, h);
    drawBase(); drawDanger();
    const S = R.S();
    if (S && S.voyage) { const r = W.route(S.voyage.from, S.voyage.to); const trv = M.vAnim ? M.vAnim.a + (M.vAnim.b - M.vAnim.a) * Math.min(1, M.vAnim.t / M.vAnim.ms) : S.voyage.travelled; drawRoute(r, trv, false); }
    else if (M.preview) drawRoute(M.preview, 0, true);
    drawWindFx(); drawPorts(); drawShip(); drawCompass();
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
