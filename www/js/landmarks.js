/* Argosy – small illustrated landmarks for the map (procedural, original). draw(ctx, type, x, y, s): base centre at (x,y), width about s. */
(function (G) {
  const A = (G.A = G.A || {});
  const OL = '#3b2a17', STONE = '#e9dcc0', STONE2 = '#cdb98e', RED = '#a8452c', GOLD = '#d9a93a', TEAL = '#3f8c8a', GREEN = '#4f7a45', SAND = '#e2c98a', WHITE = '#f7f1e0';
  function draw(ctx, t, x, y, s) {
    ctx.save(); ctx.translate(x, y); const u = s / 20; ctx.scale(u, u); ctx.lineWidth = 1.1 / Math.max(0.55, u) * 0.7; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OL;
    const R = (a, b, w, h, f) => { ctx.fillStyle = f || STONE; ctx.fillRect(a, b, w, h); ctx.strokeRect(a, b, w, h); };
    const T = (x1, y1, x2, y2, x3, y3, f) => { ctx.fillStyle = f || STONE; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fill(); ctx.stroke(); };
    const D = (cx, cy, r, f) => { ctx.fillStyle = f || TEAL; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); };
    const C = (cx, cy, r, f) => { ctx.fillStyle = f; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.3); ctx.fill(); ctx.stroke(); };
    const spire = (cx, y0, w, h, f) => { T(cx - w / 2, y0, cx + w / 2, y0, cx, y0 - h, f || RED); };
    switch (t) {
      case 'tower': R(-4, -14, 8, 14); R(-5, -17, 10, 3, STONE2); spire(0, -17, 6, 5, GOLD); R(-1.2, -9, 2.4, 4, '#6b4a2a'); break;
      case 'cathedral': R(-8, -9, 16, 9); [-5, 0, 5].forEach((c) => { R(c - 1.8, -16, 3.6, 7, STONE2); spire(c, -16, 4, 6, RED); }); R(-1.5, -4, 3, 4, '#6b4a2a'); break;
      case 'lantern': R(-4, -6, 8, 6, STONE2); R(-2.6, -16, 5.2, 10); R(-3.4, -18.5, 6.8, 2.5, RED); C(0, -13, 1.3, GOLD); break;
      case 'campanile': R(-3, -18, 6, 18, RED); R(-4, -20, 8, 3, STONE2); spire(0, -20, 6, 6, GREEN); R(-1.3, -16, 2.6, 4, GOLD); break;
      case 'volcano': T(-12, 0, 12, 0, 0, -16, '#8a6b4c'); T(-3, -11, 3, -11, 0, -16, '#c8452a'); ctx.fillStyle = 'rgba(80,70,60,0.5)'; C(2, -19, 2.6, 'rgba(120,110,100,0.7)'); break;
      case 'parthenon': R(-9, -2, 18, 2, STONE2); for (let i = 0; i < 5; i++) R(-7.5 + i * 3.7, -11, 1.8, 9); T(-10, -11, 10, -11, 0, -16, STONE); break;
      case 'hagia': D(0, -7, 6, '#5d8fa8'); R(-7, -7, 14, 7); [-10, 10].forEach((c) => { R(c - 1, -17, 2, 17, STONE2); spire(c, -17, 3, 4, RED); }); R(-1.3, -4, 2.6, 4, '#6b4a2a'); break;
      case 'colossus': R(-6, -3, 12, 3, STONE2); R(-1.5, -14, 3, 11, '#c28a3a'); C(0, -16, 2.2, GOLD); ctx.beginPath(); ctx.moveTo(1.5, -12); ctx.lineTo(6, -18); ctx.stroke(); C(6, -18.5, 1.3, RED); break;
      case 'pharos': R(-6, -5, 12, 5, STONE2); R(-4, -11, 8, 6); R(-2.6, -16, 5.2, 5); C(0, -19, 2, GOLD); ctx.beginPath(); ctx.moveTo(-6, -22); ctx.lineTo(-3, -20); ctx.moveTo(6, -22); ctx.lineTo(3, -20); ctx.stroke(); break;
      case 'mosque': D(0, -8, 5, GREEN); R(-6, -8, 12, 8); R(-9.5, -17, 2, 17, STONE2); spire(-8.5, -17, 3, 4, GOLD); R(7.5, -17, 2, 17, STONE2); spire(8.5, -17, 3, 4, GOLD); break;
      case 'fort': R(-8, -9, 16, 9, SAND); [-8, -3, 2, 6].forEach((c) => R(c, -12, 2.4, 3, SAND)); R(-9, -15, 5, 6, STONE2); R(4, -15, 5, 6, STONE2); R(-1.5, -5, 3, 5, '#6b4a2a'); break;
      case 'temple': R(-7, -3, 14, 3, STONE2); R(-5.5, -8, 11, 5, '#d7a64a'); R(-4, -12, 8, 4, '#c96a3a'); R(-2.4, -15, 4.8, 3, '#d7a64a'); R(-1.2, -17.5, 2.4, 2.5, GOLD); break;
      case 'prang': for (let i = 0; i < 4; i++) { const w = 12 - i * 2.6; R(-w / 2, -3.5 * (i + 1), w, 3.5, i % 2 ? GOLD : STONE); } spire(0, -14, 2, 7, GOLD); break;
      case 'pagoda': for (let i = 0; i < 4; i++) { const w = 15 - i * 3; R(-w / 2 + 1, -4 * (i + 1) + 1, w - 2, 3, '#e8d9b4'); T(-w / 2 - 1, -4 * i - 3, w / 2 + 1, -4 * i - 3, 0, -4 * i - 6, RED); } break;
      case 'colosseum': ctx.fillStyle = SAND; ctx.beginPath(); ctx.ellipse(0, -5, 10, 6.5, 0, 0, 6.3); ctx.fill(); ctx.stroke(); ctx.fillStyle = STONE2; ctx.beginPath(); ctx.ellipse(0, -6, 5.6, 3.2, 0, 0, 6.3); ctx.fill(); ctx.fillStyle = OL; for (let i = -3; i <= 3; i++) ctx.fillRect(i * 2.8 - 0.5, -2.8, 1, 2.3); break;
      case 'pisa': ctx.save(); ctx.rotate(0.12); for (let i = 0; i < 6; i++) R(-3.2, -3 * (i + 1) + 0.5, 6.4, 3, i % 2 ? STONE2 : STONE); R(-2.2, -21, 4.4, 3, STONE2); ctx.restore(); break;
      case 'alhambra': R(-9, -7, 18, 7, '#d09a5a'); R(-8, -12, 5, 5, '#c08648'); R(3, -14, 5, 7, '#c08648'); D(0, -7, 3, '#b3623a'); R(-1, -3, 2, 3, '#4a3320'); break;
      case 'pyramids': T(-13, 0, -1, 0, -7, -10, SAND); T(-3, 0, 13, 0, 5, -14, '#e8cf8f'); T(5, 0, 5, -14, 13, 0, '#c9ac66'); break;
      case 'petra': R(-9, -14, 18, 14, '#c27a55'); R(-6, -11, 12, 11, '#d9946a'); for (let i = -2; i <= 2; i++) R(i * 2.4 - 0.6, -9, 1.2, 8, '#f0d0a8'); T(-6.5, -11, 6.5, -11, 0, -14, '#d9946a'); break;
      case 'persepolis': R(-10, -2, 20, 2, STONE2); for (let i = 0; i < 4; i++) { R(-8 + i * 4.6, -13, 1.8, 11); R(-9 + i * 4.6, -14.5, 3.8, 1.8, STONE2); } break;
      case 'taj': D(0, -9, 5, WHITE); R(-6, -9, 12, 9, WHITE); [-9.5, 9.5].forEach((c) => { R(c - 1, -14, 2, 14, WHITE); D(c, -14, 1.3, WHITE); }); R(-1.2, -4, 2.4, 4, '#6b8aa6'); spire(0, -14, 1.4, 4, GOLD); break;
      case 'angkor': [-7, 0, 7].forEach((c, i) => { const h = i === 1 ? 17 : 11; R(c - 2.4, -h, 4.8, h, '#8c8570'); T(c - 2.4, -h, c + 2.4, -h, c, -h - 5, '#a39b84'); }); R(-10, -2.5, 20, 2.5, '#6e6858'); break;
      case 'wall': ctx.beginPath(); ctx.moveTo(-12, -2); ctx.lineTo(-6, -7); ctx.lineTo(0, -4); ctx.lineTo(6, -10); ctx.lineTo(12, -6); ctx.lineWidth = 4.5; ctx.strokeStyle = OL; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = STONE; ctx.stroke(); ctx.strokeStyle = OL; ctx.lineWidth = 1; [[-6, -7], [6, -10]].forEach((q) => R(q[0] - 2, q[1] - 6, 4, 6, STONE2)); break;
      case 'borobudur': for (let i = 0; i < 4; i++) { const w = 22 - i * 5; R(-w / 2, -3.5 * (i + 1), w, 3.5, i % 2 ? '#8c8570' : '#a39b84'); } D(0, -14, 2.5, '#b9b19a'); break;
      case 'ephesus': R(-8, -2, 16, 2, STONE2); for (let i = 0; i < 4; i++) R(-6.5 + i * 4.2, -11, 2, 9); R(-8, -13, 16, 2, STONE); break;
      case 'krak': R(-9, -8, 18, 8, '#b9a47a'); R(-9, -14, 5, 6, '#a89368'); R(4, -14, 5, 6, '#a89368'); R(-2.5, -17, 5, 9, '#c4b085'); [-9, -4, 4, 8.5].forEach((c) => R(c, -16, 1.6, 2, '#a89368')); break;
      case 'ararat': T(-13, 0, 13, 0, 0, -17, '#8d8a85'); T(-4, -9, 4, -9, 0, -17, WHITE); T(2, 0, 13, 0, 8, -8, '#a8a49d'); break;
      case 'kremlin': R(-9, -7, 18, 7, '#b5543a'); [-5, 0, 5].forEach((c, i) => { R(c - 1.5, -12 - i % 2 * 2, 3, 6 + i % 2 * 2, '#c4624a'); T(c - 2, -12 - i % 2 * 2, c + 2, -12 - i % 2 * 2, c, -17 - i % 2 * 2, GREEN); }); break;
      case 'zimbabwe': ctx.fillStyle = '#9b8a6a'; ctx.beginPath(); ctx.ellipse(0, -5, 10, 6, 0, 0, 6.3); ctx.fill(); ctx.stroke(); R(-2.5, -15, 5, 10, '#a99876'); break;
      case 'meenakshi': R(-8, -2, 16, 2, STONE2); for (let i = 0; i < 5; i++) { const w = 14 - i * 2.4; R(-w / 2, -3 * (i + 1) - 0.5, w, 3, ['#d7a64a', '#c96a3a', '#4f8f9a', '#d7a64a', '#c96a3a'][i]); } D(0, -16, 1.6, GOLD); break;
      case 'lalibela': R(-8, -2, 16, 2, '#b58a5a'); T(-7, -2, 7, -2, 0, -12, '#c9946a'); R(-1, -9, 2, 7, '#6e4a2a'); T(-3, -5.5, 3, -5.5, 0, -9, '#6e4a2a'); break;
      default: R(-4, -10, 8, 10);
    }
    ctx.restore();
  }
  const ALIAS = { tower: 'lighthouse', colossus: 'rhodes' };
  A.drawLandmark = function (ctx, t, x, y, s) {
    const im = A.img ? A.img('lm_' + (ALIAS[t] || t)) : null;
    if (im && im.complete && im.naturalWidth) {
      const sc = Math.min((s * 2.1) / im.naturalWidth, (s * 1.9) / im.naturalHeight), dw = im.naturalWidth * sc, dh = im.naturalHeight * sc;
      ctx.save(); ctx.imageSmoothingEnabled = s < 60; ctx.shadowColor = 'rgba(40,25,10,0.45)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1; ctx.drawImage(im, x - dw / 2, y - dh, dw, dh); ctx.restore();
    } else draw(ctx, t, x, y, s);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
