// 기획서 6장/17-2/25-2 기준 시대 데이터.
// startDay는 문서에 없던 값이라 임시로 정한 페이싱 — 플레이테스트 후 조정 가능.
(function (global) {
  var ERAS = [
    {
      id: 'primitive',
      name: '원시시대',
      startDay: 0,
      populationCapRange: [6, 8],
      residentsPerBuilding: 3,
      wallColor: '#A67C52',
      roofColor: '#6B4A2F',
      accentColor: '#E8763C',
      roofType: 'cone',
      skyColor: '#8B6B4A',
      groundColor: '#3E4A34',
      buildingGrades: [
        { label: '허름한 움집', cost: 0 },
        { label: '화덕 딸린 움집', cost: 20 },
        { label: '짐승가죽 보강 큰 움집', cost: 45 }
      ],
      workWealth: { field: [2, 4], shop: [4, 7], hearth: [2, 4] },
      wealthMultiplier: 1.0,
      vehicle: null
    },
    {
      id: 'agrarian',
      name: '농경시대',
      startDay: 600,
      populationCapRange: [8, 10],
      residentsPerBuilding: 2,
      wallColor: '#C9A063',
      roofColor: '#D4B96A',
      accentColor: '#6FAE5C',
      roofType: 'gable-wide',
      skyColor: '#D9C97A',
      groundColor: '#8FB8D8',
      buildingGrades: [
        { label: '낡은 초가집', cost: 0 },
        { label: '담장 두른 초가집', cost: 25 },
        { label: '기와지붕 초가집', cost: 55 }
      ],
      workWealth: { field: [2, 4], shop: [4, 7], hearth: [0, 0] },
      wealthMultiplier: 1.2,
      vehicle: { label: '소달구지', cost: 40 }
    },
    {
      id: 'ancient',
      name: '고대/성곽시대',
      startDay: 1300,
      populationCapRange: [9, 12],
      residentsPerBuilding: 2,
      wallColor: '#B7B2A4',
      roofColor: '#8C8677',
      accentColor: '#B89A5A',
      roofType: 'gable-low',
      skyColor: '#C9C4B8',
      groundColor: '#5C8A82',
      buildingGrades: [
        { label: '흙벽돌 가옥', cost: 0 },
        { label: '석조 가옥', cost: 30 },
        { label: '정원 딸린 석조 저택', cost: 65 }
      ],
      workWealth: { field: [2, 4], shop: [4, 7], hearth: [0, 0] },
      wealthMultiplier: 1.4,
      vehicle: { label: '마차', cost: 50 }
    },
    {
      id: 'medieval',
      name: '중세',
      startDay: 2100,
      populationCapRange: [10, 13],
      residentsPerBuilding: 2,
      wallColor: '#8B4A3B',
      roofColor: '#4A4A4A',
      accentColor: '#3C4F6E',
      roofType: 'gable-steep',
      skyColor: '#9C5B4A',
      groundColor: '#8A8A8A',
      buildingGrades: [
        { label: '나무 골조집', cost: 0 },
        { label: '벽돌집', cost: 35 },
        { label: '이층 벽돌 저택', cost: 75 }
      ],
      workWealth: { field: [2, 4], shop: [4, 7], hearth: [0, 0] },
      wealthMultiplier: 1.6,
      vehicle: { label: '마차(개량형)', cost: 60 }
    },
    {
      id: 'industrial',
      name: '근대(산업화)',
      startDay: 3000,
      populationCapRange: [12, 15],
      residentsPerBuilding: null, // 1~2명 랜덤 (건물별)
      wallColor: '#6E6259',
      roofColor: '#3A3A3A',
      accentColor: '#B25A2E',
      roofType: 'flat',
      skyColor: '#7A7268',
      groundColor: '#A0A8AC',
      buildingGrades: [
        { label: '좁은 연립주택', cost: 0 },
        { label: '발코니 딸린 연립주택', cost: 40 },
        { label: '넓은 단독 벽돌집', cost: 85 }
      ],
      workWealth: { field: [2, 4], shop: [4, 7], hearth: [0, 0] },
      wealthMultiplier: 2.0,
      vehicle: { label: '초기 자동차', cost: 70 }
    },
    {
      id: 'modern',
      name: '현대',
      startDay: 4000,
      populationCapRange: [12, 18],
      residentsPerBuilding: 1,
      wallColor: '#8891A0',
      roofColor: '#45505E',
      accentColor: '#5CC2D9',
      roofType: 'flat-glass',
      skyColor: '#6E7C8C',
      groundColor: '#C9C4E0',
      buildingGrades: [
        { label: '소형 아파트', cost: 0 },
        { label: '중형 아파트', cost: 45 },
        { label: '테라스 딸린 고급 아파트', cost: 95 }
      ],
      workWealth: { field: [2, 4], shop: [4, 7], hearth: [0, 0] },
      wealthMultiplier: 2.5,
      vehicle: { label: '자동차', cost: 90 }
    }
  ];

  var PERSONALITIES = [
    { id: 'extrovert', label: '외향적', lonelinessMul: 2.0, hungerMul: 1.0, fatigueMul: 1.0, socialWeightMul: 1.5, randomWeightMul: 1.0, restDurationMul: 0.8, moveOutMul: 1.5, moveInWeight: 1.3, wealthMul: 1.0 },
    { id: 'introvert', label: '내향적', lonelinessMul: 0.5, hungerMul: 1.0, fatigueMul: 1.0, socialWeightMul: 0.6, randomWeightMul: 0.8, restDurationMul: 1.3, moveOutMul: 0.6, moveInWeight: 0.6, wealthMul: 1.0 },
    { id: 'diligent', label: '부지런함', lonelinessMul: 1.0, hungerMul: 1.2, fatigueMul: 0.8, socialWeightMul: 1.0, randomWeightMul: 0.7, restDurationMul: 0.7, moveOutMul: 0.8, moveInWeight: 1.0, wealthMul: 1.3 },
    { id: 'lazy', label: '게으름', lonelinessMul: 1.0, hungerMul: 0.8, fatigueMul: 1.3, socialWeightMul: 1.0, randomWeightMul: 0.9, restDurationMul: 1.5, moveOutMul: 0.9, moveInWeight: 0.8, wealthMul: 0.7 },
    { id: 'curious', label: '호기심 많음', lonelinessMul: 1.0, hungerMul: 1.0, fatigueMul: 1.0, socialWeightMul: 1.0, randomWeightMul: 2.0, restDurationMul: 0.9, moveOutMul: 1.6, moveInWeight: 1.4, wealthMul: 1.0 }
  ];

  global.ERAS = ERAS;
  global.PERSONALITIES = PERSONALITIES;
})(window);
