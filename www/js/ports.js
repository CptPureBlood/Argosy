/* Argosy – the 29 ports (c.1500). p = produces (cheap here), d = demands (dear here). lm = landmark drawn beside the port. */
(function (G) {
  const A = (G.A = G.A || {});
  const P = (id, lon, lat, en, tr, p, d, yard, lm) => ({ id, lon, lat, yard: !!yard, n: { en, tr }, p, d, lm });
  A.PORTS = [
    P('lisbon', -9.2, 38.65, 'Lisbon', 'Lizbon', ['oil', 'salt', 'fish'], ['spice', 'silk', 'iron'], 1, 'tower'),
    P('tangier', -5.85, 35.8, 'Tangier', 'Tanca', ['wool', 'fish', 'wheat'], ['cloth', 'glass', 'iron']),
    P('algiers', 3.06, 36.78, 'Algiers', 'Cezayir', ['wool', 'fish', 'oil'], ['cloth', 'timber', 'iron']),
    P('barcelona', 2.17, 41.38, 'Barcelona', 'Barselona', ['wool', 'wine', 'iron'], ['spice', 'glass', 'silk'], 0, 'cathedral'),
    P('genoa', 8.93, 44.41, 'Genoa', 'Cenova', ['cloth', 'marble', 'iron'], ['wheat', 'wine', 'gems'], 1, 'lantern'),
    P('venice', 12.33, 45.44, 'Venice', 'Venedik', ['glass', 'salt', 'cloth'], ['spice', 'silk', 'gems'], 1, 'campanile'),
    P('naples', 14.25, 40.85, 'Naples', 'Napoli', ['wine', 'oil', 'wheat'], ['cloth', 'timber', 'iron'], 0, 'volcano'),
    P('palermo', 13.36, 38.13, 'Palermo', 'Palermo', ['wheat', 'salt', 'fish'], ['glass', 'iron', 'cloth']),
    P('tunis', 10.2, 36.82, 'Tunis', 'Tunus', ['oil', 'wheat', 'wool'], ['cloth', 'glass', 'iron']),
    P('tripoli', 13.18, 32.9, 'Tripoli', 'Trablus', ['wool', 'salt', 'fish'], ['cloth', 'wine', 'iron']),
    P('ragusa', 18.09, 42.65, 'Ragusa', 'Ragusa', ['timber', 'salt', 'fish'], ['cloth', 'glass', 'wine']),
    P('athens', 23.65, 37.94, 'Athens', 'Atina', ['marble', 'oil', 'wine'], ['wheat', 'iron', 'cloth'], 0, 'parthenon'),
    P('constantinople', 28.97, 41.0, 'Constantinople', 'İstanbul', ['silk', 'wheat', 'timber'], ['wine', 'wool', 'glass'], 1, 'hagia'),
    P('trebizond', 39.7, 41.0, 'Trebizond', 'Trabzon', ['silk', 'iron', 'wool'], ['wine', 'cloth', 'glass']),
    P('caffa', 35.38, 45.03, 'Caffa', 'Kefe', ['wheat', 'fish', 'timber'], ['wine', 'cloth', 'spice']),
    P('rhodes', 28.23, 36.44, 'Rhodes', 'Rodos', ['fish', 'wine', 'salt'], ['timber', 'wheat', 'iron'], 0, 'colossus'),
    P('alexandria', 29.92, 31.2, 'Alexandria', 'İskenderiye', ['wheat', 'spice', 'gems'], ['timber', 'wine', 'iron'], 1, 'pharos'),
    P('beirut', 35.5, 33.89, 'Beirut', 'Beyrut', ['silk', 'glass', 'spice'], ['wool', 'iron', 'wheat']),
    P('suez', 32.55, 29.98, 'Suez', 'Süveyş', ['salt', 'spice', 'fish'], ['wheat', 'wine', 'cloth']),
    P('jeddah', 39.15, 21.5, 'Jeddah', 'Cidde', ['spice', 'gems', 'salt'], ['wheat', 'cloth', 'timber'], 0, 'mosque'),
    P('aden', 45.0, 12.8, 'Aden', 'Aden', ['spice', 'gems', 'wool'], ['wheat', 'wine', 'iron']),
    P('hormuz', 56.3, 27.1, 'Hormuz', 'Hürmüz', ['gems', 'silk', 'spice'], ['wheat', 'timber', 'wine'], 0, 'fort'),
    P('calicut', 75.78, 11.25, 'Calicut', 'Kalikat', ['spice', 'timber', 'gems'], ['cloth', 'wine', 'iron'], 1, 'temple'),
    P('colombo', 79.85, 6.93, 'Colombo', 'Kolombo', ['gems', 'spice', 'timber'], ['wine', 'cloth', 'iron']),
    P('malacca', 102.25, 2.2, 'Malacca', 'Malaka', ['spice', 'silk', 'timber'], ['iron', 'wine', 'cloth'], 1, 'fort'),
    P('ayutthaya', 100.5, 13.4, 'Ayutthaya', 'Ayutthaya', ['wheat', 'timber', 'spice'], ['iron', 'cloth', 'wine'], 0, 'prang'),
    P('manila', 120.75, 14.58, 'Manila', 'Manila', ['silk', 'gems', 'fish'], ['iron', 'cloth', 'wine']),
    P('canton', 113.5, 22.3, 'Canton', 'Kanton', ['silk', 'cloth', 'iron'], ['spice', 'wine', 'wool'], 0, 'pagoda'),
    P('mombasa', 39.65, -4.05, 'Mombasa', 'Mombasa', ['gems', 'spice', 'timber'], ['cloth', 'iron', 'wine']),
  ];
  // Landmarks that stand alone on the map (not tied to a port). t = drawing type.
  A.LANDMARKS = [
    { t: 'colosseum', lon: 12.5, lat: 41.9 }, { t: 'pisa', lon: 10.4, lat: 43.72 }, { t: 'alhambra', lon: -3.6, lat: 37.2 },
    { t: 'pyramids', lon: 31.1, lat: 29.9 }, { t: 'petra', lon: 35.4, lat: 30.3 }, { t: 'persepolis', lon: 52.9, lat: 29.9 },
    { t: 'taj', lon: 78.0, lat: 27.2 }, { t: 'angkor', lon: 103.9, lat: 13.4 }, { t: 'wall', lon: 115.5, lat: 40.4 },
    { t: 'borobudur', lon: 110.2, lat: -7.55 }, { t: 'ephesus', lon: 27.35, lat: 37.9 }, { t: 'krak', lon: 36.3, lat: 34.75 },
    { t: 'ararat', lon: 44.3, lat: 39.7 }, { t: 'kremlin', lon: 37.6, lat: 47.0 }, { t: 'zimbabwe', lon: 33.0, lat: -8.5 },
    { t: 'meenakshi', lon: 78.1, lat: 9.9 }, { t: 'pagoda', lon: 108.5, lat: 29.0 }, { t: 'lalibela', lon: 39.0, lat: 12.0 },
  ];
})(typeof globalThis !== 'undefined' ? globalThis : window);
