// 15장: 간접 개입("바닥에 놓기") — 아이템 배치, 하루 3개 제한, 1일 내 안 주우면 소멸.
(function (global) {
  var ITEM_TYPES = {
    bread: { needKey: 'hunger', icon: '🍞' },
    apple: { needKey: 'hunger', icon: '🍎' },
    chair: { needKey: 'fatigue', icon: '🪑' },
    parasol: { needKey: 'fatigue', icon: '⛱' },
    letter: { needKey: 'loneliness', icon: '✉️' },
    flower: { needKey: 'loneliness', icon: '💐' }
  };
  var DAILY_LIMIT = 3;
  var DESPAWN_DAYS = 1;

  var items = [];
  var nextItemId = 1;
  var placedToday = 0;
  var lastResetDay = 0;

  function resetDailyIfNeeded() {
    var today = Math.floor(global.Time.getEraDays());
    if (today > lastResetDay) {
      lastResetDay = today;
      placedToday = 0;
    }
  }

  function getRemainingToday() {
    resetDailyIfNeeded();
    return Math.max(0, DAILY_LIMIT - placedToday);
  }

  function placeItem(type, x) {
    if (!ITEM_TYPES[type]) return null;
    resetDailyIfNeeded();
    if (placedToday >= DAILY_LIMIT) return null;
    var item = {
      id: nextItemId++,
      type: type,
      needKey: ITEM_TYPES[type].needKey,
      x: x,
      spawnDay: global.Time.getEraDays()
    };
    items.push(item);
    placedToday += 1;
    return item;
  }

  function update() {
    var today = global.Time.getEraDays();
    items = items.filter(function (it) { return today - it.spawnDay < DESPAWN_DAYS; });
  }

  // 8-4 weight.item — 배치된 아이템 중 해당 욕구값이 가장 높은 것 하나만 후보로.
  function pickBestItem(v) {
    var best = null, bestWeight = 0;
    items.forEach(function (it) {
      var w = v.needs[it.needKey];
      if (w > bestWeight) { bestWeight = w; best = it; }
    });
    return best ? { item: best, weight: bestWeight } : null;
  }

  function consumeItem(id) {
    var idx = -1;
    for (var i = 0; i < items.length; i++) if (items[i].id === id) { idx = i; break; }
    if (idx === -1) return null;
    var item = items[idx];
    items.splice(idx, 1);
    return item;
  }

  function getItems() { return items; }
  function getItemTypes() { return ITEM_TYPES; }

  function serialize() {
    return { items: items, nextItemId: nextItemId, placedToday: placedToday, lastResetDay: lastResetDay };
  }
  function restore(data) {
    if (!data) return false;
    items = data.items || [];
    nextItemId = data.nextItemId || 1;
    placedToday = data.placedToday || 0;
    lastResetDay = data.lastResetDay || 0;
    return true;
  }

  global.Intervention = {
    placeItem: placeItem,
    update: update,
    pickBestItem: pickBestItem,
    consumeItem: consumeItem,
    getItems: getItems,
    getItemTypes: getItemTypes,
    getRemainingToday: getRemainingToday,
    serialize: serialize,
    restore: restore
  };
})(window);
