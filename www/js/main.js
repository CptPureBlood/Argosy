/* Mare Nostrum – boot. */
(function () {
  const A = window.A;
  function boot() {
    const saved = A.storage.get(A.C.LANG_KEY);
    A.setLang(saved === 'tr' ? 'tr' : 'en'); // English by default
    A.audio.setOn(A.storage.get('marenostrum_sound') !== '0');
    document.addEventListener('pointerdown', () => A.audio.unlock(), { passive: true });
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    A.world.build();
    A.ui.splash();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
