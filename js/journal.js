// 11장: 발견 일지 — 클릭한 주민 프로필 + 목격한 대화. 스냅샷(11-1)은 그
// 트리거(시대 팔레트 전환/무지개/유성)가 아직 없는 단계라 이번엔 보류.
(function (global) {
  var discovered = {}; // id -> { id, name, personalityId, firstSeenDay }
  var witnessedSet = {};
  var witnessedLog = []; // { line, day }

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

  function isDiscovered(id) { return !!discovered[id]; }
  function getDiscovered() {
    return Object.keys(discovered).map(function (k) { return discovered[k]; });
  }
  function getWitnessedLog() { return witnessedLog; }

  var renderIfOpen = function () {}; // UI 모듈이 나중에 연결(순환 의존 회피)
  function onChange(fn) { renderIfOpen = fn; }

  function serialize() {
    return { discovered: discovered, witnessedSet: witnessedSet, witnessedLog: witnessedLog };
  }
  function restore(data) {
    if (!data) return false;
    discovered = data.discovered || {};
    witnessedSet = data.witnessedSet || {};
    witnessedLog = data.witnessedLog || [];
    return true;
  }

  global.Journal = {
    discoverVillager: discoverVillager,
    witnessLine: witnessLine,
    isDiscovered: isDiscovered,
    getDiscovered: getDiscovered,
    getWitnessedLog: getWitnessedLog,
    onChange: onChange,
    serialize: serialize,
    restore: restore
  };
})(window);
