/* Mare Nostrum – random comic events at sea (10% per sailing day). Each: id, [en, tr] headline, options [[en, tr, effect]], optional req. */
(function (G) {
  const A = (G.A = G.A || {}), R = A.game, C = A.C;
  // effect keys: m morale, g gold, d extra days at sea, s speed (fraction, rest of voyage), h hull damage (fraction), x gamble (+/- x gold), c [prob, effIfYes, effIfNo]
  const E = (id, en, tr, o, req) => ({ id, en, tr, o, req });
  A.SEA_EVENTS = [
    E('helm', 'The helmsman fell ill!', 'Dümenci hastalandı!', [['Make the Messman the helmsman (he curses you behind your back)', 'Kamarot\'u dümenci yap (arkandan söver)', { m: -1 }], ['Make a sailor the helmsman', 'Gemiciyi dümenci yap', { s: -0.05 }]]),
    E('soup', 'The cook put a "secret ingredient" in the soup.', 'Aşçı çorbaya "gizli malzeme" katmış.', [['Eat it anyway', 'Yiyip geçiştir', { m: -1 }], ['Fire the cook and cook it yourself', 'Aşçıyı kov, kendin pişir', { d: 1 }]]),
    E('parrot', 'The parrot is shouting a secret nobody should know.', 'Papağan kimsenin bilmemesi gereken sırrı bağırıyor.', [['Cover the cage', 'Kafesi örtü ile kapat', { m: -1 }], ['Laugh it off, let everybody enjoy it', 'Gülüp geç, herkes eğlensin', { m: 2 }]]),
    E('logbook', 'The logbook blew overboard.', 'Seyir defteri denize uçtu.', [['Redraw the route from memory', 'Rotayı hafızadan çiz', { s: -0.03 }], ['Start a new one: "all went perfectly"', 'Yeni defter aç: "her şey mükemmeldi"', {}]]),
    E('dolphin', 'A dolphin challenges the ship to a race.', 'Bir yunus gemiyi yarışa davet ediyor.', [['Race it!', 'Yarışa gir!', { c: [0.5, { s: 0.05, m: 1 }, { m: -1 }] }], ['Ignore it', 'Görmezden gel', {}]]),
    E('island', 'The crew swears they can see a mysterious island.', 'Mürettebat gizemli bir ada gördüğüne yemin ediyor.', [['Detour and have a look', 'Sapıp bir bak', { d: 1, c: [0.5, { g: 120 }, {}] }], ['Refuse', 'Reddet', { m: -2 }]]),
    E('compass', 'The compass points to where it was born.', 'Pusula doğduğu yeri gösteriyor.', [['Steer by the sun', 'Güneşe göre git', { d: 1 }], ['Shake the compass', 'Pusulayı salla', { c: [0.5, {}, { s: -0.04 }] }]]),
    E('mice', 'Mice are gnawing the hardtack!', 'Fareler peksimeti kemiriyor!', [['Hire a ship\'s cat', 'Gemi kedisi tut', { g: -25 }], ['Hold a mouse-hunting contest', 'Fare avı yarışması yap', { m: 1, g: -15 }]]),
    E('mirror', 'The mirror in the captain\'s cabin has started to be "honest".', 'Kaptan kamarasındaki ayna "dürüst" olmaya başladı.', [['Believe it', 'Duyduklarına inan', { m: -1 }], ['Throw it overboard', 'Aynayı denize at', {}]]),
    E('whale', 'A whale tries to kiss the ship.', 'Bir balina gemiyi öpmeye çalışıyor.', [['Slip away slowly', 'Yavaşça sıyrıl', { s: -0.03 }], ['Sketch it for the logbook', 'Deftere çiz', { m: 2 }]]),
    E('ufo', 'A strange light in the sky! The crew says "UFO".', 'Gökyüzünde garip ışık! Mürettebat "UFO" diyor.', [['Admire the stars', 'Yıldızlara hayran kal', { m: 1 }], ['Say "it\'s just a lighthouse"', '"Sadece bir fener" de', {}]]),
    E('tomato', 'A sailor planted tomatoes on the deck.', 'Bir gemici güverteye domates ekmiş.', [['Harvest and eat them', 'Hasat et, yiyin', { m: 1, g: 15 }], ['Uproot them', 'Sök at', { m: -1 }]]),
    E('sing', 'The Messman started singing. Terribly.', 'Kamarot şarkı söylemeye başladı. Çok kötü.', [['Listen politely', 'Nezaketle dinle', { m: -2 }], ['Ban singing', 'Şarkı yasağı koy', { m: 1 }]]),
    E('vacation', 'A pirate ship declares itself "on vacation".', 'Bir korsan gemisi kendini "tatilde" ilan etti.', [['Wave and sail on', 'Selam ver, yoluna devam et', {}], ['Offer them some trade', 'Ticaret öner', { g: 60 }]]),
    E('catcap', 'The ship\'s cat took the helm and changed course.', 'Gemi kedisi dümene geçip rotayı değiştirdi.', [['Congratulate the cat, fix the course', 'Kediyi tebrik et, rotayı düzelt', { d: 1 }], ['Make the cat captain', 'Kediyi kaptan yap', { m: 3 }]]),
    E('pancake', 'The Messman forgot to make breakfast pancakes!', 'Kamarot sabah krep yapmayı unuttu!', [['20 lashes for the Messman', 'Kamarota 20 kırbaç', { m: -2 }], ['At least make dinner legendary', 'En azından akşam yemeği efsanevi olsun', { g: -50, m: 2 }]]),
    E('brawl', 'The head cook fought with the Messman!', 'Aşçıbaşı Kamarot ile kavga etti!', [['Side with the cook', 'Aşçının tarafını tut', { m: 2 }], ['Side with the Messman', 'Kamarotun tarafını tut', { m: -2 }]]),
    E('love', 'The Messman announced a secret love affair with the fitter!', 'Kamarot fitter ile gizli aşk yaşadığını ilan etti!', [['Everybody mind their own business', 'Herkes kendi işine baksın', { m: -2 }], ['Give them a day off for the honeymoon', 'Balayı için 1 gün tatil ver', { d: 1 }]], 'fitter'),
    E('ghost', 'The Messman saw a "ghost" at midnight. It was laundry.', 'Kamarot gece yarısı "hayalet" gördü. Çamaşırdı.', [['Tell him to go back to sleep', 'Uyumaya git de', { m: -1 }], ['Hoist the laundry as a ghost flag', 'Çamaşırı hayalet bayrağı yap', { m: 2 }]]),
    E('rum', 'The rum barrel is "evaporating" on its own.', 'Rom fıçısı kendiliğinden "buharlaşıyor".', [['Post a guard', 'Nöbetçi dik', { m: -1 }], ['Look the other way', 'Görmezden gel', { g: -20 }]]),
    E('swim', 'A sailor confesses he cannot swim.', 'Bir gemici yüzme bilmediğini itiraf etti.', [['Give him a lifebuoy and lessons', 'Can simidi ver, ders ver', { d: 1 }], ['Laugh it off', 'Gülüp geç', { m: -1 }]]),
    E('asleep', 'The lookout fell asleep and we drifted off course.', 'Gözcü uyuyakaldı, rotadan sapıldı.', [['Punish him', 'Cezalandır', { m: -2 }], ['Forgive him', 'Affet', { d: 1 }]]),
    E('sardine', 'The Messman invented a new recipe: sardine pancakes.', 'Kamarot yeni tarif icat etti: sardalyalı krep.', [['Eat it', 'Ye', { m: -1 }], ['Eat it bravely', 'Cesurca ye', { m: 1, c: [0.2, { s: -0.03 }, {}] }]]),
    E('duck', 'A duck on deck wants to be captain.', 'Güvertedeki bir ördek kaptan olmak istiyor.', [['Chase it off', 'Kov onu', { m: -1 }], ['Name it "First Mate Duck"', '"Birinci Zabit Ördek" ilan et', { m: 2 }]]),
    E('poem', 'A sailor read a poem by moonlight. Everyone is crying.', 'Bir gemici ay ışığında şiir okudu. Herkes ağlıyor.', [['Share the moment', 'Anı paylaş', { m: 2 }], ['"Watch the helm!"', '"Dümene bak!"', { m: -1 }]]),
    E('drift', 'The helm keeps pulling to the left, nobody knows why.', 'Dümen sola çekiyor, kimse nedenini bilmiyor.', [['Tighten the rudder yourself', 'Dümeni kendin sık', { c: [0.5, { s: 0.05 }, { s: -0.03 }] }], ['Kick it to the right', 'Sağa doğru tekme at', { s: -0.03 }]]),
    E('sunday', 'The crew demands a Sunday holiday (it is Tuesday).', 'Mürettebat Pazar tatili istiyor (bugün Salı).', [['Allow it', 'İzin ver', { d: 1, m: 2 }], ['Refuse', 'Reddet', { m: -2 }]]),
    E('horoscope', 'The Messman\'s horoscope says "lucky day today".', 'Kamarotun falı "bugün şanslı gün" diyor.', [['Believe it', 'İnan', { s: 0.05 }], ['Don\'t', 'İnanma', {}]]),
    E('turtle', 'A sea turtle follows the ship and won\'t overtake.', 'Bir deniz kaplumbağası gemiyi takip ediyor, geçmiyor.', [['Speed up', 'Hızlan', { s: 0.03, m: -1 }], ['Wait and sail together', 'Bekle, birlikte yüzün', { d: 1, m: 1 }]]),
    E('door', 'The cabin door is stuck, with the coffee inside.', 'Kamara kapısı sıkıştı, kahve içeride.', [['Break the door', 'Kapıyı kır', { g: -10 }], ['Wait it out', 'Bekle', { d: 1 }]]),
    E('bell', 'The ship\'s bell is ringing by itself.', 'Gemi çanı kendi kendine çalıyor.', [['Silence it', 'Sustur', { m: -1 }], ['Announce "dinner is ready"', '"Yemek hazır" diye ilan et', { m: 1 }]]),
    E('typo', 'Someone painted "Mare Nostrom" on the sail.', 'Biri yelkene "Mare Nostrom" yazmış.', [['Fix it', 'Düzelt', { d: 1 }], ['"It\'s a new brand"', '"Yeni marka bu"', { m: 1 }]]),
    E('dice', 'A secret dice table was found on deck.', 'Güvertede gizli bir zar masası bulundu.', [['Play!', 'Oyna!', { x: 60 }], ['Shut it down', 'Kapat', { m: -1 }]]),
    E('sunburn', 'A sailor is sunburnt as red as a flag.', 'Bir gemici bayrak gibi kızarmış.', [['Treat him with vinegar', 'Sirke ile tedavi et', { d: 1 }], ['Use him as a signal flag', 'Sinyal bayrağı olarak kullan', { m: 1 }]]),
    E('monkey', 'A monkey stole the spyglass and ran up the mast.', 'Maymun dürbünü çalıp direğe tırmandı.', [['Chase it', 'Kovala', { d: 1 }], ['Buy a new one', 'Yenisini al', { g: -15 }]]),
    E('cloud', 'A storm cloud wants to come aboard.', 'Bir fırtına bulutu gemiye binmek istiyor.', [['Change course', 'Rotayı değiştir', { d: 1 }], ['Sail straight through', 'Doğrudan geç', { s: -0.05, h: 0.04 }]]),
    E('shoe', 'The Messman served a gourmet dish: boiled shoe.', 'Kamarot gurme yemek yaptı: haşlanmış ayakkabı.', [['Eat it', 'Ye', { m: -2 }], ['Give him an award', 'Ödül ver', { m: 2, g: -10 }]]),
    E('ratpirate', 'The crew found a rat claiming to be a peg-leg pirate.', 'Mürettebat tahta bacaklı korsan olduğunu iddia eden bir fare buldu.', [['Feed it', 'Besle', { m: 1 }], ['Throw it overboard', 'Denize at', { m: -1 }]]),
  ];
  const BY = {}; A.SEA_EVENTS.forEach((e) => { BY[e.id] = e; }); A.SEA_BY_ID = BY;

  R.seaPick = function () {
    const S = R.S(); S.seaSeen = S.seaSeen || [];
    let pool = A.SEA_EVENTS.filter((e) => (!e.req || (e.req === 'fitter' && S.fitter)) && S.seaSeen.indexOf(e.id) < 0);
    if (!pool.length) { S.seaSeen = []; pool = A.SEA_EVENTS.filter((e) => !e.req || (e.req === 'fitter' && S.fitter)); }
    const e = pool[Math.floor(Math.random() * pool.length)]; S.seaSeen.push(e.id); if (S.seaSeen.length > 25) S.seaSeen.shift(); return e.id;
  };
  // apply effect, returns flat list of applied atomic effects
  R.seaApply = function (id, idx) {
    const S = R.S(), v = S.voyage, e = BY[id], eff = e && e.o[idx] ? e.o[idx][2] : {}; const done = [];
    const go = (f) => {
      if (f.c) { go(Math.random() < f.c[0] ? f.c[1] : f.c[2]); }
      if (f.x) { const win = Math.random() < 0.5, amt = Math.min(f.x, S.gold); S.gold += win ? f.x : -amt; done.push({ g: win ? f.x : -amt }); }
      if (f.m) { S.morale = Math.max(0, Math.min(100, S.morale + f.m)); done.push({ m: f.m }); }
      if (f.g) { S.gold = Math.max(0, S.gold + f.g); done.push({ g: f.g }); }
      if (f.d && v) { for (let i = 0; i < f.d; i++) { v.days++; R.advanceDay(); } done.push({ d: f.d }); }
      if (f.s && v) { v.spd = (v.spd || 1) * (1 + f.s); done.push({ s: f.s }); }
      if (f.h && S.ships.length) { const sh = S.ships[Math.floor(Math.random() * S.ships.length)]; sh.hull = Math.max(1, sh.hull - R.maxHull(sh) * f.h); done.push({ h: f.h }); }
    };
    go(eff); R.save(); return done;
  };
  R.seaSummary = function (done, lang) {
    const tr = lang === 'tr', t = { m: 0, g: 0, d: 0, s: 0, h: 0 }; done.forEach((o) => Object.keys(o).forEach((k) => { t[k] += o[k]; }));
    const sg = (n) => (n > 0 ? '+' : '−') + Math.abs(n), out = [];
    if (t.m) out.push((tr ? 'Moral ' : 'Morale ') + sg(t.m)); if (t.g) out.push((tr ? 'Altın ' : 'Gold ') + sg(t.g)); if (t.d) out.push((tr ? 'Gün ' : 'Days ') + sg(t.d));
    if (t.s) out.push((tr ? 'Hız ' : 'Speed ') + (t.s > 0 ? '+' : '−') + Math.abs(Math.round(t.s * 100)) + '%'); if (t.h) out.push((tr ? 'Gövde hasarı' : 'Hull damage'));
    return out.join(' · ') || (tr ? 'Hiçbir şey olmadı' : 'Nothing happened');
  };
  R.seaHint = function (eff, lang) { // static preview for buttons: only certain parts
    const f = eff || {}, tr = lang === 'tr', out = [];
    if (f.m) out.push((tr ? 'Moral ' : 'Morale ') + (f.m > 0 ? '+' : '−') + Math.abs(f.m)); if (f.g) out.push((tr ? 'Altın ' : 'Gold ') + (f.g > 0 ? '+' : '−') + Math.abs(f.g));
    if (f.d) out.push('+' + f.d + (tr ? ' gün' : ' day')); if (f.s) out.push((tr ? 'Hız ' : 'Speed ') + (f.s > 0 ? '+' : '−') + Math.abs(Math.round(f.s * 100)) + '%');
    if (f.c || f.x) out.push('?'); return out.join(' · ');
  };
})(typeof window !== 'undefined' ? window : global);
