// 3단계: 5장 시간 시스템 — Era Clock(1초=1일) + Cycle Clock(4분=1주기, 4구간) + isActive 공유 플래그.
// NPC Tick은 여기서 재사용 가능한 유틸(createTicker)만 제공 — 실제 개별 주민 배정은 5단계.
(function (global) {
  var isActive = !document.hidden;
  var eraDays = 0;
  var cyclePhase = 0;
  var CYCLE_DURATION = 240; // 4분(초)

  document.addEventListener('visibilitychange', function () {
    isActive = !document.hidden;
    if (!isActive && global.Save) global.Save.saveNow();
  });

  function update(deltaTime) {
    if (!isActive) return;
    eraDays += deltaTime;
    cyclePhase = (cyclePhase + deltaTime / CYCLE_DURATION) % 1;
  }

  // 아침(0~.25) / 낮(.25~.5) / 저녁(.5~.75) / 밤(.75~1)
  function getPhaseName() {
    if (cyclePhase < 0.25) return 'morning';
    if (cyclePhase < 0.5) return 'day';
    if (cyclePhase < 0.75) return 'evening';
    return 'night';
  }

  function getCurrentEraIndex() {
    var eras = global.ERAS;
    var idx = 0;
    for (var i = 0; i < eras.length; i++) {
      if (eraDays >= eras[i].startDay) idx = i;
    }
    return idx;
  }

  // NPC Tick(5장) — 주민마다 4~8초 랜덤 오프셋으로 상태 판정. 5단계에서 개별 주민에 부여.
  function createTicker(minSec, maxSec) {
    var interval = minSec + Math.random() * (maxSec - minSec);
    var elapsed = 0;
    return {
      update: function (dt) {
        elapsed += dt;
        if (elapsed >= interval) {
          elapsed = 0;
          interval = minSec + Math.random() * (maxSec - minSec);
          return true;
        }
        return false;
      }
    };
  }

  global.Time = {
    isActive: function () { return isActive; },
    update: update,
    getEraDays: function () { return eraDays; },
    setEraDays: function (v) { eraDays = v; },
    getCyclePhase: function () { return cyclePhase; },
    setCyclePhase: function (v) { cyclePhase = v; },
    getPhaseName: getPhaseName,
    getCurrentEraIndex: getCurrentEraIndex,
    CYCLE_DURATION: CYCLE_DURATION,
    createTicker: createTicker
  };
})(window);
