// 17장: 신축(무료)/리모델링(과시욕+wealth)/철거(노후도). villagers.js가 매 프레임 호출.
(function (global) {
  var AGE_DECAY_PER_DAY = 0.01; // 100일에 임계치(1) 도달 — "100일당 소량"
  var DEMOLISH_THRESHOLD = 1;

  function findEmptySlotIndex(buildings) {
    var occupied = {};
    buildings.forEach(function (b) { occupied[b.slotIndex] = true; });
    var slots = global.World.BUILDING_SLOTS;
    for (var i = 0; i < slots.length; i++) if (!occupied[slots[i].index]) return slots[i].index;
    return -1;
  }

  // 17-1: 인구가 현재 지어진 집들의 총 정원을 넘어서면 빈 슬롯에 현재 시대 양식으로 신축.
  function tryConstruct(totalPopulation) {
    var buildings = global.Village.getBuildings();
    var totalCapacity = buildings.reduce(function (s, b) { return s + (b.occupied ? b.capacity : 0); }, 0);
    if (totalPopulation <= totalCapacity) return;
    var slotIndex = findEmptySlotIndex(buildings);
    if (slotIndex === -1) return; // 슬롯 20개 전부 참(3-2 상한)
    global.Village.constructBuilding(slotIndex, global.WorldState.currentEra);
  }

  // 17-3: 노후도 누적 + 빈 집만 철거
  function updateDecayAndDemolish(dt) {
    var buildings = global.Village.getBuildings();
    var toDemolish = [];
    buildings.forEach(function (b) {
      b.ageDecay += AGE_DECAY_PER_DAY * dt;
      if (b.ageDecay >= DEMOLISH_THRESHOLD && b.residentCount === 0) {
        toDemolish.push(b.slotIndex);
      }
    });
    toDemolish.forEach(function (slotIndex) { global.Village.demolishBuilding(slotIndex); });
  }

  // 17-2: 거주 주민 중 과시욕 70+ & wealth가 다음 등급 요구치 이상인 사람이 있으면 리모델링.
  function updateRemodel(villagers) {
    var buildings = global.Village.getBuildings();
    buildings.forEach(function (b) {
      if (!b.occupied || b.gradeIndex >= 2) return;
      var era = global.Village.findEraById(b.builtEraId);
      var nextGrade = era.buildingGrades[b.gradeIndex + 1];
      var residents = villagers.filter(function (v) { return v.homeSlotIndex === b.slotIndex; });
      for (var i = 0; i < residents.length; i++) {
        var v = residents[i];
        if (v.needs.vanity >= 70 && v.wealth >= nextGrade.cost) {
          v.wealth -= nextGrade.cost;
          v.needs.vanity = 0;
          b.gradeIndex += 1;
          break;
        }
      }
    });
  }

  function update(dt, villagers) {
    updateDecayAndDemolish(dt);
    updateRemodel(villagers);
    tryConstruct(villagers.length);
  }

  global.BuildingLifecycle = { update: update };
})(window);
