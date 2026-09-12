(function () {
  "use strict";

  var FC = window.FC;
  var CONFIG = FC.CONFIG;

  function loadImage(key, path, progress) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        FC.state.assets.images[key] = img;
        progress();
        resolve(img);
      };
      img.onerror = function () {
        progress();
        resolve(null);
      };
      img.src = path;
    });
  }

  function allImageEntries() {
    var entries = [];
    Object.keys(CONFIG.capTypes).forEach(function (type) {
      entries.push(["cap:" + type, CONFIG.capTypes[type].image]);
    });
    FC.STAGES.forEach(function (stage) {
      entries.push(["table:" + stage.id, stage.tableImage]);
    });
    ["logo", "hole", "coin", "windIndicator", "resultWin", "resultLose", "uiIcons"].forEach(function (key) {
      entries.push([key, CONFIG.images[key]]);
    });
    Object.keys(CONFIG.images.sheets).forEach(function (key) {
      entries.push(["sheet:" + key, CONFIG.images.sheets[key].path]);
    });
    return entries;
  }

  function getSheetFrame(effect) {
    var def = CONFIG.images.sheets[effect.kind];
    var img = FC.state.assets.images["sheet:" + effect.kind];
    if (!def || !img || !img.width || !img.height) return null;
    return {
      img: img,
      sx: Math.floor(effect.frame) * (img.width / def.cols),
      sy: 0,
      sw: img.width / def.cols,
      sh: img.height / def.rows,
      loop: def.loop,
      fps: def.fps,
      cols: def.cols
    };
  }

  FC.Sprites = {
    effects: [],
    loadAll: function (onProgress) {
      var entries = allImageEntries();
      var done = 0;
      function progress() {
        done += 1;
        if (onProgress) onProgress(done, entries.length);
      }
      return Promise.all(entries.map(function (entry) {
        return loadImage(entry[0], entry[1], progress);
      })).then(function () {
        FC.state.assets.loaded = true;
      });
    },
    image: function (key) {
      return FC.state.assets.images[key] || null;
    },
    addEffect: function (kind, x, y, size) {
      if (this.effects.length >= CONFIG.physics.maxEffects) this.effects.shift();
      this.effects.push({ kind: kind, x: x, y: y, size: size || 72, frame: 0, time: 0, done: false });
    },
    addFadeCap: function (cap) {
      if (this.effects.length >= CONFIG.physics.maxEffects) this.effects.shift();
      this.effects.push({
        kind: "fade",
        x: cap.x,
        y: cap.y,
        radius: cap.radius,
        type: cap.type,
        owner: cap.owner,
        time: 0,
        duration: 0.42,
        done: false
      });
    },
    update: function (dt, paused) {
      if (paused) return;
      this.effects.forEach(function (effect) {
        if (effect.kind === "fade") {
          effect.time += dt;
          effect.done = effect.time >= effect.duration;
          return;
        }
        var frame = getSheetFrame(effect);
        if (!frame) {
          effect.done = true;
          return;
        }
        effect.time += dt;
        effect.frame = Math.floor(effect.time * frame.fps);
        if (effect.frame >= frame.cols) {
          if (frame.loop) {
            effect.frame = effect.frame % frame.cols;
          } else {
            effect.done = true;
          }
        }
      });
      this.effects = this.effects.filter(function (effect) {
        return !effect.done;
      });
    },
    drawEffects: function (ctx, renderer) {
      this.effects.forEach(function (effect) {
        if (effect.kind === "fade") {
          var progress = Math.min(1, effect.time / effect.duration);
          var pos = renderer.worldToScreen(effect.x, effect.y);
          var r = effect.radius * renderer.scale * (1 + progress * 0.16);
          var img = FC.Sprites.image("cap:" + effect.type);
          var type = CONFIG.capTypes[effect.type];
          ctx.save();
          ctx.globalAlpha = 1 - progress;
          ctx.translate(0, -10 * progress);
          if (img) {
            ctx.drawImage(img, pos.x - r, pos.y - r, r * 2, r * 2);
          } else {
            ctx.fillStyle = type ? type.color : "#0f8f8f";
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.lineWidth = Math.max(3, r * 0.14);
          ctx.strokeStyle = effect.owner === CONFIG.owners.PLAYER ? "#0f8f8f" : "#e85d4f";
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r + 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          return;
        }
        var frame = getSheetFrame(effect);
        if (!frame) return;
        var pos = renderer.worldToScreen(effect.x, effect.y);
        var width = effect.size * renderer.scale;
        var height = width * frame.sh / frame.sw;
        ctx.drawImage(frame.img, frame.sx, frame.sy, frame.sw, frame.sh, pos.x - width / 2, pos.y - height / 2, width, height);
      });
    }
  };
})();
