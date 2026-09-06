// 7장: 날씨(맑음/비) — 최소 유지시간 + 전이 확률. "게임 내 N분"은 5장 Cycle
// Clock(4분=1주기)과 같은 축의 표현으로 해석해 실시간(배속 적용) 초 단위로 다룬다.
(function (global) {
  var DURATION = { clear: [180, 300], rain: [120, 180] }; // 3~5분 / 2~3분
  var TRANSITION_CHANCE = { clear: 0.10, rain: 0.30 }; // 맑음→비 10%, 비→맑음 30%
  var CHECK_INTERVAL = 10; // 초, 문서에 없는 재판정 주기(구현 판단)

  var current = 'clear';
  var timer = 0;
  var checkAcc = 0;
  var minDuration = randRange(DURATION.clear[0], DURATION.clear[1]);
  var onTransition = function () {};

  function randRange(min, max) { return min + Math.random() * (max - min); }

  function transition(next) {
    var prev = current;
    current = next;
    timer = 0;
    checkAcc = 0;
    minDuration = randRange(DURATION[current][0], DURATION[current][1]);
    onTransition(prev, next);
  }

  function update(dt) {
    timer += dt;
    if (timer < minDuration) return;
    checkAcc += dt;
    if (checkAcc < CHECK_INTERVAL) return;
    checkAcc = 0;
    if (Math.random() < TRANSITION_CHANCE[current]) {
      transition(current === 'clear' ? 'rain' : 'clear');
    }
  }

  function getCurrent() { return current; }
  function isRaining() { return current === 'rain'; }
  function onWeatherTransition(fn) { onTransition = fn; }

  function serialize() { return { current: current, timer: timer, checkAcc: checkAcc, minDuration: minDuration }; }
  function restore(data) {
    if (!data) return false;
    current = data.current || 'clear';
    timer = data.timer || 0;
    checkAcc = data.checkAcc || 0;
    minDuration = data.minDuration || randRange(DURATION.clear[0], DURATION.clear[1]);
    return true;
  }

  global.Weather = {
    update: update,
    getCurrent: getCurrent,
    isRaining: isRaining,
    onWeatherTransition: onWeatherTransition,
    serialize: serialize,
    restore: restore
  };
})(window);
