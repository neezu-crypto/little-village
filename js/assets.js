// 19장: 가축(생업 자산) + 차량(과시 자산) 구매. 7일마다 villagers.js가 호출.
(function (global) {
  var LIVESTOCK_TYPES = ['chicken', 'goat', 'cow'];
  var LIVESTOCK_COST = 30;
  var FARM_WORK_WINDOW_DAYS = 30;

  function pruneFarmWork(v) {
    var today = global.Time.getEraDays();
    v.recentFarmWork = v.recentFarmWork.filter(function (day) { return today - day <= FARM_WORK_WINDOW_DAYS; });
  }

  // 19-1: 최근 30일 내 텃밭/모닥불 작업 5회 이상 + wealth 30 이상 -> 20% 확률 구매
  function checkLivestock(v) {
    if (v.assets.livestock) return;
    pruneFarmWork(v);
    if (v.recentFarmWork.length < 5) return;
    if (v.wealth < LIVESTOCK_COST) return;
    if (Math.random() < 0.20) {
      v.wealth -= LIVESTOCK_COST;
      v.assets.livestock = LIVESTOCK_TYPES[Math.floor(Math.random() * LIVESTOCK_TYPES.length)];
    }
  }

  // 19-2: 과시욕 50 이상 + 해당 시대 차량 비용 이상 -> 15% 확률 구매, 과시욕 해소
  function checkVehicle(v) {
    if (v.assets.vehicle) return;
    var era = global.WorldState.currentEra;
    if (!era.vehicle) return; // 원시시대는 탈것 없음(19-2)
    if (v.needs.vanity < 50) return;
    if (v.wealth < era.vehicle.cost) return;
    if (Math.random() < 0.15) {
      v.wealth -= era.vehicle.cost;
      v.needs.vanity = 0;
      v.assets.vehicle = era.vehicle.label;
    }
  }

  function checkPurchase(v) {
    checkLivestock(v);
    checkVehicle(v);
  }

  global.Assets = { checkPurchase: checkPurchase };
})(window);
