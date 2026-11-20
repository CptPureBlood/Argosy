/* Argosy – procedural ship drawing (side view) shared by map, combat and fleet screens. */
(function (G) {
  const A = G.A;

  // opts: {dir:1|-1, side:'p'|'e', time, sink:0..1, hullPct:0..1, cannons:n, firing:0..1}
  A.drawShip = function (ctx, x, y, u, type, o) {
    o = o || {};
    const T = A.SHIPS[type]; const dir = o.dir || 1; const time = o.time || 0; const sink = o.sink || 0;
    const L = u * T.len; const bob = Math.sin(time * 1.6 + (o.phase || 0)) * u * 0.04;
    ctx.save();
    ctx.translate(x, y + bob + sink * u * 1.3);
    ctx.rotate(dir * (Math.sin(time * 1.1 + (o.phase || 0)) * 0.03 + sink * 0.5));
    ctx.scale(dir, 1);
    if (sink > 0) ctx.globalAlpha = 1 - sink * 0.6;
    const pirate = o.side === 'e';
    const hullCol = pirate ? '#2f2a2a' : '#7a4a26'; const hullHi = pirate ? '#4a4040' : '#a56a38';
    const trim = pirate ? '#7a1f1f' : '#c9a24f';
    const sailCol = pirate ? '#cfc7b3' : '#f2e8cf';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#2c1d0e'; ctx.lineWidth = Math.max(1, u * 0.04);

    // oars (galley)
    if (T.oars) {
      ctx.strokeStyle = '#4a3320'; ctx.lineWidth = Math.max(1, u * 0.05);
      for (let i = 0; i < 7; i++) {
        const ox = -L * 0.7 + (i * L * 1.4) / 6; const sw = Math.sin(time * 3 + i * 0.5) * u * 0.18;
        ctx.beginPath(); ctx.moveTo(ox, u * 0.05); ctx.lineTo(ox + sw - u * 0.1, u * 0.55); ctx.stroke();
      }
      ctx.strokeStyle = '#2c1d0e'; ctx.lineWidth = Math.max(1, u * 0.04);
    }

    // masts + sails
    const masts = T.masts; const mh = u * (1.05 + masts * 0.18);
    for (let m = 0; m < masts; m++) {
      const mx = masts === 1 ? 0 : -L * 0.45 + (m * L * 0.9) / (masts - 1);
      const lateen = type === 'felucca' || type === 'galley' || (type === 'caravel' && m === masts - 1);
      ctx.strokeStyle = '#4a3320'; ctx.lineWidth = Math.max(1.2, u * 0.05);
      ctx.beginPath(); ctx.moveTo(mx, -u * 0.35); ctx.lineTo(mx, -mh); ctx.stroke();
      ctx.strokeStyle = '#2c1d0e'; ctx.lineWidth = Math.max(1, u * 0.035);
      const bill = Math.sin(time * 1.8 + m) * u * 0.05 + u * 0.12;
      ctx.fillStyle = sailCol;
      ctx.beginPath();
      if (lateen) {
        ctx.moveTo(mx, -mh); ctx.quadraticCurveTo(mx + L * 0.55 + bill, -mh * 0.55, mx + L * 0.7, -u * 0.4); ctx.lineTo(mx - L * 0.15, -u * 0.4); ctx.closePath();
      } else {
        const w = L * 0.34; const top = -mh * 0.95, bot = -u * 0.45 - (masts - m) * 0.0;
        ctx.moveTo(mx - w, top); ctx.lineTo(mx + w, top); ctx.quadraticCurveTo(mx + w + bill, (top + bot) / 2, mx + w * 0.9, bot); ctx.lineTo(mx - w * 0.9, bot); ctx.quadraticCurveTo(mx - w - bill * 0.4, (top + bot) / 2, mx - w, top); ctx.closePath();
      }
      ctx.fill(); ctx.stroke();
      if (!lateen && !pirate) { ctx.fillStyle = '#8a3b24'; ctx.fillRect(mx - L * 0.07, -mh * 0.78, L * 0.14, u * 0.28); }
      // flag
      if (m === 0) {
        const fl = Math.sin(time * 5) * u * 0.05;
        ctx.fillStyle = pirate ? '#101010' : '#8a3b24';
        ctx.beginPath(); ctx.moveTo(mx, -mh); ctx.lineTo(mx - u * 0.38, -mh - u * 0.06 + fl); ctx.lineTo(mx - u * 0.36, -mh + u * 0.14 + fl); ctx.lineTo(mx, -mh + u * 0.1); ctx.closePath(); ctx.fill();
        if (pirate && u > 24) { ctx.fillStyle = '#f2e8cf'; ctx.beginPath(); ctx.arc(mx - u * 0.18, -mh + u * 0.04 + fl * 0.6, u * 0.035, 0, 6.3); ctx.fill(); }
      }
    }

    // hull
    const hg = ctx.createLinearGradient(0, -u * 0.5, 0, u * 0.42); hg.addColorStop(0, hullHi); hg.addColorStop(0.55, hullCol); hg.addColorStop(1, pirate ? '#161212' : '#46280f');
    ctx.fillStyle = hg; ctx.strokeStyle = '#2c1d0e'; ctx.lineWidth = Math.max(1, u * 0.04);
    // bowsprit + rigging
    ctx.save(); ctx.strokeStyle = '#4a3320'; ctx.lineWidth = Math.max(1.2, u * 0.05); ctx.beginPath(); ctx.moveTo(L * 0.95, -u * 0.45); ctx.lineTo(L * 1.45, -u * 0.72); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,28,14,0.55)'; ctx.lineWidth = Math.max(0.6, u * 0.018); ctx.beginPath(); ctx.moveTo(L * 1.45, -u * 0.72); ctx.lineTo(masts === 1 ? 0 : L * 0.45, -mh * 0.9);
    for (let m = 0; m < masts; m++) { const mx = masts === 1 ? 0 : -L * 0.45 + (m * L * 0.9) / (masts - 1); ctx.moveTo(mx, -mh); ctx.lineTo(mx - L * 0.35, -u * 0.4); ctx.moveTo(mx, -mh); ctx.lineTo(mx + L * 0.35, -u * 0.4); }
    ctx.stroke(); ctx.restore();
    ctx.beginPath();
    ctx.moveTo(-L * 1.0, -u * 0.42); ctx.lineTo(-L * 0.9, u * 0.22); ctx.quadraticCurveTo(0, u * 0.42, L * 0.82, u * 0.22); ctx.lineTo(L * 1.08, -u * 0.5); ctx.lineTo(L * 0.2, -u * 0.38); ctx.lineTo(-L * 0.3, -u * 0.38); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // castles
    if (type === 'carrack' || type === 'galleon' || type === 'caravel') {
      ctx.fillStyle = hullCol; ctx.beginPath(); ctx.rect(-L * 1.0, -u * 0.72, L * 0.45, u * 0.34); ctx.fill(); ctx.stroke();
      if (type !== 'caravel') { ctx.beginPath(); ctx.rect(L * 0.72, -u * 0.62, L * 0.3, u * 0.14); ctx.fill(); ctx.stroke(); }
    }
    // planking
    ctx.strokeStyle = 'rgba(20,12,4,0.35)'; ctx.lineWidth = Math.max(0.5, u * 0.015);
    for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(-L * 0.9, -u * 0.38 + k * u * 0.15); ctx.quadraticCurveTo(0, -u * 0.34 + k * u * 0.17, L * 0.9, -u * 0.44 + k * u * 0.15); ctx.stroke(); }
    if (type !== 'felucca' && type !== 'galley') { ctx.fillStyle = '#f4d98a'; for (let i = 0; i < 3; i++) ctx.fillRect(-L * 0.93 + i * L * 0.13, -u * 0.62, u * 0.07, u * 0.1); }
    // trim stripe
    ctx.strokeStyle = trim; ctx.lineWidth = Math.max(1, u * 0.05);
    ctx.beginPath(); ctx.moveTo(-L * 0.95, -u * 0.12); ctx.lineTo(L * 0.98, -u * 0.18); ctx.stroke();
    // gun ports
    const nc = Math.min(o.cannons != null ? o.cannons : 0, 12);
    ctx.fillStyle = '#120c06';
    for (let i = 0; i < nc; i++) { const gx = -L * 0.75 + ((i + 0.5) * L * 1.5) / Math.max(nc, 1); ctx.fillRect(gx - u * 0.04, -u * 0.04, u * 0.08, u * 0.09); }
    // damage cracks
    if (o.hullPct != null && o.hullPct < 0.6) {
      ctx.strokeStyle = '#120c06'; ctx.lineWidth = Math.max(1, u * 0.03);
      ctx.beginPath(); ctx.moveTo(-L * 0.2, -u * 0.3); ctx.lineTo(-L * 0.1, -u * 0.05); ctx.lineTo(-L * 0.25, u * 0.1);
      if (o.hullPct < 0.3) { ctx.moveTo(L * 0.3, -u * 0.3); ctx.lineTo(L * 0.4, 0); ctx.lineTo(L * 0.3, u * 0.15); }
      ctx.stroke();
    }
    // foam line
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(1, u * 0.05); ctx.beginPath(); for (let x = -L * 0.95; x <= L * 0.95; x += u * 0.2) { const yy = u * 0.25 + Math.sin(x / u * 3 + time * 3) * u * 0.03; x === -L * 0.95 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke();
    ctx.restore();
  };


  // Top-down ship (bow up). hl = half length in px. o: {side, time, phase, sink, hullPct, cannons, face:1|-1 (side whose broadside is shown larger)}
  A.drawShipTop = function (ctx, x, y, hl, type, o) {
    o = o || {}; const T = A.SHIPS[type]; const time = o.time || 0; const sink = o.sink || 0; const ph = o.phase || 0; const pirate = o.side === 'e';
    const slim = type === 'galley' ? 0.19 : type === 'felucca' ? 0.22 : type === 'caravel' ? 0.25 : 0.28; const bw = hl * slim;
    ctx.save(); ctx.translate(x, y); const roll = Math.sin(time * 1.2 + ph) * 0.025; ctx.rotate(roll + sink * 0.35); const sc = 1 - sink * 0.3; ctx.scale(sc, sc);
    if (sink > 0) ctx.globalAlpha = 1 - sink * 0.75;
    const lw = Math.max(1, hl * 0.022);
    // wake
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let i = 0; i < 3; i++) { const k = (time * 0.7 + i / 3 + ph) % 1; ctx.globalAlpha *= 1; ctx.beginPath(); ctx.moveTo(-bw * 0.8, hl * (0.7 + k * 0.9)); ctx.quadraticCurveTo(0, hl * (0.9 + k * 1.0), bw * 0.8, hl * (0.7 + k * 0.9)); ctx.lineTo(bw * (1.1 + k), hl * (1.1 + k * 1.1)); ctx.lineTo(-bw * (1.1 + k), hl * (1.1 + k * 1.1)); ctx.closePath(); ctx.globalAlpha = (1 - sink * 0.75) * (0.18 * (1 - k)); ctx.fill(); }
    ctx.restore();
    // bow wave
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = lw * 1.4; ctx.beginPath(); ctx.moveTo(-bw * 1.5, -hl * 0.3 + Math.sin(time * 4 + ph) * 1.5); ctx.quadraticCurveTo(-bw * 0.9, -hl * 0.85, 0, -hl * 1.02); ctx.quadraticCurveTo(bw * 0.9, -hl * 0.85, bw * 1.5, -hl * 0.3 + Math.sin(time * 4 + ph + 1) * 1.5); ctx.stroke();
    // shadow
    const hullPath = (k) => { const b = bw * k, hh2 = hl * k; ctx.beginPath(); ctx.moveTo(0, -hh2); ctx.bezierCurveTo(b * 0.55, -hh2 * 0.7, b, -hh2 * 0.3, b, hh2 * 0.15); ctx.bezierCurveTo(b, hh2 * 0.6, b * 0.85, hh2 * 0.86, b * 0.62, hh2); ctx.lineTo(-b * 0.62, hh2); ctx.bezierCurveTo(-b * 0.85, hh2 * 0.86, -b, hh2 * 0.6, -b, hh2 * 0.15); ctx.bezierCurveTo(-b, -hh2 * 0.3, -b * 0.55, -hh2 * 0.7, 0, -hh2); ctx.closePath(); };
    ctx.save(); ctx.translate(hl * 0.07, hl * 0.05); ctx.fillStyle = 'rgba(10,30,40,0.28)'; hullPath(1.04); ctx.fill(); ctx.restore();
    // oars
    if (T.oars) { ctx.strokeStyle = '#3b2a17'; ctx.lineWidth = lw * 1.2; for (let i = 0; i < 9; i++) { const oy = -hl * 0.55 + i * hl * 0.15; const sw = Math.sin(time * 2.6 + i * 0.5) * hl * 0.05; [-1, 1].forEach((sd) => { ctx.beginPath(); ctx.moveTo(sd * bw * 0.95, oy); ctx.lineTo(sd * bw * 2.2, oy + sw + hl * 0.06); ctx.stroke(); }); } }
    // hull
    const g = ctx.createLinearGradient(-bw, 0, bw, 0); const c1 = pirate ? '#1d1818' : '#5a3418', c2 = pirate ? '#4a3d3a' : '#a06a36'; g.addColorStop(0, c1); g.addColorStop(0.5, c2); g.addColorStop(1, c1);
    ctx.fillStyle = g; ctx.strokeStyle = '#1e1208'; ctx.lineWidth = lw * 1.3; hullPath(1); ctx.fill(); ctx.stroke();
    if (pirate) { ctx.strokeStyle = '#8a1f1f'; ctx.lineWidth = lw * 1.1; hullPath(0.94); ctx.stroke(); } else { ctx.strokeStyle = '#c9a24f'; ctx.lineWidth = lw; hullPath(0.94); ctx.stroke(); }
    // deck
    ctx.save(); hullPath(0.84); ctx.clip(); ctx.fillStyle = pirate ? '#6a5a4a' : '#cfa56a'; ctx.fillRect(-bw, -hl, bw * 2, hl * 2);
    ctx.strokeStyle = 'rgba(60,36,12,0.45)'; ctx.lineWidth = Math.max(0.6, lw * 0.5); for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * bw * 0.2, -hl); ctx.lineTo(i * bw * 0.2, hl); ctx.stroke(); }
    // stern castle + fore castle
    if (type !== 'felucca') { ctx.fillStyle = pirate ? '#3a2f2b' : '#8a5a2c'; ctx.fillRect(-bw, hl * 0.52, bw * 2, hl * 0.5); ctx.fillStyle = '#f0cf7a'; for (let i = -2; i <= 2; i++) ctx.fillRect(i * bw * 0.3 - 1.5, hl * 0.9, 3, 3); }
    if (type === 'carrack' || type === 'galleon') { ctx.fillStyle = pirate ? '#3a2f2b' : '#8a5a2c'; ctx.fillRect(-bw, -hl * 0.88, bw * 2, hl * 0.22); }
    // hatch + barrels
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-bw * 0.35, hl * 0.12, bw * 0.7, hl * 0.12); ctx.fillStyle = '#7a4a22'; ctx.beginPath(); ctx.arc(bw * 0.45, hl * 0.3, bw * 0.16, 0, 6.3); ctx.arc(-bw * 0.45, hl * 0.34, bw * 0.16, 0, 6.3); ctx.fill();
    ctx.restore();
    // cannons (both broadsides)
    const nc = Math.min(o.cannons != null ? o.cannons : 0, 24); const per = Math.ceil(nc / 2);
    for (let i = 0; i < nc; i++) { const sd = i % 2 ? 1 : -1; const k = Math.floor(i / 2); const cy = -hl * 0.45 + (k + 0.5) * (hl * 0.95) / Math.max(per, 1); const ex = sd * bw * 0.97; const fire = o.recoil && o.recoil[i] ? o.recoil[i] : 0;
      ctx.fillStyle = '#15110d'; ctx.strokeStyle = '#000'; ctx.lineWidth = 0.5; ctx.fillRect(Math.min(ex, ex + sd * hl * 0.075), cy - hl * 0.02, hl * 0.075, hl * 0.04); ctx.fillStyle = '#6a625a'; ctx.beginPath(); ctx.arc(ex, cy, hl * 0.022, 0, 6.3); ctx.fill(); }
    // masts, yards and sails
    const mp = T.masts === 1 ? [0] : T.masts === 2 ? [-0.3, 0.3] : [-0.45, 0.0, 0.42];
    const lateen = type === 'felucca' || type === 'galley';
    mp.forEach((m, idx) => {
      const my = m * hl; const bil = Math.sin(time * 1.5 + idx + ph) * bw * 0.06; const sw = bw * (lateen ? 0.15 : 1.55); const sh = hl * (lateen ? 0.62 : 0.2);
      // sail shadow & body
      ctx.save(); ctx.translate(bw * 0.12, bw * 0.1); ctx.fillStyle = 'rgba(0,0,0,0.18)';
      if (lateen) { ctx.beginPath(); ctx.moveTo(0, my - sh * 0.9); ctx.lineTo(bw * 1.1, my + sh * 0.5); ctx.lineTo(-bw * 0.2, my + sh * 0.4); ctx.closePath(); } else { ctx.beginPath(); ctx.rect(-sw, my - sh * 0.5, sw * 2, sh); }
      ctx.fill(); ctx.restore();
      const sg = ctx.createLinearGradient(-sw, 0, sw, 0); sg.addColorStop(0, pirate ? '#a39b86' : '#d9ceb2'); sg.addColorStop(0.5, pirate ? '#d6cfba' : '#f6edd3'); sg.addColorStop(1, pirate ? '#a39b86' : '#d9ceb2');
      ctx.fillStyle = sg; ctx.strokeStyle = '#4a3320'; ctx.lineWidth = lw;
      ctx.beginPath();
      if (lateen) { ctx.moveTo(0, my - sh * 0.9); ctx.quadraticCurveTo(bw * 1.7 + bil, my - sh * 0.1, bw * 1.1, my + sh * 0.5); ctx.lineTo(-bw * 0.2, my + sh * 0.4); ctx.closePath(); }
      else { ctx.moveTo(-sw, my - sh * 0.5); ctx.quadraticCurveTo(0, my - sh * 0.5 - bw * 0.38 + bil, sw, my - sh * 0.5); ctx.lineTo(sw * 0.94, my + sh * 0.5); ctx.quadraticCurveTo(0, my + sh * 0.5 + bw * 0.25 + bil, -sw * 0.94, my + sh * 0.5); ctx.closePath(); }
      ctx.fill(); ctx.stroke();
      if (!lateen) { ctx.strokeStyle = 'rgba(70,50,30,0.35)'; ctx.lineWidth = Math.max(0.6, lw * 0.5); for (let k = 1; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(-sw * 0.9, my - sh * 0.5 + k * sh / 3); ctx.lineTo(sw * 0.9, my - sh * 0.5 + k * sh / 3); ctx.stroke(); }
        if (!pirate) { ctx.fillStyle = '#9a2f1c'; ctx.beginPath(); ctx.arc(0, my, bw * 0.28, 0, 6.3); ctx.fill(); ctx.fillStyle = '#e8b936'; ctx.fillRect(-bw * 0.04, my - bw * 0.22, bw * 0.08, bw * 0.44); ctx.fillRect(-bw * 0.22, my - bw * 0.04, bw * 0.44, bw * 0.08); } }
      // yard + mast
      ctx.strokeStyle = '#3b2a17'; ctx.lineWidth = lw * 1.5; if (!lateen) { ctx.beginPath(); ctx.moveTo(-sw * 1.04, my - sh * 0.5); ctx.lineTo(sw * 1.04, my - sh * 0.5); ctx.stroke(); }
      ctx.fillStyle = '#2a1c0e'; ctx.beginPath(); ctx.arc(0, my, Math.max(2, bw * 0.12), 0, 6.3); ctx.fill();
    });
    // bowsprit, flag, rudder
    ctx.strokeStyle = '#3b2a17'; ctx.lineWidth = lw * 1.4; ctx.beginPath(); ctx.moveTo(0, -hl * 0.92); ctx.lineTo(0, -hl * 1.18); ctx.stroke();
    const fy = mp[0] * hl; const fl = Math.sin(time * 6 + ph) * bw * 0.15;
    ctx.fillStyle = pirate ? '#0e0e0e' : '#8a3b24'; ctx.beginPath(); ctx.moveTo(0, fy); ctx.quadraticCurveTo(bw * 0.5, fy - bw * 0.05 + fl, bw * 0.95, fy + bw * 0.25 + fl); ctx.lineTo(0, fy + bw * 0.3); ctx.closePath(); ctx.fill();
    if (pirate && hl > 40) { ctx.fillStyle = '#f2e8cf'; ctx.beginPath(); ctx.arc(bw * 0.3, fy + bw * 0.12 + fl * 0.4, bw * 0.07, 0, 6.3); ctx.fill(); }
    ctx.fillStyle = '#2a1c0e'; ctx.fillRect(-bw * 0.08, hl * 0.98, bw * 0.16, hl * 0.12);
    // damage & fire
    const hp = o.hullPct != null ? o.hullPct : 1;
    if (hp < 0.65) { ctx.fillStyle = 'rgba(20,10,4,0.75)'; [[-0.3, -0.2, 0.1], [0.35, 0.15, 0.09], [-0.2, 0.55, 0.11]].slice(0, hp < 0.35 ? 3 : hp < 0.5 ? 2 : 1).forEach((d) => { ctx.beginPath(); ctx.arc(d[0] * bw * 1.6, d[1] * hl, d[2] * bw * 1.6, 0, 6.3); ctx.fill(); }); }
    if (hp < 0.35 && sink < 0.9) { for (let i = 0; i < 3; i++) { const fx = Math.sin(time * 7 + i * 2) * bw * 0.3; const fyy = -hl * 0.2 + i * hl * 0.3; ctx.fillStyle = 'rgba(255,' + (120 + Math.floor(Math.sin(time * 9 + i) * 50)) + ',30,0.85)'; ctx.beginPath(); ctx.ellipse(fx, fyy, bw * 0.17, bw * 0.3 + Math.sin(time * 11 + i) * 2, 0, 0, 6.3); ctx.fill(); } }
    ctx.restore();
  };

  // Mini canvas thumbnail of a ship type for lists.
  A.shipThumb = function (type, w, h, side) {
    const c = document.createElement('canvas'); const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px';
    const x = c.getContext('2d'); x.scale(dpr, dpr);
    A.drawShip(x, w / 2, h * 0.62, Math.min(w, h * 1.6) * 0.3, type, { dir: 1, side, time: 0, cannons: 0 });
    return c;
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
