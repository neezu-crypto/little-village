// 22장: Web Audio API 오실레이터 SFX — 파일/라이선스 없이(streamer-gallery
// sound.js 패턴 재사용). 설정창(25-8)에서 on/off 토글, localStorage에 기억.
//
// 원래 짧은 효과음(클릭/배치/습득) 외에 두 개의 사인파를 계속 울리는 배경
// 드론도 넣었는데, 오디오를 직접 들어보지 않고 만든 상태라 사용자가 "이상하다"고
// 확인해줬다 - 계속 재생되는 톤은 잘 다듬지 않으면 화음보다 경고음/삐 소리처럼
// 들리기 쉬운데, 여기서 더 다듬을 방법(실제로 들어보며 조정)이 없어서 안전하게
// 제거하고 순간적인 효과음만 남겼다.
(function (global) {
  var STORAGE_KEY = 'littleVillageSoundEnabled';
  var enabled = true;
  var ctx = null;

  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) enabled = saved === '1';
  } catch (e) {}

  function ensureCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function blip(freq, duration, type) {
    if (!enabled) return;
    var ac = ensureCtx();
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ac.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration + 0.05);
  }

  function playClick() { blip(600, 0.08, 'sine'); }
  function playPlace() { blip(440, 0.15, 'triangle'); }
  function playThanks() {
    blip(880, 0.18, 'sine');
    setTimeout(function () { blip(1100, 0.18, 'sine'); }, 90);
  }

  function setEnabled(v) {
    enabled = v;
    try { localStorage.setItem(STORAGE_KEY, v ? '1' : '0'); } catch (e) {}
  }
  function isEnabled() { return enabled; }

  // 오디오는 사용자 제스처 없이 시작 못 함 - 첫 클릭/탭에서 컨텍스트만 미리 깨워둔다.
  function unlock() {
    ensureCtx();
    document.removeEventListener('click', unlock);
    document.removeEventListener('touchend', unlock);
  }
  document.addEventListener('click', unlock, { once: true });
  document.addEventListener('touchend', unlock, { once: true });

  global.Sound = {
    playClick: playClick,
    playPlace: playPlace,
    playThanks: playThanks,
    setEnabled: setEnabled,
    isEnabled: isEnabled
  };
})(window);
