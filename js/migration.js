// 16장: 이사 오는/나가는 주민 + 인구·건물 인과관계.
// 핵심 전제(16장 서두) - 방치 때문에 나가는 일은 없다(탭 닫히면 시간도 멈춤),
// 순수 생애주기 이벤트로만 다룬다.
(function (global) {
  var MOVE_IN_CHANCE = 0.30;
  var MOVE_OUT_BASE_CHANCE = 0.05;
  var RESIDENCY_MIN_DAYS = 90;
  var MOVE_OUT_CHECK_INTERVAL = 30;
  var RETURN_CHANCE = 0.01;
  var RETURN_CHECK_INTERVAL = 30;

  var moveInAcc = 0;
  var moveInInterval = randRange(10, 15);
  var returnAcc = 0;

  function randRange(min, max) { return min + Math.random() * (max - min); }

  function pickPersonalityId() {
    var list = global.PERSONALITIES;
    var total = list.reduce(function (s, p) { return s + p.moveInWeight; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < list.length; i++) {
      r -= list[i].moveInWeight;
      if (r <= 0) return list[i].id;
    }
    return list[list.length - 1].id;
  }

  function personalityById(id) {
    for (var i = 0; i < global.PERSONALITIES.length; i++) if (global.PERSONALITIES[i].id === id) return global.PERSONALITIES[i];
    return global.PERSONALITIES[0];
  }

  function findRoomySlot() {
    var buildings = global.Village.getBuildings();
    var candidates = buildings.filter(function (b) { return b.occupied && b.residentCount < b.capacity; });
    if (!candidates.length) return null;
    candidates.sort(function (a, b) { return a.slotIndex - b.slotIndex; });
    return candidates[0];
  }

  // 16-1 + 17-1 인과관계: 빈자리 있는 집부터 채우고, 전부 꽉 찼으면 그 자리에서
  // 신축 후 입주(6-3이 그린 "빈 슬롯이 채워지다 새 집이 지어지는" 흐름).
  function performMoveIn() {
    var target = findRoomySlot();
    if (!target) {
      var buildings = global.Village.getBuildings();
      var occupiedIdx = {};
      buildings.forEach(function (b) { occupiedIdx[b.slotIndex] = true; });
      var slots = global.World.BUILDING_SLOTS;
      var emptySlot = null;
      for (var i = 0; i < slots.length; i++) {
        if (!occupiedIdx[slots[i].index]) { emptySlot = slots[i]; break; }
      }
      if (!emptySlot) return; // 3-2 슬롯 20개 전부 참 - 정말 더는 못 지음
      target = global.Village.constructBuilding(emptySlot.index, global.WorldState.currentEra);
    }
    var slotPos = global.World.BUILDING_SLOTS[target.slotIndex];
    var personalityId = pickPersonalityId();
    var newVillager = global.Villagers.spawnMigrant(target.slotIndex, personalityId, slotPos.x);
    target.residentCount += 1;

    // 16-5 룸메이트 - 이미 그 집에 살던 사람들과 초기 affinity 2.
    global.Villagers.getVillagers().forEach(function (r) {
      if (r.id !== newVillager.id && r.homeSlotIndex === target.slotIndex) {
        global.Relationships.setMinimum(newVillager.id, r.id, 2);
      }
    });

    global.Journal.logArrival(newVillager);
  }

  function updateMoveIn(dt) {
    var cap = global.Village.getPopulationCap();
    if (global.Villagers.getVillagers().length >= cap) return;
    moveInAcc += dt;
    if (moveInAcc < moveInInterval) return;
    moveInAcc = 0;
    moveInInterval = randRange(10, 15);
    if (Math.random() < MOVE_IN_CHANCE) performMoveIn();
  }

  // 16-2 나가는 주민 - 자격(90일) 충족 후 30일마다 성격·단짝 보정된 확률로 판정.
  function updateMoveOut(dt, villagers) {
    villagers.forEach(function (v) {
      if (v.leaving) return;
      var residencyDays = global.Time.getEraDays() - v.arrivalDay;
      if (residencyDays < RESIDENCY_MIN_DAYS) return;
      v.moveOutCheckAcc += dt;
      if (v.moveOutCheckAcc < MOVE_OUT_CHECK_INTERVAL) return;
      v.moveOutCheckAcc = 0;

      var p = personalityById(v.personalityId);
      var closest = global.Relationships.closestPartner(v.id);
      var bestFriendMul = (closest && closest.value >= 30) ? 0.7 : 1.0;
      var chance = MOVE_OUT_BASE_CHANCE * p.moveOutMul * bestFriendMul;
      if (Math.random() < chance) beginLeaving(v, closest, villagers);
    });
  }

  function beginLeaving(v, closest, villagers) {
    v.leaving = true;
    v.leavingPhase = 'preparing';
    v.leavingTimer = 0;
    v.leavingDuration = randRange(3, 6);

    if (closest && closest.value >= 30) {
      var partner = villagers.filter(function (o) { return o.id === closest.id; })[0];
      if (partner && partner.state !== 'social') {
        global.Villagers.forceSocial(v.id, partner.id, 'farewell');
      }
    }
  }

  // 16-2(선택) 재회 - 완료된 이야기 중 하나가 아주 낮은 확률로 돌아온다.
  function updateReturn(dt) {
    returnAcc += dt;
    if (returnAcc < RETURN_CHECK_INTERVAL) return;
    returnAcc = 0;
    // 인구 상한 체크 누락 버그(시뮬레이션으로 발견) - 이게 없으면 재회가
    // move-in의 상한 게이팅을 우회해 인구가 상한을 넘어설 수 있었다.
    if (global.Villagers.getVillagers().length >= global.Village.getPopulationCap()) return;
    var stories = global.Journal.getCompletedStories();
    if (!stories.length) return;
    if (Math.random() >= RETURN_CHANCE) return;
    var target = findRoomySlot();
    if (!target) return; // 빈자리 없으면 재회도 보류
    var idx = Math.floor(Math.random() * stories.length);
    var story = stories[idx];
    var slotPos = global.World.BUILDING_SLOTS[target.slotIndex];
    var returned = global.Villagers.spawnMigrant(target.slotIndex, story.personalityId, slotPos.x);
    returned.name = story.name; // 같은 이름으로 재등장
    global.Names.markUsed(story.name);
    target.residentCount += 1;
    global.Villagers.getVillagers().forEach(function (r) {
      if (r.id !== returned.id && r.homeSlotIndex === target.slotIndex) {
        global.Relationships.setMinimum(returned.id, r.id, 2); // 16-5, 신규 이주민과 동일 규칙
      }
    });
    global.Journal.logArrival(returned);
  }

  function update(dt, villagers) {
    updateMoveIn(dt);
    updateMoveOut(dt, villagers);
    updateReturn(dt);
  }

  global.Migration = { update: update };
})(window);
