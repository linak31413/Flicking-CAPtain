(function () {
  "use strict";

  var FC = window.FC;
  var CONFIG = FC.CONFIG;

  function defaultData() {
    var reduced = false;
    if (window.matchMedia) {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return {
      version: 1,
      coins: 0,
      unlockedStage: 1,
      wins: Array(8).fill(0),
      cleared: Array(8).fill(false),
      caps: { plastic: 3, metal: 0, paper: 0, sticky: 0, ice: 0 },
      slots: ["plastic", "plastic", "plastic"],
      settings: {
        bgmVolume: 0.7,
        sfxVolume: 0.8,
        muted: false,
        vibrate: true,
        aimAssist: true,
        reduceMotion: reduced
      }
    };
  }

  function clampInt(value, min, max, fallback) {
    var next = Number(value);
    if (!Number.isFinite(next)) return fallback;
    return Math.max(min, Math.min(max, Math.floor(next)));
  }

  function clampNumber(value, min, max, fallback) {
    var next = Number(value);
    if (!Number.isFinite(next)) return fallback;
    return Math.max(min, Math.min(max, next));
  }

  function normalizeSlots(slots, caps) {
    var counts = {};
    var next = [];
    CONFIG.capOrder.forEach(function (type) {
      counts[type] = 0;
    });
    (Array.isArray(slots) ? slots : []).forEach(function (type) {
      if (CONFIG.capTypes[type] && counts[type] < caps[type] && next.length < 3) {
        next.push(type);
        counts[type] += 1;
      }
    });
    while (next.length < 3) {
      next.push("plastic");
    }
    return next.slice(0, 3);
  }

  function validate(raw) {
    var base = defaultData();
    var data = raw && typeof raw === "object" ? raw : {};
    var caps = {};
    CONFIG.capOrder.forEach(function (type) {
      var max = type === "plastic" ? 3 : 3;
      var fallback = type === "plastic" ? 3 : 0;
      caps[type] = clampInt(data.caps && data.caps[type], 0, max, fallback);
    });
    caps.plastic = 3;

    return {
      version: 1,
      coins: clampInt(data.coins, 0, 9999, base.coins),
      unlockedStage: clampInt(data.unlockedStage, 1, 8, base.unlockedStage),
      wins: Array.from({ length: 8 }, function (_, index) {
        return clampInt(data.wins && data.wins[index], 0, 9999, 0);
      }),
      cleared: Array.from({ length: 8 }, function (_, index) {
        return Boolean(data.cleared && data.cleared[index]);
      }),
      caps: caps,
      slots: normalizeSlots(data.slots, caps),
      settings: {
        bgmVolume: clampNumber(data.settings && data.settings.bgmVolume, 0, 1, base.settings.bgmVolume),
        sfxVolume: clampNumber(data.settings && data.settings.sfxVolume, 0, 1, base.settings.sfxVolume),
        muted: Boolean(data.settings && data.settings.muted),
        vibrate: data.settings && typeof data.settings.vibrate === "boolean" ? data.settings.vibrate : base.settings.vibrate,
        aimAssist: data.settings && typeof data.settings.aimAssist === "boolean" ? data.settings.aimAssist : base.settings.aimAssist,
        reduceMotion: data.settings && typeof data.settings.reduceMotion === "boolean" ? data.settings.reduceMotion : base.settings.reduceMotion
      }
    };
  }

  FC.Storage = {
    defaultData: defaultData,
    load: function () {
      try {
        var raw = window.localStorage.getItem(CONFIG.storageKey);
        if (!raw) return defaultData();
        return validate(JSON.parse(raw));
      } catch (error) {
        return defaultData();
      }
    },
    save: function (data) {
      try {
        window.localStorage.setItem(CONFIG.storageKey, JSON.stringify(validate(data)));
        return true;
      } catch (error) {
        return false;
      }
    },
    reset: function () {
      var data = defaultData();
      try {
        window.localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
      } catch (error) {
        return data;
      }
      return data;
    },
    validate: validate
  };
})();
