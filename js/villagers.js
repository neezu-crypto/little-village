// 5단계: 8장 상태머신(휴식/이동/작업/교류) + 9장 욕구 4종 + 12장 성격 연동.
// 대화 내용(20장)·발견일지 반영(11장)은 6단계에서 이 위에 얹는다 - 지금은
// 상태 전이·이동·욕구 증감까지만 구현.
(function (global) {
  var villagers = [];
  var nextId = 1;
  var WORK_TYPES = ['field', 'well', 'hearth', 'shop'];
  var ENCOUNTER_RADIUS = 60; // world px, 문서에 없는 구현 기본값
  var MOVE_SPEED = 40; // world px/sec, 문서에 없는 구현 기본값
  // 8-5 "매 틱 30%"를 원래 각 주민의 개별 NPC Tick(4~8초, 서로 비동기)에
  // 스냅샷으로 걸었더니, 두 주민이 실제로 스쳐 지나가도 그 순간이 어느 한쪽의
  // 틱 타이밍과 우연히 안 겹치면 대부분 놓치는 버그가 시뮬레이션으로 확인됨.
  // 근접해 있는 "동안" 매초 반복 판정하도록 바꾸고(6초당 30%와 등가인 초당
  // 확률로 환산), 인카운터 감지 자체는 매 프레임 연속으로 하도록 수정.
  var ENCOUNTER_CHANCE_PER_SEC = 0.0585; // 1-(1-0.30)^(1/6)

  function randRange(min, max) { return min + Math.random() * (max - min); }
  function clampNeed(v) { return Math.max(0, Math.min(100, v)); }

  function pickPersonality() {
    var list = global.PERSONALITIES;
    var total = list.reduce(function (s, p) { return s + p.moveInWeight; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < list.length; i++) {
      r -= list[i].moveInWeight;
      if (r <= 0) return list[i];
    }
    return list[list.length - 1];
  }

  function spawnVillager(homeSlotIndex, x, forcedPersonalityId) {
    var v = {
      id: nextId++,
      name: global.Names.pick(),
      personalityId: forcedPersonalityId || pickPersonality().id,
      homeSlotIndex: homeSlotIndex,
      x: x,
      facing: 1,
      state: 'rest',
      stateTimer: 0,
      minStateDuration: randRange(5, 8),
      targetX: null,
      targetType: null,
      targetObject: null,
      tickAcc: 0,
      tickInterval: randRange(4, 8),
      needs: { hunger: 0, fatigue: 0, loneliness: 0, vanity: 0 },
      speechText: null,
      socialPartnerId: null,
      wealth: 0,
      assets: { livestock: null, vehicle: null },
      recentFarmWork: [], // 19-1 가축 구매 조건용 - {field,hearth} 작업 완료 날짜 기록
      assetCheckAcc: 0,
      arrivalDay: global.Time.getEraDays(), // 16-2 거주 자격(90일) 판정용
      moveOutCheckAcc: 0,
      leaving: false,
      leavingPhase: null, // 'preparing' | 'departing'
      leavingTimer: 0,
      leavingDuration: 0
    };
    villagers.push(v);
    return v;
  }

  // 16-1 이사 오는 주민 — migration.js 전용 진입점(성격을 미리 정해서 넘김).
  function spawnMigrant(homeSlotIndex, personalityId, x) {
    return spawnVillager(homeSlotIndex, x, personalityId);
  }

  function removeVillager(id) {
    villagers = villagers.filter(function (v) { return v.id !== id; });
  }

  // 16-2 작별 인사 등 - migration.js가 특정 대화 풀을 강제 지정해 교류를 걸 때 사용.
  function forceSocial(idA, idB, poolKey) {
    var a = villagers.filter(function (v) { return v.id === idA; })[0];
    var b = villagers.filter(function (v) { return v.id === idB; })[0];
    if (!a || !b) return false;
    startSocial(a, b, poolKey);
    return true;
  }

  function getPersonality(v) {
    for (var i = 0; i < global.PERSONALITIES.length; i++) {
      if (global.PERSONALITIES[i].id === v.personalityId) return global.PERSONALITIES[i];
    }
    return global.PERSONALITIES[0];
  }

  function initDay0() {
    villagers = [];
    var buildings = global.Village.getBuildings();
    var slots = global.World.BUILDING_SLOTS;
    buildings.forEach(function (b) {
      var slot = slots[b.slotIndex];
      for (var i = 0; i < b.residentCount; i++) {
        spawnVillager(b.slotIndex, slot.x + (Math.random() * 20 - 10));
      }
    });
  }

  // ---------- 9장 욕구 ----------
  function updateNeeds(v, dt) {
    var p = getPersonality(v);
    v.needs.hunger = clampNeed(v.needs.hunger + 0.15 * p.hungerMul * dt);
    if (v.state === 'move' || v.state === 'work') {
      v.needs.fatigue = clampNeed(v.needs.fatigue + 0.1 * p.fatigueMul * dt);
    } else if (v.state === 'rest') {
      v.needs.fatigue = clampNeed(v.needs.fatigue - 0.3 * dt);
    }
    if (v.state !== 'social') {
      v.needs.loneliness = clampNeed(v.needs.loneliness + 0.08 * p.lonelinessMul * dt);
    }
    v.needs.vanity = clampNeed(v.needs.vanity + 0.05 * dt);
  }

  // ---------- 8-3 휴식→이동 전이 확률 ----------
  function timeOfDayBonus() {
    switch (global.Time.getPhaseName()) {
      case 'morning': return 0.20;
      case 'day': return 0.10;
      case 'evening': return 0.0;
      case 'night': return -0.20;
      default: return 0;
    }
  }

  function desireBonus(v) {
    var m = Math.max(v.needs.hunger, v.needs.fatigue, v.needs.loneliness);
    return (m / 100) * 0.30;
  }

  // ---------- 8-4 이동 목적지 결정 ----------
  // 문서의 weight.random=15(고정)과 weight.work/social(0~1 스케일)은 그대로 비교하면
  // random이 항상 압도적으로 이겨버려서, 세 값 전부 0~100 스케일로 맞춰 해석했다
  // (구현 판단 - 욕구값을 100분율 그대로 사용, random은 15를 그 스케일의 기본값으로 취급).
  function chooseDestination(v) {
    var p = getPersonality(v);
    var wWork = v.needs.hunger;
    var wSocial = v.needs.loneliness * p.socialWeightMul;
    var wRandom = 15 * p.randomWeightMul;
    var total = wWork + wSocial + wRandom;
    var r = Math.random() * total;
    if (r < wWork) return 'work';
    if (r < wWork + wSocial) return 'social';
    return 'random';
  }

  function nearestWorkObject(x) {
    var objs = global.World.OBJECTS.filter(function (o) { return WORK_TYPES.indexOf(o.type) !== -1; });
    var best = null, bestDist = Infinity;
    objs.forEach(function (o) {
      var d = Math.abs(o.x - x);
      if (d < bestDist) { bestDist = d; best = o; }
    });
    return best;
  }

  function startMove(v) {
    var category = chooseDestination(v);
    v.targetType = category;
    if (category === 'work') {
      var obj = nearestWorkObject(v.x);
      v.targetObject = obj;
      v.targetX = obj.x;
    } else if (category === 'social') {
      var square = global.World.zoneById('square');
      v.targetX = square.startPx + Math.random() * square.widthPx;
      v.targetObject = null;
    } else {
      var radius = 300;
      v.targetX = Math.max(0, Math.min(global.World.WORLD_WIDTH_PX, v.x + (Math.random() * 2 - 1) * radius));
      v.targetObject = null;
    }
    v.state = 'move';
    v.stateTimer = 0;
  }

  // 18-1 wealth 증가 공식: 오브젝트 기본값 x 시대 배율 x 성격 배율
  function applyWorkWealth(v) {
    var obj = v.targetObject;
    if (!obj) return;
    var era = global.WorldState.currentEra;
    var range = era.workWealth[obj.type];
    if (!range) return;
    var p = getPersonality(v);
    v.wealth += randRange(range[0], range[1]) * era.wealthMultiplier * p.wealthMul;
    if (obj.type === 'field' || obj.type === 'hearth') {
      v.recentFarmWork.push(global.Time.getEraDays());
    }
  }

  function endWork(v) {
    v.needs.hunger = clampNeed(v.needs.hunger - randRange(40, 60));
    applyWorkWealth(v);
    v.state = 'rest';
    v.stateTimer = 0;
    v.minStateDuration = randRange(5, 8);
  }

  function arriveAtDestination(v) {
    if (v.targetType === 'leaving') {
      v.readyToRemove = true; // 16-2 퇴장 완료 - update()에서 실제 제거
      return;
    }
    if (v.targetType === 'work' && v.targetObject) {
      v.state = 'work';
      v.stateTimer = 0;
      v.minStateDuration = randRange(v.targetObject.minDuration[0], v.targetObject.minDuration[1]);
    } else {
      v.state = 'rest';
      v.stateTimer = 0;
      v.minStateDuration = randRange(5, 8);
    }
  }

  function startSocial(a, b, forcedPoolKey) {
    var duration = randRange(8, 15);
    var currentAffinity = global.Relationships.get(a.id, b.id);
    var poolKey = forcedPoolKey || global.Relationships.tierKey(currentAffinity);
    var line = global.Dialogue.pickLine(poolKey);
    global.Journal.witnessLine(line);
    [a, b].forEach(function (v, i) {
      v.state = 'social';
      v.stateTimer = 0;
      v.minStateDuration = duration;
      v.socialPartnerId = (i === 0 ? b.id : a.id);
      v.speechText = line;
    });
  }

  function compatBonus(a, b) {
    if (a.personalityId === 'extrovert' && b.personalityId === 'extrovert') return 0.15;
    if (a.personalityId === 'introvert' && b.personalityId === 'introvert') return -0.10;
    return 0;
  }

  // ---------- NPC Tick(4~8초)마다 확률 판정 (휴식→이동/작업 종료) ----------
  function onTick(v) {
    if (v.state === 'rest') {
      if (v.stateTimer < v.minStateDuration) return;
      var chance = 0.25 + timeOfDayBonus() + desireBonus(v);
      if (Math.random() < chance) startMove(v);
    } else if (v.state === 'work') {
      if (v.stateTimer < v.minStateDuration) return;
      if (Math.random() < 0.20) endWork(v);
    }
  }

  // 근접해 있는 "동안" 매 프레임 연속으로 판정(위 상단 주석 참고) - 6초당
  // 30%와 등가인 초당 확률로 환산해 dt에 비례시킨다.
  function checkEncounter(v, dt) {
    for (var i = 0; i < villagers.length; i++) {
      var other = villagers[i];
      if (other === v || other.state !== 'move') continue;
      if (Math.abs(other.x - v.x) > ENCOUNTER_RADIUS) continue;
      var chance = (ENCOUNTER_CHANCE_PER_SEC + compatBonus(v, other)) * dt;
      if (Math.random() < chance) {
        startSocial(v, other);
        return;
      }
    }
  }

  function updateMovement(v, dt) {
    if (v.state !== 'move' || v.targetX === null) return;
    checkEncounter(v, dt);
    if (v.state !== 'move') return; // 이번 프레임에 교류로 전이됐으면 이동 계산 중단
    var dx = v.targetX - v.x;
    var dir = dx > 0 ? 1 : -1;
    v.facing = dir;
    var speed = v.assets.vehicle ? MOVE_SPEED * 2 : MOVE_SPEED; // 19-2 차량 보유 시 이동 속도 x2
    var step = speed * dt;
    if (Math.abs(dx) <= step) {
      v.x = v.targetX;
      arriveAtDestination(v);
    } else {
      v.x += dir * step;
    }
  }

  function update(dt) {
    global.Relationships.decay(dt);
    global.Relationships.applyRoommatePassive(villagers, dt); // 16-5 동거 패시브 상승
    var toRemove = [];

    villagers.forEach(function (v) {
      updateNeeds(v, dt);
      updateMovement(v, dt);
      v.stateTimer += dt;

      v.tickAcc += dt;
      if (v.tickAcc >= v.tickInterval) {
        v.tickAcc = 0;
        v.tickInterval = randRange(4, 8);
        onTick(v);
      }

      if (v.state === 'social' && v.stateTimer >= v.minStateDuration) {
        v.needs.loneliness = clampNeed(v.needs.loneliness - 50);
        // 쌍당 한 번만 기록되도록 id가 더 작은 쪽에서만 처리.
        if (v.socialPartnerId != null && v.id < v.socialPartnerId) {
          var partner = villagers.filter(function (o) { return o.id === v.socialPartnerId; })[0];
          if (partner) global.Relationships.recordInteraction(v.id, partner.id, v.personalityId, partner.personalityId);
        }
        v.speechText = null;
        v.socialPartnerId = null;
        v.state = 'rest';
        v.stateTimer = 0;
        v.minStateDuration = randRange(5, 8);
      }

      v.assetCheckAcc += dt;
      if (v.assetCheckAcc >= 7) { // 19장 가축/차량 구매 판정 주기(7일)
        v.assetCheckAcc = 0;
        global.Assets.checkPurchase(v);
      }

      // 16-2 "떠날 준비" 기간이 끝나면 마을 가장자리로 강제 이동시킨다.
      if (v.leaving && v.leavingPhase === 'preparing') {
        v.leavingTimer += dt;
        if (v.leavingTimer >= v.leavingDuration) {
          v.leavingPhase = 'departing';
          v.state = 'move';
          v.targetType = 'leaving';
          v.targetObject = null;
          v.targetX = (v.x < global.World.WORLD_WIDTH_PX / 2) ? 0 : global.World.WORLD_WIDTH_PX;
        }
      }
      if (v.readyToRemove) toRemove.push(v);
    });

    toRemove.forEach(function (v) {
      var building = global.Village.getBuildings().filter(function (b) { return b.slotIndex === v.homeSlotIndex; })[0];
      if (building) building.residentCount = Math.max(0, building.residentCount - 1);
      global.Journal.logDeparture(v);
      global.Names.release(v.name);
      removeVillager(v.id);
    });

    global.BuildingLifecycle.update(dt, villagers);
    global.Migration.update(dt, villagers);
  }

  function getVillagers() { return villagers; }

  function serialize() {
    return { villagers: villagers, nextId: nextId };
  }

  function restore(data) {
    if (!data) return false;
    villagers = data.villagers || [];
    nextId = data.nextId || (villagers.length + 1);
    villagers.forEach(function (v) { global.Names.markUsed(v.name); });
    return true;
  }

  global.Villagers = {
    initDay0: initDay0,
    update: update,
    getVillagers: getVillagers,
    getPersonality: getPersonality,
    spawnMigrant: spawnMigrant,
    removeVillager: removeVillager,
    forceSocial: forceSocial,
    serialize: serialize,
    restore: restore
  };
})(window);
