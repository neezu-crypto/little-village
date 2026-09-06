// 4단계: 건물 런타임 상태 + 6-3 Day0 초기 구성 + 6-2 다수결 팔레트.
// 실제 주민 엔티티(성격/이름/AI)는 5단계에서 채운다 — 여기선 건물만 다룬다.
(function (global) {
  // slotIndex -> { occupied, builtEraId, gradeIndex, residentCount }
  var buildings = [];
  var populationCap = null;

  function randInt(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
  }

  function initDay0() {
    var primitive = global.ERAS[0];
    populationCap = randInt(primitive.populationCapRange[0], primitive.populationCapRange[1]);
    buildings = [];
    // 6-3: 시작 건물 2채(3명+1명 배분), 전부 gradeIndex 0.
    buildings.push({ slotIndex: 0, occupied: true, builtEraId: primitive.id, gradeIndex: 0, residentCount: 3 });
    buildings.push({ slotIndex: 1, occupied: true, builtEraId: primitive.id, gradeIndex: 0, residentCount: 1 });
  }

  function getBuildings() {
    return buildings;
  }

  function getPopulationCap() {
    return populationCap;
  }

  function findEraById(id) {
    for (var i = 0; i < global.ERAS.length; i++) if (global.ERAS[i].id === id) return global.ERAS[i];
    return global.ERAS[0];
  }

  // 6-2: 배경 팔레트는 즉시 전환하지 않고 "현재 서 있는 건물들의 builtEraId 다수결"로 정한다.
  function getMajorityEra() {
    if (!buildings.length) return global.WorldState.currentEra;
    var counts = {};
    buildings.forEach(function (b) {
      if (!b.occupied) return;
      counts[b.builtEraId] = (counts[b.builtEraId] || 0) + 1;
    });
    var bestId = null, bestCount = -1;
    Object.keys(counts).forEach(function (id) {
      if (counts[id] > bestCount) { bestCount = counts[id]; bestId = id; }
    });
    return bestId ? findEraById(bestId) : global.WorldState.currentEra;
  }

  function serialize() {
    return { buildings: buildings, populationCap: populationCap };
  }

  function restore(data) {
    if (!data) return false;
    buildings = data.buildings || [];
    populationCap = data.populationCap || null;
    return true;
  }

  global.Village = {
    initDay0: initDay0,
    getBuildings: getBuildings,
    getPopulationCap: getPopulationCap,
    getMajorityEra: getMajorityEra,
    serialize: serialize,
    restore: restore
  };
})(window);
