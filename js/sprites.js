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
    update: function (dt, paused) {
      if (paused) return;
      this.effects.forEach(function (effect) {
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
        var frame = getSheetFrame(effect);
        if (!frame) return;
        var pos = renderer.worldToScreen(effect.x, effect.y);
        var size = effect.size * renderer.scale;
        ctx.drawImage(frame.img, frame.sx, frame.sy, frame.sw, frame.sh, pos.x - size / 2, pos.y - size / 2, size, size);
      });
    }
  };
})();
