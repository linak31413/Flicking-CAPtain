(function () {
  "use strict";

  window.FC = window.FC || {};

  function tablePath(id) {
    return "assets/images/tables/table-" + String(id).padStart(2, "0") + ".png";
  }

  window.FC.STAGES = [
    {
      id: 1,
      name: "표준 테이블",
      description: "장애물과 바람이 없는 기본 경기장",
      environment: "표준 길이, 장애물 없음, 바람 없음",
      width: 420,
      length: 1040,
      tableImage: tablePath(1),
      holes: [],
      wind: { strength: 0, angle: 0, mode: "none" },
      cpu: { angleError: 0.18, powerError: 0.18, learnRate: 0.22, types: ["plastic"] }
    },
    {
      id: 2,
      name: "긴 테이블",
      description: "목표선까지 거리가 길어 힘 조절이 중요함",
      environment: "긴 테이블, 장애물 없음, 바람 없음",
      width: 420,
      length: 1240,
      tableImage: tablePath(2),
      holes: [],
      wind: { strength: 0, angle: 0, mode: "none" },
      cpu: { angleError: 0.15, powerError: 0.16, learnRate: 0.28, types: ["plastic"] }
    },
    {
      id: 3,
      name: "짧은 테이블",
      description: "짧은 거리에서 과한 힘을 조심해야 함",
      environment: "짧은 테이블, 장애물 없음, 바람 없음",
      width: 420,
      length: 900,
      tableImage: tablePath(3),
      holes: [],
      wind: { strength: 0, angle: 0, mode: "none" },
      cpu: { angleError: 0.12, powerError: 0.13, learnRate: 0.34, types: ["plastic"] }
    },
    {
      id: 4,
      name: "중앙 구멍",
      description: "중앙 구멍을 피하면서 목표선에 접근해야 함",
      environment: "중앙에 작은 구멍 1개",
      width: 420,
      length: 1040,
      tableImage: tablePath(4),
      holes: [{ x: 210, y: 540, r: 34 }],
      wind: { strength: 0, angle: 0, mode: "none" },
      cpu: { angleError: 0.1, powerError: 0.11, learnRate: 0.42, types: ["plastic", "metal"] }
    },
    {
      id: 5,
      name: "옆바람",
      description: "약한 일정 방향 바람이 궤적을 밀어냄",
      environment: "약한 일정 방향 바람",
      width: 420,
      length: 1040,
      tableImage: tablePath(5),
      holes: [],
      wind: { strength: 30, angle: 0, mode: "constant" },
      cpu: { angleError: 0.09, powerError: 0.1, learnRate: 0.52, types: ["plastic", "paper"] }
    },
    {
      id: 6,
      name: "좁은 통로",
      description: "두 구멍 사이의 안전 통로를 노리는 경기장",
      environment: "구멍 2개와 좁은 안전 통로",
      width: 420,
      length: 1120,
      tableImage: tablePath(6),
      holes: [{ x: 142, y: 600, r: 36 }, { x: 278, y: 600, r: 36 }],
      wind: { strength: 0, angle: 0, mode: "none" },
      cpu: { angleError: 0.075, powerError: 0.085, learnRate: 0.58, types: ["plastic", "metal", "sticky"] }
    },
    {
      id: 7,
      name: "변덕 바람",
      description: "방향이 주기적으로 바뀌는 바람이 흐름을 흔듦",
      environment: "방향이 주기적으로 바뀌는 바람",
      width: 420,
      length: 1080,
      tableImage: tablePath(7),
      holes: [],
      wind: { strength: 36, angle: 0, mode: "sine", period: 4.8 },
      cpu: { angleError: 0.055, powerError: 0.07, learnRate: 0.66, types: ["plastic", "paper", "ice"] }
    },
    {
      id: 8,
      name: "캡틴 코스",
      description: "긴 거리, 구멍, 바람이 함께 등장하는 최종 경기장",
      environment: "긴 테이블, 구멍, 바람 조합",
      width: 420,
      length: 1260,
      tableImage: tablePath(8),
      holes: [{ x: 125, y: 600, r: 32 }, { x: 295, y: 800, r: 38 }],
      wind: { strength: 32, angle: Math.PI, mode: "sine", period: 5.4 },
      cpu: { angleError: 0.038, powerError: 0.052, learnRate: 0.76, types: ["plastic", "metal", "paper", "sticky", "ice"] }
    }
  ];

  window.FC.getStage = function (stageId) {
    return window.FC.STAGES[Math.max(0, Math.min(window.FC.STAGES.length - 1, stageId - 1))];
  };
})();
