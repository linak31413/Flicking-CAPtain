(function () {
  "use strict";

  var FC = window.FC;

  FC.Camera = {
    y: 0,
    targetY: 0,
    reset: function (game) {
      this.y = this.getStartTarget(game);
      this.targetY = this.y;
    },
    getStartTarget: function (game) {
      if (!game || !game.stage) return 0;
      var view = FC.Renderer ? FC.Renderer.viewHeight : 640;
      if (!Number.isFinite(view) || view <= 0) view = 640;
      return Math.max(0, Math.min(game.stage.length - view, game.startY - view * 0.68));
    },
    update: function (game, dt) {
      if (!game || !game.stage || !FC.Renderer) return;
      var view = FC.Renderer.viewHeight;
      if (!Number.isFinite(view) || view <= 0) view = 640;
      if (!Number.isFinite(this.y)) this.reset(game);
      var target = this.getStartTarget(game);
      var moving = game.caps.find(function (cap) {
        return cap.active && cap.fired && !cap.fixed && Math.hypot(cap.vx, cap.vy) > 12;
      });
      if (moving) {
        target = moving.y - view * 0.48;
      } else if (game.status === FC.CONFIG.gameStatus.GAME_OVER) {
        target = game.stage.targetY - view * 0.24;
      }
      target = Math.max(0, Math.min(game.stage.length - view, target));
      this.targetY = target;
      var reduce = FC.state.data && FC.state.data.settings.reduceMotion;
      var rate = reduce ? 1 : 1 - Math.pow(0.001, dt);
      this.y += (this.targetY - this.y) * Math.min(1, rate);
    }
  };
})();
