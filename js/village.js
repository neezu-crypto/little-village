// 4단계: 건물 런타임 상태 + 6-3 Day0 초기 구성 + 6-2 다수결 팔레트.
// 실제 주민 엔티티(성격/이름/AI)는 5단계에서 채운다 — 여기선 건물만 다룬다.
(function (global) {
  // slotIndex -> { occupied, builtEraId, gradeIndex, residentCount }
  var buildings = [];
  var populationCap = null;

  function randInt(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
  }

  function resolveCapacity(era) {
    // 근대는 건물별 1~2명 랜덤(6-1) - 짓는 시점에 고정해 저장.
    if (era.residentsPerBuilding == null) return randInt(1, 2);
    return era.residentsPerBuilding;
  }

  function initDay0() {
    var primitive = global.ERAS[0];
    populationCap = randInt(primitive.populationCapRange[0], primitive.populationCapRange[1]);
    buildings = [];
    // 6-3: 시작 건물 2채(3명+1명 배분), 전부 gradeIndex 0.
    buildings.push({ slotIndex: 0, occupied: true, builtEraId: primitive.id, gradeIndex: 0, residentCount: 3, capacity: 3, ageDecay: 0, lightSeed: Math.random() });
    buildings.push({ slotIndex: 1, occupied: true, builtEraId: primitive.id, gradeIndex: 0, residentCount: 1, capacity: primitive.residentsPerBuilding, ageDecay: 0, lightSeed: Math.random() });
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

  // 17-1 신축 — buildingLifecycle.js가 빈 슬롯에 새 건물을 세울 때 사용.
  function constructBuilding(slotIndex, era) {
    var b = { slotIndex: slotIndex, occupied: true, builtEraId: era.id, gradeIndex: 0, residentCount: 0, capacity: resolveCapacity(era), ageDecay: 0, lightSeed: Math.random() };
    buildings.push(b);
    return b;
  }

  // 17-3 철거 — 빈 집(residentCount 0)만 대상.
  function demolishBuilding(slotIndex) {
    buildings = buildings.filter(function (b) { return b.slotIndex !== slotIndex; });
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
    findEraById: findEraById,
    constructBuilding: constructBuilding,
    demolishBuilding: demolishBuilding,
    serialize: serialize,
    restore: restore
  };
})(window);
