// 25-8: 설정창 — 사운드 on/off, 애니메이션 감소 수동 토글, 새로 시작하기,
// 모바일 전체화면 재진입.
(function (global) {
  var STORAGE_KEY = 'littleVillageReducedMotion';
  var manualOverride = null; // null = 시스템 설정을 따름

  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) manualOverride = saved === '1';
  } catch (e) {}

  function systemPrefersReduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function getReducedMotion() {
    return manualOverride !== null ? manualOverride : systemPrefersReduced();
  }
  function setReducedMotionOverride(v) {
    manualOverride = v;
    try { localStorage.setItem(STORAGE_KEY, v ? '1' : '0'); } catch (e) {}
  }

  var btn = document.getElementById('settingsBtn');
  var modal = document.getElementById('settingsModal');
  var soundToggle = document.getElementById('soundToggle');
  var motionToggle = document.getElementById('motionToggle');
  var resetBtn = document.getElementById('resetBtn');
  var fullscreenBtn = document.getElementById('reenterFullscreenBtn');
  var closeBtn = document.getElementById('closeSettingsBtn');

  function openModal() {
    soundToggle.checked = global.Sound.isEnabled();
    motionToggle.checked = getReducedMotion();
    fullscreenBtn.style.display = (global.Mobile && global.Mobile.isMobile()) ? '' : 'none';
    modal.classList.remove('hidden');
  }
  function closeModal() { modal.classList.add('hidden'); }

  btn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

  soundToggle.addEventListener('change', function () { global.Sound.setEnabled(soundToggle.checked); });
  motionToggle.addEventListener('change', function () { setReducedMotionOverride(motionToggle.checked); });

  // 게임 자체엔 OAuth 팝업이 없어(서버 없음, 2장) 네이티브 confirm이 억제될 걱정이 없다.
  resetBtn.addEventListener('click', function () {
    if (window.confirm('정말 새로 시작할까요? 지금까지 자란 마을 기록이 사라져요.')) {
      try { localStorage.removeItem('littleVillageSave'); } catch (e) {}
      location.reload();
    }
  });

  fullscreenBtn.addEventListener('click', function () {
    if (global.Mobile && global.Mobile.enterLandscapeMode) global.Mobile.enterLandscapeMode();
    closeModal();
  });

  global.Settings = {
    getReducedMotion: getReducedMotion,
    setReducedMotionOverride: setReducedMotionOverride
  };
})(window);
