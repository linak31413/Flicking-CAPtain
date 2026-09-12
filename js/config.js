(function () {
  "use strict";

  window.FC = window.FC || {};

  var CAP_TYPES = {
    plastic: {
      id: "plastic",
      name: "플라스틱",
      shortName: "PL",
      description: "속도, 질량, 반발력이 고른 기본 병뚜껑",
      image: "assets/images/caps/cap-plastic.png",
      sound: "hit-plastic",
      color: "#3ca5d8",
      mass: 1,
      radius: 23,
      maxSpeed: 760,
      friction: 170,
      restitution: 0.56,
      special: "normal"
    },
    metal: {
      id: "metal",
      name: "쇠",
      shortName: "MT",
      description: "느리지만 무겁고 충돌에서 강하게 밀어냄",
      image: "assets/images/caps/cap-metal.png",
      sound: "hit-metal",
      color: "#a6b0b8",
      mass: 1.75,
      radius: 24,
      maxSpeed: 620,
      friction: 145,
      restitution: 0.62,
      special: "normal"
    },
    paper: {
      id: "paper",
      name: "종이",
      shortName: "PP",
      description: "빠르게 날아가지만 가볍고 쉽게 밀림",
      image: "assets/images/caps/cap-paper.png",
      sound: "hit-paper",
      color: "#f1c84b",
      mass: 0.62,
      radius: 22,
      maxSpeed: 880,
      friction: 205,
      restitution: 0.45,
      special: "normal"
    },
    sticky: {
      id: "sticky",
      name: "끈끈이",
      shortName: "ST",
      description: "일반 병뚜껑과 충돌하면 붙어서 함께 이동",
      image: "assets/images/caps/cap-sticky.png",
      sound: "hit-sticky",
      color: "#8d61c7",
      mass: 1.05,
      radius: 23,
      maxSpeed: 700,
      friction: 165,
      restitution: 0.28,
      special: "sticky"
    },
    ice: {
      id: "ice",
      name: "얼음",
      shortName: "IC",
      description: "마찰 감속 없이 미끄러지고 충돌하면 고정됨",
      image: "assets/images/caps/cap-ice.png",
      sound: "hit-ice",
      color: "#84d6ef",
      mass: 0.9,
      radius: 23,
      maxSpeed: 760,
      friction: 0,
      restitution: 0.5,
      special: "ice"
    }
  };

  window.FC.CONFIG = {
    storageKey: "flicking-captain-save-v1",
    screen: {
      MAIN: "MAIN",
      STAGE_SELECT: "STAGE_SELECT",
      SHOP: "SHOP",
      GAME: "GAME",
      RESULT: "RESULT"
    },
    gameStatus: {
      READY: "READY",
      PLAYING: "PLAYING",
      GAME_OVER: "GAME_OVER"
    },
    owners: {
      PLAYER: "player",
      CPU: "cpu"
    },
    capTypes: CAP_TYPES,
    capOrder: ["plastic", "metal", "paper", "sticky", "ice"],
    shopTypes: ["metal", "paper", "sticky", "ice"],
    physics: {
      boardInsetRatio: 0.05,
      startRatio: 0.9,
      targetRatio: 0.1,
      stopSpeed: 8,
      minFlickDistance: 14,
      maxDragDistance: 150,
      maxFrameDt: 0.034,
      substep: 0.008,
      settleDelay: 0.38,
      resultTieDistance: 7,
      maxEffects: 34
    },
    audio: {
      bgm: {
        menu: "assets/audio/bgm/bgm-menu.mp3",
        game: "assets/audio/bgm/bgm-game.mp3"
      },
      sfx: {
        "game-start": "assets/audio/sfx/game-start.mp3",
        "aim-pull": "assets/audio/sfx/aim-pull.mp3",
        "cap-flick": "assets/audio/sfx/cap-flick.mp3",
        "cap-slide": "assets/audio/sfx/cap-slide.mp3",
        "cap-fall": "assets/audio/sfx/cap-fall.mp3",
        "hit-plastic": "assets/audio/sfx/hit-plastic.mp3",
        "hit-metal": "assets/audio/sfx/hit-metal.mp3",
        "hit-paper": "assets/audio/sfx/hit-paper.mp3",
        "hit-sticky": "assets/audio/sfx/hit-sticky.mp3",
        "hit-ice": "assets/audio/sfx/hit-ice.mp3",
        "turn-change": "assets/audio/sfx/turn-change.mp3",
        "coin-get": "assets/audio/sfx/coin-get.mp3",
        buy: "assets/audio/sfx/buy.mp3",
        win: "assets/audio/sfx/win.mp3",
        lose: "assets/audio/sfx/lose.mp3",
        "ui-click": "assets/audio/sfx/ui-click.mp3"
      }
    },
    images: {
      logo: "assets/images/logo.png",
      hole: "assets/images/ui/hole.png",
      coin: "assets/images/ui/coin.png",
      windIndicator: "assets/images/ui/wind-indicator.png",
      resultWin: "assets/images/ui/result-win.png",
      resultLose: "assets/images/ui/result-lose.png",
      uiIcons: "assets/images/ui/ui-icons.png",
      sheets: {
        fall: { path: "assets/images/ui/cap-fall-sheet.png", cols: 6, rows: 1, fps: 16, loop: false },
        coin: { path: "assets/images/ui/coin-spin-sheet.png", cols: 8, rows: 1, fps: 12, loop: true },
        ice: { path: "assets/images/ui/ice-lock-sheet.png", cols: 6, rows: 1, fps: 14, loop: false },
        impact: { path: "assets/images/ui/impact-sheet.png", cols: 6, rows: 1, fps: 18, loop: false },
        sticky: { path: "assets/images/ui/sticky-link-sheet.png", cols: 6, rows: 1, fps: 14, loop: false },
        wind: { path: "assets/images/ui/wind-sheet.png", cols: 6, rows: 1, fps: 10, loop: true }
      }
    }
  };
})();
