(function () {
  "use strict";

  var FC = window.FC;
  var CONFIG = FC.CONFIG;

  function capType(type) {
    return CONFIG.capTypes[type];
  }

  function makeCap(game, owner, type, index) {
    var info = capType(type);
    var offsets = [-44, 0, 44];
    var x = game.stage.width / 2 + offsets[index % offsets.length];
    return {
      id: owner + "-" + index + "-" + Date.now(),
      owner: owner,
      type: type,
      x: x,
      y: game.startY,
      vx: 0,
      vy: 0,
      radius: info.radius,
      active: true,
      fired: false,
      fixed: false,
      eliminated: false,
      groupId: null,
      order: index + 1
    };
  }

  function otherTurn(turn) {
    return turn === CONFIG.owners.PLAYER ? CONFIG.owners.CPU : CONFIG.owners.PLAYER;
  }

  function firstTurn() {
    return Math.random() < 0.5 ? CONFIG.owners.PLAYER : CONFIG.owners.CPU;
  }

  function createGame(stageId) {
    var stage = FC.getStage(stageId);
    var startY = stage.length * CONFIG.physics.startRatio;
    var targetY = stage.length * CONFIG.physics.targetRatio;
    return {
      stage: Object.assign({}, stage, {
        holes: stage.holes.map(function (hole) { return Object.assign({}, hole); }),
        startY: startY,
        targetY: targetY
      }),
      status: CONFIG.gameStatus.READY,
      turn: firstTurn(),
      startY: startY,
      shotCount: 0,
      shotsByOwner: { player: 0, cpu: 0 },
      caps: [],
      currentCap: null,
      lastFiredCap: null,
      groupSeed: 0,
      elapsed: 0,
      settleTimer: 0,
      cpuTimer: null,
      paused: false,
      message: "",
      aim: null,
      tutorialDismissed: false,
      cpuMemory: { aimBiasX: 0, powerBiasY: 0, powerBoost: 0 },
      result: null
    };
  }

  function rankCaps(game) {
    return game.caps.filter(function (cap) {
      return cap.active && cap.fired;
    }).map(function (cap) {
      return {
        owner: cap.owner,
        type: cap.type,
        distance: Math.abs(cap.y - game.stage.targetY),
        x: cap.x,
        y: cap.y
      };
    }).sort(function (a, b) {
      return a.distance - b.distance;
    });
  }

  function applyReward(game, outcome) {
    var data = FC.state.data;
    if (outcome !== "win") return { reward: 0, unlocked: false };
    var index = game.stage.id - 1;
    var first = data.wins[index] === 0;
    var reward = first ? 3 : 1;
    var unlocked = false;
    data.coins += reward;
    data.wins[index] += 1;
    data.cleared[index] = true;
    if (game.stage.id < 8 && data.unlockedStage < game.stage.id + 1) {
      data.unlockedStage = game.stage.id + 1;
      unlocked = true;
    }
    FC.Storage.save(data);
    return { reward: reward, unlocked: unlocked };
  }

  function makeResult(game) {
    var ranks = rankCaps(game);
    var outcome = "draw";
    if (ranks.length > 0) {
      if (ranks.length > 1 && Math.abs(ranks[0].distance - ranks[1].distance) <= CONFIG.physics.resultTieDistance) {
        outcome = "draw";
      } else {
        outcome = ranks[0].owner === CONFIG.owners.PLAYER ? "win" : "lose";
      }
    }
    var reward = applyReward(game, outcome);
    var title = outcome === "win" ? "승리" : outcome === "lose" ? "패배" : "무승부";
    var summary = outcome === "win"
      ? "획득 코인 " + reward.reward + (reward.unlocked ? " / 다음 스테이지 해금" : "")
      : "보상과 해금은 없습니다.";
    return {
      stageId: game.stage.id,
      outcome: outcome,
      title: title,
      summary: summary,
      ranks: ranks,
      reward: reward.reward,
      unlocked: reward.unlocked
    };
  }

  FC.Game = {
    start: function (stageId) {
      FC.state.selectedStage = stageId;
      FC.state.game = createGame(stageId);
      this.spawnCurrentCap();
      FC.UI.showScreen(CONFIG.screen.GAME);
      FC.Renderer.resize();
      FC.Camera.reset(FC.state.game);
      FC.Renderer.draw(FC.state.game);
      FC.UI.updateHud();
      FC.Audio.playSfx("game-start");
      FC.Audio.vibrate(30);
    },
    restart: function () {
      var stageId = FC.state.game ? FC.state.game.stage.id : FC.state.selectedStage;
      FC.UI.showPause(false);
      this.start(stageId);
    },
    pause: function () {
      var game = FC.state.game;
      if (!game) return;
      game.paused = true;
      FC.UI.showPause(true);
      FC.Audio.playSfx("ui-click");
    },
    resume: function () {
      var game = FC.state.game;
      if (!game) return;
      game.paused = false;
      FC.UI.showPause(false);
      FC.Audio.playSfx("ui-click");
    },
    quitToMain: function () {
      if (FC.state.game) FC.state.game.paused = false;
      FC.UI.showPause(false);
      FC.UI.showScreen(CONFIG.screen.MAIN);
    },
    spawnCurrentCap: function () {
      var game = FC.state.game;
      if (!game || game.currentCap) return;
      var owner = game.turn;
      var index = game.shotsByOwner[owner];
      var type = owner === CONFIG.owners.PLAYER ? FC.state.data.slots[index] : FC.CPU.chooseType(game);
      var cap = makeCap(game, owner, type, index);
      game.caps.push(cap);
      game.currentCap = cap;
      game.status = CONFIG.gameStatus.READY;
      game.message = owner === CONFIG.owners.PLAYER ? "병뚜껑을 당겨 발사" : "CPU 조준 중";
      game.cpuTimer = owner === CONFIG.owners.CPU ? 0.55 + Math.random() * 0.55 : null;
    },
    fireCurrent: function (velocity) {
      var game = FC.state.game;
      if (!game || !game.currentCap || game.status !== CONFIG.gameStatus.READY) return;
      var cap = game.currentCap;
      cap.fired = true;
      cap.vx = velocity.vx;
      cap.vy = velocity.vy;
      game.lastFiredCap = cap;
      game.currentCap = null;
      game.status = CONFIG.gameStatus.PLAYING;
      game.settleTimer = 0;
      game.cpuTimer = null;
      game.message = "이동 중";
      FC.Audio.playSfx("cap-flick");
      FC.Audio.vibrate(18);
    },
    endShot: function () {
      var game = FC.state.game;
      if (!game || game.status !== CONFIG.gameStatus.PLAYING) return;
      if (game.lastFiredCap && game.lastFiredCap.owner === CONFIG.owners.CPU) {
        FC.CPU.observe(game, game.lastFiredCap);
      }
      game.shotsByOwner[game.lastFiredCap.owner] += 1;
      game.shotCount += 1;
      if (game.shotCount >= 6) {
        this.finish();
        return;
      }
      game.turn = otherTurn(game.turn);
      game.status = CONFIG.gameStatus.READY;
      game.lastFiredCap = null;
      this.spawnCurrentCap();
      FC.Audio.playSfx("turn-change");
    },
    finish: function () {
      var game = FC.state.game;
      game.status = CONFIG.gameStatus.GAME_OVER;
      game.result = makeResult(game);
      FC.UI.updateAll();
      FC.Audio.playSfx(game.result.outcome === "win" ? "win" : "lose");
      FC.Audio.vibrate(game.result.outcome === "win" ? [25, 40, 25] : 45);
      FC.UI.showResult(game.result);
    },
    update: function (dt) {
      var game = FC.state.game;
      if (!game) return;
      if (!game.paused) {
        game.elapsed += dt;
        if (game.status === CONFIG.gameStatus.READY && game.turn === CONFIG.owners.CPU) {
          game.cpuTimer -= dt;
          if (game.cpuTimer <= 0 && game.currentCap) {
            this.fireCurrent(FC.CPU.makeShot(game, game.currentCap));
          }
        } else if (game.status === CONFIG.gameStatus.PLAYING) {
          FC.Physics.update(game, dt);
          if (FC.Physics.hasMovingCaps(game)) {
            game.settleTimer = 0;
            if (Math.random() < 0.02) FC.Audio.playSfx("cap-slide");
          } else {
            game.settleTimer += dt;
            if (game.settleTimer >= CONFIG.physics.settleDelay) this.endShot();
          }
        }
      }
      FC.Camera.update(game, dt);
      FC.Sprites.update(dt, game.paused);
      FC.Renderer.draw(game);
      FC.UI.updateHud();
    }
  };
})();
