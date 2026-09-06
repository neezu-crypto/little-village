// 11장: 발견 일지 — 클릭한 주민 프로필 + 목격한 대화 + 주민 도착/작별(16장) + 풍경 스냅샷(11-1).
(function (global) {
  var discovered = {}; // id -> { id, name, personalityId, firstSeenDay }
  var witnessedSet = {};
  var witnessedLog = []; // { line, day }
  var completedStories = []; // 16-2: 떠난 주민 - 삭제 아니라 완료된 이야기로 보관
  var lifeEvents = []; // { text, day } - 도착/작별 로그
  var snapshots = []; // 11-1: { dataUrl, label, day }
  var SNAPSHOT_CAP = 30;

  // 11-1/11-2: 160x120 썸네일 + JPEG 압축, 최근 30장만 유지(오래된 것부터 삭제).
  function captureSnapshot(label) {
    var src = global.Render && global.Render.canvas;
    if (!src) return;
    try {
      var thumb = document.createElement('canvas');
      thumb.width = 160;
      thumb.height = 120;
      thumb.getContext('2d').drawImage(src, 0, 0, src.width, src.height, 0, 0, 160, 120);
      snapshots.push({ dataUrl: thumb.toDataURL('image/jpeg', 0.65), label: label, day: Math.floor(global.Time.getEraDays()) });
      if (snapshots.length > SNAPSHOT_CAP) snapshots.shift();
      renderIfOpen();
    } catch (e) {
      console.error('스냅샷 캡처 실패:', e);
    }
  }
  function getSnapshots() { return snapshots; }

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
      lifeEvents: lifeEvents,
      snapshots: snapshots
    };
  }
  function restore(data) {
    if (!data) return false;
    discovered = data.discovered || {};
    witnessedSet = data.witnessedSet || {};
    witnessedLog = data.witnessedLog || [];
    completedStories = data.completedStories || [];
    lifeEvents = data.lifeEvents || [];
    snapshots = data.snapshots || [];
    return true;
  }

  global.Journal = {
    discoverVillager: discoverVillager,
    witnessLine: witnessLine,
    logArrival: logArrival,
    logDeparture: logDeparture,
    captureSnapshot: captureSnapshot,
    isDiscovered: isDiscovered,
    getDiscovered: getDiscovered,
    getWitnessedLog: getWitnessedLog,
    getCompletedStories: getCompletedStories,
    getLifeEvents: getLifeEvents,
    getSnapshots: getSnapshots,
    onChange: onChange,
    serialize: serialize,
    restore: restore
  };
})(window);
