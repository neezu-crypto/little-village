// 11장: 발견 일지 — 클릭한 주민 프로필 + 목격한 대화 + 주민 도착/작별(16장).
// 스냅샷(11-1)은 그 트리거(시대 팔레트 전환/무지개/유성)가 아직 없는 단계라 보류.
(function (global) {
  var discovered = {}; // id -> { id, name, personalityId, firstSeenDay }
  var witnessedSet = {};
  var witnessedLog = []; // { line, day }
  var completedStories = []; // 16-2: 떠난 주민 - 삭제 아니라 완료된 이야기로 보관
  var lifeEvents = []; // { text, day } - 도착/작별 로그

  function discoverVillager(v) {
    if (discovered[v.id]) return;
    discovered[v.id] = {
      id: v.id,
      name: v.name,
      personalityId: v.personalityId,
      firstSeenDay: Math.floor(global.Time.getEraDays())
    };
    renderIfOpen();
  }

  function witnessLine(line) {
    if (witnessedSet[line]) return;
    witnessedSet[line] = true;
    witnessedLog.push({ line: line, day: Math.floor(global.Time.getEraDays()) });
    renderIfOpen();
  }

  // 16-1: 이사 온 순간 자동으로 프로필이 열린다(클릭 없이도).
  function logArrival(v) {
    discoverVillager(v);
    lifeEvents.push({ text: v.name + '가 마을에 도착한 날', day: Math.floor(global.Time.getEraDays()) });
    renderIfOpen();
  }

  // 16-2: 삭제가 아니라 "완료된 이야기"로 보관.
  function logDeparture(v) {
    completedStories.push({
      id: v.id,
      name: v.name,
      personalityId: v.personalityId,
      arrivalDay: Math.floor(v.arrivalDay),
      departureDay: Math.floor(global.Time.getEraDays())
    });
    lifeEvents.push({ text: v.name + '가 마을을 떠났다', day: Math.floor(global.Time.getEraDays()) });
    renderIfOpen();
  }

  function isDiscovered(id) { return !!discovered[id]; }
  function getDiscovered() {
    return Object.keys(discovered).map(function (k) { return discovered[k]; });
  }
  function getWitnessedLog() { return witnessedLog; }
  function getCompletedStories() { return completedStories; }
  function getLifeEvents() { return lifeEvents; }

  var renderIfOpen = function () {}; // UI 모듈이 나중에 연결(순환 의존 회피)
  function onChange(fn) { renderIfOpen = fn; }

  function serialize() {
    return {
      discovered: discovered,
      witnessedSet: witnessedSet,
      witnessedLog: witnessedLog,
      completedStories: completedStories,
      lifeEvents: lifeEvents
    };
  }
  function restore(data) {
    if (!data) return false;
    discovered = data.discovered || {};
    witnessedSet = data.witnessedSet || {};
    witnessedLog = data.witnessedLog || [];
    completedStories = data.completedStories || [];
    lifeEvents = data.lifeEvents || [];
    return true;
  }

  global.Journal = {
    discoverVillager: discoverVillager,
    witnessLine: witnessLine,
    logArrival: logArrival,
    logDeparture: logDeparture,
    isDiscovered: isDiscovered,
    getDiscovered: getDiscovered,
    getWitnessedLog: getWitnessedLog,
    getCompletedStories: getCompletedStories,
    getLifeEvents: getLifeEvents,
    onChange: onChange,
    serialize: serialize,
    restore: restore
  };
})(window);
