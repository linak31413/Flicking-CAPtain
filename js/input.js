(function () {
  "use strict";

  var FC = window.FC;
  var CONFIG = FC.CONFIG;

  function canAim(game) {
    return game &&
      FC.state.screen === CONFIG.screen.GAME &&
      !game.paused &&
      game.status === CONFIG.gameStatus.READY &&
      game.turn === CONFIG.owners.PLAYER &&
      game.currentCap &&
      game.currentCap.active;
  }

  function capHit(cap, pos) {
    return Math.hypot(cap.x - pos.x, cap.y - pos.y) <= cap.radius * 1.55;
  }

  function clampAim(start, pos) {
    var dx = pos.x - start.x;
    var dy = pos.y - start.y;
    var distance = Math.hypot(dx, dy);
    var max = CONFIG.physics.maxDragDistance;
    if (distance > max) {
      dx = dx / distance * max;
      dy = dy / distance * max;
      distance = max;
    }
    return { x: start.x + dx, y: start.y + dy, distance: distance };
  }

  FC.Input = {
    pointerId: null,
    init: function () {
      var canvas = document.getElementById("gameCanvas");
      canvas.addEventListener("pointerdown", this.onDown.bind(this));
      window.addEventListener("pointermove", this.onMove.bind(this));
      window.addEventListener("pointerup", this.onUp.bind(this));
      window.addEventListener("pointercancel", this.cancel.bind(this));
      canvas.addEventListener("contextmenu", function (event) {
        event.preventDefault();
      });
    },
    onDown: function (event) {
      FC.Audio.unlock();
      var game = FC.state.game;
      if (!canAim(game)) return;
      var pos = FC.Renderer.screenToWorld(event.clientX, event.clientY);
      if (!capHit(game.currentCap, pos)) return;
      event.preventDefault();
      game.tutorialDismissed = true;
      FC.UI.updateTutorial();
      this.pointerId = event.pointerId;
      FC.Renderer.canvas.setPointerCapture(event.pointerId);
      game.aim = {
        active: true,
        start: { x: game.currentCap.x, y: game.currentCap.y },
        current: { x: game.currentCap.x, y: game.currentCap.y },
        distance: 0
      };
      FC.Audio.playSfx("aim-pull");
    },
    onMove: function (event) {
      var game = FC.state.game;
      if (!game || !game.aim || !game.aim.active || event.pointerId !== this.pointerId) return;
      event.preventDefault();
      var pos = FC.Renderer.screenToWorld(event.clientX, event.clientY);
      var clamped = clampAim(game.aim.start, pos);
      game.aim.current = { x: clamped.x, y: clamped.y };
      game.aim.distance = clamped.distance;
    },
    onUp: function (event) {
      var game = FC.state.game;
      if (!game || !game.aim || !game.aim.active || event.pointerId !== this.pointerId) return;
      event.preventDefault();
      var aim = game.aim;
      if (aim.distance < CONFIG.physics.minFlickDistance) {
        this.cancel();
        return;
      }
      var dx = aim.start.x - aim.current.x;
      var dy = aim.start.y - aim.current.y;
      var length = Math.hypot(dx, dy) || 1;
      var type = CONFIG.capTypes[game.currentCap.type];
      var power = Math.min(1, aim.distance / CONFIG.physics.maxDragDistance);
      var speed = type.maxSpeed * (0.28 + 0.72 * power);
      game.aim = null;
      this.pointerId = null;
      FC.Game.fireCurrent({ vx: dx / length * speed, vy: dy / length * speed });
    },
    cancel: function () {
      var game = FC.state.game;
      if (game) game.aim = null;
      this.pointerId = null;
    }
  };
})();
