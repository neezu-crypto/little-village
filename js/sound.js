// 22장: Web Audio API 오실레이터 SFX — 파일/라이선스 없이(streamer-gallery
// sound.js 패턴 재사용). 설정창(25-8)에서 on/off 토글, localStorage에 기억.
(function (global) {
  var STORAGE_KEY = 'littleVillageSoundEnabled';
  var enabled = true;
  var ctx = null;
  var ambient = null;

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

  function startAmbient() {
    if (!enabled || ambient) return;
    var ac = ensureCtx();
    var osc1 = ac.createOscillator();
    var osc2 = ac.createOscillator();
    var gain = ac.createGain();
    osc1.type = 'sine'; osc1.frequency.value = 110;
    osc2.type = 'sine'; osc2.frequency.value = 110 * 1.5;
    gain.gain.value = 0.02; // 아주 은은하게(streamer-gallery 최대치 0.15보다 더 낮게)
    osc1.connect(gain); osc2.connect(gain); gain.connect(ac.destination);
    osc1.start(); osc2.start();
    ambient = { osc1: osc1, osc2: osc2 };
  }

  function stopAmbient() {
    if (!ambient) return;
    try { ambient.osc1.stop(); ambient.osc2.stop(); } catch (e) {}
    ambient = null;
  }

  function setEnabled(v) {
    enabled = v;
    if (enabled) startAmbient(); else stopAmbient();
    try { localStorage.setItem(STORAGE_KEY, v ? '1' : '0'); } catch (e) {}
  }
  function isEnabled() { return enabled; }

  // 오디오는 사용자 제스처 없이 시작 못 함(모바일 전체화면과 같은 제약) -
  // 첫 클릭/탭에서 잠금 해제 + 앰비언트 시작.
  function unlock() {
    ensureCtx();
    startAmbient();
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
