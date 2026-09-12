(function () {
  "use strict";

  var FC = window.FC;
  var CONFIG = FC.CONFIG;
  var bgm = {};
  var sfx = {};
  var lastPlayed = {};
  var unlocked = false;
  var currentBgm = null;

  function createAudio(path, loop) {
    var audio = new Audio(path);
    audio.preload = "auto";
    audio.loop = Boolean(loop);
    return audio;
  }

  function settings() {
    return FC.state.data ? FC.state.data.settings : FC.Storage.defaultData().settings;
  }

  function refreshVolumes() {
    var set = settings();
    Object.keys(bgm).forEach(function (key) {
      bgm[key].volume = set.muted ? 0 : set.bgmVolume;
    });
    Object.keys(sfx).forEach(function (key) {
      sfx[key].volume = set.muted ? 0 : set.sfxVolume;
    });
  }

  function safePlay(audio) {
    if (!audio) return;
    var promise = audio.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(function () {});
    }
  }

  function stopAudio(audio) {
    if (!audio) return;
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch (error) {}
  }

  FC.Audio = {
    init: function () {
      Object.keys(CONFIG.audio.bgm).forEach(function (key) {
        bgm[key] = createAudio(CONFIG.audio.bgm[key], true);
      });
      Object.keys(CONFIG.audio.sfx).forEach(function (key) {
        sfx[key] = createAudio(CONFIG.audio.sfx[key], false);
      });
      refreshVolumes();
    },
    unlock: function () {
      if (unlocked) return;
      unlocked = true;
      Object.keys(sfx).slice(0, 1).forEach(function (key) {
        sfx[key].muted = true;
        safePlay(sfx[key]);
        sfx[key].pause();
        sfx[key].currentTime = 0;
        sfx[key].muted = false;
      });
      if (currentBgm) safePlay(currentBgm);
    },
    refresh: refreshVolumes,
    playBgm: function (key) {
      refreshVolumes();
      var next = bgm[key];
      if (!next) return;
      if (currentBgm === next) {
        if (unlocked && currentBgm.paused) safePlay(currentBgm);
        return;
      }
      stopAudio(currentBgm);
      currentBgm = next;
      currentBgm.loop = true;
      try {
        currentBgm.currentTime = 0;
      } catch (error) {}
      if (unlocked) safePlay(currentBgm);
    },
    stopBgm: function () {
      stopAudio(currentBgm);
      currentBgm = null;
    },
    playSfx: function (key) {
      var audio = sfx[key];
      if (!audio) return;
      var now = performance.now();
      if (lastPlayed[key] && now - lastPlayed[key] < 80) return;
      lastPlayed[key] = now;
      refreshVolumes();
      audio.loop = false;
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch (error) {}
      safePlay(audio);
    },
    vibrate: function (pattern) {
      var set = settings();
      if (set.vibrate && navigator.vibrate) navigator.vibrate(pattern || 25);
    }
  };
})();
