(function () {
  "use strict";

  var FC = window.FC;
  var CONFIG = FC.CONFIG;

  function randomRange(amount) {
    return (Math.random() * 2 - 1) * amount;
  }

  function rotate(vx, vy, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    return { x: vx * c - vy * s, y: vx * s + vy * c };
  }

  function pathHitsHole(stage, x) {
    return stage.holes.some(function (hole) {
      return Math.abs(hole.x - x) < hole.r + 26;
    });
  }

  FC.CPU = {
    chooseType: function (game) {
      var list = game.stage.cpu.types;
      var index = game.shotsByOwner.cpu % list.length;
      return list[index] || "plastic";
    },
    makeShot: function (game, cap) {
      var stage = game.stage;
      var type = CONFIG.capTypes[cap.type];
      var cpu = stage.cpu;
      var targetX = stage.width / 2 + game.cpuMemory.aimBiasX;
      if (pathHitsHole(stage, targetX)) {
        targetX += game.shotsByOwner.cpu % 2 === 0 ? 74 : -74;
      }
      targetX = Math.max(58, Math.min(stage.width - 58, targetX));
      var targetY = stage.targetY + 18 + game.cpuMemory.powerBiasY;
      var dx = targetX - cap.x;
      var dy = targetY - cap.y;
      var len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      var wind = FC.Physics.windVector(stage, game.elapsed);
      dx -= wind.x * 0.0009 * (0.45 + cpu.learnRate);
      var angleError = randomRange(cpu.angleError);
      var vector = rotate(dx, dy, angleError);
      var lengthRatio = (stage.length - 820) / 520;
      var basePower = 0.72 + Math.max(0, Math.min(0.18, lengthRatio * 0.12));
      var power = basePower + randomRange(cpu.powerError) + game.cpuMemory.powerBoost;
      power = Math.max(0.42, Math.min(1, power));
      return {
        vx: vector.x * type.maxSpeed * power,
        vy: vector.y * type.maxSpeed * power
      };
    },
    observe: function (game, cap) {
      if (!cap || cap.owner !== CONFIG.owners.CPU) return;
      var cpu = game.stage.cpu;
      if (cap.active) {
        var targetX = game.stage.width / 2;
        var xError = cap.x - targetX;
        var yError = cap.y - game.stage.targetY;
        game.cpuMemory.aimBiasX -= xError * 0.08 * cpu.learnRate;
        game.cpuMemory.powerBiasY -= yError * 0.04 * cpu.learnRate;
        game.cpuMemory.powerBoost += yError > 90 ? 0.025 * cpu.learnRate : -0.012 * cpu.learnRate;
      } else {
        game.cpuMemory.powerBoost -= 0.025 * cpu.learnRate;
      }
      game.cpuMemory.aimBiasX = Math.max(-70, Math.min(70, game.cpuMemory.aimBiasX));
      game.cpuMemory.powerBiasY = Math.max(-80, Math.min(80, game.cpuMemory.powerBiasY));
      game.cpuMemory.powerBoost = Math.max(-0.12, Math.min(0.13, game.cpuMemory.powerBoost));
    }
  };
})();
