// 배속 — 시뮬레이션(시간/주민 AI/건물 생애주기)에만 곱해서 적용.
// 카메라 조작·자동저장 주기는 실시간 그대로 유지(app.js에서 분리 적용).
(function (global) {
  var LEVELS = [1, 5, 20, 60];
  var idx = 0;
  var btn = document.getElementById('speedBtn');

  function render() {
    if (btn) btn.textContent = LEVELS[idx] + 'x';
  }

  function cycle() {
    idx = (idx + 1) % LEVELS.length;
    render();
  }

  function getMultiplier() { return LEVELS[idx]; }

  if (btn) btn.addEventListener('click', cycle);
  render();

  global.GameSpeed = { getMultiplier: getMultiplier, cycle: cycle };
})(window);
