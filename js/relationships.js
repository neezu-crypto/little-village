// 13장: 관계(친밀도) 시스템 — 주민 쌍(unordered pair)마다 affinity 누적.
(function (global) {
  var affinity = {}; // key: "minId_maxId" -> { value, lastDay }
  // 시뮬레이션으로 확인된 밸런스 문제(구현 판단 수정): 문서의 grace 30일/감쇠
  // 0.1/일은 소규모 마을(4명)에서 특정 두 명이 다시 마주치는 평균 간격(수천 일)보다
  // 훨씬 짧아서, 매번 만나 얻은 호감이 다음 만남 전에 항상 0으로 깎여버려
  // "단짝"은커녕 1단계도 못 올라갔다. 실제 인카운터 빈도에 맞춰 grace를
  // 크게 늘리고 감쇠율을 낮춰, 오래오래 정말 안 만날 때만 서서히 잊혀지게 했다.
  var DECAY_GRACE_DAYS = 300;
  var DECAY_PER_DAY = 0.02;

  function key(idA, idB) {
    return idA < idB ? idA + '_' + idB : idB + '_' + idA;
  }

  function get(idA, idB) {
    var e = affinity[key(idA, idB)];
    return e ? e.value : 0;
  }

  // 12장 성격 궁합 — 인코운터 확률 보정과 같은 조합, 여기선 획득량에 반영.
  function compatGain(pA, pB) {
    if (pA === 'extrovert' && pB === 'extrovert') return randInt(2, 3);
    if (pA === 'introvert' && pB === 'introvert') return 1;
    return randInt(1, 2);
  }

  function randInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }

  function recordInteraction(idA, idB, pA, pB) {
    var k = key(idA, idB);
    var e = affinity[k] || { value: 0, lastDay: 0 };
    e.value = Math.max(0, e.value + compatGain(pA, pB));
    e.lastDay = global.Time.getEraDays();
    affinity[k] = e;
    return e.value;
  }

  function decay(dt) {
    var today = global.Time.getEraDays();
    Object.keys(affinity).forEach(function (k) {
      var e = affinity[k];
      if (e.value > 0 && today - e.lastDay > DECAY_GRACE_DAYS) {
        e.value = Math.max(0, e.value - DECAY_PER_DAY * dt);
      }
    });
  }

  // 표시 문구(수치 비노출)
  function tierLabel(value) {
    if (value <= 0) return null;
    if (value < 5) return '안면이 있는 사이';
    if (value < 15) return '자주 마주치는 사이';
    if (value < 30) return '친한 사이';
    return '단짝';
  }

  // 20장 대화 풀 선택용 키
  function tierKey(value) {
    if (value <= 0) return 'first';
    if (value < 5) return 'acquaintance';
    if (value < 15) return 'frequent';
    if (value < 30) return 'close';
    return 'bestfriend';
  }

  function closestPartner(id) {
    var bestId = null, bestVal = -1;
    Object.keys(affinity).forEach(function (k) {
      var ids = k.split('_').map(Number);
      if (ids.indexOf(id) === -1) return;
      var otherId = ids[0] === id ? ids[1] : ids[0];
      var v = affinity[k].value;
      if (v > bestVal) { bestVal = v; bestId = otherId; }
    });
    return bestVal > 0 ? { id: bestId, value: bestVal } : null;
  }

  function serialize() { return { affinity: affinity }; }
  function restore(data) {
    affinity = (data && data.affinity) || {};
    return true;
  }

  global.Relationships = {
    get: get,
    recordInteraction: recordInteraction,
    decay: decay,
    tierLabel: tierLabel,
    tierKey: tierKey,
    closestPartner: closestPartner,
    serialize: serialize,
    restore: restore
  };
})(window);
