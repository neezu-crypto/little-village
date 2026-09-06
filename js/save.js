// 3단계 (2-1): 자동저장 — 10초 주기 + 탭 숨김 즉시저장, 다중 탭 충돌 안내.
// collectState/applyState는 이후 단계(주민·건물 등)가 생길 때마다 필드를 늘려간다.
(function (global) {
  var SAVE_KEY = 'littleVillageSave';
  var SCHEMA_VERSION = 1;
  var AUTOSAVE_INTERVAL = 10; // seconds
  var indicator = document.getElementById('saveIndicator');
  var tabNotice = document.getElementById('tabConflictNotice');
  var suppressNextStorageEvent = false;

  function collectState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      eraDays: global.Time.getEraDays(),
      cyclePhase: global.Time.getCyclePhase(),
      cameraX: global.Camera.x,
      village: global.Village.serialize(),
      villagers: global.Villagers.serialize()
    };
  }

  function applyState(state) {
    if (!state || state.schemaVersion !== SCHEMA_VERSION) return false;
    global.Time.setEraDays(state.eraDays || 0);
    global.Time.setCyclePhase(state.cyclePhase || 0);
    if (typeof state.cameraX === 'number') global.Camera.setX(state.cameraX);
    global.Village.restore(state.village);
    global.Villagers.restore(state.villagers);
    return true;
  }

  function flashIndicator() {
    if (!indicator) return;
    indicator.classList.add('active');
    setTimeout(function () { indicator.classList.remove('active'); }, 800);
  }

  function saveNow() {
    try {
      suppressNextStorageEvent = true;
      localStorage.setItem(SAVE_KEY, JSON.stringify(collectState()));
      flashIndicator();
    } catch (e) {
      console.error('자동저장 실패:', e);
    }
  }

  function loadSave() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('저장 데이터 불러오기 실패:', e);
      return null;
    }
  }

  // 다른 탭에서 저장이 갱신된 걸 감지 — 조용한 안내만, 강제 리로드 없음.
  window.addEventListener('storage', function (e) {
    if (e.key !== SAVE_KEY) return;
    if (suppressNextStorageEvent) { suppressNextStorageEvent = false; return; }
    if (tabNotice) {
      tabNotice.classList.remove('hidden');
      clearTimeout(tabNotice._hideTimer);
      tabNotice._hideTimer = setTimeout(function () {
        tabNotice.classList.add('hidden');
      }, 4000);
    }
  });

  var elapsedSinceSave = 0;
  function update(deltaTime) {
    if (!global.Time.isActive()) return;
    elapsedSinceSave += deltaTime;
    if (elapsedSinceSave >= AUTOSAVE_INTERVAL) {
      elapsedSinceSave = 0;
      saveNow();
    }
  }

  global.Save = {
    saveNow: saveNow,
    loadSave: loadSave,
    applyState: applyState,
    update: update
  };
})(window);
