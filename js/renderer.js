(function () {
  "use strict";

  var FC = window.FC;
  var CONFIG = FC.CONFIG;

  var Renderer = {
    canvas: null,
    ctx: null,
    scale: 1,
    viewHeight: 720,
    init: function () {
      this.canvas = document.getElementById("gameCanvas");
      this.ctx = this.canvas.getContext("2d");
      window.addEventListener("resize", this.resize.bind(this));
      this.resize();
    },
    resize: function () {
      if (!this.canvas) return;
      var rect = this.canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      var dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var game = FC.state.game;
      var width = game && game.stage ? game.stage.width : 420;
      this.scale = rect.width / width;
      this.viewHeight = rect.height / this.scale;
    },
    worldToScreen: function (x, y) {
      return { x: x * this.scale, y: (y - FC.Camera.y) * this.scale };
    },
    screenToWorld: function (clientX, clientY) {
      var rect = this.canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left) / this.scale,
        y: (clientY - rect.top) / this.scale + FC.Camera.y
      };
    },
    clear: function () {
      var rect = this.canvas.getBoundingClientRect();
      this.ctx.clearRect(0, 0, rect.width, rect.height);
      this.ctx.fillStyle = "#132832";
      this.ctx.fillRect(0, 0, rect.width, rect.height);
    },
    draw: function (game) {
      this.resize();
      this.clear();
      if (!game) return;
      this.drawTable(game);
      this.drawHoles(game);
      this.drawGroupLinks(game);
      this.drawCaps(game);
      FC.Sprites.drawEffects(this.ctx, this);
      this.drawAim(game);
      this.drawWind(game);
    },
    drawTable: function (game) {
      var ctx = this.ctx;
      var img = FC.Sprites.image("table:" + game.stage.id);
      var tableTop = this.worldToScreen(0, 0);
      var w = game.stage.width * this.scale;
      var h = game.stage.length * this.scale;
      if (img) {
        ctx.drawImage(img, tableTop.x, tableTop.y, w, h);
      } else {
        ctx.fillStyle = "#806440";
        ctx.fillRect(tableTop.x, tableTop.y, w, h);
      }
      var target = this.worldToScreen(0, game.stage.targetY);
      var start = this.worldToScreen(0, game.startY);
      var inset = CONFIG.physics.boardInsetRatio;
      var minX = game.stage.width * inset * this.scale;
      var maxX = game.stage.width * (1 - inset) * this.scale;
      var minY = this.worldToScreen(0, game.stage.length * inset).y;
      var maxY = this.worldToScreen(0, game.stage.length * (1 - inset)).y;
      ctx.save();
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = "rgba(16, 34, 43, 0.36)";
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = "rgba(255, 253, 248, 0.88)";
      ctx.beginPath();
      ctx.moveTo(minX, target.y);
      ctx.lineTo(maxX, target.y);
      ctx.stroke();
      ctx.strokeStyle = "rgba(16, 34, 43, 0.72)";
      ctx.beginPath();
      ctx.moveTo(minX, start.y);
      ctx.lineTo(maxX, start.y);
      ctx.stroke();
      ctx.restore();
    },
    drawHoles: function (game) {
      var ctx = this.ctx;
      var holeImg = FC.Sprites.image("hole");
      game.stage.holes.forEach(function (hole) {
        var pos = Renderer.worldToScreen(hole.x, hole.y);
        var size = hole.r * 2.4 * Renderer.scale;
        if (holeImg) {
          ctx.drawImage(holeImg, pos.x - size / 2, pos.y - size / 2, size, size);
        } else {
          ctx.fillStyle = "#12181d";
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, hole.r * Renderer.scale, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    },
    drawGroupLinks: function (game) {
      var groups = {};
      game.caps.forEach(function (cap) {
        if (cap.active && cap.groupId) {
          groups[cap.groupId] = groups[cap.groupId] || [];
          groups[cap.groupId].push(cap);
        }
      });
      var ctx = this.ctx;
      Object.keys(groups).forEach(function (id) {
        var members = groups[id];
        if (members.length < 2) return;
        ctx.save();
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.strokeStyle = "rgba(141, 97, 199, 0.42)";
        ctx.beginPath();
        members.forEach(function (cap, index) {
          var pos = Renderer.worldToScreen(cap.x, cap.y);
          if (index === 0) ctx.moveTo(pos.x, pos.y);
          else ctx.lineTo(pos.x, pos.y);
        });
        ctx.stroke();
        ctx.restore();
      });
    },
    drawCaps: function (game) {
      var ctx = this.ctx;
      game.caps.forEach(function (cap) {
        if (!cap.active) return;
        var type = CONFIG.capTypes[cap.type];
        var img = FC.Sprites.image("cap:" + cap.type);
        var pos = Renderer.worldToScreen(cap.x, cap.y);
        var r = cap.radius * Renderer.scale;
        ctx.save();
        ctx.shadowColor = "rgba(16, 34, 43, 0.28)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 5;
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y + r * 0.22, r * 0.82, r * 0.34, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fill();
        ctx.shadowBlur = 0;
        if (img) {
          ctx.drawImage(img, pos.x - r, pos.y - r, r * 2, r * 2);
        } else {
          ctx.fillStyle = type.color;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#10222b";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = "800 " + Math.max(10, r * 0.55) + "px system-ui";
          ctx.fillText(type.shortName, pos.x, pos.y);
        }
        ctx.lineWidth = Math.max(3, r * 0.14);
        ctx.strokeStyle = cap.owner === CONFIG.owners.PLAYER ? "#0f8f8f" : "#e85d4f";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r + 2, 0, Math.PI * 2);
        ctx.stroke();
        if (cap.fixed) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
          ctx.fillRect(pos.x - r * 0.48, pos.y - 3, r * 0.96, 6);
        }
        ctx.restore();
      });
    },
    drawAim: function (game) {
      var aim = game.aim;
      if (!aim || !aim.active || !game.currentCap || !(FC.state.data && FC.state.data.settings.aimAssist)) return;
      var ctx = this.ctx;
      var start = this.worldToScreen(aim.start.x, aim.start.y);
      var current = this.worldToScreen(aim.current.x, aim.current.y);
      var capPos = this.worldToScreen(game.currentCap.x, game.currentCap.y);
      var dx = start.x - current.x;
      var dy = start.y - current.y;
      var len = Math.hypot(dx, dy);
      if (len < 1) return;
      var nx = dx / len;
      var ny = dy / len;
      var arrowLen = Math.min(120, len);
      ctx.save();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(255, 253, 248, 0.92)";
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(current.x, current.y);
      ctx.stroke();
      ctx.strokeStyle = "#f2bf3d";
      ctx.fillStyle = "#f2bf3d";
      ctx.beginPath();
      ctx.moveTo(capPos.x, capPos.y);
      ctx.lineTo(capPos.x + nx * arrowLen, capPos.y + ny * arrowLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(capPos.x + nx * arrowLen, capPos.y + ny * arrowLen);
      ctx.lineTo(capPos.x + nx * (arrowLen - 16) - ny * 8, capPos.y + ny * (arrowLen - 16) + nx * 8);
      ctx.lineTo(capPos.x + nx * (arrowLen - 16) + ny * 8, capPos.y + ny * (arrowLen - 16) - nx * 8);
      ctx.closePath();
      ctx.fill();
      var power = Math.min(1, aim.distance / CONFIG.physics.maxDragDistance);
      ctx.fillStyle = "rgba(16, 34, 43, 0.78)";
      ctx.fillRect(capPos.x - 58, capPos.y + 42, 116, 10);
      ctx.fillStyle = "#0f8f8f";
      ctx.fillRect(capPos.x - 58, capPos.y + 42, 116 * power, 10);
      ctx.restore();
    },
    drawWind: function (game) {
      var wind = FC.Physics.windVector(game.stage, game.elapsed);
      if (!wind.x && !wind.y) return;
      var ctx = this.ctx;
      var x = 28;
      var y = 128;
      var len = Math.min(54, Math.hypot(wind.x, wind.y) * 1.2);
      var n = Math.hypot(wind.x, wind.y) || 1;
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = "rgba(255, 253, 248, 0.88)";
      ctx.fillStyle = "rgba(255, 253, 248, 0.88)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(wind.x / n * len, wind.y / n * len);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(wind.x / n * len, wind.y / n * len, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  FC.Renderer = Renderer;
})();
