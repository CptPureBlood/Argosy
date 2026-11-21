/* Mare Nostrum – political map c.1500 (approximate borders and realm names, shown at close zoom). */
(function (G) {
  const A = (G.A = G.A || {});
  const L = (en, tr, lon, lat, big) => ({ n: { en, tr }, lon, lat, big: !!big });
  A.COUNTRIES = [
    L('Portugal', 'Portekiz', -8.1, 39.9), L('Castile', 'Kastilya', -4.5, 40.2), L('Aragon', 'Aragon', -0.4, 41.7), L('France', 'Fransa', 2.5, 46.6),
    L('Milan', 'Milano', 9.4, 45.4), L('Papal States', 'Papalık Devleti', 12.6, 43.3), L('Naples', 'Napoli Krallığı', 15.8, 41.3), L('Holy Roman Empire', 'Kutsal Roma', 12.5, 47.2),
    L('Hungary', 'Macaristan', 20.5, 46.5), L('Ottoman Empire', 'Osmanlı İmparatorluğu', 32.5, 39.2, true), L('Ottoman Rumelia', 'Rumeli', 23.0, 42.7), L('Crimean Khanate', 'Kırım Hanlığı', 34.0, 46.2),
    L('Poland-Lithuania', 'Polonya-Litvanya', 28.5, 47.1), L('Georgia', 'Gürcistan', 43.3, 42.0), L('Mamluk Sultanate', 'Memlük Sultanlığı', 30.5, 27.0, true), L('Syria', 'Suriye', 37.8, 34.6),
    L('Safavid Persia', 'Safevi İranı', 53.0, 33.0, true), L('Morocco', 'Fas', -6.0, 31.5), L('Zayyanid Realm', 'Zeyyaniler', 1.5, 33.5), L('Hafsid Tunis', 'Hafsiler', 9.5, 33.5),
    L('Ethiopia', 'Habeşistan', 38.5, 9.0), L('Yemen', 'Yemen', 46.0, 16.2), L('Hejaz', 'Hicaz', 40.8, 25.0), L('Oman', 'Umman', 56.5, 20.5),
    L('Uzbeks', 'Özbekler', 63.0, 40.5), L('Delhi Sultanate', 'Delhi Sultanlığı', 77.5, 27.5, true), L('Gujarat', 'Gucerat', 71.5, 22.8), L('Bahmani', 'Bahmeni', 77.2, 17.5),
    L('Vijayanagara', 'Vijayanagara', 77.2, 13.5), L('Bengal', 'Bengal', 89.0, 24.2), L('Pegu', 'Pegu', 96.2, 19.5), L('Ayutthaya', 'Ayutthaya', 101.2, 16.5),
    L('Dai Viet', 'Đại Việt', 106.0, 19.7), L('Khmer', 'Kmer', 104.6, 12.9), L('Ming China', 'Ming Çini', 110.5, 33.0, true), L('Malacca Sultanate', 'Malaka Sultanlığı', 102.2, 3.7),
    L('Demak', 'Demak', 110.8, -7.3), L('Brunei', 'Brunei', 115.2, 4.5), L('Luzon', 'Luzon', 121.1, 16.8), L('Swahili Coast', 'Swahili Kıyısı', 38.5, -3.2),
    L('Kilwa', 'Kilwa', 37.8, -8.2), L('Songhai', 'Songhay', -1.0, 16.0), L('Kongo', 'Kongo', 14.5, -5.5),
  ];
  const B = (...pts) => pts.map((p) => [p[0], p[1]]);
  A.BORDERS = [
    B([-6.8, 42.1], [-6.9, 41.3], [-7.1, 40.0], [-7.0, 39.1], [-7.4, 38.3], [-7.5, 37.2]),
    B([-1.8, 43.35], [0.7, 42.8], [3.0, 42.45]), B([7.5, 43.8], [7.0, 45.0], [6.0, 46.2], [7.0, 47.5]), B([-1.9, 43.4], [-0.3, 44.8], [1.5, 46.0]),
    B([10.3, 44.1], [11.5, 44.3], [12.3, 44.1]), B([13.1, 41.25], [13.5, 41.9], [14.0, 42.5], [14.5, 42.5]),
    B([10.5, 46.0], [12.5, 46.8], [13.7, 46.4]), B([8.5, 45.9], [10.0, 45.6], [10.6, 44.8]),
    B([18.6, 45.2], [20.5, 44.8], [22.5, 44.6], [24.5, 44.2], [27.0, 44.0]), B([14.5, 45.5], [16.5, 45.0], [18.5, 45.2]), B([18.5, 42.5], [19.0, 43.2], [20.5, 43.5], [22.0, 43.8]),
    B([27.0, 44.0], [28.5, 45.3], [29.7, 45.2]), B([35.8, 36.7], [37.0, 37.0], [38.5, 37.2], [40.5, 37.6], [42.3, 37.3]), B([43.5, 41.2], [43.8, 39.5], [43.5, 38.0], [42.8, 37.2]),
    B([43.7, 38.5], [46.0, 35.5], [47.5, 32.0], [48.0, 30.2]), B([34.9, 29.5], [36.5, 29.8], [37.8, 31.5], [38.5, 33.5], [40.5, 36.0]),
    B([-1.8, 35.1], [-1.9, 32.0], [-1.5, 29.0]), B([8.2, 36.9], [7.0, 34.8], [6.5, 31.5]), B([11.2, 33.2], [10.6, 30.5]), B([25.1, 31.6], [25.0, 29.0], [25.0, 22.0], [34.0, 22.0]),
    B([72.0, 24.8], [74.5, 23.0], [76.0, 21.0], [78.5, 20.5], [81.0, 20.5]), B([74.5, 16.0], [76.5, 16.2], [78.0, 16.0], [79.5, 15.5]), B([86.5, 26.0], [88.0, 25.3], [89.5, 26.5]),
    B([98.6, 18.0], [98.7, 14.0], [99.0, 11.0]), B([103.8, 17.8], [105.4, 15.3], [103.6, 12.5], [102.5, 12.2]), B([102.2, 22.0], [105.0, 22.9], [107.8, 21.5]),
    B([98.5, 28.0], [98.6, 24.5], [101.5, 22.4], [102.2, 22.0]), B([61.0, 34.0], [62.0, 30.5], [61.2, 25.5]), B([39.0, 17.0], [42.0, 16.0], [45.0, 15.0], [48.0, 17.5], [52.0, 19.0]),
  ];
})(typeof globalThis !== 'undefined' ? globalThis : window);
