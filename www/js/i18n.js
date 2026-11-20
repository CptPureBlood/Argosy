/* Argosy – English / Turkish strings. Default language is English. */
(function (G) {
  const A = G.A;
  A.lang = 'en';
  A.I18N = {
    en: {
      'nav.mayor': 'Mayor', 'mayor.hello': 'Commissions and loans are available here.', 'mayor.back': 'Welcome back, captain. Any news from the sea?', 'mayor.visit': 'Visit the mayor', 'mayor.ok': 'Later', 'mayor.news': 'News of the port', 'mayor.noNews': 'Nothing unusual in the markets.', 'mayor.days': '{n} days left', 'mayor.atSea': 'You are at sea. The mayors wait in port.', 'loan.title': 'Loans', 'loan.info': 'Available: {lim} gold · interest {r}% per day · 30 days', 'loan.max': 'Maximum', 'loan.yours': 'Your loans', 'loan.line': '{p}: owe {b} gold', 'loan.due': 'Due in {d} days · {r}% per day', 'loan.late': 'Overdue! Interest doubles and reputation suffers.', 'loan.repay': 'Repay {n}', 'loan.repayAll': 'Repay all', 'tab.tavern': 'Tavern', 'tavern.intro': 'Captains hired: {a}/{b} (one per ship). Their talents help the whole fleet.', 'tavern.title': 'Captains for hire', 'tavern.none': 'No captains here today. Come back in a few days.', 'tavern.yours': 'Your captains', 'tavern.crew': 'The crew', 'tavern.treat': 'Buy the crew a round ({c})', 'tavern.treated': 'The crew sings! Morale rises.', 'tavern.cost': 'Fee {f} · wage {w}/day', 'tavern.wage': 'Wage {w}/day', 'tavern.hire': 'Hire', 'tavern.dismiss': 'Dismiss', 'tavern.hired': '{n} joins your fleet.', 'fleet.captains': 'Captains', 'fleet.noCaptains': 'No captains yet. Find them in a tavern.', 'rar.c': 'Common', 'rar.r': 'Rare', 'rar.l': 'Legendary',
      'sea.med': 'Mare Nostrum', 'sea.adriatic': 'Adriatic', 'sea.aegean': 'Aegean', 'sea.tyrrhenian': 'Tyrrhenian', 'sea.black': 'Black Sea', 'sea.atlantic': 'Atlantic Ocean', 'sea.red': 'Red Sea', 'sea.persian': 'Persian Gulf', 'sea.caspian': 'Caspian Sea', 'sea.arabian': 'Arabian Sea', 'sea.bengal': 'Bay of Bengal', 'sea.indian': 'Indian Ocean', 'sea.scs': 'South China Sea', 'sea.andaman': 'Andaman Sea',
      'wind.force': 'Force {n}', 'top.atSea': 'At sea', 'top.day': 'Day {n}', 'top.wind': 'Wind',
      'nav.port': 'Port', 'nav.map': 'Map', 'nav.fleet': 'Fleet', 'nav.quests': 'Quests', 'nav.menu': 'Menu',
      'err.atSea': 'You are at sea.', 'err.gold': 'Not enough gold.', 'err.generic': 'Cannot do that now.',
      'yard.badge': 'Shipyard', 'port.pirates': 'Pirates nearby', 'port.produces': 'Makes', 'port.needs': 'Wants', 'rep.label': 'Reputation',
      'rep.0': 'Unknown', 'rep.1': 'Known', 'rep.2': 'Trusted', 'rep.3': 'Respected', 'rep.4': 'Honored', 'rep.5': 'Legendary',
      'tab.market': 'Market', 'tab.yard': 'Shipyard', 'port.rested': 'A day passes. The crew rests.', 'port.rest': 'Rest', 'port.depart': 'Set sail',
      'mkt.good': 'Goods', 'mkt.have': 'Hold', 'mkt.price': 'Price', 'mkt.diff': 'vs avg', 'mkt.pick': 'Tap a good to trade.', 'mkt.buy': 'Buy', 'mkt.sell': 'Sell', 'mkt.stock': 'Stock', 'mkt.max': 'Max',
      'mkt.partial': 'Only {n} could be bought.', 'mkt.buyN': 'Buy {n} · {c}', 'mkt.sellN': 'Sell {n} · {c}',
      'yard.ships': 'Ships for sale', 'yard.fleet': 'Your fleet', 'yard.bought': '{n} joins your fleet.', 'yard.repair': 'Repair', 'yard.crew': '+5 crew', 'yard.cannon': '+1 cannon', 'yard.sell': 'Sell',
      'sea.sailing': 'Sailing to {p}', 'sea.day': 'Day {n} at sea', 'sea.left': '{n} nm to go', 'sea.speed': '{n} knots', 'sea.resume': 'Resume', 'sea.pause': 'Pause',
      'sheet.here': 'You are in this port.', 'sheet.hint': 'Tap a port to plan a voyage. Pinch or drag to move the map.', 'legend.yard': 'Shipyard', 'legend.skull': 'Pirate waters',
      'sheet.tail': 'Tailwind', 'sheet.head': 'Headwind', 'sheet.crosswind': 'Crosswind', 'risk.low': 'Low risk', 'risk.mid': 'Risky', 'risk.high': 'Dangerous',
      'ins.label': 'Insurance {c}', 'esc.label': 'Escort', 'esc.none': 'None', 'sheet.days': '{n} days', 'sheet.nm': '{n} nm', 'sheet.sail': 'Set sail',
      'ev.storm': 'Storm! {s} is damaged and cargo washed overboard.', 'ev.refund': 'Insurance paid {n}.', 'ev.calm': 'Becalmed. Progress is slow.', 'ev.broke': 'No gold for wages. Morale falls.', 'ev.questExpired': 'A contract expired.',
      'arr.msg': 'Arrived at {p} after {d} days.', 'arr.morale': 'Morale {n}.',
      'enc.title': 'Sails on the horizon!', 'enc.text': '{n} pirate ship(s) are closing in.', 'enc.threat': 'Threat', 'threat.weak': 'Weak', 'threat.even': 'Even match', 'threat.strong': 'Strong', 'threat.deadly': 'Overwhelming',
      'enc.escort': 'Your {n} sails beside you.', 'enc.fight': 'Fight', 'enc.flee': 'Flee ({p}%)',
      'res.win': 'Victory!', 'res.fled': 'You got away', 'res.lose': 'Defeat', 'res.gold': 'Loot: {n} gold', 'res.goods': 'Cargo taken:', 'res.lost': 'Lost cargo:', 'res.refund': 'Insurance paid {n} gold.', 'res.sunk': 'Ships lost: {n}',
      'res.rescued': 'Fishermen rescue you. You keep a battered boat and half your gold.', 'res.hull': 'hull {n}%', 'res.kept': 'Added to your fleet.', 'res.soldPrize': 'Sold.', 'res.keep': 'Keep', 'res.sellPrize': 'Sell {n}', 'res.continue': 'Continue',
      'fleet.exp': 'crew exp {n}', 'fleet.empty': 'The hold is empty.', 'fleet.cap': 'Cargo', 'fleet.speed': 'Fleet speed (kn)', 'fleet.morale': 'Morale', 'fleet.moraleHelp': 'Medium voyages (3–10 days) lift morale. Very short or very long ones drain it. Victory and defeat matter most.',
      'fleet.ships': 'Ships', 'fleet.cargo': 'Cargo', 'fleet.rep': 'Reputation', 'fleet.noRep': 'Trade in ports to build your name.',
      'morale.0': 'Excellent', 'morale.1': 'Good', 'morale.2': 'Steady', 'morale.3': 'Low', 'morale.4': 'Mutinous',
      'q.title': 'Deliver {q} {g}', 'q.to': 'To {p} · {d} days left', 'q.done': 'Contract complete: +{n} gold.', 'q.deliver': 'Deliver', 'q.accept': 'Accept', 'q.active': 'Active contracts', 'q.none': 'No active contracts.', 'q.offers': 'Offers in {p}', 'q.noOffers': 'No offers right now.',
      'menu.language': 'Language', 'menu.sound': 'Sound', 'menu.on': 'On', 'menu.off': 'Off', 'menu.stats': 'Captain’s log', 'stats.day': 'Day {n}', 'stats.trades': 'Trades: {n}', 'stats.profit': 'Trading profit: {n}', 'stats.wins': 'Sea battles won: {n}', 'stats.losses': 'Defeats: {n}',
      'menu.game': 'Game', 'menu.newTitle': 'Start over?', 'menu.newText': 'Your current voyage will be erased.', 'menu.cancel': 'Cancel', 'menu.newYes': 'Start new game', 'menu.new': 'New game', 'menu.about': 'Argosy – an original Mediterranean trading game. Progress is saved automatically.',
      'splash.tag': 'Trade. Sail. Survive the Mediterranean.', 'splash.continue': 'Continue', 'splash.new': 'New game',
      'combat.vs': 'Pirates: {n} ship(s)', 'combat.board': 'Board ({p}%)', 'combat.flee': 'Flee ({p}%)', 'combat.boarded': 'Prize taken!', 'combat.repelled': 'Boarding repelled!', 'combat.lostCrew': 'Repelled! −{n} crew', 'combat.escaped': 'Escaped!', 'combat.escapeFailed': 'Cannot escape!', 'combat.cannonLost': 'Cannon lost', 'combat.sunk': 'Sunk!', 'combat.sunkLog': '{n} goes down!',
    },
    tr: {
      'nav.mayor': 'Mayor', 'mayor.hello': 'Görevler ve krediler burada.', 'mayor.back': 'Tekrar hoş geldin kaptan. Denizden haber var mı?', 'mayor.visit': 'Mayoru ziyaret et', 'mayor.ok': 'Sonra', 'mayor.news': 'Liman haberleri', 'mayor.noNews': 'Pazarlarda olağan dışı bir şey yok.', 'mayor.days': '{n} gün kaldı', 'mayor.atSea': 'Denizdesin. Mayorlar limanlarda bekler.', 'loan.title': 'Krediler', 'loan.info': 'Kullanılabilir: {lim} altın · günlük faiz %{r} · 30 gün', 'loan.max': 'Maksimum', 'loan.yours': 'Kredilerin', 'loan.line': '{p}: {b} altın borç', 'loan.due': '{d} gün kaldı · günlük %{r}', 'loan.late': 'Gecikti! Faiz iki katına çıktı, itibarın düşüyor.', 'loan.repay': '{n} öde', 'loan.repayAll': 'Hepsini öde', 'tab.tavern': 'Meyhane', 'tavern.intro': 'İşe alınan kaptan: {a}/{b} (gemi başına bir). Yetenekleri tüm filoya yarar.', 'tavern.title': 'Kiralık kaptanlar', 'tavern.none': 'Bugün burada kaptan yok. Birkaç gün sonra gel.', 'tavern.yours': 'Kaptanların', 'tavern.crew': 'Mürettebat', 'tavern.treat': 'Tayfaya bir tur ısmarla ({c})', 'tavern.treated': 'Tayfa şarkı söylüyor! Moral yükseldi.', 'tavern.cost': 'Ücret {f} · günlük {w}', 'tavern.wage': 'Günlük {w}', 'tavern.hire': 'Tut', 'tavern.dismiss': 'Gönder', 'tavern.hired': '{n} filona katıldı.', 'fleet.captains': 'Kaptanlar', 'fleet.noCaptains': 'Henüz kaptan yok. Meyhanelerde bul.', 'rar.c': 'Yaygın', 'rar.r': 'Nadir', 'rar.l': 'Efsanevi',
      'sea.med': 'Mare Nostrum', 'sea.adriatic': 'Adriyatik', 'sea.aegean': 'Ege', 'sea.tyrrhenian': 'Tiren', 'sea.black': 'Karadeniz', 'sea.atlantic': 'Atlas Okyanusu', 'sea.red': 'Kızıldeniz', 'sea.persian': 'Basra Körfezi', 'sea.caspian': 'Hazar Denizi', 'sea.arabian': 'Umman Denizi', 'sea.bengal': 'Bengal Körfezi', 'sea.indian': 'Hint Okyanusu', 'sea.scs': 'Güney Çin Denizi', 'sea.andaman': 'Andaman Denizi',
      'wind.force': 'Kuvvet {n}', 'top.atSea': 'Denizde', 'top.day': 'Gün {n}', 'top.wind': 'Rüzgar',
      'nav.port': 'Liman', 'nav.map': 'Harita', 'nav.fleet': 'Filo', 'nav.quests': 'Görev', 'nav.menu': 'Menü',
      'err.atSea': 'Denizdesin.', 'err.gold': 'Yeterli altın yok.', 'err.generic': 'Şu an yapılamaz.',
      'yard.badge': 'Tersane', 'port.pirates': 'Yakında korsan', 'port.produces': 'Üretir', 'port.needs': 'İster', 'rep.label': 'İtibar',
      'rep.0': 'Bilinmiyor', 'rep.1': 'Tanınıyor', 'rep.2': 'Güvenilir', 'rep.3': 'Saygın', 'rep.4': 'Onurlu', 'rep.5': 'Efsane',
      'tab.market': 'Pazar', 'tab.yard': 'Tersane', 'port.rested': 'Bir gün geçti. Mürettebat dinlendi.', 'port.rest': 'Dinlen', 'port.depart': 'Yola çık',
      'mkt.good': 'Mal', 'mkt.have': 'Ambar', 'mkt.price': 'Fiyat', 'mkt.diff': 'Ort. fark', 'mkt.pick': 'Ticaret için bir mala dokun.', 'mkt.buy': 'Al', 'mkt.sell': 'Sat', 'mkt.stock': 'Stok', 'mkt.max': 'Maks',
      'mkt.partial': 'Sadece {n} adet alınabildi.', 'mkt.buyN': 'Al {n} · {c}', 'mkt.sellN': 'Sat {n} · {c}',
      'yard.ships': 'Satılık gemiler', 'yard.fleet': 'Filon', 'yard.bought': '{n} filona katıldı.', 'yard.repair': 'Onar', 'yard.crew': '+5 mürettebat', 'yard.cannon': '+1 top', 'yard.sell': 'Sat',
      'sea.sailing': '{p} limanına seyir', 'sea.day': 'Denizde {n}. gün', 'sea.left': 'Kalan {n} mil', 'sea.speed': '{n} knot', 'sea.resume': 'Devam', 'sea.pause': 'Durdur',
      'sheet.here': 'Bu limandasın.', 'sheet.hint': 'Yolculuk planlamak için bir limana dokun. Haritayı sürükle veya yakınlaştır.', 'legend.yard': 'Tersane', 'legend.skull': 'Korsan suları',
      'sheet.tail': 'Arkadan rüzgar', 'sheet.head': 'Karşıdan rüzgar', 'sheet.crosswind': 'Yan rüzgar', 'risk.low': 'Düşük risk', 'risk.mid': 'Riskli', 'risk.high': 'Tehlikeli',
      'ins.label': 'Sigorta {c}', 'esc.label': 'Eskort', 'esc.none': 'Yok', 'sheet.days': '{n} gün', 'sheet.nm': '{n} mil', 'sheet.sail': 'Yola çık',
      'ev.storm': 'Fırtına! {s} hasar gördü, yük denize gitti.', 'ev.refund': 'Sigorta {n} ödedi.', 'ev.calm': 'Rüzgar kesildi. İlerleme yavaş.', 'ev.broke': 'Maaşlar için altın yok. Moral düşüyor.', 'ev.questExpired': 'Bir sözleşmenin süresi doldu.',
      'arr.msg': '{d} günde {p} limanına varıldı.', 'arr.morale': 'Moral {n}.',
      'enc.title': 'Ufukta yelkenler!', 'enc.text': '{n} korsan gemisi yaklaşıyor.', 'enc.threat': 'Tehdit', 'threat.weak': 'Zayıf', 'threat.even': 'Dengeli', 'threat.strong': 'Güçlü', 'threat.deadly': 'Ezici',
      'enc.escort': '{n} yanında seyrediyor.', 'enc.fight': 'Savaş', 'enc.flee': 'Kaç (%{p})',
      'res.win': 'Zafer!', 'res.fled': 'Kaçmayı başardın', 'res.lose': 'Yenilgi', 'res.gold': 'Ganimet: {n} altın', 'res.goods': 'Alınan yük:', 'res.lost': 'Kaybedilen yük:', 'res.refund': 'Sigorta {n} altın ödedi.', 'res.sunk': 'Batan gemiler: {n}',
      'res.rescued': 'Balıkçılar seni kurtardı. Hasarlı bir tekne ve altınının yarısı sende kaldı.', 'res.hull': 'gövde %{n}', 'res.kept': 'Filona eklendi.', 'res.soldPrize': 'Satıldı.', 'res.keep': 'Al', 'res.sellPrize': 'Sat {n}', 'res.continue': 'Devam',
      'fleet.exp': 'mürettebat tecrübesi {n}', 'fleet.empty': 'Ambar boş.', 'fleet.cap': 'Yük', 'fleet.speed': 'Filo hızı (knot)', 'fleet.morale': 'Moral', 'fleet.moraleHelp': 'Orta uzunluktaki seferler (3–10 gün) morali yükseltir. Çok kısa veya çok uzun seferler düşürür. En büyük etki savaş sonucundan gelir.',
      'fleet.ships': 'Gemiler', 'fleet.cargo': 'Yük', 'fleet.rep': 'İtibar', 'fleet.noRep': 'İsim yapmak için limanlarda ticaret yap.',
      'morale.0': 'Mükemmel', 'morale.1': 'İyi', 'morale.2': 'Sabit', 'morale.3': 'Düşük', 'morale.4': 'İsyan eşiğinde',
      'q.title': '{q} {g} teslim et', 'q.to': '{p} limanına · {d} gün kaldı', 'q.done': 'Sözleşme tamam: +{n} altın.', 'q.deliver': 'Teslim et', 'q.accept': 'Kabul', 'q.active': 'Aktif sözleşmeler', 'q.none': 'Aktif sözleşme yok.', 'q.offers': '{p} teklifleri', 'q.noOffers': 'Şu an teklif yok.',
      'menu.language': 'Dil', 'menu.sound': 'Ses', 'menu.on': 'Açık', 'menu.off': 'Kapalı', 'menu.stats': 'Seyir defteri', 'stats.day': 'Gün {n}', 'stats.trades': 'İşlem: {n}', 'stats.profit': 'Ticaret kârı: {n}', 'stats.wins': 'Kazanılan deniz savaşı: {n}', 'stats.losses': 'Yenilgi: {n}',
      'menu.game': 'Oyun', 'menu.newTitle': 'Baştan başlansın mı?', 'menu.newText': 'Mevcut seferin silinecek.', 'menu.cancel': 'Vazgeç', 'menu.newYes': 'Yeni oyun başlat', 'menu.new': 'Yeni oyun', 'menu.about': 'Argosy – özgün bir Akdeniz ticaret oyunu. İlerleme otomatik kaydedilir.',
      'splash.tag': 'Ticaret yap. Yelken aç. Akdeniz\'de hayatta kal.', 'splash.continue': 'Devam et', 'splash.new': 'Yeni oyun',
      'combat.vs': 'Korsanlar: {n} gemi', 'combat.board': 'Çıkarma (%{p})', 'combat.flee': 'Kaç (%{p})', 'combat.boarded': 'Gemi ele geçirildi!', 'combat.repelled': 'Çıkarma püskürtüldü!', 'combat.lostCrew': 'Püskürtüldük! −{n} mürettebat', 'combat.escaped': 'Kaçtık!', 'combat.escapeFailed': 'Kaçamadık!', 'combat.cannonLost': 'Top kayıp', 'combat.sunk': 'Battı!', 'combat.sunkLog': '{n} batıyor!',
    },
  };
  A.t = function (k, v) {
    let s = (A.I18N[A.lang] || {})[k]; if (s == null) s = A.I18N.en[k]; if (s == null) return k;
    if (v) s = s.replace(/\{(\w+)\}/g, (m, n) => (v[n] != null ? v[n] : m));
    return s;
  };
  A.setLang = function (l) {
    A.lang = l === 'tr' ? 'tr' : 'en';
    try { A.storage.set(A.C.LANG_KEY, A.lang); } catch (e) {}
    if (typeof document !== 'undefined') document.documentElement.lang = A.lang;
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
