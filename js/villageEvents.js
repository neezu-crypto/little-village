// 14장: 소소한 마을 이벤트(장날/무지개/유성) + 11-1 스냅샷 트리거 연결.
(function (global) {
  var MARKET_CHECK_INTERVAL = 7; // 7일마다
  var MARKET_CHANCE = 0.40;
  var MARKET_DURATION_DAYS = 1;
  var RAINBOW_DURATION = 60; // Cycle 1구간(240/4)과 동일
  var METEOR_DURATION = 4;
  var METEOR_CHANCE = 0.05;
  var RAINBOW_CHANCE = 0.125; // 10~15% 중간값

  var marketDayActive = false;
  var marketDayEndDay = 0;
  var marketCheckAcc = 0;

  var rainbowActive = false;
  var rainbowTimer = 0;

  var meteorActive = false;
  var meteorTimer = 0;
  var meteorRolledThisNight = false;
  var lastPhase = null;

  var lastMajorityEraId = null;

  function updateMarketDay(dt) {
    if (marketDayActive) {
      if (global.Time.getEraDays() >= marketDayEndDay) marketDayActive = false;
      return;
    }
    marketCheckAcc += dt;
    if (marketCheckAcc < MARKET_CHECK_INTERVAL) return;
    marketCheckAcc = 0;
    if (Math.random() < MARKET_CHANCE) {
      marketDayActive = true;
      marketDayEndDay = global.Time.getEraDays() + MARKET_DURATION_DAYS;
    }
  }

  function triggerRainbow() {
    rainbowActive = true;
    rainbowTimer = RAINBOW_DURATION;
    global.Journal.captureSnapshot('비 온 뒤 무지개');
  }

  function updateRainbow(dt) {
    if (!rainbowActive) return;
    rainbowTimer -= dt;
    if (rainbowTimer <= 0) rainbowActive = false;
  }

  function triggerMeteor() {
    meteorActive = true;
    meteorTimer = METEOR_DURATION;
    global.Journal.captureSnapshot('밤하늘 유성');
  }

  function updateMeteor(dt) {
    var phase = global.Time.getPhaseName();
    if (phase !== lastPhase) {
      if (phase === 'night') meteorRolledThisNight = false;
      lastPhase = phase;
    }
    if (phase === 'night' && !meteorRolledThisNight) {
      meteorRolledThisNight = true;
      if (Math.random() < METEOR_CHANCE) triggerMeteor();
    }
    if (meteorActive) {
      meteorTimer -= dt;
      if (meteorTimer <= 0) meteorActive = false;
    }
  }

  // 6-2 팔레트가 실제로 다음 시대로 넘어가는 순간 스냅샷(11-1).
  function updateEraSnapshot() {
    var era = global.Village.getMajorityEra();
    if (lastMajorityEraId === null) { lastMajorityEraId = era.id; return; }
    if (era.id !== lastMajorityEraId) {
      lastMajorityEraId = era.id;
      global.Journal.captureSnapshot('시대 전환: ' + era.name);
    }
  }

  global.Weather.onWeatherTransition(function (prev, next) {
    if (prev === 'rain' && next === 'clear' && Math.random() < RAINBOW_CHANCE) triggerRainbow();
  });

  function isMarketDay() { return marketDayActive; }
  function isRainbowActive() { return rainbowActive; }
  function isMeteorActive() { return meteorActive; }

  function update(dt) {
    updateMarketDay(dt);
    updateMeteor(dt);
    updateRainbow(dt);
    updateEraSnapshot();
  }

  function serialize() {
    return { marketDayActive: marketDayActive, marketDayEndDay: marketDayEndDay, marketCheckAcc: marketCheckAcc, lastMajorityEraId: lastMajorityEraId };
  }
  function restore(data) {
    if (!data) return false;
    marketDayActive = data.marketDayActive || false;
    marketDayEndDay = data.marketDayEndDay || 0;
    marketCheckAcc = data.marketCheckAcc || 0;
    lastMajorityEraId = data.lastMajorityEraId || null;
    return true;
  }

  global.VillageEvents = {
    update: update,
    isMarketDay: isMarketDay,
    isRainbowActive: isRainbowActive,
    isMeteorActive: isMeteorActive,
    serialize: serialize,
    restore: restore
  };
})(window);
